import { ref, uploadString, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage, auth } from './firebase';

const isRemoteUrl = (s) => typeof s === 'string' && (/^https?:\/\//.test(s) || s.startsWith('gs://'));

const rand = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);

/**
 * Bir data URL'yi (base64) Firebase Storage'a yükler ve indirme URL'sini döner.
 * Zaten uzak bir URL verilirse (yeniden kaydetme durumunda) olduğu gibi döner.
 * @param {string} dataURL  "data:image/...;base64,..." veya hazır https URL
 * @param {string} folder   Storage klasörü (örn. 'slider', 'perfumes', 'brands', 'users/<uid>')
 * @returns {Promise<string>} indirme URL'si
 */
export async function uploadDataURL(dataURL, folder) {
  if (!dataURL) return dataURL;
  if (isRemoteUrl(dataURL)) return dataURL; // zaten Storage'da
  const mime = (dataURL.match(/^data:(image\/[a-z0-9.+-]+);/i) || [])[1] || 'image/jpeg';
  const ext = mime.split('/')[1].replace('jpeg', 'jpg').replace('svg+xml', 'svg');
  const path = `${folder}/${rand()}.${ext}`;
  const r = ref(storage, path);
  await uploadString(r, dataURL, 'data_url', { contentType: mime, cacheControl: 'public, max-age=31536000' });
  return await getDownloadURL(r);
}

/**
 * Firebase Storage download URL'inden dosya path'ini çıkarır.
 * Örn: "https://firebasestorage.googleapis.com/v0/b/.../o/brands%2Fabc.jpg?..." → "brands/abc.jpg"
 */
function pathFromUrl(url) {
  try {
    const match = url.match(/\/o\/(.+?)(\?|$)/);
    return match ? decodeURIComponent(match[1]) : null;
  } catch {
    return null;
  }
}

/**
 * Verilen URL listesindeki Firebase Storage dosyalarının Cache-Control metadata'sını günceller.
 * Firebase SDK yerine direkt fetch() kullanır — SDK'nın retry/backoff mantığı devre dışı kalır,
 * arka plan sekmesinde de takılmaz. Tüm istekler paralel atılır, tek bir AbortController
 * tüm istekleri 10 saniye sonra iptal eder.
 * @param {string[]} urls
 * @returns {Promise<number>} güncellenen dosya sayısı
 */
export async function fixCacheHeaders(urls) {
  if (!auth.currentUser) return 0;
  let idToken;
  try { idToken = await auth.currentUser.getIdToken(); } catch { return 0; }

  const bucket = storage.app.options.storageBucket;
  const CACHE  = 'public, max-age=31536000';
  const storageUrls = urls.filter((u) => u && u.includes('firebasestorage'));

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10_000);

  const results = await Promise.allSettled(
    storageUrls.map(async (url) => {
      const path = pathFromUrl(url);
      if (!path) return false;
      const encoded = path.split('/').map(encodeURIComponent).join('%2F');
      const res = await fetch(
        `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/${encoded}`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${idToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ cacheControl: CACHE }),
          signal: controller.signal,
        },
      );
      return res.ok;
    }),
  );

  clearTimeout(timer);
  return results.filter((r) => r.status === 'fulfilled' && r.value === true).length;
}

/**
 * Marka logosunu benzersiz path'e yükler ve token'sız public URL döner.
 * brands/** için allow read: if true olduğundan token gerekmez.
 * Dosya adına rastgele son ek eklenir: (1) yeni marka eklerken slug henüz boş
 * olabilir — sabit ad kullanılırsa tüm markalar brands/.webp'de çakışırdı;
 * (2) sabit ad + 1 yıllık immutable cache, logoyu değiştirince tarayıcının
 * eski görseli göstermesine yol açardı. Benzersiz ad ikisini de önler.
 */
export async function uploadBrandLogo(dataURL, slug) {
  if (!dataURL) return dataURL;
  if (isRemoteUrl(dataURL)) return dataURL;
  const base = (slug || '').trim().replace(/[^a-z0-9-]/gi, '') || 'brand';
  const path = `brands/${base}-${rand()}.webp`;
  const r = ref(storage, path);
  await uploadString(r, dataURL, 'data_url', { contentType: 'image/webp', cacheControl: 'public, max-age=31536000' });
  const bucket = storage.app.options.storageBucket;
  const encoded = path.split('/').map(encodeURIComponent).join('%2F');
  return `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/${encoded}?alt=media`;
}

/**
 * Bir Storage indirme URL'sine karşılık gelen dosyayı siler.
 * base64/boş/harici URL ise sessizce yok sayılır. Hata fırlatmaz (best-effort).
 */
export async function deleteImageByUrl(url) {
  if (!isRemoteUrl(url) || !url.includes('firebasestorage')) return;
  try {
    await deleteObject(ref(storage, url));
  } catch {
    /* dosya yok veya silinemedi — yok say */
  }
}
