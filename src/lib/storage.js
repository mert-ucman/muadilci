import { ref, uploadString, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from './firebase';

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
  await uploadString(r, dataURL, 'data_url');
  return await getDownloadURL(r);
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
