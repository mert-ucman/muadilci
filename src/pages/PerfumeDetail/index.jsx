import { useState, useMemo } from 'react';
import { useRouter } from '@/contexts/RouterContext';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { useW } from '@/hooks/useW';
import { calcScores } from '@/utils/scoring';
import { Card, Badge, Btn, ScoreBar, TableScrollHint } from '@/components/ui';
import { GenderBadge } from '@/components/shared';
import { C, F, FH } from '@/constants/theme';
import { useSeo } from '@/lib/seo';
import { faArrowUp, faHeart, faArrowDown, faArrowLeft, faLeaf } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
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
  const { perfumes, muadilPerfumes, comments, noImageUrl, toggleMuadilFavorite, isMuadilFavorite } = useData();
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

  if (!perfume) return (
    <div className="px-[60px] py-[60px] text-center text-[color:var(--color-text-light)]">
      Parfüm bulunamadı.
    </div>
  );

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
    <div
      className="min-h-screen bg-(--color-bg)"
      style={{ padding: xs ? '16px' : sm ? '20px 16px' : '32px' }}
    >
      <div className="max-w-[1100px] mx-auto">

        {/* Üst bar: Geri Dön + Breadcrumb */}
        <div className="flex items-center gap-[14px] mb-[22px] flex-wrap">
          <button
            onClick={() => goBack(`/marka/${perfume.brandSlug}`)}
            onMouseDown={(e) => { if (e.button === 1) { e.preventDefault(); window.open(`/marka/${perfume.brandSlug}`, '_blank'); } }}
            className="inline-flex items-center gap-[7px] bg-(--color-card) border border-(--color-border) rounded-[10px] px-[14px] py-[7px] text-(--color-text-mid) text-[13px] font-semibold cursor-pointer shrink-0 transition-all duration-150"
            style={{ fontFamily: F }}
            onMouseEnter={(e) => { e.currentTarget.style.background = C.bg; e.currentTarget.style.borderColor = C.navy; e.currentTarget.style.color = C.navy; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = C.card; e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.textMid; }}
          >
            <FontAwesomeIcon icon={faArrowLeft} className="text-[12px]" />
            Geri Dön
          </button>
          <div className="flex gap-[6px] text-[13px] text-(--color-text-light) items-center flex-wrap">
            <span onClick={() => navigate('/')} className="cursor-pointer text-(--color-gold)">Ana Sayfa</span>
            <span>/</span>
            <span
              onClick={() => navigate(`/marka/${perfume.brandSlug}`)}
              onMouseDown={(e) => { if (e.button === 1) { e.preventDefault(); window.open(`/marka/${perfume.brandSlug}`, '_blank'); } }}
              className="cursor-pointer text-(--color-gold)"
            >
              {perfume.brandName}
            </span>
            <span>/</span>
            <span className="text-(--color-text) font-semibold">{perfume.name}</span>
          </div>
        </div>

        {/* Üst kart */}
        <div
          className="grid gap-[24px] mb-[32px]"
          style={{ gridTemplateColumns: sm ? '1fr' : '260px 1fr' }}
        >
          <Card style={{ padding: '0', overflow: 'hidden' }}>
            <div
              className="w-full overflow-hidden flex items-center justify-center"
              style={{
                aspectRatio: sm ? '16/9' : '4/3',
                background: `linear-gradient(135deg,${C.goldBg},#fff)`,
              }}
            >
              <img
                src={perfume.images?.[0]?.src || noImageUrl || undefined}
                alt={perfume.name}
                onError={(e) => { e.currentTarget.onerror = null; noImageUrl ? (e.currentTarget.src = noImageUrl) : (e.currentTarget.style.display = 'none'); }}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="px-[18px] py-[16px]">
              <div className="text-[18px] font-semibold text-(--color-navy) mb-[3px]" style={{ fontFamily: "'Inter', sans-serif" }}>{perfume.name}</div>
              <div className="text-[13px] text-(--color-text-mid) mb-[12px]">{perfume.brandName}</div>
              <div className="flex gap-[8px] flex-wrap">
                <GenderBadge gender={perfume.gender} />
                <Badge color="gold">{perfume.year}</Badge>
              </div>
              <Btn style={{ marginTop: '14px', width: '100%', justifyContent: 'center' }} onClick={() => navigate(`/karsilastir?orijinal=${perfume.id}`)}>
                Muadil Karşılaştır
              </Btn>
            </div>
          </Card>

          <div
            className="bg-(--color-card) border border-(--color-border) rounded-[16px] flex flex-col justify-between"
            style={{ padding: sm ? '18px' : '24px' }}
          >
            <h1
              className="font-semibold text-(--color-navy) mb-[8px]"
              style={{ fontSize: 'clamp(24px,4vw,44px)', fontFamily: "'Inter', sans-serif", letterSpacing: '-0.01em' }}
            >
              {perfume.name}
            </h1>
            <div className="text-[15px] text-(--color-text-mid) mb-[16px]">{perfume.brandName} · Est. {perfume.year}</div>
            <p className="text-[15px] text-(--color-text) leading-[1.7] mb-[22px] italic">{perfume.description}</p>
            <h3 className="text-[15px] font-bold text-(--color-navy) mb-[12px]">Koku Notaları</h3>
            {(() => {
              const topNotes   = perfume.notes?.top   || [];
              const heartNotes = perfume.notes?.heart || [];
              const baseNotes  = perfume.notes?.base  || [];
              const hasAll = topNotes.length > 0 && (heartNotes.length > 0 || baseNotes.length > 0);

              if (!hasAll && topNotes.length > 0) {
                // Sadece üst notalar var → pill/tag listesi
                return (
                  <div>
                    <div className="flex items-center gap-[6px] mb-[10px]">
                      <FontAwesomeIcon icon={faLeaf} style={{ fontSize: '12px', color: C.gold }} />
                      <span style={{ fontSize: '12px', fontWeight: 700, color: C.gold, letterSpacing: '.06em', textTransform: 'uppercase' }}>Notalar</span>
                    </div>
                    <div className="flex flex-wrap gap-[8px]">
                      {topNotes.map((n) => (
                        <div
                          key={n}
                          className="inline-flex items-center justify-center rounded-[20px] px-[12px] py-[5px]"
                          style={{ background: C.goldBg, border: `1px solid ${C.goldBorder}` }}
                        >
                          <p className="m-0 p-0 w-max" style={{ fontSize: '13px', color: C.gold, fontWeight: 500 }}>{n}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              }

              // Üst + orta + alt notalar → üç ayrı kart
              return (
                <div
                  className="grid gap-[10px]"
                  style={{ gridTemplateColumns: sm ? '1fr' : '1fr 1fr 1fr' }}
                >
                  {[
                    ['Üst Notalar',   faArrowUp,   topNotes,   C.goldBg,  C.goldBorder,  C.gold],
                    ['Kalp Notaları', faHeart,     heartNotes, '#fff5f8', '#f0c0d0',     '#c06080'],
                    ['Dip Notalar',   faArrowDown, baseNotes,  C.greenBg, C.greenBorder, C.green],
                  ].map(([l, icon, notes, bg, border, col]) => (
                    <div key={l} style={{ background: bg, border: `1px solid ${border}` }} className="rounded-[12px] p-[12px]">
                      <div className="flex items-center gap-[5px] mb-[8px]">
                        <FontAwesomeIcon icon={icon} style={{ fontSize: '11px', color: col }} />
                        <span style={{ fontSize: '11px', fontWeight: 700, color: col, letterSpacing: '.06em', textTransform: 'uppercase' }}>{l}</span>
                      </div>
                      {notes.map((n) => (
                        <div key={n} className="text-[13px] text-(--color-text) mb-[4px] flex gap-[5px] items-center">
                          <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: col }} className="shrink-0 inline-block" />
                          {n}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
        </div>

        {/* Muadil başlık + toolbar */}
        <div className="flex items-center justify-between flex-wrap gap-[10px] mb-[16px]">
          <h2
            className="text-[22px] font-extrabold text-(--color-navy) m-0"
            style={{ fontFamily: FH }}
          >
            Muadil Parfümler
            <span className="text-[14px] font-medium text-(--color-text-light) ml-[8px]" style={{ fontFamily: F }}>({muadiller.length})</span>
          </h2>
          <div className="flex gap-[8px]">
            <button style={btnStyle(view === 'grid')} onClick={() => setView('grid')} title="Izgara görünümü"><IconGrid /></button>
            <button style={btnStyle(view === 'list')} onClick={() => setView('list')} title="Liste görünümü"><IconList /></button>
          </div>
        </div>

        {/* Grid View */}
        {view === 'grid' && (
          <div
            className="grid gap-[16px]"
            style={{ gridTemplateColumns: xs ? '1fr' : sm ? '1fr 1fr' : 'repeat(auto-fill,minmax(260px,1fr))' }}
          >
            {sorted.map(({ m, ms }) => {
              const uid = user?.uid || user?.id;
              const fav = isMuadilFavorite(uid, m.id);
              return (
                <Card key={m.id} hover style={{ padding: '0', cursor: 'pointer', overflow: 'hidden', position: 'relative' }} onClick={() => navigate(`/karsilastir?orijinal=${perfume.id}&muadil=${m.id}`)}>
                  <div className="w-full bg-[#f0f0f0] overflow-hidden relative" style={{ aspectRatio: '4/3' }}>
                    <img src={m.image || noImageUrl || undefined} alt={m.name} onError={(e) => { e.currentTarget.onerror = null; noImageUrl ? (e.currentTarget.src = noImageUrl) : (e.currentTarget.style.display = 'none'); }} className="w-full h-full object-cover" />
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleMuadilFavorite(uid, m.id); }}
                      className="absolute top-[10px] right-[10px] w-[30px] h-[30px] rounded-full flex items-center justify-center cursor-pointer backdrop-blur-[4px] shadow-[0_2px_6px_rgba(0,0,0,.1)]"
                      style={{
                        border: `1px solid ${fav ? C.goldBorder : 'rgba(255,255,255,.6)'}`,
                        background: fav ? C.goldBg : 'rgba(255,255,255,.9)',
                      }}
                    >
                      <FontAwesomeIcon icon={faHeart} style={{ fontSize: '12px', color: fav ? C.gold : C.textLight }} />
                    </button>
                  </div>
                  <div className="px-[16px] py-[14px]">
                    <div className="font-normal text-[15px] text-(--color-navy) mb-[2px] whitespace-nowrap overflow-hidden text-ellipsis" style={{ fontFamily: "'Inter', sans-serif" }}>{m.name}</div>
                    <div className="text-[13px] text-(--color-text-mid) mb-[10px]">{m.brandName}</div>
                    <ScoreBar label="Koku Yakınlığı" value={ms.scent} empty={ms.scent === null} />
                    <ScoreBar label="Yayılım" value={ms.projection} empty={ms.projection === null} />
                    <ScoreBar label="Kalıcılık" value={ms.longevity} empty={ms.longevity === null} />
                    <div className="flex justify-between items-center mt-[10px] pt-[10px] border-t border-(--color-border-light)">
                      <div className="flex flex-col gap-[2px]">
                        <span style={{ fontSize: '12px', fontWeight: 700, color: scoreColor(ms.overall) }}>
                          {ms.overall !== null ? `${ms.overall}/10` : '—'}
                        </span>
                        <span className="text-[11px] text-(--color-text-light)">
                          {ms.count ? `${ms.count} değerlendirme` : 'Henüz yorum yok'}
                        </span>
                      </div>
                      <Btn size="sm" variant="ghost">Karşılaştır</Btn>
                    </div>
                  </div>
                </Card>
              );
            })}
            {!sorted.length && (
              <div className="col-span-full text-center py-[40px] px-[40px] text-(--color-text-light)">
                Henüz muadil eklenmemiş.
              </div>
            )}
          </div>
        )}

        {/* List View */}
        {view === 'list' && (
          <Card style={{ overflow: 'hidden' }}>
            <TableScrollHint />
            <div className="overflow-x-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
            <table className="w-full min-w-[560px] border-collapse">
              <thead>
                <tr className="bg-(--color-bg)">
                  {COLS.map(({ key, label }) => {
                    const active = sortKey === key;
                    const dir = active ? (sortDir === 'desc' ? '↓' : '↑') : '↕';
                    return (
                      <th
                        key={key}
                        onClick={() => handleSort(key)}
                        className="px-[14px] py-[10px] text-[11px] font-bold uppercase tracking-[.05em] border-b border-(--color-border) whitespace-nowrap cursor-pointer select-none"
                        style={{
                          textAlign: key === 'brand' || key === 'name' ? 'left' : 'center',
                          color: active ? C.navy : C.textMid,
                        }}
                      >
                        <span className="inline-flex items-center gap-[4px]">
                          {label}
                          <span style={{ fontSize: '12px', color: active ? C.navy : C.border, fontWeight: 900 }}>{dir}</span>
                        </span>
                      </th>
                    );
                  })}
                  <th className="px-[14px] py-[10px] text-[11px] font-bold uppercase tracking-[.05em] border-b border-(--color-border) text-(--color-text-mid)" />
                </tr>
              </thead>
              <tbody>
                {sorted.map(({ m, ms }) => {
                  const uid = user?.uid || user?.id;
                  const fav = isMuadilFavorite(uid, m.id);
                  return (
                    <tr
                      key={m.id}
                      onClick={() => navigate(`/karsilastir?orijinal=${perfume.id}&muadil=${m.id}`)}
                      className="border-b border-(--color-border-light) cursor-pointer transition-[background] duration-100"
                      onMouseEnter={(e) => e.currentTarget.style.background = C.bg}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      <td className="px-[14px] py-[12px] text-[13px] text-(--color-text-mid) font-semibold">{m.brandName}</td>
                      <td className="px-[14px] py-[12px]">
                        <div className="flex items-center gap-[10px]">
                          <div className="w-[36px] h-[36px] rounded-[8px] bg-[#f0f0f0] overflow-hidden shrink-0">
                            <img src={m.image || noImageUrl || undefined} alt={m.name} onError={(e) => { e.currentTarget.onerror = null; noImageUrl ? (e.currentTarget.src = noImageUrl) : (e.currentTarget.style.display = 'none'); }} className="w-full h-full object-cover" />
                          </div>
                          <span className="font-normal text-[14px] text-(--color-navy)" style={{ fontFamily: "'Inter', sans-serif" }}>{m.name}</span>
                        </div>
                      </td>
                      {['scent', 'projection', 'longevity', 'overall'].map((k) => (
                        <td key={k} className="px-[14px] py-[12px] text-center">
                          <span style={{ fontWeight: 700, fontSize: '13px', color: scoreColor(ms[k]) }}>
                            {ms[k] !== null ? `${ms[k]}/10` : '—'}
                          </span>
                        </td>
                      ))}
                      <td className="px-[14px] py-[12px] text-center">
                        {ms.count
                          ? (
                            <div className="inline-flex items-center gap-[4px] bg-(--color-gold-bg) border border-(--color-gold-border) rounded-[20px] px-[10px] py-[2px] text-[12px] font-bold text-(--color-gold)">
                              {ms.count} kişi
                            </div>
                          )
                          : <span className="text-[12px] text-(--color-text-light) italic">—</span>
                        }
                      </td>
                      <td className="px-[14px] py-[12px] text-center" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-[8px] justify-center">
                          <button
                            onClick={() => toggleMuadilFavorite(uid, m.id)}
                            className="w-[28px] h-[28px] rounded-full flex items-center justify-center cursor-pointer"
                            style={{
                              border: `1px solid ${fav ? C.goldBorder : C.border}`,
                              background: fav ? C.goldBg : '#fff',
                            }}
                          >
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
            {!sorted.length && (
              <div className="text-center py-[40px] px-[40px] text-(--color-text-light)">
                Henüz muadil eklenmemiş.
              </div>
            )}
          </Card>
        )}
      </div>
    </div>
  );
}
