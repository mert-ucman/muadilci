/**
 * 67 yeni markanın logoları için Wikimedia Commons'ta arama yapar,
 * 500×500 beyaz arka plan + ortalanmış logo olarak işler,
 * yerel klasöre kaydeder, Storage'a yükler ve Firestore'u günceller.
 *
 * Kullanım: node scripts/updateBrandLogos.mjs
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { randomUUID } from 'crypto';
import admin from 'firebase-admin';
import sharp from 'sharp';

const SA_PATH    = 'C:/Users/MERT/Downloads/muadilci-890e4-firebase-adminsdk-fbsvc-6a59406b7c.json';
const BRANDS_DIR = 'C:/Users/MERT/Desktop/brands/original-brands';
const SIZE       = 500;
const PADDING    = 50;
const DELAY_MS   = 1200; // Wikimedia rate limit için bekleme

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

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// Manuel override: bazı markalarda arama terimi farklı çalışıyor
const SEARCH_OVERRIDES = {
  'Abdul Samad Al Qurashi': 'Abdul Samad Al Qurashi perfume',
  'Adolfo Dominquez':       'Adolfo Dominguez fashion brand',
  'By Kilian':              'Kilian Paris perfume',
  'Frédéric Malle':        'Frederic Malle perfume',
  "L'Artisan Parfumeur":   'Artisan Parfumeur perfume brand',
  'Stéphane Humbert Lucas 777': 'Stephane Humbert Lucas perfume',
  'Swiss':                  'Swiss Arabian perfume',
  "Unique'e Luxury":        'Uniquee Luxury perfume',
  'Boadicea The Victorious':'Boadicea Victorious perfume',
  'Éclat':                  'Eclat Arpege Lanvin perfume',
};

// Manuel logo URL haritası — Wikimedia araması yetersiz kalan markalar için
const MANUAL_URLS = {
  'Caldion':          'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e1/Balenciaga-logo.jpg/500px-Balenciaga-logo.jpg',
};

async function searchWikimediaLogo(brandName) {
  const query = SEARCH_OVERRIDES[brandName] || `${brandName} logo`;
  await sleep(DELAY_MS);
  try {
    const searchUrl = `https://commons.wikimedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&srnamespace=6&srlimit=8&format=json&origin=*`;
    const res  = await fetch(searchUrl, {
      headers: { 'User-Agent': 'muadilci-logo-fetcher/1.0 (rati.be98@gmail.com)' },
      signal:  AbortSignal.timeout(10000),
    });
    const data = await res.json();
    const results = data?.query?.search || [];
    if (!results.length) return null;

    // Logo içeren dosyaları önceliklendir: svg > png > jpg
    const logoResults = results.filter(r =>
      r.title.toLowerCase().includes('logo') ||
      r.title.toLowerCase().includes(brandName.toLowerCase().split(' ')[0])
    );
    const picked = logoResults[0] || results[0];
    const title  = picked.title;

    await sleep(500);
    const infoUrl = `https://commons.wikimedia.org/w/api.php?action=query&titles=${encodeURIComponent(title)}&prop=imageinfo&iiprop=url|mime|size&iiurlwidth=600&format=json&origin=*`;
    const infoRes  = await fetch(infoUrl, {
      headers: { 'User-Agent': 'muadilci-logo-fetcher/1.0 (rati.be98@gmail.com)' },
      signal:  AbortSignal.timeout(10000),
    });
    const infoData = await infoRes.json();
    const pages = infoData?.query?.pages || {};
    const page  = Object.values(pages)[0];
    const info  = page?.imageinfo?.[0];
    if (!info) return null;

    const url = info.thumburl || info.url;
    return { title, url, mime: info.mime };
  } catch (e) {
    console.log(`    Wikimedia hata: ${e.message}`);
    return null;
  }
}

async function downloadImage(url) {
  await sleep(300);
  const res = await fetch(url, {
    headers: { 'User-Agent': 'muadilci-logo-fetcher/1.0 (rati.be98@gmail.com)' },
    signal:  AbortSignal.timeout(15000),
    redirect: 'follow',
  });
  if (!res.ok) return null;
  return Buffer.from(await res.arrayBuffer());
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

async function uploadToStorage(buf, path) {
  const token = randomUUID();
  const file  = bucket.file(path);
  // Mevcut dosyanın üzerine yaz
  await file.save(buf, {
    metadata: { contentType:'image/png', metadata:{ firebaseStorageDownloadTokens: token } },
  });
  return `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(path)}?alt=media&token=${token}`;
}

// ── Hedef markalar: sadece yeni eklenenler ────────────────────────────────────
const NEW_BRANDS = [
  'Abdul Samad Al Qurashi','Abercrombie & Fitch','Adidas','Adolfo Dominquez',
  'Aedes De Venustas','Ajmal','Alexander McQueen','Alexandre J.','Alfred Dunhill',
  'Antonio Banderas','Atelier Des Ors','Atkinsons','Balenciaga','Balmain','Bentley',
  'Boadicea The Victorious','Bottega Veneta','Boucheron','Bourjois','By Kilian',
  'Cacharel','Caldion','Celine','Chopard','Clinique','Costume National','Coty',
  'Davidoff','Diesel','Dunlop','Escentric Molecules','Faberge','Gisada',
  'Goldfield & Banks','Jil Sander','Jimmy Choo','Joop','Kayali',
  "L'Artisan Parfumeur",'Lacoste','Le Labo','Loewe','Memo Paris','Michael Kors',
  'Moschino','Naomi Campbell','Narciso Rodriguez','Nautica','Nikos','Oriflame',
  'Puma','Roberto Cavalli','Rosendo Mateu','Sisley','Slazenger','Swiss',
  'Tauer Perfumes','Thameen','The Merchant Of Venice','Tommy Hilfiger',
  "Unique'e Luxury",'Victoria\'s Secret','Yves Rocher','Zadig & Voltaire','Zara',
  'Zarkoperfume','Éclat',
];

// Firestore'dan bu markaların belgelerini bul
const snap = await db.collection('brands').where('type','==','original').get();
const brandMap = new Map(snap.docs.map(d => [d.data().name, { ref: d.ref, ...d.data() }]));

console.log(`\nFirestore: ${snap.size} marka | İşlenecek: ${NEW_BRANDS.length} yeni marka\n`);

let updated = 0;
let notFound = 0;
let errors = 0;
const skipped = [];

for (const brandName of NEW_BRANDS) {
  const brand = brandMap.get(brandName);
  if (!brand) {
    console.log(`⚠ Firestore'da bulunamadı: ${brandName}`);
    notFound++;
    continue;
  }

  console.log(`\n[${NEW_BRANDS.indexOf(brandName)+1}/${NEW_BRANDS.length}] ${brandName}`);
  const slug = brand.slug || slugify(brandName);

  // Wikimedia Commons araması
  const wikiResult = await searchWikimediaLogo(brandName);
  if (!wikiResult) {
    console.log(`  ✗ Wikimedia'da bulunamadı`);
    skipped.push(brandName);
    continue;
  }
  console.log(`  → ${wikiResult.title}`);

  // İndir
  let rawBuf;
  try {
    rawBuf = await downloadImage(wikiResult.url);
  } catch (e) {
    console.log(`  ✗ İndirme hatası: ${e.message}`);
    errors++;
    continue;
  }
  if (!rawBuf || rawBuf.length < 1000) {
    console.log(`  ✗ Görsel çok küçük veya boş`);
    skipped.push(brandName);
    continue;
  }

  // Sharp ile boyut kontrol
  let meta;
  try { meta = await sharp(rawBuf).metadata(); } catch { meta = {}; }
  if ((meta.width||999) < 50 || (meta.height||999) < 50) {
    console.log(`  ✗ Çözünürlük çok düşük: ${meta.width}x${meta.height}`);
    skipped.push(brandName);
    continue;
  }

  // 500×500 işle
  let processedBuf;
  try {
    processedBuf = await processLogo(rawBuf);
  } catch (e) {
    console.log(`  ✗ İşleme hatası: ${e.message}`);
    errors++;
    continue;
  }

  // Lokal kaydet
  const dir = join(BRANDS_DIR, slug);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'logo.png'), processedBuf);
  console.log(`  ✓ Lokal: ${join(dir,'logo.png')}`);

  // Storage yükle
  let logoUrl;
  try {
    logoUrl = await uploadToStorage(processedBuf, `brands/${slug}.png`);
    console.log(`  ✓ Storage güncellendi`);
  } catch (e) {
    console.log(`  ✗ Storage hatası: ${e.message}`);
    errors++;
    continue;
  }

  // Firestore güncelle
  await brand.ref.update({ logoImage: logoUrl });
  updated++;
  console.log(`  ✓ Firestore güncellendi`);
}

console.log(`\n${'─'.repeat(50)}`);
console.log(`✅ ${updated}/${NEW_BRANDS.length} logo güncellendi`);
if (skipped.length) {
  console.log(`\n⚠ Wikimedia'da logo bulunamayan markalar (manuel yükleme gerekli):`);
  skipped.forEach(b => console.log(`   - ${b}`));
}
if (errors) console.log(`\n✗ ${errors} hata`);
process.exit(0);
