import { useW } from '@/hooks/useW';
import { C } from '@/constants/theme';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMagnifyingGlass, faScaleBalanced, faStar, faBullseye } from '@fortawesome/free-solid-svg-icons';

const STEPS = [
  { icon: faMagnifyingGlass, n: '1', title: 'Orijinalini Seç', desc: 'Hayalindeki lüks parfümü marka ve model olarak seç.' },
  { icon: faScaleBalanced, n: '2', title: 'Muadilleri Gör', desc: 'Aynı koku profiline sahip muadilleri yan yana gör.' },
  { icon: faStar, n: '3', title: 'Yorumları Oku', desc: 'Gerçek kullanıcıların benzerlik, yayılım ve kalıcılık puanlarını incele.' },
  { icon: faBullseye, n: '4', title: 'En Yakını Bul', desc: 'Orijinale en yakın muadili bul, eşsiz bir koku deneyimi yaşa.' },
];

export function HowItWorksSection() {
  const { sm } = useW();
  return (
    <div style={{ background: '#f7f8fc', padding: sm ? '48px 16px' : '72px 32px' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <span style={{ display: 'inline-block', background: C.goldBg, border: `1px solid ${C.goldBorder}`, borderRadius: '20px', padding: '5px 16px', fontSize: '12px', fontWeight: 700, color: C.gold, marginBottom: '14px' }}>NASIL ÇALIŞIR?</span>
          <h2 style={{ fontSize: 'clamp(24px,4vw,38px)', fontWeight: 900, color: C.navy, marginBottom: '10px' }}>4 adımda muadil keşfi</h2>
          <p style={{ color: C.textLight, fontSize: '15px', maxWidth: '460px', margin: '0 auto', lineHeight: 1.7 }}>Orijinaline en yakın muadili bulmak hiç bu kadar kolay olmamıştı.</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: '18px' }}>
          {STEPS.map((s) => (
            <div
              key={s.n}
              style={{ background: '#fff', border: `1px solid ${C.border}`, borderRadius: '18px', padding: '26px 22px', position: 'relative', boxShadow: C.shadow, transition: 'transform .2s,box-shadow .2s' }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = C.shadowMd; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = C.shadow; }}
            >
              <div style={{ position: 'absolute', top: '18px', right: '18px', width: '26px', height: '26px', borderRadius: '50%', background: C.goldBg, border: `1px solid ${C.goldBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 800, color: C.gold }}>{s.n}</div>
              <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: C.goldBg, border: `1px solid ${C.goldBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '14px' }}>
                <FontAwesomeIcon icon={s.icon} style={{ fontSize: '20px', color: C.gold }} />
              </div>
              <h3 style={{ fontSize: '16px', fontWeight: 800, color: C.navy, marginBottom: '8px' }}>{s.title}</h3>
              <p style={{ fontSize: '14px', color: C.textLight, lineHeight: 1.6 }}>{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
