import { useEffect, useRef } from 'react';
import { useW } from '@/hooks/useW';
import { C, F, FH } from '@/constants/theme';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMagnifyingGlass, faScaleBalanced, faStar, faBullseye } from '@fortawesome/free-solid-svg-icons';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const STEPS = [
  { icon: faMagnifyingGlass, n: '01', title: 'Orijinalini Seç',  desc: 'Hayalindeki lüks parfümü marka ve model olarak seç.' },
  { icon: faScaleBalanced,   n: '02', title: 'Muadilleri Gör',   desc: 'Aynı koku profiline sahip muadilleri yan yana gör.' },
  { icon: faStar,            n: '03', title: 'Yorumları Oku',    desc: 'Gerçek kullanıcıların benzerlik, yayılım ve kalıcılık puanlarını incele.' },
  { icon: faBullseye,        n: '04', title: 'En Yakını Bul',    desc: 'Orijinale en yakın muadili bul, eşsiz bir koku deneyimi yaşa.' },
];

/* Split a string into word <span>s for animation */
function SplitWords({ text, style }) {
  return (
    <span style={style}>
      {text.split(' ').map((word, i) => (
        <span
          key={i}
          className="gsap-word"
          style={{ display: 'inline-block', overflow: 'hidden', marginRight: i < text.split(' ').length - 1 ? '0.28em' : 0 }}
        >
          <span className="gsap-word-inner" style={{ display: 'inline-block' }}>
            {word}
          </span>
        </span>
      ))}
    </span>
  );
}

export function HowItWorksSection() {
  const { sm } = useW();
  const sectionRef = useRef(null);
  const headingRef = useRef(null);

  /* GSAP word-reveal animation for heading */
  useEffect(() => {
    const heading = headingRef.current;
    if (!heading) return;

    const inners = heading.querySelectorAll('.gsap-word-inner');
    gsap.set(inners, { yPercent: 105, opacity: 0 });

    const trigger = ScrollTrigger.create({
      trigger: heading,
      start: 'top 82%',
      onEnter: () => {
        gsap.to(inners, {
          yPercent: 0,
          opacity: 1,
          duration: 0.85,
          ease: 'power3.out',
          stagger: 0.07,
        });
      },
      once: true,
    });

    return () => trigger.kill();
  }, []);

  /* Step cards scroll-reveal */
  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const items = section.querySelectorAll('.sr');
    const observer = new IntersectionObserver(
      entries => entries.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add('visible'); observer.unobserve(e.target); }
      }),
      { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
    );
    items.forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      style={{
        background: '#1A1714',
        padding: sm ? '72px 20px' : '100px 48px',
        borderBottom: '1px solid rgba(255,255,255,.06)',
      }}
    >
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>

        {/* Section header */}
        <div className="sr" style={{ marginBottom: '64px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
            <div style={{ width: '20px', height: '1px', background: C.gold }} />
            <span style={{ fontSize: '11px', fontWeight: 600, color: C.gold, letterSpacing: '.12em', textTransform: 'uppercase', fontFamily: F }}>
              Nasıl Çalışır?
            </span>
          </div>

          <h2
            ref={headingRef}
            style={{ fontFamily: FH, lineHeight: 1.1, letterSpacing: '-0.01em', margin: 0 }}
          >
            <SplitWords
              text="4 adımda"
              style={{ display: 'block', fontSize: 'clamp(32px, 4vw, 56px)', fontWeight: 400, color: '#fff' }}
            />
            <SplitWords
              text="muadil keşfi."
              style={{ display: 'block', fontSize: 'clamp(32px, 4vw, 56px)', fontWeight: 400, fontStyle: 'italic', color: C.gold }}
            />
          </h2>
        </div>

        {/* Steps grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: sm ? '1fr' : 'repeat(4, 1fr)',
          gap: sm ? '1px' : '0',
          border: '1px solid rgba(255,255,255,.08)',
          borderRadius: '16px',
          overflow: 'hidden',
        }}>
          {STEPS.map((step, i) => (
            <div
              key={step.n}
              className={`sr sr-d${i + 1}`}
              style={{
                padding: '36px 32px',
                borderRight: !sm && i < 3 ? '1px solid rgba(255,255,255,.08)' : 'none',
                borderBottom: sm && i < 3  ? '1px solid rgba(255,255,255,.08)' : 'none',
                background: 'rgba(255,255,255,.02)',
                transition: 'background 0.2s',
                position: 'relative',
                overflow: 'hidden',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(184,147,90,.06)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,.02)'; }}
            >
              {/* Large decorative number */}
              <div style={{
                position: 'absolute', top: '-8px', right: '20px',
                fontFamily: FH, fontSize: '80px', fontWeight: 300,
                color: 'rgba(255,255,255,.10)', lineHeight: 1, userSelect: 'none',
                letterSpacing: '-0.02em',
              }}>
                {step.n}
              </div>

              {/* Icon */}
              <div style={{
                width: '40px', height: '40px', borderRadius: '10px',
                background: 'rgba(184,147,90,.1)', border: '1px solid rgba(184,147,90,.25)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px',
              }}>
                <FontAwesomeIcon icon={step.icon} style={{ fontSize: '16px', color: C.gold }} />
              </div>

              {/* Step number label */}
              <div style={{ fontSize: '10px', fontWeight: 700, color: C.gold, letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: '10px', fontFamily: F }}>
                Adım {step.n}
              </div>

              {/* Title */}
              <h3 style={{ fontFamily: FH, fontSize: '22px', fontWeight: 500, color: '#fff', marginBottom: '10px', lineHeight: 1.2 }}>
                {step.title}
              </h3>

              {/* Desc */}
              <p style={{ fontSize: '14px', color: 'rgba(255,255,255,.45)', lineHeight: 1.7, fontFamily: F, fontWeight: 400 }}>
                {step.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
