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
    <div className="flex flex-col items-end shrink-0 gap-[2px]">
      <div className="px-[10px] py-[6px] rounded-[10px] flex items-baseline gap-[1px]" style={{ background: bg }}>
        <span className="text-[15px] font-extrabold leading-none" style={{ color }}>{formatted}</span>
        <span className="text-[11px] font-semibold" style={{ color }}>/10</span>
      </div>
      {count !== undefined && (
        <span className="text-[10px] text-(--color-text-light)">{count} yorum</span>
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
    <div
      className="w-7 h-7 rounded-full grid place-items-center text-[11px] font-extrabold shrink-0 select-none"
      style={{
        background: m ? m.bg : 'var(--color-border)',
        color: m ? m.color : 'var(--color-text-light)',
      }}
    >
      <span className="block leading-none" style={{ marginTop: '0.5px' }}>{n}</span>
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
          className="flex items-center gap-[10px] px-[14px] py-[11px] rounded-[12px] cursor-pointer transition-shadow duration-150"
          style={{
            marginBottom: i < rows.length - 1 ? '6px' : 0,
            border: `1px solid ${i === 0 ? '#FFD700' : i === 1 ? '#C0C0C0' : i === 2 ? '#CD7F32' : 'var(--color-border)'}`,
            background: i < 3 ? (i === 0 ? '#fffdf0' : i === 1 ? '#f8f8f8' : '#fff8f4') : 'var(--color-card)',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.boxShadow = C.shadow)}
          onMouseLeave={(e) => (e.currentTarget.style.boxShadow = 'none')}
        >
          <RankNum n={i + 1} />
          <div className="flex-1 min-w-0">
            <div className="text-[14px] font-bold text-(--color-text) whitespace-nowrap overflow-hidden text-ellipsis">
              {row.muadil.name}
            </div>
            <div className="text-[11px] text-(--color-text-light) mt-[2px] whitespace-nowrap overflow-hidden text-ellipsis">
              <span className="text-(--color-gold) font-semibold">{row.muadil.brandName}</span>
              <span className="mx-1">→</span>
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
          className="flex items-center gap-[10px] px-[14px] py-[11px] rounded-[12px] cursor-pointer transition-shadow duration-150"
          style={{
            marginBottom: i < rows.length - 1 ? '6px' : 0,
            border: `1px solid ${i === 0 ? '#FFD700' : i === 1 ? '#C0C0C0' : i === 2 ? '#CD7F32' : 'var(--color-border)'}`,
            background: i < 3 ? (i === 0 ? '#fffdf0' : i === 1 ? '#f8f8f8' : '#fff8f4') : 'var(--color-card)',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.boxShadow = C.shadow)}
          onMouseLeave={(e) => (e.currentTarget.style.boxShadow = 'none')}
        >
          <RankNum n={i + 1} />
          <div
            className="w-[38px] h-[38px] rounded-[10px] flex items-center justify-center text-[10px] font-black text-white shrink-0"
            style={{ background: `linear-gradient(135deg,${C.gold},${C.goldLight})` }}
          >
            {row.brand.logo}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[14px] font-bold text-(--color-text) whitespace-nowrap overflow-hidden text-ellipsis">
              {row.brand.name}
            </div>
            <div className="text-[11px] text-(--color-text-light) mt-[2px]">
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
    <div
      className="bg-(--color-bg) min-h-screen"
      style={{ padding: xs ? '20px 16px 40px' : sm ? '28px 16px 60px' : '40px 0 80px' }}
    >
      <div
        className="max-w-[1320px] mx-auto"
        style={{ padding: sm ? '0' : w >= 1280 ? '0 48px' : '0 32px' }}
      >

        {/* Header */}
        <div className="mb-8 text-center">
          <h1
            className="font-black text-(--color-navy) m-0"
            style={{ fontSize: sm ? '26px' : '32px', fontFamily: F }}
          >
            En İyiler
          </h1>
          <p className="text-[14px] text-(--color-text-light) mt-2" style={{ fontFamily: F }}>
            Kullanıcı puanlarına göre en başarılı muadil parfümler ve markalar
          </p>
          <div className="inline-flex items-center gap-2 mt-[10px] px-[14px] py-[6px] rounded-[20px] bg-(--color-surface) border border-(--color-border)">
            <svg width="12" height="12" fill="none" stroke="var(--color-text-light)" strokeWidth="2" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span className="text-[12px] text-(--color-text-light)">
              muadilci.com bu listeleri hazırlarken güvenilirlik ortalaması için <strong className="text-(--color-text-mid)">Bayesian Ortalamasını</strong> kullanır.
            </span>
          </div>
        </div>

        {/* Two columns */}
        <div
          className="grid gap-6 items-start"
          style={{ gridTemplateColumns: sm ? '1fr' : '1fr 1fr' }}
        >

          {/* Left: Top 10 Muadil */}
          <div
            className="bg-(--color-card) rounded-[20px] border border-(--color-border)"
            style={{ padding: sm ? '20px 16px' : '28px', boxShadow: C.shadow }}
          >
            <div className="flex items-center gap-[10px] mb-[18px]">
              <div
                className="w-9 h-9 rounded-[10px] flex items-center justify-center shrink-0"
                style={{ background: `linear-gradient(135deg,${C.gold},${C.goldLight})` }}
              >
                <FontAwesomeIcon icon={faTrophy} style={{ fontSize: '16px', color: '#fff' }} />
              </div>
              <div>
                <h2 className="m-0 text-[16px] font-extrabold text-(--color-navy)">
                  En İyi 10 Muadil Parfüm
                </h2>
                <p className="m-0 text-[12px] text-(--color-text-light)">Parfüme ait benzerlik, yayılım, kalıcılık puanı ortalaması</p>
              </div>
            </div>

            {topMuadils.length > 0 ? (
              <PerfumeTable rows={topMuadils} navigate={navigate} />
            ) : (
              <div className="text-center py-10 text-(--color-text-light) text-[14px]">
                Henüz yeterli puan verisi yok.
              </div>
            )}
          </div>

          {/* Right: Top 10 Brand */}
          <div
            className="bg-(--color-card) rounded-[20px] border border-(--color-border)"
            style={{ padding: sm ? '20px 16px' : '28px', boxShadow: C.shadow }}
          >
            <div className="flex items-center gap-[10px] mb-[18px]">
              <div
                className="w-9 h-9 rounded-[10px] flex items-center justify-center shrink-0"
                style={{ background: `linear-gradient(135deg,${C.navy},${C.navyLight})` }}
              >
                <FontAwesomeIcon icon={faMedal} style={{ fontSize: '16px', color: '#fff' }} />
              </div>
              <div>
                <h2 className="m-0 text-[16px] font-extrabold text-(--color-navy)">
                  En İyi 10 Muadil Marka
                </h2>
                <p className="m-0 text-[12px] text-(--color-text-light)">Markaya ait parfümlerin ortalaması</p>
              </div>
            </div>

            {topBrands.length > 0 ? (
              <BrandTable rows={topBrands} navigate={navigate} />
            ) : (
              <div className="text-center py-10 text-(--color-text-light) text-[14px]">
                Henüz yeterli puan verisi yok.
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
