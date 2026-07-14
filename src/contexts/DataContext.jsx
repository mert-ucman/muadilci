import { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  collection, doc, addDoc, setDoc, updateDoc, deleteDoc,
  onSnapshot, query, orderBy, serverTimestamp, getDoc, getDocs,
  increment, writeBatch, where, arrayUnion, arrayRemove, limit,
} from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { db } from '@/lib/firebase';
import { deleteImageByUrl } from '@/lib/storage';
import { useAuth } from './AuthContext';
import { useRouter } from './RouterContext';

// Yorum gönderimi sunucu tarafı korumalı callable üzerinden yapılır
const submitReviewFn = httpsCallable(getFunctions(undefined, 'us-central1'), 'submitReview');

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

// ─── localStorage cache (30 dk TTL) ─────────────────────────────────────────
const CACHE_TTL = 30 * 60 * 1000;

// Timestamp'ler hem localStorage cache'inde hem statik katalog JSON'unda
// {_ts:true, s, n} olarak saklanır — okurken Firestore Timestamp benzeri objeye çevrilir
const tsReviver = (_k, v) => {
  if (v && typeof v === 'object' && v._ts)
    return { seconds: v.s, nanoseconds: v.n, toDate: () => new Date(v.s * 1000) };
  return v;
};

function cacheRead(key) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw, tsReviver);
    if (Date.now() - parsed.ts > CACHE_TTL) return null;
    return parsed.data;
  } catch { return null; }
}

// ─── Statik katalog ──────────────────────────────────────────────────────────
// Cloud Function (rebuildCatalogCron) public koleksiyonları Storage'a tek JSON
// olarak yazar; ziyaretçiler Firestore yerine bunu indirir. Doküman başına
// okuma ücreti yok — yalnızca staff canlı Firestore dinler (admin panel anlık).
const catalogFileUrl = (name) =>
  `https://firebasestorage.googleapis.com/v0/b/${import.meta.env.VITE_FIREBASE_STORAGE_BUCKET}/o/${encodeURIComponent(`catalog/${name}`)}?alt=media`;
const CATALOG_URL = catalogFileUrl('catalog.json');
const REVIEWS_URL = catalogFileUrl('reviews.json');

function cacheWrite(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify({ ts: Date.now(), data }, (_k, v) => {
      if (v && typeof v === 'object' && typeof v.seconds === 'number' && typeof v.toDate === 'function')
        return { _ts: true, s: v.seconds, n: v.nanoseconds ?? 0 };
      return v;
    }));
  } catch { /* localStorage kotası dolmuş olabilir */ }
}

export function DataProvider({ children }) {
  const { user } = useAuth();
  const { path } = useRouter();

  const [brands, setBrands] = useState([]);
  const [perfumes, setPerfumes] = useState([]);
  const [muadilPerfumes, setMuadil] = useState([]);
  // Yorum kaynakları: statik dosya (herkes) + kendi yorumları (üye) + canlı 200 (staff)
  const [catalogComments, setCatalogComments] = useState([]);
  const [ownComments, setOwnComments] = useState([]);
  const [staffComments, setStaffComments] = useState(null);
  const [users, setUsers] = useState([]);
  const [sliderImages, setSliderImages] = useState([]);
  const [landingImages, setLandingImages] = useState({});
  const [faviconUrl, setFaviconUrl] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [footerLogoUrl, setFooterLogoUrl] = useState('');
  const [globalBrandHeaders, setGlobalBrandHeaders] = useState({ original: '', muadil: '' });
  const [catalogReady, setCatalogReady] = useState(false);
  const [reviewsReady, setReviewsReady] = useState(false);
  const loading = !(catalogReady && reviewsReady);
  const [notifications, setNotifications] = useState([]);

  const isStaff = user?.role === 'admin' || user?.role === 'moderator';
  const isAdminRoute = path.startsWith('/admin');

  // Katalog payload'ını (statik JSON, localStorage cache'i veya Firestore
  // fallback'i) state'lere uygular — üç kaynak da aynı şekli kullanır
  const applyCatalog = (c) => {
    if (Array.isArray(c.brands)) setBrands(c.brands);
    if (Array.isArray(c.perfumes)) setPerfumes(c.perfumes);
    if (Array.isArray(c.muadils)) setMuadil(c.muadils);
    if (Array.isArray(c.sliderImages))
      setSliderImages([...c.sliderImages].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)));
    const site = c.settingsSite;
    if (site) {
      setFaviconUrl(site.faviconUrl || '');
      setLogoUrl(site.logoUrl || '');
      setFooterLogoUrl(site.footerLogoUrl || '');
      setGlobalBrandHeaders({ original: site.originalBrandHeader || '', muadil: site.muadilBrandHeader || '' });
    }
    setLandingImages(c.settingsLandingImages ?? {});
  };

  // ─── Katalog: ziyaretçi statik JSON okur, Firestore'a hiç dokunmaz ────────
  useEffect(() => {
    let cancelled = false;

    // Eski cache anahtarları artık kullanılmıyor — yer kaplamasın
    try { ['mc_brands', 'mc_perfumes', 'mc_muadils'].forEach((k) => localStorage.removeItem(k)); } catch { /* noop */ }

    // Cache'den anında boya (varsa); fetch sonucu gelince üzerine yazılır
    const cached = cacheRead('mc_catalog');
    if (cached) applyCatalog(cached);

    (async () => {
      try {
        const res = await fetch(CATALOG_URL);
        if (!res.ok) throw new Error(`catalog ${res.status}`);
        const catalog = JSON.parse(await res.text(), tsReviver);
        if (cancelled) return;
        applyCatalog(catalog);
        cacheWrite('mc_catalog', catalog);
      } catch {
        // Katalog henüz üretilmemiş / erişilemedi → eski yol: Firestore'dan tek seferlik oku
        if (cancelled) return;
        try {
          const [bSnap, pSnap, mSnap, sSnap, siteSnap, landSnap] = await Promise.all([
            getDocs(query(col('brands'), orderBy('name'))),
            getDocs(query(col('perfumes'), orderBy('name'))),
            getDocs(query(col('muadils'), orderBy('name'))),
            getDocs(col('sliderImages')),
            getDoc(doc(db, 'settings', 'site')),
            getDoc(doc(db, 'settings', 'landingImages')),
          ]);
          if (cancelled) return;
          const catalog = {
            brands: snap2arr(bSnap),
            perfumes: snap2arr(pSnap),
            muadils: snap2arr(mSnap),
            sliderImages: snap2arr(sSnap),
            settingsSite: siteSnap.exists() ? siteSnap.data() : null,
            settingsLandingImages: landSnap.exists() ? landSnap.data() : null,
          };
          applyCatalog(catalog);
          cacheWrite('mc_catalog', catalog);
        } catch { /* offline vb. — cache'de ne varsa onunla devam */ }
      } finally {
        if (!cancelled) setCatalogReady(true);
      }
    })();

    return () => { cancelled = true; };
  }, []);

  // ─── Yorumlar ──────────────────────────────────────────────────────────────
  // Ziyaretçiler onaylı yorumları statik reviews.json'dan okur — Firestore okuma
  // maliyeti sıfır ve eski "son 200" limiti kalktığından puan hesapları
  // (Leaderboard, popüler eşleşmeler) TÜM onaylı yorumları görür.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(REVIEWS_URL);
        if (!res.ok) throw new Error(`reviews ${res.status}`);
        const data = JSON.parse(await res.text(), tsReviver);
        if (!cancelled && Array.isArray(data.reviews)) setCatalogComments(data.reviews);
      } catch {
        // Dosya henüz üretilmemiş / erişilemedi → eski yol: son 200 yorumu tek seferlik oku
        if (cancelled) return;
        try {
          const s = await getDocs(query(col('reviews'), orderBy('createdAt', 'desc'), limit(200)));
          if (!cancelled) setCatalogComments(snap2arr(s));
        } catch { /* offline vb. */ }
      } finally {
        if (!cancelled) setReviewsReady(true);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Üye: kendi yorumları (onay bekleyenler dahil) statik dosyayı beklemeden
  // anında görünsün/silinsin diye küçük canlı sorgu — yalnızca kendi dokümanları
  useEffect(() => {
    if (!user?.uid || isStaff) { setOwnComments([]); return; }
    const unsub = onSnapshot(query(col('reviews'), where('userId', '==', user.uid)), (s) => setOwnComments(snap2arr(s)));
    return () => unsub();
  }, [user?.uid, isStaff]);

  // Staff: moderasyon rozeti/paneli pending yorumları da canlı görmeli
  useEffect(() => {
    if (!isStaff) { setStaffComments(null); return; }
    const unsub = onSnapshot(query(col('reviews'), orderBy('createdAt', 'desc'), limit(200)), (s) => {
      setStaffComments(snap2arr(s));
      setReviewsReady(true);
    });
    return () => unsub();
  }, [isStaff]);

  // Birleştirme: staff canlı listeyi olduğu gibi kullanır; üyede statik listedeki
  // kendi yorumları canlı kopyayla değiştirilir (sildiği yorum statik dosya
  // yenilenene kadar hortlamasın, yeni yorumu beklemeden görünsün)
  const comments = useMemo(() => {
    if (staffComments) return staffComments;
    if (!user?.uid) return catalogComments;
    const map = new Map();
    catalogComments.forEach((c) => { if (c.userId !== user.uid) map.set(c.id, c); });
    ownComments.forEach((c) => map.set(c.id, c));
    return [...map.values()].sort((a, b) => (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0));
  }, [staffComments, catalogComments, ownComments, user?.uid]);

  // ─── Staff: admin paneli anlık veri görsün diye canlı Firestore ───────────
  // Katalog JSON'u en fazla ~5 dk gecikmeli; düzenleme yapan admin/moderatör
  // kendi değişikliğini beklemeden görmeli. Bu kaynaklar yalnızca Admin
  // panelinin kendi sekmelerinde düzenlendiğinden yalnızca /admin'deyken
  // dinlenir — staff sitede normal gezinirken gereksiz okumaya yol açmasın diye.
  // perfumes/muadils (1.541 + 7.731 doküman) burada YOK — pahalı oldukları
  // için yalnızca ihtiyaç duyan sekmelerde AdminPanel tarafından lazy
  // (refreshPerfumes/refreshMuadils ile) çekilir; diğer sekmelerde catalog.json
  // kaynaklı state yeterli.
  useEffect(() => {
    if (!isStaff || !isAdminRoute) return;
    const unsubs = [];
    unsubs.push(onSnapshot(query(col('brands'), orderBy('name')), (s) => setBrands(snap2arr(s))));
    unsubs.push(onSnapshot(col('sliderImages'), (s) => setSliderImages(snap2arr(s).sort((a, b) => (a.order ?? 0) - (b.order ?? 0)))));
    unsubs.push(onSnapshot(doc(db, 'settings', 'site'), (s) => {
      if (s.exists()) {
        const d = s.data();
        setFaviconUrl(d.faviconUrl || '');
        setLogoUrl(d.logoUrl || '');
        setFooterLogoUrl(d.footerLogoUrl || '');
        setGlobalBrandHeaders({ original: d.originalBrandHeader || '', muadil: d.muadilBrandHeader || '' });
      }
    }));
    unsubs.push(onSnapshot(doc(db, 'settings', 'landingImages'), (s) => {
      setLandingImages(s.exists() ? s.data() : {});
    }));
    return () => unsubs.forEach((u) => u());
  }, [isStaff, isAdminRoute]);

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
    // İlk savunma hattı: client tarafı kısa cooldown (sunucu da ayrıca limitler)
    if (now - lastCommentAt.current < COMMENT_COOLDOWN_MS) {
      const remaining = Math.ceil((COMMENT_COOLDOWN_MS - (now - lastCommentAt.current)) / 1000);
      throw Object.assign(new Error(`Çok hızlı yorum gönderiyorsunuz. ${remaining} saniye bekleyin.`), { code: 'rate-limited', remaining });
    }
    const muadilId = String(c.muadilPerfumeId ?? c.muadilId);

    // Yorum oluşturma sunucu tarafı korumalı callable üzerinden (spam/IP/24sa/metin)
    let res;
    try {
      res = await submitReviewFn({
        muadilId,
        similarity: c.similarity,
        projection: c.projection,
        longevity: c.longevity,
        text: c.text,
        recommend: c.recommend ?? null,
        blindBuy: c.blindBuy ?? null,
        ownsOriginal: c.ownsOriginal ?? null,
        seasons: Array.isArray(c.seasons) ? c.seasons : [],
        occasions: Array.isArray(c.occasions) ? c.occasions : [],
        originalImage: c.originalImage ?? null,
        muadilImage: c.muadilImage ?? null,
        imageConsent: !!c.imageConsent,
        targetPerfumeId: c.targetPerfumeId ?? null,
      });
    } catch (e) {
      // Firebase callable HttpsError → kullanıcı dostu Türkçe mesaja çevir.
      // code formatı: "functions/failed-precondition" gibi gelir.
      const code = String(e?.code || '').replace('functions/', '');
      let msg;
      switch (code) {
        // Sunucunun gönderdiği Türkçe mesajı doğrudan göster (24sa, e-posta, metin, hız limiti)
        case 'failed-precondition':
        case 'invalid-argument':
        case 'resource-exhausted':
        case 'permission-denied':
          msg = e?.message || 'Yorum gönderilemedi. Lütfen tekrar deneyin.';
          break;
        case 'unauthenticated':
          msg = 'Yorum yapmak için giriş yapmalısınız.';
          break;
        default:
          // internal / unavailable / not-found / deadline-exceeded → ham kodu gösterme
          msg = 'Yorumunuz şu anda gönderilemiyor. Lütfen birkaç dakika sonra tekrar deneyin.';
      }
      throw Object.assign(new Error(msg), { code: 'review-rejected', original: code });
    }
    lastCommentAt.current = now;

    const muadil = muadilPerfumes.find((m) => String(m.id) === muadilId);
    const reviewId = res?.data?.id || `${user?.uid}_${muadilId}`;

    // Moderatör/admin'e anlık bildirim
    try {
      await addDoc(col('notifications'), {
        type: 'new_review',
        forStaff: true,
        userId: null,
        reviewId,
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

    // Aktivite logu
    logActivity('review_created', {
      reviewId,
      muadilId,
      muadilName: muadil ? `${muadil.brandName} ${muadil.name}` : '',
      targetBrandName: muadil?.targetBrandName || '',
      targetPerfumeName: muadil?.targetPerfumeName || '',
      perfumeUrl: muadil?.targetPerfumeId ? `/karsilastir?orijinal=${muadil.targetPerfumeId}&muadil=${muadil.id}` : null,
    });
    // Muadil istatistikleri sunucu (submitReview) tarafında güncellenir; real-time
    // dinleyici güncel değerleri otomatik getirir.
  };

  const approveComment = async (id) => {
    const reviewSnap = await getDoc(docRef('reviews', id));
    if (!reviewSnap.exists()) return;
    const review = reviewSnap.data();

    if (review.status === 'pending_update' && review.pendingUpdate) {
      const { text, similarity, projection, longevity, recommend, blindBuy, ownsOriginal, seasons, occasions, submittedAt } = review.pendingUpdate;
      await updateDoc(docRef('reviews', id), {
        status: 'approved',
        text, similarity, projection, longevity,
        recommend: recommend ?? null,
        blindBuy: blindBuy ?? null,
        ownsOriginal: ownsOriginal ?? null,
        seasons: Array.isArray(seasons) ? seasons : [],
        occasions: Array.isArray(occasions) ? occasions : [],
        pendingUpdate: null,
        updatedAt: submittedAt ?? serverTimestamp(),
      });
      setStaffComments((prev) => prev && prev.map((c) => c.id === id
        ? { ...c, status: 'approved', text, similarity, projection, longevity, recommend: recommend ?? null, blindBuy: blindBuy ?? null, ownsOriginal: ownsOriginal ?? null, seasons: Array.isArray(seasons) ? seasons : [], occasions: Array.isArray(occasions) ? occasions : [], pendingUpdate: null }
        : c));
    } else {
      await updateDoc(docRef('reviews', id), { status: 'approved' });
      setStaffComments((prev) => prev && prev.map((c) => c.id === id ? { ...c, status: 'approved' } : c));
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
      setStaffComments((prev) => prev && prev.map((c) => c.id === id ? { ...c, status: 'approved', pendingUpdate: null } : c));
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
      setStaffComments((prev) => prev && prev.filter((c) => c.id !== id));
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

    // Orijinale sahiplik bilgisini kullanıcı belgesinde güncel tut (düzenleme
    // sunucu callable'ından geçmez; bu yüzden client tarafı senkron şart).
    if (user?.uid && data.targetPerfumeId != null && typeof data.ownsOriginal === 'boolean') {
      try {
        await updateDoc(docRef('users', user.uid), {
          ownedOriginals: data.ownsOriginal ? arrayUnion(String(data.targetPerfumeId)) : arrayRemove(String(data.targetPerfumeId)),
        });
      } catch { /* sahiplik senkronu yorum güncellemesini engellemesin */ }
    }

    // Moderatör ve admin düzenlemeleri doğrudan kaydedilir (tekrar onaya düşmez).
    const isStaffUser = user?.role === 'admin' || user?.role === 'moderator';
    if (review.status === 'pending' || isStaffUser) {
      await updateDoc(docRef('reviews', id), {
        text: data.text,
        similarity: data.similarity,
        projection: data.projection,
        longevity: data.longevity,
        recommend: data.recommend ?? null,
        ...(data.blindBuy !== undefined ? { blindBuy: data.blindBuy ?? null } : {}),
        ...(data.ownsOriginal !== undefined ? { ownsOriginal: data.ownsOriginal ?? null } : {}),
        ...(data.seasons !== undefined ? { seasons: Array.isArray(data.seasons) ? data.seasons : [] } : {}),
        ...(data.occasions !== undefined ? { occasions: Array.isArray(data.occasions) ? data.occasions : [] } : {}),
        ...(data.originalImage !== undefined ? { originalImage: data.originalImage ?? null } : {}),
        ...(data.muadilImage !== undefined ? { muadilImage: data.muadilImage ?? null } : {}),
        ...(data.imageConsent !== undefined ? { imageConsent: !!data.imageConsent } : {}),
        ...(data.targetPerfumeId !== undefined ? { targetPerfumeId: data.targetPerfumeId ?? null } : {}),
        ...(isStaffUser ? { status: 'approved', pendingUpdate: null } : {}),
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
          blindBuy: data.blindBuy ?? null,
          ownsOriginal: data.ownsOriginal ?? null,
          seasons: Array.isArray(data.seasons) ? data.seasons : [],
          occasions: Array.isArray(data.occasions) ? data.occasions : [],
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
  // Kullanıcının sahip olduğu orijinal parfümler (orijinale-sahiplik prefill için)
  const [ownedOriginals, setOwnedOriginals] = useState({});

  // Kullanıcı değişince favorileri Firestore'dan çek
  useEffect(() => {
    if (!user?.uid) {
      setBrandFavorites({});
      setPerfumeFavorites({});
      setMuadilFavorites({});
      setCompFavorites({});
      setOwnedOriginals({});
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
      setOwnedOriginals((p) => ({ ...p, [user.uid]: (d.ownedOriginals ?? []).map(String) }));
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
  // Kullanıcı bu orijinal parfüme sahip mi? (yorum formunda otomatik dolum için)
  const ownsOriginalPerfume = (uid, perfumeId) => !!(uid && perfumeId != null && (ownedOriginals[uid] ?? []).includes(String(perfumeId)));

  const getUserFavoriteBrands = (uid) => brandFavorites[uid] ?? [];
  const getUserFavoritePerfumes = (uid) => perfumeFavorites[uid] ?? [];
  const getUserFavoriteMuadils = (uid) => muadilFavorites[uid] ?? [];
  const getUserFavoriteComps = (uid) =>
    (compFavorites[uid] ?? []).map((k) => { const [oId, mId] = k.split('_'); return { origId: oId, muadilId: mId }; });

  // ─── Site settings ───────────────────────────────────────────────────────
  const updateFavicon = async (url) => {
    await setDoc(doc(db, 'settings', 'site'), { faviconUrl: url }, { merge: true });
  };
  const updateLogo = async (url) => {
    await setDoc(doc(db, 'settings', 'site'), { logoUrl: url }, { merge: true });
  };
  const updateFooterLogo = async (url) => {
    await setDoc(doc(db, 'settings', 'site'), { footerLogoUrl: url }, { merge: true });
  };
  const updateBrandGlobalHeader = async (type, url) => {
    const field = type === 'original' ? 'originalBrandHeader' : 'muadilBrandHeader';
    await setDoc(doc(db, 'settings', 'site'), { [field]: url ?? null }, { merge: true });
  };

  // ─── Landing images ───────────────────────────────────────────────────────
  const updateLandingImage = async (key, url) => {
    await setDoc(doc(db, 'settings', 'landingImages'), { [key]: url ?? null }, { merge: true });
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

  const noImageUrl = landingImages?.noImageUrl || '';

  // Admin panelinde perfumes/muadils (1.541 + 7.731 doküman) tam listesi mount'ta
  // catalog.json'dan gelir (bedava); Firestore'dan taze tam liste yalnızca admin
  // "Yenile" butonuyla bilinçli çekilir — panelin her açılışında gereksiz ~9.272
  // okuma yapmaması için.
  return (
    <DataCtx.Provider value={{
      brands, perfumes, muadilPerfumes, comments, users, sliderImages, landingImages, noImageUrl,
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
      ownsOriginalPerfume,
      addSliderImage, removeSliderImage, updateSliderImage, reorderSliderImages,
      MAX_SLIDER, MAX_SIZE_MB,
      updateLandingImage,
      faviconUrl, updateFavicon,
      logoUrl, updateLogo,
      footerLogoUrl, updateFooterLogo,
      globalBrandHeaders, updateBrandGlobalHeader,
    }}>
      {children}
    </DataCtx.Provider>
  );
}
