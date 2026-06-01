import { useRouter } from '@/contexts/RouterContext';
import { C, FH } from '@/constants/theme';
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
    <div style={{
      minHeight: '100vh',
      background: C.bg,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 24px',
    }}>
      <div style={{
        display: 'flex',
        width: '100%',
        maxWidth: '920px',
        borderRadius: '24px',
        overflow: 'hidden',
        boxShadow: '0 24px 64px rgba(0,0,0,0.13)',
      }}>

        {/* ── Sol panel: görsel ─────────────────────────────────────── */}
        {!lg && (
          <div style={{
            width: '400px',
            minHeight: '560px',
            flexShrink: 0,
            position: 'relative',
            backgroundImage: `url(${bgImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center top',
          }}>
            {/* karartma gradyanı */}
            <div style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(170deg, rgba(15,10,5,0.18) 0%, rgba(18,12,4,0.80) 65%)',
            }} />

            {/* metin */}
            <div style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              padding: '40px 36px',
            }}>

              <h2 style={{
                fontFamily: FH,
                fontSize: '30px',
                fontWeight: 400,
                color: '#fff',
                lineHeight: 1.32,
                marginBottom: '18px',
                letterSpacing: '-0.01em',
              }}>
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

        {/* ── Sağ panel: form ───────────────────────────────────────── */}
        <div style={{
          flex: 1,
          background: '#FAFAF8',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: lg ? '40px 28px' : '40px 44px',
          position: 'relative',
        }}>
          {/* Ana sayfa butonu */}
          <button
            onClick={() => navigate('/')}
            style={{
              position: 'absolute', top: '18px', left: '18px',
              display: 'flex', alignItems: 'center', gap: '6px',
              background: 'none', border: `1px solid ${C.border}`,
              borderRadius: '8px', padding: '6px 12px',
              fontSize: '12px', color: C.textMid, cursor: 'pointer',
              fontFamily: 'Nunito, sans-serif', fontWeight: 600,
              transition: 'color 0.2s, border-color 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.color = C.gold; e.currentTarget.style.borderColor = C.gold; }}
            onMouseLeave={e => { e.currentTarget.style.color = C.textMid; e.currentTarget.style.borderColor = C.border; }}
          >
            <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M19 12H5M12 5l-7 7 7 7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Ana Sayfa
          </button>

          <div
            onClick={() => navigate('/')}
            style={{ cursor: 'pointer', marginBottom: '24px' }}
          >
            <img
              src={logoDark}
              alt="muadilci"
              style={{ height: '72px', objectFit: 'contain', display: 'block' }}
            />
          </div>

          <div style={{ width: '100%', maxWidth: '360px' }}>
            <h1 style={{
              fontSize: '22px', fontWeight: 900, color: C.navy,
              marginBottom: '6px', textAlign: 'center',
            }}>
              {title}
            </h1>
            <p style={{
              color: C.textLight, fontSize: '13px',
              textAlign: 'center', marginBottom: '24px',
            }}>
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
      style={{
        width: '100%', border: `1px solid ${C.border}`, borderRadius: '10px',
        padding: '11px', background: loading ? '#f5f5f5' : C.card,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        gap: '10px', fontSize: '14px', fontWeight: 600, color: C.text,
        cursor: loading ? 'not-allowed' : 'pointer',
        fontFamily: 'Nunito,sans-serif', marginBottom: '14px',
        opacity: loading ? 0.7 : 1,
      }}
      onMouseEnter={(e) => !loading && (e.currentTarget.style.background = '#f9f9f9')}
      onMouseLeave={(e) => !loading && (e.currentTarget.style.background = C.card)}
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
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '14px 0' }}>
      <div style={{ flex: 1, height: '1px', background: C.border }} />
      <span style={{ fontSize: '12px', color: C.textLight, fontWeight: 500 }}>VEYA</span>
      <div style={{ flex: 1, height: '1px', background: C.border }} />
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
