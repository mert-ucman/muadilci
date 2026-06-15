import { useState, useMemo, useEffect } from 'react';
import { useRouter } from '@/contexts/RouterContext';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { useW } from '@/hooks/useW';
import { calcScores } from '@/utils/scoring';
import { Card, Btn, TableScrollHint } from '@/components/ui';
import { GenderBadge } from '@/components/shared';
import { C, F, FH } from '@/constants/theme';
import { useSeo } from '@/lib/seo';
import { PerfumeGallery } from '@/components/shared/PerfumeGallery';
import { faHeart } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

const PER_PAGE_OPTS = [10, 20, 50, 75, 100];

function IconGrid() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
      <rect x="1" y="1" width="6" height="6" rx="1"/><rect x="9" y="1" width="6" height="6" rx="1"/>
      <rect x="1" y="9" width="6" height="6" rx="1"/><rect x="9" y="9" width="6" height="6" rx="1"/>
    </svg>
  );
}
function IconList() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
      <rect x="1" y="2" width="14" height="3" rx="1"/><rect x="1" y="7" width="14" height="3" rx="1"/>
      <rect x="1" y="12" width="14" height="3" rx="1"/>
    </svg>
  );
}

const ORIG_SORT_OPTS = [
  { value: 'name_asc',   label: 'A → Z' },
  { value: 'name_desc',  label: 'Z → A' },
  { value: 'year_desc',  label: 'Yıl (En Yeni)' },
  { value: 'year_asc',   label: 'Yıl (En Eski)' },
  { value: 'likes_desc', label: 'Beğeni (En Çok)' },
  { value: 'likes_asc',  label: 'Beğeni (En Az)' },
  { value: 'muadil_desc',label: 'Muadil (En Çok)' },
  { value: 'muadil_asc', label: 'Muadil (En Az)' },
];
const MUADIL_SORT_OPTS = [
  { value: 'name_asc',        label: 'A → Z' },
  { value: 'name_desc',       label: 'Z → A' },
  { value: 'score_desc',      label: 'Puan (En Yüksek)' },
  { value: 'score_asc',       label: 'Puan (En Düşük)' },
  { value: 'brand_asc',       label: 'Marka A → Z' },
  { value: 'brand_desc',      label: 'Marka Z → A' },
  { value: 'scent_desc',      label: 'Benzerlik (En Yüksek)' },
  { value: 'projection_desc', label: 'Yayılım (En Yüksek)' },
  { value: 'longevity_desc',  label: 'Kalıcılık (En Yüksek)' },
];

const ORIG_COLS  = [
  { key: 'name',   label: 'Parfüm' },
  { key: 'brand',  label: 'Marka' },
  { key: 'gender', label: 'Cinsiyet' },
  { key: 'year',   label: 'Yıl' },
  { key: 'muadil', label: 'Muadil' },
  { key: 'likes',  label: 'Favori' },
];
const MUADIL_COLS = [
  { key: 'name',        label: 'Muadil Adı' },
  { key: 'brand',       label: 'Marka' },
  { key: 'targetPerf',  label: 'Hedef Parfüm' },
  { key: 'targetBrand', label: 'Hedef Marka' },
  { key: 'gender',      label: 'Cinsiyet' },
  { key: 'scent',       label: 'Benzerlik' },
  { key: 'projection',  label: 'Yayılım' },
  { key: 'longevity',   label: 'Kalıcılık' },
  { key: 'score',       label: 'Genel Puan' },
];

export function PerfumesPage() {
  useSeo({
    title: 'Parfümler',
    description: 'Tüm orijinal parfümleri ve muadillerini incele; marka, cinsiyet ve nota bazında filtrele, koku ve kalıcılık puanlarına göre sırala.',
  });
  const { navigate } = useRouter();
  const { perfumes, muadilPerfumes, comments, noImageUrl, togglePerfumeFavorite, isPerfumeFavorite, toggleMuadilFavorite, isMuadilFavorite } = useData();

  // Onaylı yorumlardan parfüm/muadil fotoğraf haritası (yeni → eski). Kart/satır kapakları buradan.
  const photoMap = useMemo(() => {
    const orig = {}, mu = {};
    for (const c of comments) {
      if (c.status !== 'approved') continue;
      if (c.originalImage && c.targetPerfumeId != null) (orig[c.targetPerfumeId] ||= []).push(c.originalImage);
      if (c.muadilImage && c.muadilId != null) (mu[c.muadilId] ||= []).push(c.muadilImage);
    }
    return { orig, mu };
  }, [comments]);
  const origPhotos = (p) => [p.image, ...(photoMap.orig[p.id] || [])].filter(Boolean);
  const muadilPhotos = (m) => [m.image, ...(photoMap.mu[m.id] || [])].filter(Boolean);
  const { user } = useAuth();
  const { sm, xs } = useW();

  const [pTab,        setPTab]        = useState(() => localStorage.getItem('perf_tab')  || 'original');
  const [view,        setView]        = useState(() => localStorage.getItem('perf_view_v2') || 'list');
  const [sort,        setSort]        = useState(() => localStorage.getItem('perf_sort_v2') || 'name_asc');
  const [perPage,     setPerPage]     = useState(() => Number(localStorage.getItem('perf_pp')) || 20);
  const [page,        setPage]        = useState(1);
  const [filter,        setFilter]        = useState('all');
  const [scoreFilter,   setScoreFilter]   = useState('all');
  const [genderFilterM, setGenderFilterM] = useState('all');
  const [search,      setSearch]      = useState('');
  const [listSortKey, setListSortKey] = useState('name');
  const [listSortDir, setListSortDir] = useState('asc');

  useEffect(() => { localStorage.setItem('perf_tab',  pTab);          }, [pTab]);
  useEffect(() => { localStorage.setItem('perf_view_v2', view);          }, [view]);
  useEffect(() => { localStorage.setItem('perf_sort_v2', sort);          }, [sort]);
  useEffect(() => { localStorage.setItem('perf_pp',   String(perPage)); }, [perPage]);

  // Tab değişince sayfa sıfırla
  const switchTab = (v) => { setPTab(v); setFilter('all'); setScoreFilter('all'); setGenderFilterM('all'); setSearch(''); setPage(1); setSort('name_asc'); setListSortKey('name'); setListSortDir('asc'); };
  const switchSort = (v) => { setSort(v); setPage(1); };
  const switchFilter = (v) => { setFilter(v); setPage(1); };
  const switchSearch = (v) => { setSearch(v); setPage(1); };
  const switchPerPage = (v) => { setPerPage(v); setPage(1); };

  // Muadil puan haritası
  const muadilScores = useMemo(() => {
    const map = {};
    muadilPerfumes.forEach((m) => { map[m.id] = calcScores(m.id, comments); });
    return map;
  }, [muadilPerfumes, comments]);

  // Parfüm başına muadil sayısı
  const muadilCountMap = useMemo(() => {
    const map = {};
    muadilPerfumes.forEach((m) => { map[m.targetPerfumeId] = (map[m.targetPerfumeId] || 0) + 1; });
    return map;
  }, [muadilPerfumes]);

  const applyOrigSort = (arr, sk) => [...arr].sort((a, b) => {
    switch (sk) {
      case 'name_asc':    return a.name.localeCompare(b.name, 'tr');
      case 'name_desc':   return b.name.localeCompare(a.name, 'tr');
      case 'year_desc':   return (b.year || 0) - (a.year || 0);
      case 'year_asc':    return (a.year || 0) - (b.year || 0);
      case 'likes_desc':  return (b.likes || 0) - (a.likes || 0);
      case 'likes_asc':   return (a.likes || 0) - (b.likes || 0);
      case 'muadil_desc': return (muadilCountMap[b.id] || 0) - (muadilCountMap[a.id] || 0);
      case 'muadil_asc':  return (muadilCountMap[a.id] || 0) - (muadilCountMap[b.id] || 0);
      default: return 0;
    }
  });

  const applyMuadilSort = (arr, sk) => [...arr].sort((a, b) => {
    switch (sk) {
      case 'name_asc':    return a.name.localeCompare(b.name, 'tr');
      case 'name_desc':   return b.name.localeCompare(a.name, 'tr');
      case 'brand_asc':   return (a.brandName || '').localeCompare(b.brandName || '', 'tr');
      case 'brand_desc':  return (b.brandName || '').localeCompare(a.brandName || '', 'tr');
      case 'score_desc':      return ((muadilScores[b.id]?.overall) ?? -1) - ((muadilScores[a.id]?.overall) ?? -1);
      case 'score_asc':       return ((muadilScores[a.id]?.overall) ?? -1) - ((muadilScores[b.id]?.overall) ?? -1);
      case 'scent_desc':      return ((muadilScores[b.id]?.scent) ?? -1) - ((muadilScores[a.id]?.scent) ?? -1);
      case 'projection_desc': return ((muadilScores[b.id]?.projection) ?? -1) - ((muadilScores[a.id]?.projection) ?? -1);
      case 'longevity_desc':  return ((muadilScores[b.id]?.longevity) ?? -1) - ((muadilScores[a.id]?.longevity) ?? -1);
      default: return 0;
    }
  });

  const filtO = useMemo(() => {
    const base = perfumes.filter((p) =>
      (filter === 'all' || p.gender === filter) &&
      (p.name.toLowerCase().includes(search.toLowerCase()) || p.brandName.toLowerCase().includes(search.toLowerCase()))
    );
    return applyOrigSort(base, sort);
  }, [perfumes, filter, search, sort, muadilCountMap]);

  const filtM = useMemo(() => {
    const [sfType, sfVal] = scoreFilter === 'all' ? ['all', null] : scoreFilter.split('_');
    const sfNum = sfVal != null ? Number(sfVal) : null;
    const base = muadilPerfumes.filter((m) => {
      if (genderFilterM !== 'all' && m.gender !== genderFilterM) return false;
      const matchText =
        m.name.toLowerCase().includes(search.toLowerCase()) ||
        m.brandName.toLowerCase().includes(search.toLowerCase()) ||
        (m.targetPerfumeName || '').toLowerCase().includes(search.toLowerCase());
      if (!matchText) return false;
      if (sfType !== 'all') {
        const overall = muadilScores[m.id]?.overall;
        if (overall == null) return false;
        if (sfType === 'min' && overall < sfNum) return false;
        if (sfType === 'exact' && Math.floor(overall) !== sfNum) return false;
      }
      return true;
    });
    return applyMuadilSort(base, sort);
  }, [muadilPerfumes, search, sort, muadilScores, scoreFilter, genderFilterM]);

  // Liste görünümü sütun sıralaması
  const handleListSort = (key) => {
    if (listSortKey === key) { setListSortDir((d) => d === 'asc' ? 'desc' : 'asc'); }
    else { setListSortKey(key); setListSortDir('asc'); }
    setPage(1);
  };

  // Sütun sıralaması tüm filtrelenmiş listeye uygulanır, sonra sayfalanır
  const activeList = useMemo(() => {
    const base = pTab === 'original' ? filtO : filtM;
    if (view !== 'list') return base;
    return [...base].sort((a, b) => {
      let av, bv;
      if (pTab === 'original') {
        if (listSortKey === 'name')   { av = a.name || ''; bv = b.name || ''; return listSortDir === 'asc' ? av.localeCompare(bv, 'tr') : bv.localeCompare(av, 'tr'); }
        if (listSortKey === 'brand')  { av = a.brandName || ''; bv = b.brandName || ''; return listSortDir === 'asc' ? av.localeCompare(bv, 'tr') : bv.localeCompare(av, 'tr'); }
        if (listSortKey === 'gender') { av = a.gender || ''; bv = b.gender || ''; return listSortDir === 'asc' ? av.localeCompare(bv, 'tr') : bv.localeCompare(av, 'tr'); }
        if (listSortKey === 'year')   { av = a.year || 0; bv = b.year || 0; return listSortDir === 'asc' ? av - bv : bv - av; }
        if (listSortKey === 'muadil') { av = muadilCountMap[a.id] || 0; bv = muadilCountMap[b.id] || 0; return listSortDir === 'asc' ? av - bv : bv - av; }
        if (listSortKey === 'likes')  { av = a.likes || 0; bv = b.likes || 0; return listSortDir === 'asc' ? av - bv : bv - av; }
      } else {
        if (listSortKey === 'name')        { av = a.name || ''; bv = b.name || ''; return listSortDir === 'asc' ? av.localeCompare(bv, 'tr') : bv.localeCompare(av, 'tr'); }
        if (listSortKey === 'brand')       { av = a.brandName || ''; bv = b.brandName || ''; return listSortDir === 'asc' ? av.localeCompare(bv, 'tr') : bv.localeCompare(av, 'tr'); }
        if (listSortKey === 'targetPerf')  { av = a.targetPerfumeName || ''; bv = b.targetPerfumeName || ''; return listSortDir === 'asc' ? av.localeCompare(bv, 'tr') : bv.localeCompare(av, 'tr'); }
        if (listSortKey === 'targetBrand') { av = a.targetBrandName || ''; bv = b.targetBrandName || ''; return listSortDir === 'asc' ? av.localeCompare(bv, 'tr') : bv.localeCompare(av, 'tr'); }
        if (listSortKey === 'gender')      { av = a.gender || ''; bv = b.gender || ''; return listSortDir === 'asc' ? av.localeCompare(bv, 'tr') : bv.localeCompare(av, 'tr'); }
        if (listSortKey === 'score')      { av = muadilScores[a.id]?.overall ?? -1; bv = muadilScores[b.id]?.overall ?? -1; return listSortDir === 'asc' ? av - bv : bv - av; }
        if (listSortKey === 'scent')      { av = muadilScores[a.id]?.scent ?? -1; bv = muadilScores[b.id]?.scent ?? -1; return listSortDir === 'asc' ? av - bv : bv - av; }
        if (listSortKey === 'projection') { av = muadilScores[a.id]?.projection ?? -1; bv = muadilScores[b.id]?.projection ?? -1; return listSortDir === 'asc' ? av - bv : bv - av; }
        if (listSortKey === 'longevity')  { av = muadilScores[a.id]?.longevity ?? -1; bv = muadilScores[b.id]?.longevity ?? -1; return listSortDir === 'asc' ? av - bv : bv - av; }
      }
      return 0;
    });
  }, [filtO, filtM, pTab, view, listSortKey, listSortDir, muadilCountMap, muadilScores]);

  const totalPages = Math.max(1, Math.ceil(activeList.length / perPage));
  const safePage   = Math.min(page, totalPages);
  const pageItems  = activeList.slice((safePage - 1) * perPage, safePage * perPage);

  const scoreColor = (v) => v === null ? C.textLight : v <= 4 ? C.red : v < 7 ? C.orange : C.green;

  const sortOpts = pTab === 'original' ? ORIG_SORT_OPTS : MUADIL_SORT_OPTS;
  const cols     = pTab === 'original' ? ORIG_COLS : MUADIL_COLS;

  // Sayfalama
  const Pagination = () => {
    if (totalPages <= 1) return null;
    const pages = [];
    const delta = 2;
    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= safePage - delta && i <= safePage + delta)) pages.push(i);
      else if (pages[pages.length - 1] !== '...') pages.push('...');
    }
    return (
      <div className="flex justify-center items-center gap-[6px] mt-6 flex-wrap">
        <button
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={safePage === 1}
          className="px-[14px] py-[6px] rounded-lg text-[13px]"
          style={{ border: `1px solid ${C.border}`, background: C.card, color: safePage === 1 ? C.textLight : C.text, cursor: safePage === 1 ? 'default' : 'pointer', fontFamily: F }}>
          ‹ Önceki
        </button>
        {pages.map((p, i) => p === '...'
          ? <span key={`e${i}`} className="px-1 py-[6px] text-[--color-text-light]">…</span>
          : <button key={p} onClick={() => setPage(p)}
              className="w-[34px] h-[34px] rounded-lg text-[13px]"
              style={{ border: `1px solid ${p === safePage ? C.navy : C.border}`, background: p === safePage ? C.navy : C.card, color: p === safePage ? '#fff' : C.text, cursor: 'pointer', fontFamily: F, fontWeight: p === safePage ? 700 : 400 }}>
              {p}
            </button>
        )}
        <button
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          disabled={safePage === totalPages}
          className="px-[14px] py-[6px] rounded-lg text-[13px]"
          style={{ border: `1px solid ${C.border}`, background: C.card, color: safePage === totalPages ? C.textLight : C.text, cursor: safePage === totalPages ? 'default' : 'pointer', fontFamily: F }}>
          Sonraki ›
        </button>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-(--color-bg)" style={{ padding: xs ? '16px' : sm ? '20px 16px' : '32px' }}>
      <div className="max-w-[1320px] mx-auto">
        <h1 className="font-black text-(--color-navy) mb-1" style={{ fontSize: sm ? '22px' : '26px' }}>Parfümler</h1>
        <p className="text-(--color-text-light) text-[14px] mb-[22px]">Orijinal parfümler ve muadilleri</p>

        {/* Üst toolbar */}
        <div className="flex items-center justify-between flex-wrap gap-[10px] mb-4">
          {/* Tab */}
          <div className="flex gap-1 bg-(--color-card) border border-(--color-border) rounded-xl p-1">
            {[['original', 'Orijinal'], ['muadil', 'Muadil']].map(([v, l]) => (
              <button key={v} onClick={() => switchTab(v)}
                className="rounded-[9px] border-none text-[14px] font-semibold cursor-pointer transition-all duration-200"
                style={{ padding: sm ? '8px 16px' : '8px 20px', background: pTab === v ? C.navy : 'transparent', color: pTab === v ? '#fff' : C.textMid, fontFamily: F }}>
                {l}
              </button>
            ))}
          </div>

          {/* Sıralama + Sayfa başına + Görünüm */}
          <div className="flex items-center gap-2 flex-wrap">
            <select value={sort} onChange={(e) => switchSort(e.target.value)}
              className="h-[34px] px-[10px] rounded-lg text-[13px] cursor-pointer outline-none"
              style={{ border: `1px solid ${C.border}`, background: C.card, color: C.text, fontFamily: F }}>
              {sortOpts.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>

            <div className="flex items-center gap-1 h-[34px] px-[6px] rounded-lg"
              style={{ background: C.card, border: `1px solid ${C.border}` }}>
              {PER_PAGE_OPTS.map((n) => (
                <button key={n} onClick={() => switchPerPage(n)}
                  className="px-[7px] py-[3px] rounded-md border-none text-[12px] font-semibold cursor-pointer transition-all duration-150"
                  style={{ background: perPage === n ? C.navy : 'transparent', color: perPage === n ? '#fff' : C.textMid, fontFamily: F }}>
                  {n}
                </button>
              ))}
            </div>

            <button
              className="flex items-center justify-center w-[34px] h-[34px] rounded-lg cursor-pointer transition-all duration-150 shrink-0"
              style={{ border: `1px solid ${C.border}`, background: view === 'grid' ? C.navy : C.card, color: view === 'grid' ? '#fff' : C.textMid }}
              onClick={() => setView('grid')}><IconGrid /></button>
            <button
              className="flex items-center justify-center w-[34px] h-[34px] rounded-lg cursor-pointer transition-all duration-150 shrink-0"
              style={{ border: `1px solid ${C.border}`, background: view === 'list' ? C.navy : C.card, color: view === 'list' ? '#fff' : C.textMid }}
              onClick={() => setView('list')}><IconList /></button>
          </div>
        </div>

        {/* Arama + Filtreler */}
        <div className="flex gap-[10px] mb-[18px] flex-wrap">
          <div className="flex-1 min-w-[160px] relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-(--color-text-light)" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /></svg>
            <input value={search} onChange={(e) => switchSearch(e.target.value)} placeholder="Ara..."
              className="w-full rounded-[10px] py-[10px] pr-[14px] pl-[38px] text-[14px] outline-none box-border"
              style={{ border: `1px solid ${C.border}`, fontFamily: F }} />
          </div>
          {pTab === 'original' && (
            <div className="flex gap-[6px] flex-wrap">
              {['all', 'Erkek', 'Kadın', 'Unisex'].map((g) => (
                <button key={g} onClick={() => switchFilter(g)}
                  className="px-3 py-[9px] rounded-[10px] text-[13px] cursor-pointer"
                  style={{ border: `1px solid ${filter === g ? C.gold : C.border}`, background: filter === g ? C.goldBg : 'transparent', color: filter === g ? C.gold : C.textMid, fontWeight: filter === g ? 700 : 400, fontFamily: F }}>
                  {g === 'all' ? 'Tümü' : g}
                </button>
              ))}
            </div>
          )}
          {pTab === 'muadil' && (
            <>
              <div className="flex gap-[6px] flex-wrap">
                {['all', 'Erkek', 'Kadın', 'Unisex'].map((g) => (
                  <button key={g} onClick={() => { setGenderFilterM(g); setPage(1); }}
                    className="px-3 py-[9px] rounded-[10px] text-[13px] cursor-pointer"
                    style={{ border: `1px solid ${genderFilterM === g ? C.gold : C.border}`, background: genderFilterM === g ? C.goldBg : 'transparent', color: genderFilterM === g ? C.gold : C.textMid, fontWeight: genderFilterM === g ? 700 : 400, fontFamily: F }}>
                    {g === 'all' ? 'Tümü' : g}
                  </button>
                ))}
              </div>
              <select
                value={scoreFilter}
                onChange={(e) => { setScoreFilter(e.target.value); setPage(1); }}
                className="h-[42px] px-3 rounded-[10px] text-[13px] cursor-pointer outline-none"
                style={{ border: `1px solid ${scoreFilter !== 'all' ? C.gold : C.border}`, background: scoreFilter !== 'all' ? C.goldBg : C.card, color: scoreFilter !== 'all' ? C.gold : C.text, fontFamily: F, fontWeight: scoreFilter !== 'all' ? 700 : 400 }}
              >
                <option value="all">Tüm Puanlar</option>
                <optgroup label="Sadece">
                  {[1,2,3,4,5,6,7,8,9].map((n) => (
                    <option key={`exact_${n}`} value={`exact_${n}`}>Sadece {n}/10</option>
                  ))}
                  <option value="exact_10">Sadece 10/10</option>
                </optgroup>
                <optgroup label="En az">
                  {[1,2,3,4,5,6,7,8,9].map((n) => (
                    <option key={`min_${n}`} value={`min_${n}`}>En az {n}/10</option>
                  ))}
                </optgroup>
              </select>
            </>
          )}
        </div>

        {/* Toplam + sayfa bilgisi */}
        <div className="text-[13px] text-(--color-text-mid) mb-[14px] flex items-center justify-between flex-wrap gap-[6px]">
          <span>Toplam <strong className="text-(--color-navy)">{activeList.length}</strong> parfüm</span>
          <span className="text-(--color-text-light)">{(safePage - 1) * perPage + 1}–{Math.min(safePage * perPage, activeList.length)} gösteriliyor · Sayfa {safePage}/{totalPages}</span>
        </div>

        {/* Grid View */}
        {view === 'grid' && pTab === 'original' && (
          <div style={{ display: 'grid', gridTemplateColumns: xs ? '1fr' : sm ? '1fr 1fr' : 'repeat(auto-fill,minmax(270px,1fr))', gap: '16px' }}>
            {pageItems.map((p) => {
              const mc = muadilCountMap[p.id] || 0;
              const uid = user?.uid || user?.id;
              return (
                <Card key={p.id} hover style={{ padding: '0', cursor: 'pointer', position: 'relative', overflow: 'hidden' }} onClick={() => navigate(`/${p.brandSlug}/${p.slug}`)}>
                  <button
                    onClick={(e) => { e.stopPropagation(); togglePerfumeFavorite(uid, p.id); }}
                    className="absolute top-[10px] right-[10px] z-[1] w-[30px] h-[30px] rounded-full flex items-center justify-center cursor-pointer"
                    style={{ border: `1px solid ${isPerfumeFavorite(uid, p.id) ? C.goldBorder : C.border}`, background: isPerfumeFavorite(uid, p.id) ? C.goldBg : '#fff' }}>
                    {/* Çift tam sayı boyut: 1.25em kesirli genişliğin sub-pixel kaymasını önler */}
                    <FontAwesomeIcon icon={faHeart} style={{ color: isPerfumeFavorite(uid, p.id) ? C.gold : C.textLight, width: '14px', height: '14px' }} />
                  </button>
                  <div className="w-full overflow-hidden">
                    <PerfumeGallery photos={origPhotos(p)} />
                  </div>
                  <div className="p-[12px_14px]">
                    <div className="font-normal text-(--color-navy) mb-[2px] whitespace-nowrap overflow-hidden text-ellipsis" style={{ fontSize: sm ? '13px' : '15px', fontFamily: "'Inter', sans-serif" }}>{p.name}</div>
                    <div className="text-[12px] text-(--color-text-mid) mb-2">{p.brandName} · {p.year}</div>
                    <div className="flex gap-1 flex-wrap mb-[10px]">
                      <GenderBadge gender={p.gender} />
                      {mc > 0 && (
                        <div className="inline-flex items-center justify-center px-2 py-[2px] rounded-[20px] text-[11px] font-semibold"
                          style={{ background: C.greenBg, color: C.green, border: `1px solid ${C.greenBorder}` }}>
                          <p className="m-0 p-0 w-max">{mc} muadil</p>
                        </div>
                      )}
                    </div>
                    <div className="flex justify-between items-center pt-2 gap-[6px]" style={{ borderTop: `1px solid ${C.borderLight}` }}>
                      <span className="text-[11px] text-(--color-text-light) flex items-center gap-[3px]">
                        <FontAwesomeIcon icon={faHeart} style={{ fontSize: '10px', color: C.gold }} /> {(p.likes || 0).toLocaleString()}
                      </span>
                      {mc > 0 && !sm && <Btn size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); navigate(`/karsilastir?orijinal=${p.id}`); }}>Karşılaştır</Btn>}
                    </div>
                  </div>
                </Card>
              );
            })}
            {!pageItems.length && <div className="col-span-full text-center py-[60px] text-(--color-text-light)">Sonuç bulunamadı.</div>}
          </div>
        )}

        {view === 'grid' && pTab === 'muadil' && (
          <div style={{ display: 'grid', gridTemplateColumns: xs ? '1fr' : sm ? '1fr 1fr' : 'repeat(auto-fill,minmax(270px,1fr))', gap: '16px' }}>
            {pageItems.map((m) => {
              const ms = muadilScores[m.id];
              const uid = user?.uid || user?.id;
              return (
                <Card key={m.id} hover style={{ padding: '0', cursor: 'pointer', position: 'relative', overflow: 'hidden' }} onClick={() => navigate(`/karsilastir?orijinal=${m.targetPerfumeId}&muadil=${m.id}`)}>
                  <button
                    onClick={(e) => { e.stopPropagation(); toggleMuadilFavorite(uid, m.id); }}
                    className="absolute top-[10px] right-[10px] z-[1] w-[30px] h-[30px] rounded-full flex items-center justify-center cursor-pointer"
                    style={{ border: `1px solid ${isMuadilFavorite(uid, m.id) ? C.goldBorder : C.border}`, background: isMuadilFavorite(uid, m.id) ? C.goldBg : '#fff' }}>
                    {/* Çift tam sayı boyut: 1.25em kesirli genişliğin sub-pixel kaymasını önler */}
                    <FontAwesomeIcon icon={faHeart} style={{ color: isMuadilFavorite(uid, m.id) ? C.gold : C.textLight, width: '14px', height: '14px' }} />
                  </button>
                  <div className="w-full overflow-hidden">
                    <PerfumeGallery photos={muadilPhotos(m)} />
                  </div>
                  <div className="p-[12px_14px]">
                    <div className="font-normal text-(--color-navy) mb-[2px] whitespace-nowrap overflow-hidden text-ellipsis" style={{ fontSize: sm ? '13px' : '15px', fontFamily: "'Inter', sans-serif" }}>{m.name}</div>
                    <div className="text-[13px] font-semibold mb-[2px]" style={{ color: C.green }}>{m.brandName}</div>
                    <div className="text-[12px] text-(--color-text-light) mb-[10px]">→ {m.targetBrandName} {m.targetPerfumeName}</div>
                    <div className="mb-[10px] flex flex-col gap-[5px]">
                      {[['Benzerlik', ms?.scent], ['Yayılım', ms?.projection], ['Kalıcılık', ms?.longevity]].map(([label, val]) => (
                        <div key={label}>
                          <div className="flex justify-between mb-[2px]">
                            <span className="text-[10px] text-(--color-text-light)">{label}</span>
                            <span className="text-[10px] font-bold" style={{ color: scoreColor(val ?? null) }}>{val != null ? `${val}/10` : '—'}</span>
                          </div>
                          <div className="h-[3px] rounded-sm overflow-hidden" style={{ background: C.borderLight }}>
                            <div className="h-full rounded-sm transition-[width] duration-300" style={{ width: val != null ? `${val * 10}%` : '0%', background: 'linear-gradient(90deg, #e53e3e 0%, #f6ad55 45%, #38a169 100%)' }} />
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-between items-center pt-2" style={{ borderTop: `1px solid ${C.borderLight}` }}>
                      <span className="text-[12px] font-bold" style={{ color: scoreColor(ms?.overall ?? null) }}>{ms?.overall != null ? `${ms.overall}/10` : '—'}</span>
                      <Btn size="sm" variant="ghost">Karşılaştır →</Btn>
                    </div>
                  </div>
                </Card>
              );
            })}
            {!pageItems.length && <div className="col-span-full text-center py-[60px] text-(--color-text-light)">Sonuç bulunamadı.</div>}
          </div>
        )}

        {/* List View */}
        {view === 'list' && (
          <Card style={{ overflow: 'hidden' }}>
            <TableScrollHint />
            <div className="overflow-x-auto [-webkit-overflow-scrolling:touch]">
            <table className="w-full min-w-[620px] border-collapse">
              <thead>
                <tr style={{ background: C.bg }}>
                  {cols.map(({ key, label }) => {
                    const active = listSortKey === key;
                    const dir = active ? (listSortDir === 'asc' ? '↑' : '↓') : '↕';
                    return (
                      <th key={key} onClick={() => handleListSort(key)}
                        className="px-[14px] py-[10px] text-[11px] font-bold uppercase tracking-[.05em] whitespace-nowrap cursor-pointer select-none"
                        style={{ textAlign: key === 'name' || key === 'brand' || key === 'targetPerf' || key === 'targetBrand' ? 'left' : 'center', color: active ? C.navy : C.textMid, borderBottom: `1px solid ${C.border}` }}>
                        <span className="inline-flex items-center gap-1">
                          {label}
                          <span className="text-[12px] font-black" style={{ color: active ? C.navy : C.border }}>{dir}</span>
                        </span>
                      </th>
                    );
                  })}
                  <th className="px-[14px] py-[10px] text-[11px] font-bold text-center uppercase tracking-[.05em] text-(--color-text-mid)" style={{ borderBottom: `1px solid ${C.border}` }}>Favori</th>
                </tr>
              </thead>
              <tbody>
                {pageItems.map((item) => {
                  const uid = user?.uid || user?.id;
                  const isOrig = pTab === 'original';
                  const mc = isOrig ? (muadilCountMap[item.id] || 0) : null;
                  const ms = !isOrig ? muadilScores[item.id] : null;
                  return (
                    <tr key={item.id}
                      onClick={() => isOrig ? navigate(`/${item.brandSlug}/${item.slug}`) : navigate(`/karsilastir?orijinal=${item.targetPerfumeId}&muadil=${item.id}`)}
                      className="cursor-pointer transition-[background] duration-100"
                      style={{ borderBottom: `1px solid ${C.borderLight}` }}
                      onMouseEnter={(e) => e.currentTarget.style.background = C.bg}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                      {/* Parfüm / Muadil adı */}
                      <td className="px-[14px] py-[10px]">
                        <div className="flex items-center gap-[10px]">
                          <div className="w-[38px] h-[38px] rounded-lg bg-[#f0f0f0] overflow-hidden shrink-0">
                            <img src={(isOrig ? origPhotos(item) : muadilPhotos(item))[0] || noImageUrl || undefined} alt={item.name} onError={(e) => { e.currentTarget.onerror = null; noImageUrl ? (e.currentTarget.src = noImageUrl) : (e.currentTarget.style.display = 'none'); }} className="w-full h-full object-cover" />
                          </div>
                          <span className="font-normal text-[14px] text-(--color-navy)" style={{ fontFamily: "'Inter', sans-serif" }}>{item.name}</span>
                        </div>
                      </td>
                      {/* Marka */}
                      <td className="px-[14px] py-[10px] text-[13px] text-(--color-text-mid)">{item.brandName}</td>
                      {isOrig ? (
                        <>
                          <td className="px-[14px] py-[10px] text-center"><GenderBadge gender={item.gender} /></td>
                          <td className="px-[14px] py-[10px] text-[13px] text-(--color-text-mid) text-center">{item.year || '—'}</td>
                          <td className="px-[14px] py-[10px] text-center">
                            <div className="inline-flex items-center justify-center px-[10px] py-[2px] rounded-[20px] text-[12px] font-bold"
                              style={{ background: mc > 0 ? C.greenBg : C.bg, color: mc > 0 ? C.green : C.textLight, border: `1px solid ${mc > 0 ? C.greenBorder : C.border}` }}>
                              <p className="m-0 p-0 w-max">{mc} muadil</p>
                            </div>
                          </td>
                          <td className="px-[14px] py-[10px] text-[13px] text-(--color-text-mid) text-center">
                            <FontAwesomeIcon icon={faHeart} style={{ fontSize: '11px', color: C.gold, marginRight: '4px' }} />{(item.likes || 0).toLocaleString()}
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="px-[14px] py-[10px] text-[13px] text-(--color-text-mid)">{item.targetPerfumeName || '—'}</td>
                          <td className="px-[14px] py-[10px] text-[13px] text-(--color-text-mid)">{item.targetBrandName || '—'}</td>
                          <td className="px-[14px] py-[10px] text-center"><GenderBadge gender={item.gender} /></td>
                          <td className="px-[14px] py-[10px] text-center">
                            <span className="font-bold text-[13px]" style={{ color: scoreColor(ms?.scent ?? null) }}>{ms?.scent != null ? `${ms.scent}/10` : '—'}</span>
                          </td>
                          <td className="px-[14px] py-[10px] text-center">
                            <span className="font-bold text-[13px]" style={{ color: scoreColor(ms?.projection ?? null) }}>{ms?.projection != null ? `${ms.projection}/10` : '—'}</span>
                          </td>
                          <td className="px-[14px] py-[10px] text-center">
                            <span className="font-bold text-[13px]" style={{ color: scoreColor(ms?.longevity ?? null) }}>{ms?.longevity != null ? `${ms.longevity}/10` : '—'}</span>
                          </td>
                          <td className="px-[14px] py-[10px] text-center">
                            <span className="font-bold text-[13px]" style={{ color: scoreColor(ms?.overall ?? null) }}>{ms?.overall != null ? `${ms.overall}/10` : '—'}</span>
                          </td>
                        </>
                      )}
                      {/* Aksiyon */}
                      <td className="px-[14px] py-[10px] text-center" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => isOrig ? togglePerfumeFavorite(uid, item.id) : toggleMuadilFavorite(uid, item.id)}
                          className="w-[28px] h-[28px] rounded-full flex items-center justify-center cursor-pointer mx-auto"
                          style={{ border: `1px solid ${(isOrig ? isPerfumeFavorite(uid, item.id) : isMuadilFavorite(uid, item.id)) ? C.goldBorder : C.border}`, background: (isOrig ? isPerfumeFavorite(uid, item.id) : isMuadilFavorite(uid, item.id)) ? C.goldBg : '#fff' }}>
                          {/* Çift tam sayı boyut: 1.25em kesirli genişliğin sub-pixel kaymasını önler */}
                          <FontAwesomeIcon icon={faHeart} style={{ width: '14px', height: '14px', color: (isOrig ? isPerfumeFavorite(uid, item.id) : isMuadilFavorite(uid, item.id)) ? C.gold : C.textLight }} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            </div>
            {!pageItems.length && <div className="text-center py-[60px] text-(--color-text-light)">Sonuç bulunamadı.</div>}
          </Card>
        )}

        <Pagination />
      </div>
    </div>
  );
}
