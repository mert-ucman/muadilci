import { useEffect, useRef, useState } from 'react';
import { useW } from '@/hooks/useW';
import { useData } from '@/contexts/DataContext';
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
    text: "Dior'un muadillerini bulmak için biçilmiş kaftan. Koleksiyonum için orijinali, günlük kullanım için muadili tercih ediyorum.",
    index: '03',
  },
];

function Stars({ rating, light }) {
  return (
    <div className="flex gap-1">
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
  const { xs } = useW();

  return (
    <div
      ref={cardRef}
      className={`sr sr-d${i + 1} relative rounded-[20px] flex flex-col overflow-hidden transition-[background,border-color] duration-[400ms] cursor-default`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? 'rgba(184,147,90,.06)' : 'rgba(255,255,255,.03)',
        border: `1px solid ${hovered ? 'rgba(184,147,90,.35)' : 'rgba(255,255,255,.08)'}`,
        padding: xs ? '24px 20px 20px' : '48px 40px 40px',
        gap: '0',
      }}
    >
      {/* Large index number — shrinks on hover */}
      <div
        className="absolute top-[-12px] right-6 font-extralight leading-none select-none tracking-[-0.04em] text-[100px] pointer-events-none transition-[transform,color] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]"
        style={{
          fontFamily: FH,
          color: hovered ? 'rgba(184,147,90,.2)' : 'rgba(255,255,255,.06)',
          transform: hovered ? 'scale(0.56)' : 'scale(1)',
          transformOrigin: 'top right',
        }}
      >
        {t.index}
      </div>

      {/* Stars */}
      <div style={{ marginBottom: xs ? '12px' : '28px' }}>
        <Stars rating={t.rating} />
      </div>

      {/* Decorative quote — large on idle, smaller on hover */}
      {!xs && (
        <div
          className="leading-[0.7] select-none transition-[transform,color] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] mb-5 text-[80px]"
          style={{
            fontFamily: FH,
            color: hovered ? C.gold : 'rgba(255,255,255,.08)',
            transform: hovered ? 'scale(0.6)' : 'scale(1)',
            transformOrigin: 'left center',
          }}
        >
          "
        </div>
      )}

      {/* Text */}
      <p
        className="leading-[1.7] font-light italic grow transition-colors duration-[400ms]"
        style={{
          fontSize: xs ? '13px' : '14px',
          color: hovered ? 'rgba(255,255,255,.85)' : 'rgba(255,255,255,.45)',
          fontFamily: F,
          marginBottom: xs ? '16px' : '32px',
        }}
      >
        {t.text}
      </p>

      {/* Bottom line — animates on hover */}
      <div
        className="h-px transition-[background] duration-500"
        style={{
          background: hovered ? `linear-gradient(to right, ${C.gold}, transparent)` : 'rgba(255,255,255,.08)',
          marginBottom: xs ? '12px' : '24px',
        }}
      />

      {/* Author */}
      <div className="flex items-center gap-[14px]">
        <div
          className="w-[38px] h-[38px] rounded-full flex items-center justify-center text-[14px] font-semibold shrink-0 transition-[background,color,border-color] duration-[400ms]"
          style={{
            background: hovered ? C.gold : 'rgba(255,255,255,.1)',
            border: `1px solid ${hovered ? C.gold : 'rgba(255,255,255,.15)'}`,
            color: hovered ? '#fff' : 'rgba(255,255,255,.6)',
            fontFamily: FH,
          }}
        >
          {/* Harf doğrudan flex div'de olursa text-box-trim çalışmaz; span ile sar */}
          <span className="cap-center">{t.av}</span>
        </div>
        <div>
          <div
            className="font-medium text-[14px] transition-colors duration-300"
            style={{ color: hovered ? '#fff' : 'rgba(255,255,255,.7)', fontFamily: F }}
          >
            {t.name}
          </div>
          <div
            className="text-[11px] tracking-[.04em] mt-[2px] transition-colors duration-300"
            style={{ color: hovered ? C.gold : 'rgba(255,255,255,.3)', fontFamily: F }}
          >
            {t.role}
          </div>
        </div>
      </div>

      {/* Hover glow corner */}
      <div
        className="absolute bottom-0 right-0 rounded-[0_0_20px_0] pointer-events-none transition-[width,height] duration-[600ms] ease-[cubic-bezier(0.16,1,0.3,1)]"
        style={{
          width: hovered ? '140px' : '0px',
          height: hovered ? '140px' : '0px',
          background: 'radial-gradient(circle at bottom right, rgba(184,147,90,.15) 0%, transparent 70%)',
        }}
      />
    </div>
  );
}

export function TestimonialsSection() {
  const { sm, xs } = useW();
  const { landingImages } = useData();
  const testimonialsBgSrc = landingImages?.testimonialsBg || null;
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
      className="bg-(--color-text) overflow-hidden border-b border-white/[.06] relative"
    >
      {/* Full-section leaf background */}
      {testimonialsBgSrc && <img
        src={testimonialsBgSrc}
        alt=""
        aria-hidden="true"
        className="absolute inset-0 w-full h-full object-cover object-center pointer-events-none select-none z-0"
        style={{ opacity: 0.08, filter: 'grayscale(30%)' }}
      />}

      {/* Atmospheric glow */}
      <div className="absolute inset-0 pointer-events-none z-[1] bg-[radial-gradient(ellipse_60%_40%_at_20%_60%,rgba(184,147,90,.05)_0%,transparent_70%)]" />

      {/* ── Scrolling marquee strip ── */}
      <div className="border-b border-white/[.06] py-[14px] overflow-hidden whitespace-nowrap relative z-[2]">
        <div ref={marqueeRef} className="inline-block">
          {marqueeText.map((txt, i) => (
            <span
              key={i}
              className="text-[11px] font-bold text-white/45 tracking-[.22em] uppercase"
              style={{ fontFamily: F }}
            >
              {txt}
            </span>
          ))}
          {/* Duplicate for seamless loop */}
          {marqueeText.map((txt, i) => (
            <span
              key={`b${i}`}
              className="text-[11px] font-bold text-white/45 tracking-[.22em] uppercase"
              style={{ fontFamily: F }}
            >
              {txt}
            </span>
          ))}
        </div>
      </div>

      {/* ── Main content ── */}
      <div
        className="max-w-[1400px] mx-auto relative z-[2]"
        style={{
          display: 'grid',
          gridTemplateColumns: xs || sm ? '1fr' : '80px 1fr',
        }}
      >

        {/* Left vertical text strip */}
        {!xs && !sm && (
          <div className="flex items-center justify-center border-r border-white/[.06]">
            <div
              className="whitespace-nowrap text-[10px] font-bold text-white/[.18] tracking-[.25em] uppercase select-none"
              style={{ transform: 'rotate(-90deg)', fontFamily: F }}
            >
              KULLANICI DENEYİMLERİ — MUADILCI
            </div>
          </div>
        )}

        <div style={{ padding: xs || sm ? '64px 20px' : '88px 64px' }}>

          {/* Header */}
          <div className="sr mb-[72px]">
            <div className="inline-flex items-center gap-[10px] mb-6">
              <div className="w-7 h-px bg-(--color-gold)" />
              <span
                className="text-[10px] font-bold text-(--color-gold) tracking-[.2em] uppercase"
                style={{ fontFamily: F }}
              >
                Kullanıcıların Söyledikleri
              </span>
            </div>

            <h2
              ref={headingRef}
              className="font-light text-white leading-[1.0] tracking-[-0.02em] m-0"
              style={{
                fontFamily: FH,
                fontSize: xs ? '52px' : sm ? '64px' : 'clamp(64px, 6vw, 96px)',
              }}
            >
              Gerçek<br />
              kullanıcılar,<br />
              <em className="italic text-(--color-gold) font-normal">
                gerçek<br />deneyimler.
              </em>
            </h2>
          </div>

          {/* Cards grid */}
          <div
            className="grid gap-4"
            style={{
              gridTemplateColumns: xs ? '1fr' : sm ? '1fr 1fr' : 'repeat(3, 1fr)',
            }}
          >
            {TESTIMONIALS.map((t, i) => (
              <TestimonialCard key={t.name} t={t} i={i} />
            ))}
          </div>

          {/* Bottom decorative line */}
          <div className="sr mt-16 flex items-center gap-6">
            <div className="flex-1 h-px bg-white/[.08]" />
            <span
              className="text-[10px] font-bold text-white/20 tracking-[.2em] uppercase"
              style={{ fontFamily: F }}
            >
              Muadilci Topluluğu
            </span>
            <div className="flex-1 h-px bg-white/[.08]" />
          </div>
        </div>
      </div>
    </section>
  );
}
