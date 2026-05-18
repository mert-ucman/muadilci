import { useData } from '@/contexts/DataContext';
import { useRouter } from '@/contexts/RouterContext';
import { useW } from '@/hooks/useW';
import { C, F } from '@/constants/theme';

function calcMuadilScore(muadilId, comments) {
  const approved = comments.filter((c) => c.muadilPerfumeId === muadilId && c.status === 'approved');
  if (!approved.length) return null;
  const total = approved.reduce((s, c) => s + (c.similarity + c.projection + c.longevity) / 3, 0);
  return +(total / approved.length).toFixed(1);
}

function ScoreBadge({ score }) {
  const color = score >= 8 ? C.green : score >= 6 ? C.gold : C.orange;
  const bg = score >= 8 ? C.greenBg : score >= 6 ? C.goldBg : C.orangeBg;
  return (
    <div style={{
      padding: '6px 10px', borderRadius: '10px',
      background: bg, display: 'flex',
      alignItems: 'baseline', gap: '1px', flexShrink: 0,
    }}>
      <span style={{ fontSize: '15px', fontWeight: 800, color, lineHeight: 1 }}>{score}</span>
      <span style={{ fontSize: '11px', color, fontWeight: 600 }}>/10</span>
    </div>
  );
}

function RankNum({ n }) {
  const medals = { 1: { bg: '#FFD700', color: '#7a5a00' }, 2: { bg: '#C0C0C0', color: '#555' }, 3: { bg: '#CD7F32', color: '#5c3300' } };
  const m = medals[n];
  return (
    <div style={{
      width: '28px', height: '28px', borderRadius: '50%',
      background: m ? m.bg : C.border,
      color: m ? m.color : C.textLight,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: '12px', fontWeight: 800, flexShrink: 0,
    }}>
      {n}
    </div>
  );
}

function PerfumeTable({ rows, navigate }) {
  return (
    <div>
      {rows.map((row, i) => (
        <div
          key={row.muadil.id}
          onClick={() => navigate(`/${row.muadil.brandSlug}/${row.muadil.slug}`)}
          style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            padding: '11px 14px', borderRadius: '12px', cursor: 'pointer',
            marginBottom: '6px',
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
          <ScoreBadge score={row.score} />
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
          style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            padding: '11px 14px', borderRadius: '12px', cursor: 'pointer',
            marginBottom: '6px',
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
            <div style={{ fontSize: '14px', fontWeight: 700, color: C.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{row.brand.name}</div>
            <div style={{ fontSize: '11px', color: C.textLight, marginTop: '2px' }}>
              {row.perfumeCount} muadil · {row.brand.origin}
            </div>
          </div>
          <ScoreBadge score={row.score} />
        </div>
      ))}
    </div>
  );
}

export function LeaderboardPage() {
  const { muadilPerfumes, comments, brands } = useData();
  const { navigate } = useRouter();
  const { sm } = useW();

  const muadilScores = muadilPerfumes
    .filter((m) => m.active)
    .map((m) => ({ muadil: m, score: calcMuadilScore(m.id, comments) }))
    .filter((r) => r.score !== null)
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);

  const muadilBrands = brands.filter((b) => b.type === 'muadil' && b.active);
  const brandScores = muadilBrands
    .map((brand) => {
      const brandMuadils = muadilPerfumes.filter((m) => m.brandId === brand.id && m.active);
      const scored = brandMuadils
        .map((m) => calcMuadilScore(m.id, comments))
        .filter((s) => s !== null);
      if (!scored.length) return null;
      const avg = +(scored.reduce((a, b) => a + b, 0) / scored.length).toFixed(1);
      return { brand, score: avg, perfumeCount: brandMuadils.length };
    })
    .filter(Boolean)
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);

  return (
    <div style={{ background: C.bg, minHeight: '100vh', padding: sm ? '28px 16px 60px' : '40px 0 80px' }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: sm ? '0' : '0 32px' }}>

        {/* Header */}
        <div style={{ marginBottom: '32px', textAlign: 'center' }}>
          <h1 style={{ fontSize: sm ? '26px' : '32px', fontWeight: 900, color: C.navy, margin: 0, fontFamily: F }}>
            En İyiler
          </h1>
          <p style={{ fontSize: '14px', color: C.textLight, marginTop: '8px', fontFamily: F }}>
            Kullanıcı puanlarına göre en başarılı muadil parfümler ve markalar
          </p>
        </div>

        {/* Two-column layout */}
        <div style={{ display: 'grid', gridTemplateColumns: sm ? '1fr' : '1fr 1fr', gap: '24px' }}>

          {/* Left: Top 10 Muadil Perfumes */}
          <div style={{ background: C.card, borderRadius: '20px', border: `1px solid ${C.border}`, padding: sm ? '20px 16px' : '28px', boxShadow: C.shadow }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
              <div style={{
                width: '36px', height: '36px', borderRadius: '10px',
                background: `linear-gradient(135deg,${C.gold},${C.goldLight})`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <span style={{ fontSize: '18px' }}>🏆</span>
              </div>
              <div>
                <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: C.navy, fontFamily: F }}>
                  En İyi Muadil Parfümler
                </h2>
                <p style={{ margin: 0, fontSize: '12px', color: C.textLight }}>Benzerlik, yayılım ve kalıcılık puanı</p>
              </div>
            </div>

            {muadilScores.length > 0 ? (
              <PerfumeTable rows={muadilScores} navigate={navigate} />
            ) : (
              <div style={{ textAlign: 'center', padding: '40px 0', color: C.textLight, fontSize: '14px' }}>
                Henüz yeterli puan verisi yok.
              </div>
            )}
          </div>

          {/* Right: Top 10 Muadil Brands */}
          <div style={{ background: C.card, borderRadius: '20px', border: `1px solid ${C.border}`, padding: sm ? '20px 16px' : '28px', boxShadow: C.shadow }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
              <div style={{
                width: '36px', height: '36px', borderRadius: '10px',
                background: `linear-gradient(135deg,${C.navy},${C.navyLight})`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <span style={{ fontSize: '18px' }}>🥇</span>
              </div>
              <div>
                <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: C.navy, fontFamily: F }}>
                  En İyi Muadil Markalar
                </h2>
                <p style={{ margin: 0, fontSize: '12px', color: C.textLight }}>Tüm muadil parfümlerinin ortalama puanı</p>
              </div>
            </div>

            {brandScores.length > 0 ? (
              <BrandTable rows={brandScores} navigate={navigate} />
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
