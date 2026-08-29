import { useMemo, useState, useEffect } from 'react';
import { useData } from '@/contexts/DataContext';
import { useRouter } from '@/contexts/RouterContext';
import { useW } from '@/hooks/useW';
import { C, F } from '@/constants/theme';
import { useSeo } from '@/lib/seo';
import { calcAllMuadilScores, calcAllBrandScores, LEADERBOARD_MIN_REVIEWS } from '@/utils/scoring';
import { LEADERBOARD_URL, BADGE_ORDER } from '@/lib/gamification';
import { BadgeMedal } from '@/components/shared/Badges';
import { faTrophy, faMedal, faTriangleExclamation, faUsers } from '@fortawesome/free-solid-svg-icons';
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

function BrandTable({ rows, navigate, noImageUrl }) {
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
          <div className="w-[38px] h-[38px] rounded-[10px] overflow-hidden shrink-0 bg-(--color-bg-soft)">
            <img
              src={row.brand.logoImage || noImageUrl || undefined}
              alt={row.brand.name}
              className="w-full h-full object-cover"
              loading="lazy"
              decoding="async"
              onError={(e) => { e.currentTarget.onerror = null; noImageUrl ? (e.currentTarget.src = noImageUrl) : (e.currentTarget.style.display = 'none'); }}
            />
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

// ── Topluluk (kullanıcı) sıralaması ─────────────────────────────────────────
function UserRow({ row, rank, metric, navigate }) {
  const value = metric === 'weekly' ? (row.xpWeekly || 0) : (row.xpTotal || 0);
  const go = () => { if (row.username) navigate(`/@${row.username}`); };
  const initial = (row.name || '?').slice(0, 1).toLocaleUpperCase('tr-TR');
  const miniBadges = BADGE_ORDER.filter((id) => (row.badges || []).includes(id)).slice(0, 3);
  return (
    <div
      onClick={go}
      className="flex items-center gap-[10px] px-[14px] py-[11px] rounded-[12px] transition-shadow duration-150"
      style={{
        cursor: row.username ? 'pointer' : 'default',
        marginBottom: '6px',
        border: `1px solid ${rank === 1 ? '#FFD700' : rank === 2 ? '#C0C0C0' : rank === 3 ? '#CD7F32' : 'var(--color-border)'}`,
        background: rank <= 3 ? (rank === 1 ? '#fffdf0' : rank === 2 ? '#f8f8f8' : '#fff8f4') : 'var(--color-card)',
      }}
      onMouseEnter={(e) => (e.currentTarget.style.boxShadow = C.shadow)}
      onMouseLeave={(e) => (e.currentTarget.style.boxShadow = 'none')}
    >
      <RankNum n={rank} />
      <div className="w-[38px] h-[38px] rounded-full overflow-hidden shrink-0 grid place-items-center" style={{ background: C.goldBg, border: `1px solid ${C.goldBorder}` }}>
        {row.photoURL
          ? <img src={row.photoURL} alt={row.name} className="w-full h-full object-cover" loading="lazy" decoding="async" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
          : <span className="text-[14px] font-extrabold" style={{ color: C.gold }}>{initial}</span>}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[14px] font-bold text-(--color-text) truncate">{row.name}</div>
        <div className="text-[11px] text-(--color-text-light) truncate flex items-center gap-[6px]">
          <span>{row.username ? `@${row.username}` : 'anonim'}</span>
          {row.weeklyChampionCount > 0 && (
            <span style={{ color: C.gold, fontWeight: 700 }}>· {row.weeklyChampionCount}× şampiyon</span>
          )}
        </div>
      </div>
      {miniBadges.length > 0 && (
        <div className="hidden sm:flex items-center gap-[3px] shrink-0">
          {miniBadges.map((id) => <BadgeMedal key={id} id={id} size={22} unlocked />)}
        </div>
      )}
      <div className="flex flex-col items-end shrink-0 w-[46px]">
        <span className="text-[15px] font-extrabold leading-none" style={{ color: C.gold, fontVariantNumeric: 'tabular-nums' }}>{value}</span>
        <span className="text-[10px] text-(--color-text-light) mt-[2px]">XP</span>
      </div>
    </div>
  );
}

function MetricToggle({ metric, setMetric }) {
  const Btn = ({ id, label }) => (
    <button
      onClick={() => setMetric(id)}
      className="inline-flex items-center justify-center px-[18px] rounded-[20px] text-[13px] font-bold cursor-pointer transition-colors"
      style={{
        height: '34px',
        background: metric === id ? `linear-gradient(135deg,${C.gold},${C.goldLight})` : C.card,
        color: metric === id ? '#fff' : C.textMid,
        border: `1px solid ${metric === id ? 'transparent' : C.border}`,
        fontFamily: F,
      }}
    >
      <span className="cap-center">{label}</span>
    </button>
  );
  return (
    <div className="flex gap-2 justify-center mb-6">
      <Btn id="weekly" label="Bu Hafta" />
      <Btn id="allTime" label="Tüm Zamanlar" />
    </div>
  );
}

function CommunityLeaderboard({ navigate, sm }) {
  const [data, setData] = useState(null);
  const [err, setErr] = useState(false);
  const [metric, setMetric] = useState('weekly');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(LEADERBOARD_URL);
        if (!res.ok) throw new Error(String(res.status));
        const j = await res.json();
        if (!cancelled) setData(j);
      } catch {
        if (!cancelled) setErr(true);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const rows = data ? (metric === 'weekly' ? (data.weekly || []) : (data.allTime || [])) : [];

  return (
    <div className="max-w-[680px] mx-auto">
      <MetricToggle metric={metric} setMetric={setMetric} />
      <div className="bg-(--color-card) rounded-[20px] border border-(--color-border)" style={{ padding: sm ? '18px 14px' : '26px', boxShadow: C.shadow }}>
        <div className="flex items-center gap-[10px] mb-[18px]">
          <div className="w-9 h-9 rounded-[10px] flex items-center justify-center shrink-0" style={{ background: `linear-gradient(135deg,${C.gold},${C.goldLight})` }}>
            <FontAwesomeIcon icon={faUsers} style={{ fontSize: '15px', color: '#fff' }} />
          </div>
          <div>
            <h2 className="m-0 text-[16px] font-extrabold text-(--color-navy)">
              {metric === 'weekly' ? 'Bu Haftanın En Aktifleri' : 'Tüm Zamanların En Aktifleri'}
            </h2>
            <p className="m-0 text-[12px] text-(--color-text-light)">
              {metric === 'weekly' ? 'Her pazartesi sıfırlanır — bu hafta zirveyi sen tut' : 'Toplam XP’ye göre kalıcı sıralama'}
            </p>
          </div>
        </div>

        {err ? (
          <div className="text-center py-10 text-(--color-text-light) text-[14px]">Sıralama şu anda yüklenemedi.</div>
        ) : !data ? (
          <div className="text-center py-10 text-(--color-text-light) text-[14px]">Yükleniyor…</div>
        ) : rows.length === 0 ? (
          <div className="text-center py-10 text-(--color-text-light) text-[14px]">
            {metric === 'weekly' ? 'Bu hafta henüz puan toplayan olmadı — ilk sen ol!' : 'Henüz sıralama oluşmadı. Yorum yaparak XP kazan!'}
          </div>
        ) : (
          <div>
            {rows.map((row, i) => <UserRow key={row.uid} row={row} rank={i + 1} metric={metric} navigate={navigate} />)}
          </div>
        )}
      </div>
    </div>
  );
}

export function LeaderboardPage() {
  useSeo({
    title: 'En İyiler',
    description: 'En yüksek puan alan muadil parfümler ve markalar. Topluluğun en beğendiği orijinal-muadil eşleşmelerini keşfet.',
  });

  const { muadilPerfumes, comments, brands, noImageUrl } = useData();
  const { navigate } = useRouter();
  const { w, sm, xs } = useW();
  const [board, setBoard] = useState('products'); // 'products' | 'community'

  // Bayesian puan haritası — comments değiştiğinde yeniden hesapla
  const muadilScoreMap = useMemo(
    () => calcAllMuadilScores(muadilPerfumes.filter((m) => m.active !== false), comments),
    [muadilPerfumes, comments]
  );

  // Top 10 muadil: bayesianScore ile sıralanır, avgScore gösterilir
  // Vitrin barı: yalnızca en az LEADERBOARD_MIN_REVIEWS yoruma ulaşan ürünler listelenir
  const topMuadils = useMemo(() => {
    const rows = [];
    for (const [id, scores] of muadilScoreMap.entries()) {
      if (scores.reviewCount < LEADERBOARD_MIN_REVIEWS) continue;
      const muadil = muadilPerfumes.find((m) => m.id === id);
      if (!muadil) continue;
      rows.push({ muadil, ...scores });
    }
    // Eşitlik-bozucu: aynı skorda çok yorumlu önce, sonra ada göre alfabetik
    return rows
      .sort((a, b) =>
        b.bayesianScore - a.bayesianScore ||
        b.reviewCount - a.reviewCount ||
        a.muadil.name.localeCompare(b.muadil.name, 'tr')
      )
      .slice(0, 10);
  }, [muadilScoreMap, muadilPerfumes]);

  // Top 10 marka: brandBayesianScore ile sıralanır, brandAvgScore gösterilir
  // Vitrin barı: yalnızca toplam yorumu LEADERBOARD_MIN_REVIEWS'e ulaşan markalar listelenir
  const topBrands = useMemo(() => {
    const muadilBrands = brands.filter((b) => b.type === 'muadil' && b.active !== false);
    return calcAllBrandScores(muadilBrands, muadilPerfumes, muadilScoreMap)
      .filter((row) => row.totalReviews >= LEADERBOARD_MIN_REVIEWS)
      .slice(0, 10);
  }, [brands, muadilPerfumes, muadilScoreMap]);

  return (
    <div
      className="bg-(--color-bg) min-h-screen"
      style={{ padding: xs ? '20px 16px 40px' : sm ? '28px 16px 60px' : '40px 0 80px' }}
    >
      <div
        className="max-w-[1320px] mx-auto relative"
        style={{ padding: sm ? '0' : w >= 1280 ? '0 48px' : '0 32px' }}
      >

        {/* Geliştirme aşaması rozeti — masaüstünde sağ üst köşe, mobilde başlığın üstünde ortalı (çakışmayı önler) */}
        <div
          className={sm ? 'flex justify-center mb-3' : 'absolute top-0 right-0 z-10'}
        >
          <div
            className="inline-flex items-center gap-[6px] rounded-[20px] px-[12px]"
            style={{ background: C.orangeBg, border: '1px solid #f0c878', color: C.orange, height: '24px', fontFamily: F }}
          >
            <FontAwesomeIcon icon={faTriangleExclamation} style={{ fontSize: '11px' }} />
            <p className="m-0 p-0 w-max cap-center text-[11px] font-semibold tracking-[.02em]">Geliştirilme Aşamasındadır</p>
          </div>
        </div>

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

        {/* Board seçici — Parfüm/Marka sıralaması vs Topluluk (kullanıcı) sıralaması */}
        <div className="flex gap-2 justify-center mb-7">
          {[{ id: 'products', label: 'Parfümler & Markalar' }, { id: 'community', label: 'Topluluk' }].map((t) => (
            <button key={t.id} onClick={() => setBoard(t.id)}
              className="inline-flex items-center justify-center px-[20px] rounded-[22px] text-[13px] font-bold cursor-pointer transition-colors"
              style={{
                height: '40px',
                background: board === t.id ? C.text : C.card,
                color: board === t.id ? '#fff' : C.textMid,
                border: `1px solid ${board === t.id ? C.text : C.border}`,
                fontFamily: F,
              }}>
              <span className="cap-center">{t.label}</span>
            </button>
          ))}
        </div>

        {board === 'community' && <CommunityLeaderboard navigate={navigate} sm={sm} />}

        {/* Two columns — Parfüm & Marka sıralaması */}
        {board === 'products' && (
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
              <BrandTable rows={topBrands} navigate={navigate} noImageUrl={noImageUrl} />
            ) : (
              <div className="text-center py-10 text-(--color-text-light) text-[14px]">
                Henüz yeterli puan verisi yok.
              </div>
            )}
          </div>

        </div>
        )}
      </div>
    </div>
  );
}
