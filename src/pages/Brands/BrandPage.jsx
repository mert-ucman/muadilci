import { useState } from 'react';
import { useRouter } from '@/contexts/RouterContext';
import { useData } from '@/contexts/DataContext';
import { useW } from '@/hooks/useW';
import { calcScores } from '@/utils/scoring';
import { Card, Badge } from '@/components/ui';
import { faShirt, faGem } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { GenderBadge } from '@/components/shared';
import { C, F } from '@/constants/theme';
import noImage from '@/img/no-image.jpg';

export function BrandPage({ params }) {
  const { navigate } = useRouter();
  const { brands, perfumes, muadilPerfumes, comments } = useData();
  const { sm, xs } = useW();
  const [showTooltip, setShowTooltip] = useState(false);
  const brand = brands.find((b) => b.slug === params?.brandSlug);

  if (!brand) return <div style={{ padding: '60px', textAlign: 'center', color: C.textLight }}>Marka bulunamadı.</div>;

  const isOrig = brand.type === 'original';
  const items = isOrig
    ? perfumes.filter((p) => p.brandId === brand.id)
    : muadilPerfumes.filter((m) => m.brandId === brand.id);

  const brandOverall = (() => {
    if (isOrig) return null;
    const scores = items.map((m) => calcScores(m.id, comments).overall).filter((v) => v !== null);
    if (!scores.length) return null;
    return parseFloat((scores.reduce((s, v) => s + v, 0) / scores.length).toFixed(1));
  })();

  return (
    <div style={{ minHeight: '100vh', background: C.bg }}>
      <div style={{ background: `linear-gradient(135deg,${C.navy},${C.navyLight})`, padding: sm ? '32px 16px' : '48px 32px' }}>
        <div style={{ maxWidth: '960px', margin: '0 auto', display: 'flex', gap: sm ? '16px' : '24px', alignItems: sm ? 'flex-start' : 'center' }}>
          <div style={{ width: sm ? '64px' : '96px', height: sm ? '64px' : '96px', borderRadius: '50%', background: 'rgba(255,255,255,.12)', border: '2px solid rgba(255,255,255,.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: sm ? '18px' : '26px', color: '#fff', fontWeight: 800, flexShrink: 0, overflow: 'hidden' }}>
            {brand.logoImage
              ? <img src={brand.logoImage} alt={brand.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : brand.logo}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '12px', color: 'rgba(255,255,255,.5)', fontWeight: 600 }}>{brand.origin} · {brand.founded}</span>
              <Badge color={isOrig ? 'gold' : 'green'}>{isOrig ? 'Orijinal Marka' : 'Muadil Marka'}</Badge>
              {isOrig && brand.category && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '2px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 700, background: brand.category === 'Niche' ? 'rgba(167,139,250,.25)' : 'rgba(147,197,253,.2)', color: brand.category === 'Niche' ? '#c4b5fd' : '#93c5fd', border: `1px solid ${brand.category === 'Niche' ? 'rgba(167,139,250,.4)' : 'rgba(147,197,253,.3)'}` }}>
                  <FontAwesomeIcon icon={brand.category === 'Designer' ? faShirt : faGem} style={{ fontSize: '11px' }} /> {brand.category}
                </span>
              )}
            </div>
            <h1 style={{ fontSize: sm ? '22px' : 'clamp(22px,4vw,38px)', fontWeight: 900, color: '#fff', marginBottom: '8px' }}>{brand.name}</h1>
            <p style={{ color: 'rgba(255,255,255,.6)', fontSize: '14px', lineHeight: 1.6 }}>{brand.bio}</p>
            <div style={{ display: 'flex', gap: '20px', marginTop: '12px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
              <div><div style={{ fontSize: '20px', fontWeight: 800, color: '#fff' }}>{items.length}</div><div style={{ fontSize: '12px', color: 'rgba(255,255,255,.5)' }}>parfüm</div></div>
              <div><div style={{ fontSize: '20px', fontWeight: 800, color: '#fff' }}>{brand.likes.toLocaleString()}</div><div style={{ fontSize: '12px', color: 'rgba(255,255,255,.5)' }}>beğeni</div></div>
              {!isOrig && (
                <div style={{ position: 'relative' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div>
                      <div style={{ fontSize: '20px', fontWeight: 800, color: brandOverall !== null ? C.goldLight : 'rgba(255,255,255,.4)' }}>
                        {brandOverall !== null ? `${brandOverall}/10` : '—'}
                      </div>
                      <div style={{ fontSize: '12px', color: 'rgba(255,255,255,.5)' }}>marka puanı</div>
                    </div>
                    <button
                      onMouseEnter={() => setShowTooltip(true)}
                      onMouseLeave={() => setShowTooltip(false)}
                      style={{ width: '18px', height: '18px', borderRadius: '50%', border: '1px solid rgba(255,255,255,.35)', background: 'rgba(255,255,255,.15)', color: 'rgba(255,255,255,.7)', fontSize: '11px', fontWeight: 700, cursor: 'default', fontFamily: F, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginBottom: '14px' }}
                    >?</button>
                  </div>
                  {showTooltip && (
                    <div style={{ position: 'absolute', top: 0, left: '100%', marginLeft: '10px', width: sm ? '220px' : '260px', background: '#fff', border: `1px solid ${C.border}`, borderRadius: '12px', padding: '14px', boxShadow: '0 8px 24px rgba(0,0,0,.15)', zIndex: 10, fontSize: '12px', color: C.text, lineHeight: 1.6 }}>
                      <div style={{ fontWeight: 700, color: C.navy, marginBottom: '8px', fontSize: '13px' }}>Marka Puanı Nasıl Hesaplanır?</div>
                      <div style={{ marginBottom: '6px' }}>Bu markaya ait tüm muadil parfümlerin <span style={{ fontWeight: 600, color: C.gold }}>Genel Puanları</span> toplanır ve ortalaması alınır.</div>
                      <div style={{ marginBottom: '6px' }}>Her parfümün genel puanı; <span style={{ fontWeight: 600 }}>koku yakınlığı</span>, <span style={{ fontWeight: 600 }}>yayılım</span> ve <span style={{ fontWeight: 600 }}>kalıcılık</span> ortalamasından oluşur.</div>
                      <div style={{ paddingTop: '8px', borderTop: `1px solid ${C.borderLight}`, color: C.textMid }}>Marka puanı bu parfüm puanlarının eşit ağırlıklı ortalamasıdır (0–10).</div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '960px', margin: '0 auto', padding: sm ? '24px 16px' : '36px 32px' }}>
        <h2 style={{ fontSize: '22px', fontWeight: 800, color: C.navy, marginBottom: '18px' }}>Parfümler</h2>
        <div style={{ display: 'grid', gridTemplateColumns: xs ? '1fr' : sm ? '1fr 1fr' : 'repeat(auto-fill,minmax(260px,1fr))', gap: '16px' }}>
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
