/**
 * set-cors.mjs
 * Firebase Storage bucket'ına CORS politikası yazar.
 * Mevcut origin'leri korur, localhost dev origin'lerini ekler.
 * Kullanım:  node scripts/set-cors.mjs           (mevcut + localhost yazar)
 *            node scripts/set-cors.mjs --read     (sadece mevcut config'i gösterir)
 */

import { readFileSync } from 'fs';
import { initializeApp, cert } from 'firebase-admin/app';
import { getStorage } from 'firebase-admin/storage';

const SA_PATH = 'scripts/serviceAccount.json';
const BUCKET = 'muadilci-890e4.firebasestorage.app';

const sa = JSON.parse(readFileSync(SA_PATH, 'utf8'));
initializeApp({ credential: cert(sa), storageBucket: BUCKET });

const bucket = getStorage().bucket();

const LOCAL_ORIGINS = [
  // Prod
  'https://muadilci.com',
  'https://www.muadilci.com',
  // Firebase Hosting varsayılan domain'leri
  'https://muadilci-890e4.web.app',
  'https://muadilci-890e4.firebaseapp.com',
  // Lokal geliştirme
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:4173', // vite preview
  'http://127.0.0.1:5173',
];

async function main() {
  const [meta] = await bucket.getMetadata();
  const current = meta.cors || [];
  console.log('--- MEVCUT CORS ---');
  console.log(JSON.stringify(current, null, 2));

  if (process.argv.includes('--read')) return;

  // Mevcut origin'leri topla
  const existingOrigins = new Set();
  for (const rule of current) {
    for (const o of rule.origin || []) existingOrigins.add(o);
  }
  for (const o of LOCAL_ORIGINS) existingOrigins.add(o);

  const newCors = [
    {
      origin: [...existingOrigins],
      method: ['GET', 'HEAD'],
      responseHeader: ['Content-Type', 'Content-Length', 'Cache-Control'],
      maxAgeSeconds: 3600,
    },
  ];

  await bucket.setCorsConfiguration(newCors);
  console.log('\n--- YENI CORS YAZILDI ---');
  console.log(JSON.stringify(newCors, null, 2));
}

main().then(() => process.exit(0)).catch((e) => {
  console.error('HATA:', e.message);
  process.exit(1);
});
