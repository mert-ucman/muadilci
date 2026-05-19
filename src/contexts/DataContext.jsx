import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  collection, doc, addDoc, setDoc, updateDoc, deleteDoc,
  onSnapshot, query, orderBy, serverTimestamp, getDoc, getDocs,
  increment, writeBatch, where,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from './AuthContext';

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

  // Admin: users listesi
  useEffect(() => {
    if (!user || (user.role !== 'admin' && user.role !== 'moderator')) return;
    const unsub = onSnapshot(col('users'), (s) => setUsers(snap2arr(s)));
    return () => unsub();
  }, [user?.role]);

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
    childSnap.docs.forEach((d) => batch.delete(d.ref));
    batch.delete(docRef('brands', id));
    await batch.commit();
  };

  // ─── Perfumes ─────────────────────────────────────────────────────────────
  const addPerfume = async (p) => {
    const ref = doc(col('perfumes'));
    await setDoc(ref, { ...p, id: ref.id, active: true, likes: 0, commentCount: 0, createdAt: serverTimestamp() });
  };
  const updatePerfume = async (id, d) => updateDoc(docRef('perfumes', id), d);
  const deletePerfume = async (id) => deleteDoc(docRef('perfumes', id));

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
  const deleteMuadil = async (id) => deleteDoc(docRef('muadils', id));

  // ─── Reviews / Comments ───────────────────────────────────────────────────
  const addComment = async (c) => {
    const ref = doc(col('reviews'));
    await setDoc(ref, {
      ...c,
      id: ref.id,
      muadilId: String(c.muadilPerfumeId ?? c.muadilId),
      userId: user?.uid,
      userName: user?.username ? `@${user.username}` : user?.name,
      userAvatar: user?.avatar,
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

  // ─── Users ────────────────────────────────────────────────────────────────
  const updateUser = async (id, d) => updateDoc(docRef('users', id), d);
  const deleteUser = async (id) => deleteDoc(docRef('users', id));

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
  const removeSliderImage = async (id) => deleteDoc(docRef('sliderImages', id));
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
      addComment, approveComment, rejectComment,
      updateUser, deleteUser,
      brandFavorites, toggleBrandFavorite, isBrandFavorite, getUserFavoriteBrands,
      togglePerfumeFavorite, isPerfumeFavorite, getUserFavoritePerfumes,
      toggleMuadilFavorite, isMuadilFavorite, getUserFavoriteMuadils,
      toggleCompFavorite, isCompFavorite, getUserFavoriteComps,
      addSliderImage, removeSliderImage, reorderSliderImages,
      MAX_SLIDER, MAX_SIZE_MB,
    }}>
      {children}
    </DataCtx.Provider>
  );
}
