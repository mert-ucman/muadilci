import { useState, useEffect, useCallback } from 'react';
import { useRouter } from '@/contexts/RouterContext';
import { useData } from '@/contexts/DataContext';
import { C, F } from '@/constants/theme';

const STATS = [['2.400+', 'Parfüm'], ['45K+', 'Eşleşme'], ['12K+', 'Yorum'], ['180+', 'Marka']];
const INTERVAL = 5000;

function DefaultVisual() {
  const HERO_PERFUMES = [
    { name: 'Chanel N°5', muadil: 'MFY N°5 Benzeri', img: 'https://images.unsplash.com/photo-1541643600914-78b084683702?w=200&q=80', big: false },
    { name: 'Dior Sauvage', muadil: 'MFY Sauvage Benzeri', img: 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=200&q=80', big: true },
    { name: 'Tom Ford Oud', muadil: 'Lattafa Oud Mood', img: 'https://images.unsplash.com/photo-1547887538-e3a2f32cb1cc?w=200&q=80', big: false },
  ];
  return (
    <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', alignItems: 'flex-end', padding: '20px 0' }}>
      {HERO_PERFUMES.map((p) => (
        <div key={p.name} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', transform: p.big ? 'translateY(-16px)' : 'none' }}>
          <div style={{ position: 'relative', width: p.big ? '96px' : '76px', height: p.big ? '136px' : '112px', borderRadius: '14px', overflow: 'hidden', boxShadow: '0 12px 40px rgba(0,0,0,.4)', border: '2px solid rgba(255,255,255,.12)', background: 'rgba(184,150,90,.15)' }}>
            <img src={p.img} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} onError={(e) => { e.target.style.display = 'none'; }} />
            {p.big && <div style={{ position: 'absolute', top: '-8px', right: '-8px', background: C.gold, borderRadius: '20px', padding: '2px 8px', fontSize: '10px', fontWeight: 700, color: '#fff' }}>#1</div>}
          </div>
          <div style={{ textAlign: 'center', maxWidth: '84px' }}>
            <div style={{ fontSize: '10px', color: 'rgba(255,255,255,.45)', lineHeight: 1.3 }}>{p.name}</div>
            <div style={{ fontSize: '10px', color: C.goldLight, fontWeight: 600, lineHeight: 1.3, marginTop: '2px' }}>{p.muadil}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function HeroContent({ navigate }) {
  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '48px', alignItems: 'center', position: 'relative', zIndex: 2 }}>
      <div>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(184,150,90,.15)', border: '1px solid rgba(184,150,90,.3)', borderRadius: '30px', padding: '6px 16px', marginBottom: '24px' }}>
          <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: C.goldLight, animation: 'pulse 2s infinite' }} />
          <span style={{ color: C.goldLight, fontSize: '12px', fontWeight: 700, letterSpacing: '.08em' }}>TÜRKİYE'NİN İLK MUADİL PARFÜM KIYASLAMA PLATFORMU</span>
        </div>
        <h1 style={{ fontSize: 'clamp(32px,4.5vw,58px)', fontWeight: 900, color: '#fff', lineHeight: 1.1, marginBottom: '20px' }}>
          Lüks kokuyu,<br /><span style={{ color: C.goldLight }}>en yakın muadiliyle</span><br />keşfet.
        </h1>
        <p style={{ fontSize: '16px', color: 'rgba(255,255,255,.7)', lineHeight: 1.8, marginBottom: '32px', maxWidth: '420px' }}>
          Chanel, Dior, Tom Ford parfümlerinin orijinaline en yakın muadillerini bul. Gerçek kullanıcı yorumlarıyla karşılaştır.
        </p>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '44px' }}>
          <button onClick={() => navigate('/karsilastir')} style={{ background: `linear-gradient(135deg,${C.gold},${C.goldLight})`, border: 'none', borderRadius: '12px', padding: '14px 28px', color: '#fff', fontSize: '15px', fontWeight: 700, cursor: 'pointer', fontFamily: F, boxShadow: '0 4px 20px rgba(184,150,90,.4)' }}>
            🔍 Karşılaştırmaya Başla
          </button>
          <button onClick={() => navigate('/kayit')} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,.3)', borderRadius: '12px', padding: '14px 28px', color: '#fff', fontSize: '15px', fontWeight: 600, cursor: 'pointer', fontFamily: F }}>
            Ücretsiz Üye Ol →
          </button>
        </div>
        <div style={{ display: 'flex', gap: '32px', flexWrap: 'wrap' }}>
          {STATS.map(([n, l]) => (
            <div key={l}>
              <div style={{ fontSize: '26px', fontWeight: 900, color: '#fff', textShadow: '0 2px 8px rgba(0,0,0,.4)' }}>{n}</div>
              <div style={{ fontSize: '12px', color: 'rgba(255,255,255,.5)', marginTop: '2px' }}>{l}</div>
            </div>
          ))}
        </div>
      </div>
      <DefaultVisual />
    </div>
  );
}

export function HeroSection() {
  const { navigate } = useRouter();
  const { sliderImages } = useData();
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);

  const total = sliderImages.length;

  const prev = useCallback(() => setCurrent((c) => (c - 1 + total) % total), [total]);
  const next = useCallback(() => setCurrent((c) => (c + 1) % total), [total]);

  useEffect(() => { setCurrent(0); }, [total]);

  useEffect(() => {
    if (total < 2 || paused) return;
    const t = setInterval(next, INTERVAL);
    return () => clearInterval(t);
  }, [total, paused, next]);

  if (total === 0) {
    return (
      <div style={{ background: `linear-gradient(135deg,${C.navy} 0%,#0f1c38 100%)`, padding: '80px 32px 0', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle at 20% 50%,rgba(184,150,90,.1) 0%,transparent 50%),radial-gradient(circle at 80% 20%,rgba(184,150,90,.07) 0%,transparent 40%)' }} />
        <HeroContent navigate={navigate} />
        <svg style={{ display: 'block', marginTop: '60px', marginBottom: '-2px' }} viewBox="0 0 1440 48" fill="none" preserveAspectRatio="none">
          <path d="M0 48L60 42.7C120 37.3 240 26.7 360 26.7C480 26.7 600 37.3 720 40C840 42.7 960 37.3 1080 29.3C1200 21.3 1320 10.7 1380 5.3L1440 0V48H0Z" fill="#f7f8fc" />
        </svg>
      </div>
    );
  }

  return (
    <div
      style={{ position: 'relative', overflow: 'hidden', height: '75vh', minHeight: '500px' }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}>

      {/* Sliding strip */}
      <div style={{ display: 'flex', height: '100%', transform: `translateX(-${current * 100}%)`, transition: 'transform .55s cubic-bezier(.4,0,.2,1)', willChange: 'transform' }}>
        {sliderImages.map((img, i) => (
          <div key={img.id} style={{ position: 'relative', flexShrink: 0, width: '100%', height: '100%' }}>
            <img src={img.src} alt={img.name} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            <div style={{ position: 'absolute', inset: 0, background: i === 0 ? 'linear-gradient(135deg,rgba(13,27,56,.82) 0%,rgba(13,27,56,.55) 60%,rgba(13,27,56,.2) 100%)' : 'rgba(13,27,56,.35)' }} />
            {/* Yazılar sadece 1. slide'da */}
            {i === 0 && (
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 32px' }}>
                <div style={{ width: '100%' }}>
                  <HeroContent navigate={navigate} />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Left arrow */}
      {total > 1 && (
        <button onClick={prev} style={{ position: 'absolute', left: '20px', top: '50%', transform: 'translateY(-50%)', zIndex: 4, width: '44px', height: '44px', borderRadius: '50%', background: 'rgba(255,255,255,.15)', border: '1px solid rgba(255,255,255,.25)', color: '#fff', fontSize: '20px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)', transition: 'background .2s' }}
          onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,.28)'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,.15)'}>‹</button>
      )}

      {/* Right arrow */}
      {total > 1 && (
        <button onClick={next} style={{ position: 'absolute', right: '20px', top: '50%', transform: 'translateY(-50%)', zIndex: 4, width: '44px', height: '44px', borderRadius: '50%', background: 'rgba(255,255,255,.15)', border: '1px solid rgba(255,255,255,.25)', color: '#fff', fontSize: '20px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)', transition: 'background .2s' }}
          onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,.28)'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,.15)'}>›</button>
      )}

      {/* Dots */}
      {total > 1 && (
        <div style={{ position: 'absolute', bottom: '20px', left: '50%', transform: 'translateX(-50%)', zIndex: 4, display: 'flex', gap: '8px' }}>
          {sliderImages.map((_, i) => (
            <button key={i} onClick={() => setCurrent(i)} style={{ width: i === current ? '24px' : '8px', height: '8px', borderRadius: '4px', border: 'none', background: i === current ? C.gold : 'rgba(255,255,255,.4)', cursor: 'pointer', padding: 0, transition: 'all .3s' }} />
          ))}
        </div>
      )}

    </div>
  );
}
