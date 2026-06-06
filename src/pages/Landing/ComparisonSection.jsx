import { useEffect, useRef } from 'react';
import { useRouter } from '@/contexts/RouterContext';
import { useW } from '@/hooks/useW';
import { C, F, FH } from '@/constants/theme';
import similarImg from '@/img/similar-scent-best-equvalient.png';


export function ComparisonSection() {
  const { navigate } = useRouter();
  const { sm, xs } = useW();
  const sectionRef = useRef(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const items = section.querySelectorAll('.sr');
    const observer = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); observer.unobserve(e.target); } }),
      { threshold: 0.1 }
    );
    items.forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="bg-(--color-text) relative overflow-hidden"
      style={{
        padding: xs ? '80px 20px 72px' : sm ? '100px 24px 88px' : '0',
      }}
    >
      {/* Mobile background image */}
      {(xs || sm) && (
        <>
          <img
            src="https://images.unsplash.com/photo-1563170351-be82bc888aa4?w=900&q=85"
            alt=""
            className="absolute inset-0 w-full h-full object-cover object-center pointer-events-none"
            style={{ opacity: 0.18, filter: 'grayscale(20%)' }}
            onError={e => (e.target.style.display = 'none')}
          />
          {/* Gradient overlay so text stays readable */}
          <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(to_bottom,rgba(15,12,8,.75)_0%,rgba(15,12,8,.6)_60%,rgba(15,12,8,.85)_100%)]" />
        </>
      )}

      {/* Decorative grain texture overlay */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_80%_60%_at_70%_50%,rgba(184,147,90,.07)_0%,transparent_70%)]" />

      <div
        className="max-w-[1400px] mx-auto relative"
        style={{
          display: 'grid',
          gridTemplateColumns: xs || sm ? '1fr' : '80px 1fr 1fr',
          minHeight: xs || sm ? 'auto' : '680px',
        }}
      >
        {/* ── Left vertical text strip ── */}
        {!xs && !sm && (
          <div className="flex items-center justify-center border-r border-white/[.08] relative">
            <div
              className="whitespace-nowrap text-[10px] font-bold text-white/25 tracking-[.25em] uppercase select-none"
              style={{ transform: 'rotate(-90deg)', fontFamily: F }}
            >
              GERÇEK KARŞILAŞTIRMA — MUADILCI
            </div>
          </div>
        )}

        {/* ── Left: editorial typography ── */}
        <div
          className="flex flex-col justify-between"
          style={{
            padding: xs || sm ? '0' : '88px 56px 88px 64px',
            borderRight: xs || sm ? 'none' : '1px solid rgba(255,255,255,.08)',
          }}
        >
          {/* Eyebrow */}
          <div className="sr" style={{ marginBottom: xs || sm ? '36px' : '0' }}>
            <div className="inline-flex items-center gap-[10px] mb-10">
              <div className="w-7 h-px bg-(--color-gold)" />
              <span
                className="text-[10px] font-bold text-(--color-gold) tracking-[.2em] uppercase"
                style={{ fontFamily: F }}
              >
                Muadilci
              </span>
            </div>

            {/* Giant heading */}
            <h2
              className="font-light text-white leading-[1.0] tracking-[-0.02em] mb-8"
              style={{
                fontFamily: FH,
                fontSize: xs ? '54px' : sm ? '72px' : 'clamp(72px, 6.5vw, 108px)',
              }}
            >
              Benzer<br />
              koku,<br />
              <em className="italic text-(--color-gold) font-normal">en yakın<br />muadil.</em>
            </h2>

            {/* Thin divider line */}
            <div className="w-12 h-px bg-white/20 mb-7" />

            <p
              className="text-[14px] text-white/50 leading-[1.85] max-w-[340px] font-light"
              style={{ fontFamily: F }}
            >
              Her karşılaştırma gerçek kullanıcıların benzerlik, yayılım ve kalıcılık
              puanlarıyla desteklenir. Moderatör onaylı içerik, doğrulanmış yorumlar.
            </p>
          </div>

          {/* CTA */}
          <div className="sr sr-d3" style={{ marginTop: xs || sm ? '48px' : '56px' }}>
            <button
              onClick={() => navigate('/karsilastir')}
              className="bg-transparent border border-(--color-gold) rounded-[6px] px-9 py-[14px] text-(--color-gold) text-[13px] font-semibold cursor-pointer tracking-[.08em] uppercase transition-[background,color] duration-[250ms]"
              style={{ fontFamily: F }}
              onMouseEnter={e => { e.currentTarget.style.background = C.gold; e.currentTarget.style.color = '#fff'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = C.gold; }}
            >
              Karşılaştırmaya Başla
            </button>
          </div>
        </div>

        {/* ── Right: visual composition ── */}
        {!xs && !sm && (
          <div className="relative overflow-hidden">
            {/* Background image */}
            <img
              src={similarImg}
              alt=""
              className="absolute inset-0 w-full h-full object-cover object-center"
              style={{ opacity: 0.65, filter: 'grayscale(10%)' }}
            />

            {/* Dark gradient on left edge to blend into text column */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(15,15,15,1)_0%,rgba(15,15,15,.3)_40%,transparent_100%)]" />
            <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(15,15,15,.9)_0%,transparent_60%)]" />
          </div>
        )}
      </div>
    </section>
  );
}
