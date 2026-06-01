import { useState, useMemo } from 'react';
import { useRouter } from '@/contexts/RouterContext';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { useW } from '@/hooks/useW';
import { calcScores } from '@/utils/scoring';
import { Card, Badge, Btn, ScoreBar } from '@/components/ui';
import { GenderBadge } from '@/components/shared';
import { C, F, FH } from '@/constants/theme';
import { useSeo } from '@/lib/seo';
import { faArrowUp, faHeart, faArrowDown, faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import noImage from '@/img/no-image.jpg';

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

const COLS = [
  { key: 'brand',      label: 'Marka' },
  { key: 'name',       label: 'Ürün' },
  { key: 'scent',      label: 'Koku Yakınlığı' },
  { key: 'projection', label: 'Yayılım' },
  { key: 'longevity',  label: 'Kalıcılık' },
  { key: 'overall',    label: 'Genel Puan' },
  { key: 'count',      label: 'Değerlendirme' },
];

export function PerfumeDetailPage({ params }) {
  const { navigate, goBack } = useRouter();
  const { perfumes, muadilPerfumes, comments, toggleMuadilFavorite, isMuadilFavorite } = useData();
  const { user } = useAuth();
  const { sm, xs } = useW();
  const [view, setView] = useState('list');
  const [sortKey, setSortKey] = useState('name');
  const [sortDir, setSortDir] = useState('asc');

  const perfume = perfumes.find((p) => p.brandSlug === params?.brandSlug && p.slug === params?.perfumeSlug);

  useSeo({
    title: perfume ? `${perfume.name} — ${perfume.brandName}` : 'Parfüm',
    description: perfume
      ? (perfume.description || `${perfume.brandName} ${perfume.name} parfümünün notalarını incele ve en yakın muadillerini topluluk puanlarıyla karşılaştır.`)
      : undefined,
    image: perfume?.image || undefined,
    type: 'product',
    noindex: !perfume,
    jsonLd: perfume ? {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: perfume.name,
      category: 'Parfüm',
      brand: { '@type': 'Brand', name: perfume.brandName },
      ...(perfume.image ? { image: perfume.image } : {}),
      ...(perfume.description ? { description: perfume.description } : {}),
    } : null,
  });

  const muadiller = perfume ? muadilPerfumes.filter((m) => m.targetPerfumeId === perfume.id) : [];

  const muadillerWithScores = useMemo(() =>
    muadiller.map((m) => ({ m, ms: calcScores(m.id, comments) })),
    [muadiller, comments]
  );

  const sorted = useMemo(() => {
    return [...muadillerWithScores].sort((a, b) => {
      let av, bv;
      if (sortKey === 'brand') { av = a.m.brandName || ''; bv = b.m.brandName || ''; return sortDir === 'asc' ? av.localeCompare(bv, 'tr') : bv.localeCompare(av, 'tr'); }
      if (sortKey === 'name')  { av = a.m.name || '';      bv = b.m.name || '';      return sortDir === 'asc' ? av.localeCompare(bv, 'tr') : bv.localeCompare(av, 'tr'); }
      av = a.ms[sortKey] ?? -1;
      bv = b.ms[sortKey] ?? -1;
      return sortDir === 'asc' ? av - bv : bv - av;
    });
  }, [muadillerWithScores, sortKey, sortDir]);

  if (!perfume) return <div style={{ padding: '60px', textAlign: 'center', color: C.textLight }}>Parfüm bulunamadı.</div>;

  const handleSort = (key) => {
    if (sortKey === key) setSortDir((d) => d === 'desc' ? 'asc' : 'desc');
    else { setSortKey(key); setSortDir('desc'); }
  };

  const btnStyle = (active) => ({
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    width: '34px', height: '34px', borderRadius: '8px', border: `1px solid ${C.border}`,
    background: active ? C.navy : C.card, color: active ? '#fff' : C.textMid,
    cursor: 'pointer', transition: 'all .15s', flexShrink: 0,
  });

  const scoreColor = (v) => v === null ? C.textLight : v <= 4 ? C.red : v < 7 ? C.orange : C.green;

  return (
    <div style={{ minHeight: '100vh', background: C.bg, padding: xs ? '16px' : sm ? '20px 16px' : '32px' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>

        {/* Üst bar: Geri Dön + Breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '22px', flexWrap: 'wrap' }}>
          <button onClick={() => goBack(`/marka/${perfume.brandSlug}`)} onMouseDown={(e) => { if (e.button === 1) { e.preventDefault(); window.open(`/marka/${perfume.brandSlug}`, '_blank'); } }}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', background: C.card, border: `1px solid ${C.border}`, borderRadius: '10px', padding: '7px 14px', color: C.textMid, fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: F, flexShrink: 0, transition: 'all .15s' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = C.bg; e.currentTarget.style.borderColor = C.navy; e.currentTarget.style.color = C.navy; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = C.card; e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.textMid; }}>
            <FontAwesomeIcon icon={faArrowLeft} style={{ fontSize: '12px' }} />
            Geri Dön
          </button>
          <div style={{ display: 'flex', gap: '6px', fontSize: '13px', color: C.textLight, alignItems: 'center', flexWrap: 'wrap' }}>
            <span onClick={() => navigate('/')} style={{ cursor: 'pointer', color: C.gold }}>Ana Sayfa</span>
            <span>/</span>
            <span onClick={() => navigate(`/marka/${perfume.brandSlug}`)} onMouseDown={(e) => { if (e.button === 1) { e.preventDefault(); window.open(`/marka/${perfume.brandSlug}`, '_blank'); } }} style={{ cursor: 'pointer', color: C.gold }}>{perfume.brandName}</span>
            <span>/</span>
            <span style={{ color: C.text, fontWeight: 600 }}>{perfume.name}</span>
          </div>
        </div>

        {/* Üst kart */}
        <div style={{ display: 'grid', gridTemplateColumns: sm ? '1fr' : '260px 1fr', gap: '24px', marginBottom: '32px' }}>
          <Card style={{ padding: '0', overflow: 'hidden' }}>
            <div style={{ width: '100%', aspectRatio: sm ? '16/9' : '4/3', background: `linear-gradient(135deg,${C.goldBg},#fff)`, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <img src={perfume.images?.[0]?.src || noImage} alt={perfume.name} onError={(e) => { e.currentTarget.src = noImage; }} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
            <div style={{ padding: '16px 18px' }}>
              <div style={{ fontSize: '18px', fontWeight: 600, color: C.navy, marginBottom: '3px', fontFamily: "'Inter', sans-serif" }}>{perfume.name}</div>
              <div style={{ fontSize: '13px', color: C.textMid, marginBottom: '12px' }}>{perfume.brandName}</div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <GenderBadge gender={perfume.gender} />
                <Badge color="gold">{perfume.year}</Badge>
              </div>
              <Btn style={{ marginTop: '14px', width: '100%', justifyContent: 'center' }} onClick={() => navigate(`/karsilastir?orijinal=${perfume.id}`)}>
                Muadil Karşılaştır
              </Btn>
            </div>
          </Card>

          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '16px', padding: sm ? '18px' : '24px' }}>
            <h1 style={{ fontSize: 'clamp(24px,4vw,44px)', fontWeight: 600, color: C.navy, marginBottom: '8px', fontFamily: "'Inter', sans-serif", letterSpacing: '-0.01em' }}>{perfume.name}</h1>
            <div style={{ fontSize: '15px', color: C.textMid, marginBottom: '16px' }}>{perfume.brandName} · Est. {perfume.year}</div>
            <p style={{ fontSize: '15px', color: C.text, lineHeight: 1.7, marginBottom: '22px', fontStyle: 'italic' }}>"{perfume.description}"</p>
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: C.navy, marginBottom: '12px' }}>Koku Notaları</h3>
            <div style={{ display: 'grid', gridTemplateColumns: sm ? '1fr' : '1fr 1fr 1fr', gap: '10px' }}>
              {[
                ['Üst Notalar',  faArrowUp,   perfume.notes?.top   || [], C.goldBg,  C.goldBorder,  C.gold],
                ['Kalp Notaları',faHeart,     perfume.notes?.heart || [], '#fff5f8', '#f0c0d0', '#c06080'],
                ['Dip Notalar',  faArrowDown, perfume.notes?.base  || [], C.greenBg, C.greenBorder, C.green],
              ].map(([l, icon, notes, bg, border, col]) => (
                <div key={l} style={{ background: bg, border: `1px solid ${border}`, borderRadius: '12px', padding: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '8px' }}>
                    <FontAwesomeIcon icon={icon} style={{ fontSize: '11px', color: col }} />
                    <span style={{ fontSize: '11px', fontWeight: 700, color: col, letterSpacing: '.06em', textTransform: 'uppercase' }}>{l}</span>
                  </div>
                  {notes.map((n) => (
                    <div key={n} style={{ fontSize: '13px', color: C.text, marginBottom: '4px', display: 'flex', gap: '5px', alignItems: 'center' }}>
                      <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: col, flexShrink: 0, display: 'inline-block' }} />
                      {n}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Muadil başlık + toolbar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '22px', fontWeight: 800, color: C.navy, margin: 0, fontFamily: FH }}>
            Muadil Parfümler
            <span style={{ fontSize: '14px', fontWeight: 500, color: C.textLight, marginLeft: '8px', fontFamily: F }}>({muadiller.length})</span>
          </h2>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button style={btnStyle(view === 'grid')} onClick={() => setView('grid')} title="Izgara görünümü"><IconGrid /></button>
            <button style={btnStyle(view === 'list')} onClick={() => setView('list')} title="Liste görünümü"><IconList /></button>
          </div>
        </div>

        {/* Grid View */}
        {view === 'grid' && (
          <div style={{ display: 'grid', gridTemplateColumns: xs ? '1fr' : sm ? '1fr 1fr' : 'repeat(auto-fill,minmax(260px,1fr))', gap: '16px' }}>
            {sorted.map(({ m, ms }) => {
              const uid = user?.uid || user?.id;
              const fav = isMuadilFavorite(uid, m.id);
              return (
                <Card key={m.id} hover style={{ padding: '0', cursor: 'pointer', overflow: 'hidden', position: 'relative' }} onClick={() => navigate(`/karsilastir?orijinal=${perfume.id}&muadil=${m.id}`)}>
                  <div style={{ width: '100%', aspectRatio: '4/3', background: '#f0f0f0', overflow: 'hidden', position: 'relative' }}>
                    <img src={m.image || noImage} alt={m.name} onError={(e) => { e.currentTarget.src = noImage; }} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleMuadilFavorite(uid, m.id); }}
                      style={{ position: 'absolute', top: '10px', right: '10px', width: '30px', height: '30px', borderRadius: '50%', border: `1px solid ${fav ? C.goldBorder : 'rgba(255,255,255,.6)'}`, background: fav ? C.goldBg : 'rgba(255,255,255,.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', backdropFilter: 'blur(4px)', boxShadow: '0 2px 6px rgba(0,0,0,.1)' }}>
                      <FontAwesomeIcon icon={faHeart} style={{ fontSize: '12px', color: fav ? C.gold : C.textLight }} />
                    </button>
                  </div>
                  <div style={{ padding: '14px 16px' }}>
                    <div style={{ fontWeight: 400, fontSize: '15px', color: C.navy, marginBottom: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontFamily: "'Inter', sans-serif" }}>{m.name}</div>
                    <div style={{ fontSize: '13px', color: C.textMid, marginBottom: '10px' }}>{m.brandName}</div>
                    <ScoreBar label="Koku Yakınlığı" value={ms.scent} empty={ms.scent === null} />
                    <ScoreBar label="Yayılım" value={ms.projection} empty={ms.projection === null} />
                    <ScoreBar label="Kalıcılık" value={ms.longevity} empty={ms.longevity === null} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px', paddingTop: '10px', borderTop: `1px solid ${C.borderLight}` }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <span style={{ fontSize: '12px', fontWeight: 700, color: scoreColor(ms.overall) }}>
                          {ms.overall !== null ? `${ms.overall}/10` : '—'}
                        </span>
                        <span style={{ fontSize: '11px', color: C.textLight }}>
                          {ms.count ? `${ms.count} değerlendirme` : 'Henüz yorum yok'}
                        </span>
                      </div>
                      <Btn size="sm" variant="ghost">Karşılaştır</Btn>
                    </div>
                  </div>
                </Card>
              );
            })}
            {!sorted.length && <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '40px', color: C.textLight }}>Henüz muadil eklenmemiş.</div>}
          </div>
        )}

        {/* List View */}
        {view === 'list' && (
          <Card style={{ overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
            <table style={{ width: '100%', minWidth: '560px', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: C.bg }}>
                  {COLS.map(({ key, label }) => {
                    const active = sortKey === key;
                    const dir = active ? (sortDir === 'desc' ? '↓' : '↑') : '↕';
                    return (
                      <th key={key} onClick={() => handleSort(key)}
                        style={{ padding: '10px 14px', textAlign: key === 'brand' || key === 'name' ? 'left' : 'center', fontSize: '11px', fontWeight: 700, color: active ? C.navy : C.textMid, textTransform: 'uppercase', letterSpacing: '.05em', borderBottom: `1px solid ${C.border}`, whiteSpace: 'nowrap', cursor: 'pointer', userSelect: 'none' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          {label}
                          <span style={{ fontSize: '12px', color: active ? C.navy : C.border, fontWeight: 900 }}>{dir}</span>
                        </span>
                      </th>
                    );
                  })}
                  <th style={{ padding: '10px 14px', fontSize: '11px', fontWeight: 700, color: C.textMid, textTransform: 'uppercase', letterSpacing: '.05em', borderBottom: `1px solid ${C.border}` }} />
                </tr>
              </thead>
              <tbody>
                {sorted.map(({ m, ms }) => {
                  const uid = user?.uid || user?.id;
                  const fav = isMuadilFavorite(uid, m.id);
                  return (
                    <tr key={m.id} onClick={() => navigate(`/karsilastir?orijinal=${perfume.id}&muadil=${m.id}`)}
                      style={{ borderBottom: `1px solid ${C.borderLight}`, cursor: 'pointer', transition: 'background .1s' }}
                      onMouseEnter={(e) => e.currentTarget.style.background = C.bg}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                      <td style={{ padding: '12px 14px', fontSize: '13px', color: C.textMid, fontWeight: 600 }}>{m.brandName}</td>
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#f0f0f0', overflow: 'hidden', flexShrink: 0 }}>
                            <img src={m.image || noImage} alt={m.name} onError={(e) => { e.currentTarget.src = noImage; }} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          </div>
                          <span style={{ fontWeight: 400, fontSize: '14px', color: C.navy, fontFamily: "'Inter', sans-serif" }}>{m.name}</span>
                        </div>
                      </td>
                      {['scent', 'projection', 'longevity', 'overall'].map((k) => (
                        <td key={k} style={{ padding: '12px 14px', textAlign: 'center' }}>
                          <span style={{ fontWeight: 700, fontSize: '13px', color: scoreColor(ms[k]) }}>
                            {ms[k] !== null ? `${ms[k]}/10` : '—'}
                          </span>
                        </td>
                      ))}
                      <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                        {ms.count
                          ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: C.goldBg, border: `1px solid ${C.goldBorder}`, borderRadius: '20px', padding: '2px 10px', fontSize: '12px', fontWeight: 700, color: C.gold }}>{ms.count} kişi</span>
                          : <span style={{ fontSize: '12px', color: C.textLight, fontStyle: 'italic' }}>—</span>
                        }
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
                          <button
                            onClick={() => toggleMuadilFavorite(uid, m.id)}
                            style={{ width: '28px', height: '28px', borderRadius: '50%', border: `1px solid ${fav ? C.goldBorder : C.border}`, background: fav ? C.goldBg : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                            <FontAwesomeIcon icon={faHeart} style={{ fontSize: '12px', color: fav ? C.gold : C.textLight }} />
                          </button>
                          <Btn size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); navigate(`/karsilastir?orijinal=${perfume.id}&muadil=${m.id}`); }}>Karşılaştır</Btn>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            </div>
            {!sorted.length && <div style={{ textAlign: 'center', padding: '40px', color: C.textLight }}>Henüz muadil eklenmemiş.</div>}
          </Card>
        )}
      </div>
    </div>
  );
}
