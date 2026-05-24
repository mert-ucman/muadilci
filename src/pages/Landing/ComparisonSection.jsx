import { useEffect, useRef } from 'react';
import { useRouter } from '@/contexts/RouterContext';
import { useW } from '@/hooks/useW';
import { C, F, FH } from '@/constants/theme';

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
      style={{
        background: '#fff',
        position: 'relative',
        overflow: 'hidden',
        padding: xs ? '80px 20px 72px' : sm ? '100px 24px 88px' : '0',
        borderBottom: `1px solid ${C.borderLight}`,
      }}
    >
      {/* Subtle warm radial glow */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'radial-gradient(ellipse 70% 60% at 65% 50%, rgba(184,147,90,.05) 0%, transparent 70%)',
      }} />

      <div style={{
        maxWidth: '1400px',
        margin: '0 auto',
        display: 'grid',
        gridTemplateColumns: xs || sm ? '1fr' : '80px 1fr 1fr',
        minHeight: xs || sm ? 'auto' : '680px',
        position: 'relative',
      }}>

        {/* ── Left vertical text strip ── */}
        {!xs && !sm && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRight: `1px solid ${C.borderLight}`,
            position: 'relative',
          }}>
            <div style={{
              transform: 'rotate(-90deg)',
              whiteSpace: 'nowrap',
              fontSize: '10px',
              fontWeight: 700,
              color: C.textMuted,
              letterSpacing: '.25em',
              textTransform: 'uppercase',
              fontFamily: F,
              userSelect: 'none',
            }}>
              GERÇEK KARŞILAŞTIRMA — MUADILCI
            </div>
          </div>
        )}

        {/* ── Left: editorial typography ── */}
        <div style={{
          padding: xs || sm ? '0' : '88px 56px 88px 64px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          borderRight: xs || sm ? 'none' : `1px solid ${C.borderLight}`,
        }}>
          <div className="sr" style={{ marginBottom: xs || sm ? '36px' : '0' }}>
            {/* Eyebrow */}
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '10px', marginBottom: '40px',
            }}>
              <div style={{ width: '28px', height: '1px', background: C.gold }} />
              <span style={{
                fontSize: '10px', fontWeight: 700, color: C.gold,
                letterSpacing: '.2em', textTransform: 'uppercase', fontFamily: F,
              }}>
                Platform
              </span>
            </div>

            {/* Giant heading */}
            <h2 style={{
              fontFamily: FH,
              fontSize: xs ? '54px' : sm ? '72px' : 'clamp(72px, 6.5vw, 108px)',
              fontWeight: 300,
              color: C.text,
              lineHeight: 1.0,
              letterSpacing: '-0.02em',
              marginBottom: '32px',
            }}>
              Aynı<br />
              koku,<br />
              <em style={{
                fontStyle: 'italic',
                color: C.gold,
                fontWeight: 400,
              }}>en yakın<br />muadil.</em>
            </h2>

            {/* Thin divider */}
            <div style={{ width: '48px', height: '1px', background: C.border, marginBottom: '28px' }} />

            <p style={{
              fontSize: '14px',
              color: C.textLight,
              lineHeight: 1.85,
              maxWidth: '340px',
              fontFamily: F,
              fontWeight: 400,
            }}>
              Her karşılaştırma gerçek kullanıcıların benzerlik, yayılım ve kalıcılık
              puanlarıyla desteklenir. Moderatör onaylı içerik, doğrulanmış yorumlar.
            </p>
          </div>

          {/* CTA */}
          <div className="sr sr-d2" style={{ marginTop: xs || sm ? '48px' : '56px' }}>
            <button
              onClick={() => navigate('/karsilastir')}
              style={{
                background: 'transparent',
                border: `1px solid ${C.gold}`,
                borderRadius: '6px',
                padding: '14px 36px',
                color: C.gold,
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: F,
                letterSpacing: '.08em',
                textTransform: 'uppercase',
                transition: 'background 0.25s, color 0.25s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = C.gold; e.currentTarget.style.color = '#fff'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = C.gold; }}
            >
              Karşılaştırmaya Başla
            </button>
          </div>
        </div>

        {/* ── Right: visual composition ── */}
        {!xs && !sm && (
          <div className="sr sr-d1" style={{
            position: 'relative',
            overflow: 'hidden',
            background: C.surface,
          }}>
            {/* Background image */}
            <img
              src="https://images.unsplash.com/photo-1563170351-be82bc888aa4?w=900&q=85"
              alt=""
              style={{
                position: 'absolute', inset: 0,
                width: '100%', height: '100%',
                objectFit: 'cover',
                opacity: 0.18,
                filter: 'grayscale(20%)',
                mixBlendMode: 'multiply',
              }}
              onError={e => (e.target.style.display = 'none')}
            />

            {/* Light gradient left edge blend */}
            <div style={{
              position: 'absolute', inset: 0,
              background: 'linear-gradient(to right, #ffffff 0%, rgba(255,255,255,.4) 30%, transparent 100%)',
            }} />

            {/* Bottom gradient */}
            <div style={{
              position: 'absolute', inset: 0,
              background: `linear-gradient(to top, ${C.surface} 0%, transparent 50%)`,
            }} />

            {/* Vertical editorial label — right side */}
            <div style={{
              position: 'absolute',
              right: '28px',
              top: '50%',
              transform: 'translateY(-50%) rotate(90deg)',
              fontSize: '9px',
              fontWeight: 700,
              color: C.textMuted,
              letterSpacing: '.3em',
              textTransform: 'uppercase',
              fontFamily: F,
              whiteSpace: 'nowrap',
              userSelect: 'none',
            }}>
              MUADILCI — 2026
            </div>

            {/* Large decorative number */}
            <div style={{
              position: 'absolute',
              top: '40px',
              left: '40px',
              fontFamily: FH,
              fontSize: '160px',
              fontWeight: 200,
              color: C.gold,
              opacity: 0.07,
              lineHeight: 1,
              letterSpacing: '-0.04em',
              userSelect: 'none',
            }}>
              01
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
