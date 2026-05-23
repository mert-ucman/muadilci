/**
 * Firestore'da base64 (data:) olarak saklanan görselleri Firebase Storage'a taşır
 * ve belgelerde yalnızca indirme URL'sini bırakır.
 *
 * Kapsam:
 *   brands.logoImage            → brands/
 *   perfumes.images[].src + image → perfumes/
 *   muadils.images[].src + image  → perfumes/
 *   sliderImages.src            → slider/
 *   users.photoURL              → users/<uid>/
 *
 * Veri kaybı olmaz; yalnızca data: ile başlayan alanlar taşınır, diğerleri atlanır.
 * Kullanım: node scripts/migrate-images-to-storage.mjs
 */
import { readFileSync } from 'fs';
import { randomUUID } from 'crypto';
import admin from 'firebase-admin';

const sa = JSON.parse(readFileSync('C:/Users/win10/Downloads/muadilci-890e4-firebase-adminsdk-fbsvc-b145eb6842.json', 'utf8'));
admin.initializeApp({ credential: admin.credential.cert(sa), storageBucket: `${sa.project_id}.firebasestorage.app` });

const db = admin.firestore();
const bucket = admin.storage().bucket();

const isData = (s) => typeof s === 'string' && s.startsWith('data:');
const rand = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);

// data URL → Storage, Firebase tarzı indirme URL'si döner (client deleteImageByUrl ile uyumlu)
async function uploadDataURL(dataURL, folder) {
  const m = dataURL.match(/^data:(image\/[a-z0-9.+-]+);base64,(.*)$/i);
  if (!m) return null;
  const mime = m[1];
  const ext = mime.split('/')[1].replace('jpeg', 'jpg').replace('svg+xml', 'svg');
  const buffer = Buffer.from(m[2], 'base64');
  const path = `${folder}/${rand()}.${ext}`;
  const token = randomUUID();
  const file = bucket.file(path);
  await file.save(buffer, { metadata: { contentType: mime, metadata: { firebaseStorageDownloadTokens: token } } });
  return `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(path)}?alt=media&token=${token}`;
}

let migrated = 0;

async function processCollection(name, folder) {
  const snap = await db.collection(name).get();
  for (const d of snap.docs) {
    const data = d.data();
    const update = {};

    // images[].src
    if (Array.isArray(data.images)) {
      let changed = false;
      const newImages = [];
      for (const im of data.images) {
        if (im && isData(im.src)) {
          const url = await uploadDataURL(im.src, folder);
          newImages.push({ ...im, src: url });
          changed = true; migrated++;
        } else {
          newImages.push(im);
        }
      }
      if (changed) {
        update.images = newImages;
        const primary = newImages.find((x) => x && x.src)?.src;
        if (primary && (isData(data.image) || !data.image || data.image === 'floral')) update.image = primary;
      }
    }

    // image (tek alan, images yoksa)
    if (!update.image && isData(data.image)) {
      update.image = await uploadDataURL(data.image, folder); migrated++;
    }

    // logoImage
    if (isData(data.logoImage)) {
      update.logoImage = await uploadDataURL(data.logoImage, folder); migrated++;
    }

    // src (slider)
    if (isData(data.src)) {
      update.src = await uploadDataURL(data.src, folder); migrated++;
    }

    // photoURL (users)
    if (isData(data.photoURL)) {
      update.photoURL = await uploadDataURL(data.photoURL, `users/${d.id}`); migrated++;
    }

    if (Object.keys(update).length) {
      await d.ref.update(update);
      console.log(`✓ ${name}/${d.id} güncellendi: ${Object.keys(update).join(', ')}`);
    }
  }
}

console.log('Görsel taşıma başlıyor…\n');
await processCollection('brands', 'brands');
await processCollection('perfumes', 'perfumes');
await processCollection('muadils', 'perfumes');
await processCollection('sliderImages', 'slider');
await processCollection('users', 'users'); // photoURL içinde uid bazlı klasör kullanılır
console.log(`\n✅ Tamamlandı. ${migrated} görsel Storage'a taşındı.`);
process.exit(0);
