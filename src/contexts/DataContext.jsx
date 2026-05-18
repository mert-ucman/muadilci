import { createContext, useContext, useState } from 'react';
import {
  INIT_BRANDS,
  INIT_PERFUMES,
  INIT_MUADIL,
  INIT_COMMENTS,
  INIT_USERS,
} from '@/data/mockData';

const DataCtx = createContext(null);

export function useData() {
  return useContext(DataCtx);
}

export function DataProvider({ children }) {
  const [brands, setBrands] = useState(INIT_BRANDS);
  const [perfumes, setPerfumes] = useState(INIT_PERFUMES);
  const [muadilPerfumes, setMuadil] = useState(INIT_MUADIL);
  const [comments, setComments] = useState(INIT_COMMENTS);
  const [users, setUsers] = useState(INIT_USERS);
  const [sliderImages, setSliderImages] = useState([]);

  const addBrand = (b) => setBrands((p) => [...p, { ...b, id: Date.now(), active: true, likes: 0 }]);
  const updateBrand = (id, d) => setBrands((p) => p.map((b) => (b.id === id ? { ...b, ...d } : b)));
  const deleteBrand = (id) => setBrands((p) => p.filter((b) => b.id !== id));

  const addPerfume = (p) => setPerfumes((prev) => [...prev, { ...p, id: Date.now(), active: true, likes: 0, commentCount: 0 }]);
  const updatePerfume = (id, d) => setPerfumes((p) => p.map((x) => (x.id === id ? { ...x, ...d } : x)));
  const deletePerfume = (id) => setPerfumes((p) => p.filter((x) => x.id !== id));

  const addMuadil = (m) => setMuadil((p) => [...p, { ...m, id: Date.now(), active: true }]);
  const updateMuadil = (id, d) => setMuadil((p) => p.map((x) => (x.id === id ? { ...x, ...d } : x)));
  const deleteMuadil = (id) => setMuadil((p) => p.filter((x) => x.id !== id));

  const addComment = (c) =>
    setComments((p) => [...p, { ...c, id: Date.now(), date: new Date().toLocaleDateString('tr-TR'), createdAt: Date.now() }]);
  const approveComment = (id) => setComments((p) => p.map((c) => (c.id === id ? { ...c, status: 'approved' } : c)));
  const rejectComment = (id) => setComments((p) => p.filter((c) => c.id !== id));

  const updateUser = (id, d) => setUsers((p) => p.map((u) => (u.id === id ? { ...u, ...d } : u)));
  const deleteUser = (id) => setUsers((p) => p.filter((u) => u.id !== id));

  const [brandFavorites, setBrandFavorites] = useState({});
  const toggleBrandFavorite = (userId, brandId) => {
    if (!userId) return;
    setBrandFavorites((prev) => {
      const cur = prev[userId] || [];
      const next = cur.includes(brandId) ? cur.filter((id) => id !== brandId) : [...cur, brandId];
      return { ...prev, [userId]: next };
    });
  };
  const isBrandFavorite = (userId, brandId) => !!(userId && (brandFavorites[userId] || []).includes(brandId));
  const getUserFavoriteBrands = (userId) => brandFavorites[userId] || [];

  const mkToggle = (setter) => (userId, id) => {
    if (!userId) return;
    setter((prev) => {
      const cur = prev[userId] || [];
      return { ...prev, [userId]: cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id] };
    });
  };
  const mkIs = (state) => (userId, id) => !!(userId && (state[userId] || []).includes(id));
  const mkGet = (state) => (userId) => state[userId] || [];

  const [perfumeFavorites, setPerfumeFavorites] = useState({});
  const togglePerfumeFavorite = mkToggle(setPerfumeFavorites);
  const isPerfumeFavorite = mkIs(perfumeFavorites);
  const getUserFavoritePerfumes = mkGet(perfumeFavorites);

  const [muadilFavorites, setMuadilFavorites] = useState({});
  const toggleMuadilFavorite = mkToggle(setMuadilFavorites);
  const isMuadilFavorite = mkIs(muadilFavorites);
  const getUserFavoriteMuadils = mkGet(muadilFavorites);

  const [compFavorites, setCompFavorites] = useState({});
  const compKey = (origId, muadilId) => `${origId}_${muadilId}`;
  const toggleCompFavorite = (userId, origId, muadilId) => {
    if (!userId) return;
    const key = compKey(origId, muadilId);
    setCompFavorites((prev) => {
      const cur = prev[userId] || [];
      return { ...prev, [userId]: cur.includes(key) ? cur.filter((k) => k !== key) : [...cur, key] };
    });
  };
  const isCompFavorite = (userId, origId, muadilId) => !!(userId && (compFavorites[userId] || []).includes(compKey(origId, muadilId)));
  const getUserFavoriteComps = (userId) => (compFavorites[userId] || []).map((k) => { const [oId, mId] = k.split('_').map(Number); return { origId: oId, muadilId: mId }; });

  const MAX_SLIDER = 10;
  const MAX_SIZE_MB = 2;
  const addSliderImage = (img) => setSliderImages((p) => p.length < MAX_SLIDER ? [...p, img] : p);
  const removeSliderImage = (id) => setSliderImages((p) => p.filter((img) => img.id !== id));
  const reorderSliderImages = (imgs) => setSliderImages(imgs);

  return (
    <DataCtx.Provider
      value={{
        brands, perfumes, muadilPerfumes, comments, users,
        addBrand, updateBrand, deleteBrand,
        addPerfume, updatePerfume, deletePerfume,
        addMuadil, updateMuadil, deleteMuadil,
        addComment, approveComment, rejectComment,
        updateUser, deleteUser,
        brandFavorites, toggleBrandFavorite, isBrandFavorite, getUserFavoriteBrands,
        togglePerfumeFavorite, isPerfumeFavorite, getUserFavoritePerfumes,
        toggleMuadilFavorite, isMuadilFavorite, getUserFavoriteMuadils,
        toggleCompFavorite, isCompFavorite, getUserFavoriteComps,
        sliderImages, addSliderImage, removeSliderImage, reorderSliderImages,
        MAX_SLIDER, MAX_SIZE_MB,
      }}
    >
      {children}
    </DataCtx.Provider>
  );
}
