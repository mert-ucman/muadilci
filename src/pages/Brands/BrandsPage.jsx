import { useState } from 'react';
import { useRouter } from '@/contexts/RouterContext';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import { useW } from '@/hooks/useW';
import { Card } from '@/components/ui';
import { C, F } from '@/constants/theme';
import noImage from '@/img/no-image.jpg';

export function BrandsPage() {
  const { navigate } = useRouter();
  const { brands, toggleBrandFavorite, isBrandFavorite } = useData();
  const { user } = useAuth();
  const { sm, xs } = useW();
  const [tab, setTab] = useState('original');
  const filtered = brands.filter((b) => b.type === tab && b.active);
  const isOrig = tab === 'original';

  return (
    <div style={{ minHeight: '100vh', background: C.bg, padding: xs ? '16px' : sm ? '20px 16px' : '32px' }}>
      <div style={{ maxWidth: '1320px', margin: '0 auto' }}>
        <h1 style={{ fontSize: sm ? '22px' : '26px', fontWeight: 900, color: C.navy, marginBottom: '4px' }}>Markalar</h1>
        <p style={{ color: C.textLight, fontSize: '14px', marginBottom: '22px' }}>Orijinal ve muadil parfüm evleri</p>

        <div style={{ display: 'flex', gap: '4px', marginBottom: '22px', background: C.card, border: `1px solid ${C.border}`, borderRadius: '12px', padding: '4px', width: 'fit-content' }}>
          {[['original', 'Orijinal Markalar'], ['muadil', 'Muadil Markalar']].map(([v, l]) => (
            <button key={v} onClick={() => setTab(v)} style={{ padding: sm ? '8px 14px' : '8px 22px', borderRadius: '9px', border: 'none', background: tab === v ? C.navy : 'transparent', color: tab === v ? '#fff' : C.textMid, fontSize: sm ? '13px' : '14px', fontWeight: 600, cursor: 'pointer', fontFamily: F, transition: 'all .2s' }}>{l}</button>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: xs ? '1fr' : sm ? '1fr 1fr' : 'repeat(auto-fill,minmax(230px,1fr))', gap: '14px' }}>
          {filtered.map((b) => (
            <Card key={b.id} hover style={{ padding: sm ? '16px' : '22px', cursor: 'pointer', position: 'relative' }} onClick={() => navigate(`/marka/${b.slug}`)}>
              <button
                onClick={(e) => { e.stopPropagation(); toggleBrandFavorite(user?.id, b.id); }}
                style={{ position: 'absolute', top: '10px', right: '10px', width: '28px', height: '28px', borderRadius: '50%', border: `1px solid ${isBrandFavorite(user?.id, b.id) ? C.redBorder : C.border}`, background: isBrandFavorite(user?.id, b.id) ? C.redBg : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '13px', transition: 'all .15s' }}
                title={user ? (isBrandFavorite(user?.id, b.id) ? 'Favoriden çıkar' : 'Favoriye ekle') : 'Giriş yapın'}>
                {isBrandFavorite(user?.id, b.id) ? '❤️' : '🤍'}
              </button>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '12px' }}>
                <div style={{ width: sm ? '38px' : '46px', height: sm ? '38px' : '46px', borderRadius: '10px', background: isOrig ? C.goldBg : C.greenBg, border: `1px solid ${isOrig ? C.goldBorder : C.greenBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 800, color: isOrig ? C.gold : C.green, flexShrink: 0, overflow: 'hidden' }}>
                  <img src={b.logoImage || noImage} alt={b.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <div style={{ paddingRight: '24px', minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: sm ? '13px' : '15px', color: C.navy, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{b.name}</div>
                  <div style={{ fontSize: '12px', color: C.textMid }}>{b.origin} · {b.founded}</div>
                </div>
              </div>
              <div style={{ fontSize: '13px', color: C.textLight, paddingTop: '10px', borderTop: `1px solid ${C.borderLight}` }}>
                <span>♥ {b.likes.toLocaleString()}</span>
              </div>
            </Card>
          ))}
          {!filtered.length && <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '60px', color: C.textLight }}>Bu kategoride marka bulunmuyor.</div>}
        </div>
      </div>
    </div>
  );
}
