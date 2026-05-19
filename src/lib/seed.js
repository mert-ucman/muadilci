import { collection, doc, writeBatch, getDocs, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';
import { INIT_BRANDS, INIT_PERFUMES, INIT_MUADIL } from '@/data/mockData';

async function collectionEmpty(colName) {
  const snap = await getDocs(collection(db, colName));
  return snap.empty;
}

// Firestore'a batch yazma limiti 500 — büyük veri setlerinde parçalara böl
async function commitBatches(writes) {
  const CHUNK = 400;
  for (let i = 0; i < writes.length; i += CHUNK) {
    const batch = writeBatch(db);
    writes.slice(i, i + CHUNK).forEach(({ ref, data }) => batch.set(ref, data));
    await batch.commit();
  }
}

export async function seedFirestore() {
  const writes = [];

  if (await collectionEmpty('brands')) {
    for (const b of INIT_BRANDS) {
      writes.push({
        ref: doc(db, 'brands', String(b.id)),
        data: { ...b, id: String(b.id), createdAt: serverTimestamp() },
      });
    }
  }

  if (await collectionEmpty('perfumes')) {
    for (const p of INIT_PERFUMES) {
      writes.push({
        ref: doc(db, 'perfumes', String(p.id)),
        data: { ...p, id: String(p.id), brandId: String(p.brandId), createdAt: serverTimestamp() },
      });
    }
  }

  if (await collectionEmpty('muadils')) {
    for (const m of INIT_MUADIL) {
      writes.push({
        ref: doc(db, 'muadils', String(m.id)),
        data: {
          ...m,
          id: String(m.id),
          brandId: String(m.brandId),
          targetPerfumeId: String(m.targetPerfumeId),
          avgSimilarity: 0,
          avgProjection: 0,
          avgLongevity: 0,
          reviewCount: 0,
          createdAt: serverTimestamp(),
        },
      });
    }
  }

  if (!writes.length) return 0;
  await commitBatches(writes);
  return writes.length;
}
