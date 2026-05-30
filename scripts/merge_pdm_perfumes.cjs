const admin = require('firebase-admin');
const key = require('C:/Users/MERT/Downloads/muadilci-890e4-firebase-adminsdk-fbsvc-71442fa541.json');

admin.initializeApp({ credential: admin.credential.cert(key) });
const db = admin.firestore();

const norm = s => (s || '').toLowerCase().replace(/[^a-z0-9]/g, '');

// Merges: { from: wrong name, to: correct name } — all under PDM brand
const MERGES = [
  { from: 'Delina Exclusive',  to: 'Delina Exclusif' },
  { from: 'Greenly',           to: 'Greenley' },
  { from: 'Layton Eclusif',    to: 'Layton Exclusif' },
  { from: 'Pegasus Eclusif',   to: 'Pegasus Exclusif' },
  { from: 'Pegasus Exclusive', to: 'Pegasus Exclusif' },
  { from: 'Valaya 2023',       to: 'Valaya' },
];

async function main() {
  // Find PDM brand
  const bSnap = await db.collection('brands').get();
  let pdm = null;
  bSnap.docs.forEach(d => {
    const n = (d.data().name || '').toLowerCase();
    if (n.includes('parfums de marly') || n.includes('pdm') || n === 'pdm') pdm = { id: d.id, ...d.data() };
  });

  // Load all PDM perfumes
  const pSnap = await db.collection('perfumes').get();
  const pdmPerfs = {};
  pSnap.docs.forEach(d => {
    const p = d.data();
    // match by norm name regardless of brand — we'll verify by checking both sides exist
    pdmPerfs[norm(p.name)] = { id: d.id, ref: d.ref, ...p };
  });

  // Also build by exact name for safety
  const perfByName = {};
  pSnap.docs.forEach(d => {
    perfByName[(d.data().name || '').trim()] = { id: d.id, ref: d.ref, ...d.data() };
  });

  for (const { from, to } of MERGES) {
    const wrongPerf = perfByName[from] || pdmPerfs[norm(from)];
    const rightPerf = perfByName[to]  || pdmPerfs[norm(to)];

    if (!wrongPerf) { console.log(`⚠  Bulunamadı (from): "${from}"`); continue; }
    if (!rightPerf) { console.log(`⚠  Bulunamadı (to):   "${to}"`); continue; }
    if (wrongPerf.id === rightPerf.id) { console.log(`⚠  Aynı kayıt: "${from}"`); continue; }

    console.log(`\nBirleştiriliyor: "${from}" (${wrongPerf.id}) → "${to}" (${rightPerf.id})`);

    // Find muadils pointing to wrongPerf
    const mSnap = await db.collection('muadils')
      .where('targetPerfumeId', '==', wrongPerf.id).get();

    console.log(`  ${mSnap.size} muadil taşınacak`);

    if (mSnap.size > 0) {
      // Check for duplicates: some muadils might already point to rightPerf
      const existingMuadils = await db.collection('muadils')
        .where('targetPerfumeId', '==', rightPerf.id).get();
      const existingBrandIds = new Set(existingMuadils.docs.map(d => d.data().brandId));

      const batch = db.batch();
      let moved = 0, skipped = 0;
      mSnap.docs.forEach(d => {
        const m = d.data();
        if (existingBrandIds.has(m.brandId)) {
          // duplicate — delete instead of update
          batch.delete(d.ref);
          skipped++;
        } else {
          const mName = `${rightPerf.brandName} ${rightPerf.name} Benzeri`;
          batch.update(d.ref, {
            targetPerfumeId:   rightPerf.id,
            targetPerfumeName: rightPerf.name,
            targetBrandName:   rightPerf.brandName,
            name: mName,
          });
          moved++;
        }
      });
      await batch.commit();
      console.log(`  ${moved} muadil taşındı, ${skipped} duplikat silindi`);
    }

    // Delete wrong perfume
    await wrongPerf.ref.delete();
    console.log(`  "${from}" parfümü silindi`);
  }

  console.log('\nTamamlandı.');
  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
