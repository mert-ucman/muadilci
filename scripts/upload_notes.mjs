/**
 * upload_notes.mjs
 * TR CODEX VER_GUNCELLENDI.xlsx'teki notaları + yılları Firebase'e yükler.
 * - Tüm parfümlerin notalarını günceller (üzerine yazar).
 * - Yıl bilgisi varsa `year` alanını da günceller.
 */

import { readFileSync, writeFileSync } from 'fs';
import { read, utils } from 'xlsx';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const EXCEL_PATH = 'C:\\Users\\MERT\\Desktop\\TR CODEX VER_GUNCELLENDI.xlsx';
const SA_PATH    = 'scripts/serviceAccount.json';

const sa = JSON.parse(readFileSync(SA_PATH, 'utf8'));
initializeApp({ credential: cert(sa) });
const db = getFirestore();

function slugify(s) {
  return String(s || '')
    .toLowerCase()
    .replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's')
    .replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ç/g, 'c')
    .replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

function norm(s) {
  return String(s || '')
    .toLowerCase()
    .replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's')
    .replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ç/g, 'c')
    .replace(/[^a-z0-9]/g, '');
}

function toArr(str) {
  if (!str || typeof str !== 'string' || str.trim() === '') return [];
  return str.split(',').map(s => s.trim()).filter(Boolean);
}

function parseYear(val) {
  if (!val || String(val).trim() === '' || String(val) === 'nan') return null;
  const n = parseInt(String(val));
  return (n > 1900 && n < 2100) ? n : null;
}

// --- Excel oku ---
console.log('Excel okunuyor...');
const wb = read(readFileSync(EXCEL_PATH));
const rows = utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { defval: '' });
console.log(`${rows.length} satır yüklendi.`);

// Map: key → { notes, year }
const bySlug = new Map();
const byNorm = new Map();
const byName = new Map();

for (const row of rows) {
  const brand = String(row['Marka'] || '').trim();
  const name  = String(row['Parfüm Adı'] || '').trim();
  if (!brand || !name) continue;

  const entry = {
    notes: {
      top:   toArr(String(row['Üst Notalar']  || '')),
      heart: toArr(String(row['Orta Notalar'] || '')),
      base:  toArr(String(row['Alt Notalar']  || '')),
    },
    year: parseYear(row['Çıkış Yılı']),
  };

  bySlug.set(slugify(brand) + '|||' + slugify(name), entry);
  byNorm.set(norm(brand) + '|||' + norm(name), entry);
  if (!byName.has(norm(name))) byName.set(norm(name), entry);
}
console.log(`Excel map: ${bySlug.size} parfüm`);

// --- Firestore ---
console.log("Firestore'dan parfümler çekiliyor...");
const snap = await db.collection('perfumes').get();
console.log(`Firestore'da ${snap.size} parfüm bulundu.`);

let updated = 0, yearUpdated = 0, notFound = 0;
const unmatched = [];
const BATCH_SIZE = 400;
let batch = db.batch();
let batchCount = 0;

async function flushBatch() {
  if (batchCount === 0) return;
  await batch.commit();
  console.log(`  ${batchCount} belge gönderildi`);
  batch = db.batch();
  batchCount = 0;
}

for (const docSnap of snap.docs) {
  const data = docSnap.data();

  let entry = bySlug.get(String(data.brandSlug || '') + '|||' + String(data.slug || ''));
  if (!entry) entry = byNorm.get(norm(data.brand || '') + '|||' + norm(data.name || ''));
  if (!entry) entry = byName.get(norm(data.name || ''));

  if (!entry) {
    notFound++;
    unmatched.push({ id: docSnap.id, brand: data.brand, name: data.name });
    continue;
  }

  const update = { notes: entry.notes };

  // Yıl: Firestore'da yoksa veya Excel'de varsa güncelle
  if (entry.year && !data.year) {
    update.year = entry.year;
    yearUpdated++;
  }

  batch.update(docSnap.ref, update);
  batchCount++;
  updated++;

  if (batchCount >= BATCH_SIZE) await flushBatch();
}

await flushBatch();

writeFileSync('scripts/unmatched_notes.json', JSON.stringify(unmatched, null, 2), 'utf8');

console.log('\n--- Sonuç ---');
console.log(`Notalar güncellenen:    ${updated}`);
console.log(`Yıl eklenen:            ${yearUpdated}`);
console.log(`Eşleşemeyen:            ${notFound}`);
process.exit(0);
