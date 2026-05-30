const admin = require('firebase-admin');
const key = require('C:/Users/MERT/Downloads/muadilci-890e4-firebase-adminsdk-fbsvc-71442fa541.json');

admin.initializeApp({ credential: admin.credential.cert(key) });
const db = admin.firestore();

async function main() {
  // Find both brands
  const bSnap = await db.collection('brands').get();
  let byKilian = null;
  let kilianParis = null;

  bSnap.docs.forEach(d => {
    const data = d.data();
    const n = (data.name || '').toLowerCase();
    if (n === 'by kilian') byKilian = { id: d.id, ...data };
    if (n === 'kilian paris') kilianParis = { id: d.id, ...data };
  });

  if (!byKilian) { console.error('By Kilian bulunamadı'); process.exit(1); }
  if (!kilianParis) { console.error('Kilian Paris bulunamadı'); process.exit(1); }

  console.log(`By Kilian id: ${byKilian.id}`);
  console.log(`Kilian Paris id: ${kilianParis.id}`);

  // Get Kilian Paris perfumes
  const pSnap = await db.collection('perfumes').where('brandId', '==', kilianParis.id).get();
  console.log(`Kilian Paris parfüm sayısı: ${pSnap.size}`);

  const CHUNK = 490;

  // Update perfumes: move to By Kilian
  const perfDocs = pSnap.docs;
  for (let i = 0; i < perfDocs.length; i += CHUNK) {
    const chunk = perfDocs.slice(i, i + CHUNK);
    const batch = db.batch();
    chunk.forEach(d => {
      batch.update(d.ref, {
        brandId: byKilian.id,
        brandName: byKilian.name,
        brandSlug: byKilian.slug,
      });
    });
    await batch.commit();
    console.log(`  Parfüm güncellendi: ${Math.min(i + CHUNK, perfDocs.length)}/${perfDocs.length}`);
  }

  // Update muadil links that target Kilian Paris perfumes (targetBrandName)
  const perfIds = new Set(perfDocs.map(d => d.id));
  const mSnap = await db.collection('muadils').where('targetBrandName', '==', kilianParis.name).get();
  console.log(`Kilian Paris hedefli muadil: ${mSnap.size}`);

  const muadilDocs = mSnap.docs;
  for (let i = 0; i < muadilDocs.length; i += CHUNK) {
    const chunk = muadilDocs.slice(i, i + CHUNK);
    const batch = db.batch();
    chunk.forEach(d => {
      batch.update(d.ref, { targetBrandName: byKilian.name });
    });
    await batch.commit();
    console.log(`  Muadil güncellendi: ${Math.min(i + CHUNK, muadilDocs.length)}/${muadilDocs.length}`);
  }

  // Delete Kilian Paris brand
  await db.collection('brands').doc(kilianParis.id).delete();
  console.log(`Kilian Paris markası silindi.`);

  console.log('\nTamamlandı.');
  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
