import { useState, useMemo, useEffect } from 'react';
import { useRouter } from '@/contexts/RouterContext';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import { useW } from '@/hooks/useW';
import { Card, TableScrollHint } from '@/components/ui';
import { calcScores } from '@/utils/scoring';
import { C, FH } from '@/constants/theme';
import { useSeo } from '@/lib/seo';
import noImage from '@/img/no-image.jpg';

const SORT_OPTIONS_ORIG = [
  { value: 'az',            label: 'A → Z' },
  { value: 'za',            label: 'Z → A' },
  { value: 'origin_asc',   label: 'Köken A → Z' },
  { value: 'origin_desc',  label: 'Köken Z → A' },
  { value: 'founded_asc',   label: 'Kuruluş Yılı (En Erken)' },
  { value: 'founded_desc',  label: 'Kuruluş Yılı (En Geç)' },
  { value: 'perfumes_desc', label: 'Parfüm Sayısı (En Çok)' },
  { value: 'perfumes_asc',  label: 'Parfüm Sayısı (En Az)' },
  { value: 'likes_desc',    label: 'Beğeni Sayısı (En Çok)' },
  { value: 'likes_asc',     label: 'Beğeni Sayısı (En Az)' },
  { value: 'muadils_desc',  label: 'Muadil Sayısı (En Çok)' },
  { value: 'muadils_asc',   label: 'Muadil Sayısı (En Az)' },
];
const SORT_OPTIONS_MUADIL = [
  { value: 'az',            label: 'A → Z' },
  { value: 'za',            label: 'Z → A' },
  { value: 'perfumes_desc', label: 'Parfüm Sayısı (En Çok)' },
  { value: 'perfumes_asc',  label: 'Parfüm Sayısı (En Az)' },
  { value: 'likes_desc',    label: 'Beğeni Sayısı (En Çok)' },
  { value: 'likes_asc',     label: 'Beğeni Sayısı (En Az)' },
  { value: 'score_desc',    label: 'Marka Puanı (En Yüksek)' },
  { value: 'score_asc',     label: 'Marka Puanı (En Düşük)' },
];

const scoreColor = (v) => v == null ? C.textLight : v <= 4 ? C.red : v < 7 ? C.orange : C.green;

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

export function BrandsPage() {
  useSeo({
    title: 'Markalar',
    description: 'Orijinal ve muadil parfüm markalarını keşfet. Her markanın parfüm sayısı, kökeni ve topluluk puanlarıyla birlikte incele.',
  });
  const { navigate } = useRouter();
  const { brands, perfumes, muadilPerfumes, comments, toggleBrandFavorite, isBrandFavorite } = useData();
  const { user } = useAuth();
  const { sm, xs } = useW();

  const [tab, setTab]           = useState(() => localStorage.getItem('brands_tab')  || 'original');
  const [sort, setSort]         = useState(() => localStorage.getItem('brands_sort_v2') || 'az');
  const [view, setView]         = useState(() => localStorage.getItem('brands_view_v2') || 'list');
  const [perPage, setPerPage]   = useState(() => Number(localStorage.getItem('brands_pp')) || 10);
  const [page, setPage]         = useState(1);
  const [scoreFilter, setScoreFilter] = useState('all');
  const [searchQ, setSearchQ]   = useState('');

  useEffect(() => { localStorage.setItem('brands_tab',  tab);  }, [tab]);
  useEffect(() => { localStorage.setItem('brands_sort_v2', sort); }, [sort]);
  useEffect(() => { localStorage.setItem('brands_view_v2', view); }, [view]);
  useEffect(() => { localStorage.setItem('brands_pp',   String(perPage)); }, [perPage]);

  const PER_PAGE_OPTS = [10, 20, 50, 75, 100];

  const switchTab  = (v) => { setTab(v); setPage(1); setScoreFilter('all'); setSearchQ(''); };
  const switchSort = (v) => { setSort(v); setPage(1); };
  const switchPerPage = (n) => { setPerPage(n); setPage(1); };
  const handleSearch = (v) => { setSearchQ(v); setPage(1); };

  const isOrig = tab === 'original';

  const perfumeCountMap = useMemo(() => {
    const map = {};
    perfumes.forEach(p => { map[p.brandId] = (map[p.brandId] || 0) + 1; });
    return map;
  }, [perfumes]);

  // Orijinal marka başına kaç muadil var (muadil tab'ında değil, orijinal tab'ında gösterilir)
  const muadilCountMap = useMemo(() => {
    const map = {};
    muadilPerfumes.forEach(m => {
      const perf = perfumes.find(p => p.id === m.targetPerfumeId);
      if (perf) map[perf.brandId] = (map[perf.brandId] || 0) + 1;
    });
    return map;
  }, [muadilPerfumes, perfumes]);

  // Muadil marka başına kaç muadil ürün var (muadils koleksiyonundan)
  const muadilBrandProductCount = useMemo(() => {
    const map = {};
    muadilPerfumes.forEach(m => {
      if (m.brandId) map[m.brandId] = (map[m.brandId] || 0) + 1;
    });
    return map;
  }, [muadilPerfumes]);

  // Muadil marka puanı: markaya ait tüm muadil parfümlerin overall ortalaması
  const brandScoreMap = useMemo(() => {
    const map = {};
    brands.filter(b => b.type === 'muadil').forEach(b => {
      const brandMuadils = muadilPerfumes.filter(m => m.brandId === b.id);
      const scored = brandMuadils
        .map(m => calcScores(m.id, comments).overall)
        .filter(v => v !== null);
      map[b.id] = scored.length > 0
        ? parseFloat((scored.reduce((s, v) => s + v, 0) / scored.length).toFixed(1))
        : null;
    });
    return map;
  }, [brands, muadilPerfumes, comments]);

  const sorted = useMemo(() => {
    const [sfType, sfVal] = scoreFilter === 'all' ? ['all', null] : scoreFilter.split('_');
    const sfNum = sfVal != null ? Number(sfVal) : null;
    const q = searchQ.trim().toLowerCase();
    const base = brands.filter(b => {
      if (b.type !== tab || !b.active) return false;
      if (q && !b.name.toLowerCase().includes(q) && !(b.origin || '').toLowerCase().includes(q)) return false;
      if (sfType !== 'all' && tab === 'muadil') {
        const sc = brandScoreMap[b.id];
        if (sc == null) return false;
        if (sfType === 'min' && sc < sfNum) return false;
        if (sfType === 'exact' && Math.floor(sc) !== sfNum) return false;
      }
      return true;
    });
    return [...base].sort((a, b) => {
      switch (sort) {
        case 'az':            return a.name.localeCompare(b.name, 'tr');
        case 'za':            return b.name.localeCompare(a.name, 'tr');
        case 'founded_asc':   return (a.founded || 9999) - (b.founded || 9999);
        case 'founded_desc':  return (b.founded || 0) - (a.founded || 0);
        case 'perfumes_desc': return isOrig
          ? (perfumeCountMap[b.id] || 0) - (perfumeCountMap[a.id] || 0)
          : (muadilBrandProductCount[b.id] || 0) - (muadilBrandProductCount[a.id] || 0);
        case 'perfumes_asc':  return isOrig
          ? (perfumeCountMap[a.id] || 0) - (perfumeCountMap[b.id] || 0)
          : (muadilBrandProductCount[a.id] || 0) - (muadilBrandProductCount[b.id] || 0);
        case 'origin_asc':    return (a.origin || '').localeCompare(b.origin || '', 'tr');
        case 'origin_desc':   return (b.origin || '').localeCompare(a.origin || '', 'tr');
        case 'likes_desc':    return (b.likes || 0) - (a.likes || 0);
        case 'likes_asc':     return (a.likes || 0) - (b.likes || 0);
        case 'muadils_desc':  return (muadilCountMap[b.id] || 0) - (muadilCountMap[a.id] || 0);
        case 'muadils_asc':   return (muadilCountMap[a.id] || 0) - (muadilCountMap[b.id] || 0);
        case 'score_desc':    return (brandScoreMap[b.id] ?? -1) - (brandScoreMap[a.id] ?? -1);
        case 'score_asc':     return (brandScoreMap[a.id] ?? 11) - (brandScoreMap[b.id] ?? 11);
        default:              return 0;
      }
    });
  }, [brands, tab, sort, isOrig, perfumeCountMap, muadilCountMap, muadilBrandProductCount, brandScoreMap, scoreFilter, searchQ]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / perPage));
  const safePage   = Math.min(page, totalPages);
  const pageItems  = sorted.slice((safePage - 1) * perPage, safePage * perPage);

  // Dynamic view-toggle button style (active state depends on state)
  const btnStyle = (active) => ({
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    width: '34px', height: '34px', borderRadius: '8px', border: `1px solid ${C.border}`,
    background: active ? C.navy : C.card, color: active ? '#fff' : C.textMid,
    cursor: 'pointer', transition: 'all .15s', flexShrink: 0,
  });

  return (
    <div
      className="min-h-screen bg-(--color-bg)"
      style={{ padding: xs ? '16px' : sm ? '20px 16px' : '32px' }}
    >
      <div className="max-w-[1320px] mx-auto">
        <h1
          className="font-black text-(--color-navy) mb-1"
          style={{ fontSize: sm ? '22px' : '26px' }}
        >
          Markalar
        </h1>
        <p className="text-(--color-text-light) text-[14px] mb-[22px]">Orijinal ve muadil parfüm evleri</p>

        {/* Toolbar */}
        <div className="flex items-center justify-between mb-[14px] flex-wrap gap-[10px]">
          {/* Tabs */}
          <div className="flex gap-1 bg-(--color-card) border border-(--color-border) rounded-[12px] p-1">
            {[['original', 'Orijinal Markalar'], ['muadil', 'Muadil Markalar']].map(([v, l]) => (
              <button
                key={v}
                onClick={() => switchTab(v)}
                className="rounded-[9px] border-none cursor-pointer font-semibold transition-all duration-200 font-[--font-body]"
                style={{
                  padding: sm ? '8px 14px' : '8px 22px',
                  background: tab === v ? C.navy : 'transparent',
                  color: tab === v ? '#fff' : C.textMid,
                  fontSize: sm ? '13px' : '14px',
                }}
              >
                {l}
              </button>
            ))}
          </div>

          {/* Sort + Per-page + View */}
          <div className="flex items-center gap-2 flex-wrap">
            {!isOrig && (
              <select
                value={scoreFilter}
                onChange={e => { setScoreFilter(e.target.value); setPage(1); }}
                className="h-[34px] px-[10px] rounded-[8px] text-[13px] cursor-pointer outline-none font-[--font-body]"
                style={{
                  border: `1px solid ${scoreFilter !== 'all' ? C.gold : C.border}`,
                  background: scoreFilter !== 'all' ? C.goldBg : C.card,
                  color: scoreFilter !== 'all' ? C.gold : C.text,
                  fontWeight: scoreFilter !== 'all' ? 700 : 400,
                }}
              >
                <option value="all">Tüm Puanlar</option>
                <optgroup label="Sadece">
                  {[1,2,3,4,5,6,7,8,9].map(n => (
                    <option key={`exact_${n}`} value={`exact_${n}`}>Sadece {n}/10</option>
                  ))}
                  <option value="exact_10">Sadece 10/10</option>
                </optgroup>
                <optgroup label="En az">
                  {[1,2,3,4,5,6,7,8,9].map(n => (
                    <option key={`min_${n}`} value={`min_${n}`}>En az {n}/10</option>
                  ))}
                </optgroup>
              </select>
            )}
            <select
              value={sort}
              onChange={e => switchSort(e.target.value)}
              className="h-[34px] px-[10px] rounded-[8px] border border-(--color-border) bg-(--color-card) text-(--color-text) text-[13px] cursor-pointer outline-none font-[--font-body]"
            >
              {(isOrig ? SORT_OPTIONS_ORIG : SORT_OPTIONS_MUADIL).map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>

            <div className="flex items-center gap-1 bg-(--color-card) border border-(--color-border) rounded-[8px] px-[6px] h-[34px]">
              {PER_PAGE_OPTS.map(n => (
                <button
                  key={n}
                  onClick={() => switchPerPage(n)}
                  className="px-[7px] py-[3px] rounded-[6px] border-none cursor-pointer text-[12px] font-semibold transition-all duration-150 font-[--font-body]"
                  style={{
                    background: perPage === n ? C.navy : 'transparent',
                    color: perPage === n ? '#fff' : C.textMid,
                  }}
                >
                  {n}
                </button>
              ))}
            </div>

            <button style={btnStyle(view === 'grid')} onClick={() => setView('grid')} title="Izgara görünümü">
              <IconGrid />
            </button>
            <button style={btnStyle(view === 'list')} onClick={() => setView('list')} title="Liste görünümü">
              <IconList />
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="mb-[14px]">
          <div
            className="flex items-center gap-2 bg-(--color-card) rounded-[10px] px-[14px] h-10 max-w-[400px] transition-[border-color,box-shadow] duration-200"
            style={{
              border: `1px solid ${searchQ ? C.gold : C.border}`,
              boxShadow: searchQ ? `0 0 0 3px ${C.goldBg}` : 'none',
            }}
          >
            <svg width="13" height="13" fill="none" stroke={searchQ ? C.gold : C.textLight} strokeWidth="2" viewBox="0 0 24 24" className="shrink-0">
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
            </svg>
            <input
              value={searchQ}
              onChange={e => handleSearch(e.target.value)}
              placeholder="Marka adı veya köken ara..."
              className="flex-1 border-none outline-none text-[13px] text-(--color-text) bg-transparent font-[--font-body]"
            />
            {searchQ && (
              <button
                onClick={() => handleSearch('')}
                className="bg-transparent border-none cursor-pointer text-(--color-text-light) text-[16px] leading-none p-0"
              >
                ×
              </button>
            )}
          </div>
        </div>

        {/* Total + page info */}
        <div className="text-[13px] text-(--color-text-mid) mb-[14px] flex items-center justify-between flex-wrap gap-[6px]">
          <span>Toplam <strong className="text-(--color-navy)">{sorted.length}</strong> marka</span>
          {sorted.length > 0 && (
            <span className="text-(--color-text-light)">
              {(safePage - 1) * perPage + 1}–{Math.min(safePage * perPage, sorted.length)} gösteriliyor · Sayfa {safePage}/{totalPages}
            </span>
          )}
        </div>

        {/* Grid View */}
        {view === 'grid' && (
          <div
            className="grid gap-[14px]"
            style={{ gridTemplateColumns: xs ? '1fr' : sm ? '1fr 1fr' : 'repeat(auto-fill,minmax(230px,1fr))' }}
          >
            {pageItems.map(b => (
              <Card
                key={b.id}
                hover
                style={{ padding: sm ? '16px' : '22px', cursor: 'pointer', position: 'relative' }}
                onClick={() => navigate(`/marka/${b.slug}`)}
                onMouseDown={(e) => { if (e.button === 1) { e.preventDefault(); window.open(`/marka/${b.slug}`, '_blank'); } }}
              >
                <button
                  onClick={e => { e.stopPropagation(); toggleBrandFavorite(user?.uid || user?.id, b.id); }}
                  className="absolute top-[10px] right-[10px] w-7 h-7 rounded-full flex items-center justify-center cursor-pointer text-[13px] transition-all duration-150"
                  style={{
                    border: `1px solid ${isBrandFavorite(user?.uid || user?.id, b.id) ? C.redBorder : C.border}`,
                    background: isBrandFavorite(user?.uid || user?.id, b.id) ? C.redBg : '#fff',
                  }}
                  title={user ? (isBrandFavorite(user?.uid || user?.id, b.id) ? 'Favoriden çıkar' : 'Favoriye ekle') : 'Giriş yapın'}
                >
                  {isBrandFavorite(user?.uid || user?.id, b.id) ? '❤️' : '🤍'}
                </button>
                <div className="flex gap-3 items-center mb-3">
                  <div
                    className="rounded-full flex items-center justify-center text-[11px] font-extrabold shrink-0 overflow-hidden"
                    style={{
                      width: sm ? '38px' : '46px',
                      height: sm ? '38px' : '46px',
                      background: isOrig ? C.goldBg : C.greenBg,
                      border: `1px solid ${isOrig ? C.goldBorder : '#E2D088'}`,
                      color: isOrig ? C.gold : C.green,
                    }}
                  >
                    <img src={b.logoImage || noImage} alt={b.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="pr-6 min-w-0">
                    <div
                      className="font-semibold text-(--color-navy) whitespace-nowrap overflow-hidden text-ellipsis font-[--font-display]"
                      style={{ fontSize: sm ? '14px' : '16px' }}
                    >
                      {b.name}
                    </div>
                    <div className="text-[12px] text-(--color-text-mid)">{b.origin}{isOrig && b.founded ? ` · ${b.founded}` : ''}</div>
                  </div>
                </div>
                <div className="text-[12px] text-(--color-text-light) pt-[10px] border-t border-(--color-border-light) flex gap-3 items-center flex-wrap">
                  <span>♥ {(b.likes || 0).toLocaleString()}</span>
                  {isOrig && <span>{perfumeCountMap[b.id] || 0} parfüm</span>}
                  {isOrig && <span>{muadilCountMap[b.id] || 0} muadil</span>}
                  {!isOrig && <span>{muadilBrandProductCount[b.id] || 0} parfüm</span>}
                  {!isOrig && (() => {
                    const sc = brandScoreMap[b.id];
                    return (
                      <span className="ml-auto flex items-center gap-[5px]">
                        <span className="text-[11px] text-(--color-text-light)">Puan</span>
                        <span className="font-extrabold text-[13px]" style={{ color: scoreColor(sc) }}>
                          {sc != null ? `${sc}/10` : '—'}
                        </span>
                      </span>
                    );
                  })()}
                </div>
              </Card>
            ))}
            {!sorted.length && (
              <div className="col-span-full text-center p-[60px] text-(--color-text-light)">
                Bu kategoride marka bulunmuyor.
              </div>
            )}
          </div>
        )}
        {view === 'grid' && totalPages > 1 && (
          <div className="flex justify-center items-center gap-[6px] mt-7 flex-wrap">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={safePage === 1}
              className="px-[14px] py-[6px] rounded-[8px] border border-(--color-border) bg-(--color-card) text-[13px] font-[--font-body]"
              style={{ color: safePage === 1 ? C.textLight : C.text, cursor: safePage === 1 ? 'default' : 'pointer' }}
            >
              ‹
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).filter(n => n === 1 || n === totalPages || Math.abs(n - safePage) <= 1).reduce((acc, n, idx, arr) => {
              if (idx > 0 && n - arr[idx - 1] > 1) acc.push('…');
              acc.push(n);
              return acc;
            }, []).map((n, i) => n === '…' ? (
              <span key={`e${i}`} className="px-1 text-(--color-text-light)">…</span>
            ) : (
              <button
                key={n}
                onClick={() => setPage(n)}
                className="px-[11px] py-[6px] rounded-[8px] text-[13px] cursor-pointer font-[--font-body]"
                style={{
                  border: `1px solid ${n === safePage ? C.navy : C.border}`,
                  background: n === safePage ? C.navy : C.card,
                  color: n === safePage ? '#fff' : C.text,
                  fontWeight: n === safePage ? 700 : 400,
                }}
              >
                {n}
              </button>
            ))}
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={safePage === totalPages}
              className="px-[14px] py-[6px] rounded-[8px] border border-(--color-border) bg-(--color-card) text-[13px] font-[--font-body]"
              style={{ color: safePage === totalPages ? C.textLight : C.text, cursor: safePage === totalPages ? 'default' : 'pointer' }}
            >
              ›
            </button>
          </div>
        )}

        {/* List View */}
        {view === 'list' && (() => {
          // Column → sort pairs (asc, desc)
          const COL_SORT = {
            'Marka':   ['az',           'za'],
            'Köken':   ['origin_asc',   'origin_desc'],
            'Kuruluş': ['founded_asc',  'founded_desc'],
            'Parfüm':  ['perfumes_desc','perfumes_asc'],
            'Muadil':  ['muadils_desc', 'muadils_asc'],
            'Favori':  ['likes_desc',   'likes_asc'],
            'Puan':    ['score_desc',   'score_asc'],
          };
          const handleColSort = (col) => {
            const pair = COL_SORT[col];
            if (!pair) return;
            const [asc, desc] = pair;
            if (sort === asc) { setSort(desc); localStorage.setItem('brands_sort', desc); }
            else { setSort(asc); localStorage.setItem('brands_sort', asc); }
          };
          const colActive = (col) => {
            const pair = COL_SORT[col];
            return pair ? pair.includes(sort) : false;
          };
          const colDir = (col) => {
            const pair = COL_SORT[col];
            if (!pair) return null;
            if (sort === pair[0]) return '↑';
            if (sort === pair[1]) return '↓';
            return null;
          };
          const columns = ['Marka', 'Köken', isOrig ? 'Kuruluş' : null, 'Parfüm', isOrig ? 'Muadil' : null, !isOrig ? 'Puan' : null, 'Favori', ''].filter(v => v !== null);
          return (
          <>
          <Card style={{ overflow: 'hidden' }}>
            <TableScrollHint />
            <div className="overflow-x-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
            <table className="w-full border-collapse" style={{ minWidth: '620px' }}>
              <thead>
                <tr className="bg-(--color-bg)">
                  {columns.map(h => {
                    const sortable = !!COL_SORT[h];
                    const active = colActive(h);
                    const dir = colDir(h);
                    return (
                      <th
                        key={h}
                        onClick={() => handleColSort(h)}
                        className="px-[14px] py-[10px] text-[11px] font-bold uppercase tracking-[.05em] whitespace-nowrap select-none transition-[color] duration-150"
                        style={{
                          textAlign: h === 'Marka' ? 'left' : 'center',
                          color: active ? C.navy : C.textMid,
                          borderBottom: `1px solid ${C.border}`,
                          cursor: sortable ? 'pointer' : 'default',
                        }}
                      >
                        <span className="inline-flex items-center gap-1">
                          {h}
                          {sortable && (
                            <span className="text-[12px] font-black" style={{ color: active ? C.navy : C.border }}>
                              {dir || '↕'}
                            </span>
                          )}
                        </span>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {pageItems.map((b) => (
                  <tr
                    key={b.id}
                    onClick={() => { if (window.getSelection()?.toString()) return; navigate(`/marka/${b.slug}`); }}
                    onMouseDown={(e) => { if (e.button === 1) { e.preventDefault(); window.open(`/marka/${b.slug}`, '_blank'); } }}
                    className="cursor-pointer transition-[background] duration-100"
                    style={{ borderBottom: `1px solid ${C.borderLight}` }}
                    onMouseEnter={e => e.currentTarget.style.background = C.bg}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <td className="px-[14px] py-3">
                      <div className="flex items-center gap-[10px]">
                        <div
                          className="w-9 h-9 rounded-full overflow-hidden shrink-0"
                          style={{
                            background: isOrig ? C.goldBg : C.greenBg,
                            border: `1px solid ${isOrig ? C.goldBorder : C.greenBorder}`,
                          }}
                        >
                          <img src={b.logoImage || noImage} alt={b.name} className="w-full h-full object-cover" />
                        </div>
                        <span className="font-semibold text-[14px] text-(--color-navy)" style={{ fontFamily: FH }}>{b.name}</span>
                      </div>
                    </td>
                    <td className="px-[14px] py-3 text-[13px] text-(--color-text-mid) text-center">{b.origin || '—'}</td>
                    {isOrig && <td className="px-[14px] py-3 text-[13px] text-(--color-text-mid) text-center">{b.founded || '—'}</td>}
                    <td className="px-[14px] py-3 text-[13px] text-(--color-text-mid) text-center">
                      {isOrig ? (perfumeCountMap[b.id] || 0) : (muadilBrandProductCount[b.id] || 0)}
                    </td>
                    {isOrig && <td className="px-[14px] py-3 text-[13px] text-(--color-text-mid) text-center">{muadilCountMap[b.id] || 0}</td>}
                    {!isOrig && (() => {
                      const sc = brandScoreMap[b.id];
                      return (
                        <td className="px-[14px] py-3 text-center">
                          {sc != null ? (
                            <span className="font-extrabold text-[14px]" style={{ color: scoreColor(sc) }}>{sc}/10</span>
                          ) : (
                            <span className="text-(--color-text-light) text-[13px]">—</span>
                          )}
                        </td>
                      );
                    })()}
                    <td className="px-[14px] py-3 text-[13px] text-(--color-text-mid) text-center">♥ {(b.likes || 0).toLocaleString()}</td>
                    <td className="px-[14px] py-3">
                      <div className="flex justify-center">
                        <button
                          onClick={e => { e.stopPropagation(); toggleBrandFavorite(user?.uid || user?.id, b.id); }}
                          title={user ? (isBrandFavorite(user?.uid || user?.id, b.id) ? 'Favoriden çıkar' : 'Favoriye ekle') : 'Giriş yapın'}
                          className="w-7 h-7 rounded-full flex items-center justify-center cursor-pointer text-[13px] transition-all duration-150"
                          style={{
                            border: `1px solid ${isBrandFavorite(user?.uid || user?.id, b.id) ? C.redBorder : C.border}`,
                            background: isBrandFavorite(user?.uid || user?.id, b.id) ? C.redBg : '#fff',
                          }}
                        >
                          {isBrandFavorite(user?.uid || user?.id, b.id) ? '❤️' : '🤍'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
            {!sorted.length && (
              <div className="text-center p-[60px] text-(--color-text-light)">Bu kategoride marka bulunmuyor.</div>
            )}
          </Card>
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-[6px] mt-5 flex-wrap">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={safePage === 1}
                className="px-[14px] py-[6px] rounded-[8px] border border-(--color-border) bg-(--color-card) text-[13px] font-[--font-body]"
                style={{ color: safePage === 1 ? C.textLight : C.text, cursor: safePage === 1 ? 'default' : 'pointer' }}
              >
                ‹
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).filter(n => n === 1 || n === totalPages || Math.abs(n - safePage) <= 1).reduce((acc, n, idx, arr) => {
                if (idx > 0 && n - arr[idx - 1] > 1) acc.push('…');
                acc.push(n);
                return acc;
              }, []).map((n, i) => n === '…' ? (
                <span key={`e${i}`} className="px-1 text-(--color-text-light)">…</span>
              ) : (
                <button
                  key={n}
                  onClick={() => setPage(n)}
                  className="px-[11px] py-[6px] rounded-[8px] text-[13px] cursor-pointer font-[--font-body]"
                  style={{
                    border: `1px solid ${n === safePage ? C.navy : C.border}`,
                    background: n === safePage ? C.navy : C.card,
                    color: n === safePage ? '#fff' : C.text,
                    fontWeight: n === safePage ? 700 : 400,
                  }}
                >
                  {n}
                </button>
              ))}
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={safePage === totalPages}
                className="px-[14px] py-[6px] rounded-[8px] border border-(--color-border) bg-(--color-card) text-[13px] font-[--font-body]"
                style={{ color: safePage === totalPages ? C.textLight : C.text, cursor: safePage === totalPages ? 'default' : 'pointer' }}
              >
                ›
              </button>
            </div>
          )}
          </>
          );
        })()}
      </div>
    </div>
  );
}
