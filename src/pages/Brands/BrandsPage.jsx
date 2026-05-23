import { useState, useMemo, useEffect } from 'react';
import { useRouter } from '@/contexts/RouterContext';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import { useW } from '@/hooks/useW';
import { Card } from '@/components/ui';
import { calcScores } from '@/utils/scoring';
import { C, F, FH } from '@/constants/theme';
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
  { value: 'founded_asc',   label: 'Kuruluş Yılı (En Erken)' },
  { value: 'founded_desc',  label: 'Kuruluş Yılı (En Geç)' },
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
  const { navigate } = useRouter();
  const { brands, perfumes, muadilPerfumes, comments, toggleBrandFavorite, isBrandFavorite } = useData();
  const { user } = useAuth();
  const { sm, xs } = useW();

  const [tab, setTab]       = useState(() => localStorage.getItem('brands_tab')  || 'original');
  const [sort, setSort]     = useState(() => localStorage.getItem('brands_sort_v2') || 'az');
  const [view, setView]     = useState(() => localStorage.getItem('brands_view_v2') || 'list');
  const [perPage, setPerPage] = useState(() => Number(localStorage.getItem('brands_pp')) || 10);
  const [page, setPage]     = useState(1);

  useEffect(() => { localStorage.setItem('brands_tab',  tab);  }, [tab]);
  useEffect(() => { localStorage.setItem('brands_sort_v2', sort); }, [sort]);
  useEffect(() => { localStorage.setItem('brands_view_v2', view); }, [view]);
  useEffect(() => { localStorage.setItem('brands_pp',   String(perPage)); }, [perPage]);

  const PER_PAGE_OPTS = [10, 20, 50, 75, 100];

  const switchTab  = (v) => { setTab(v);  setPage(1); };
  const switchSort = (v) => { setSort(v); setPage(1); };
  const switchPerPage = (n) => { setPerPage(n); setPage(1); };

  const isOrig = tab === 'original';

  const perfumeCountMap = useMemo(() => {
    const map = {};
    perfumes.forEach(p => { map[p.brandId] = (map[p.brandId] || 0) + 1; });
    return map;
  }, [perfumes]);

  const muadilCountMap = useMemo(() => {
    const map = {};
    muadilPerfumes.forEach(m => {
      const perf = perfumes.find(p => p.id === m.targetPerfumeId);
      if (perf) map[perf.brandId] = (map[perf.brandId] || 0) + 1;
    });
    return map;
  }, [muadilPerfumes, perfumes]);

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
    const base = brands.filter(b => b.type === tab && b.active);
    return [...base].sort((a, b) => {
      switch (sort) {
        case 'az':            return a.name.localeCompare(b.name, 'tr');
        case 'za':            return b.name.localeCompare(a.name, 'tr');
        case 'founded_asc':   return (a.founded || 9999) - (b.founded || 9999);
        case 'founded_desc':  return (b.founded || 0) - (a.founded || 0);
        case 'perfumes_desc': return (perfumeCountMap[b.id] || 0) - (perfumeCountMap[a.id] || 0);
        case 'perfumes_asc':  return (perfumeCountMap[a.id] || 0) - (perfumeCountMap[b.id] || 0);
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
  }, [brands, tab, sort, perfumeCountMap, muadilCountMap, brandScoreMap]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / perPage));
  const safePage   = Math.min(page, totalPages);
  const pageItems  = sorted.slice((safePage - 1) * perPage, safePage * perPage);

  const btnStyle = (active) => ({
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    width: '34px', height: '34px', borderRadius: '8px', border: `1px solid ${C.border}`,
    background: active ? C.navy : C.card, color: active ? '#fff' : C.textMid,
    cursor: 'pointer', transition: 'all .15s', flexShrink: 0,
  });

  return (
    <div style={{ minHeight: '100vh', background: C.bg, padding: xs ? '16px' : sm ? '20px 16px' : '32px' }}>
      <div style={{ maxWidth: '1320px', margin: '0 auto' }}>
        <h1 style={{ fontSize: sm ? '22px' : '26px', fontWeight: 900, color: C.navy, marginBottom: '4px' }}>Markalar</h1>
        <p style={{ color: C.textLight, fontSize: '14px', marginBottom: '22px' }}>Orijinal ve muadil parfüm evleri</p>

        {/* Toolbar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '22px', flexWrap: 'wrap', gap: '10px' }}>
          {/* Tabs */}
          <div style={{ display: 'flex', gap: '4px', background: C.card, border: `1px solid ${C.border}`, borderRadius: '12px', padding: '4px' }}>
            {[['original', 'Orijinal Markalar'], ['muadil', 'Muadil Markalar']].map(([v, l]) => (
              <button key={v} onClick={() => switchTab(v)} style={{ padding: sm ? '8px 14px' : '8px 22px', borderRadius: '9px', border: 'none', background: tab === v ? C.navy : 'transparent', color: tab === v ? '#fff' : C.textMid, fontSize: sm ? '13px' : '14px', fontWeight: 600, cursor: 'pointer', fontFamily: F, transition: 'all .2s' }}>{l}</button>
            ))}
          </div>

          {/* Sort + Per-page + View */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <select
              value={sort}
              onChange={e => switchSort(e.target.value)}
              style={{ height: '34px', padding: '0 10px', borderRadius: '8px', border: `1px solid ${C.border}`, background: C.card, color: C.text, fontSize: '13px', fontFamily: F, cursor: 'pointer', outline: 'none' }}
            >
              {(isOrig ? SORT_OPTIONS_ORIG : SORT_OPTIONS_MUADIL).map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>

            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: C.card, border: `1px solid ${C.border}`, borderRadius: '8px', padding: '0 6px', height: '34px' }}>
              {PER_PAGE_OPTS.map(n => (
                <button key={n} onClick={() => switchPerPage(n)}
                  style={{ padding: '3px 7px', borderRadius: '6px', border: 'none', background: perPage === n ? C.navy : 'transparent', color: perPage === n ? '#fff' : C.textMid, fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: F, transition: 'all .15s' }}>
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

        {/* Toplam + sayfa bilgisi */}
        <div style={{ fontSize: '13px', color: C.textMid, marginBottom: '14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '6px' }}>
          <span>Toplam <strong style={{ color: C.navy }}>{sorted.length}</strong> marka</span>
          {sorted.length > 0 && <span style={{ color: C.textLight }}>{(safePage - 1) * perPage + 1}–{Math.min(safePage * perPage, sorted.length)} gösteriliyor · Sayfa {safePage}/{totalPages}</span>}
        </div>

        {/* Grid View */}
        {view === 'grid' && (
          <div style={{ display: 'grid', gridTemplateColumns: xs ? '1fr' : sm ? '1fr 1fr' : 'repeat(auto-fill,minmax(230px,1fr))', gap: '14px' }}>
            {pageItems.map(b => (
              <Card key={b.id} hover style={{ padding: sm ? '16px' : '22px', cursor: 'pointer', position: 'relative' }} onClick={() => navigate(`/marka/${b.slug}`)}>
                <button
                  onClick={e => { e.stopPropagation(); toggleBrandFavorite(user?.uid || user?.id, b.id); }}
                  style={{ position: 'absolute', top: '10px', right: '10px', width: '28px', height: '28px', borderRadius: '50%', border: `1px solid ${isBrandFavorite(user?.uid || user?.id, b.id) ? C.redBorder : C.border}`, background: isBrandFavorite(user?.uid || user?.id, b.id) ? C.redBg : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '13px', transition: 'all .15s' }}
                  title={user ? (isBrandFavorite(user?.uid || user?.id, b.id) ? 'Favoriden çıkar' : 'Favoriye ekle') : 'Giriş yapın'}>
                  {isBrandFavorite(user?.uid || user?.id, b.id) ? '❤️' : '🤍'}
                </button>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '12px' }}>
                  <div style={{ width: sm ? '38px' : '46px', height: sm ? '38px' : '46px', borderRadius: '50%', background: isOrig ? C.goldBg : C.greenBg, border: `1px solid ${isOrig ? C.goldBorder : C.greenBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 800, color: isOrig ? C.gold : C.green, flexShrink: 0, overflow: 'hidden' }}>
                    <img src={b.logoImage || noImage} alt={b.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                  <div style={{ paddingRight: '24px', minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: sm ? '14px' : '16px', color: C.navy, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontFamily: FH }}>{b.name}</div>
                    <div style={{ fontSize: '12px', color: C.textMid }}>{b.origin} · {b.founded}</div>
                  </div>
                </div>
                <div style={{ fontSize: '12px', color: C.textLight, paddingTop: '10px', borderTop: `1px solid ${C.borderLight}`, display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <span>♥ {(b.likes || 0).toLocaleString()}</span>
                  {isOrig && <span>{perfumeCountMap[b.id] || 0} parfüm</span>}
                  {isOrig && <span>{muadilCountMap[b.id] || 0} muadil</span>}
                  {!isOrig && <span>{perfumeCountMap[b.id] || 0} parfüm</span>}
                  {!isOrig && (() => {
                    const sc = brandScoreMap[b.id];
                    return (
                      <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <span style={{ fontSize: '11px', color: C.textLight }}>Puan</span>
                        <span style={{ fontWeight: 800, fontSize: '13px', color: scoreColor(sc) }}>
                          {sc != null ? `${sc}/10` : '—'}
                        </span>
                      </span>
                    );
                  })()}
                </div>
              </Card>
            ))}
            {!sorted.length && <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '60px', color: C.textLight }}>Bu kategoride marka bulunmuyor.</div>}
          </div>
        )}
        {view === 'grid' && totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px', marginTop: '28px', flexWrap: 'wrap' }}>
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={safePage === 1}
              style={{ padding: '6px 14px', borderRadius: '8px', border: `1px solid ${C.border}`, background: C.card, color: safePage === 1 ? C.textLight : C.text, cursor: safePage === 1 ? 'default' : 'pointer', fontSize: '13px', fontFamily: F }}>‹</button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).filter(n => n === 1 || n === totalPages || Math.abs(n - safePage) <= 1).reduce((acc, n, idx, arr) => {
              if (idx > 0 && n - arr[idx - 1] > 1) acc.push('…');
              acc.push(n);
              return acc;
            }, []).map((n, i) => n === '…' ? (
              <span key={`e${i}`} style={{ padding: '0 4px', color: C.textLight }}>…</span>
            ) : (
              <button key={n} onClick={() => setPage(n)}
                style={{ padding: '6px 11px', borderRadius: '8px', border: `1px solid ${n === safePage ? C.navy : C.border}`, background: n === safePage ? C.navy : C.card, color: n === safePage ? '#fff' : C.text, cursor: 'pointer', fontSize: '13px', fontWeight: n === safePage ? 700 : 400, fontFamily: F }}>{n}</button>
            ))}
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={safePage === totalPages}
              style={{ padding: '6px 14px', borderRadius: '8px', border: `1px solid ${C.border}`, background: C.card, color: safePage === totalPages ? C.textLight : C.text, cursor: safePage === totalPages ? 'default' : 'pointer', fontSize: '13px', fontFamily: F }}>›</button>
          </div>
        )}

        {/* List View */}
        {view === 'list' && (() => {
          // Sütun → sıralama çiftleri (asc, desc)
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
          const columns = ['Marka', 'Köken', 'Kuruluş', 'Parfüm', isOrig ? 'Muadil' : null, !isOrig ? 'Puan' : null, 'Favori', ''].filter(v => v !== null);
          return (
          <>
          <Card style={{ overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
            <table style={{ width: '100%', minWidth: '620px', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: C.bg }}>
                  {columns.map(h => {
                    const sortable = !!COL_SORT[h];
                    const active = colActive(h);
                    const dir = colDir(h);
                    return (
                      <th key={h}
                        onClick={() => handleColSort(h)}
                        style={{ padding: '10px 14px', textAlign: h === 'Marka' ? 'left' : 'center', fontSize: '11px', fontWeight: 700, color: active ? C.navy : C.textMid, textTransform: 'uppercase', letterSpacing: '.05em', borderBottom: `1px solid ${C.border}`, whiteSpace: 'nowrap', cursor: sortable ? 'pointer' : 'default', userSelect: 'none', transition: 'color .15s' }}
                      >
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          {h}
                          {sortable && (
                            <span style={{ fontSize: '12px', color: active ? C.navy : C.border, fontWeight: 900 }}>
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
                {pageItems.map((b, i) => (
                  <tr key={b.id} onClick={() => navigate(`/marka/${b.slug}`)}
                    style={{ borderBottom: `1px solid ${C.borderLight}`, cursor: 'pointer', transition: 'background .1s' }}
                    onMouseEnter={e => e.currentTarget.style.background = C.bg}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: isOrig ? C.goldBg : C.greenBg, border: `1px solid ${isOrig ? C.goldBorder : C.greenBorder}`, overflow: 'hidden', flexShrink: 0 }}>
                          <img src={b.logoImage || noImage} alt={b.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                        <span style={{ fontWeight: 600, fontSize: '14px', color: C.navy, fontFamily: FH }}>{b.name}</span>
                      </div>
                    </td>
                    <td style={{ padding: '12px 14px', fontSize: '13px', color: C.textMid, textAlign: 'center' }}>{b.origin || '—'}</td>
                    <td style={{ padding: '12px 14px', fontSize: '13px', color: C.textMid, textAlign: 'center' }}>{b.founded || '—'}</td>
                    <td style={{ padding: '12px 14px', fontSize: '13px', color: C.textMid, textAlign: 'center' }}>{perfumeCountMap[b.id] || 0}</td>
                    {isOrig && <td style={{ padding: '12px 14px', fontSize: '13px', color: C.textMid, textAlign: 'center' }}>{muadilCountMap[b.id] || 0}</td>}
                    {!isOrig && (() => {
                      const sc = brandScoreMap[b.id];
                      return (
                        <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                          {sc != null ? (
                            <span style={{ fontWeight: 800, fontSize: '14px', color: scoreColor(sc) }}>{sc}/10</span>
                          ) : (
                            <span style={{ color: C.textLight, fontSize: '13px' }}>—</span>
                          )}
                        </td>
                      );
                    })()}
                    <td style={{ padding: '12px 14px', fontSize: '13px', color: C.textMid, textAlign: 'center' }}>♥ {(b.likes || 0).toLocaleString()}</td>
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ display: 'flex', justifyContent: 'center' }}>
                        <button
                          onClick={e => { e.stopPropagation(); toggleBrandFavorite(user?.uid || user?.id, b.id); }}
                          title={user ? (isBrandFavorite(user?.uid || user?.id, b.id) ? 'Favoriden çıkar' : 'Favoriye ekle') : 'Giriş yapın'}
                          style={{ width: '28px', height: '28px', borderRadius: '50%', border: `1px solid ${isBrandFavorite(user?.uid || user?.id, b.id) ? C.redBorder : C.border}`, background: isBrandFavorite(user?.uid || user?.id, b.id) ? C.redBg : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '13px', transition: 'all .15s' }}>
                          {isBrandFavorite(user?.uid || user?.id, b.id) ? '❤️' : '🤍'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
            {!sorted.length && <div style={{ textAlign: 'center', padding: '60px', color: C.textLight }}>Bu kategoride marka bulunmuyor.</div>}
          </Card>
          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px', marginTop: '20px', flexWrap: 'wrap' }}>
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={safePage === 1}
                style={{ padding: '6px 14px', borderRadius: '8px', border: `1px solid ${C.border}`, background: C.card, color: safePage === 1 ? C.textLight : C.text, cursor: safePage === 1 ? 'default' : 'pointer', fontSize: '13px', fontFamily: F }}>‹</button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).filter(n => n === 1 || n === totalPages || Math.abs(n - safePage) <= 1).reduce((acc, n, idx, arr) => {
                if (idx > 0 && n - arr[idx - 1] > 1) acc.push('…');
                acc.push(n);
                return acc;
              }, []).map((n, i) => n === '…' ? (
                <span key={`e${i}`} style={{ padding: '0 4px', color: C.textLight }}>…</span>
              ) : (
                <button key={n} onClick={() => setPage(n)}
                  style={{ padding: '6px 11px', borderRadius: '8px', border: `1px solid ${n === safePage ? C.navy : C.border}`, background: n === safePage ? C.navy : C.card, color: n === safePage ? '#fff' : C.text, cursor: 'pointer', fontSize: '13px', fontWeight: n === safePage ? 700 : 400, fontFamily: F }}>{n}</button>
              ))}
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={safePage === totalPages}
                style={{ padding: '6px 14px', borderRadius: '8px', border: `1px solid ${C.border}`, background: C.card, color: safePage === totalPages ? C.textLight : C.text, cursor: safePage === totalPages ? 'default' : 'pointer', fontSize: '13px', fontFamily: F }}>›</button>
            </div>
          )}
          </>
          );
        })()}
      </div>
    </div>
  );
}
