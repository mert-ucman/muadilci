import { useRouter } from '@/contexts/RouterContext';
import { useW } from '@/hooks/useW';
import { C } from '@/constants/theme';

export function Footer() {
  const { navigate } = useRouter();
  const { w, sm, xs } = useW();
  return (
    <footer style={{ background: C.navy, padding: sm ? '28px 16px' : '40px 32px' }}>
      <div style={{
        maxWidth: '1320px', margin: '0 auto',
        display: 'flex',
        flexDirection: sm ? 'column' : 'row',
        justifyContent: 'space-between',
        alignItems: sm ? 'flex-start' : 'center',
        flexWrap: 'wrap',
        gap: sm ? '20px' : '16px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }} onClick={() => navigate('/')}>
          <div style={{ width: '30px', height: '30px', borderRadius: '7px', background: `linear-gradient(135deg,${C.gold},${C.goldLight})`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: '#fff', fontSize: '14px', fontWeight: 900 }}>M</span>
          </div>
          <span style={{ fontSize: '18px', fontWeight: 900, color: '#fff' }}>muadilci</span>
        </div>

        <span style={{ color: 'rgba(255,255,255,.3)', fontSize: '13px' }}>© 2025 muadilci.com · Tüm hakları saklıdır.</span>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ color: 'rgba(255,255,255,.35)', fontSize: '12px', fontWeight: 600, letterSpacing: '.04em' }}>
            Bizi takip edin
          </span>
          <a
            href="https://www.instagram.com/muadilciapp"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: '36px', height: '36px', borderRadius: '10px',
              background: 'rgba(255,255,255,.08)',
              border: '1px solid rgba(255,255,255,.12)',
              transition: 'background .15s, border-color .15s',
              textDecoration: 'none',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'linear-gradient(135deg,#f09433,#e6683c,#dc2743,#cc2366,#bc1888)';
              e.currentTarget.style.borderColor = 'transparent';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,.08)';
              e.currentTarget.style.borderColor = 'rgba(255,255,255,.12)';
            }}
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.8)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
              <circle cx="12" cy="12" r="4" />
              <circle cx="17.5" cy="6.5" r="1" fill="rgba(255,255,255,.8)" stroke="none" />
            </svg>
          </a>
        </div>

        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
          {['Hakkımızda', 'Gizlilik', 'İletişim'].map((l) => (
            <span key={l} style={{ color: 'rgba(255,255,255,.4)', fontSize: '13px', cursor: 'pointer' }}>{l}</span>
          ))}
        </div>
      </div>
    </footer>
  );
}
