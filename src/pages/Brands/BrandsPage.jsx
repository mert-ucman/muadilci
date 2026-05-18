import { useState } from 'react';
import { useRouter } from '@/contexts/RouterContext';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui';
import { C, F } from '@/constants/theme';

export function BrandsPage() {
  const { navigate } = useRouter();
  const { brands, toggleBrandFavorite, isBrandFavorite } = useData();
  const { user } = useAuth();
  const [tab, setTab] = useState('original');
  const filtered = brands.filter((b) => b.type === tab && b.active);
  const isOrig = tab === 'original';

  return (
    <div style={{ minHeight: '100vh', background: C.bg, padding: '32px' }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '26px', fontWeight: 900, color: C.navy, marginBottom: '4px' }}>Markalar</h1>
        <p style={{ color: C.textLight, fontSize: '14px', marginBottom: '22px' }}>Orijinal ve muadil parfüm evleri</p>

        <div style={{ display: 'flex', gap: '4px', marginBottom: '22px', background: C.card, border: `1px solid ${C.border}`, borderRadius: '12px', padding: '4px', width: 'fit-content' }}>
          {[['original', 'Orijinal Markalar'], ['muadil', 'Muadil Markalar']].map(([v, l]) => (
            <button key={v} onClick={() => setTab(v)} style={{ padding: '8px 22px', borderRadius: '9px', border: 'none', background: tab === v ? C.navy : 'transparent', color: tab === v ? '#fff' : C.textMid, fontSize: '14px', fontWeight: 600, cursor: 'pointer', fontFamily: F, transition: 'all .2s' }}>{l}</button>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(230px,1fr))', gap: '16px' }}>
          {filtered.map((b) => (
            <Card key={b.id} hover style={{ padding: '22px', cursor: 'pointer', position: 'relative' }} onClick={() => navigate(`/marka/${b.slug}`)}>
              <button
                onClick={(e) => { e.stopPropagation(); toggleBrandFavorite(user?.id, b.id); }}
                style={{ position: 'absolute', top: '12px', right: '12px', width: '30px', height: '30px', borderRadius: '50%', border: `1px solid ${isBrandFavorite(user?.id, b.id) ? C.redBorder : C.border}`, background: isBrandFavorite(user?.id, b.id) ? C.redBg : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '14px', transition: 'all .15s' }}
                title={user ? (isBrandFavorite(user?.id, b.id) ? 'Favoriden çıkar' : 'Favoriye ekle') : 'Giriş yapın'}>
                {isBrandFavorite(user?.id, b.id) ? '❤️' : '🤍'}
              </button>
              <div style={{ display: 'flex', gap: '14px', alignItems: 'center', marginBottom: '14px' }}>
                <div style={{ width: '46px', height: '46px', borderRadius: '10px', background: isOrig ? C.goldBg : C.greenBg, border: `1px solid ${isOrig ? C.goldBorder : C.greenBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 800, color: isOrig ? C.gold : C.green, flexShrink: 0 }}>{b.logo}</div>
                <div style={{ paddingRight: '28px' }}>
                  <div style={{ fontWeight: 700, fontSize: '15px', color: C.navy }}>{b.name}</div>
                  <div style={{ fontSize: '13px', color: C.textMid }}>{b.origin} · {b.founded}</div>
                </div>
              </div>
              <div style={{ fontSize: '13px', color: C.textLight, paddingTop: '12px', borderTop: `1px solid ${C.borderLight}` }}>
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
