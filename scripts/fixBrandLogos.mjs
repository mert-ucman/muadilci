/**
 * Firestore'daki orijinal markaların logolarını Clearbit'ten çeker,
 * işler (500×500 beyaz bg) ve Storage + Firestore'u günceller.
 * Sadece placeholder içeren veya logoImage boş olan markaları işler.
 *
 * Kullanım: node scripts/fixBrandLogos.mjs
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

const DOMAIN_MAP = {
  'Abdul Samad Al Qurashi': 'abdulsamadqurashi.com',
  'Abercrombie & Fitch':    'abercrombie.com',
  'Acqua Di Parma':         'acquadiparma.com',
  'Adidas':                 'adidas.com',
  'Adolfo Dominquez':       'adolfodominguez.com',
  'Aedes De Venustas':      'aedesdevenustas.com',
  'Ajmal':                  'ajmalperfume.com',
  'Alexander McQueen':      'alexandermcqueen.com',
  'Alexandre J.':           'alexandrej.com',
  'Alfred Dunhill':         'dunhill.com',
  'Amouage':                'amouage.com',
  'Antonio Banderas':       'antoniobanderas.com',
  'Atelier Des Ors':        'atelierdesors.com',
  'Atkinsons':              'atkinsons1799.com',
  'Avon':                   'avon.com',
  'Azzaro':                 'azzaro.com',
  'BDK Parfums':            'bdkparfums.com',
  'Balenciaga':             'balenciaga.com',
  'Balmain':                'balmain.com',
  'Bentley':                'bentleymotors.com',
  'Boadicea The Victorious':'boadiceavictorious.com',
  'Bond No. 9':             'bondno9.com',
  'Bottega Veneta':         'bottegaveneta.com',
  'Boucheron':              'boucheron.com',
  'Bourjois':               'bourjois.com',
  'Burberry':               'burberry.com',
  'Bvlgari':                'bulgari.com',
  'By Kilian':              'bykilian.com',
  'Byredo':                 'byredo.com',
  'Cacharel':               'cacharel.com',
  'Caldion':                'caldion.com.tr',
  'Calvin Klein':           'calvinklein.com',
  'Carolina Herrera':       'carolinaherrera.com',
  'Celine':                 'celine.com',
  'Chanel':                 'chanel.com',
  'Chopard':                'chopard.com',
  'Clinique':               'clinique.com',
  'Clive Christian':        'clivechristian.com',
  'Costume National':       'costumenational.com',
  'Coty':                   'coty.com',
  'Creed':                  'creedperfume.com',
  'Davidoff':               'davidoff.com',
  'Diesel':                 'diesel.com',
  'Dior':                   'dior.com',
  'Diptyque':               'diptyqueparis.com',
  'Dolce & Gabbana':        'dolcegabbana.com',
  'Dunlop':                 'dunlop-sport.com',
  'Escentric Molecules':    'escentric.com',
  'Essential Parfums':      'essentialparfums.com',
  'Ex Nihilo':              'exnihiloparis.com',
  'Faberge':                'faberge.com',
  'Frédéric Malle':         'fredericmalle.com',
  'Giorgio Armani':         'armani.com',
  'Gisada':                 'gisada.com',
  'Givenchy':               'givenchy.com',
  'Goldfield & Banks':      'goldfieldandbanks.com.au',
  'Gucci':                  'gucci.com',
  'Guerlain':               'guerlain.com',
  'Hermès':                 'hermes.com',
  'Hugo Boss':              'hugoboss.com',
  'Initio Parfums Privés':  'initio-parfums.com',
  'Issey Miyake':           'isseymiyake.com',
  'Jean Paul Gaultier':     'jeanpaulgaultier.com',
  'Jil Sander':             'jilsander.com',
  'Jimmy Choo':             'jimmychoo.com',
  'Jo Malone London':       'jomalone.com',
  'Joop':                   'joop.com',
  'Juliette Has A Gun':     'juliettehasagun.com',
  'Kayali':                 'kayali.com',
  'Kenzo':                  'kenzo.com',
  "L'Artisan Parfumeur":    'lartisanparfumeur.com',
  'Lacoste':                'lacoste.com',
  'Lalique':                'lalique.com',
  'Lancôme':                'lancome.com',
  'Le Labo':                'lelabofragrances.com',
  'Loewe':                  'loewe.com',
  'Lorenzo Pazzaglia':      'lorenzopazzaglia.com',
  'Louis Vuitton':          'louisvuitton.com',
  'Maison Crivelli':        'maisoncrivelli.com',
  'Maison Francis Kurkdjian':'maisonfrancisurkdjian.com',
  'Maison Margiela':        'maisonmargiela.com',
  'Mancera':                'manceraparfums.com',
  'Marc-Antoine Barrois':   'marc-antoinebarrois.com',
  'Matière Première':       'matierepremierefrances.com',
  'Memo Paris':             'memoparis.com',
  'Michael Kors':           'michaelkors.com',
  'Montblanc':              'montblanc.com',
  'Moschino':               'moschino.com',
  'Naomi Campbell':         'naomicampbell.com',
  'Narciso Rodriguez':      'narcisorodriguez.com',
  'Nasomatto':              'nasomatto.com',
  'Nautica':                'nautica.com',
  'Nikos':                  'nikos.fr',
  'Nishane':                'nishane.com.tr',
  'Oriflame':               'oriflame.com',
  'Ormonde Jayne':          'ormondejayne.com',
  'Orto Parisi':            'ortoparisi.com',
  'Paco Rabanne':           'pacorabanne.com',
  'Parfums De Marly':       'parfumsdemarly.com',
  "Penhaligon's":           'penhaligons.com',
  'Prada':                  'prada.com',
  'Puma':                   'puma.com',
  'Ralph Lauren':           'ralphlauren.com',
  'Roberto Cavalli':        'robertocavalli.com',
  'Roja Parfums':           'rojaparfums.com',
  'Rosendo Mateu':          'rosendomateu.com',
  'Sisley':                 'sisley.com',
  'Slazenger':              'slazenger.com',
  'Sospiro':                'sospiro.it',
  'Stéphane Humbert Lucas 777':'shl777.com',
  'Swiss':                  'swissarabian.com',
  'Tauer Perfumes':         'tauerperfumes.com',
  'Thameen':                'thameen.com',
  'The Merchant Of Venice': 'themerchantofvenice.com',
  'Thierry Mugler':         'mugler.com',
  'Tiziana Terenzi':        'tizianaternzi.it',
  'Tom Ford':               'tomford.com',
  'Tommy Hilfiger':         'tommy.com',
  'Toskovat':               'toskovat.com',
  "Unique'e Luxury":        'uniqueeluxury.com',
  'Vakko':                  'vakko.com',
  'Valentino':              'valentino.com',
  'Versace':                'versace.com',
  "Victoria's Secret":      'victoriassecret.com',
  'Viktor & Rolf':          'viktor-rolf.com',
  'Xerjoff':                'xerjoff.com',
  'Yves Rocher':            'yves-rocher.com',
  'Yves Saint Laurent':     'ysl.com',
  'Zadig & Voltaire':       'zadig-et-voltaire.com',
  'Zara':                   'zara.com',
  'Zarkoperfume':           'zarkoperfume.com',
  'Zoologist':              'zoologistperfumes.com',
  'Éclat':                  'eclat-parfum.com',
};

async function fetchLogo(domain) {
  // Birden fazla kaynak dene: Google favicon (256px) → 128px fallback
  const urls = [
    `https://www.google.com/s2/favicons?domain=${domain}&sz=256`,
    `https://www.google.com/s2/favicons?domain=${domain}&sz=128`,
  ];
  for (const url of urls) {
    try {
      const res = await fetch(url, {
        signal: AbortSignal.timeout(10000),
        headers: { 'User-Agent': 'Mozilla/5.0' },
      });
      if (!res.ok) continue;
      const ct  = res.headers.get('content-type') || '';
      if (!ct.startsWith('image/')) continue;
      const buf = Buffer.from(await res.arrayBuffer());
      if (buf.length < 500) continue; // 16px placeholder'ları atla
      // Boyut kontrolü — 32x32 veya daha küçük ise atla
      try {
        const meta = await sharp(buf).metadata();
        if ((meta.width || 0) < 48) continue;
      } catch { continue; }
      return buf;
    } catch {}
  }
  return null;
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
  await file.save(buf, {
    metadata: { contentType:'image/png', metadata:{ firebaseStorageDownloadTokens: token } },
  });
  return `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(path)}?alt=media&token=${token}`;
}

// ── Ana akış ─────────────────────────────────────────────────────────────────
const snap   = await db.collection('brands').where('type','==','original').get();
const brands = snap.docs.map(d => ({ ref: d.ref, ...d.data() }));
console.log(`\nFirestore: ${brands.length} orijinal marka.\n`);

let updated = 0;
let failed  = 0;
let noLogo  = 0;

for (const brand of brands) {
  const domain = DOMAIN_MAP[brand.name];
  if (!domain) { noLogo++; continue; }

  // Sadece Storage URL'si olmayan veya placeholder olanları işle
  // (placeholder URL'leri de yenile – hepsini güncelle)
  const rawBuf = await fetchLogo(domain);
  if (!rawBuf) {
    console.log(`  ⚠ Logo yok: ${brand.name} (${domain})`);
    noLogo++;
    continue;
  }

  let processedBuf;
  try {
    processedBuf = await processLogo(rawBuf);
  } catch (err) {
    console.log(`  ✗ İşleme hatası: ${brand.name} – ${err.message}`);
    failed++;
    continue;
  }

  // Lokal kaydet
  const slug     = brand.slug || slugify(brand.name);
  const dir      = join(BRANDS_DIR, slug);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'logo.png'), processedBuf);

  // Storage güncelle
  let logoUrl;
  try {
    logoUrl = await uploadToStorage(processedBuf, `brands/${slug}.png`);
  } catch (err) {
    console.log(`  ✗ Storage hatası: ${brand.name} – ${err.message}`);
    failed++;
    continue;
  }

  // Firestore güncelle
  await brand.ref.update({ logoImage: logoUrl });
  updated++;
  console.log(`  ✓ [${updated}] ${brand.name}`);
}

console.log(`\n──────────────────────────────────────────────────`);
console.log(`✅ ${updated} logo güncellendi`);
console.log(`   ${noLogo} için domain tanımlanmamış`);
console.log(`   ${failed} hata`);
process.exit(0);
