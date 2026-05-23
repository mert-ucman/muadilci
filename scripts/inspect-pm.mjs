import { readFileSync } from 'fs';
import admin from 'firebase-admin';
const sa = JSON.parse(readFileSync('C:/Users/win10/Downloads/muadilci-890e4-firebase-adminsdk-fbsvc-b145eb6842.json', 'utf8'));
admin.initializeApp({ credential: admin.credential.cert(sa) });
const db = admin.firestore();

const short = (id) => /^\d{1,4}$/.test(id);

const p = await db.collection('perfumes').get();
console.log(`PERFUMES (${p.size}): kısa ID'ler =`, p.docs.filter(d=>short(d.id)).map(d=>`${d.id}(${d.data().name})`));
const m = await db.collection('muadils').get();
console.log(`MUADILS (${m.size}): kısa ID'ler =`, m.docs.filter(d=>short(d.id)).map(d=>`${d.id}(${d.data().name})`));

console.log('\n--- reviews örnek alanlar ---');
const r = await db.collection('reviews').limit(8).get();
console.log(`reviews toplam: ${(await db.collection('reviews').get()).size}`);
for (const d of r.docs) {
  const x = d.data();
  console.log(`review ${d.id}: muadilId=${JSON.stringify(x.muadilId)} muadilPerfumeId=${JSON.stringify(x.muadilPerfumeId)} perfumeId=${JSON.stringify(x.perfumeId)} origId=${JSON.stringify(x.origId)} originalPerfumeId=${JSON.stringify(x.originalPerfumeId)}`);
}

console.log('\n--- users favori alanları (boş olmayanlar) ---');
const u = await db.collection('users').get();
for (const d of u.docs) {
  const x = d.data();
  const fp = x.favPerfumes ?? [], fm = x.favMuadils ?? [], fc = x.favComps ?? [], fb = x.favBrands ?? [];
  if (fp.length || fm.length || fc.length || fb.length)
    console.log(`user ${d.id}: favPerfumes=${JSON.stringify(fp)} favMuadils=${JSON.stringify(fm)} favComps=${JSON.stringify(fc)} favBrands=${JSON.stringify(fb)}`);
}
process.exit(0);
