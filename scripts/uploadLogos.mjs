import { readFileSync, readdirSync } from 'fs';
import { join, basename } from 'path';
import admin from 'firebase-admin';

const serviceAccount = JSON.parse(
  readFileSync('C:/Users/win10/OneDrive/Desktop/muadilci-890e4-firebase-adminsdk-fbsvc-b145eb6842.json', 'utf8')
);
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

const LOGOS_DIR = 'C:/Users/win10/OneDrive/Desktop/brands-square/original-brands';

function normalize(str) {
  return str.toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')  // aksan kaldır
    .replace(/[''`']/g, '')
    .replace(/[^a-z0-9]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Manuel override: firestore ismi -> dosya ismi (normalize edilmiş)
const OVERRIDES = {
  'giorgio armani': 'georgio armani',
  'bond no 9': 'bond no9',
  'bdk parfums': 'bdk parfumes',
  'roja parfums': 'roja dove',
};

// Tüm logo dosyalarını yükle: normalize(isim) -> filePath
const logoMap = new Map();
for (const file of readdirSync(LOGOS_DIR)) {
  if (!file.endsWith('.png')) continue;
  const name = basename(file, '.png');
  logoMap.set(normalize(name), join(LOGOS_DIR, file));
}

// Firestore'dan tüm orijinal markaları çek
const snapshot = await db.collection('brands').where('type', '==', 'original').get();
console.log(`${snapshot.size} orijinal marka bulundu.\n`);

let success = 0;
let notFound = 0;

for (const docSnap of snapshot.docs) {
  const brand = docSnap.data();
  const key = normalize(brand.name);

  // Override kontrolü
  const overrideKey = OVERRIDES[key];
  let filePath = logoMap.get(overrideKey || key);

  // Bulunamazsa kısmi eşleşme dene
  if (!filePath) {
    for (const [k, v] of logoMap.entries()) {
      if (k.includes(key) || key.includes(k)) {
        filePath = v;
        break;
      }
    }
  }

  if (!filePath) {
    console.log(`⚠ Logo bulunamadı: "${brand.name}" (key: "${key}")`);
    notFound++;
    continue;
  }

  const buf = readFileSync(filePath);
  const base64 = buf.toString('base64');
  const dataUrl = `data:image/png;base64,${base64}`;

  await docSnap.ref.update({ logoImage: dataUrl });
  success++;
  console.log(`✓ [${success}] ${brand.name}`);
}

console.log(`\n✓ Tamamlandı: ${success} güncellendi${notFound > 0 ? `, ${notFound} eşleşme bulunamadı` : ''}.`);
process.exit(0);
