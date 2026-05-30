const admin = require('firebase-admin');
const key = require('C:/Users/MERT/Downloads/muadilci-890e4-firebase-adminsdk-fbsvc-71442fa541.json');

admin.initializeApp({ credential: admin.credential.cert(key) });
const db = admin.firestore();

// Each entry: keep the first name, delete/merge the rest into it
// [keepName, ...deleteNames]
const MERGES = [
  // Explicit duplicates
  ['Gold Pour Homme',        'Gold'],
  ['Fate For Men',           'Fate'],
  ['Dia Woman',              'Dia', 'Dia Pour Femme'],
  ['Ciel Pour Femme',        'Ciel'],
  ['Imitation For Man',      'Imitation Man'],
  ['Imitation For Woman',    'Imitation Woman'],
  ['Jubilation XXV',         'Jubilation XXV Man'],

  // Opus series — keep Library Collection, merge plain "Opus X" into them
  ['The Library Collection Opus I',    'Opus I'],
  ['The Library Collection Opus Ii',   'Opus II', 'The Library Collection Qpus II'],
  ['The Library Collection Opus Iii',  'Opus III'],
  ['The Library Collection Opus V',    'Opus V'],
  ['The Library Collection Opus Vi',   'Opus VI'],
  ['The Library Collection Opus Vii',  'Opus VII'],
  ['The Library Collection Opus Viii', 'Opus VIII'],
  ['The Library Collection Opus Ix',   'Opus IX'],
  ['The Library Collection Opus X',    'Opus X'],
  ['The Library Collection Opus Xi',   'Opus XI'],
];

// After merges, rename these to fix capitalization/typos
const RENAMES = {
  'The Library Collection Opus Ii':   'The Library Collection Opus II',
  'The Library Collection Opus Iii':  'The Library Collection Opus III',
  'The Library Collection Opus Vi':   'The Library Collection Opus VI',
  'The Library Collection Opus Vii':  'The Library Collection Opus VII',
  'The Library Collection Opus Viii': 'The Library Collection Opus VIII',
  'The Library Collection Opus Ix':   'The Library Collection Opus IX',
  'The Library Collection Opus Xi':   'The Library Collection Opus XI',
};

async function mergePerfumes(perfByName, keepName, deleteNames) {
  const right = perfByName[keepName];
  if (!right) { console.log(`  ⚠ Bulunamadı (keep): "${keepName}"`); return; }

  for (const fromName of deleteNames) {
    const wrong = perfByName[fromName];
    if (!wrong) { console.log(`  ⚠ Bulunamadı (from): "${fromName}"`); continue; }
    if (wrong.id === right.id) { console.log(`  ⚠ Aynı kayıt: "${fromName}"`); continue; }

    const mSnap = await db.collection('muadils').where('targetPerfumeId','==',wrong.id).get();
    console.log(`  "${fromName}" (${mSnap.size}m) → "${keepName}"`);
    if (mSnap.size > 0) {
      const existing = await db.collection('muadils').where('targetPerfumeId','==',right.id).get();
      const existingBrands = new Set(existing.docs.map(d => d.data().brandId));
      const batch = db.batch();
      let moved = 0, del = 0;
      mSnap.docs.forEach(d => {
        if (existingBrands.has(d.data().brandId)) { batch.delete(d.ref); del++; }
        else {
          batch.update(d.ref, {
            targetPerfumeId:   right.id,
            targetPerfumeName: right.name,
            targetBrandName:   right.brandName,
            name: `${right.brandName} ${right.name} Benzeri`,
          });
          moved++;
        }
      });
      await batch.commit();
      console.log(`    ${moved} taşındı, ${del} duplikat silindi`);
    }
    await wrong.ref.delete();
    console.log(`    "${fromName}" silindi`);
  }
}

async function main() {
  const pSnap = await db.collection('perfumes').get();
  const perfByName = {};
  pSnap.docs.forEach(d => { perfByName[d.data().name] = { id: d.id, ref: d.ref, ...d.data() }; });

  console.log('=== Birleştirmeler ===');
  for (const [keepName, ...deleteNames] of MERGES) {
    await mergePerfumes(perfByName, keepName, deleteNames);
  }

  console.log('\n=== İsim düzeltmeleri ===');
  for (const [oldName, newName] of Object.entries(RENAMES)) {
    const perf = perfByName[oldName];
    if (!perf) { console.log(`  ⚠ Bulunamadı: "${oldName}"`); continue; }
    // Update perfume doc name
    await perf.ref.update({ name: newName });
    // Update all muadil links
    const mSnap = await db.collection('muadils').where('targetPerfumeId','==',perf.id).get();
    if (mSnap.size > 0) {
      const batch = db.batch();
      mSnap.docs.forEach(d => {
        const brandName = d.data().targetBrandName || '';
        batch.update(d.ref, {
          targetPerfumeName: newName,
          name: `${brandName} ${newName} Benzeri`,
        });
      });
      await batch.commit();
    }
    console.log(`  "${oldName}" → "${newName}" (${mSnap.size} muadil güncellendi)`);
  }

  console.log('\nTamamlandı.');
  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
