import { useRouter } from '@/contexts/RouterContext';
import { useData } from '@/contexts/DataContext';
import { useW } from '@/hooks/useW';
import { C } from '@/constants/theme';
import noImage from '@/img/no-image.jpg';

const MARQUEE_STYLE = `
  @keyframes marquee-ltr {
    0%   { transform: translateX(0); }
    100% { transform: translateX(-50%); }
  }
  @keyframes marquee-rtl {
    0%   { transform: translateX(-50%); }
    100% { transform: translateX(0); }
  }
  .marquee-ltr {
    display: flex;
    width: max-content;
    animation: marquee-ltr var(--marquee-duration, 80s) linear infinite;
  }
  .marquee-rtl {
    display: flex;
    width: max-content;
    animation: marquee-rtl var(--marquee-duration, 80s) linear infinite;
  }
`;

function BrandChip({ b, navigate }) {
  return (
    <div
      onClick={() => navigate(`/marka/${b.slug}`)}
      style={{
        display: 'flex', alignItems: 'center', gap: '8px',
        background: '#fff',
        border: `1px solid ${C.border}`,
        borderRadius: '40px', padding: '5px 18px 5px 5px',
        cursor: 'pointer',
        flexShrink: 0,
        boxShadow: '0 1px 4px rgba(184,150,90,.08)',
        transition: 'box-shadow .15s, border-color .15s',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = '0 4px 14px rgba(184,150,90,.22)';
        e.currentTarget.style.borderColor = C.goldBorder;
      }}
      onMouseLeave={(e) => {
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
      <span style={{ fontSize: '13px', fontWeight: 600, color: C.textMid, letterSpacing: '.01em', whiteSpace: 'nowrap' }}>{b.name}</span>
    </div>
  );
}

function MarqueeRow({ items, direction, navigate }) {
  const doubled = [...items, ...items];
  const duration = Math.max(30, items.length * 2.5);
  return (
    <div style={{ position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '120px', zIndex: 2, background: 'linear-gradient(to right, #faf9f7 0%, transparent 100%)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '120px', zIndex: 2, background: 'linear-gradient(to left, #faf9f7 0%, transparent 100%)', pointerEvents: 'none' }} />
      <div className={direction === 'ltr' ? 'marquee-ltr' : 'marquee-rtl'} style={{ gap: '10px', paddingLeft: '10px', '--marquee-duration': `${duration}s` }}>
        {doubled.map((b, i) => (
          <BrandChip key={`${b.id}-${i}`} b={b} navigate={navigate} />
        ))}
      </div>
    </div>
  );
}

export function BrandsBandSection() {
  const { navigate } = useRouter();
  const { brands } = useData();
  const { sm } = useW();

  const visible = brands.filter((b) => b.active !== false);
  const originals = visible.filter((b) => b.type === 'original');
  const muadils   = visible.filter((b) => b.type === 'muadil');

  if (!originals.length && !muadils.length) return null;

  return (
    <div style={{ background: '#faf9f7', padding: sm ? '28px 0' : '48px 0', borderTop: `1px solid ${C.border}` }}>
      <style>{MARQUEE_STYLE}</style>

      <div style={{ textAlign: 'center', marginBottom: '28px' }}>
        <span style={{ fontSize: '11px', color: C.textLight, fontWeight: 700, letterSpacing: '.14em' }}>DESTEKLENEN MARKALAR</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {/* Orijinal markalar — sağdan sola (ltr animasyon) */}
        {originals.length > 0 && <MarqueeRow items={originals} direction="ltr" navigate={navigate} />}

        {/* Muadil markalar — soldan sağa (rtl animasyon) */}
        {muadils.length > 0 && <MarqueeRow items={muadils} direction="rtl" navigate={navigate} />}
      </div>
    </div>
  );
}
