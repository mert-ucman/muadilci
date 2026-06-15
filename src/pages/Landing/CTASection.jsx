import { useEffect, useRef } from 'react';
import { useRouter } from '@/contexts/RouterContext';
import { useW } from '@/hooks/useW';
import { useData } from '@/contexts/DataContext';

const CTA_FALLBACK_IMG = 'https://images.unsplash.com/photo-1585386959984-a4155224a1ad?w=1600&q=80';
import { C, F, FH } from '@/constants/theme';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export function CTASection() {
  const { navigate } = useRouter();
  const { sm } = useW();
  const { landingImages } = useData();
  const ctaBgSrc = landingImages?.ctaBg || CTA_FALLBACK_IMG;
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
      <div className="relative h-[320px] overflow-hidden">
        <img
          src={ctaBgSrc}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
          onError={e => (e.target.style.display = 'none')}
        />
        {/* Dark editorial overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(8,6,4,.9)_0%,rgba(8,6,4,.65)_50%,rgba(8,6,4,.3)_100%)]" />

        <div
          className="absolute inset-0 flex items-center"
          style={{ padding: sm ? '0 20px' : '0 10%' }}
        >
          <div className="sr">
            <div className="inline-flex items-center gap-2 mb-[18px]">
              <div className="w-5 h-px bg-(--color-gold)" />
              <span className="text-[11px] font-semibold text-(--color-gold) tracking-[.12em] uppercase" style={{ fontFamily: F }}>Muadilci</span>
            </div>
            <h2 className="text-[clamp(28px,3.5vw,52px)] font-light text-white leading-[1.1] tracking-[-0.01em] mb-4" style={{ fontFamily: FH }}>
              Koku dünyasını<br /><em className="italic text-(--color-gold)">demokratize ediyoruz.</em>
            </h2>
            <p className="text-[15px] text-white/60 max-w-[400px] leading-[1.7]" style={{ fontFamily: F }}>
              Orijinale en yakın muadili bul. Muadilci topluluğu sana en iyi alternatifleri bulduruyor.
            </p>
          </div>
        </div>
      </div>

      {/* CTA block — warm cream */}
      <div
        className="bg-(--color-gold-bg) border-t border-(--color-gold-border) text-center"
        style={{ padding: sm ? '64px 20px' : '88px 48px' }}
      >
        <div className="max-w-[560px] mx-auto">
          <div className="cta-anim inline-flex items-center gap-2 mb-6">
            <div className="w-5 h-px bg-(--color-gold)" />
            <span className="text-[11px] font-semibold text-(--color-gold) tracking-[.12em] uppercase" style={{ fontFamily: F }}>Ücretsiz</span>
            <div className="w-5 h-px bg-(--color-gold)" />
          </div>

          <h2 className="cta-anim text-[clamp(28px,4vw,52px)] font-light text-(--color-text) leading-[1.1] tracking-[-0.01em] mb-4" style={{ fontFamily: FH }}>
            Koku yolculuğuna<br /><em className="italic text-(--color-gold)">bugün başla.</em>
          </h2>

          <p className="cta-anim text-(--color-text-mid) text-[15px] leading-[1.75] mb-9" style={{ fontFamily: F }}>
            Ücretsiz üye ol, yüzlerce muadil eşleşmesine eriş, yorum yap, en iyi ve en yüksek puanlı markaları ve muadil parfümü bul.
          </p>

          <div className="cta-anim flex gap-3 justify-center flex-wrap">
            <button
              onClick={() => navigate('/kayit')}
              className="bg-(--color-text) border-none rounded-[8px] px-9 py-[14px] text-white text-[14px] font-semibold cursor-pointer transition-[background,transform] duration-200"
              style={{ fontFamily: F }}
              onMouseEnter={e => { e.currentTarget.style.background = C.gold; e.currentTarget.style.transform = 'translateY(-1px)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = C.text; e.currentTarget.style.transform = 'none'; }}
            >
              Ücretsiz Üye Ol
            </button>
            <button
              onClick={() => navigate('/karsilastir')}
              className="bg-transparent border border-(--color-gold-border) rounded-[8px] px-9 py-[14px] text-(--color-text-mid) text-[14px] font-medium cursor-pointer transition-[border-color,color] duration-200"
              style={{ fontFamily: F }}
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
