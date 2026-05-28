/**
 * Firestore'daki orijinal markaların origin alanını Türkçe'ye günceller.
 * Kullanım: node scripts/updateOriginsTurkish.mjs
 */

import { readFileSync } from 'fs';
import admin from 'firebase-admin';

const SA_PATH = 'C:/Users/MERT/Downloads/muadilci-890e4-firebase-adminsdk-fbsvc-6a59406b7c.json';
const sa = JSON.parse(readFileSync(SA_PATH, 'utf8'));
admin.initializeApp({
  credential: admin.credential.cert(sa),
  storageBucket: `${sa.project_id}.firebasestorage.app`,
});
const db = admin.firestore();

const ORIGIN_TR = {
  'Saudi Arabia':              'Suudi Arabistan',
  'USA':                       'Amerika',
  'Italy':                     'İtalya',
  'Germany':                   'Almanya',
  'Spain':                     'İspanya',
  'UAE':                       'Birleşik Arap Emirlikleri',
  'UK':                        'İngiltere',
  'France':                    'Fransa',
  'Oman':                      'Umman',
  'Turkey':                    'Türkiye',
  'Switzerland':               'İsviçre',
  'Sweden':                    'İsveç',
  'Japan':                     'Japonya',
  'Belgium':                   'Belçika',
  'Netherlands':               'Hollanda',
  'Russia':                    'Rusya',
  'Australia':                 'Avustralya',
  'Denmark':                   'Danimarka',
  'Canada':                    'Kanada',
};

const snap = await db.collection('brands').where('type', '==', 'original').get();
console.log(`\nFirestore: ${snap.size} orijinal marka taranıyor...\n`);

let updated = 0;
let skipped = 0;

const batch = db.batch();
for (const doc of snap.docs) {
  const { origin } = doc.data();
  const tr = ORIGIN_TR[origin];
  if (tr) {
    batch.update(doc.ref, { origin: tr });
    console.log(`  ✓ ${doc.data().name}: "${origin}" → "${tr}"`);
    updated++;
  } else {
    skipped++;
  }
}

await batch.commit();
console.log(`\n✅ ${updated} marka güncellendi, ${skipped} marka atlandı (zaten Türkçe veya tanımsız).`);
process.exit(0);
