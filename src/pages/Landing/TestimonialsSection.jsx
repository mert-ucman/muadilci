import { useEffect, useRef } from 'react';
import { useW } from '@/hooks/useW';
import { C, F, FH } from '@/constants/theme';

const TESTIMONIALS = [
  { av: 'A', name: 'Ahmet K.',  role: 'Doğrulanmış Üye',  rating: 5, text: "Sauvage'a bayılıyordum ama bütçemi zorluyordu. Muadilci sayesinde MFY Sauvage Benzeri'ni buldum, orijinalden farkı gerçekten minimal!" },
  { av: 'S', name: 'Selin M.',  role: 'Parfüm Tutkunları', rating: 5, text: "Artık parfüm almadan önce mutlaka Muadilci'ye bakıyorum. Orijinale en yakın muadili hızlıca bulup gerçek kullanıcı yorumlarını okuyorum." },
  { av: 'M', name: 'Mehmet T.', role: 'Koleksiyoncu',      rating: 4, text: "Lattafa'nın muadillerini bulmak için biçilmiş kaftan. Koleksiyonum için orijinali, günlük kullanım için muadili tercih ediyorum." },
];

function Stars({ rating }) {
  return (
    <div style={{ display: 'flex', gap: '3px' }}>
      {[1,2,3,4,5].map(i => (
        <svg key={i} width="12" height="12" viewBox="0 0 24 24" fill={i <= rating ? C.gold : C.borderLight} xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
        </svg>
      ))}
    </div>
  );
}

export function TestimonialsSection() {
  const { sm } = useW();
  const sectionRef = useRef(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const items = section.querySelectorAll('.sr');
    const observer = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); observer.unobserve(e.target); } }),
      { threshold: 0.12 }
    );
    items.forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} style={{ background: C.surface, padding: sm ? '72px 20px' : '100px 48px', borderBottom: `1px solid ${C.borderLight}` }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>

        {/* Header */}
        <div className="sr" style={{ marginBottom: '56px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
            <div style={{ width: '20px', height: '1px', background: C.gold }} />
            <span style={{ fontSize: '11px', fontWeight: 600, color: C.gold, letterSpacing: '.12em', textTransform: 'uppercase', fontFamily: F }}>Kullanıcıların Söyledikleri</span>
          </div>
          <h2 style={{ fontFamily: FH, fontSize: 'clamp(28px, 3.5vw, 48px)', fontWeight: 400, color: C.text, lineHeight: 1.15, letterSpacing: '-0.01em' }}>
            Gerçek kullanıcılar,<br /><em style={{ fontStyle: 'italic', color: C.gold }}>gerçek deneyimler.</em>
          </h2>
        </div>

        {/* Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: sm ? '1fr' : 'repeat(3, 1fr)', gap: '20px' }}>
          {TESTIMONIALS.map((t, i) => (
            <div
              key={t.name}
              className={`sr sr-d${i + 1}`}
              style={{
                background: '#fff',
                border: `1px solid ${C.border}`,
                borderRadius: '16px',
                padding: '32px',
                display: 'flex',
                flexDirection: 'column',
                gap: '20px',
                transition: 'box-shadow 0.25s, transform 0.25s',
              }}
              onMouseEnter={e => { e.currentTarget.style.boxShadow = C.shadowMd; e.currentTarget.style.transform = 'translateY(-2px)'; }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'none'; }}
            >
              {/* Stars */}
              <Stars rating={t.rating} />

              {/* Decorative quote mark */}
              <div style={{ fontFamily: FH, fontSize: '64px', color: C.borderLight, lineHeight: 0.6, userSelect: 'none' }}>"</div>

              {/* Text */}
              <p style={{ fontSize: '15px', color: C.textMid, lineHeight: 1.75, fontFamily: F, fontWeight: 400, fontStyle: 'italic', marginTop: '-12px' }}>
                {t.text}
              </p>

              {/* Author */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingTop: '16px', borderTop: `1px solid ${C.borderLight}`, marginTop: 'auto' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: C.text, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', color: '#fff', fontWeight: 600, flexShrink: 0, fontFamily: FH }}>
                  {t.av}
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '14px', color: C.text, fontFamily: F }}>{t.name}</div>
                  <div style={{ fontSize: '12px', color: C.textMuted, fontFamily: F }}>{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
