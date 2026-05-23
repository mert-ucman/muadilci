/**
 * Firestore'daki markaları ve parfümleri tarayıp public/sitemap.xml üretir.
 * İçerik değiştikçe yeniden çalıştırın: node scripts/generate-sitemap.mjs
 */
import { readFileSync, writeFileSync } from 'fs';
import admin from 'firebase-admin';

const ORIGIN = 'https://muadilci.com';
const sa = JSON.parse(readFileSync('C:/Users/win10/Downloads/muadilci-890e4-firebase-adminsdk-fbsvc-b145eb6842.json', 'utf8'));
admin.initializeApp({ credential: admin.credential.cert(sa) });
const db = admin.firestore();

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const today = new Date().toISOString().slice(0, 10);

const urls = [];
const add = (path, priority, changefreq) => urls.push({ loc: ORIGIN + path, priority, changefreq });

// Statik ana sayfalar
add('/', '1.0', 'daily');
add('/parfumler', '0.9', 'daily');
add('/markalar', '0.9', 'daily');
add('/en-iyiler', '0.8', 'daily');
add('/karsilastir', '0.6', 'weekly');

// Markalar
const brandsSnap = await db.collection('brands').where('active', '==', true).get();
for (const d of brandsSnap.docs) {
  const b = d.data();
  if (b.slug) add(`/marka/${b.slug}`, '0.7', 'weekly');
}

// Orijinal parfüm detay sayfaları (/:brandSlug/:perfumeSlug)
const perfSnap = await db.collection('perfumes').where('active', '==', true).get();
for (const d of perfSnap.docs) {
  const p = d.data();
  if (p.brandSlug && p.slug) add(`/${p.brandSlug}/${p.slug}`, '0.7', 'weekly');
}

const body = urls.map((u) =>
  `  <url>\n    <loc>${esc(u.loc)}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>${u.changefreq}</changefreq>\n    <priority>${u.priority}</priority>\n  </url>`
).join('\n');

const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`;

writeFileSync('public/sitemap.xml', xml, 'utf8');
console.log(`✅ public/sitemap.xml üretildi — ${urls.length} URL (${brandsSnap.size} marka, ${perfSnap.size} parfüm).`);
process.exit(0);
