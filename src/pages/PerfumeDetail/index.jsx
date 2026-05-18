import { useRouter } from '@/contexts/RouterContext';
import { useData } from '@/contexts/DataContext';
import { calcScores } from '@/utils/scoring';
import { Card, Badge, Btn, ScoreBar } from '@/components/ui';
import { GenderBadge } from '@/components/shared';
import { C } from '@/constants/theme';
import noImage from '@/img/no-image.jpg';

export function PerfumeDetailPage({ params }) {
  const { navigate } = useRouter();
  const { perfumes, muadilPerfumes, comments } = useData();
  const perfume = perfumes.find((p) => p.brandSlug === params?.brandSlug && p.slug === params?.perfumeSlug);

  if (!perfume) return <div style={{ padding: '60px', textAlign: 'center', color: C.textLight }}>Parfüm bulunamadı.</div>;

  const muadiller = muadilPerfumes.filter((m) => m.targetPerfumeId === perfume.id);

  return (
    <div style={{ minHeight: '100vh', background: C.bg, padding: '32px' }}>
      <div style={{ maxWidth: '960px', margin: '0 auto' }}>
        {/* Breadcrumb */}
        <div style={{ display: 'flex', gap: '6px', fontSize: '13px', color: C.textLight, marginBottom: '22px', alignItems: 'center' }}>
          <span onClick={() => navigate('/')} style={{ cursor: 'pointer', color: C.gold }}>Ana Sayfa</span>
          <span>/</span>
          <span onClick={() => navigate(`/marka/${perfume.brandSlug}`)} style={{ cursor: 'pointer', color: C.gold }}>{perfume.brandName}</span>
          <span>/</span>
          <span style={{ color: C.text, fontWeight: 600 }}>{perfume.name}</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '28px', marginBottom: '32px' }}>
          <Card style={{ padding: '26px', display: 'flex', flexDirection: 'column', alignItems: 'center', background: `linear-gradient(135deg,${C.goldBg},#fff)` }}>
            <div style={{ fontSize: '68px', marginBottom: '14px' }}>🧴</div>
            <div style={{ fontSize: '20px', fontWeight: 900, color: C.navy, textAlign: 'center', marginBottom: '4px' }}>{perfume.name}</div>
            <div style={{ fontSize: '14px', color: C.textMid, marginBottom: '14px' }}>{perfume.brandName}</div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>
              <GenderBadge gender={perfume.gender} />
              <Badge color="gold">{perfume.year}</Badge>
            </div>
            <Btn style={{ marginTop: '18px', width: '100%', justifyContent: 'center' }} onClick={() => navigate(`/karsilastir?orijinal=${perfume.id}`)}>
              Muadil Karşılaştır
            </Btn>
          </Card>

          <div>
            <h1 style={{ fontSize: 'clamp(28px,4vw,44px)', fontWeight: 900, color: C.navy, marginBottom: '8px' }}>{perfume.name}</h1>
            <div style={{ fontSize: '15px', color: C.textMid, marginBottom: '16px' }}>{perfume.brandName} · Est. {perfume.year}</div>
            <p style={{ fontSize: '15px', color: C.text, lineHeight: 1.7, marginBottom: '22px', fontStyle: 'italic' }}>"{perfume.description}"</p>
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: C.navy, marginBottom: '12px' }}>Koku Notaları</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
              {[
                ['Üst Notalar', perfume.notes?.top || [], C.goldBg, C.goldBorder, C.gold],
                ['Kalp Notaları', perfume.notes?.heart || [], '#fff5f8', '#f0c0d0', '#c06080'],
                ['Dip Notalar', perfume.notes?.base || [], C.greenBg, C.greenBorder, C.green],
              ].map(([l, notes, bg, border, col]) => (
                <div key={l} style={{ background: bg, border: `1px solid ${border}`, borderRadius: '12px', padding: '12px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: col, letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: '8px' }}>{l}</div>
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

        <h2 style={{ fontSize: '22px', fontWeight: 800, color: C.navy, marginBottom: '16px' }}>Muadil Parfümler ({muadiller.length})</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: '16px' }}>
          {muadiller.map((m) => {
            const ms = calcScores(m.id, comments);
            return (
              <Card key={m.id} hover style={{ padding: '0', cursor: 'pointer', overflow: 'hidden' }} onClick={() => navigate(`/karsilastir?orijinal=${perfume.id}&muadil=${m.id}`)}>
                <div style={{ width: '100%', aspectRatio: '4/3', background: '#f0f0f0', overflow: 'hidden' }}>
                  <img src={m.image || noImage} alt={m.name} onError={(e) => { e.currentTarget.src = noImage; }} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <div style={{ padding: '14px 16px' }}>
                  <div style={{ fontWeight: 700, fontSize: '15px', color: C.navy, marginBottom: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.name}</div>
                  <div style={{ fontSize: '13px', color: C.textMid, marginBottom: '10px' }}>{m.brandName}</div>
                  <ScoreBar label="Koku Yakınlığı" value={ms.scent} empty={ms.scent === null} />
                  <ScoreBar label="Yayılım" value={ms.projection} empty={ms.projection === null} />
                  <ScoreBar label="Kalıcılık" value={ms.longevity} empty={ms.longevity === null} />
                  {!ms.count && <div style={{ fontSize: '11px', color: C.textLight, fontStyle: 'italic', textAlign: 'center', marginBottom: '6px' }}>Henüz yorum yok</div>}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px', paddingTop: '10px', borderTop: `1px solid ${C.borderLight}` }}>
                    <Btn size="sm" variant="ghost">Karşılaştır</Btn>
                  </div>
                </div>
              </Card>
            );
          })}
          {!muadiller.length && <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '40px', color: C.textLight }}>Henüz muadil eklenmemiş.</div>}
        </div>
      </div>
    </div>
  );
}
