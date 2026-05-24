import { useEffect, useRef, useState } from 'react';
import { useW } from '@/hooks/useW';
import { C, F, FH } from '@/constants/theme';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const TESTIMONIALS = [
  {
    av: 'A', name: 'Ahmet K.', role: 'Doğrulanmış Üye', rating: 5,
    text: "Sauvage'a bayılıyordum ama bütçemi zorluyordu. Muadilci sayesinde MFY Sauvage Benzeri'ni buldum, orijinalden farkı gerçekten minimal!",
    index: '01',
  },
  {
    av: 'S', name: 'Selin M.', role: 'Parfüm Tutkunları', rating: 5,
    text: "Artık parfüm almadan önce mutlaka Muadilci'ye bakıyorum. Orijinale en yakın muadili hızlıca bulup gerçek kullanıcı yorumlarını okuyorum.",
    index: '02',
  },
  {
    av: 'M', name: 'Mehmet T.', role: 'Koleksiyoncu', rating: 4,
    text: "Lattafa'nın muadillerini bulmak için biçilmiş kaftan. Koleksiyonum için orijinali, günlük kullanım için muadili tercih ediyorum.",
    index: '03',
  },
];

function Stars({ rating, light }) {
  return (
    <div style={{ display: 'flex', gap: '4px' }}>
      {[1, 2, 3, 4, 5].map(i => (
        <svg key={i} width="11" height="11" viewBox="0 0 24 24"
          fill={i <= rating ? C.gold : light ? 'rgba(0,0,0,.12)' : 'rgba(255,255,255,.15)'}
          xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      ))}
    </div>
  );
}

function TestimonialCard({ t, i }) {
  const [hovered, setHovered] = useState(false);
  const cardRef = useRef(null);
  const lineRef = useRef(null);

  return (
    <div
      ref={cardRef}
      className={`sr sr-d${i + 1}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'relative',
        background: hovered ? 'rgba(184,147,90,.06)' : 'rgba(255,255,255,.03)',
        border: `1px solid ${hovered ? 'rgba(184,147,90,.35)' : 'rgba(255,255,255,.08)'}`,
        borderRadius: '0',
        padding: '48px 40px 40px',
        display: 'flex',
        flexDirection: 'column',
        gap: '0',
        overflow: 'hidden',
        transition: 'background 0.4s, border-color 0.4s',
        cursor: 'default',
      }}
    >
      {/* Large index number — shrinks on hover */}
      <div style={{
        position: 'absolute',
        top: '-12px',
        right: '24px',
        fontFamily: FH,
        fontSize: hovered ? '56px' : '100px',
        fontWeight: 200,
        color: hovered ? 'rgba(184,147,90,.2)' : 'rgba(255,255,255,.06)',
        lineHeight: 1,
        userSelect: 'none',
        letterSpacing: '-0.04em',
        transition: 'font-size 0.5s cubic-bezier(0.16,1,0.3,1), color 0.4s',
        pointerEvents: 'none',
      }}>
        {t.index}
      </div>

      {/* Stars */}
      <div style={{ marginBottom: '28px' }}>
        <Stars rating={t.rating} />
      </div>

      {/* Decorative quote — large on idle, smaller on hover */}
      <div style={{
        fontFamily: FH,
        fontSize: hovered ? '48px' : '80px',
        color: hovered ? C.gold : 'rgba(255,255,255,.08)',
        lineHeight: 0.7,
        userSelect: 'none',
        marginBottom: '20px',
        transition: 'font-size 0.5s cubic-bezier(0.16,1,0.3,1), color 0.4s',
      }}>
        "
      </div>

      {/* Text */}
      <p style={{
        fontSize: hovered ? '15px' : '14px',
        color: hovered ? 'rgba(255,255,255,.85)' : 'rgba(255,255,255,.45)',
        lineHeight: 1.8,
        fontFamily: F,
        fontWeight: 300,
        fontStyle: 'italic',
        flexGrow: 1,
        transition: 'color 0.4s, font-size 0.4s',
        marginBottom: '32px',
      }}>
        {t.text}
      </p>

      {/* Bottom line — animates on hover */}
      <div style={{
        height: '1px',
        background: hovered ? `linear-gradient(to right, ${C.gold}, transparent)` : 'rgba(255,255,255,.08)',
        marginBottom: '24px',
        transition: 'background 0.5s',
      }} />

      {/* Author */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <div style={{
          width: '38px', height: '38px',
          borderRadius: '50%',
          background: hovered ? C.gold : 'rgba(255,255,255,.1)',
          border: `1px solid ${hovered ? C.gold : 'rgba(255,255,255,.15)'}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '14px',
          color: hovered ? '#fff' : 'rgba(255,255,255,.6)',
          fontWeight: 600,
          flexShrink: 0,
          fontFamily: FH,
          transition: 'background 0.4s, color 0.4s, border-color 0.4s',
        }}>
          {t.av}
        </div>
        <div>
          <div style={{ fontWeight: 500, fontSize: '14px', color: hovered ? '#fff' : 'rgba(255,255,255,.7)', fontFamily: F, transition: 'color 0.3s' }}>{t.name}</div>
          <div style={{ fontSize: '11px', color: hovered ? C.gold : 'rgba(255,255,255,.3)', fontFamily: F, letterSpacing: '.04em', marginTop: '2px', transition: 'color 0.3s' }}>{t.role}</div>
        </div>
      </div>

      {/* Hover glow corner */}
      <div style={{
        position: 'absolute',
        bottom: 0, right: 0,
        width: hovered ? '120px' : '0px',
        height: hovered ? '120px' : '0px',
        background: 'radial-gradient(circle, rgba(184,147,90,.12) 0%, transparent 70%)',
        transition: 'width 0.6s cubic-bezier(0.16,1,0.3,1), height 0.6s cubic-bezier(0.16,1,0.3,1)',
        pointerEvents: 'none',
      }} />
    </div>
  );
}

export function TestimonialsSection() {
  const { sm, xs } = useW();
  const sectionRef = useRef(null);
  const headingRef = useRef(null);
  const marqueeRef = useRef(null);

  /* Heading parallax scroll */
  useEffect(() => {
    const heading = headingRef.current;
    if (!heading || sm) return;

    const tween = gsap.fromTo(heading,
      { yPercent: 8 },
      {
        yPercent: -8,
        ease: 'none',
        scrollTrigger: {
          trigger: heading,
          start: 'top bottom',
          end: 'bottom top',
          scrub: 1.5,
        },
      }
    );
    return () => tween.scrollTrigger?.kill();
  }, [sm]);

  /* Marquee scroll-driven speed */
  useEffect(() => {
    const el = marqueeRef.current;
    if (!el) return;
    gsap.to(el, {
      xPercent: -50,
      ease: 'none',
      duration: 24,
      repeat: -1,
    });
  }, []);

  /* Cards scroll-reveal */
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

  const marqueeText = Array(8).fill('GERÇEK KULLANICI — GERÇEK DENEYİM — MUADILCI — ');

  return (
    <section
      ref={sectionRef}
      style={{
        background: C.text,
        overflow: 'hidden',
        borderBottom: '1px solid rgba(255,255,255,.06)',
      }}
    >
      {/* Atmospheric glow */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'radial-gradient(ellipse 60% 40% at 20% 60%, rgba(184,147,90,.05) 0%, transparent 70%)',
      }} />

      {/* ── Scrolling marquee strip ── */}
      <div style={{
        borderBottom: '1px solid rgba(255,255,255,.06)',
        padding: '14px 0',
        overflow: 'hidden',
        whiteSpace: 'nowrap',
      }}>
        <div ref={marqueeRef} style={{ display: 'inline-block' }}>
          {marqueeText.map((txt, i) => (
            <span key={i} style={{
              fontFamily: F,
              fontSize: '11px',
              fontWeight: 700,
              color: 'rgba(255,255,255,.12)',
              letterSpacing: '.22em',
              textTransform: 'uppercase',
              marginRight: '0',
            }}>
              {txt}
            </span>
          ))}
          {/* Duplicate for seamless loop */}
          {marqueeText.map((txt, i) => (
            <span key={`b${i}`} style={{
              fontFamily: F,
              fontSize: '11px',
              fontWeight: 700,
              color: 'rgba(255,255,255,.12)',
              letterSpacing: '.22em',
              textTransform: 'uppercase',
            }}>
              {txt}
            </span>
          ))}
        </div>
      </div>

      {/* ── Main content ── */}
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto',
        display: 'grid',
        gridTemplateColumns: xs || sm ? '1fr' : '80px 1fr',
        position: 'relative',
      }}>

        {/* Left vertical text strip */}
        {!xs && !sm && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRight: '1px solid rgba(255,255,255,.06)',
            padding: '0',
          }}>
            <div style={{
              transform: 'rotate(-90deg)',
              whiteSpace: 'nowrap',
              fontSize: '10px',
              fontWeight: 700,
              color: 'rgba(255,255,255,.18)',
              letterSpacing: '.25em',
              textTransform: 'uppercase',
              fontFamily: F,
              userSelect: 'none',
            }}>
              KULLANICI DENEYİMLERİ — MUADILCI
            </div>
          </div>
        )}

        <div style={{ padding: xs || sm ? '64px 20px' : '88px 64px' }}>

          {/* Header */}
          <div className="sr" style={{ marginBottom: '72px' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
              <div style={{ width: '28px', height: '1px', background: C.gold }} />
              <span style={{ fontSize: '10px', fontWeight: 700, color: C.gold, letterSpacing: '.2em', textTransform: 'uppercase', fontFamily: F }}>
                Kullanıcıların Söyledikleri
              </span>
            </div>

            <h2
              ref={headingRef}
              style={{
                fontFamily: FH,
                fontSize: xs ? '52px' : sm ? '64px' : 'clamp(64px, 6vw, 96px)',
                fontWeight: 300,
                color: '#fff',
                lineHeight: 1.0,
                letterSpacing: '-0.02em',
                margin: 0,
              }}
            >
              Gerçek<br />
              kullanıcılar,<br />
              <em style={{ fontStyle: 'italic', color: C.gold, fontWeight: 400 }}>
                gerçek<br />deneyimler.
              </em>
            </h2>
          </div>

          {/* Cards grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: xs ? '1fr' : sm ? '1fr 1fr' : 'repeat(3, 1fr)',
            gap: '0',
            border: '1px solid rgba(255,255,255,.08)',
          }}>
            {TESTIMONIALS.map((t, i) => (
              <TestimonialCard key={t.name} t={t} i={i} />
            ))}
          </div>

          {/* Bottom decorative line */}
          <div className="sr" style={{ marginTop: '64px', display: 'flex', alignItems: 'center', gap: '24px' }}>
            <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,.08)' }} />
            <span style={{ fontSize: '10px', fontWeight: 700, color: 'rgba(255,255,255,.2)', letterSpacing: '.2em', textTransform: 'uppercase', fontFamily: F }}>
              Muadilci Topluluğu
            </span>
            <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,.08)' }} />
          </div>
        </div>
      </div>
    </section>
  );
}
