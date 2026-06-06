import { useRouter } from '@/contexts/RouterContext';
import { FH } from '@/constants/theme';
import { useSeo } from '@/lib/seo';
import { useW } from '@/hooks/useW';
import logoDark from '@/img/logos/logo-dark-minified.png';
import loginBg from '@/img/login page.png';
import signUpBg from '@/img/sign-up.png';

export { loginBg, signUpBg };

const GOLD = 'rgb(184,147,90)';

const DEFAULT_HEADLINE = (
  <>Kokuların<br /><em style={{ color: GOLD, fontStyle: 'italic' }}>Zarif</em> Dünyasına<br />Hoş Geldiniz</>
);

export function AuthLayout({ title, subtitle, children, bgImage = loginBg, headline = DEFAULT_HEADLINE }) {
  const { navigate } = useRouter();
  const { lg } = useW();
  useSeo({ title: title || 'Hesap', noindex: true });

  return (
    <div className="min-h-screen bg-(--color-bg) flex items-center justify-center px-6 py-10">
      <div className="flex w-full max-w-[920px] rounded-3xl overflow-hidden shadow-[0_24px_64px_rgba(0,0,0,0.13)]">

        {/* Left panel: visual */}
        {!lg && (
          <div
            className="w-[400px] min-h-[560px] shrink-0 relative bg-cover bg-[center_top]"
            style={{ backgroundImage: `url(${bgImage})` }}
          >
            {/* Darkening gradient */}
            <div className="absolute inset-0" style={{ background: 'linear-gradient(170deg, rgba(15,10,5,0.18) 0%, rgba(18,12,4,0.80) 65%)' }} />

            {/* Text */}
            <div className="absolute bottom-0 left-0 right-0 p-10" style={{ padding: '40px 36px' }}>
              <h2
                style={{
                  fontFamily: FH,
                  fontSize: '30px',
                  fontWeight: 400,
                  color: '#fff',
                  lineHeight: 1.32,
                  marginBottom: '18px',
                  letterSpacing: '-0.01em',
                }}
              >
                {headline}
              </h2>
              <p style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: '12.5px',
                fontWeight: 300,
                color: 'rgba(255,255,255,0.58)',
                lineHeight: 1.85,
                letterSpacing: '0.02em',
              }}>
                Dünya'nın lüks parfüm muadillerini<br />
                keşfet, karşılaştır ve en iyisini bul.
              </p>
            </div>
          </div>
        )}

        {/* Right panel: form */}
        <div
          className="flex-1 bg-[#FAFAF8] flex flex-col items-center justify-center relative"
          style={{ padding: lg ? '40px 28px' : '40px 44px' }}
        >
          {/* Home button */}
          <button
            onClick={() => navigate('/')}
            className="absolute top-[18px] left-[18px] flex items-center gap-[6px] bg-transparent border border-(--color-border) rounded-lg px-3 py-[6px] text-[12px] text-(--color-text-mid) cursor-pointer font-semibold transition-[color,border-color] duration-200 hover:text-(--color-gold) hover:border-(--color-gold)"
            style={{ fontFamily: 'Nunito, sans-serif' }}
          >
            <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M19 12H5M12 5l-7 7 7 7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Ana Sayfa
          </button>

          <div
            onClick={() => navigate('/')}
            className="cursor-pointer mb-6"
          >
            <img
              src={logoDark}
              alt="muadilci"
              className="h-[72px] object-contain block"
            />
          </div>

          <div className="w-full max-w-[360px]">
            <h1 className="text-[22px] font-black text-(--color-navy) mb-[6px] text-center">
              {title}
            </h1>
            <p className="text-(--color-text-light) text-[13px] text-center mb-6">
              {subtitle}
            </p>
            {children}
          </div>
        </div>

      </div>
    </div>
  );
}

export function GoogleBtn({ label, onClick, loading }) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="w-full border border-(--color-border) rounded-[10px] py-[11px] flex items-center justify-center gap-[10px] text-[14px] font-semibold text-(--color-text) cursor-pointer mb-[14px] transition-[background,opacity] duration-150 disabled:cursor-not-allowed"
      style={{
        background: loading ? '#f5f5f5' : 'var(--color-card)',
        opacity: loading ? 0.7 : 1,
        fontFamily: 'Nunito,sans-serif',
      }}
      onMouseEnter={(e) => !loading && (e.currentTarget.style.background = '#f9f9f9')}
      onMouseLeave={(e) => !loading && (e.currentTarget.style.background = 'var(--color-card)')}
    >
      <svg width="18" height="18" viewBox="0 0 24 24">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
      </svg>
      {loading ? 'Yükleniyor...' : label}
    </button>
  );
}

export function Divider() {
  return (
    <div className="flex items-center gap-3 my-[14px]">
      <div className="flex-1 h-px bg-(--color-border)" />
      <span className="text-[12px] text-(--color-text-light) font-medium">VEYA</span>
      <div className="flex-1 h-px bg-(--color-border)" />
    </div>
  );
}

export function EyeIcon({ open }) {
  return (
    <svg width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      {open
        ? <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></>
        : <><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></>
      }
    </svg>
  );
}
