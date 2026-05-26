import { useEffect, useRef } from 'react';
import { useRouter } from '@/contexts/RouterContext';
import { useW } from '@/hooks/useW';
import { C, F, FH } from '@/constants/theme';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export function CTASection() {
  const { navigate } = useRouter();
  const { sm } = useW();
  const sectionRef = useRef(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    // Banner sr elements — IntersectionObserver
    const srItems = section.querySelectorAll('.sr');
    const observer = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); observer.unobserve(e.target); } }),
      { threshold: 0.2 }
    );
    srItems.forEach(el => observer.observe(el));

    // CTA block — GSAP soldan sağa
    const ctaItems = section.querySelectorAll('.cta-anim');
    ctaItems.forEach((el, i) => {
      gsap.fromTo(
        el,
        { x: -60, opacity: 0 },
        {
          x: 0,
          opacity: 1,
          duration: 0.8,
          delay: i * 0.12,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: el,
            start: 'top 88%',
            once: true,
          },
        }
      );
    });

    return () => {
      observer.disconnect();
      ScrollTrigger.getAll().forEach(t => t.kill());
    };
  }, []);

  return (
    <section ref={sectionRef}>
      {/* Atmospheric banner */}
      <div style={{ position: 'relative', height: '320px', overflow: 'hidden' }}>
        <img
          src="https://images.unsplash.com/photo-1585386959984-a4155224a1ad?w=1600&q=80"
          alt=""
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
          onError={e => (e.target.style.display = 'none')}
        />
        {/* Dark editorial overlay */}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, rgba(8,6,4,.9) 0%, rgba(8,6,4,.65) 50%, rgba(8,6,4,.3) 100%)' }} />

        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', padding: sm ? '0 20px' : '0 10%' }}>
          <div className="sr">
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '18px' }}>
              <div style={{ width: '20px', height: '1px', background: C.gold }} />
              <span style={{ fontSize: '11px', fontWeight: 600, color: C.gold, letterSpacing: '.12em', textTransform: 'uppercase', fontFamily: F }}>Muadilci</span>
            </div>
            <h2 style={{ fontFamily: FH, fontSize: 'clamp(28px, 3.5vw, 52px)', fontWeight: 400, color: '#fff', lineHeight: 1.1, letterSpacing: '-0.01em', marginBottom: '16px' }}>
              Koku dünyasını<br /><em style={{ fontStyle: 'italic', color: C.gold }}>demokratize ediyoruz.</em>
            </h2>
            <p style={{ fontSize: '15px', color: 'rgba(255,255,255,.6)', maxWidth: '400px', lineHeight: 1.7, fontFamily: F }}>
              Orijinale en yakın muadili bul. Muadilci topluluğu sana en iyi alternatifleri bulduruyor.
            </p>
          </div>
        </div>
      </div>

      {/* CTA block — warm cream */}
      <div style={{
        background: C.goldBg,
        borderTop: `1px solid ${C.goldBorder}`,
        padding: sm ? '64px 20px' : '88px 48px',
        textAlign: 'center',
      }}>
        <div style={{ maxWidth: '560px', margin: '0 auto' }}>
          <div className="cta-anim" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
            <div style={{ width: '20px', height: '1px', background: C.gold }} />
            <span style={{ fontSize: '11px', fontWeight: 600, color: C.gold, letterSpacing: '.12em', textTransform: 'uppercase', fontFamily: F }}>Ücretsiz</span>
            <div style={{ width: '20px', height: '1px', background: C.gold }} />
          </div>

          <h2 className="cta-anim" style={{ fontFamily: FH, fontSize: 'clamp(28px, 4vw, 52px)', fontWeight: 400, color: C.text, lineHeight: 1.1, letterSpacing: '-0.01em', marginBottom: '16px' }}>
            Koku yolculuğuna<br /><em style={{ fontStyle: 'italic', color: C.gold }}>bugün başla.</em>
          </h2>

          <p className="cta-anim" style={{ color: C.textMid, fontSize: '15px', lineHeight: 1.75, marginBottom: '36px', fontFamily: F }}>
            Ücretsiz üye ol, yüzlerce muadil eşleşmesine eriş, yorum yap, en iyi ve en yüksek puanlı markaları ve muadil parfümü bul.
          </p>

          <div className="cta-anim" style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={() => navigate('/kayit')}
              style={{ background: C.text, border: 'none', borderRadius: '8px', padding: '14px 36px', color: '#fff', fontSize: '14px', fontWeight: 600, cursor: 'pointer', fontFamily: F, transition: 'background 0.2s, transform 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.background = C.gold; e.currentTarget.style.transform = 'translateY(-1px)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = C.text; e.currentTarget.style.transform = 'none'; }}
            >
              Ücretsiz Üye Ol
            </button>
            <button
              onClick={() => navigate('/karsilastir')}
              style={{ background: 'none', border: `1px solid ${C.goldBorder}`, borderRadius: '8px', padding: '14px 36px', color: C.textMid, fontSize: '14px', fontWeight: 500, cursor: 'pointer', fontFamily: F, transition: 'border-color 0.2s, color 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = C.gold; e.currentTarget.style.color = C.gold; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = C.goldBorder; e.currentTarget.style.color = C.textMid; }}
            >
              Karşılaştırmaya Başla
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
