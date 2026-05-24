import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from '@/contexts/RouterContext';
import { useData } from '@/contexts/DataContext';
import { useW } from '@/hooks/useW';
import { C, F, FH } from '@/constants/theme';
import noImage from '@/img/no-image.jpg';

const INTERVAL = 5500;

/* ── Comparison card shown in the right column ─────────────────────── */
function CompareCard({ perfumes, muadilPerfumes }) {
  const muadil  = [...muadilPerfumes].sort((a, b) => (b.reviewCount ?? 0) - (a.reviewCount ?? 0))[0];
  const perfume = muadil ? perfumes.find(p => p.id === muadil.targetPerfumeId) : null;

  const origImg   = perfume?.images?.[0]?.src || noImage;
  const muadilImg = muadil?.image || muadil?.images?.[0]?.src || noImage;
  const origName  = perfume ? `${perfume.brandName} ${perfume.name}` : 'Orijinal Parfüm';
  const muadilName= muadil  ? `${muadil.brandName} ${muadil.name}`  : 'Muadil Parfüm';

  const bars = [
    { label: 'Koku Yakınlığı', value: 9.1, color: C.gold },
    { label: 'Yayılım',        value: 8.4, color: '#6B8FD4' },
    { label: 'Kalıcılık',      value: 8.8, color: '#6DB87A' },
  ];

  return (
    <div style={{
      background: '#fff',
      border: `1px solid ${C.border}`,
      borderRadius: '20px',
      padding: '28px',
      boxShadow: '0 8px 48px rgba(0,0,0,.07)',
      width: '100%',
      maxWidth: '340px',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <span style={{ fontSize: '11px', fontWeight: 600, color: C.textMuted, letterSpacing: '.1em', textTransform: 'uppercase', fontFamily: F }}>Örnek Karşılaştırma</span>
        <span style={{ fontSize: '11px', fontWeight: 600, color: C.gold, fontFamily: F }}>8.8 / 10</span>
      </div>

      {/* Two products */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '10px', alignItems: 'center', marginBottom: '22px' }}>
        {/* Original */}
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '10px', overflow: 'hidden', margin: '0 auto 8px', border: `1px solid ${C.border}`, background: C.surface }}>
            <img src={origImg} alt={origName} onError={e => { e.currentTarget.src = noImage; }} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
          <div style={{ fontSize: '9px', fontWeight: 600, color: C.textMuted, letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: '3px', fontFamily: F }}>Orijinal</div>
          <div style={{ fontSize: '11px', fontWeight: 600, color: C.text, lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: F }}>{origName}</div>
        </div>

        {/* VS */}
        <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: C.text, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', fontWeight: 700, color: '#fff', fontFamily: F, letterSpacing: '.02em', flexShrink: 0 }}>VS</div>

        {/* Muadil */}
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '10px', overflow: 'hidden', margin: '0 auto 8px', border: `1px solid ${C.goldBorder}`, background: C.goldBg }}>
            <img src={muadilImg} alt={muadilName} onError={e => { e.currentTarget.src = noImage; }} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
          <div style={{ fontSize: '9px', fontWeight: 600, color: C.gold, letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: '3px', fontFamily: F }}>Muadil</div>
          <div style={{ fontSize: '11px', fontWeight: 600, color: C.gold, lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: F }}>{muadilName}</div>
        </div>
      </div>

      {/* Score bars */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {bars.map(bar => (
          <div key={bar.label}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
              <span style={{ fontSize: '11px', color: C.textLight, fontFamily: F }}>{bar.label}</span>
              <span style={{ fontSize: '11px', fontWeight: 600, color: bar.color, fontFamily: F }}>{bar.value}</span>
            </div>
            <div style={{ height: '3px', background: C.borderLight, borderRadius: '2px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${bar.value * 10}%`, background: bar.color, borderRadius: '2px', transition: 'width 1.2s cubic-bezier(.22,1,.36,1)' }} />
            </div>
          </div>
        ))}
      </div>

      {/* Footer stat */}
      <div style={{ marginTop: '18px', paddingTop: '16px', borderTop: `1px solid ${C.borderLight}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '11px', color: C.textLight, fontFamily: F }}>Topluluk değerlendirmesi</span>
        <div style={{ display: 'flex', gap: '2px' }}>
          {[1,2,3,4,5].map(i => (
            <svg key={i} width="10" height="10" viewBox="0 0 24 24" fill={i <= 4 ? C.gold : C.borderLight} xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
            </svg>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Hero content (text left column) ───────────────────────────────── */
function HeroText({ navigate, brands, perfumes, muadilPerfumes }) {
  const origBrands   = brands.filter(b => b.type === 'original' && b.active !== false).length;
  const muadilBrands = brands.filter(b => b.type === 'muadil'   && b.active !== false).length;

  const stats = [
    { n: origBrands,            l: 'Orijinal Marka' },
    { n: perfumes.length,       l: 'Orijinal Parfüm' },
    { n: muadilBrands,          l: 'Muadil Marka' },
    { n: muadilPerfumes.length, l: 'Muadil Parfüm' },
  ];

  return (
    <div style={{ animation: 'fadeUp 0.7s cubic-bezier(.22,1,.36,1) both' }}>
      {/* Eyebrow label */}
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '28px' }}>
        <div style={{ width: '20px', height: '1px', background: C.gold }} />
        <span style={{ fontSize: '11px', fontWeight: 600, color: C.gold, letterSpacing: '.12em', textTransform: 'uppercase', fontFamily: F }}>
          Türkiye'nin Parfüm Karşılaştırma Platformu
        </span>
      </div>

      {/* Headline — Cormorant Garamond, editorial weight */}
      <h1 style={{
        fontFamily: FH,
        fontSize: 'clamp(44px, 5.5vw, 80px)',
        fontWeight: 400,
        color: C.text,
        lineHeight: 1.05,
        letterSpacing: '-0.01em',
        marginBottom: '24px',
      }}>
        Lüks kokuyu,<br />
        <em style={{ color: C.gold, fontStyle: 'italic' }}>en yakın</em><br />
        muadiliyle keşfet.
      </h1>

      {/* Subtext */}
      <p style={{ fontSize: '16px', color: C.textMid, lineHeight: 1.75, marginBottom: '36px', maxWidth: '400px', fontFamily: F, fontWeight: 400 }}>
        Chanel, Dior, Tom Ford ve daha fazlasının orijinaline en yakın muadillerini bul. Gerçek kullanıcı yorumlarıyla karşılaştır.
      </p>

      {/* CTA buttons */}
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '52px' }}>
        <button
          onClick={() => navigate('/karsilastir')}
          style={{
            background: C.text, border: 'none',
            borderRadius: '8px', padding: '13px 28px',
            color: '#fff', fontSize: '14px', fontWeight: 600, fontFamily: F,
            cursor: 'pointer', letterSpacing: '.01em',
            transition: 'background 0.2s, transform 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = C.gold; e.currentTarget.style.transform = 'translateY(-1px)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = C.text; e.currentTarget.style.transform = 'none'; }}
        >
          Karşılaştırmaya Başla
        </button>
        <button
          onClick={() => navigate('/kayit')}
          style={{
            background: 'none',
            border: `1px solid ${C.border}`,
            borderRadius: '8px', padding: '13px 28px',
            color: C.textMid, fontSize: '14px', fontWeight: 500, fontFamily: F,
            cursor: 'pointer', letterSpacing: '.01em',
            transition: 'border-color 0.2s, color 0.2s',
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = C.text; e.currentTarget.style.color = C.text; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.textMid; }}
        >
          Ücretsiz Üye Ol
        </button>
      </div>

      {/* Stats row */}
      <div style={{ display: 'flex', gap: '36px', flexWrap: 'wrap' }}>
        {stats.map(({ n, l }) => (
          <div key={l}>
            <div style={{ fontFamily: FH, fontSize: '32px', fontWeight: 500, color: C.text, lineHeight: 1, letterSpacing: '-0.02em' }}>{n}+</div>
            <div style={{ fontSize: '12px', color: C.textLight, marginTop: '4px', fontFamily: F, letterSpacing: '.02em' }}>{l}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Main HeroSection ────────────────────────────────────────────────── */
export function HeroSection() {
  const { navigate } = useRouter();
  const { sliderImages, brands, perfumes, muadilPerfumes } = useData();
  const { lg, xs } = useW();

  const [current, setCurrent] = useState(0);
  const [paused,  setPaused]  = useState(false);

  const visibleSlides = sliderImages.filter(img => {
    if (xs)     return img.showMobile  !== false;
    if (lg)     return img.showTablet  !== false;
    return             img.showDesktop !== false;
  });
  const total = visibleSlides.length;
  const next  = useCallback(() => setCurrent(c => (c + 1) % total), [total]);
  const prev  = useCallback(() => setCurrent(c => (c - 1 + total) % total), [total]);

  useEffect(() => { setCurrent(0); }, [total]);
  useEffect(() => {
    if (total < 2 || paused) return;
    const t = setInterval(next, INTERVAL);
    return () => clearInterval(t);
  }, [total, paused, next]);

  /* No slider images → editorial two-column layout */
  if (total === 0) {
    return (
      <section style={{
        background: C.bg,
        padding: lg ? '60px 20px 72px' : '80px 48px 96px',
        borderBottom: `1px solid ${C.borderLight}`,
      }}>
        <div style={{
          maxWidth: '1200px', margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: lg ? '1fr' : '1fr 1fr',
          gap: '64px',
          alignItems: 'center',
        }}>
          <HeroText navigate={navigate} brands={brands} perfumes={perfumes} muadilPerfumes={muadilPerfumes} />
          {!lg && (
            <div style={{ display: 'flex', justifyContent: 'center', animation: 'fadeUp 0.9s 0.2s cubic-bezier(.22,1,.36,1) both' }}>
              <CompareCard perfumes={perfumes} muadilPerfumes={muadilPerfumes} />
            </div>
          )}
        </div>
      </section>
    );
  }

  /* Has slider images → full-bleed with overlay */
  return (
    <section
      style={{ position: 'relative', overflow: 'hidden', height: lg ? '65vh' : '80vh', minHeight: '520px' }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Slides */}
      <div style={{ display: 'flex', width: '100%', height: '100%', transform: `translateX(-${current * 100}%)`, transition: 'transform .6s cubic-bezier(.4,0,.2,1)', willChange: 'transform' }}>
        {visibleSlides.map((img, i) => (
          <div key={img.id} style={{ position: 'relative', flexShrink: 0, width: '100vw', minWidth: '100vw', height: '100%', overflow: 'hidden' }}>
            <img src={img.src} alt={img.name} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
            {/* Overlay — editorial: gradient from left dark, right lighter */}
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(100deg, rgba(10,8,6,.88) 0%, rgba(10,8,6,.55) 55%, rgba(10,8,6,.15) 100%)' }} />
            {i === 0 && (
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', padding: lg ? '0 20px' : '0 80px' }}>
                <div style={{ width: '100%', maxWidth: '600px' }}>
                  {/* Eyebrow */}
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
                    <div style={{ width: '20px', height: '1px', background: C.gold }} />
                    <span style={{ fontSize: '11px', fontWeight: 600, color: C.gold, letterSpacing: '.12em', textTransform: 'uppercase', fontFamily: F }}>Türkiye'nin Parfüm Karşılaştırma Platformu</span>
                  </div>
                  <h1 style={{ fontFamily: FH, fontSize: 'clamp(40px, 5vw, 72px)', fontWeight: 400, color: '#fff', lineHeight: 1.05, letterSpacing: '-0.01em', marginBottom: '20px' }}>
                    Lüks kokuyu,<br /><em style={{ color: C.gold, fontStyle: 'italic' }}>en yakın</em><br />muadiliyle keşfet.
                  </h1>
                  <p style={{ fontSize: '16px', color: 'rgba(255,255,255,.65)', lineHeight: 1.7, marginBottom: '32px', maxWidth: '420px', fontFamily: F }}>
                    Chanel, Dior, Tom Ford ve daha fazlasının orijinaline en yakın muadillerini bul.
                  </p>
                  <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    <button onClick={() => navigate('/karsilastir')} style={{ background: C.gold, border: 'none', borderRadius: '8px', padding: '13px 28px', color: '#fff', fontSize: '14px', fontWeight: 600, fontFamily: F, cursor: 'pointer', transition: 'background 0.2s' }}
                      onMouseEnter={e => e.currentTarget.style.background = C.goldDeep}
                      onMouseLeave={e => e.currentTarget.style.background = C.gold}>Karşılaştırmaya Başla</button>
                    <button onClick={() => navigate('/kayit')} style={{ background: 'rgba(255,255,255,.1)', border: '1px solid rgba(255,255,255,.25)', borderRadius: '8px', padding: '13px 28px', color: '#fff', fontSize: '14px', fontWeight: 500, fontFamily: F, cursor: 'pointer', transition: 'background 0.2s, border-color 0.2s' }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,.2)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,.4)'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,.1)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,.25)'; }}>Ücretsiz Üye Ol</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Arrows */}
      {total > 1 && ['prev','next'].map(dir => (
        <button key={dir} onClick={dir === 'prev' ? prev : next} style={{ position: 'absolute', [dir === 'prev' ? 'left' : 'right']: '20px', top: '50%', transform: 'translateY(-50%)', zIndex: 4, width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(255,255,255,.1)', border: '1px solid rgba(255,255,255,.2)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)', transition: 'background 0.2s' }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,.2)'}
          onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,.1)'}>
          <svg width="16" height="16" fill="none" stroke="#fff" strokeWidth="1.5" viewBox="0 0 24 24"><path d={dir === 'prev' ? 'M15 18l-6-6 6-6' : 'M9 18l6-6-6-6'} /></svg>
        </button>
      ))}

      {/* Dots */}
      {total > 1 && (
        <div style={{ position: 'absolute', bottom: '20px', left: '50%', transform: 'translateX(-50%)', zIndex: 4, display: 'flex', gap: '8px' }}>
          {visibleSlides.map((_, i) => (
            <button key={i} onClick={() => setCurrent(i)} style={{ width: i === current ? '20px' : '6px', height: '6px', borderRadius: '3px', border: 'none', background: i === current ? C.gold : 'rgba(255,255,255,.4)', cursor: 'pointer', padding: 0, transition: 'all .3s' }} />
          ))}
        </div>
      )}
    </section>
  );
}
