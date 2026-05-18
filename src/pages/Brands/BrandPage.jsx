import { useRouter } from '@/contexts/RouterContext';
import { useData } from '@/contexts/DataContext';
import { calcScores } from '@/utils/scoring';
import { Card, Badge } from '@/components/ui';
import { GenderBadge } from '@/components/shared';
import { C } from '@/constants/theme';
import noImage from '@/img/no-image.jpg';

export function BrandPage({ params }) {
  const { navigate } = useRouter();
  const { brands, perfumes, muadilPerfumes, comments } = useData();
  const brand = brands.find((b) => b.slug === params?.brandSlug);

  if (!brand) return <div style={{ padding: '60px', textAlign: 'center', color: C.textLight }}>Marka bulunamadı.</div>;

  const isOrig = brand.type === 'original';
  const items = isOrig
    ? perfumes.filter((p) => p.brandId === brand.id)
    : muadilPerfumes.filter((m) => m.brandId === brand.id);

  return (
    <div style={{ minHeight: '100vh', background: C.bg }}>
      <div style={{ background: `linear-gradient(135deg,${C.navy},${C.navyLight})`, padding: '48px 32px' }}>
        <div style={{ maxWidth: '960px', margin: '0 auto', display: 'flex', gap: '24px', alignItems: 'center' }}>
          <div style={{ width: '96px', height: '96px', borderRadius: '50%', background: 'rgba(255,255,255,.12)', border: '2px solid rgba(255,255,255,.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '26px', color: '#fff', fontWeight: 800, flexShrink: 0, overflow: 'hidden' }}>
            {brand.logoImage
              ? <img src={brand.logoImage} alt={brand.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : brand.logo}
          </div>
          <div>
            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,.5)', fontWeight: 600, marginBottom: '6px' }}>{brand.category} · {brand.origin} · {brand.founded}</div>
            <h1 style={{ fontSize: 'clamp(22px,4vw,38px)', fontWeight: 900, color: '#fff', marginBottom: '8px' }}>{brand.name}</h1>
            <p style={{ color: 'rgba(255,255,255,.6)', fontSize: '14px', lineHeight: 1.6 }}>{brand.bio}</p>
            <div style={{ display: 'flex', gap: '20px', marginTop: '12px' }}>
              <div><div style={{ fontSize: '20px', fontWeight: 800, color: '#fff' }}>{items.length}</div><div style={{ fontSize: '12px', color: 'rgba(255,255,255,.5)' }}>parfüm</div></div>
              <div><div style={{ fontSize: '20px', fontWeight: 800, color: '#fff' }}>{brand.likes.toLocaleString()}</div><div style={{ fontSize: '12px', color: 'rgba(255,255,255,.5)' }}>beğeni</div></div>
            </div>
          </div>
          <div style={{ marginLeft: 'auto' }}><Badge color={isOrig ? 'gold' : 'green'}>{isOrig ? 'Orijinal Marka' : 'Muadil Marka'}</Badge></div>
        </div>
      </div>

      <div style={{ maxWidth: '960px', margin: '0 auto', padding: '36px 32px' }}>
        <h2 style={{ fontSize: '22px', fontWeight: 800, color: C.navy, marginBottom: '18px' }}>Parfümler</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: '16px' }}>
          {items.map((item) => {
            const ms = !isOrig ? calcScores(item.id, comments) : null;
            return (
              <Card key={item.id} hover style={{ padding: '0', cursor: 'pointer', overflow: 'hidden' }}
                onClick={() => isOrig ? navigate(`/${item.brandSlug}/${item.slug}`) : navigate(`/karsilastir?orijinal=${item.targetPerfumeId}&muadil=${item.id}`)}>
                <div style={{ width: '100%', aspectRatio: '4/3', background: '#f0f0f0', overflow: 'hidden' }}>
                  <img src={item.image || noImage} alt={item.name} onError={(e) => { e.currentTarget.src = noImage; }} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                </div>
                <div style={{ padding: '14px 16px' }}>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: C.navy, marginBottom: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.name}</div>
                  {!isOrig && <div style={{ fontSize: '12px', color: C.textLight, marginBottom: '8px' }}>→ {item.targetBrandName} {item.targetPerfumeName}</div>}
                  {isOrig && <GenderBadge gender={item.gender} />}
                  {!isOrig && (
                    <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: `1px solid ${C.borderLight}`, display: 'flex', justifyContent: 'flex-end' }}>
                      <Badge color={ms && ms.overall !== null ? 'gold' : 'gray'}>{ms && ms.overall !== null ? `${ms.overall}/10` : '—'}</Badge>
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
          {!items.length && <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '60px', color: C.textLight }}>Bu markaya ait parfüm henüz eklenmemiş.</div>}
        </div>
      </div>
    </div>
  );
}
