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
      onMouseDown={(e) => { if (e.button === 1) { e.preventDefault(); window.open(`/marka/${b.slug}`, '_blank'); } }}
      className="flex items-center gap-2 bg-white border border-(--color-border) rounded-[40px] py-[5px] pr-[18px] pl-[5px] cursor-pointer shrink-0 shadow-[0_1px_4px_rgba(184,150,90,.08)] transition-[box-shadow,border-color] duration-150"
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = '0 4px 14px rgba(184,150,90,.22)';
        e.currentTarget.style.borderColor = C.goldBorder;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = '0 1px 4px rgba(184,150,90,.08)';
        e.currentTarget.style.borderColor = C.border;
      }}
    >
      <div className="w-[34px] h-[34px] rounded-full bg-(--color-gold-bg) border border-(--color-gold-border) flex items-center justify-center overflow-hidden shrink-0">
        <img src={b.logoImage || noImage} alt={b.name} className="w-full h-full object-cover" />
      </div>
      <span className="text-[13px] font-semibold text-(--color-text-mid) tracking-[.01em] whitespace-nowrap">{b.name}</span>
    </div>
  );
}

function MarqueeRow({ items, direction, navigate }) {
  const doubled = [...items, ...items];
  const duration = Math.max(30, items.length * 2.5);
  return (
    <div className="relative overflow-hidden">
      <div className="absolute left-0 top-0 bottom-0 w-[120px] z-[2] bg-gradient-to-r from-[#faf9f7] to-transparent pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-[120px] z-[2] bg-gradient-to-l from-[#faf9f7] to-transparent pointer-events-none" />
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
    <div className="bg-[#faf9f7] border-t border-(--color-border)" style={{ padding: sm ? '28px 0' : '48px 0' }}>
      <style>{MARQUEE_STYLE}</style>

      <div className="text-center mb-7">
        <span className="text-[11px] text-(--color-text-light) font-bold tracking-[.14em]">DESTEKLENEN MARKALAR</span>
      </div>

      <div className="flex flex-col gap-3">
        {/* Orijinal markalar — sağdan sola (ltr animasyon) */}
        {originals.length > 0 && <MarqueeRow items={originals} direction="ltr" navigate={navigate} />}

        {/* Muadil markalar — soldan sağa (rtl animasyon) */}
        {muadils.length > 0 && <MarqueeRow items={muadils} direction="rtl" navigate={navigate} />}
      </div>
    </div>
  );
}
