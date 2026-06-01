import { useMemo } from 'react';
import { useData } from '@/contexts/DataContext';
import { useRouter } from '@/contexts/RouterContext';
import { useW } from '@/hooks/useW';
import { C, F } from '@/constants/theme';
import { useSeo } from '@/lib/seo';
import { calcAllMuadilScores, calcAllBrandScores } from '@/utils/scoring';
import { faTrophy, faMedal } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

function ScoreBadge({ score, count }) {
  const formatted = typeof score === 'number' ? score.toFixed(4) : score;
  const color = score >= 8 ? C.green : score >= 6 ? C.gold : C.orange;
  const bg    = score >= 8 ? C.greenBg : score >= 6 ? C.goldBg : C.orangeBg;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', flexShrink: 0, gap: '2px' }}>
      <div style={{ padding: '6px 10px', borderRadius: '10px', background: bg, display: 'flex', alignItems: 'baseline', gap: '1px' }}>
        <span style={{ fontSize: '15px', fontWeight: 800, color, lineHeight: 1 }}>{formatted}</span>
        <span style={{ fontSize: '11px', color, fontWeight: 600 }}>/10</span>
      </div>
      {count !== undefined && (
        <span style={{ fontSize: '10px', color: C.textLight }}>{count} yorum</span>
      )}
    </div>
  );
}

function RankNum({ n }) {
  const medals = {
    1: { bg: '#FFD700', color: '#7a5a00' },
    2: { bg: '#C0C0C0', color: '#555' },
    3: { bg: '#CD7F32', color: '#5c3300' },
  };
  const m = medals[n];
  return (
    <div style={{
      width: '28px', height: '28px', borderRadius: '50%',
      background: m ? m.bg : C.border,
      color: m ? m.color : C.textLight,
      display: 'grid', placeItems: 'center',
      fontSize: '11px', fontWeight: 800, flexShrink: 0,
      fontFamily: F, userSelect: 'none',
    }}>
      <span style={{ display: 'block', lineHeight: 1, marginTop: '0.5px' }}>{n}</span>
    </div>
  );
}

function PerfumeTable({ rows, navigate }) {
  return (
    <div>
      {rows.map((row, i) => (
        <div
          key={row.muadil.id}
          onClick={() => navigate(`/karsilastir?orijinal=${row.muadil.targetPerfumeId}&muadil=${row.muadil.id}`)}
          style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            padding: '11px 14px', borderRadius: '12px', cursor: 'pointer',
            marginBottom: i < rows.length - 1 ? '6px' : 0,
            border: `1px solid ${i === 0 ? '#FFD700' : i === 1 ? '#C0C0C0' : i === 2 ? '#CD7F32' : C.border}`,
            background: i < 3 ? (i === 0 ? '#fffdf0' : i === 1 ? '#f8f8f8' : '#fff8f4') : C.card,
            transition: 'box-shadow .15s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.boxShadow = C.shadow)}
          onMouseLeave={(e) => (e.currentTarget.style.boxShadow = 'none')}
        >
          <RankNum n={i + 1} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '14px', fontWeight: 700, color: C.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {row.muadil.name}
            </div>
            <div style={{ fontSize: '11px', color: C.textLight, marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              <span style={{ color: C.gold, fontWeight: 600 }}>{row.muadil.brandName}</span>
              <span style={{ margin: '0 4px' }}>→</span>
              <span>{row.muadil.targetPerfumeName}</span>
            </div>
          </div>
          <ScoreBadge score={row.bayesianScore} count={row.reviewCount} />
        </div>
      ))}
    </div>
  );
}

function BrandTable({ rows, navigate }) {
  return (
    <div>
      {rows.map((row, i) => (
        <div
          key={row.brand.id}
          onClick={() => navigate(`/marka/${row.brand.slug}`)}
          onMouseDown={(e) => { if (e.button === 1) { e.preventDefault(); window.open(`/marka/${row.brand.slug}`, '_blank'); } }}
          style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            padding: '11px 14px', borderRadius: '12px', cursor: 'pointer',
            marginBottom: i < rows.length - 1 ? '6px' : 0,
            border: `1px solid ${i === 0 ? '#FFD700' : i === 1 ? '#C0C0C0' : i === 2 ? '#CD7F32' : C.border}`,
            background: i < 3 ? (i === 0 ? '#fffdf0' : i === 1 ? '#f8f8f8' : '#fff8f4') : C.card,
            transition: 'box-shadow .15s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.boxShadow = C.shadow)}
          onMouseLeave={(e) => (e.currentTarget.style.boxShadow = 'none')}
        >
          <RankNum n={i + 1} />
          <div style={{
            width: '38px', height: '38px', borderRadius: '10px',
            background: `linear-gradient(135deg,${C.gold},${C.goldLight})`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '10px', fontWeight: 900, color: '#fff', flexShrink: 0,
          }}>
            {row.brand.logo}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '14px', fontWeight: 700, color: C.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {row.brand.name}
            </div>
            <div style={{ fontSize: '11px', color: C.textLight, marginTop: '2px' }}>
              {row.ratedProductCount} puanlı ürün · {row.brand.origin}
            </div>
          </div>
          <ScoreBadge score={row.brandBayesianScore} />
        </div>
      ))}
    </div>
  );
}

export function LeaderboardPage() {
  useSeo({
    title: 'En İyiler',
    description: 'En yüksek puan alan muadil parfümler ve markalar. Topluluğun en beğendiği orijinal-muadil eşleşmelerini keşfet.',
  });

  const { muadilPerfumes, comments, brands } = useData();
  const { navigate } = useRouter();
  const { w, sm, xs } = useW();


  // Bayesian puan haritası — comments değiştiğinde yeniden hesapla
  const muadilScoreMap = useMemo(
    () => calcAllMuadilScores(muadilPerfumes.filter((m) => m.active !== false), comments),
    [muadilPerfumes, comments]
  );

  // Top 10 muadil: bayesianScore ile sıralanır, avgScore gösterilir
  const topMuadils = useMemo(() => {
    const rows = [];
    for (const [id, scores] of muadilScoreMap.entries()) {
      const muadil = muadilPerfumes.find((m) => m.id === id);
      if (!muadil) continue;
      rows.push({ muadil, ...scores });
    }
    return rows
      .sort((a, b) => b.bayesianScore - a.bayesianScore)
      .slice(0, 10);
  }, [muadilScoreMap, muadilPerfumes]);

  // Top 10 marka: brandBayesianScore ile sıralanır, brandAvgScore gösterilir
  const topBrands = useMemo(() => {
    const muadilBrands = brands.filter((b) => b.type === 'muadil' && b.active !== false);
    return calcAllBrandScores(muadilBrands, muadilPerfumes, muadilScoreMap).slice(0, 10);
  }, [brands, muadilPerfumes, muadilScoreMap]);

  return (
    <div style={{ background: C.bg, minHeight: '100vh', padding: xs ? '20px 16px 40px' : sm ? '28px 16px 60px' : '40px 0 80px' }}>
      <div style={{ maxWidth: '1320px', margin: '0 auto', padding: sm ? '0' : w >= 1280 ? '0 48px' : '0 32px' }}>

        {/* Header */}
        <div style={{ marginBottom: '32px', textAlign: 'center' }}>
          <h1 style={{ fontSize: sm ? '26px' : '32px', fontWeight: 900, color: C.navy, margin: 0, fontFamily: F }}>
            En İyiler
          </h1>
          <p style={{ fontSize: '14px', color: C.textLight, marginTop: '8px', fontFamily: F }}>
            Kullanıcı puanlarına göre en başarılı muadil parfümler ve markalar
          </p>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginTop: '10px', padding: '6px 14px', borderRadius: '20px', background: C.surface, border: `1px solid ${C.border}` }}>
            <svg width="12" height="12" fill="none" stroke={C.textLight} strokeWidth="2" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span style={{ fontSize: '12px', color: C.textLight, fontFamily: F }}>
              muadilci.com bu listeleri hazırlarken güvenilirlik ortalaması için <strong style={{ color: C.textMid }}>Bayesian Ortalamasını</strong> kullanır.
            </span>
          </div>
        </div>

        {/* İki kolon */}
        <div style={{ display: 'grid', gridTemplateColumns: sm ? '1fr' : '1fr 1fr', gap: '24px', alignItems: 'start' }}>

          {/* Sol: Top 10 Muadil */}
          <div style={{ background: C.card, borderRadius: '20px', border: `1px solid ${C.border}`, padding: sm ? '20px 16px' : '28px', boxShadow: C.shadow }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
              <div style={{
                width: '36px', height: '36px', borderRadius: '10px',
                background: `linear-gradient(135deg,${C.gold},${C.goldLight})`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <FontAwesomeIcon icon={faTrophy} style={{ fontSize: '16px', color: '#fff' }} />
              </div>
              <div>
                <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: C.navy, fontFamily: F }}>
                  En İyi 10 Muadil Parfüm
                </h2>
                <p style={{ margin: 0, fontSize: '12px', color: C.textLight }}>Parfüme ait benzerlik, yayılım, kalıcılık puanı ortalaması</p>
              </div>
            </div>

            {topMuadils.length > 0 ? (
              <PerfumeTable rows={topMuadils} navigate={navigate} />
            ) : (
              <div style={{ textAlign: 'center', padding: '40px 0', color: C.textLight, fontSize: '14px' }}>
                Henüz yeterli puan verisi yok.
              </div>
            )}
          </div>

          {/* Sağ: Top 10 Marka */}
          <div style={{ background: C.card, borderRadius: '20px', border: `1px solid ${C.border}`, padding: sm ? '20px 16px' : '28px', boxShadow: C.shadow }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
              <div style={{
                width: '36px', height: '36px', borderRadius: '10px',
                background: `linear-gradient(135deg,${C.navy},${C.navyLight})`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <FontAwesomeIcon icon={faMedal} style={{ fontSize: '16px', color: '#fff' }} />
              </div>
              <div>
                <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: C.navy, fontFamily: F }}>
                  En İyi 10 Muadil Marka
                </h2>
                <p style={{ margin: 0, fontSize: '12px', color: C.textLight }}>Markaya ait parfümlerin ortalaması</p>
              </div>
            </div>

            {topBrands.length > 0 ? (
              <BrandTable rows={topBrands} navigate={navigate} />
            ) : (
              <div style={{ textAlign: 'center', padding: '40px 0', color: C.textLight, fontSize: '14px' }}>
                Henüz yeterli puan verisi yok.
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
