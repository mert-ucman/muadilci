import { useEffect, useRef } from 'react';
import { useData } from '@/contexts/DataContext';
import { useW } from '@/hooks/useW';
import { C, F, FH } from '@/constants/theme';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMagnifyingGlass, faScaleBalanced, faArrowPointer } from '@fortawesome/free-solid-svg-icons';
import { faComments } from '@fortawesome/free-regular-svg-icons';

const STEPS = [
  { icon: faArrowPointer,    n: '01', title: 'Orijinalini Seç',  desc: 'Hayalindeki lüks parfümü marka ve model olarak seç.' },
  { icon: faScaleBalanced,   n: '02', title: 'Muadilleri Gör',   desc: 'Aynı koku profiline sahip muadilleri yan yana gör.' },
  { icon: faComments,        n: '03', title: 'Yorumları Oku',    desc: 'Gerçek kullanıcıların benzerlik, yayılım ve kalıcılık puanlarını incele.' },
  { icon: faMagnifyingGlass, n: '04', title: 'En Yakını Bul',    desc: 'Orijinale en yakın muadili bul, eşsiz bir koku deneyimi yaşa.' },
];

export function HowItWorksSection() {
  const { sm, w } = useW();
  const grid4 = w >= 880; // ≥880px: tek çerçeveli 4 sütun; altında ayrı kartlar (sm=1, 640-880=2x2)
  const { landingImages } = useData();
  const sectionRef = useRef(null);
  const bgSrc = landingImages?.howItWorksBg || null;

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const items = section.querySelectorAll('.sr');
    const observer = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); observer.unobserve(e.target); } }),
      { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
    );
    items.forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden border-b border-(--color-border-light)"
      style={{ padding: sm ? '72px 20px' : '100px 48px' }}
    >
      {/* Background image */}
      {bgSrc && (
        <img
          src={bgSrc}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover object-center"
          onError={e => (e.target.style.display = 'none')}
        />
      )}
      {/* Warm overlay to keep text readable */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,251,245,0.90)_0%,rgba(255,251,245,0.75)_50%,rgba(255,251,245,0.55)_100%)]" />

      <div className="max-w-[1200px] mx-auto relative z-[1]">

        {/* Section header */}
        <div className="sr mb-16">
          <div className="inline-flex items-center gap-2 mb-5">
            <div className="w-5 h-px bg-(--color-gold)" />
            <span className="text-[11px] font-semibold text-(--color-gold) tracking-[.12em] uppercase" style={{ fontFamily: F }}>Nasıl Çalışır?</span>
          </div>
          <h2 className="text-[clamp(32px,4vw,56px)] font-light text-(--color-text) leading-[1.1] tracking-[-0.01em]" style={{ fontFamily: FH }}>
            4 adımda<br /><em className="italic text-(--color-gold)">muadil keşfi.</em>
          </h2>
        </div>

        {/* Steps — mobilde tek sütun tam genişlik kartlar, masaüstünde 4'lü grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: sm ? '1fr' : grid4 ? 'repeat(4, 1fr)' : 'repeat(2, 1fr)',
            gap: grid4 ? '0' : '12px',
            border: grid4 ? `1px solid ${C.border}` : 'none',
            borderRadius: '16px',
            overflow: grid4 ? 'hidden' : 'visible',
          }}
        >
          {STEPS.map((step, i) => (
            <div
              key={step.n}
              className={`sr sr-d${i + 1} relative overflow-hidden transition-[background] duration-200`}
              style={{
                padding: grid4 ? '36px 32px' : '24px 20px',
                border: grid4 ? 'none' : `1px solid ${C.border}`,
                borderRadius: grid4 ? '0' : '16px',
                borderRight: grid4 && i < 3 ? `1px solid ${C.border}` : 'none',
                background: '#fff',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = C.goldBg; }}
              onMouseLeave={e => { e.currentTarget.style.background = '#fff'; }}
            >
              {/* Large decorative number — sadece masaüstü */}
              <div
                className="hidden sm:block absolute top-[-8px] right-5 font-light leading-none select-none tracking-[-0.02em] text-[80px] text-black/10"
                style={{ fontFamily: FH }}
              >
                {step.n}
              </div>

              {/* İçerik: mobilde ikon sol / yazı sağ, masaüstünde dikey */}
              <div className="flex sm:block items-start gap-4">
                {/* Icon */}
                <div className="shrink-0 w-10 h-10 rounded-[10px] bg-(--color-gold-bg) border border-(--color-gold-border) flex items-center justify-center mb-0 sm:mb-5">
                  <FontAwesomeIcon icon={step.icon} style={{ fontSize: '16px', color: C.gold }} />
                </div>

                <div className="min-w-0">
                  {/* Step number label */}
                  <div className="text-[10px] font-bold text-(--color-gold) tracking-[.1em] uppercase mb-[6px] sm:mb-[10px]" style={{ fontFamily: F }}>Adım {step.n}</div>

                  {/* Title */}
                  <h3 className="text-[18px] sm:text-[22px] font-medium text-(--color-text) mb-[4px] sm:mb-[10px] leading-[1.2]" style={{ fontFamily: FH }}>{step.title}</h3>

                  {/* Desc */}
                  <p className="text-[14px] text-(--color-text-light) leading-[1.6] sm:leading-[1.7] font-normal" style={{ fontFamily: F }}>{step.desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
