import { useRouter } from '@/contexts/RouterContext';
import { useData } from '@/contexts/DataContext';
import { useW } from '@/hooks/useW';
import { C } from '@/constants/theme';
import noImage from '@/img/no-image.jpg';

export function BrandsBandSection() {
  const { navigate } = useRouter();
  const { brands } = useData();
  const { w, sm } = useW();
  const visible = brands.filter((b) => b.active !== false);
  const originals = visible.filter((b) => b.type === 'original');
  const muadils  = visible.filter((b) => b.type === 'muadil');
  const sorted = [...originals, ...muadils];

  return (
    <div style={{ background: '#faf9f7', padding: sm ? '28px 16px' : w >= 1280 ? '48px 48px' : '40px 32px', borderTop: `1px solid ${C.border}` }}>
      <div style={{ maxWidth: '1320px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <span style={{ fontSize: '11px', color: C.textLight, fontWeight: 700, letterSpacing: '.14em' }}>DESTEKLENEN MARKALAR</span>
        </div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center' }}>
          {sorted.map((b) => {
            return (
              <div
                key={b.id}
                onClick={() => navigate(`/marka/${b.slug}`)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  background: '#fff',
                  border: `1px solid ${C.border}`,
                  borderRadius: '40px', padding: '5px 18px 5px 5px',
                  cursor: 'pointer',
                  boxShadow: '0 1px 4px rgba(184,150,90,.08)',
                  transition: 'transform .15s, box-shadow .15s, border-color .15s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = `0 6px 20px rgba(184,150,90,.18)`;
                  e.currentTarget.style.borderColor = C.goldBorder;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'none';
                  e.currentTarget.style.boxShadow = '0 1px 4px rgba(184,150,90,.08)';
                  e.currentTarget.style.borderColor = C.border;
                }}
              >
                <div style={{
                  width: '34px', height: '34px', borderRadius: '50%',
                  background: C.goldBg, border: `1px solid ${C.goldBorder}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  overflow: 'hidden', flexShrink: 0,
                }}>
                  <img src={b.logoImage || noImage} alt={b.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <span style={{ fontSize: '13px', fontWeight: 600, color: C.textMid, letterSpacing: '.01em' }}>{b.name}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
