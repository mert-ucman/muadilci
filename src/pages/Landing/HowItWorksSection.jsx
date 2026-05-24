import { useEffect, useRef } from 'react';
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
  const { sm } = useW();
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
    <section ref={sectionRef} style={{ position: 'relative', padding: sm ? '72px 20px' : '100px 48px', borderBottom: `1px solid ${C.borderLight}`, overflow: 'hidden' }}>

      {/* Background image */}
      <img
        src="https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1600&q=80"
        alt=""
        aria-hidden="true"
        style={{
          position: 'absolute', inset: 0,
          width: '100%', height: '100%',
          objectFit: 'cover',
          objectPosition: 'center',
        }}
        onError={e => (e.target.style.display = 'none')}
      />
      {/* Warm overlay to keep text readable */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(to right, rgba(255,251,245,0.97) 0%, rgba(255,251,245,0.92) 50%, rgba(255,251,245,0.80) 100%)',
      }} />
      <div style={{ maxWidth: '1200px', margin: '0 auto', position: 'relative', zIndex: 1 }}>

        {/* Section header */}
        <div className="sr" style={{ marginBottom: '64px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
            <div style={{ width: '20px', height: '1px', background: C.gold }} />
            <span style={{ fontSize: '11px', fontWeight: 600, color: C.gold, letterSpacing: '.12em', textTransform: 'uppercase', fontFamily: F }}>Nasıl Çalışır?</span>
          </div>
          <h2 style={{ fontFamily: FH, fontSize: 'clamp(32px, 4vw, 56px)', fontWeight: 400, color: C.text, lineHeight: 1.1, letterSpacing: '-0.01em' }}>
            4 adımda<br /><em style={{ fontStyle: 'italic', color: C.gold }}>muadil keşfi.</em>
          </h2>
        </div>

        {/* Steps grid */}
        <div style={{ display: 'grid', gridTemplateColumns: sm ? '1fr' : 'repeat(4, 1fr)', gap: sm ? '1px' : '0', border: `1px solid ${C.border}`, borderRadius: '16px', overflow: 'hidden' }}>
          {STEPS.map((step, i) => (
            <div
              key={step.n}
              className={`sr sr-d${i + 1}`}
              style={{
                padding: '36px 32px',
                borderRight: !sm && i < 3 ? `1px solid ${C.border}` : 'none',
                borderBottom: sm && i < 3  ? `1px solid ${C.border}` : 'none',
                background: '#fff',
                transition: 'background 0.2s',
                position: 'relative',
                overflow: 'hidden',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = C.goldBg; }}
              onMouseLeave={e => { e.currentTarget.style.background = '#fff'; }}
            >
              {/* Large decorative number */}
              <div style={{
                position: 'absolute', top: '-8px', right: '20px',
                fontFamily: FH, fontSize: '80px', fontWeight: 300,
                color: 'rgba(0,0,0,.10)', lineHeight: 1, userSelect: 'none',
                letterSpacing: '-0.02em',
              }}>
                {step.n}
              </div>

              {/* Icon */}
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: C.goldBg, border: `1px solid ${C.goldBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
                <FontAwesomeIcon icon={step.icon} style={{ fontSize: '16px', color: C.gold }} />
              </div>

              {/* Step number label */}
              <div style={{ fontSize: '10px', fontWeight: 700, color: C.gold, letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: '10px', fontFamily: F }}>Adım {step.n}</div>

              {/* Title */}
              <h3 style={{ fontFamily: FH, fontSize: '22px', fontWeight: 500, color: C.text, marginBottom: '10px', lineHeight: 1.2 }}>{step.title}</h3>

              {/* Desc */}
              <p style={{ fontSize: '14px', color: C.textLight, lineHeight: 1.7, fontFamily: F, fontWeight: 400 }}>{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
