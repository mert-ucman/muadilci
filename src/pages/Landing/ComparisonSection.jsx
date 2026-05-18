import { useRouter } from '@/contexts/RouterContext';
import { C, F } from '@/constants/theme';

const FEATURES = [
  'Kullanıcı puanlı benzerlik, yayılım ve kalıcılık',
  'Onaylanmış yorumlardan otomatik genel puan',
  'Admin ve moderatör denetimli içerik',
];

export function ComparisonSection() {
  const { navigate } = useRouter();
  return (
    <div style={{ background: '#fff', padding: '72px 32px' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '56px', alignItems: 'center' }}>
        {/* Image */}
        <div style={{ position: 'relative' }}>
          <div style={{ width: '100%', height: '320px', borderRadius: '22px', overflow: 'hidden', boxShadow: C.shadowLg, background: 'linear-gradient(135deg,#2a1f0e,#1a1205)' }}>
            <img
              src="https://images.unsplash.com/photo-1563170351-be82bc888aa4?w=600&q=80"
              alt="Karşılaştırma"
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              onError={(e) => (e.target.style.display = 'none')}
            />
          </div>
          <div style={{ position: 'absolute', bottom: '18px', left: '18px', background: 'rgba(255,255,255,.95)', backdropFilter: 'blur(8px)', borderRadius: '14px', padding: '12px 16px', boxShadow: C.shadowMd }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: C.goldBg, border: `2px solid ${C.gold}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 800, color: C.gold }}>8.2</div>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: C.navy }}>MFY Sauvage Benzeri</div>
                <div style={{ fontSize: '11px', color: C.textLight }}>Kullanıcı puan ortalaması</div>
              </div>
            </div>
          </div>
          <div style={{ position: 'absolute', top: '18px', right: '18px', background: C.navy, borderRadius: '12px', padding: '8px 14px', boxShadow: '0 4px 16px rgba(26,39,68,.4)' }}>
            <div style={{ fontSize: '10px', color: 'rgba(255,255,255,.6)', marginBottom: '2px' }}>Benzerlik Puanı</div>
            <div style={{ fontSize: '16px', fontWeight: 800, color: C.goldLight }}>9.1/10</div>
          </div>
        </div>

        {/* Text */}
        <div>
          <span style={{ display: 'inline-block', background: C.goldBg, border: `1px solid ${C.goldBorder}`, borderRadius: '20px', padding: '5px 16px', fontSize: '12px', fontWeight: 700, color: C.gold, marginBottom: '16px' }}>GERÇEK KARŞILAŞTIRMA</span>
          <h2 style={{ fontSize: 'clamp(22px,3.5vw,36px)', fontWeight: 900, color: C.navy, lineHeight: 1.2, marginBottom: '16px' }}>
            Aynı koku,<br /><span style={{ color: C.gold }}>orijinaline en yakın muadil</span>
          </h2>
          <p style={{ color: C.textMid, fontSize: '15px', lineHeight: 1.8, marginBottom: '22px' }}>
            Her karşılaştırma, gerçek kullanıcıların benzerlik, yayılım ve kalıcılık puanlarıyla desteklenir. Moderatör onaylı muadil parfümler ve doğrulanmış yorumlarla güvenilir içerik.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px' }}>
            {FEATURES.map((t) => (
              <div key={t} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                <span style={{ color: C.green, fontSize: '16px', flexShrink: 0 }}>✓</span>
                <span style={{ fontSize: '14px', color: C.textMid, lineHeight: 1.5 }}>{t}</span>
              </div>
            ))}
          </div>
          <button onClick={() => navigate('/karsilastir')} style={{ background: `linear-gradient(135deg,${C.gold},${C.goldLight})`, border: 'none', borderRadius: '12px', padding: '13px 26px', color: '#fff', fontSize: '14px', fontWeight: 700, cursor: 'pointer', fontFamily: F }}>
            Şimdi Karşılaştır →
          </button>
        </div>
      </div>
    </div>
  );
}
