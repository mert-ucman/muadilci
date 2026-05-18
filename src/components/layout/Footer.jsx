import { useRouter } from '@/contexts/RouterContext';
import { C } from '@/constants/theme';

export function Footer() {
  const { navigate } = useRouter();
  return (
    <footer style={{ background: C.navy, padding: '40px 32px' }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }} onClick={() => navigate('/')}>
          <div style={{ width: '30px', height: '30px', borderRadius: '7px', background: `linear-gradient(135deg,${C.gold},${C.goldLight})`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: '#fff', fontSize: '14px', fontWeight: 900 }}>M</span>
          </div>
          <span style={{ fontSize: '18px', fontWeight: 900, color: '#fff' }}>muadilci</span>
        </div>
        <span style={{ color: 'rgba(255,255,255,.3)', fontSize: '13px' }}>© 2025 muadilci.com · Tüm hakları saklıdır.</span>
        <div style={{ display: 'flex', gap: '20px' }}>
          {['Hakkımızda', 'Gizlilik', 'İletişim'].map((l) => (
            <span key={l} style={{ color: 'rgba(255,255,255,.4)', fontSize: '13px', cursor: 'pointer' }}>{l}</span>
          ))}
        </div>
      </div>
    </footer>
  );
}
