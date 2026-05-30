const admin = require('firebase-admin');
const fs = require('fs');
const key = require('C:/Users/MERT/Downloads/muadilci-890e4-firebase-adminsdk-fbsvc-71442fa541.json');

admin.initializeApp({ credential: admin.credential.cert(key) });
const db = admin.firestore();

function slugify(s) {
  return (s || '')
    .toLowerCase()
    .replace(/ğ/g,'g').replace(/ü/g,'u').replace(/ş/g,'s')
    .replace(/ı/g,'i').replace(/ö/g,'o').replace(/ç/g,'c')
    .replace(/é/g,'e').replace(/è/g,'e').replace(/ê/g,'e')
    .replace(/â/g,'a').replace(/à/g,'a').replace(/ô/g,'o')
    .replace(/û/g,'u').replace(/î/g,'i').replace(/ï/g,'i')
    .replace(/ñ/g,'n').replace(/ß/g,'ss')
    .replace(/\s+/g,'-').replace(/[^a-z0-9-]/g,'').replace(/-+/g,'-');
}

const norm = s => (s || '')
  .toLowerCase()
  .replace(/ğ/g,'g').replace(/ü/g,'u').replace(/ş/g,'s')
  .replace(/ı/g,'i').replace(/ö/g,'o').replace(/ç/g,'c')
  .replace(/é/g,'e').replace(/è/g,'e').replace(/ê/g,'e')
  .replace(/â/g,'a').replace(/à/g,'a').replace(/ô/g,'o')
  .replace(/û/g,'u').replace(/î/g,'i').replace(/ï/g,'i')
  .replace(/ñ/g,'n').replace(/[^a-z0-9]/g,'');

async function main() {
  // Read CSV (columns: Muadil Firma ; Normalize Marka ; Normalize Parfüm Adı ; Neden)
  const csvRaw = fs.readFileSync('C:/Users/MERT/Desktop/es geçilenler.csv', 'utf8')
    .replace(/^﻿/, ''); // strip BOM
  const lines = csvRaw.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const parts = line.split(';');
    const muadilFirma = (parts[0] || '').trim();
    const normMarka   = (parts[1] || '').trim();
    const normAd      = (parts[2] || '').trim();
    // parts[3] = Neden — ignored
    if (!muadilFirma || !normMarka || !normAd) continue;
    rows.push({ muadilFirma, normMarka, normAd });
  }
  console.log(`CSV satır: ${rows.length}`);

  // Load ALL brands
  const bSnap = await db.collection('brands').get();
  const allBrands = bSnap.docs.map(d => ({ id: d.id, ...d.data() }));
  const brandByNorm = {};
  allBrands.forEach(b => { brandByNorm[norm(b.name)] = b; });
  console.log(`Toplam marka: ${allBrands.length}`);

  // List unique orig brands in CSV that we CAN'T find
  const missingBrands = new Set();
  const missingMuadils = new Set();
  rows.forEach(r => {
    if (!brandByNorm[norm(r.normMarka)]) missingBrands.add(r.normMarka);
  });

  const muadilByNorm = {};
  allBrands.filter(b => b.type === 'muadil').forEach(b => { muadilByNorm[norm(b.name)] = b; });
  rows.forEach(r => {
    if (!muadilByNorm[norm(r.muadilFirma)]) missingMuadils.add(r.muadilFirma);
  });

  console.log(`\nDB'de olmayan orijinal markalar (${missingBrands.size}):`);
  [...missingBrands].sort().forEach(m => console.log('  ORIG:', m));
  console.log(`\nDB'de olmayan muadil firmalar (${missingMuadils.size}):`);
  [...missingMuadils].sort().forEach(m => console.log('  MUADIL:', m));

  // Existing perfumes
  const pSnap = await db.collection('perfumes').get();
  const perfByKey = {};
  const existingSlugs = new Set();
  pSnap.docs.forEach(d => {
    const p = d.data();
    perfByKey[norm(p.brandName||'')+'|'+norm(p.name||'')] = { id: d.id, ...p };
    if (p.slug) existingSlugs.add(p.slug);
  });

  // Existing muadils
  const mSnap = await db.collection('muadils').get();
  const existingMuadilKeys = new Set(
    mSnap.docs.map(d => { const m = d.data(); return (m.brandId||'')+'|'+(m.targetPerfumeId||''); })
  );

  // Collect new perfumes
  const newPerfumes = [];
  const addedPerfKeys = new Set();
  const uniqueTargets = new Map();
  rows.forEach(r => {
    const k = norm(r.normMarka)+'|'+norm(r.normAd);
    if (!uniqueTargets.has(k)) uniqueTargets.set(k, { brand: r.normMarka, name: r.normAd });
  });

  uniqueTargets.forEach(({ brand, name }, k) => {
    const b = brandByNorm[norm(brand)];
    if (!b) return;
    if (perfByKey[k]) return;
    if (addedPerfKeys.has(k)) return;
    const sl = slugify(name);
    const uniqueSlug = existingSlugs.has(sl) ? slugify(b.slug+'-'+name) : sl;
    existingSlugs.add(uniqueSlug);
    const doc = {
      name, slug: uniqueSlug,
      brandId: b.id, brandName: b.name, brandSlug: b.slug || slugify(b.name),
      gender: '', year: 0, description: '',
      notes: { top: [], heart: [], base: [] },
      image: '', images: [], active: true,
      likes: 0, commentCount: 0,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };
    newPerfumes.push({ key: k, doc });
    addedPerfKeys.add(k);
  });

  console.log(`\nEklenecek yeni parfüm: ${newPerfumes.length}`);

  const CHUNK = 490;
  let perfWritten = 0;
  for (let i = 0; i < newPerfumes.length; i += CHUNK) {
    const chunk = newPerfumes.slice(i, i + CHUNK);
    const batch = db.batch();
    chunk.forEach(({ key, doc }) => {
      const ref = db.collection('perfumes').doc();
      const withId = { ...doc, id: ref.id };
      batch.set(ref, withId);
      perfByKey[key] = withId;
    });
    await batch.commit();
    perfWritten += chunk.length;
    console.log(`  Parfüm: ${perfWritten}/${newPerfumes.length} eklendi`);
  }

  // Create muadil links
  const skipped = [];
  const muadilDocs = [];

  rows.forEach(r => {
    const origBrand = brandByNorm[norm(r.normMarka)];
    if (!origBrand) {
      skipped.push({ muadilFirma: r.muadilFirma, normMarka: r.normMarka, normAd: r.normAd, neden: 'Marka veritabanında bulunamadı' });
      return;
    }
    const mb = muadilByNorm[norm(r.muadilFirma)];
    if (!mb) {
      skipped.push({ muadilFirma: r.muadilFirma, normMarka: r.normMarka, normAd: r.normAd, neden: 'Muadil firma veritabanında bulunamadı' });
      return;
    }
    const k = norm(r.normMarka)+'|'+norm(r.normAd);
    const targetPerf = perfByKey[k];
    if (!targetPerf) {
      skipped.push({ muadilFirma: r.muadilFirma, normMarka: r.normMarka, normAd: r.normAd, neden: 'Hedef parfüm eklenemedi' });
      return;
    }
    const dupKey = mb.id+'|'+targetPerf.id;
    if (existingMuadilKeys.has(dupKey)) return;
    existingMuadilKeys.add(dupKey);

    const mName = `${targetPerf.brandName} ${targetPerf.name} Benzeri`;
    muadilDocs.push({
      name: mName,
      slug: slugify(mb.slug+'-'+mName),
      brandId: mb.id, brandSlug: mb.slug, brandName: mb.name,
      targetPerfumeId: targetPerf.id,
      targetPerfumeName: targetPerf.name,
      targetBrandName: targetPerf.brandName,
      gender: '', description: '', image: '', images: [],
      active: true,
      avgSimilarity: 0, avgProjection: 0, avgLongevity: 0,
      reviewCount: 0, compareCount: 0,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  });

  console.log(`\nEklenecek muadil link: ${muadilDocs.length}`);
  console.log(`Es geçilen: ${skipped.length}`);

  // Overwrite skipped file
  if (skipped.length > 0) {
    const lines2 = [
      'Muadil Firma;Normalize Marka;Normalize Parfüm Adı;Neden',
      ...skipped.map(s => `${s.muadilFirma};${s.normMarka};${s.normAd};${s.neden}`)
    ];
    fs.writeFileSync('C:/Users/MERT/Desktop/es geçilenler.csv', '﻿' + lines2.join('\n'), 'utf8');
    console.log(`Log güncellendi.`);
  } else {
    fs.writeFileSync('C:/Users/MERT/Desktop/es geçilenler.csv', '﻿Muadil Firma;Normalize Marka;Normalize Parfüm Adı;Neden\n', 'utf8');
    console.log(`Tüm satırlar işlendi, es geçilen kalmadı.`);
  }

  let mWritten = 0;
  for (let i = 0; i < muadilDocs.length; i += CHUNK) {
    const chunk = muadilDocs.slice(i, i + CHUNK);
    const batch = db.batch();
    chunk.forEach(d => {
      const ref = db.collection('muadils').doc();
      batch.set(ref, { ...d, id: ref.id });
    });
    await batch.commit();
    mWritten += chunk.length;
    console.log(`  Muadil: ${mWritten}/${muadilDocs.length} eklendi`);
  }

  console.log(`\nTamamlandı.`);
  console.log(`  ${perfWritten} yeni parfüm eklendi`);
  console.log(`  ${mWritten} yeni muadil link eklendi`);
  console.log(`  ${skipped.length} satır hâlâ es geçildi`);
  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
