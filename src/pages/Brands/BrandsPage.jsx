import { useState, useMemo, useEffect } from 'react';
import { useRouter } from '@/contexts/RouterContext';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import { useW } from '@/hooks/useW';
import { Card } from '@/components/ui';
import { C, F, FH } from '@/constants/theme';
import noImage from '@/img/no-image.jpg';

const SORT_OPTIONS = [
  { value: 'az',            label: 'A → Z' },
  { value: 'za',            label: 'Z → A' },
  { value: 'founded_asc',   label: 'Kuruluş Yılı (En Erken)' },
  { value: 'founded_desc',  label: 'Kuruluş Yılı (En Geç)' },
  { value: 'perfumes_desc', label: 'Parfüm Sayısı (En Çok)' },
  { value: 'perfumes_asc',  label: 'Parfüm Sayısı (En Az)' },
  { value: 'likes_desc',    label: 'Beğeni Sayısı (En Çok)' },
  { value: 'likes_asc',     label: 'Beğeni Sayısı (En Az)' },
  { value: 'muadils_desc',  label: 'Muadil Sayısı (En Çok)' },
  { value: 'muadils_asc',   label: 'Muadil Sayısı (En Az)' },
];

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
  const { brands, perfumes, muadilPerfumes, toggleBrandFavorite, isBrandFavorite } = useData();
  const { user } = useAuth();
  const { sm, xs } = useW();

  const [tab, setTab]   = useState(() => localStorage.getItem('brands_tab')  || 'original');
  const [sort, setSort] = useState(() => localStorage.getItem('brands_sort') || 'az');
  const [view, setView] = useState(() => localStorage.getItem('brands_view') || 'grid');

  useEffect(() => { localStorage.setItem('brands_tab',  tab);  }, [tab]);
  useEffect(() => { localStorage.setItem('brands_sort', sort); }, [sort]);
  useEffect(() => { localStorage.setItem('brands_view', view); }, [view]);

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
        case 'likes_desc':    return (b.likes || 0) - (a.likes || 0);
        case 'likes_asc':     return (a.likes || 0) - (b.likes || 0);
        case 'muadils_desc':  return (muadilCountMap[b.id] || 0) - (muadilCountMap[a.id] || 0);
        case 'muadils_asc':   return (muadilCountMap[a.id] || 0) - (muadilCountMap[b.id] || 0);
        default:              return 0;
      }
    });
  }, [brands, tab, sort, perfumeCountMap, muadilCountMap]);

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
              <button key={v} onClick={() => setTab(v)} style={{ padding: sm ? '8px 14px' : '8px 22px', borderRadius: '9px', border: 'none', background: tab === v ? C.navy : 'transparent', color: tab === v ? '#fff' : C.textMid, fontSize: sm ? '13px' : '14px', fontWeight: 600, cursor: 'pointer', fontFamily: F, transition: 'all .2s' }}>{l}</button>
            ))}
          </div>

          {/* Sort + View */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <select
              value={sort}
              onChange={e => setSort(e.target.value)}
              style={{ height: '34px', padding: '0 10px', borderRadius: '8px', border: `1px solid ${C.border}`, background: C.card, color: C.text, fontSize: '13px', fontFamily: F, cursor: 'pointer', outline: 'none' }}
            >
              {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>

            <button style={btnStyle(view === 'grid')} onClick={() => setView('grid')} title="Izgara görünümü">
              <IconGrid />
            </button>
            <button style={btnStyle(view === 'list')} onClick={() => setView('list')} title="Liste görünümü">
              <IconList />
            </button>
          </div>
        </div>

        {/* Grid View */}
        {view === 'grid' && (
          <div style={{ display: 'grid', gridTemplateColumns: xs ? '1fr' : sm ? '1fr 1fr' : 'repeat(auto-fill,minmax(230px,1fr))', gap: '14px' }}>
            {sorted.map(b => (
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
                <div style={{ fontSize: '12px', color: C.textLight, paddingTop: '10px', borderTop: `1px solid ${C.borderLight}`, display: 'flex', gap: '12px' }}>
                  <span>♥ {(b.likes || 0).toLocaleString()}</span>
                  {isOrig && <span>{perfumeCountMap[b.id] || 0} parfüm</span>}
                  {isOrig && <span>{muadilCountMap[b.id] || 0} muadil</span>}
                  {!isOrig && <span>{perfumeCountMap[b.id] || 0} parfüm</span>}
                </div>
              </Card>
            ))}
            {!sorted.length && <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '60px', color: C.textLight }}>Bu kategoride marka bulunmuyor.</div>}
          </div>
        )}

        {/* List View */}
        {view === 'list' && (() => {
          // Sütun → sıralama çiftleri (asc, desc)
          const COL_SORT = {
            'Marka':   ['az',           'za'],
            'Kuruluş': ['founded_asc',  'founded_desc'],
            'Parfüm':  ['perfumes_desc','perfumes_asc'],
            'Muadil':  ['muadils_desc', 'muadils_asc'],
            'Beğeni':  ['likes_desc',   'likes_asc'],
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
          const columns = ['Marka', 'Köken', 'Kuruluş', 'Parfüm', isOrig ? 'Muadil' : null, 'Beğeni', 'Favori'].filter(Boolean);
          return (
          <>
          <div style={{ fontSize: '13px', color: C.textMid, marginBottom: '10px' }}>
            Toplam <strong style={{ color: C.navy }}>{sorted.length}</strong> marka
          </div>
          <Card style={{ overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
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
                {sorted.map((b, i) => (
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
            {!sorted.length && <div style={{ textAlign: 'center', padding: '60px', color: C.textLight }}>Bu kategoride marka bulunmuyor.</div>}
          </Card>
          </>
          );
        })()}
      </div>
    </div>
  );
}
