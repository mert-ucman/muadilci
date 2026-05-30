const admin = require('firebase-admin');
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
    .replace(/\s+/g,'-').replace(/[^a-z0-9-]/g,'').replace(/-+/g,'-');
}

async function main() {
  const snap = await db.collection('muadils').get();
  console.log(`Toplam muadil: ${snap.size}`);

  const CHUNK = 490;
  let updated = 0;

  for (let i = 0; i < snap.docs.length; i += CHUNK) {
    const chunk = snap.docs.slice(i, i + CHUNK);
    const batch = db.batch();

    chunk.forEach(d => {
      const m = d.data();
      const newName = `${m.targetBrandName} ${m.targetPerfumeName} Benzeri`;
      const newSlug = slugify(m.brandSlug + '-' + newName);
      batch.update(d.ref, { name: newName, slug: newSlug });
      updated++;
    });

    await batch.commit();
    console.log(`  ${Math.min(i + CHUNK, snap.docs.length)}/${snap.docs.length} güncellendi`);
  }

  console.log(`\nTamamlandı. ${updated} muadil adı güncellendi.`);
  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
