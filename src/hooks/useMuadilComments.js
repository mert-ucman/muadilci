import { useState, useEffect, useMemo, useCallback } from 'react';
import { collection, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useData } from '@/contexts/DataContext';

const PAGE_SIZE = 30;
const reviewsCol = collection(db, 'reviews');
const toMs = (c) => c.createdAt?.toMillis?.() ?? (c.createdAt?.seconds ? c.createdAt.seconds * 1000 : 0);

// Bir muadile ait yorumlar. Liste DataContext'teki tam yorum listesinden süzülür:
// ziyaretçide statik reviews.json (Firestore okuması yok), staff'ta canlı liste.
// "Daha fazla göster" yalnızca client tarafındaki dilimi büyütür — eskiden her
// tıklama dinleyiciyi büyütülmüş limitle yeniden kurup önceki sayfaları
// Firestore'dan tekrar okuyordu. Toplam sayı da süzülen listeden gelir
// (getCountFromServer sorgusu kalktı).
export function useMuadilComments(muadilId, { userId, isMod, sortDir = 'desc' } = {}) {
  const { comments: allComments } = useData();
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [pendingMod, setPendingMod] = useState([]);
  const [ownReview, setOwnReview] = useState(null);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [muadilId, sortDir]);

  // Moderatör/admin diğer kullanıcıların onay bekleyen yorumlarını da görür;
  // bekleyenler her zaman az sayıda olduğundan sayfalamaya gerek yok.
  useEffect(() => {
    if (!muadilId || !isMod) { setPendingMod([]); return; }
    const q = query(reviewsCol, where('muadilId', '==', muadilId), where('status', '==', 'pending'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => setPendingMod(snap.docs.map((d) => ({ ...d.data(), id: d.id }))));
    return unsub;
  }, [muadilId, isMod]);

  // Kullanıcının kendi yorumu (onay bekliyor olsa da) — düzenleme/silme UI'ı
  // ve "zaten yorum yaptın" kontrolü statik dosyanın tazeliğinden bağımsız
  // her zaman doğru olsun (tek dokümanlık canlı sorgu)
  useEffect(() => {
    if (!muadilId || !userId) { setOwnReview(null); return; }
    const q = query(reviewsCol, where('muadilId', '==', muadilId), where('userId', '==', userId), limit(1));
    const unsub = onSnapshot(q, (snap) => setOwnReview(snap.empty ? null : { ...snap.docs[0].data(), id: snap.docs[0].id }));
    return unsub;
  }, [muadilId, userId]);

  // Bu muadilin herkese görünür yorumları (eski sürümler muadilPerfumeId yazardı)
  const approved = useMemo(() => {
    if (!muadilId) return [];
    const dir = sortDir === 'asc' ? 1 : -1;
    return allComments
      .filter((c) =>
        (c.muadilId === muadilId || c.muadilPerfumeId === muadilId) &&
        (c.status === 'approved' || c.status === 'pending_update'))
      .sort((a, b) => (toMs(a) - toMs(b)) * dir);
  }, [allComments, muadilId, sortDir]);

  // Görünür dilim + bekleyenler (mod) + kendi bekleyen yorumu tek listede
  const map = new Map();
  approved.slice(0, visibleCount).forEach((c) => map.set(c.id, c));
  pendingMod.forEach((c) => map.set(c.id, c));
  if (!isMod && ownReview?.status === 'pending' && !map.has(ownReview.id)) map.set(ownReview.id, ownReview);
  const dir = sortDir === 'asc' ? 1 : -1;
  const comments = [...map.values()].sort((a, b) => (toMs(a) - toMs(b)) * dir);

  const hasMore = approved.length > visibleCount;
  const loadMore = useCallback(() => setVisibleCount((n) => n + PAGE_SIZE), []);

  const ownPendingUncounted = !isMod && ownReview?.status === 'pending' ? 1 : 0;
  const totalCount = approved.length + (isMod ? pendingMod.length : ownPendingUncounted);

  return { comments, ownReview, hasMore, loadingMore: false, loadMore, totalCount };
}
