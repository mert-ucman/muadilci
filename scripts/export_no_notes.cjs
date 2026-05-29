const admin = require('firebase-admin');
const fs = require('fs');
const key = require('C:/Users/MERT/Downloads/muadilci-890e4-firebase-adminsdk-fbsvc-71442fa541.json');

admin.initializeApp({ credential: admin.credential.cert(key) });
const db = admin.firestore();

async function main() {
  const snap = await db.collection('perfumes').get();
  const noNotes = [];

  snap.docs.forEach(d => {
    const p = d.data();
    const top   = (p.notes?.top   || []).length;
    const heart = (p.notes?.heart || []).length;
    const base  = (p.notes?.base  || []).length;
    if (top === 0 && heart === 0 && base === 0) {
      noNotes.push({ marka: p.brandName || '', isim: p.name || '' });
    }
  });

  noNotes.sort((a, b) => a.marka.localeCompare(b.marka, 'tr') || a.isim.localeCompare(b.isim, 'tr'));

  console.log(`Notasız parfüm sayısı: ${noNotes.length}`);

  const lines = ['Marka;Parfüm Adı', ...noNotes.map(p => `${p.marka};${p.isim}`)];
  fs.writeFileSync('C:/Users/MERT/Desktop/notasiz_parfumler.csv', lines.join('\n'), 'utf8');
  console.log(`Kaydedildi: C:/Users/MERT/Desktop/notasiz_parfumler.csv`);
  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
