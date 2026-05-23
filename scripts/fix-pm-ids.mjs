/**
 * Kısa/sayısal ID'li perfumes ve muadils belgelerini otomatik üretilen ID'lere taşır.
 * Tüm referansları günceller:
 *   perfumes → muadils.targetPerfumeId, users.favPerfumes, users.favComps (origId kısmı)
 *   muadils  → reviews.muadilId & muadilPerfumeId, users.favMuadils, users.favComps (muadilId kısmı)
 * Veri kaybı olmaz; tüm alanlar birebir taşınır.
 *
 * Kullanım: node scripts/fix-pm-ids.mjs
 */
import { readFileSync } from 'fs';
import admin from 'firebase-admin';

const sa = JSON.parse(readFileSync('C:/Users/win10/Downloads/muadilci-890e4-firebase-adminsdk-fbsvc-b145eb6842.json', 'utf8'));
admin.initializeApp({ credential: admin.credential.cert(sa) });
const db = admin.firestore();

const isShort = (id) => /^\d{1,4}$/.test(id);
const eq = (a, b) => String(a) === String(b);

// Tüm user belgelerini önceden çek (favori güncellemeleri için)
const usersSnap = await db.collection('users').get();

// ──────────────────────────────────────────────────────────────────────────
// 1) PERFUMES
// ──────────────────────────────────────────────────────────────────────────
const perfSnap = await db.collection('perfumes').get();
const perfShort = perfSnap.docs.filter((d) => isShort(d.id));
const perfMap = {}; // oldId -> newId

console.log(`\n=== PERFUMES (${perfShort.length} düzeltilecek) ===`);
for (const oldDoc of perfShort) {
  const oldId = oldDoc.id;
  const data = oldDoc.data();
  const newRef = db.collection('perfumes').doc();
  const newId = newRef.id;
  await newRef.set({ ...data, id: newId });
  perfMap[oldId] = newId;
  console.log(`✓ "${data.name}" ${oldId} → ${newId}`);
}

// perfumes referanslarını güncelle
for (const [oldId, newId] of Object.entries(perfMap)) {
  // muadils.targetPerfumeId (string + number)
  for (const val of [oldId, Number(oldId)]) {
    const ms = await db.collection('muadils').where('targetPerfumeId', '==', val).get();
    for (const m of ms.docs) {
      await m.ref.update({ targetPerfumeId: newId });
      console.log(`   muadil "${m.data().name ?? m.id}" targetPerfumeId ${oldId}→${newId}`);
    }
  }
}

// ──────────────────────────────────────────────────────────────────────────
// 2) MUADILS  (targetPerfumeId güncellemesi sonrası tekrar oku!)
// ──────────────────────────────────────────────────────────────────────────
const muadSnap = await db.collection('muadils').get();
const muadShort = muadSnap.docs.filter((d) => isShort(d.id));
const muadMap = {}; // oldId -> newId

console.log(`\n=== MUADILS (${muadShort.length} düzeltilecek) ===`);
for (const oldDoc of muadShort) {
  const oldId = oldDoc.id;
  const data = oldDoc.data();
  const newRef = db.collection('muadils').doc();
  const newId = newRef.id;
  await newRef.set({ ...data, id: newId });
  muadMap[oldId] = newId;
  console.log(`✓ "${data.name}" ${oldId} → ${newId}`);
}

// muadils referanslarını güncelle (reviews)
for (const [oldId, newId] of Object.entries(muadMap)) {
  for (const field of ['muadilId', 'muadilPerfumeId']) {
    for (const val of [oldId, Number(oldId)]) {
      const rs = await db.collection('reviews').where(field, '==', val).get();
      for (const r of rs.docs) {
        await r.ref.update({ [field]: newId });
        console.log(`   review ${r.id} ${field} ${oldId}→${newId}`);
      }
    }
  }
}

// ──────────────────────────────────────────────────────────────────────────
// 3) USER FAVORİLERİ (favPerfumes, favMuadils, favComps)
// ──────────────────────────────────────────────────────────────────────────
console.log(`\n=== USER FAVORİLERİ ===`);
for (const uDoc of usersSnap.docs) {
  const d = uDoc.data();
  const update = {};

  if (Array.isArray(d.favPerfumes)) {
    const next = d.favPerfumes.map((x) => perfMap[String(x)] ?? x);
    if (JSON.stringify(next) !== JSON.stringify(d.favPerfumes)) update.favPerfumes = next;
  }
  if (Array.isArray(d.favMuadils)) {
    const next = d.favMuadils.map((x) => muadMap[String(x)] ?? x);
    if (JSON.stringify(next) !== JSON.stringify(d.favMuadils)) update.favMuadils = next;
  }
  if (Array.isArray(d.favComps)) {
    const next = d.favComps.map((k) => {
      const [oId, mId] = String(k).split('_');
      return `${perfMap[oId] ?? oId}_${muadMap[mId] ?? mId}`;
    });
    if (JSON.stringify(next) !== JSON.stringify(d.favComps)) update.favComps = next;
  }

  if (Object.keys(update).length) {
    await uDoc.ref.update(update);
    console.log(`   user ${uDoc.id} favorileri güncellendi: ${Object.keys(update).join(', ')}`);
  }
}

// ──────────────────────────────────────────────────────────────────────────
// 4) ESKİ BELGELERİ SİL
// ──────────────────────────────────────────────────────────────────────────
console.log(`\n=== ESKİ BELGELER SİLİNİYOR ===`);
for (const oldId of Object.keys(perfMap)) {
  await db.collection('perfumes').doc(oldId).delete();
  console.log(`   perfume ${oldId} silindi`);
}
for (const oldId of Object.keys(muadMap)) {
  await db.collection('muadils').doc(oldId).delete();
  console.log(`   muadil ${oldId} silindi`);
}

console.log('\n✅ Tamamlandı.');
process.exit(0);
