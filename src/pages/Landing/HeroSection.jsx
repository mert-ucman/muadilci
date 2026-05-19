import { useState, useEffect, useCallback } from 'react';
import { useRouter } from '@/contexts/RouterContext';
import { useData } from '@/contexts/DataContext';
import { useW } from '@/hooks/useW';
import { C, F } from '@/constants/theme';

const STATS = [['2.400+', 'Parfüm'], ['45K+', 'Eşleşme'], ['12K+', 'Yorum'], ['180+', 'Marka']];
const INTERVAL = 5000;

function ScoreRow({ label, value, color }) {
  return (
    <div style={{ marginBottom: '7px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
        <span style={{ fontSize: '10px', color: 'rgba(255,255,255,.55)' }}>{label}</span>
        <span style={{ fontSize: '10px', fontWeight: 700, color }}>{value}/10</span>
      </div>
      <div style={{ height: '4px', background: 'rgba(255,255,255,.1)', borderRadius: '2px', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${value * 10}%`, background: `linear-gradient(90deg,${color},${color}99)`, borderRadius: '2px' }} />
      </div>
    </div>
  );
}

function DefaultVisual() {
  return (
    <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '340px' }}>
      <div style={{ position: 'absolute', width: '280px', height: '280px', borderRadius: '50%', background: 'radial-gradient(circle,rgba(184,150,90,.12) 0%,transparent 70%)', top: '50%', left: '50%', transform: 'translate(-50%,-50%)' }} />
      <div style={{ position: 'absolute', width: '180px', height: '180px', borderRadius: '50%', border: '1px solid rgba(184,150,90,.15)', top: '50%', left: '50%', transform: 'translate(-50%,-50%)' }} />

      <div style={{ position: 'relative', width: '260px', background: 'rgba(255,255,255,.07)', border: '1px solid rgba(255,255,255,.14)', borderRadius: '20px', padding: '18px', backdropFilter: 'blur(12px)', boxShadow: '0 20px 60px rgba(0,0,0,.35)' }}>
        <div style={{ fontSize: '10px', fontWeight: 700, color: 'rgba(255,255,255,.4)', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: '12px' }}>Karşılaştırma</div>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
          <div style={{ flex: 1, background: 'rgba(255,255,255,.06)', borderRadius: '12px', padding: '10px 8px', textAlign: 'center', border: '1px solid rgba(255,255,255,.1)' }}>
            <div style={{ fontSize: '18px', marginBottom: '4px' }}>🧴</div>
            <div style={{ fontSize: '9px', color: 'rgba(255,255,255,.5)', marginBottom: '2px' }}>Orijinal</div>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#fff', lineHeight: 1.2 }}>Dior Sauvage</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', flexDirection: 'column', justifyContent: 'center', gap: '4px' }}>
            <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: `linear-gradient(135deg,${C.gold},${C.goldLight})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 900, color: '#fff', boxShadow: `0 4px 12px rgba(184,150,90,.5)` }}>VS</div>
          </div>
          <div style={{ flex: 1, background: `rgba(184,150,90,.12)`, borderRadius: '12px', padding: '10px 8px', textAlign: 'center', border: `1px solid rgba(184,150,90,.25)` }}>
            <div style={{ fontSize: '18px', marginBottom: '4px' }}>✨</div>
            <div style={{ fontSize: '9px', color: C.goldLight, marginBottom: '2px' }}>Muadil</div>
            <div style={{ fontSize: '11px', fontWeight: 700, color: C.goldLight, lineHeight: 1.2 }}>MFY Sauvage</div>
          </div>
        </div>
        <ScoreRow label="Koku Yakınlığı" value={9.1} color={C.goldLight} />
        <ScoreRow label="Yayılım" value={8.4} color="#93c5fd" />
        <ScoreRow label="Kalıcılık" value={8.8} color="#86efac" />
        <div style={{ marginTop: '12px', padding: '10px 12px', background: `linear-gradient(135deg,rgba(184,150,90,.2),rgba(184,150,90,.08))`, borderRadius: '10px', border: `1px solid rgba(184,150,90,.3)`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '11px', color: 'rgba(255,255,255,.6)', fontWeight: 600 }}>Genel Puan</span>
          <span style={{ fontSize: '20px', fontWeight: 900, color: C.goldLight }}>8.8<span style={{ fontSize: '12px', opacity: .7 }}>/10</span></span>
        </div>
      </div>

      <div style={{ position: 'absolute', top: '-18px', left: '-30px', background: 'rgba(255,255,255,.09)', border: '1px solid rgba(255,255,255,.18)', borderRadius: '18px 18px 18px 4px', padding: '8px 14px', backdropFilter: 'blur(8px)', maxWidth: '180px', boxShadow: '0 8px 24px rgba(0,0,0,.2)' }}>
        <span style={{ fontSize: '11px', color: 'rgba(255,255,255,.8)', fontStyle: 'italic', lineHeight: 1.4 }}>💭 Acaba en yakın muadil hangisi?</span>
      </div>
      <div style={{ position: 'absolute', bottom: '-16px', right: '-18px', background: 'rgba(255,255,255,.09)', border: '1px solid rgba(255,255,255,.18)', borderRadius: '18px 18px 4px 18px', padding: '8px 14px', backdropFilter: 'blur(8px)', maxWidth: '190px', boxShadow: '0 8px 24px rgba(0,0,0,.2)' }}>
        <span style={{ fontSize: '11px', color: 'rgba(255,255,255,.8)', fontStyle: 'italic', lineHeight: 1.4 }}>💭 Bu parfümü en iyi kim yapıyor?</span>
      </div>
      <div style={{ position: 'absolute', top: '18px', right: '-10px', background: 'rgba(255,255,255,.1)', border: '1px solid rgba(255,255,255,.18)', borderRadius: '30px', padding: '6px 12px', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 8px 24px rgba(0,0,0,.2)' }}>
        <span style={{ fontSize: '13px' }}>💬</span>
        <span style={{ fontSize: '11px', fontWeight: 700, color: '#fff' }}>2.4K+ Yorum</span>
      </div>
      <div style={{ position: 'absolute', bottom: '28px', left: '-14px', background: `linear-gradient(135deg,rgba(184,150,90,.25),rgba(184,150,90,.1))`, border: `1px solid rgba(184,150,90,.35)`, borderRadius: '30px', padding: '6px 12px', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 8px 24px rgba(0,0,0,.2)' }}>
        <span style={{ fontSize: '13px' }}>🏆</span>
        <span style={{ fontSize: '11px', fontWeight: 700, color: C.goldLight }}>En İyi Eşleşme</span>
      </div>
      <div style={{ position: 'absolute', top: '50%', right: '-24px', transform: 'translateY(-50%)', background: 'rgba(255,255,255,.08)', border: '1px solid rgba(255,255,255,.15)', borderRadius: '30px', padding: '5px 10px', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', gap: '5px' }}>
        <div style={{ display: 'flex' }}>
          {['#b8965a','#6b8fe0','#5cb87a'].map((c, i) => (
            <div key={i} style={{ width: '18px', height: '18px', borderRadius: '50%', background: c, border: '2px solid rgba(13,27,56,.8)', marginLeft: i ? '-6px' : 0 }} />
          ))}
        </div>
        <span style={{ fontSize: '10px', fontWeight: 600, color: 'rgba(255,255,255,.7)' }}>45K+ Eşleşme</span>
      </div>
    </div>
  );
}

function HeroContent({ navigate, isMobile }) {
  return (
    <div style={{
      maxWidth: '1100px', margin: '0 auto',
      display: 'grid',
      gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
      gap: isMobile ? '32px' : '48px',
      alignItems: 'center',
      position: 'relative', zIndex: 2,
    }}>
      <div>
        <div style={{ display: 'flex', justifyContent: isMobile ? 'center' : 'center', marginBottom: '24px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(184,150,90,.15)', border: '1px solid rgba(184,150,90,.3)', borderRadius: '30px', padding: '6px 16px' }}>
            <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: C.goldLight, animation: 'pulse 2s infinite' }} />
            <span style={{ color: C.goldLight, fontSize: isMobile ? '10px' : '12px', fontWeight: 700, letterSpacing: '.08em', textAlign: 'center' }}>TÜRKİYE'NİN İLK ORJİNAL / MUADİL PARFÜM KIYASLAMA SİTESİ</span>
          </div>
        </div>
        <h1 style={{ fontSize: isMobile ? '30px' : 'clamp(32px,4.5vw,58px)', fontWeight: 900, color: '#fff', lineHeight: 1.1, marginBottom: '20px', textAlign: isMobile ? 'center' : 'left' }}>
          Lüks kokuyu,<br /><span style={{ color: C.goldLight }}>en yakın muadiliyle</span><br />keşfet.
        </h1>
        <p style={{ fontSize: '15px', color: 'rgba(255,255,255,.7)', lineHeight: 1.8, marginBottom: '28px', maxWidth: '420px', margin: isMobile ? '0 auto 28px' : '0 0 32px', textAlign: isMobile ? 'center' : 'left' }}>
          Chanel, Dior, Tom Ford, Bvlgari ve daha bir çok designer/niş parfümlerinin orijinaline en yakın muadillerini bul. Gerçek kullanıcı yorumlarıyla karşılaştır.
        </p>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '36px', justifyContent: isMobile ? 'center' : 'flex-start' }}>
          <button onClick={() => navigate('/karsilastir')} style={{ background: `linear-gradient(135deg,${C.gold},${C.goldLight})`, border: 'none', borderRadius: '12px', padding: '14px 24px', color: '#fff', fontSize: '14px', fontWeight: 700, cursor: 'pointer', fontFamily: F, boxShadow: '0 4px 20px rgba(184,150,90,.4)' }}>
            🔍 Karşılaştırmaya Başla
          </button>
          <button onClick={() => navigate('/kayit')} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,.3)', borderRadius: '12px', padding: '14px 24px', color: '#fff', fontSize: '14px', fontWeight: 600, cursor: 'pointer', fontFamily: F }}>
            Ücretsiz Üye Ol →
          </button>
        </div>
        <div style={{ display: 'flex', gap: isMobile ? '20px' : '32px', flexWrap: 'wrap', justifyContent: isMobile ? 'center' : 'flex-start' }}>
          {STATS.map(([n, l]) => (
            <div key={l} style={{ textAlign: isMobile ? 'center' : 'left' }}>
              <div style={{ fontSize: '24px', fontWeight: 900, color: '#fff', textShadow: '0 2px 8px rgba(0,0,0,.4)' }}>{n}</div>
              <div style={{ fontSize: '12px', color: 'rgba(255,255,255,.5)', marginTop: '2px' }}>{l}</div>
            </div>
          ))}
        </div>
      </div>
      {!isMobile && <DefaultVisual />}
    </div>
  );
}

export function HeroSection() {
  const { navigate } = useRouter();
  const { sliderImages } = useData();
  const { w, md, xs } = useW();
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
      <div style={{ background: `linear-gradient(135deg,${C.navy} 0%,#0f1c38 100%)`, padding: xs ? '40px 16px 36px' : md ? '56px 24px 48px' : w >= 1280 ? '100px 48px 100px' : '80px 32px 80px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle at 20% 50%,rgba(184,150,90,.1) 0%,transparent 50%),radial-gradient(circle at 80% 20%,rgba(184,150,90,.07) 0%,transparent 40%)' }} />
        <HeroContent navigate={navigate} isMobile={md} />
      </div>
    );
  }

  return (
    <div
      style={{ position: 'relative', overflow: 'hidden', height: md ? '60vh' : '75vh', minHeight: '500px' }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}>
      <div style={{ display: 'flex', height: '100%', transform: `translateX(-${current * 100}%)`, transition: 'transform .55s cubic-bezier(.4,0,.2,1)', willChange: 'transform' }}>
        {sliderImages.map((img, i) => (
          <div key={img.id} style={{ position: 'relative', flexShrink: 0, width: '100%', height: '100%' }}>
            <img src={img.src} alt={img.name} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            {i === 0 && <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg,rgba(13,27,56,.82) 0%,rgba(13,27,56,.55) 60%,rgba(13,27,56,.2) 100%)' }} />}
            {i === 0 && (
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: md ? '0 16px' : '0 32px' }}>
                <div style={{ width: '100%' }}><HeroContent navigate={navigate} isMobile={md} /></div>
              </div>
            )}
          </div>
        ))}
      </div>
      {total > 1 && (
        <button onClick={prev} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', zIndex: 4, width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(255,255,255,.15)', border: '1px solid rgba(255,255,255,.25)', color: '#fff', fontSize: '20px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>‹</button>
      )}
      {total > 1 && (
        <button onClick={next} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', zIndex: 4, width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(255,255,255,.15)', border: '1px solid rgba(255,255,255,.25)', color: '#fff', fontSize: '20px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>›</button>
      )}
      {total > 1 && (
        <div style={{ position: 'absolute', bottom: '16px', left: '50%', transform: 'translateX(-50%)', zIndex: 4, display: 'flex', gap: '8px' }}>
          {sliderImages.map((_, i) => (
            <button key={i} onClick={() => setCurrent(i)} style={{ width: i === current ? '24px' : '8px', height: '8px', borderRadius: '4px', border: 'none', background: i === current ? C.gold : 'rgba(255,255,255,.4)', cursor: 'pointer', padding: 0, transition: 'all .3s' }} />
          ))}
        </div>
      )}
    </div>
  );
}
