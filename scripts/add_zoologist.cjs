const admin = require('firebase-admin');
const key = require('C:/Users/MERT/Downloads/muadilci-890e4-firebase-adminsdk-fbsvc-71442fa541.json');

admin.initializeApp({ credential: admin.credential.cert(key) });
const db = admin.firestore();

function slugify(s) {
  return (s || '')
    .toLowerCase()
    .replace(/ğ/g,'g').replace(/ü/g,'u').replace(/ş/g,'s')
    .replace(/ı/g,'i').replace(/ö/g,'o').replace(/ç/g,'c')
    .replace(/[^a-z0-9\s-]/g,'').replace(/\s+/g,'-').replace(/-+/g,'-');
}

const norm = s => (s || '').toLowerCase().replace(/[^a-z0-9]/g,'');

const rows = [
  { muadilFirma: 'Emre Geldi',    parfum: 'Civet' },
  { muadilFirma: 'Luxury Extrait', parfum: 'Civet' },
  { muadilFirma: 'Luxury Extrait', parfum: 'Seahorse' },
  { muadilFirma: 'Luxury Extrait', parfum: 'Camel' },
  { muadilFirma: 'Luxury Extrait', parfum: 'T-Rex' },
  { muadilFirma: 'Luxury Extrait', parfum: 'Squid' },
  { muadilFirma: 'Luxury Extrait', parfum: 'Elephant' },
  { muadilFirma: 'Malikhan',       parfum: 'Cockatiel' },
];

async function main() {
  // Load all brands
  const bSnap = await db.collection('brands').get();
  const allBrands = bSnap.docs.map(d => ({ id: d.id, ...d.data() }));
  const brandByNorm = {};
  allBrands.forEach(b => { brandByNorm[norm(b.name)] = b; });

  const muadilByNorm = {};
  allBrands.filter(b => b.type === 'muadil').forEach(b => { muadilByNorm[norm(b.name)] = b; });

  // 1. Add "Zoologist Perfumes" brand if not exists
  let zoologist = brandByNorm[norm('Zoologist Perfumes')] || brandByNorm[norm('Zoologist')];
  if (!zoologist) {
    const ref = db.collection('brands').doc();
    zoologist = {
      id: ref.id,
      name: 'Zoologist Perfumes',
      slug: 'zoologist-perfumes',
      type: 'original',
      active: true,
      likes: 0,
      bio: '',
      logo: '',
      logoImage: '',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };
    await ref.set(zoologist);
    console.log('Zoologist Perfumes markası eklendi:', ref.id);
  } else {
    console.log('Zoologist Perfumes zaten var:', zoologist.id);
  }

  // 2. Existing perfumes
  const pSnap = await db.collection('perfumes').get();
  const perfByKey = {};
  const existingSlugs = new Set();
  pSnap.docs.forEach(d => {
    const p = d.data();
    perfByKey[norm(p.brandName||'')+'|'+norm(p.name||'')] = { id: d.id, ...p };
    if (p.slug) existingSlugs.add(p.slug);
  });

  // 3. Add missing perfumes
  const uniqueParfums = [...new Set(rows.map(r => r.parfum))];
  const batch1 = db.batch();
  let addedPerf = 0;
  for (const parfum of uniqueParfums) {
    const k = norm(zoologist.name)+'|'+norm(parfum);
    if (perfByKey[k]) { console.log(`  Parfüm zaten var: ${parfum}`); continue; }
    const sl = slugify(parfum);
    const uniqueSlug = existingSlugs.has(sl) ? slugify(zoologist.slug+'-'+parfum) : sl;
    existingSlugs.add(uniqueSlug);
    const ref = db.collection('perfumes').doc();
    const doc = {
      id: ref.id,
      name: parfum,
      slug: uniqueSlug,
      brandId: zoologist.id,
      brandName: zoologist.name,
      brandSlug: zoologist.slug,
      gender: '', year: 0, description: '',
      notes: { top: [], heart: [], base: [] },
      image: '', images: [], active: true,
      likes: 0, commentCount: 0,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };
    batch1.set(ref, doc);
    perfByKey[k] = { ...doc };
    console.log(`  Parfüm eklenecek: ${parfum}`);
    addedPerf++;
  }
  if (addedPerf > 0) await batch1.commit();
  console.log(`${addedPerf} parfüm eklendi`);

  // 4. Existing muadils
  const mSnap = await db.collection('muadils').get();
  const existingMuadilKeys = new Set(
    mSnap.docs.map(d => { const m = d.data(); return (m.brandId||'')+'|'+(m.targetPerfumeId||''); })
  );

  // 5. Create muadil links
  const muadilDocs = [];
  for (const r of rows) {
    const mb = muadilByNorm[norm(r.muadilFirma)];
    if (!mb) { console.log(`  Muadil firma bulunamadı: ${r.muadilFirma}`); continue; }

    const k = norm(zoologist.name)+'|'+norm(r.parfum);
    const targetPerf = perfByKey[k];
    if (!targetPerf) { console.log(`  Parfüm bulunamadı: ${r.parfum}`); continue; }

    const dupKey = mb.id+'|'+targetPerf.id;
    if (existingMuadilKeys.has(dupKey)) { console.log(`  Zaten var: ${r.muadilFirma} → ${r.parfum}`); continue; }
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
  }

  if (muadilDocs.length > 0) {
    const batch2 = db.batch();
    muadilDocs.forEach(d => {
      const ref = db.collection('muadils').doc();
      batch2.set(ref, { ...d, id: ref.id });
    });
    await batch2.commit();
  }

  console.log(`\nTamamlandı: ${addedPerf} parfüm + ${muadilDocs.length} muadil link eklendi`);
  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
