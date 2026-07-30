import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from '@/contexts/RouterContext';
import { useData } from '@/contexts/DataContext';
import { useW } from '@/hooks/useW';
import { calcScores } from '@/utils/scoring';
import { C, F, FH } from '@/constants/theme';

const INTERVAL = 5500;

/* ── Comparison card shown in the right column ─────────────────────── */
function CompareCard({ perfumes, muadilPerfumes }) {
  const { noImageUrl, comments } = useData();
  // reviewCount gönderim anında artar (onay beklerken de sayılır), bu yüzden
  // gerçekte görünür (onaylı) yorum sayısına göre sıralanır.
  const muadil  = [...muadilPerfumes].sort((a, b) => calcScores(b.id, comments).count - calcScores(a.id, comments).count)[0];
  const perfume = muadil ? perfumes.find(p => p.id === muadil.targetPerfumeId) : null;

  const origImg   = perfume?.images?.[0]?.src || noImageUrl || undefined;
  const muadilImg = muadil?.image || muadil?.images?.[0]?.src || noImageUrl || undefined;
  const origName  = perfume ? `${perfume.brandName} ${perfume.name}` : 'Orijinal Parfüm';
  const muadilName= muadil  ? `${muadil.brandName} ${muadil.name}`  : 'Muadil Parfüm';

  const bars = [
    { label: 'Koku Yakınlığı', value: 9.1, color: C.gold },
    { label: 'Yayılım',        value: 8.4, color: '#6B8FD4' },
    { label: 'Kalıcılık',      value: 8.8, color: '#6DB87A' },
  ];

  return (
    <div className="bg-white border border-(--color-border) rounded-[20px] p-7 shadow-[0_8px_48px_rgba(0,0,0,.07)] w-full max-w-[340px]">
      {/* Header */}
      <div className="flex justify-between items-center mb-5">
        <span className="text-[11px] font-semibold text-(--color-text-muted) tracking-[.1em] uppercase" style={{ fontFamily: F }}>Örnek Karşılaştırma</span>
        <span className="text-[11px] font-semibold text-(--color-gold)" style={{ fontFamily: F }}>8.8 / 10</span>
      </div>

      {/* Two products */}
      <div className="grid gap-[10px] items-center mb-[22px]" style={{ gridTemplateColumns: '1fr auto 1fr' }}>
        {/* Original */}
        <div className="text-center">
          <div className="w-14 h-14 rounded-[10px] overflow-hidden mx-auto mb-2 border border-(--color-border) bg-(--color-surface)">
            {origImg && <img src={origImg} alt={origName} decoding="async" onError={e => { e.currentTarget.onerror = null; e.currentTarget.style.display = 'none'; }} className="w-full h-full object-cover" />}
          </div>
          <div className="text-[9px] font-semibold text-(--color-text-muted) tracking-[.08em] uppercase mb-[3px]" style={{ fontFamily: F }}>Orijinal</div>
          <div className="text-[11px] font-semibold text-(--color-text) leading-[1.3] overflow-hidden text-ellipsis whitespace-nowrap" style={{ fontFamily: F }}>{origName}</div>
        </div>

        {/* VS */}
        <div className="w-7 h-7 rounded-full bg-(--color-text) flex items-center justify-center text-[9px] font-bold text-white shrink-0 tracking-[.02em]" style={{ fontFamily: F }}>VS</div>

        {/* Muadil */}
        <div className="text-center">
          <div className="w-14 h-14 rounded-[10px] overflow-hidden mx-auto mb-2 border border-(--color-gold-border) bg-(--color-gold-bg)">
            {muadilImg && <img src={muadilImg} alt={muadilName} decoding="async" onError={e => { e.currentTarget.onerror = null; e.currentTarget.style.display = 'none'; }} className="w-full h-full object-cover" />}
          </div>
          <div className="text-[9px] font-semibold text-(--color-gold) tracking-[.08em] uppercase mb-[3px]" style={{ fontFamily: F }}>Muadil</div>
          <div className="text-[11px] font-semibold text-(--color-gold) leading-[1.3] overflow-hidden text-ellipsis whitespace-nowrap" style={{ fontFamily: F }}>{muadilName}</div>
        </div>
      </div>

      {/* Score bars */}
      <div className="flex flex-col gap-[10px]">
        {bars.map(bar => (
          <div key={bar.label}>
            <div className="flex justify-between mb-[5px]">
              <span className="text-[11px] text-(--color-text-light)" style={{ fontFamily: F }}>{bar.label}</span>
              <span className="text-[11px] font-semibold" style={{ color: bar.color, fontFamily: F }}>{bar.value}</span>
            </div>
            <div className="h-[3px] bg-(--color-border-light) rounded-[2px] overflow-hidden">
              <div style={{ height: '100%', width: `${bar.value * 10}%`, background: bar.color, borderRadius: '2px', transition: 'width 1.2s cubic-bezier(.22,1,.36,1)' }} />
            </div>
          </div>
        ))}
      </div>

      {/* Footer stat */}
      <div className="mt-[18px] pt-4 border-t border-(--color-border-light) flex justify-between items-center">
        <span className="text-[11px] text-(--color-text-light)" style={{ fontFamily: F }}>Topluluk değerlendirmesi</span>
        <div className="flex gap-[2px]">
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
      <div className="inline-flex items-center gap-2 mb-7">
        <div className="w-5 h-px bg-(--color-gold)" />
        <span className="text-[11px] font-semibold text-(--color-gold) tracking-[.12em] uppercase" style={{ fontFamily: F }}>
          Muadilci
        </span>
      </div>

      {/* Headline — Cormorant Garamond, editorial weight */}
      <h1
        className="font-normal text-(--color-text) leading-[1.05] tracking-[-0.01em] mb-6"
        style={{
          fontFamily: FH,
          fontSize: 'clamp(44px, 5.5vw, 80px)',
        }}
      >
        Lüks kokuyu,<br />
        <em className="text-(--color-gold) italic">en yakın</em><br />
        muadiliyle keşfet.
      </h1>

      {/* Subtext */}
      <p className="text-[16px] text-(--color-text-mid) leading-[1.75] mb-9 max-w-[400px] font-normal" style={{ fontFamily: F }}>
        Chanel, Dior, Tom Ford ve daha fazlasının orijinaline en yakın muadillerini bul. Gerçek kullanıcı yorumlarıyla karşılaştır.
      </p>

      {/* CTA buttons */}
      <div className="flex gap-3 flex-wrap mb-[52px]">
        <button
          onClick={() => navigate('/karsilastir')}
          className="bg-(--color-text) border-none rounded-[8px] px-7 py-[13px] text-white text-[14px] font-semibold cursor-pointer tracking-[.01em] transition-[background,transform] duration-200"
          style={{ fontFamily: F }}
          onMouseEnter={e => { e.currentTarget.style.background = C.gold; e.currentTarget.style.transform = 'translateY(-1px)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = C.text; e.currentTarget.style.transform = 'none'; }}
        >
          Karşılaştırmaya Başla
        </button>
        <button
          onClick={() => navigate('/parfumler?tab=muadil&sort=score_desc')}
          className="group inline-flex items-center gap-2 bg-transparent border border-(--color-border) rounded-[8px] px-7 py-[13px] text-(--color-text-mid) text-[14px] font-medium cursor-pointer tracking-[.01em] transition-[border-color,color] duration-200"
          style={{ fontFamily: F }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = C.text; e.currentTarget.style.color = C.text; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.textMid; }}
        >
          Muadil Parfüm Listesine Git
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" className="transition-transform duration-200 group-hover:translate-x-1">
            <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      {/* Stats row */}
      <div className="flex gap-9 flex-wrap">
        {stats.map(({ n, l }) => (
          <div key={l}>
            <div className="text-[32px] font-medium text-(--color-text) leading-none tracking-[-0.02em]" style={{ fontFamily: FH }}>{n}+</div>
            <div className="text-[12px] text-(--color-text-light) mt-1 tracking-[.02em]" style={{ fontFamily: F }}>{l}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Reusable hero pieces (slider + yükleme iskeleti ortak kullanır) ──── */
const MARQUEE_TEXT = 'Türkiye\'nin ilk ve tek orijinal — muadil parfüm kıyaslama platformu';

function HeroMarquee({ reverse = false }) {
  return (
    <div className={`absolute ${reverse ? 'bottom-0 border-t' : 'top-0 border-b'} left-0 right-0 z-[6] py-[10px] border-[rgba(184,147,90,0.2)] bg-[rgba(0,0,0,0.25)] backdrop-blur-[6px] overflow-hidden whitespace-nowrap`}>
      <div className="inline-block" style={{ animation: `${reverse ? 'heroMarqueeReverse' : 'heroMarquee'} 22s linear infinite` }}>
        {Array(6).fill(MARQUEE_TEXT).map((t, i) => (
          <span key={i} className="text-[11px] font-medium text-white/55 tracking-[0.18em] uppercase mr-16" style={{ fontFamily: F }}>
            <span className="text-(--color-gold) mr-16">✦</span>{t}
          </span>
        ))}
      </div>
    </div>
  );
}

function HeroOverlay({ navigate, lg }) {
  return (
    <div className="absolute inset-0 flex items-center" style={{ padding: lg ? '52px 28px' : '52px 80px' }}>
      <div className="w-full max-w-[600px]">
        {/* Eyebrow */}
        <div className="inline-flex items-center gap-2 mb-6">
          <div className="w-5 h-px bg-(--color-gold)" />
          <span className="text-[11px] font-semibold text-(--color-gold) tracking-[.12em] uppercase" style={{ fontFamily: F }}>Muadilci</span>
        </div>
        <h1
          className="font-normal text-white leading-[1.05] tracking-[-0.01em] mb-5"
          style={{ fontFamily: FH, fontSize: 'clamp(40px, 5vw, 72px)' }}
        >
          Lüks kokuyu,<br /><em className="text-(--color-gold) italic">en yakın</em><br />muadiliyle keşfet.
        </h1>
        <p className="text-[16px] text-white/65 leading-[1.7] mb-8 max-w-[420px]" style={{ fontFamily: F }}>
          Chanel, Dior, Tom Ford ve daha fazlasının orijinaline en yakın muadillerini bul.
        </p>
        <div className="flex gap-3 flex-wrap">
          <button
            onClick={() => navigate('/karsilastir')}
            className="bg-(--color-gold) border-none rounded-[8px] px-7 py-[13px] text-white text-[14px] font-semibold cursor-pointer transition-[background] duration-200"
            style={{ fontFamily: F }}
            onMouseEnter={e => e.currentTarget.style.background = C.goldDeep}
            onMouseLeave={e => e.currentTarget.style.background = C.gold}
          >
            Karşılaştırmaya Başla
          </button>
          <button
            onClick={() => navigate('/parfumler?tab=muadil&sort=score_desc')}
            className="group inline-flex items-center gap-2 bg-white/10 border border-white/25 rounded-[8px] px-7 py-[13px] text-white text-[14px] font-medium cursor-pointer transition-[background,border-color] duration-200"
            style={{ fontFamily: F }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,.2)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,.4)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,.1)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,.25)'; }}
          >
            Muadil Parfüm Listesine Git
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" className="transition-transform duration-200 group-hover:translate-x-1">
              <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

function HeroLuxuryFrame() {
  return (
    <div className="absolute inset-[18px] z-[5] pointer-events-none">
      {/* Inner border */}
      <div className="absolute inset-0 border border-[rgba(184,147,90,0.25)] rounded-[2px]" />

      {/* Corner TL */}
      <div className="absolute top-[-1px] left-[-1px]">
        <div className="absolute top-0 left-0 w-10 h-[1.5px] bg-(--color-gold)" />
        <div className="absolute top-0 left-0 w-[1.5px] h-10 bg-(--color-gold)" />
      </div>
      {/* Corner TR */}
      <div className="absolute top-[-1px] right-[-1px]">
        <div className="absolute top-0 right-0 w-10 h-[1.5px] bg-(--color-gold)" />
        <div className="absolute top-0 right-0 w-[1.5px] h-10 bg-(--color-gold)" />
      </div>
      {/* Corner BL */}
      <div className="absolute bottom-[-1px] left-[-1px]">
        <div className="absolute bottom-0 left-0 w-10 h-[1.5px] bg-(--color-gold)" />
        <div className="absolute bottom-0 left-0 w-[1.5px] h-10 bg-(--color-gold)" />
      </div>
      {/* Corner BR */}
      <div className="absolute bottom-[-1px] right-[-1px]">
        <div className="absolute bottom-0 right-0 w-10 h-[1.5px] bg-(--color-gold)" />
        <div className="absolute bottom-0 right-0 w-[1.5px] h-10 bg-(--color-gold)" />
      </div>

      {/* Mid-side ornaments */}
      <div className="absolute top-1/2 left-[-1px] -translate-y-1/2 flex flex-col items-center gap-1">
        <div className="w-[1.5px] h-5 bg-[rgba(184,147,90,0.4)]" />
        <div className="w-1 h-1 rounded-full bg-(--color-gold) opacity-70" />
        <div className="w-[1.5px] h-5 bg-[rgba(184,147,90,0.4)]" />
      </div>
      <div className="absolute top-1/2 right-[-1px] -translate-y-1/2 flex flex-col items-center gap-1">
        <div className="w-[1.5px] h-5 bg-[rgba(184,147,90,0.4)]" />
        <div className="w-1 h-1 rounded-full bg-(--color-gold) opacity-70" />
        <div className="w-[1.5px] h-5 bg-[rgba(184,147,90,0.4)]" />
      </div>
      <div className="absolute left-1/2 top-[-1px] -translate-x-1/2 flex items-center gap-1">
        <div className="h-[1.5px] w-5 bg-[rgba(184,147,90,0.4)]" />
        <div className="w-1 h-1 rounded-full bg-(--color-gold) opacity-70" />
        <div className="h-[1.5px] w-5 bg-[rgba(184,147,90,0.4)]" />
      </div>
      <div className="absolute left-1/2 bottom-[-1px] -translate-x-1/2 flex items-center gap-1">
        <div className="h-[1.5px] w-5 bg-[rgba(184,147,90,0.4)]" />
        <div className="w-1 h-1 rounded-full bg-(--color-gold) opacity-70" />
        <div className="h-[1.5px] w-5 bg-[rgba(184,147,90,0.4)]" />
      </div>
    </div>
  );
}

/* ── Main HeroSection ────────────────────────────────────────────────── */
export function HeroSection() {
  const { navigate } = useRouter();
  const { sliderImages, brands, perfumes, muadilPerfumes, loading } = useData();
  const { lg, xs } = useW();

  const [current, setCurrent] = useState(0);
  const [paused,  setPaused]  = useState(false);

  // Önceki ziyaretten önbelleğe alınan slider URL'si — Firebase gelmeden önce preload başlatır
  const [cachedHeroUrl] = useState(() => {
    try { return localStorage.getItem('hero-slide-0') || null; } catch { return null; }
  });

  // Firebase'den gelen URL'yi önbelleğe al + <link rel="preload"> ile yüklemeyi öne çek
  useEffect(() => {
    const firstSrc = sliderImages[0]?.src;
    if (!firstSrc) return;
    try { localStorage.setItem('hero-slide-0', firstSrc); } catch {}
    // Daha önce eklenmemişse preload link ekle
    if (!document.querySelector(`link[data-hero-preload]`)) {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = firstSrc;
      link.setAttribute('data-hero-preload', '1');
      document.head.appendChild(link);
    }
  }, [sliderImages[0]?.src]);

  // Önbellek URL'si varsa tarayıcıya hemen preload başlat (Firebase gelmeden önce)
  useEffect(() => {
    if (!cachedHeroUrl) return;
    if (document.querySelector(`link[data-hero-preload]`)) return;
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = cachedHeroUrl;
    link.setAttribute('data-hero-preload', '1');
    document.head.appendChild(link);
  }, []);

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

  // İlk boyamada render edilecek slide'lar: gerçek slider verisi henüz gelmediyse
  // ama önbellekte URL varsa, hero'yu hemen o görselle göster (boş kalmasın, pop etmesin).
  // Firebase cevabı gelince visibleSlides devreye girer ve sorunsuzca yerini alır.
  const usingCachedFallback = total === 0 && !!cachedHeroUrl;
  const renderSlides = total > 0
    ? visibleSlides
    : (usingCachedFallback ? [{ id: '__cached__', src: cachedHeroUrl, name: '' }] : []);
  const renderTotal = renderSlides.length;

  // Render edilecek görsel yok ama veri hâlâ yükleniyor → hero'nun yerini BOŞ bırakma.
  // Slider ile birebir aynı boyutta koyu bir iskelet göster: statik başlık/butonlar
  // anında görünür, sadece arka plan görseli Firebase'den gelince yerine oturur.
  // Böylece "Nasıl Çalışır" yukarı zıplamaz ve slider sıçramadan açılır.
  if (renderTotal === 0 && loading) {
    return (
      <section
        className="relative overflow-hidden bg-[#0a0806]"
        style={{ height: lg ? '65vh' : 'calc(100vh - 192px)', minHeight: '520px' }}
        aria-busy="true"
      >
        {/* Slider overlay'i ile aynı koyu gradyan — görsel gelince kusursuz devreder */}
        <div className="absolute inset-0 bg-[linear-gradient(100deg,rgba(10,8,6,.95)_0%,rgba(28,22,16,.95)_55%,rgba(10,8,6,.7)_100%)]" />
        {/* İnce altın shimmer: yüklenme sinyali */}
        <div
          className="absolute inset-0 opacity-60"
          style={{
            background: 'linear-gradient(100deg, transparent 0%, rgba(184,147,90,.07) 45%, rgba(184,147,90,.07) 55%, transparent 100%)',
            backgroundSize: '1200px 100%',
            animation: 'shimmer 2s linear infinite',
          }}
        />
        <HeroMarquee />
        <HeroOverlay navigate={navigate} lg={lg} />
        <HeroMarquee reverse />
        <HeroLuxuryFrame />
      </section>
    );
  }

  /* No slider images → editorial two-column layout */
  if (renderTotal === 0) {
    return (
      <section
        className="bg-(--color-bg) border-b border-(--color-border-light)"
        style={{ padding: lg ? '60px 20px 72px' : '80px 48px 96px' }}
      >
        <div
          className="max-w-[1200px] mx-auto items-center"
          style={{
            display: 'grid',
            gridTemplateColumns: lg ? '1fr' : '1fr 1fr',
            gap: '64px',
          }}
        >
          <HeroText navigate={navigate} brands={brands} perfumes={perfumes} muadilPerfumes={muadilPerfumes} />
          {!lg && (
            <div className="flex justify-center" style={{ animation: 'fadeUp 0.9s 0.2s cubic-bezier(.22,1,.36,1) both' }}>
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
      className="relative overflow-hidden"
      style={{ height: lg ? '65vh' : 'calc(100vh - 192px)', minHeight: '520px' }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Top horizontal marquee strip */}
      <HeroMarquee />

      {/* Slides */}
      <div
        className="flex w-full h-full"
        style={{ transform: `translateX(-${current * 100}%)`, transition: 'transform .6s cubic-bezier(.4,0,.2,1)', willChange: 'transform' }}
      >
        {renderSlides.map((img, i) => (
          <div key={img.id} className="relative shrink-0 w-screen min-w-[100vw] h-full overflow-hidden">
            <img
              src={img.src}
              alt={img.name}
              className="absolute inset-0 w-full h-full object-cover"
              fetchpriority={i === 0 ? 'high' : 'low'}
              loading={i === 0 ? 'eager' : 'lazy'}
            />
            {/* Overlay — editorial: gradient from left dark, right lighter */}
            <div className="absolute inset-0 bg-[linear-gradient(100deg,rgba(10,8,6,.88)_0%,rgba(10,8,6,.55)_55%,rgba(10,8,6,.15)_100%)]" />
            {i === 0 && <HeroOverlay navigate={navigate} lg={lg} />}
          </div>
        ))}
      </div>

      {/* Bottom horizontal marquee strip */}
      <HeroMarquee reverse />

      {/* Arrows */}
      {total > 1 && ['prev','next'].map(dir => (
        <button
          key={dir}
          onClick={dir === 'prev' ? prev : next}
          className="absolute top-1/2 -translate-y-1/2 z-[4] w-10 h-10 rounded-full bg-white/10 border border-white/20 text-white cursor-pointer flex items-center justify-center backdrop-blur-[4px] transition-[background] duration-200"
          style={{ [dir === 'prev' ? 'left' : 'right']: '20px' }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,.2)'}
          onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,.1)'}
        >
          <svg width="16" height="16" fill="none" stroke="#fff" strokeWidth="1.5" viewBox="0 0 24 24"><path d={dir === 'prev' ? 'M15 18l-6-6 6-6' : 'M9 18l6-6-6-6'} /></svg>
        </button>
      ))}

      {/* Dots */}
      {total > 1 && (
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-[4] flex gap-2">
          {visibleSlides.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className="h-[6px] rounded-[3px] border-none cursor-pointer p-0 transition-all duration-300"
              style={{ width: i === current ? '20px' : '6px', background: i === current ? C.gold : 'rgba(255,255,255,.4)' }}
            />
          ))}
        </div>
      )}

      {/* Luxury frame overlay */}
      <HeroLuxuryFrame />
    </section>
  );
}
