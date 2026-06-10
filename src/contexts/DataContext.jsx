import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import {
  collection, doc, addDoc, setDoc, updateDoc, deleteDoc,
  onSnapshot, query, orderBy, serverTimestamp, getDoc, getDocs,
  increment, writeBatch, where, arrayUnion, limit,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { deleteImageByUrl } from '@/lib/storage';
import { useAuth } from './AuthContext';

// Bir belge verisindeki tüm görsel URL'lerini toplar (logoImage + images[].src)
const collectImageUrls = (data) => {
  const urls = [];
  if (data?.logoImage) urls.push(data.logoImage);
  if (Array.isArray(data?.images)) data.images.forEach((im) => { if (im?.src) urls.push(im.src); });
  return urls;
};

const DataCtx = createContext(null);
export function useData() { return useContext(DataCtx); }

// ─── helpers ────────────────────────────────────────────────────────────────
const col = (name) => collection(db, name);
const docRef = (name, id) => doc(db, name, String(id));
const snap2arr = (snapshot) => snapshot.docs.map((d) => ({ ...d.data(), id: d.id }));

export function DataProvider({ children }) {
  const { user } = useAuth();

  const [brands, setBrands] = useState([]);
  const [perfumes, setPerfumes] = useState([]);
  const [muadilPerfumes, setMuadil] = useState([]);
  const [comments, setComments] = useState([]);
  const [users, setUsers] = useState([]);
  const [sliderImages, setSliderImages] = useState([]);
  const [faviconUrl, setFaviconUrl] = useState('');
  const [globalBrandHeaders, setGlobalBrandHeaders] = useState({ original: '', muadil: '' });
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);

  // ─── Real-time listeners ─────────────────────────────────────────────────
  useEffect(() => {
    const unsubs = [];
    let resolved = 0;
    const total = 4;
    const tryDone = () => { if (++resolved >= total) setLoading(false); };

    // Brands: küçük koleksiyon, onSnapshot kalabilir
    unsubs.push(onSnapshot(query(col('brands'), orderBy('name')), (s) => { setBrands(snap2arr(s)); tryDone(); }));

    // Perfumes ve Muadils: büyük koleksiyonlar, yalnızca başlangıçta bir kez çekiliyor.
    // Admin yazma işlemleri state'i manuel güncelliyor; real-time listener fatura şişirir.
    getDocs(query(col('perfumes'), orderBy('name'))).then((s) => { setPerfumes(snap2arr(s)); tryDone(); });
    getDocs(query(col('muadils'), orderBy('name'))).then((s) => { setMuadil(snap2arr(s)); tryDone(); });

    // Reviews: en son 200 yorum yeterli; geçmiş admin panelinden ayrıca çekiliyor
    unsubs.push(onSnapshot(query(col('reviews'), orderBy('createdAt', 'desc'), limit(200)), (s) => { setComments(snap2arr(s)); tryDone(); }));

    unsubs.push(onSnapshot(col('sliderImages'), (s) => setSliderImages(snap2arr(s).sort((a, b) => (a.order ?? 0) - (b.order ?? 0)))));
    unsubs.push(onSnapshot(doc(db, 'settings', 'site'), (s) => {
      if (s.exists()) {
        const d = s.data();
        setFaviconUrl(d.faviconUrl || '');
        setGlobalBrandHeaders({ original: d.originalBrandHeader || '', muadil: d.muadilBrandHeader || '' });
      }
    }));

    return () => unsubs.forEach((u) => u());
  }, []);

  // Tüm kullanıcı listesi yalnızca moderatör/admin için yüklenir (e-posta gibi
  // PII'nin her ziyaretçiye inmesini engeller; kurallar da bunu zorunlu kılar)
  useEffect(() => {
    const isStaff = user && (user.role === 'admin' || user.role === 'moderator');
    if (!isStaff) { setUsers([]); return; }
    const unsub = onSnapshot(col('users'), (s) => setUsers(snap2arr(s)));
    return () => unsub();
  }, [user?.uid, user?.role]);

  // ─── Brands ──────────────────────────────────────────────────────────────
  const addBrand = async (b) => {
    const ref = doc(col('brands'));
    await setDoc(ref, { ...b, id: ref.id, active: true, likes: 0, createdAt: serverTimestamp() });
  };
  const updateBrand = async (id, d) => updateDoc(docRef('brands', id), d);
  const deleteBrand = async (id, type) => {
    const batch = writeBatch(db);
    const childCol = type === 'muadil' ? 'muadils' : 'perfumes';
    const childSnap = await getDocs(query(col(childCol), where('brandId', '==', id)));
    const brandSnap = await getDoc(docRef('brands', id));
    const urls = collectImageUrls(brandSnap.exists() ? brandSnap.data() : {});
    const childIds = new Set();
    childSnap.docs.forEach((d) => { urls.push(...collectImageUrls(d.data())); batch.delete(d.ref); childIds.add(d.id); });
    batch.delete(docRef('brands', id));
    await batch.commit();
    urls.forEach(deleteImageByUrl);
    if (type === 'muadil') setMuadil((prev) => prev.filter((m) => !childIds.has(m.id)));
    else setPerfumes((prev) => prev.filter((p) => !childIds.has(p.id)));
  };

  // ─── Perfumes ─────────────────────────────────────────────────────────────
  const addPerfume = async (p) => {
    const ref = doc(col('perfumes'));
    const data = { ...p, id: ref.id, active: true, likes: 0, commentCount: 0, createdAt: serverTimestamp() };
    await setDoc(ref, data);
    setPerfumes((prev) => [...prev, { ...data, createdAt: new Date() }].sort((a, b) => a.name.localeCompare(b.name, 'tr')));
  };
  const updatePerfume = async (id, d) => {
    await updateDoc(docRef('perfumes', id), d);
    setPerfumes((prev) => prev.map((p) => p.id === id ? { ...p, ...d } : p));
  };
  const deletePerfume = async (id, withMuadils = false) => {
    const snap = await getDoc(docRef('perfumes', id));
    const urls = collectImageUrls(snap.exists() ? snap.data() : {});
    if (withMuadils) {
      const mSnaps = await getDocs(query(col('muadils'), where('targetPerfumeId', '==', id)));
      await Promise.all(mSnaps.docs.map(async (mDoc) => {
        const mUrls = collectImageUrls(mDoc.data());
        await deleteDoc(mDoc.ref);
        mUrls.forEach(deleteImageByUrl);
      }));
      setMuadil((prev) => prev.filter((m) => String(m.targetPerfumeId) !== String(id)));
    }
    await deleteDoc(docRef('perfumes', id));
    urls.forEach(deleteImageByUrl);
    setPerfumes((prev) => prev.filter((p) => p.id !== id));
  };

  // ─── Muadils ─────────────────────────────────────────────────────────────
  const addMuadil = async (m) => {
    const ref = doc(col('muadils'));
    const data = { ...m, id: ref.id, active: true, avgSimilarity: 0, avgProjection: 0, avgLongevity: 0, reviewCount: 0, createdAt: serverTimestamp() };
    await setDoc(ref, data);
    setMuadil((prev) => [...prev, { ...data, createdAt: new Date() }].sort((a, b) => a.name.localeCompare(b.name, 'tr')));
  };
  const updateMuadil = async (id, d) => {
    await updateDoc(docRef('muadils', id), d);
    setMuadil((prev) => prev.map((m) => m.id === id ? { ...m, ...d } : m));
  };
  const deleteMuadil = async (id) => {
    const snap = await getDoc(docRef('muadils', id));
    const urls = collectImageUrls(snap.exists() ? snap.data() : {});
    await deleteDoc(docRef('muadils', id));
    urls.forEach(deleteImageByUrl);
    setMuadil((prev) => prev.filter((m) => m.id !== id));
  };

  const incrementCompareCount = async (muadilId) => {
    if (!muadilId) return;
    await updateDoc(docRef('muadils', muadilId), { compareCount: increment(1) });
    setMuadil((prev) => prev.map((m) => String(m.id) === String(muadilId) ? { ...m, compareCount: (m.compareCount ?? 0) + 1 } : m));
  };

  const toggleMuadilRecommend = async (userId, muadilId, isRecommend) => {
    if (!userId || !muadilId) return;
    const ref = docRef('muadils', muadilId);
    const snap = await getDoc(ref);
    if (!snap.exists()) return;
    const data = snap.data();
    const recBy    = data.recommendedBy    ?? [];
    const notRecBy = data.notRecommendedBy ?? [];
    const uid = String(userId);
    const alreadyRec    = recBy.includes(uid);
    const alreadyNotRec = notRecBy.includes(uid);
    let newRec    = recBy;
    let newNotRec = notRecBy;
    if (isRecommend) {
      newRec    = alreadyRec    ? recBy.filter(u => u !== uid) : [...recBy, uid];
      newNotRec = notRecBy.filter(u => u !== uid);
    } else {
      newNotRec = alreadyNotRec ? notRecBy.filter(u => u !== uid) : [...notRecBy, uid];
      newRec    = recBy.filter(u => u !== uid);
    }
    await updateDoc(ref, { recommendedBy: newRec, notRecommendedBy: newNotRec });
    setMuadil((prev) => prev.map((m) => String(m.id) === String(muadilId) ? { ...m, recommendedBy: newRec, notRecommendedBy: newNotRec } : m));
  };

  const getMuadilRecommendStatus = (userId, muadilId) => {
    if (!userId) return null;
    const m = muadilPerfumes.find(x => String(x.id) === String(muadilId));
    if (!m) return null;
    const uid = String(userId);
    if ((m.recommendedBy    ?? []).includes(uid)) return true;
    if ((m.notRecommendedBy ?? []).includes(uid)) return false;
    return null;
  };

  // ─── Reviews / Comments ───────────────────────────────────────────────────
  const lastCommentAt = useRef(0);
  const COMMENT_COOLDOWN_MS = 30_000;

  const logActivity = async (type, data) => {
    try {
      await addDoc(col('activityLogs'), {
        type,
        userId: user?.uid || null,
        userName: user?.username ? `@${user.username}` : (user?.name || ''),
        userUsername: user?.username || null,
        ...data,
        createdAt: serverTimestamp(),
      });
    } catch { /* log hatası ana akışı engellemesin */ }
  };

  const addComment = async (c) => {
    const now = Date.now();
    if (now - lastCommentAt.current < COMMENT_COOLDOWN_MS) {
      const remaining = Math.ceil((COMMENT_COOLDOWN_MS - (now - lastCommentAt.current)) / 1000);
      throw Object.assign(new Error(`Çok hızlı yorum gönderiyorsunuz. ${remaining} saniye bekleyin.`), { code: 'rate-limited', remaining });
    }
    lastCommentAt.current = now;
    const muadilId = String(c.muadilPerfumeId ?? c.muadilId);
    const compositeId = `${user?.uid}_${muadilId}`;
    const ref = doc(col('reviews'), compositeId);
    await setDoc(ref, {
      ...c,
      id: compositeId,
      muadilId,
      userId: user?.uid,
      userName: user?.role === 'moderator' ? '@moderatör' : (user?.username ? `@${user.username}` : user?.name),
      userAvatar: user?.avatar,
      userPhotoURL: user?.photoURL || null,
      userRole: user?.role ?? 'user',
      status: user?.role === 'admin' ? 'approved' : 'pending',
      createdAt: serverTimestamp(),
    });

    // Moderatör/admin'e anlık bildirim
    const muadil = muadilPerfumes.find((m) => String(m.id) === muadilId);
    try {
      await addDoc(col('notifications'), {
        type: 'new_review',
        forStaff: true,
        userId: null,
        reviewId: ref.id,
        muadilId,
        muadilName: muadil ? `${muadil.brandName} ${muadil.name}` : '',
        authorName: user?.username ? `@${user.username}` : (user?.name ?? ''),
        readBy: [],
        read: false,
        createdAt: serverTimestamp(),
      });
    } catch (e) {
      // bildirim hatası yorum gönderimini engellemesin
    }

    // Aktivite logu (muadil değişkeni yukarıda zaten tanımlı)
    logActivity('review_created', {
      reviewId: ref.id,
      muadilId,
      muadilName: muadil ? `${muadil.brandName} ${muadil.name}` : '',
      targetBrandName: muadil?.targetBrandName || '',
      targetPerfumeName: muadil?.targetPerfumeName || '',
      perfumeUrl: muadil?.targetPerfumeId ? `/karsilastir?orijinal=${muadil.targetPerfumeId}&muadil=${muadil.id}` : null,
    });

    // muadil istatistiklerini güncelle
    const muadilSnap = await getDoc(docRef('muadils', muadilId));
    if (muadilSnap.exists()) {
      const data = muadilSnap.data();
      const n = (data.reviewCount ?? 0) + 1;
      const updates = {
        reviewCount: n,
        avgSimilarity: ((data.avgSimilarity ?? 0) * (n - 1) + c.similarity) / n,
        avgProjection: ((data.avgProjection ?? 0) * (n - 1) + c.projection) / n,
        avgLongevity: ((data.avgLongevity ?? 0) * (n - 1) + c.longevity) / n,
      };
      await updateDoc(docRef('muadils', muadilId), updates);
      setMuadil((prev) => prev.map((m) => String(m.id) === muadilId ? { ...m, ...updates } : m));
    }
  };

  const approveComment = async (id) => {
    const reviewSnap = await getDoc(docRef('reviews', id));
    if (!reviewSnap.exists()) return;
    const review = reviewSnap.data();

    if (review.status === 'pending_update' && review.pendingUpdate) {
      const { text, similarity, projection, longevity, recommend, submittedAt } = review.pendingUpdate;
      await updateDoc(docRef('reviews', id), {
        status: 'approved',
        text, similarity, projection, longevity,
        recommend: recommend ?? null,
        pendingUpdate: null,
        updatedAt: submittedAt ?? serverTimestamp(),
      });
      setComments((prev) => prev.map((c) => c.id === id
        ? { ...c, status: 'approved', text, similarity, projection, longevity, recommend: recommend ?? null, pendingUpdate: null }
        : c));
    } else {
      await updateDoc(docRef('reviews', id), { status: 'approved' });
      setComments((prev) => prev.map((c) => c.id === id ? { ...c, status: 'approved' } : c));
      if (review.userId && review.userId !== 'deleted') {
        try {
          const muadil = muadilPerfumes.find((m) => String(m.id) === String(review.muadilId));
          const perfumeUrl = muadil?.targetPerfumeId
            ? `/karsilastir?orijinal=${muadil.targetPerfumeId}&muadil=${muadil.id}`
            : null;
          await addDoc(col('notifications'), {
            type: 'review_approved',
            forStaff: false,
            userId: review.userId,
            reviewId: id,
            muadilId: review.muadilId || '',
            muadilName: muadil ? `${muadil.brandName} ${muadil.name}` : '',
            perfumeUrl: perfumeUrl ?? null,
            reviewCreatedAt: review.createdAt ?? null,
            read: false,
            createdAt: serverTimestamp(),
          });
        } catch {
          // bildirim hatası onayı engellemesin
        }
      }
    }
  };

  const rejectComment = async (id) => {
    const reviewSnap = await getDoc(docRef('reviews', id));
    if (!reviewSnap.exists()) return;
    const review = reviewSnap.data();
    if (review.status === 'pending_update') {
      await updateDoc(docRef('reviews', id), { status: 'approved', pendingUpdate: null });
      setComments((prev) => prev.map((c) => c.id === id ? { ...c, status: 'approved', pendingUpdate: null } : c));
      if (review.userId && review.userId !== 'deleted') {
        try {
          const muadil = muadilPerfumes.find((m) => String(m.id) === String(review.muadilId));
          const perfumeUrl = muadil?.targetPerfumeId
            ? `/karsilastir?orijinal=${muadil.targetPerfumeId}&muadil=${muadil.id}`
            : null;
          await addDoc(col('notifications'), {
            type: 'review_rejected',
            forStaff: false,
            userId: review.userId,
            reviewId: id,
            muadilId: review.muadilId || '',
            muadilName: muadil ? `${muadil.brandName} ${muadil.name}` : '',
            perfumeUrl: perfumeUrl ?? null,
            reviewCreatedAt: review.createdAt ?? null,
            read: false,
            createdAt: serverTimestamp(),
          });
        } catch {
          // bildirim hatası reddi engellemesin
        }
      }
    } else {
      await deleteDoc(docRef('reviews', id));
      setComments((prev) => prev.filter((c) => c.id !== id));
      if (review.userId && review.userId !== 'deleted') {
        try {
          const muadil = muadilPerfumes.find((m) => String(m.id) === String(review.muadilId));
          const perfumeUrl = muadil?.targetPerfumeId
            ? `/karsilastir?orijinal=${muadil.targetPerfumeId}&muadil=${muadil.id}`
            : null;
          await addDoc(col('notifications'), {
            type: 'review_rejected',
            forStaff: false,
            userId: review.userId,
            reviewId: id,
            muadilId: review.muadilId || '',
            muadilName: muadil ? `${muadil.brandName} ${muadil.name}` : '',
            perfumeUrl: perfumeUrl ?? null,
            reviewCreatedAt: review.createdAt ?? null,
            read: false,
            createdAt: serverTimestamp(),
          });
        } catch {
          // bildirim hatası reddi engellemesin
        }
      }
    }
  };

  const updateComment = async (id, data) => {
    const reviewSnap = await getDoc(docRef('reviews', id));
    if (!reviewSnap.exists()) return;
    const review = reviewSnap.data();

    if (review.status === 'pending' || user?.role === 'admin') {
      await updateDoc(docRef('reviews', id), {
        text: data.text,
        similarity: data.similarity,
        projection: data.projection,
        longevity: data.longevity,
        recommend: data.recommend ?? null,
        ...(data.originalImage !== undefined ? { originalImage: data.originalImage ?? null } : {}),
        ...(data.muadilImage !== undefined ? { muadilImage: data.muadilImage ?? null } : {}),
        ...(data.imageConsent !== undefined ? { imageConsent: !!data.imageConsent } : {}),
        ...(data.targetPerfumeId !== undefined ? { targetPerfumeId: data.targetPerfumeId ?? null } : {}),
        ...(user?.role === 'admin' ? { status: 'approved', pendingUpdate: null } : {}),
      });
    } else {
      await updateDoc(docRef('reviews', id), {
        status: 'pending_update',
        pendingUpdate: {
          text: data.text,
          similarity: data.similarity,
          projection: data.projection,
          longevity: data.longevity,
          recommend: data.recommend ?? null,
          submittedAt: serverTimestamp(),
        },
      });
      try {
        const muadilId = review.muadilId || '';
        const muadil = muadilPerfumes.find((m) => String(m.id) === muadilId);
        await addDoc(col('notifications'), {
          type: 'review_updated',
          forStaff: true,
          userId: null,
          reviewId: id,
          muadilId,
          muadilName: muadil ? `${muadil.brandName} ${muadil.name}` : '',
          authorName: user?.username ? `@${user.username}` : (user?.name ?? ''),
          readBy: [],
          read: false,
          createdAt: serverTimestamp(),
        });
      } catch {
        // bildirim hatası güncellemeyi engellemesin
      }
    }
  };

  const deleteComment = async (id) => {
    const ref = docRef('reviews', id);
    const snap = await getDoc(ref);
    if (!snap.exists()) return;
    const c = snap.data();
    if (c.userId !== user?.uid) throw new Error('Yetkisiz işlem.');
    await deleteDoc(ref);
    const muadilId = c.muadilId || String(c.muadilPerfumeId ?? '');
    if (muadilId) {
      const mSnap = await getDoc(docRef('muadils', muadilId));
      if (mSnap.exists()) {
        const newCount = Math.max(0, (mSnap.data().reviewCount ?? 1) - 1);
        await updateDoc(docRef('muadils', muadilId), { reviewCount: newCount });
        setMuadil((prev) => prev.map((m) => String(m.id) === muadilId ? { ...m, reviewCount: newCount } : m));
      }
    }
  };

  // ─── Admin: tarih aralığına göre yorum getir + silme ──────────────────────
  // Sunucuyu yormamak için tüm yorumlar değil, yalnızca seçilen aralık çekilir.
  const fetchReviewsByDateRange = async (startDate, endDate) => {
    const start = new Date(startDate); start.setHours(0, 0, 0, 0);
    const end = new Date(endDate); end.setHours(23, 59, 59, 999);
    const snap = await getDocs(query(
      col('reviews'),
      where('createdAt', '>=', start),
      where('createdAt', '<=', end),
      orderBy('createdAt', 'desc'),
    ));
    return snap2arr(snap);
  };

  // Admin: tek yorum sil (sahiplik kontrolü yok) + muadil istatistiğini düşür
  const adminDeleteReview = async (id) => {
    const ref = docRef('reviews', id);
    const snap = await getDoc(ref);
    if (!snap.exists()) return;
    const c = snap.data();
    await deleteDoc(ref);
    const muadilId = c.muadilId || String(c.muadilPerfumeId ?? '');
    if (muadilId) {
      const mSnap = await getDoc(docRef('muadils', muadilId));
      if (mSnap.exists()) {
        const newCount = Math.max(0, (mSnap.data().reviewCount ?? 1) - 1);
        await updateDoc(docRef('muadils', muadilId), { reviewCount: newCount });
        setMuadil((prev) => prev.map((m) => String(m.id) === muadilId ? { ...m, reviewCount: newCount } : m));
      }
    }
  };

  // Admin: çoklu yorum sil
  const adminDeleteReviews = async (ids) => {
    for (const id of ids) await adminDeleteReview(id);
  };

  // ─── Users ────────────────────────────────────────────────────────────────
  const updateUser = async (id, d) => {
    await updateDoc(docRef('users', id), d);
    // Herkese açık profil alanlarını (name) senkronize et
    const pub = {};
    if (d.name !== undefined) pub.name = d.name;
    if (Object.keys(pub).length) setDoc(doc(db, 'publicProfiles', id), pub, { merge: true }).catch(() => {});
  };
  const deleteUser = async (id) => {
    // 1. Kullanıcı verisini al (kullanıcı adı için)
    const userSnap = await getDoc(docRef('users', id));
    const userData = userSnap.exists() ? userSnap.data() : {};

    // 2. Kullanıcıya ait tüm yorumları bul
    const reviewsSnap = await getDocs(
      query(col('reviews'), where('userId', '==', id))
    );

    // 3. Yorumları anonimleştir (Firestore batch limiti 500 → 490'lık parçalar)
    const anonymize = {
      userName: 'Silinmiş Kullanıcı',
      userPhotoURL: null,
      userAvatar: '?',
      userId: 'deleted',
      userRole: 'user',
    };
    const reviewDocs = reviewsSnap.docs;
    for (let i = 0; i < reviewDocs.length; i += 490) {
      const chunk = reviewDocs.slice(i, i + 490);
      const b = writeBatch(db);
      chunk.forEach((d) => b.update(d.ref, anonymize));
      await b.commit();
    }

    // 4. users belgesine deleted flag ekle + usernames belgesini sil
    // (deleted flag: aynı e-postayla tekrar giriş yapılırsa oturum otomatik kapatılır)
    const b2 = writeBatch(db);
    b2.set(docRef('users', id), { deleted: true, deletedAt: serverTimestamp() }, { merge: true });
    if (userData.username) {
      b2.delete(doc(db, 'usernames', userData.username));
    }
    await b2.commit();
  };

  // ─── Notifications ───────────────────────────────────────────────────────
  const [notifPageSize, setNotifPageSize] = useState(20);
  const [notifHasMore, setNotifHasMore] = useState(false);

  useEffect(() => {
    if (!user?.uid) { setNotifications([]); setNotifHasMore(false); return; }
    const isStaff = user.role === 'admin' || user.role === 'moderator';
    const unsubs = [];
    let staffNotifs = [];
    let userNotifs = [];
    let staffMore = false;
    let userMore = false;
    const merge = () => {
      const all = [...staffNotifs, ...userNotifs];
      all.sort((a, b) => (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0));
      setNotifications(all);
      setNotifHasMore(staffMore || userMore);
    };
    if (isStaff) {
      unsubs.push(onSnapshot(
        query(col('notifications'), where('forStaff', '==', true), limit(notifPageSize)),
        (s) => {
          const raw = snap2arr(s);
          staffMore = raw.length === notifPageSize;
          staffNotifs = raw.filter((n) => !(n.clearedBy ?? []).includes(user.uid));
          merge();
        },
        () => {}
      ));
    }
    unsubs.push(onSnapshot(
      query(col('notifications'), where('userId', '==', user.uid), limit(notifPageSize)),
      (s) => {
        userNotifs = snap2arr(s);
        userMore = userNotifs.length === notifPageSize;
        merge();
      },
      () => {}
    ));
    return () => unsubs.forEach((u) => u());
  }, [user?.uid, user?.role, notifPageSize]);

  const loadMoreNotifications = () => setNotifPageSize((p) => p + 20);

  const unreadNotifCount = notifications.filter((n) => {
    if (n.forStaff) return !(n.readBy ?? []).includes(user?.uid);
    return !n.read;
  }).length;

  const markNotificationRead = async (id) => {
    const notif = notifications.find((n) => n.id === id);
    if (!notif) return;
    if (notif.forStaff) {
      await updateDoc(docRef('notifications', id), { readBy: arrayUnion(user.uid) });
    } else {
      await updateDoc(docRef('notifications', id), { read: true });
    }
  };

  const markAllNotificationsRead = async () => {
    const unread = notifications.filter((n) => {
      if (n.forStaff) return !(n.readBy ?? []).includes(user?.uid);
      return !n.read;
    });
    await Promise.all(unread.map((n) => markNotificationRead(n.id)));
  };

  const clearAllNotifications = async () => {
    const personal = notifications.filter((n) => !n.forStaff);
    const staff    = notifications.filter((n) => n.forStaff);
    await Promise.all([
      ...personal.map((n) => deleteDoc(docRef('notifications', n.id))),
      ...staff.map((n) => updateDoc(docRef('notifications', n.id), {
        readBy: arrayUnion(user.uid),
        clearedBy: arrayUnion(user.uid),
      })),
    ]);
  };

  // ─── Favorites ────────────────────────────────────────────────────────────
  // Favori state'leri kullanıcı uid'si ile takip et
  const [brandFavorites, setBrandFavorites] = useState({});
  const [perfumeFavorites, setPerfumeFavorites] = useState({});
  const [muadilFavorites, setMuadilFavorites] = useState({});
  const [compFavorites, setCompFavorites] = useState({});

  // Kullanıcı değişince favorileri Firestore'dan çek
  useEffect(() => {
    if (!user?.uid) {
      setBrandFavorites({});
      setPerfumeFavorites({});
      setMuadilFavorites({});
      setCompFavorites({});
      return;
    }
    const ref = docRef('users', user.uid);
    const unsub = onSnapshot(ref, (snap) => {
      if (!snap.exists()) return;
      const d = snap.data();
      setBrandFavorites((p) => ({ ...p, [user.uid]: d.favBrands ?? [] }));
      setPerfumeFavorites((p) => ({ ...p, [user.uid]: d.favPerfumes ?? [] }));
      setMuadilFavorites((p) => ({ ...p, [user.uid]: d.favMuadils ?? [] }));
      setCompFavorites((p) => ({ ...p, [user.uid]: d.favComps ?? [] }));
    });
    return () => unsub();
  }, [user?.uid]);

  const makeFavToggle = useCallback((field, stateSetter, targetCol) => async (userId, itemId) => {
    if (!userId) return;
    const ref = docRef('users', userId);
    const snap = await getDoc(ref);
    if (!snap.exists()) return;
    const cur = snap.data()[field] ?? [];
    const adding = !cur.includes(String(itemId));
    const next = adding ? [...cur, String(itemId)] : cur.filter((x) => x !== String(itemId));
    const batch = writeBatch(db);
    batch.update(ref, { [field]: next });
    if (targetCol) batch.update(docRef(targetCol, String(itemId)), { likes: increment(adding ? 1 : -1) });
    await batch.commit();
    const delta = adding ? 1 : -1;
    if (targetCol === 'perfumes') setPerfumes((prev) => prev.map((p) => String(p.id) === String(itemId) ? { ...p, likes: (p.likes ?? 0) + delta } : p));
    else if (targetCol === 'muadils') setMuadil((prev) => prev.map((m) => String(m.id) === String(itemId) ? { ...m, likes: (m.likes ?? 0) + delta } : m));
  }, []);

  const toggleBrandFavorite = useCallback(makeFavToggle('favBrands', setBrandFavorites, 'brands'), [makeFavToggle]);
  const togglePerfumeFavorite = useCallback(makeFavToggle('favPerfumes', setPerfumeFavorites, 'perfumes'), [makeFavToggle]);
  const toggleMuadilFavorite = useCallback(makeFavToggle('favMuadils', setMuadilFavorites, 'muadils'), [makeFavToggle]);

  const compKey = (origId, muadilId) => `${origId}_${muadilId}`;
  const toggleCompFavorite = useCallback(async (userId, origId, muadilId) => {
    if (!userId) return;
    const key = compKey(origId, muadilId);
    const ref = docRef('users', userId);
    const snap = await getDoc(ref);
    if (!snap.exists()) return;
    const cur = snap.data().favComps ?? [];
    const next = cur.includes(key) ? cur.filter((k) => k !== key) : [...cur, key];
    await updateDoc(ref, { favComps: next });
  }, []);

  const isBrandFavorite = (uid, id) => !!(uid && (brandFavorites[uid] ?? []).includes(id));
  const isPerfumeFavorite = (uid, id) => !!(uid && (perfumeFavorites[uid] ?? []).includes(id));
  const isMuadilFavorite = (uid, id) => !!(uid && (muadilFavorites[uid] ?? []).includes(id));
  const isCompFavorite = (uid, origId, muadilId) => !!(uid && (compFavorites[uid] ?? []).includes(compKey(origId, muadilId)));

  const getUserFavoriteBrands = (uid) => brandFavorites[uid] ?? [];
  const getUserFavoritePerfumes = (uid) => perfumeFavorites[uid] ?? [];
  const getUserFavoriteMuadils = (uid) => muadilFavorites[uid] ?? [];
  const getUserFavoriteComps = (uid) =>
    (compFavorites[uid] ?? []).map((k) => { const [oId, mId] = k.split('_'); return { origId: oId, muadilId: mId }; });

  // ─── Site settings ───────────────────────────────────────────────────────
  const updateFavicon = async (url) => {
    await setDoc(doc(db, 'settings', 'site'), { faviconUrl: url }, { merge: true });
  };
  const updateBrandGlobalHeader = async (type, url) => {
    const field = type === 'original' ? 'originalBrandHeader' : 'muadilBrandHeader';
    await setDoc(doc(db, 'settings', 'site'), { [field]: url ?? null }, { merge: true });
  };

  // ─── Slider images ────────────────────────────────────────────────────────
  const MAX_SLIDER = 10;
  const MAX_SIZE_MB = 2;

  const addSliderImage = async (img) => {
    if (sliderImages.length >= MAX_SLIDER) return;
    const ref = doc(col('sliderImages'));
    await setDoc(ref, { ...img, id: ref.id, order: sliderImages.length, createdAt: serverTimestamp() });
  };
  const removeSliderImage = async (id) => {
    const img = sliderImages.find((i) => i.id === id);
    await deleteDoc(docRef('sliderImages', id));
    if (img?.src) deleteImageByUrl(img.src);
  };
  const updateSliderImage = async (id, data) => updateDoc(docRef('sliderImages', id), data);
  const reorderSliderImages = async (imgs) => {
    const batch = writeBatch(db);
    imgs.forEach((img, i) => batch.update(docRef('sliderImages', img.id), { order: i }));
    await batch.commit();
  };

  return (
    <DataCtx.Provider value={{
      brands, perfumes, muadilPerfumes, comments, users, sliderImages,
      loading,
      addBrand, updateBrand, deleteBrand,
      addPerfume, updatePerfume, deletePerfume,
      addMuadil, updateMuadil, deleteMuadil,
      refreshPerfumes: () => getDocs(query(col('perfumes'), orderBy('name'))).then((s) => setPerfumes(snap2arr(s))),
      refreshMuadils: () => getDocs(query(col('muadils'), orderBy('name'))).then((s) => setMuadil(snap2arr(s))),
      notifications, unreadNotifCount, notifHasMore,
      markNotificationRead, markAllNotificationsRead,
      loadMoreNotifications, clearAllNotifications,
      logActivity, addComment, approveComment, rejectComment, deleteComment, updateComment,
      fetchReviewsByDateRange, adminDeleteReview, adminDeleteReviews,
      incrementCompareCount, toggleMuadilRecommend, getMuadilRecommendStatus,
      updateUser, deleteUser,
      brandFavorites, toggleBrandFavorite, isBrandFavorite, getUserFavoriteBrands,
      togglePerfumeFavorite, isPerfumeFavorite, getUserFavoritePerfumes,
      toggleMuadilFavorite, isMuadilFavorite, getUserFavoriteMuadils,
      toggleCompFavorite, isCompFavorite, getUserFavoriteComps,
      addSliderImage, removeSliderImage, updateSliderImage, reorderSliderImages,
      MAX_SLIDER, MAX_SIZE_MB,
      faviconUrl, updateFavicon,
      globalBrandHeaders, updateBrandGlobalHeader,
    }}>
      {children}
    </DataCtx.Provider>
  );
}
