const admin = require('firebase-admin');
const XLSX = require('xlsx');
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
  const wb = XLSX.readFile('C:/Users/MERT/Desktop/normalize yeni.xlsx');
  const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { defval: '' });
  console.log(`Toplam satır: ${rows.length}`);

  // 1. Original brands
  const bSnap = await db.collection('brands').where('type','==','original').get();
  const origBrands = bSnap.docs.map(d => ({ id: d.id, ...d.data() }));
  const brandByNorm = {};
  origBrands.forEach(b => { brandByNorm[norm(b.name)] = b; });

  // 2. Muadil brands
  const mbSnap = await db.collection('brands').where('type','==','muadil').get();
  const muadilBrands = mbSnap.docs.map(d => ({ id: d.id, ...d.data() }));
  const muadilByNorm = {};
  muadilBrands.forEach(b => { muadilByNorm[norm(b.name)] = b; });

  // 3. Existing perfumes
  const pSnap = await db.collection('perfumes').get();
  const perfByKey = {};
  const existingSlugs = new Set();
  pSnap.docs.forEach(d => {
    const p = d.data();
    perfByKey[norm(p.brandName||'')+'|'+norm(p.name||'')] = { id: d.id, ...p };
    if (p.slug) existingSlugs.add(p.slug);
  });
  console.log(`Mevcut parfüm: ${pSnap.size}`);

  // 4. Existing muadils
  const mSnap = await db.collection('muadils').get();
  const existingMuadilKeys = new Set(
    mSnap.docs.map(d => { const m = d.data(); return (m.brandId||'')+'|'+(m.targetPerfumeId||''); })
  );
  console.log(`Mevcut muadil: ${mSnap.size}`);

  // ── Phase 1: Collect new perfumes to add ────────────────────────────────

  const newPerfumes = []; // docs to add to 'perfumes'
  const addedPerfKeys = new Set(); // prevent double-adding within this run

  const uniqueTargets = new Map();
  rows.forEach(r => {
    const brand = (r['Normalize Marka']||'').trim();
    const name  = (r['Normalize Parfüm Adı']||'').trim();
    if (!brand || !name) return;
    const k = norm(brand)+'|'+norm(name);
    if (!uniqueTargets.has(k)) uniqueTargets.set(k, { brand, name });
  });

  uniqueTargets.forEach(({ brand, name }, k) => {
    if (perfByKey[k]) return; // already in DB
    if (addedPerfKeys.has(k)) return;
    const b = brandByNorm[norm(brand)];
    if (!b) return; // no brand → skip
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

  // Write new perfumes in batches and update perfByKey
  const CHUNK = 490;
  let perfWritten = 0;
  for (let i = 0; i < newPerfumes.length; i += CHUNK) {
    const chunk = newPerfumes.slice(i, i + CHUNK);
    const batch = db.batch();
    chunk.forEach(({ key, doc }) => {
      const ref = db.collection('perfumes').doc();
      const withId = { ...doc, id: ref.id };
      batch.set(ref, withId);
      perfByKey[key] = withId; // update local lookup
    });
    await batch.commit();
    perfWritten += chunk.length;
    console.log(`  Parfüm: ${perfWritten}/${newPerfumes.length} eklendi`);
  }

  // ── Phase 2: Create muadil links ────────────────────────────────────────

  const muadilDocs = [];
  const failures = [];

  rows.forEach(r => {
    const muadilFirma = (r['Muadil Firma']||'').trim();
    const brand  = (r['Normalize Marka']||'').trim();
    const name   = (r['Normalize Parfüm Adı']||'').trim();
    if (!muadilFirma || !brand || !name) return;

    const mb = muadilByNorm[norm(muadilFirma)];
    if (!mb) {
      failures.push({ firma: muadilFirma, hedef: `${brand} – ${name}`, neden: 'Muadil firma bulunamadı' });
      return;
    }

    const k = norm(brand)+'|'+norm(name);
    const targetPerf = perfByKey[k];
    if (!targetPerf) {
      failures.push({ firma: muadilFirma, hedef: `${brand} – ${name}`, neden: 'Hedef parfüm DB\'de yok (marka eksik)' });
      return;
    }

    const dupKey = mb.id+'|'+targetPerf.id;
    if (existingMuadilKeys.has(dupKey)) return; // duplicate
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
  console.log(`Atlanan: ${failures.length}`);

  // Save failure log
  if (failures.length > 0) {
    const lines = ['Muadil Firma;Hedef Parfüm;Neden', ...failures.map(f => `${f.firma};${f.hedef};${f.neden}`)];
    fs.writeFileSync('C:/Users/MERT/Desktop/muadil_yeni_log.csv', '﻿' + lines.join('\n'), 'utf8');
    console.log(`Log: C:/Users/MERT/Desktop/muadil_yeni_log.csv`);
  }

  // Write muadil links
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
  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
