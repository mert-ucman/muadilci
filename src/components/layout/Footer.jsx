import { useRouter } from '@/contexts/RouterContext';
import { useW } from '@/hooks/useW';
import { C, F } from '@/constants/theme';
import logoDark from '@/img/logos/logo-dark-minified.png';

export function Footer() {
  const { navigate } = useRouter();
  const { sm, xs } = useW();

  const navLinks = [
    { label: 'Parfümler', path: '/parfumler' },
    { label: 'Markalar', path: '/markalar' },
    { label: 'Karşılaştır', path: '/karsilastir' },
    { label: 'En İyiler', path: '/en-iyiler' },
  ];

  const legalLinks = ['Gizlilik Politikası', 'Kullanım Koşulları', 'İletişim'];

  return (
    <footer style={{ background: C.navy, fontFamily: F }}>
      <div style={{ height: '3px', background: `linear-gradient(90deg,${C.gold},${C.goldLight},${C.gold})` }} />

      <div style={{ maxWidth: '1320px', margin: '0 auto', padding: xs ? '40px 16px 32px' : sm ? '48px 20px 32px' : '56px 32px 36px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: xs ? '1fr' : sm ? '1fr 1fr' : '1.8fr 1fr 1fr', gap: xs ? '36px' : '48px', marginBottom: '48px' }}>

          {/* Logo + Tagline */}
          <div>
            <div style={{ cursor: 'pointer', marginBottom: '14px' }} onClick={() => navigate('/')}>
              <img src={logoDark} alt="muadilci" style={{ height: '48px', width: 'auto', display: 'block' }} />
            </div>
            <p style={{ fontSize: '13px', color: 'rgba(255,255,255,.45)', lineHeight: 1.7, margin: 0, maxWidth: '260px' }}>
              Türkiye'nin lüks parfüm muadillerini keşfet, karşılaştır ve en iyisini bul.
            </p>
            <a
              href="https://www.instagram.com/muadilciapp"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '8px',
                marginTop: '20px',
                padding: '8px 16px',
                borderRadius: '10px',
                background: 'rgba(255,255,255,.06)',
                border: '1px solid rgba(255,255,255,.1)',
                textDecoration: 'none',
                transition: 'all .15s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'linear-gradient(135deg,#f09433,#e6683c,#dc2743,#cc2366,#bc1888)';
                e.currentTarget.style.borderColor = 'transparent';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,.06)';
                e.currentTarget.style.borderColor = 'rgba(255,255,255,.1)';
              }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.8)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                <circle cx="12" cy="12" r="4" />
                <circle cx="17.5" cy="6.5" r="1" fill="rgba(255,255,255,.8)" stroke="none" />
              </svg>
              <span style={{ fontSize: '12px', fontWeight: 600, color: 'rgba(255,255,255,.75)' }}>@muadilciapp</span>
            </a>
          </div>

          {/* Navigasyon */}
          <div>
            <div style={{ fontSize: '11px', fontWeight: 700, color: C.gold, letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: '16px' }}>Keşfet</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {navLinks.map(({ label, path }) => (
                <span
                  key={path}
                  onClick={() => navigate(path)}
                  style={{ fontSize: '13px', color: 'rgba(255,255,255,.5)', cursor: 'pointer', transition: 'color .15s', width: 'fit-content' }}
                  onMouseEnter={(e) => e.currentTarget.style.color = '#fff'}
                  onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255,255,255,.5)'}
                >
                  {label}
                </span>
              ))}
            </div>
          </div>

          {/* Yasal */}
          <div>
            <div style={{ fontSize: '11px', fontWeight: 700, color: C.gold, letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: '16px' }}>Bilgi</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {legalLinks.map((l) => (
                <span
                  key={l}
                  style={{ fontSize: '13px', color: 'rgba(255,255,255,.5)', cursor: 'pointer', transition: 'color .15s', width: 'fit-content' }}
                  onMouseEnter={(e) => e.currentTarget.style.color = '#fff'}
                  onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255,255,255,.5)'}
                >
                  {l}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Alt çizgi + copyright */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,.08)', paddingTop: '24px', display: 'flex', flexDirection: xs ? 'column' : 'row', justifyContent: 'space-between', alignItems: xs ? 'flex-start' : 'center', gap: '8px' }}>
          <span style={{ fontSize: '12px', color: 'rgba(255,255,255,.25)' }}>
            © 2026 muadilci.com — Tüm hakları saklıdır.
          </span>
          <span style={{ fontSize: '12px', color: 'rgba(255,255,255,.2)' }}>
            Parfüm dünyasını demokratikleştiriyoruz.
          </span>
        </div>
      </div>
    </footer>
  );
}
