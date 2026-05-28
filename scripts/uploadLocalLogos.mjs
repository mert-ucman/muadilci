/**
 * Masaüstündeki brands/original-brands/[slug]/ klasörlerinde
 * logo.png DIŞINDA bir görsel dosyası bulunan markalar için:
 * - jpg/jpeg/png → 500×500 beyaz bg ile işler, Storage'a yükler, Firestore günceller
 * - webp ve diğer formatlar → atlanır, sonda rapor edilir
 *
 * Kullanım: node scripts/uploadLocalLogos.mjs
 */

import { readFileSync, writeFileSync, existsSync, readdirSync } from 'fs';
import { join, extname } from 'path';
import { randomUUID } from 'crypto';
import admin from 'firebase-admin';
import sharp from 'sharp';

const SA_PATH    = 'C:/Users/MERT/Downloads/muadilci-890e4-firebase-adminsdk-fbsvc-6a59406b7c.json';
const BRANDS_DIR = 'C:/Users/MERT/Desktop/brands/original-brands';
const SIZE    = 500;
const PADDING = 50;

const sa = JSON.parse(readFileSync(SA_PATH, 'utf8'));
admin.initializeApp({
  credential:    admin.credential.cert(sa),
  storageBucket: `${sa.project_id}.firebasestorage.app`,
});
const db     = admin.firestore();
const bucket = admin.storage().bucket();

const ALLOWED = new Set(['.jpg', '.jpeg', '.png', '.webp']);

// logo.png dışındaki görsel dosyalarını bulur (önce izin verilen format, sonra diğerleri)
function findRawFile(dir) {
  if (!existsSync(dir)) return null;
  const all = readdirSync(dir).filter(f => {
    const ext = extname(f).toLowerCase();
    return ['.jpg', '.jpeg', '.png', '.webp', '.avif', '.svg'].includes(ext)
      && f.toLowerCase() !== 'logo.png';   // işlenmiş dosyayı atla
  });
  if (!all.length) return null;
  // jpg/png önce, webp sonra
  all.sort((a, b) => {
    const ea = extname(a).toLowerCase(), eb = extname(b).toLowerCase();
    const rankA = ALLOWED.has(ea) ? 0 : 1;
    const rankB = ALLOWED.has(eb) ? 0 : 1;
    return rankA - rankB;
  });
  return all[0];
}

async function processLogo(buf) {
  const inner = SIZE - PADDING * 2;
  return await sharp(buf)
    .resize(inner, inner, { fit: 'contain', background: { r:255,g:255,b:255,alpha:1 } })
    .flatten({ background: { r:255,g:255,b:255 } })
    .extend({ top:PADDING, bottom:PADDING, left:PADDING, right:PADDING,
              background:{ r:255,g:255,b:255 } })
    .png({ quality: 95 })
    .toBuffer();
}

async function uploadToStorage(buf, storagePath) {
  const token = randomUUID();
  const file  = bucket.file(storagePath);
  await file.save(buf, {
    metadata: { contentType: 'image/png', metadata: { firebaseStorageDownloadTokens: token } },
  });
  return `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(storagePath)}?alt=media&token=${token}`;
}

// ── Firestore marka haritası ──────────────────────────────────────────────────
const snap = await db.collection('brands').where('type', '==', 'original').get();
const brandMap = new Map(snap.docs.map(d => [d.data().slug, { ref: d.ref, ...d.data() }]));
console.log(`\nFirestore: ${snap.size} orijinal marka\n`);

// ── Masaüstündeki klasörleri tara ─────────────────────────────────────────────
const slugDirs = readdirSync(BRANDS_DIR).filter(d =>
  existsSync(join(BRANDS_DIR, d)) && readdirSync(join(BRANDS_DIR, d)).length > 0
);

let uploaded = 0;
let skippedFormat = 0;
let noMatch = 0;
let errors = 0;
const otherFormatBrands = [];

for (const slug of slugDirs) {
  const dir  = join(BRANDS_DIR, slug);
  const file = findRawFile(dir);
  if (!file) continue;  // sadece logo.png var, zaten işlenmiş

  const ext = extname(file).toLowerCase();

  // Firestore'da bu slug'a sahip marka var mı?
  const brand = brandMap.get(slug);
  if (!brand) {
    console.log(`  — [?]     slug bulunamadı Firestore'da: ${slug}`);
    noMatch++;
    continue;
  }

  if (!ALLOWED.has(ext)) {
    console.log(`  — [ATLA]  ${brand.name} → ${file} (${ext})`);
    otherFormatBrands.push({ name: brand.name, slug, file, ext,
                             path: join(dir, file) });
    skippedFormat++;
    continue;
  }

  process.stdout.write(`  [${uploaded + 1}] ${brand.name} (${file})... `);
  try {
    const raw  = readFileSync(join(dir, file));
    const proc = await processLogo(raw);

    // Lokal logo.png olarak kaydet
    writeFileSync(join(dir, 'logo.png'), proc);

    // Storage'a yükle
    const logoUrl = await uploadToStorage(proc, `brands/${slug}.png`);

    // Firestore güncelle
    await brand.ref.update({ logoImage: logoUrl });
    uploaded++;
    console.log('✓');
  } catch (e) {
    console.log(`✗ ${e.message}`);
    errors++;
  }
}

console.log(`\n${'─'.repeat(60)}`);
console.log(`✅ ${uploaded} logo yüklendi`);
if (noMatch)  console.log(`   ${noMatch} klasör Firestore'da eşleşmedi`);
if (errors)   console.log(`   ${errors} hata`);

if (otherFormatBrands.length) {
  console.log(`\n⚠️  Desteklenmeyen format — manuel convert gerekli (${otherFormatBrands.length} dosya):`);
  otherFormatBrands.forEach(b => {
    console.log(`   • ${b.name.padEnd(35)} ${b.ext.padEnd(8)} ${b.path}`);
  });
}

process.exit(0);
