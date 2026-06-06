import { useEffect, useRef } from 'react';
import howItWorksBg from '@/img/how-it-works-bg.png';
import { useW } from '@/hooks/useW';
import { C, F, FH } from '@/constants/theme';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMagnifyingGlass, faScaleBalanced, faStar, faBullseye } from '@fortawesome/free-solid-svg-icons';

const STEPS = [
  { icon: faMagnifyingGlass, n: '01', title: 'Orijinalini Seç',  desc: 'Hayalindeki lüks parfümü marka ve model olarak seç.' },
  { icon: faScaleBalanced,   n: '02', title: 'Muadilleri Gör',   desc: 'Aynı koku profiline sahip muadilleri yan yana gör.' },
  { icon: faStar,            n: '03', title: 'Yorumları Oku',    desc: 'Gerçek kullanıcıların benzerlik, yayılım ve kalıcılık puanlarını incele.' },
  { icon: faBullseye,        n: '04', title: 'En Yakını Bul',    desc: 'Orijinale en yakın muadili bul, eşsiz bir koku deneyimi yaşa.' },
];

export function HowItWorksSection() {
  const { sm, xs } = useW();
  const sectionRef = useRef(null);

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
      <img
        src={howItWorksBg}
        alt=""
        aria-hidden="true"
        className="absolute inset-0 w-full h-full object-cover object-center"
        onError={e => (e.target.style.display = 'none')}
      />
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

        {/* Steps grid */}
        <div
          className="overflow-hidden"
          style={{
            display: 'grid',
            gridTemplateColumns: xs ? 'repeat(2, 1fr)' : sm ? '1fr' : 'repeat(4, 1fr)',
            gap: xs ? '12px' : sm ? '1px' : '0',
            border: xs ? 'none' : `1px solid ${C.border}`,
            borderRadius: '16px',
            overflow: xs ? 'visible' : 'hidden',
          }}
        >
          {STEPS.map((step, i) => (
            <div
              key={step.n}
              className={`sr sr-d${i + 1} relative overflow-hidden transition-[background] duration-200`}
              style={{
                padding: xs ? '24px 20px' : '36px 32px',
                border: xs ? `1px solid ${C.border}` : 'none',
                borderRadius: xs ? '16px' : '0',
                borderRight: !sm && !xs && i < 3 ? `1px solid ${C.border}` : xs ? undefined : 'none',
                borderBottom: sm && !xs && i < 3  ? `1px solid ${C.border}` : xs ? undefined : 'none',
                background: '#fff',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = C.goldBg; }}
              onMouseLeave={e => { e.currentTarget.style.background = '#fff'; }}
            >
              {/* Large decorative number */}
              <div
                className="absolute top-[-8px] right-5 font-light leading-none select-none tracking-[-0.02em] text-[80px] text-black/10"
                style={{ fontFamily: FH }}
              >
                {step.n}
              </div>

              {/* Icon */}
              <div className="w-10 h-10 rounded-[10px] bg-(--color-gold-bg) border border-(--color-gold-border) flex items-center justify-center mb-5">
                <FontAwesomeIcon icon={step.icon} style={{ fontSize: '16px', color: C.gold }} />
              </div>

              {/* Step number label */}
              <div className="text-[10px] font-bold text-(--color-gold) tracking-[.1em] uppercase mb-[10px]" style={{ fontFamily: F }}>Adım {step.n}</div>

              {/* Title */}
              <h3 className="text-[22px] font-medium text-(--color-text) mb-[10px] leading-[1.2]" style={{ fontFamily: FH }}>{step.title}</h3>

              {/* Desc */}
              <p className="text-[14px] text-(--color-text-light) leading-[1.7] font-normal" style={{ fontFamily: F }}>{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
