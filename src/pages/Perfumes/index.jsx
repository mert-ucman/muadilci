import { useState, useMemo, useEffect } from 'react';
import { useRouter } from '@/contexts/RouterContext';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { useW } from '@/hooks/useW';
import { calcScores } from '@/utils/scoring';
import { Card, Btn } from '@/components/ui';
import { GenderBadge } from '@/components/shared';
import { C, F, FH } from '@/constants/theme';
import noImage from '@/img/no-image.jpg';
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
  { value: 'name_asc',    label: 'A → Z' },
  { value: 'name_desc',   label: 'Z → A' },
  { value: 'score_desc',  label: 'Puan (En Yüksek)' },
  { value: 'score_asc',   label: 'Puan (En Düşük)' },
  { value: 'brand_asc',   label: 'Marka A → Z' },
  { value: 'brand_desc',  label: 'Marka Z → A' },
];

const ORIG_COLS  = [
  { key: 'name',   label: 'Parfüm' },
  { key: 'brand',  label: 'Marka' },
  { key: 'gender', label: 'Cinsiyet' },
  { key: 'year',   label: 'Yıl' },
  { key: 'muadil', label: 'Muadil' },
  { key: 'likes',  label: 'Beğeni' },
];
const MUADIL_COLS = [
  { key: 'name',        label: 'Muadil Adı' },
  { key: 'brand',       label: 'Marka' },
  { key: 'targetPerf',  label: 'Hedef Parfüm' },
  { key: 'targetBrand', label: 'Hedef Marka' },
  { key: 'score',       label: 'Genel Puan' },
];

export function PerfumesPage() {
  const { navigate } = useRouter();
  const { perfumes, muadilPerfumes, comments, togglePerfumeFavorite, isPerfumeFavorite, toggleMuadilFavorite, isMuadilFavorite } = useData();
  const { user } = useAuth();
  const { sm, xs } = useW();

  const [pTab,    setPTab]    = useState(() => localStorage.getItem('perf_tab')  || 'original');
  const [view,    setView]    = useState(() => localStorage.getItem('perf_view') || 'grid');
  const [sort,    setSort]    = useState(() => localStorage.getItem('perf_sort') || 'name_asc');
  const [perPage, setPerPage] = useState(() => Number(localStorage.getItem('perf_pp')) || 20);
  const [page,    setPage]    = useState(1);
  const [filter,  setFilter]  = useState('all');
  const [search,  setSearch]  = useState('');
  const [listSortKey, setListSortKey] = useState('name');
  const [listSortDir, setListSortDir] = useState('asc');

  useEffect(() => { localStorage.setItem('perf_tab',  pTab);          }, [pTab]);
  useEffect(() => { localStorage.setItem('perf_view', view);          }, [view]);
  useEffect(() => { localStorage.setItem('perf_sort', sort);          }, [sort]);
  useEffect(() => { localStorage.setItem('perf_pp',   String(perPage)); }, [perPage]);

  // Tab değişince sayfa sıfırla
  const switchTab = (v) => { setPTab(v); setFilter('all'); setSearch(''); setPage(1); setSort('name_asc'); };
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
      case 'score_desc':  return ((muadilScores[b.id]?.overall) ?? -1) - ((muadilScores[a.id]?.overall) ?? -1);
      case 'score_asc':   return ((muadilScores[a.id]?.overall) ?? -1) - ((muadilScores[b.id]?.overall) ?? -1);
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
    const base = muadilPerfumes.filter((m) =>
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.brandName.toLowerCase().includes(search.toLowerCase()) ||
      (m.targetPerfumeName || '').toLowerCase().includes(search.toLowerCase())
    );
    return applyMuadilSort(base, sort);
  }, [muadilPerfumes, search, sort, muadilScores]);

  const activeList = pTab === 'original' ? filtO : filtM;
  const totalPages = Math.max(1, Math.ceil(activeList.length / perPage));
  const safePage   = Math.min(page, totalPages);
  const pageItems  = activeList.slice((safePage - 1) * perPage, safePage * perPage);

  // Liste görünümü sütun sıralaması
  const handleListSort = (key) => {
    if (listSortKey === key) { setListSortDir((d) => d === 'asc' ? 'desc' : 'asc'); }
    else { setListSortKey(key); setListSortDir('asc'); }
    setPage(1);
  };

  const listSortedItems = useMemo(() => {
    if (view !== 'list') return pageItems;
    return [...pageItems].sort((a, b) => {
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
        if (listSortKey === 'score')       { av = muadilScores[a.id]?.overall ?? -1; bv = muadilScores[b.id]?.overall ?? -1; return listSortDir === 'asc' ? av - bv : bv - av; }
      }
      return 0;
    });
  }, [pageItems, view, listSortKey, listSortDir, pTab, muadilCountMap, muadilScores]);

  const scoreColor = (v) => v === null ? C.textLight : v <= 4 ? C.red : v <= 6 ? C.orange : C.green;


  const btnStyle = (active) => ({
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    width: '34px', height: '34px', borderRadius: '8px', border: `1px solid ${C.border}`,
    background: active ? C.navy : C.card, color: active ? '#fff' : C.textMid,
    cursor: 'pointer', transition: 'all .15s', flexShrink: 0,
  });

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
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px', marginTop: '24px', flexWrap: 'wrap' }}>
        <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={safePage === 1}
          style={{ padding: '6px 14px', borderRadius: '8px', border: `1px solid ${C.border}`, background: C.card, color: safePage === 1 ? C.textLight : C.text, cursor: safePage === 1 ? 'default' : 'pointer', fontSize: '13px', fontFamily: F }}>
          ‹ Önceki
        </button>
        {pages.map((p, i) => p === '...'
          ? <span key={`e${i}`} style={{ padding: '6px 4px', color: C.textLight }}>…</span>
          : <button key={p} onClick={() => setPage(p)}
              style={{ width: '34px', height: '34px', borderRadius: '8px', border: `1px solid ${p === safePage ? C.navy : C.border}`, background: p === safePage ? C.navy : C.card, color: p === safePage ? '#fff' : C.text, cursor: 'pointer', fontSize: '13px', fontFamily: F, fontWeight: p === safePage ? 700 : 400 }}>
              {p}
            </button>
        )}
        <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={safePage === totalPages}
          style={{ padding: '6px 14px', borderRadius: '8px', border: `1px solid ${C.border}`, background: C.card, color: safePage === totalPages ? C.textLight : C.text, cursor: safePage === totalPages ? 'default' : 'pointer', fontSize: '13px', fontFamily: F }}>
          Sonraki ›
        </button>
      </div>
    );
  };

  return (
    <div style={{ minHeight: '100vh', background: C.bg, padding: xs ? '16px' : sm ? '20px 16px' : '32px' }}>
      <div style={{ maxWidth: '1320px', margin: '0 auto' }}>
        <h1 style={{ fontSize: sm ? '22px' : '26px', fontWeight: 900, color: C.navy, marginBottom: '4px' }}>Parfümler</h1>
        <p style={{ color: C.textLight, fontSize: '14px', marginBottom: '22px' }}>Orijinal parfümler ve muadilleri</p>

        {/* Üst toolbar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', marginBottom: '16px' }}>
          {/* Tab */}
          <div style={{ display: 'flex', gap: '4px', background: C.card, border: `1px solid ${C.border}`, borderRadius: '12px', padding: '4px' }}>
            {[['original', 'Orijinal'], ['muadil', 'Muadil']].map(([v, l]) => (
              <button key={v} onClick={() => switchTab(v)}
                style={{ padding: sm ? '8px 16px' : '8px 20px', borderRadius: '9px', border: 'none', background: pTab === v ? C.navy : 'transparent', color: pTab === v ? '#fff' : C.textMid, fontSize: '14px', fontWeight: 600, cursor: 'pointer', fontFamily: F, transition: 'all .2s' }}>
                {l}
              </button>
            ))}
          </div>

          {/* Sıralama + Sayfa başına + Görünüm */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <select value={sort} onChange={(e) => switchSort(e.target.value)}
              style={{ height: '34px', padding: '0 10px', borderRadius: '8px', border: `1px solid ${C.border}`, background: C.card, color: C.text, fontSize: '13px', fontFamily: F, cursor: 'pointer', outline: 'none' }}>
              {sortOpts.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>

            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: C.card, border: `1px solid ${C.border}`, borderRadius: '8px', padding: '0 6px', height: '34px' }}>
              {PER_PAGE_OPTS.map((n) => (
                <button key={n} onClick={() => switchPerPage(n)}
                  style={{ padding: '3px 7px', borderRadius: '6px', border: 'none', background: perPage === n ? C.navy : 'transparent', color: perPage === n ? '#fff' : C.textMid, fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: F, transition: 'all .15s' }}>
                  {n}
                </button>
              ))}
            </div>

            <button style={btnStyle(view === 'grid')} onClick={() => setView('grid')}><IconGrid /></button>
            <button style={btnStyle(view === 'list')} onClick={() => setView('list')}><IconList /></button>
          </div>
        </div>

        {/* Arama + Cinsiyet filtresi */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '18px', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '160px', position: 'relative' }}>
            <svg style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: C.textLight }} width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /></svg>
            <input value={search} onChange={(e) => switchSearch(e.target.value)} placeholder="Ara..." style={{ width: '100%', border: `1px solid ${C.border}`, borderRadius: '10px', padding: '10px 14px 10px 38px', fontSize: '14px', outline: 'none', boxSizing: 'border-box', fontFamily: F }} />
          </div>
          {pTab === 'original' && (
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {['all', 'Erkek', 'Kadın', 'Unisex'].map((g) => (
                <button key={g} onClick={() => switchFilter(g)}
                  style={{ padding: '9px 12px', border: `1px solid ${filter === g ? C.gold : C.border}`, borderRadius: '10px', background: filter === g ? C.goldBg : 'transparent', color: filter === g ? C.gold : C.textMid, fontSize: '13px', fontWeight: filter === g ? 700 : 400, cursor: 'pointer', fontFamily: F }}>
                  {g === 'all' ? 'Tümü' : g}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Toplam + sayfa bilgisi */}
        <div style={{ fontSize: '13px', color: C.textMid, marginBottom: '14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '6px' }}>
          <span>Toplam <strong style={{ color: C.navy }}>{activeList.length}</strong> parfüm</span>
          <span style={{ color: C.textLight }}>{(safePage - 1) * perPage + 1}–{Math.min(safePage * perPage, activeList.length)} gösteriliyor · Sayfa {safePage}/{totalPages}</span>
        </div>

        {/* Grid View */}
        {view === 'grid' && pTab === 'original' && (
          <div style={{ display: 'grid', gridTemplateColumns: xs ? '1fr' : sm ? '1fr 1fr' : 'repeat(auto-fill,minmax(270px,1fr))', gap: '16px' }}>
            {pageItems.map((p) => {
              const mc = muadilCountMap[p.id] || 0;
              const uid = user?.uid || user?.id;
              return (
                <Card key={p.id} hover style={{ padding: '0', cursor: 'pointer', position: 'relative', overflow: 'hidden' }} onClick={() => navigate(`/${p.brandSlug}/${p.slug}`)}>
                  <button onClick={(e) => { e.stopPropagation(); togglePerfumeFavorite(uid, p.id); }} style={{ position: 'absolute', top: '10px', right: '10px', zIndex: 1, width: '30px', height: '30px', borderRadius: '50%', border: `1px solid ${isPerfumeFavorite(uid, p.id) ? C.goldBorder : C.border}`, background: isPerfumeFavorite(uid, p.id) ? C.goldBg : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><FontAwesomeIcon icon={faHeart} style={{ color: isPerfumeFavorite(uid, p.id) ? C.gold : C.textLight, fontSize: '13px' }} /></button>
                  <div style={{ width: '100%', aspectRatio: '4/3', overflow: 'hidden', background: '#f0f0f0' }}>
                    <img src={p.image || noImage} alt={p.name} onError={(e) => { e.currentTarget.src = noImage; }} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                  <div style={{ padding: '12px 14px' }}>
                    <div style={{ fontSize: sm ? '13px' : '15px', fontWeight: 800, color: C.navy, marginBottom: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontFamily: FH }}>{p.name}</div>
                    <div style={{ fontSize: '12px', color: C.textMid, marginBottom: '8px' }}>{p.brandName} · {p.year}</div>
                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginBottom: '10px' }}>
                      <GenderBadge gender={p.gender} />
                      {mc > 0 && <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: '20px', fontSize: '11px', fontWeight: 600, background: C.greenBg, color: C.green, border: `1px solid ${C.greenBorder}` }}>{mc} muadil</span>}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '8px', borderTop: `1px solid ${C.borderLight}`, gap: '6px' }}>
                      <span style={{ fontSize: '11px', color: C.textLight, display: 'flex', alignItems: 'center', gap: '3px' }}><FontAwesomeIcon icon={faHeart} style={{ fontSize: '10px', color: C.gold }} /> {(p.likes || 0).toLocaleString()}</span>
                      {mc > 0 && !sm && <Btn size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); navigate(`/karsilastir?orijinal=${p.id}`); }}>Karşılaştır</Btn>}
                    </div>
                  </div>
                </Card>
              );
            })}
            {!pageItems.length && <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '60px', color: C.textLight }}>Sonuç bulunamadı.</div>}
          </div>
        )}

        {view === 'grid' && pTab === 'muadil' && (
          <div style={{ display: 'grid', gridTemplateColumns: xs ? '1fr' : sm ? '1fr 1fr' : 'repeat(auto-fill,minmax(270px,1fr))', gap: '16px' }}>
            {pageItems.map((m) => {
              const ms = muadilScores[m.id];
              const uid = user?.uid || user?.id;
              return (
                <Card key={m.id} hover style={{ padding: '0', cursor: 'pointer', position: 'relative', overflow: 'hidden' }} onClick={() => navigate(`/karsilastir?orijinal=${m.targetPerfumeId}&muadil=${m.id}`)}>
                  <button onClick={(e) => { e.stopPropagation(); toggleMuadilFavorite(uid, m.id); }} style={{ position: 'absolute', top: '10px', right: '10px', zIndex: 1, width: '30px', height: '30px', borderRadius: '50%', border: `1px solid ${isMuadilFavorite(uid, m.id) ? C.goldBorder : C.border}`, background: isMuadilFavorite(uid, m.id) ? C.goldBg : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><FontAwesomeIcon icon={faHeart} style={{ color: isMuadilFavorite(uid, m.id) ? C.gold : C.textLight, fontSize: '13px' }} /></button>
                  <div style={{ width: '100%', aspectRatio: '4/3', overflow: 'hidden', background: '#f0f0f0' }}>
                    <img src={m.image || noImage} alt={m.name} onError={(e) => { e.currentTarget.src = noImage; }} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                  <div style={{ padding: '12px 14px' }}>
                    <div style={{ fontSize: sm ? '13px' : '15px', fontWeight: 800, color: C.navy, marginBottom: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontFamily: FH }}>{m.name}</div>
                    <div style={{ fontSize: '13px', color: C.green, fontWeight: 600, marginBottom: '2px' }}>{m.brandName}</div>
                    <div style={{ fontSize: '12px', color: C.textLight, marginBottom: '10px' }}>→ {m.targetBrandName} {m.targetPerfumeName}</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '8px', borderTop: `1px solid ${C.borderLight}` }}>
                      <span style={{ fontSize: '12px', fontWeight: 700, color: scoreColor(ms?.overall ?? null) }}>{ms?.overall != null ? `${ms.overall}/10` : '—'}</span>
                      <Btn size="sm" variant="ghost">Karşılaştır →</Btn>
                    </div>
                  </div>
                </Card>
              );
            })}
            {!pageItems.length && <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '60px', color: C.textLight }}>Sonuç bulunamadı.</div>}
          </div>
        )}

        {/* List View */}
        {view === 'list' && (
          <Card style={{ overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: C.bg }}>
                  {cols.map(({ key, label }) => {
                    const active = listSortKey === key;
                    const dir = active ? (listSortDir === 'asc' ? '↑' : '↓') : '↕';
                    return (
                      <th key={key} onClick={() => handleListSort(key)}
                        style={{ padding: '10px 14px', textAlign: key === 'name' || key === 'brand' || key === 'targetPerf' || key === 'targetBrand' ? 'left' : 'center', fontSize: '11px', fontWeight: 700, color: active ? C.navy : C.textMid, textTransform: 'uppercase', letterSpacing: '.05em', borderBottom: `1px solid ${C.border}`, whiteSpace: 'nowrap', cursor: 'pointer', userSelect: 'none' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          {label}
                          <span style={{ fontSize: '12px', color: active ? C.navy : C.border, fontWeight: 900 }}>{dir}</span>
                        </span>
                      </th>
                    );
                  })}
                  <th style={{ padding: '10px 14px', borderBottom: `1px solid ${C.border}` }} />
                </tr>
              </thead>
              <tbody>
                {listSortedItems.map((item) => {
                  const uid = user?.uid || user?.id;
                  const isOrig = pTab === 'original';
                  const mc = isOrig ? (muadilCountMap[item.id] || 0) : null;
                  const ms = !isOrig ? muadilScores[item.id] : null;
                  return (
                    <tr key={item.id}
                      onClick={() => isOrig ? navigate(`/${item.brandSlug}/${item.slug}`) : navigate(`/karsilastir?orijinal=${item.targetPerfumeId}&muadil=${item.id}`)}
                      style={{ borderBottom: `1px solid ${C.borderLight}`, cursor: 'pointer', transition: 'background .1s' }}
                      onMouseEnter={(e) => e.currentTarget.style.background = C.bg}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                      {/* Parfüm / Muadil adı */}
                      <td style={{ padding: '10px 14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{ width: '38px', height: '38px', borderRadius: '8px', background: '#f0f0f0', overflow: 'hidden', flexShrink: 0 }}>
                            <img src={item.image || noImage} alt={item.name} onError={(e) => { e.currentTarget.src = noImage; }} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          </div>
                          <span style={{ fontWeight: 700, fontSize: '14px', color: C.navy, fontFamily: FH }}>{item.name}</span>
                        </div>
                      </td>
                      {/* Marka */}
                      <td style={{ padding: '10px 14px', fontSize: '13px', color: C.textMid }}>{item.brandName}</td>
                      {isOrig ? (
                        <>
                          <td style={{ padding: '10px 14px', textAlign: 'center' }}><GenderBadge gender={item.gender} /></td>
                          <td style={{ padding: '10px 14px', fontSize: '13px', color: C.textMid, textAlign: 'center' }}>{item.year || '—'}</td>
                          <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                            <span style={{ display: 'inline-block', background: mc > 0 ? C.greenBg : C.bg, color: mc > 0 ? C.green : C.textLight, border: `1px solid ${mc > 0 ? C.greenBorder : C.border}`, borderRadius: '20px', padding: '2px 10px', fontSize: '12px', fontWeight: 700 }}>{mc} muadil</span>
                          </td>
                          <td style={{ padding: '10px 14px', fontSize: '13px', color: C.textMid, textAlign: 'center' }}><FontAwesomeIcon icon={faHeart} style={{ fontSize: '11px', color: C.gold, marginRight: '4px' }} />{(item.likes || 0).toLocaleString()}</td>
                        </>
                      ) : (
                        <>
                          <td style={{ padding: '10px 14px', fontSize: '13px', color: C.textMid }}>{item.targetPerfumeName || '—'}</td>
                          <td style={{ padding: '10px 14px', fontSize: '13px', color: C.textMid }}>{item.targetBrandName || '—'}</td>
                          <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                            <span style={{ fontWeight: 700, fontSize: '13px', color: scoreColor(ms?.overall ?? null) }}>{ms?.overall != null ? `${ms.overall}/10` : '—'}</span>
                          </td>
                        </>
                      )}
                      {/* Aksiyon */}
                      <td style={{ padding: '10px 14px' }} onClick={(e) => e.stopPropagation()}>
                        <button onClick={() => isOrig ? togglePerfumeFavorite(uid, item.id) : toggleMuadilFavorite(uid, item.id)}
                            style={{ width: '28px', height: '28px', borderRadius: '50%', border: `1px solid ${(isOrig ? isPerfumeFavorite(uid, item.id) : isMuadilFavorite(uid, item.id)) ? C.goldBorder : C.border}`, background: (isOrig ? isPerfumeFavorite(uid, item.id) : isMuadilFavorite(uid, item.id)) ? C.goldBg : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                          <FontAwesomeIcon icon={faHeart} style={{ fontSize: '12px', color: (isOrig ? isPerfumeFavorite(uid, item.id) : isMuadilFavorite(uid, item.id)) ? C.gold : C.textLight }} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {!listSortedItems.length && <div style={{ textAlign: 'center', padding: '60px', color: C.textLight }}>Sonuç bulunamadı.</div>}
          </Card>
        )}

        <Pagination />
      </div>
    </div>
  );
}
