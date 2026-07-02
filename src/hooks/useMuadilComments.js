import { useState, useEffect, useCallback } from 'react';
import { collection, query, where, orderBy, limit, onSnapshot, getCountFromServer } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const PAGE_SIZE = 30;
const reviewsCol = collection(db, 'reviews');
const toMs = (c) => c.createdAt?.toMillis?.() ?? (c.createdAt?.seconds ? c.createdAt.seconds * 1000 : 0);

// Tek bir karşılaştırmaya (muadil) ait yorumları global 200 limitli listeden
// bağımsız, kendi sayfalanan sorgusuyla getirir. İlk 30 yorum gelir, loadMore()
// her çağrıldığında limit 30 artırılıp aynı sorgu yeniden dinlenir — bu sayede
// yorum sayısı binleri bulsa da her zaman ihtiyaç kadarı çekilir.
export function useMuadilComments(muadilId, { userId, isMod, sortDir = 'desc' } = {}) {
  const [items, setItems] = useState([]);
  const [pendingMod, setPendingMod] = useState([]);
  const [ownReview, setOwnReview] = useState(null);
  const [limitCount, setLimitCount] = useState(PAGE_SIZE);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [totalCount, setTotalCount] = useState(null);

  useEffect(() => {
    setLimitCount(PAGE_SIZE);
    setHasMore(true);
  }, [muadilId, sortDir]);

  // Onaylı + güncelleme bekleyen yorumlar — herkese görünür, sayfalanan liste
  useEffect(() => {
    if (!muadilId) { setItems([]); return; }
    const q = query(reviewsCol,
      where('muadilId', '==', muadilId),
      where('status', 'in', ['approved', 'pending_update']),
      orderBy('createdAt', sortDir),
      limit(limitCount));
    const unsub = onSnapshot(q, (snap) => {
      const docs = snap.docs.map((d) => ({ ...d.data(), id: d.id }));
      setItems(docs);
      setHasMore(docs.length >= limitCount);
      setLoadingMore(false);
    });
    return unsub;
  }, [muadilId, limitCount, sortDir]);

  // Moderatör/admin diğer kullanıcıların onay bekleyen yorumlarını da görür;
  // bekleyenler her zaman az sayıda olduğundan ayrıca sayfalamaya gerek yok.
  useEffect(() => {
    if (!muadilId || !isMod) { setPendingMod([]); return; }
    const q = query(reviewsCol, where('muadilId', '==', muadilId), where('status', '==', 'pending'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => setPendingMod(snap.docs.map((d) => ({ ...d.data(), id: d.id }))));
    return unsub;
  }, [muadilId, isMod]);

  // Kullanıcının kendi yorumu (onay bekliyor olsa da) — düzenleme/silme UI'ı
  // ve "zaten yorum yaptın" kontrolü sayfalamadan bağımsız her zaman doğru olsun
  useEffect(() => {
    if (!muadilId || !userId) { setOwnReview(null); return; }
    const q = query(reviewsCol, where('muadilId', '==', muadilId), where('userId', '==', userId), limit(1));
    const unsub = onSnapshot(q, (snap) => setOwnReview(snap.empty ? null : { ...snap.docs[0].data(), id: snap.docs[0].id }));
    return unsub;
  }, [muadilId, userId]);

  // Başlıktaki toplam sayı için tek seferlik agregasyon sorgusu (doküman içeriği çekilmez)
  useEffect(() => {
    if (!muadilId) { setTotalCount(null); return; }
    let alive = true;
    const q = isMod
      ? query(reviewsCol, where('muadilId', '==', muadilId))
      : query(reviewsCol, where('muadilId', '==', muadilId), where('status', 'in', ['approved', 'pending_update']));
    getCountFromServer(q).then((snap) => { if (alive) setTotalCount(snap.data().count); }).catch(() => { if (alive) setTotalCount(null); });
    return () => { alive = false; };
  }, [muadilId, isMod]);

  const loadMore = useCallback(() => {
    setLoadingMore(true);
    setLimitCount((n) => n + PAGE_SIZE);
  }, []);

  const map = new Map();
  items.forEach((c) => map.set(c.id, c));
  pendingMod.forEach((c) => map.set(c.id, c));
  if (!isMod && ownReview?.status === 'pending' && !map.has(ownReview.id)) map.set(ownReview.id, ownReview);
  const dir = sortDir === 'asc' ? 1 : -1;
  const comments = [...map.values()].sort((a, b) => (toMs(a) - toMs(b)) * dir);

  const ownPendingUncounted = !isMod && ownReview?.status === 'pending' ? 1 : 0;
  const displayTotal = totalCount != null ? totalCount + ownPendingUncounted : comments.length;

  return { comments, ownReview, hasMore, loadingMore, loadMore, totalCount: displayTotal };
}
