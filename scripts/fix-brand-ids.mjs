/**
 * Kısa/sayısal ID'li markaları (1, 2, 3, 4, 101) otomatik üretilen ID'lerle
 * yeniden oluşturur, perfumes/muadils referanslarını günceller, eskileri siler.
 * HİÇBİR VERİ KAYBI OLMAZ: tüm alanlar birebir taşınır.
 *
 * Kullanım: node scripts/fix-brand-ids.mjs
 */
import { readFileSync } from 'fs';
import admin from 'firebase-admin';

const serviceAccount = JSON.parse(
  readFileSync('C:/Users/win10/Downloads/muadilci-890e4-firebase-adminsdk-fbsvc-b145eb6842.json', 'utf8')
);

admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

const brandsSnap = await db.collection('brands').get();
const shortBrands = brandsSnap.docs.filter((d) => /^\d{1,4}$/.test(d.id));

if (shortBrands.length === 0) {
  console.log('Düzeltilecek kısa ID\'li marka yok.');
  process.exit(0);
}

console.log(`${shortBrands.length} marka düzeltilecek: ${shortBrands.map((d) => `${d.id}(${d.data().name})`).join(', ')}\n`);

for (const oldDoc of shortBrands) {
  const oldId = oldDoc.id;
  const data = oldDoc.data();

  // 1. Yeni otomatik ID'li belge oluştur (içsel id alanını da güncelle)
  const newRef = db.collection('brands').doc();
  const newId = newRef.id;
  await newRef.set({ ...data, id: newId });
  console.log(`✓ "${data.name}" yeni belge: ${oldId} → ${newId}`);

  // 2. perfumes referanslarını güncelle (string ve sayı ihtimaline karşı)
  for (const val of [oldId, Number(oldId)]) {
    const ps = await db.collection('perfumes').where('brandId', '==', val).get();
    for (const p of ps.docs) {
      await p.ref.update({ brandId: newId });
      console.log(`   perfume "${p.data().name ?? p.id}" brandId güncellendi`);
    }
  }

  // 3. muadils referanslarını güncelle
  for (const val of [oldId, Number(oldId)]) {
    const ms = await db.collection('muadils').where('brandId', '==', val).get();
    for (const m of ms.docs) {
      await m.ref.update({ brandId: newId });
      console.log(`   muadil "${m.data().name ?? m.id}" brandId güncellendi`);
    }
  }

  // 4. Eski belgeyi sil
  await oldDoc.ref.delete();
  console.log(`   eski belge silindi: ${oldId}\n`);
}

console.log('✅ Tamamlandı. Tüm markalar otomatik ID\'ye taşındı, referanslar güncellendi.');
process.exit(0);
