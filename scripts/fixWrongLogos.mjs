/**
 * Yanlış ya da alakasız Wikimedia sonucu alan markaların logolarını
 * doğru URL'lerden indirir veya temiz placeholder üretir.
 *
 * Kullanım: node scripts/fixWrongLogos.mjs
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
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

function slugify(t) {
  return String(t).toLowerCase().trim()
    .replace(/[çÇ]/g,'c').replace(/[ğĞ]/g,'g').replace(/[ıİ]/g,'i')
    .replace(/[öÖ]/g,'o').replace(/[şŞ]/g,'s').replace(/[üÜ]/g,'u')
    .replace(/é|è|ê|ë/gi,'e').replace(/à|â/gi,'a').replace(/î|ï/gi,'i')
    .replace(/ô/gi,'o').replace(/ù|û/gi,'u')
    .replace(/[^a-z0-9 -]/g,'').replace(/\s+/g,'-').replace(/-+/g,'-')
    .replace(/^-|-$/g,'');
}

function abbr(name) {
  const w = String(name).trim().split(/\s+/).filter(s => /[a-zA-Z0-9]/.test(s));
  return w.length === 1 ? w[0].slice(0,2).toUpperCase() : (w[0][0]+w[1][0]).toUpperCase();
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ── Doğru logo URL haritası ────────────────────────────────────────────────
// Özellikle yanlış sonuç alan veya bulunamayan markalar için
const LOGO_URLS = {
  // Kesin doğru Wikimedia URLs
  'Adidas':           'https://upload.wikimedia.org/wikipedia/commons/2/20/Adidas_Logo.svg',
  'Alfred Dunhill':   'https://upload.wikimedia.org/wikipedia/commons/e/eb/Dunhill_logo.svg',
  'Boucheron':        'https://upload.wikimedia.org/wikipedia/commons/0/06/Logo_of_Boucheron.svg',
  'Lacoste':          'https://upload.wikimedia.org/wikipedia/commons/8/84/Logo_da_Lacoste.png',
  'Zara':             'https://upload.wikimedia.org/wikipedia/commons/f/fd/Zara_Logo.svg',
  'Bentley':          'https://upload.wikimedia.org/wikipedia/commons/thumb/1/15/Bentley-cars-logo.png/500px-Bentley-cars-logo.png',
  'Nautica':          'https://images.seeklogo.com/logo-png/9/1/nautica-logo-png_seeklogo-97565.png',
  'Joop':             'https://images.seeklogo.com/logo-png/7/1/joop-logo-png_seeklogo-76021.png',
  'Narciso Rodriguez':'https://images.seeklogo.com/logo-png/62/1/narciso-rodriguez-logo-png_seeklogo-625199.png',
  'By Kilian':        'https://images.seeklogo.com/logo-png/29/1/kilian-perfume-logo-png_seeklogo-290765.png',
  'Le Labo':          'https://images.seeklogo.com/logo-png/31/1/le-labo-logo-png_seeklogo-316974.png',
  'Antonio Banderas': 'https://images.seeklogo.com/logo-png/19/1/antonio-banderas-logo-png_seeklogo-199524.png',
  'Tommy Hilfiger':   'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9d/Tommy_Hilfiger_logo.svg/500px-Tommy_Hilfiger_logo.svg.png',
  'Diesel':           'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a1/Diesel_logo.svg/500px-Diesel_logo.svg.png',
  'Loewe':            'https://upload.wikimedia.org/wikipedia/commons/thumb/2/23/Loewe-logo.svg/500px-Loewe-logo.svg.png',
};

// Placeholder üretilecek markalar (doğru logo bulunamadı veya mevcut logo yanlış)
const PLACEHOLDER_BRANDS = [
  'Abdul Samad Al Qurashi',
  'Adolfo Dominquez',
  'Aedes De Venustas',
  'Ajmal',
  'Alexandre J.',
  'Atelier Des Ors',
  'Atkinsons',
  'Boadicea The Victorious',
  'Caldion',
  'Costume National',
  'Escentric Molecules',
  'Gisada',
  'Goldfield & Banks',
  'Kayali',
  "L'Artisan Parfumeur",
  'Memo Paris',
  'Naomi Campbell',
  'Rosendo Mateu',
  'Swiss',
  'Tauer Perfumes',
  'The Merchant Of Venice',
  "Unique'e Luxury",
  'Zarkoperfume',
  'Éclat',
];

async function downloadImage(url) {
  await sleep(600);
  const res = await fetch(url, {
    signal: AbortSignal.timeout(15000),
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; muadilci-logo/1.0)' },
    redirect: 'follow',
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length < 500) throw new Error('Dosya çok küçük');
  const meta = await sharp(buf).metadata();
  if ((meta.width || 0) < 50) throw new Error(`Çözünürlük düşük: ${meta.width}x${meta.height}`);
  return buf;
}

async function makePlaceholder(name) {
  const text = abbr(name).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  const svg = `<svg width="${SIZE}" height="${SIZE}" xmlns="http://www.w3.org/2000/svg">
    <rect width="${SIZE}" height="${SIZE}" fill="white"/>
    <text x="50%" y="52%" font-family="Arial,sans-serif" font-size="160" font-weight="bold"
      fill="#cccccc" text-anchor="middle" dominant-baseline="middle">${text}</text>
  </svg>`;
  return await sharp(Buffer.from(svg)).png().toBuffer();
}

async function processLogo(buf) {
  const inner = SIZE - PADDING * 2;
  return await sharp(buf)
    .resize(inner, inner, { fit: 'contain', background: { r:255,g:255,b:255,alpha:1 } })
    .flatten({ background: { r:255,g:255,b:255 } })
    .extend({ top:PADDING, bottom:PADDING, left:PADDING, right:PADDING, background:{r:255,g:255,b:255} })
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

async function updateBrand(brandName, processedBuf) {
  const slug = slugify(brandName);
  const dir  = join(BRANDS_DIR, slug);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'logo.png'), processedBuf);

  const logoUrl = await uploadToStorage(processedBuf, `brands/${slug}.png`);

  const snap = await db.collection('brands')
    .where('type', '==', 'original')
    .where('slug', '==', slug)
    .limit(1)
    .get();
  if (!snap.empty) await snap.docs[0].ref.update({ logoImage: logoUrl });
  return logoUrl;
}

// ── Çalıştır ─────────────────────────────────────────────────────────────────
console.log('\n=== Doğru logo URL\'leri işleniyor ===\n');
let urlOk = 0;

for (const [brand, url] of Object.entries(LOGO_URLS)) {
  process.stdout.write(`  [${++urlOk}] ${brand}... `);
  try {
    const raw       = await downloadImage(url);
    const processed = await processLogo(raw);
    await updateBrand(brand, processed);
    console.log('✓');
  } catch (e) {
    console.log(`✗ ${e.message}`);
  }
}

console.log('\n=== Placeholder üretiliyor ===\n');
let phOk = 0;
for (const brand of PLACEHOLDER_BRANDS) {
  process.stdout.write(`  [${++phOk}] ${brand}... `);
  try {
    const raw       = await makePlaceholder(brand);
    const processed = await processLogo(raw);
    await updateBrand(brand, processed);
    console.log('✓ (placeholder)');
  } catch (e) {
    console.log(`✗ ${e.message}`);
  }
}

console.log(`\n✅ Tamamlandı: ${urlOk} gerçek logo + ${phOk} placeholder güncellendi.`);
process.exit(0);
