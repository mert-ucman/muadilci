/**
 * brands, perfumes, muadils koleksiyonlarındaki ID ve brandId yapısını inceler.
 * Hiçbir şey değiştirmez. Kullanım: node scripts/inspect-brands.mjs
 */
import { readFileSync } from 'fs';
import admin from 'firebase-admin';

const serviceAccount = JSON.parse(
  readFileSync('C:/Users/win10/Downloads/muadilci-890e4-firebase-adminsdk-fbsvc-b145eb6842.json', 'utf8')
);

admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

const brandsSnap = await db.collection('brands').get();
console.log(`\n=== BRANDS (${brandsSnap.size}) ===`);
const shortIds = [];
for (const d of brandsSnap.docs) {
  const data = d.data();
  const isShort = /^\d{1,4}$/.test(d.id);
  if (isShort) shortIds.push(d.id);
  console.log(`${isShort ? '⚠️ ' : '   '}id="${d.id}"  name="${data.name ?? ''}"  slug="${data.slug ?? ''}"  type="${data.type ?? ''}"`);
}

console.log(`\n=== Kısa/sayısal ID'li markalar: ${JSON.stringify(shortIds)} ===`);

// Bu markalara referans veren perfumes/muadils sayıları
for (const bid of shortIds) {
  const p = await db.collection('perfumes').where('brandId', '==', bid).get();
  const pNum = await db.collection('perfumes').where('brandId', '==', Number(bid)).get();
  const m = await db.collection('muadils').where('brandId', '==', bid).get();
  const mNum = await db.collection('muadils').where('brandId', '==', Number(bid)).get();
  console.log(`brandId="${bid}" → perfumes(str:${p.size}, num:${pNum.size}) muadils(str:${m.size}, num:${mNum.size})`);
}

// brandId alanlarının tipini örnekle
console.log(`\n=== Örnek perfume brandId tipleri ===`);
const pSnap = await db.collection('perfumes').limit(5).get();
for (const d of pSnap.docs) {
  const v = d.data().brandId;
  console.log(`perfume id="${d.id}" brandId=${JSON.stringify(v)} (${typeof v})`);
}
console.log(`\n=== Örnek muadil brandId tipleri ===`);
const mSnap = await db.collection('muadils').limit(5).get();
for (const d of mSnap.docs) {
  const v = d.data().brandId;
  console.log(`muadil id="${d.id}" brandId=${JSON.stringify(v)} (${typeof v})`);
}

process.exit(0);
