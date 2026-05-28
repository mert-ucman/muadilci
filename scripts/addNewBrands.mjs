/**
 * Excel'deki 133 orijinal markayı Firebase'e ekler.
 * - Firestore'da zaten var olanları atlar
 * - Yeni markalar için:
 *   1. brands/original-brands/[slug]/ klasörü açar
 *   2. Clearbit Logo API → işler → 500×500 beyaz arka plan + ortalı logo
 *   3. Firebase Storage'a yükler
 *   4. Firestore'a kaydeder (tüm alanlar dolu)
 *
 * Kullanım: node scripts/addNewBrands.mjs
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from 'fs';
import { join, extname } from 'path';
import { createRequire } from 'module';
import { randomUUID } from 'crypto';
import admin from 'firebase-admin';
import sharp from 'sharp';

const require = createRequire(import.meta.url);
const XLSX = require('../node_modules/xlsx/xlsx.js');

const SA_PATH    = 'C:/Users/MERT/Downloads/muadilci-890e4-firebase-adminsdk-fbsvc-6a59406b7c.json';
const EXCEL_PATH = 'C:/Users/MERT/Desktop/MARKA LİSTESİ.xlsx';
const BRANDS_DIR = 'C:/Users/MERT/Desktop/brands/original-brands';

const SIZE    = 500;
const PADDING = 50; // iç logo alanı: 400×400

// ── Firebase ────────────────────────────────────────────────────────────────
const sa = JSON.parse(readFileSync(SA_PATH, 'utf8'));
admin.initializeApp({
  credential:    admin.credential.cert(sa),
  storageBucket: `${sa.project_id}.firebasestorage.app`,
});
const db     = admin.firestore();
const bucket = admin.storage().bucket();

// ── Yardımcı fonksiyonlar ────────────────────────────────────────────────────
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

function norm(s) {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'')
    .replace(/[^a-z0-9]/g,' ').replace(/\s+/g,' ').trim();
}

const SUPPORTED = ['.png','.jpg','.jpeg','.webp','.avif'];

function findLocalImage(dir) {
  if (!existsSync(dir)) return null;
  const files = readdirSync(dir);
  const order = ['.png','.jpg','.jpeg','.webp','.avif'];
  return files
    .filter(f => SUPPORTED.includes(extname(f).toLowerCase()))
    .sort((a,b) => order.indexOf(extname(a).toLowerCase()) - order.indexOf(extname(b).toLowerCase()))[0] || null;
}

async function fetchClearbit(domain) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch(`https://logo.clearbit.com/${domain}?size=${SIZE}`, {
      signal: controller.signal,
      headers: { 'User-Agent': 'Mozilla/5.0' },
    });
    clearTimeout(timer);
    if (res.ok) {
      const ct = res.headers.get('content-type') || '';
      // SVG desteği Windows'ta sınırlı, sadece raster formatları al
      if (ct.includes('png') || ct.includes('jpeg') || ct.includes('jpg') || ct.includes('webp')) {
        return Buffer.from(await res.arrayBuffer());
      }
    }
  } catch {}
  clearTimeout(timer);
  return null;
}

async function makePlaceholder(name) {
  const text = abbr(name).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  const svg = `<svg width="${SIZE}" height="${SIZE}" xmlns="http://www.w3.org/2000/svg">
    <rect width="${SIZE}" height="${SIZE}" fill="white"/>
    <text x="50%" y="52%" font-family="Arial,sans-serif" font-size="160" font-weight="bold"
      fill="#aaaaaa" text-anchor="middle" dominant-baseline="middle">${text}</text>
  </svg>`;
  return await sharp(Buffer.from(svg)).png().toBuffer();
}

async function processLogo(inputBuf) {
  const inner = SIZE - PADDING * 2;
  return await sharp(inputBuf)
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

// ── Marka meta verisi ────────────────────────────────────────────────────────
const BRAND_META = {
  'Abdul Samad Al Qurashi': { origin:'Suudi Arabistan',              founded:1852, category:'Niche',    website:'https://abdulsamadqurashi.com' },
  'Abercrombie & Fitch':    { origin:'Amerika',                      founded:1892, category:'Designer', website:'https://abercrombie.com' },
  'Acqua Di Parma':         { origin:'İtalya',                       founded:1916, category:'Niche',    website:'https://acquadiparma.com' },
  'Adidas':                 { origin:'Almanya',                      founded:1949, category:'Designer', website:'https://adidas.com' },
  'Adolfo Dominquez':       { origin:'İspanya',                      founded:1973, category:'Designer', website:'https://adolfodominguez.com' },
  'Aedes De Venustas':      { origin:'Amerika',                      founded:1995, category:'Niche',    website:'https://aedesdevenustas.com' },
  'Ajmal':                  { origin:'Birleşik Arap Emirlikleri',    founded:1951, category:'Niche',    website:'https://ajmalperfume.com' },
  'Alexander McQueen':      { origin:'İngiltere',                    founded:1992, category:'Designer', website:'https://alexandermcqueen.com' },
  'Alexandre J.':           { origin:'Fransa',                       founded:2003, category:'Niche',    website:'https://alexandrej.com' },
  'Alfred Dunhill':         { origin:'İngiltere',                    founded:1893, category:'Designer', website:'https://dunhill.com' },
  'Amouage':                { origin:'Umman',                        founded:1983, category:'Niche',    website:'https://amouage.com' },
  'Antonio Banderas':       { origin:'İspanya',                      founded:1997, category:'Designer', website:'https://antoniobanderas.com' },
  'Atelier Des Ors':        { origin:'Fransa',                       founded:2015, category:'Niche',    website:'https://atelierdesors.com' },
  'Atkinsons':              { origin:'İngiltere',                    founded:1799, category:'Niche',    website:'https://atkinsons1799.com' },
  'Avon':                   { origin:'Amerika',                      founded:1886, category:'Designer', website:'https://avon.com' },
  'Azzaro':                 { origin:'Fransa',                       founded:1967, category:'Designer', website:'https://azzaro.com' },
  'BDK Parfums':            { origin:'Fransa',                       founded:2016, category:'Niche',    website:'https://bdkparfums.com' },
  'Balenciaga':             { origin:'Fransa',                       founded:1919, category:'Designer', website:'https://balenciaga.com' },
  'Balmain':                { origin:'Fransa',                       founded:1945, category:'Designer', website:'https://balmain.com' },
  'Bentley':                { origin:'İngiltere',                    founded:1919, category:'Designer', website:'https://bentleymotors.com' },
  'Boadicea The Victorious':{ origin:'İngiltere',                    founded:2008, category:'Niche',    website:'https://boadiceavictorious.com' },
  'Bond No. 9':             { origin:'Amerika',                      founded:2003, category:'Niche',    website:'https://bondno9.com' },
  'Bottega Veneta':         { origin:'İtalya',                       founded:1966, category:'Designer', website:'https://bottegaveneta.com' },
  'Boucheron':              { origin:'Fransa',                       founded:1858, category:'Designer', website:'https://boucheron.com' },
  'Bourjois':               { origin:'Fransa',                       founded:1863, category:'Designer', website:'https://bourjois.com' },
  'Burberry':               { origin:'İngiltere',                    founded:1856, category:'Designer', website:'https://burberry.com' },
  'Bvlgari':                { origin:'İtalya',                       founded:1884, category:'Designer', website:'https://bulgari.com' },
  'By Kilian':              { origin:'Fransa',                       founded:2007, category:'Niche',    website:'https://bykilian.com' },
  'Byredo':                 { origin:'İsveç',                        founded:2006, category:'Niche',    website:'https://byredo.com' },
  'Cacharel':               { origin:'Fransa',                       founded:1962, category:'Designer', website:'https://cacharel.com' },
  'Caldion':                { origin:'Türkiye',                      founded:1990, category:'Designer', website:'https://caldion.com.tr' },
  'Calvin Klein':           { origin:'Amerika',                      founded:1968, category:'Designer', website:'https://calvinklein.com' },
  'Carolina Herrera':       { origin:'Amerika',                      founded:1980, category:'Designer', website:'https://carolinaherrera.com' },
  'Celine':                 { origin:'Fransa',                       founded:1945, category:'Designer', website:'https://celine.com' },
  'Chanel':                 { origin:'Fransa',                       founded:1910, category:'Designer', website:'https://chanel.com' },
  'Chopard':                { origin:'İsviçre',                      founded:1860, category:'Designer', website:'https://chopard.com' },
  'Clinique':               { origin:'Amerika',                      founded:1968, category:'Designer', website:'https://clinique.com' },
  'Clive Christian':        { origin:'İngiltere',                    founded:1999, category:'Niche',    website:'https://clivechristian.com' },
  'Costume National':       { origin:'İtalya',                       founded:1986, category:'Designer', website:'https://costumenational.com' },
  'Coty':                   { origin:'Fransa',                       founded:1904, category:'Designer', website:'https://coty.com' },
  'Creed':                  { origin:'Fransa',                       founded:1760, category:'Niche',    website:'https://creedperfume.com' },
  'Davidoff':               { origin:'İsviçre',                      founded:1946, category:'Designer', website:'https://davidoff.com' },
  'Diesel':                 { origin:'İtalya',                       founded:1978, category:'Designer', website:'https://diesel.com' },
  'Dior':                   { origin:'Fransa',                       founded:1946, category:'Designer', website:'https://dior.com' },
  'Diptyque':               { origin:'Fransa',                       founded:1961, category:'Niche',    website:'https://diptyqueparis.com' },
  'Dolce & Gabbana':        { origin:'İtalya',                       founded:1985, category:'Designer', website:'https://dolcegabbana.com' },
  'Dunlop':                 { origin:'İngiltere',                    founded:1888, category:'Designer', website:'https://dunlop-sport.com' },
  'Escentric Molecules':    { origin:'İngiltere',                    founded:2006, category:'Niche',    website:'https://escentric.com' },
  'Essential Parfums':      { origin:'Fransa',                       founded:2019, category:'Niche',    website:'https://essentialparfums.com' },
  'Ex Nihilo':              { origin:'Fransa',                       founded:2013, category:'Niche',    website:'https://exnihiloparis.com' },
  'Faberge':                { origin:'Rusya',                        founded:1842, category:'Designer', website:'https://faberge.com' },
  'Frédéric Malle':         { origin:'Fransa',                       founded:2000, category:'Niche',    website:'https://fredericmalle.com' },
  'Giorgio Armani':         { origin:'İtalya',                       founded:1975, category:'Designer', website:'https://armani.com' },
  'Gisada':                 { origin:'İsviçre',                      founded:2013, category:'Niche',    website:'https://gisada.com' },
  'Givenchy':               { origin:'Fransa',                       founded:1952, category:'Designer', website:'https://givenchy.com' },
  'Goldfield & Banks':      { origin:'Avustralya',                   founded:2016, category:'Niche',    website:'https://goldfieldandbanks.com.au' },
  'Gucci':                  { origin:'İtalya',                       founded:1921, category:'Designer', website:'https://gucci.com' },
  'Guerlain':               { origin:'Fransa',                       founded:1828, category:'Designer', website:'https://guerlain.com' },
  'Hermès':                 { origin:'Fransa',                       founded:1837, category:'Designer', website:'https://hermes.com' },
  'Hugo Boss':              { origin:'Almanya',                      founded:1924, category:'Designer', website:'https://hugoboss.com' },
  'Initio Parfums Privés':  { origin:'Fransa',                       founded:2015, category:'Niche',    website:'https://initio-parfums.com' },
  'Issey Miyake':           { origin:'Japonya',                      founded:1970, category:'Designer', website:'https://isseymiyake.com' },
  'Jean Paul Gaultier':     { origin:'Fransa',                       founded:1976, category:'Designer', website:'https://jeanpaulgaultier.com' },
  'Jil Sander':             { origin:'Almanya',                      founded:1968, category:'Designer', website:'https://jilsander.com' },
  'Jimmy Choo':             { origin:'İngiltere',                    founded:1996, category:'Designer', website:'https://jimmychoo.com' },
  'Jo Malone London':       { origin:'İngiltere',                    founded:1994, category:'Niche',    website:'https://jomalone.com' },
  'Joop':                   { origin:'Almanya',                      founded:1987, category:'Designer', website:'https://joop.com' },
  'Juliette Has A Gun':     { origin:'Fransa',                       founded:2005, category:'Niche',    website:'https://juliettehasagun.com' },
  'Kayali':                 { origin:'Birleşik Arap Emirlikleri',    founded:2018, category:'Niche',    website:'https://kayali.com' },
  'Kenzo':                  { origin:'Fransa',                       founded:1970, category:'Designer', website:'https://kenzo.com' },
  "L'Artisan Parfumeur":    { origin:'Fransa',                       founded:1976, category:'Niche',    website:'https://lartisanparfumeur.com' },
  'Lacoste':                { origin:'Fransa',                       founded:1933, category:'Designer', website:'https://lacoste.com' },
  'Lalique':                { origin:'Fransa',                       founded:1888, category:'Niche',    website:'https://lalique.com' },
  'Lancôme':                { origin:'Fransa',                       founded:1935, category:'Designer', website:'https://lancome.com' },
  'Le Labo':                { origin:'Amerika',                      founded:2006, category:'Niche',    website:'https://lelabofragrances.com' },
  'Loewe':                  { origin:'İspanya',                      founded:1846, category:'Designer', website:'https://loewe.com' },
  'Lorenzo Pazzaglia':      { origin:'İtalya',                       founded:2016, category:'Niche',    website:'https://lorenzopazzaglia.com' },
  'Louis Vuitton':          { origin:'Fransa',                       founded:1854, category:'Designer', website:'https://louisvuitton.com' },
  'Maison Crivelli':        { origin:'Fransa',                       founded:2018, category:'Niche',    website:'https://maisoncrivelli.com' },
  'Maison Francis Kurkdjian':{ origin:'Fransa',                      founded:2009, category:'Niche',    website:'https://maisonfrancisurkdjian.com' },
  'Maison Margiela':        { origin:'Belçika',                      founded:1988, category:'Niche',    website:'https://maisonmargiela.com' },
  'Mancera':                { origin:'Fransa',                       founded:2008, category:'Niche',    website:'https://manceraparfums.com' },
  'Marc-Antoine Barrois':   { origin:'Fransa',                       founded:2015, category:'Niche',    website:'https://marc-antoinebarrois.com' },
  'Matière Première':       { origin:'Fransa',                       founded:2018, category:'Niche',    website:'https://matierepremierefrances.com' },
  'Memo Paris':             { origin:'Fransa',                       founded:2007, category:'Niche',    website:'https://memoparis.com' },
  'Michael Kors':           { origin:'Amerika',                      founded:1981, category:'Designer', website:'https://michaelkors.com' },
  'Montblanc':              { origin:'Almanya',                      founded:1906, category:'Designer', website:'https://montblanc.com' },
  'Moschino':               { origin:'İtalya',                       founded:1983, category:'Designer', website:'https://moschino.com' },
  'Naomi Campbell':         { origin:'İngiltere',                    founded:1999, category:'Designer', website:'' },
  'Narciso Rodriguez':      { origin:'Amerika',                      founded:1997, category:'Designer', website:'https://narcisorodriguez.com' },
  'Nasomatto':              { origin:'Hollanda',                     founded:2007, category:'Niche',    website:'https://nasomatto.com' },
  'Nautica':                { origin:'Amerika',                      founded:1983, category:'Designer', website:'https://nautica.com' },
  'Nikos':                  { origin:'Fransa',                       founded:1988, category:'Designer', website:'https://nikos.fr' },
  'Nishane':                { origin:'Türkiye',                      founded:2012, category:'Niche',    website:'https://nishane.com.tr' },
  'Oriflame':               { origin:'İsveç',                        founded:1967, category:'Designer', website:'https://oriflame.com' },
  'Ormonde Jayne':          { origin:'İngiltere',                    founded:2000, category:'Niche',    website:'https://ormondejayne.com' },
  'Orto Parisi':            { origin:'İtalya',                       founded:2013, category:'Niche',    website:'https://ortoparisi.com' },
  'Paco Rabanne':           { origin:'Fransa',                       founded:1966, category:'Designer', website:'https://pacorabanne.com' },
  'Parfums De Marly':       { origin:'Fransa',                       founded:2009, category:'Niche',    website:'https://parfumsdemarly.com' },
  "Penhaligon's":           { origin:'İngiltere',                    founded:1870, category:'Niche',    website:'https://penhaligons.com' },
  'Prada':                  { origin:'İtalya',                       founded:1913, category:'Designer', website:'https://prada.com' },
  'Puma':                   { origin:'Almanya',                      founded:1948, category:'Designer', website:'https://puma.com' },
  'Ralph Lauren':           { origin:'Amerika',                      founded:1967, category:'Designer', website:'https://ralphlauren.com' },
  'Roberto Cavalli':        { origin:'İtalya',                       founded:1972, category:'Designer', website:'https://robertocavalli.com' },
  'Roja Parfums':           { origin:'İngiltere',                    founded:2011, category:'Niche',    website:'https://rojaparfums.com' },
  'Rosendo Mateu':          { origin:'İspanya',                      founded:2016, category:'Niche',    website:'https://rosendomateu.com' },
  'Sisley':                 { origin:'Fransa',                       founded:1976, category:'Designer', website:'https://sisley-paris.com' },
  'Slazenger':              { origin:'İngiltere',                    founded:1881, category:'Designer', website:'https://slazenger.com' },
  'Sospiro':                { origin:'İtalya',                       founded:2008, category:'Niche',    website:'https://sospiro.it' },
  'Stéphane Humbert Lucas 777':{ origin:'Fransa',                   founded:2013, category:'Niche',    website:'https://shl777.com' },
  'Swiss':                  { origin:'Birleşik Arap Emirlikleri',    founded:1994, category:'Designer', website:'https://swissarabian.com' },
  'Tauer Perfumes':         { origin:'İsviçre',                      founded:2004, category:'Niche',    website:'https://tauerperfumes.com' },
  'Thameen':                { origin:'İngiltere',                    founded:2012, category:'Niche',    website:'https://thameen.com' },
  'The Merchant Of Venice': { origin:'İtalya',                       founded:2009, category:'Niche',    website:'https://themerchantofvenice.com' },
  'Thierry Mugler':         { origin:'Fransa',                       founded:1974, category:'Designer', website:'https://mugler.com' },
  'Tiziana Terenzi':        { origin:'İtalya',                       founded:1986, category:'Niche',    website:'https://tizianaternzi.it' },
  'Tom Ford':               { origin:'Amerika',                      founded:2006, category:'Designer', website:'https://tomford.com' },
  'Tommy Hilfiger':         { origin:'Amerika',                      founded:1985, category:'Designer', website:'https://tommy.com' },
  'Toskovat':               { origin:'Rusya',                        founded:2014, category:'Niche',    website:'https://toskovat.com' },
  "Unique'e Luxury":        { origin:'Birleşik Arap Emirlikleri',    founded:2016, category:'Niche',    website:'https://uniqueeluxury.com' },
  'Vakko':                  { origin:'Türkiye',                      founded:1934, category:'Designer', website:'https://vakko.com' },
  'Valentino':              { origin:'İtalya',                       founded:1960, category:'Designer', website:'https://valentino.com' },
  'Versace':                { origin:'İtalya',                       founded:1978, category:'Designer', website:'https://versace.com' },
  "Victoria's Secret":      { origin:'Amerika',                      founded:1977, category:'Designer', website:'https://victoriassecret.com' },
  'Viktor & Rolf':          { origin:'Hollanda',                     founded:1993, category:'Designer', website:'https://viktor-rolf.com' },
  'Xerjoff':                { origin:'İtalya',                       founded:2003, category:'Niche',    website:'https://xerjoff.com' },
  'Yves Rocher':            { origin:'Fransa',                       founded:1959, category:'Designer', website:'https://yves-rocher.com' },
  'Yves Saint Laurent':     { origin:'Fransa',                       founded:1961, category:'Designer', website:'https://ysl.com' },
  'Zadig & Voltaire':       { origin:'Fransa',                       founded:1997, category:'Designer', website:'https://zadig-et-voltaire.com' },
  'Zara':                   { origin:'İspanya',                      founded:1975, category:'Designer', website:'https://zara.com' },
  'Zarkoperfume':           { origin:'Danimarka',                    founded:2008, category:'Niche',    website:'https://zarkoperfume.com' },
  'Zoologist':              { origin:'Kanada',                       founded:2013, category:'Niche',    website:'https://zoologistperfumes.com' },
  'Éclat':                  { origin:'Fransa',                       founded:2001, category:'Designer', website:'' },
};

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

// ── Ana akış ─────────────────────────────────────────────────────────────────
const wb   = XLSX.readFile(EXCEL_PATH);
const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
console.log(`\nExcel: ${rows.length} marka okundu.`);

// Firestore'daki mevcut orijinal markaları yükle
const existingSnap = await db.collection('brands').where('type','==','original').get();
const existingSlugs = new Set(existingSnap.docs.map(d => d.data().slug).filter(Boolean));
const existingNorms = new Set(existingSnap.docs.map(d => norm(d.data().name || '')).filter(Boolean));
console.log(`Firestore: ${existingSnap.size} orijinal marka mevcut.\n`);

const results = { created:0, skipped:0, logoOk:0, logoPlaceholder:0, errors:[] };

for (const row of rows) {
  const name = String(row['Marka'] || '').trim();
  if (!name) continue;

  const slug     = slugify(name);
  const nameNorm = norm(name);

  // Duplicate kontrolü: slug veya normalize edilmiş isim eşleşirse atla
  if (existingSlugs.has(slug) || existingNorms.has(nameNorm)) {
    console.log(`  ⏭  Zaten var: ${name}`);
    results.skipped++;
    continue;
  }

  console.log(`\n→ ${name} (${slug})`);

  // Klasör oluştur
  const brandDir = join(BRANDS_DIR, slug);
  if (!existsSync(brandDir)) mkdirSync(brandDir, { recursive: true });

  // 1. Logo bul
  let rawBuf    = null;
  let logoSrc   = '';

  // Önce lokal klasörde mevcut görsel var mı?
  const localFile = findLocalImage(brandDir);
  if (localFile) {
    rawBuf  = readFileSync(join(brandDir, localFile));
    logoSrc = `lokal (${localFile})`;
  }

  // Yoksa Clearbit dene
  if (!rawBuf) {
    const domain = DOMAIN_MAP[name];
    if (domain) {
      rawBuf = await fetchClearbit(domain);
      if (rawBuf) logoSrc = `Clearbit → ${domain}`;
    }
  }

  // Her ikisi de başarısız → placeholder
  if (!rawBuf) {
    rawBuf  = await makePlaceholder(name);
    logoSrc = 'placeholder';
    results.logoPlaceholder++;
  } else {
    results.logoOk++;
  }

  // 2. 500×500 işle
  let processedBuf;
  try {
    processedBuf = await processLogo(rawBuf);
  } catch (err) {
    console.log(`  ⚠  İşleme hatası (${err.message}), placeholder kullanılıyor`);
    rawBuf       = await makePlaceholder(name);
    processedBuf = await processLogo(rawBuf);
    if (logoSrc !== 'placeholder') { results.logoOk--; results.logoPlaceholder++; }
    logoSrc = 'placeholder (hata sonrası)';
  }

  // 3. Lokal kaydet
  const outPath = join(brandDir, 'logo.png');
  writeFileSync(outPath, processedBuf);
  console.log(`  ✓ Lokal: ${outPath}  [${logoSrc}]`);

  // 4. Storage'a yükle
  let logoUrl = '';
  try {
    logoUrl = await uploadToStorage(processedBuf, `brands/${slug}.png`);
    console.log(`  ✓ Storage: brands/${slug}.png`);
  } catch (err) {
    const msg = `Storage hatası – ${name}: ${err.message}`;
    console.error(`  ✗ ${msg}`);
    results.errors.push(msg);
  }

  // 5. Firestore'a kaydet
  try {
    const meta = BRAND_META[name] || { origin:'', founded:0, category:'Designer', website:'' };
    const ref  = db.collection('brands').doc();
    await ref.set({
      id:         ref.id,
      name,
      slug,
      logo:       abbr(name),
      logoImage:  logoUrl,
      type:       'original',
      origin:     meta.origin,
      founded:    meta.founded,
      category:   meta.category,
      bio:        '',
      website:    meta.website,
      instagram:  '',
      active:     true,
      likes:      0,
      createdAt:  admin.firestore.FieldValue.serverTimestamp(),
    });
    results.created++;
    console.log(`  ✓ Firestore kaydedildi`);
  } catch (err) {
    const msg = `Firestore hatası – ${name}: ${err.message}`;
    console.error(`  ✗ ${msg}`);
    results.errors.push(msg);
  }
}

// ── Özet ─────────────────────────────────────────────────────────────────────
console.log(`\n${'─'.repeat(50)}`);
console.log(`✅ Tamamlandı:`);
console.log(`   ${results.created}          yeni marka oluşturuldu`);
console.log(`   ${results.skipped}          zaten vardı (atlandı)`);
console.log(`   ${results.logoOk}          gerçek logo (lokal/Clearbit)`);
console.log(`   ${results.logoPlaceholder}          placeholder logo`);
if (results.errors.length) {
  console.log(`\n⚠  ${results.errors.length} hata:`);
  results.errors.forEach(e => console.log(`   - ${e}`));
}
process.exit(0);
