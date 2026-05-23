import { createRequire } from 'module';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import admin from 'firebase-admin';

const require = createRequire(import.meta.url);
const XLSX = require('../node_modules/xlsx/xlsx.js');

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const serviceAccount = JSON.parse(
  readFileSync('C:/Users/win10/OneDrive/Desktop/muadilci-890e4-firebase-adminsdk-fbsvc-b145eb6842.json', 'utf8')
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

function slugify(text) {
  return String(text)
    .toLowerCase()
    .trim()
    .replace(/[çÇ]/g, 'c')
    .replace(/[ğĞ]/g, 'g')
    .replace(/[ıİ]/g, 'i')
    .replace(/[öÖ]/g, 'o')
    .replace(/[şŞ]/g, 's')
    .replace(/[üÜ]/g, 'u')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

function logoAbbr(name) {
  const words = String(name).trim().split(/\s+/);
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

const wb = XLSX.readFile('C:/Users/win10/OneDrive/Desktop/ORJINAL MARKALAR.xlsx');
const ws = wb.Sheets[wb.SheetNames[0]];
const rows = XLSX.utils.sheet_to_json(ws);

console.log(`Toplam ${rows.length} marka yüklenecek...\n`);

let success = 0;
let failed = 0;

for (const row of rows) {
  const name = String(row['Marka'] || '').trim();
  if (!name) continue;

  try {
    const ref = db.collection('brands').doc();
    await ref.set({
      id: ref.id,
      name,
      slug: slugify(name),
      logo: logoAbbr(name),
      logoImage: '',
      type: 'original',
      origin: String(row['Köken'] || '').trim(),
      founded: Number(row['Kuruluş Yılı']) || 2000,
      category: String(row['Kategori'] || 'Designer').trim(),
      bio: String(row['Açıklama'] || '').trim(),
      active: true,
      likes: 0,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    success++;
    console.log(`✓ [${success}/${rows.length}] ${name}`);
  } catch (err) {
    failed++;
    console.error(`✗ Hata - ${name}:`, err.message);
  }
}

console.log(`\n✓ Tamamlandı: ${success} başarılı${failed > 0 ? `, ${failed} başarısız` : ''}.`);
process.exit(0);
