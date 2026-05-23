import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  collection, doc, addDoc, setDoc, updateDoc, deleteDoc,
  onSnapshot, query, orderBy, serverTimestamp, getDoc, getDocs,
  increment, writeBatch, where,
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
  const [loading, setLoading] = useState(true);

  // ─── Real-time listeners ─────────────────────────────────────────────────
  useEffect(() => {
    const unsubs = [];
    let resolved = 0;
    const total = 4;
    const tryDone = () => { if (++resolved >= total) setLoading(false); };

    unsubs.push(onSnapshot(query(col('brands'), orderBy('name')), (s) => { setBrands(snap2arr(s)); tryDone(); }));
    unsubs.push(onSnapshot(query(col('perfumes'), orderBy('name')), (s) => { setPerfumes(snap2arr(s)); tryDone(); }));
    unsubs.push(onSnapshot(query(col('muadils'), orderBy('name')), (s) => { setMuadil(snap2arr(s)); tryDone(); }));
    unsubs.push(onSnapshot(query(col('reviews'), orderBy('createdAt', 'desc')), (s) => { setComments(snap2arr(s)); tryDone(); }));
    unsubs.push(onSnapshot(col('sliderImages'), (s) => setSliderImages(snap2arr(s).sort((a, b) => (a.order ?? 0) - (b.order ?? 0)))));

    return () => unsubs.forEach((u) => u());
  }, []);

  // Tüm kullanıcı listesi yalnızca moderatör/admin için yüklenir (e-posta gibi
  // PII'nin her ziyaretçiye inmesini engeller; kurallar da bunu zorunlu kılar)
  useEffect(() => {
    const isStaff = user && (user.role === 'admin' || user.role === 'moderator');
    if (!isStaff) { setUsers([]); return; }
    const unsub = onSnapshot(col('users'), (s) => setUsers(snap2arr(s).filter((u) => !u.deleted)));
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
    // Silinecek görselleri topla (marka logosu + alt parfüm görselleri)
    const brandSnap = await getDoc(docRef('brands', id));
    const urls = collectImageUrls(brandSnap.exists() ? brandSnap.data() : {});
    childSnap.docs.forEach((d) => { urls.push(...collectImageUrls(d.data())); batch.delete(d.ref); });
    batch.delete(docRef('brands', id));
    await batch.commit();
    urls.forEach(deleteImageByUrl); // Storage temizliği (best-effort)
  };

  // ─── Perfumes ─────────────────────────────────────────────────────────────
  const addPerfume = async (p) => {
    const ref = doc(col('perfumes'));
    await setDoc(ref, { ...p, id: ref.id, active: true, likes: 0, commentCount: 0, createdAt: serverTimestamp() });
  };
  const updatePerfume = async (id, d) => updateDoc(docRef('perfumes', id), d);
  const deletePerfume = async (id) => {
    const snap = await getDoc(docRef('perfumes', id));
    const urls = collectImageUrls(snap.exists() ? snap.data() : {});
    await deleteDoc(docRef('perfumes', id));
    urls.forEach(deleteImageByUrl);
  };

  // ─── Muadils ─────────────────────────────────────────────────────────────
  const addMuadil = async (m) => {
    const ref = doc(col('muadils'));
    await setDoc(ref, {
      ...m, id: ref.id, active: true,
      avgSimilarity: 0, avgProjection: 0, avgLongevity: 0, reviewCount: 0,
      createdAt: serverTimestamp(),
    });
  };
  const updateMuadil = async (id, d) => updateDoc(docRef('muadils', id), d);
  const deleteMuadil = async (id) => {
    const snap = await getDoc(docRef('muadils', id));
    const urls = collectImageUrls(snap.exists() ? snap.data() : {});
    await deleteDoc(docRef('muadils', id));
    urls.forEach(deleteImageByUrl);
  };

  const incrementCompareCount = async (muadilId) => {
    if (!muadilId) return;
    await updateDoc(docRef('muadils', muadilId), { compareCount: increment(1) });
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
  const addComment = async (c) => {
    const ref = doc(col('reviews'));
    await setDoc(ref, {
      ...c,
      id: ref.id,
      muadilId: String(c.muadilPerfumeId ?? c.muadilId),
      userId: user?.uid,
      userName: user?.role === 'moderator' ? '@moderatör' : (user?.username ? `@${user.username}` : user?.name),
      userAvatar: user?.avatar,
      userPhotoURL: user?.photoURL || null,
      userRole: user?.role ?? 'user',
      status: 'pending',
      createdAt: serverTimestamp(),
    });

    // muadil istatistiklerini güncelle
    const muadilId = String(c.muadilPerfumeId ?? c.muadilId);
    const muadilSnap = await getDoc(docRef('muadils', muadilId));
    if (muadilSnap.exists()) {
      const data = muadilSnap.data();
      const n = (data.reviewCount ?? 0) + 1;
      await updateDoc(docRef('muadils', muadilId), {
        reviewCount: n,
        avgSimilarity: ((data.avgSimilarity ?? 0) * (n - 1) + c.similarity) / n,
        avgProjection: ((data.avgProjection ?? 0) * (n - 1) + c.projection) / n,
        avgLongevity: ((data.avgLongevity ?? 0) * (n - 1) + c.longevity) / n,
      });
    }
  };

  const approveComment = async (id) => updateDoc(docRef('reviews', id), { status: 'approved' });
  const rejectComment = async (id) => deleteDoc(docRef('reviews', id));

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
        await updateDoc(docRef('muadils', muadilId), { reviewCount: Math.max(0, (mSnap.data().reviewCount ?? 1) - 1) });
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
        await updateDoc(docRef('muadils', muadilId), { reviewCount: Math.max(0, (mSnap.data().reviewCount ?? 1) - 1) });
      }
    }
  };

  // Admin: çoklu yorum sil
  const adminDeleteReviews = async (ids) => {
    for (const id of ids) await adminDeleteReview(id);
  };

  // ─── Users ────────────────────────────────────────────────────────────────
  const updateUser = async (id, d) => updateDoc(docRef('users', id), d);
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
    b2.set(docRef('users', id), { deleted: true }, { merge: true });
    if (userData.username) {
      b2.delete(doc(db, 'usernames', userData.username));
    }
    await b2.commit();
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
      addComment, approveComment, rejectComment, deleteComment,
      fetchReviewsByDateRange, adminDeleteReview, adminDeleteReviews,
      incrementCompareCount, toggleMuadilRecommend, getMuadilRecommendStatus,
      updateUser, deleteUser,
      brandFavorites, toggleBrandFavorite, isBrandFavorite, getUserFavoriteBrands,
      togglePerfumeFavorite, isPerfumeFavorite, getUserFavoritePerfumes,
      toggleMuadilFavorite, isMuadilFavorite, getUserFavoriteMuadils,
      toggleCompFavorite, isCompFavorite, getUserFavoriteComps,
      addSliderImage, removeSliderImage, updateSliderImage, reorderSliderImages,
      MAX_SLIDER, MAX_SIZE_MB,
    }}>
      {children}
    </DataCtx.Provider>
  );
}
