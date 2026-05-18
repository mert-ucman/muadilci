import { useW } from '@/hooks/useW';
import { C } from '@/constants/theme';

const TESTIMONIALS = [
  { av: 'A', name: 'Ahmet K.', text: "Sauvage'a bayılıyordum ama bütçemi zorluyordu. Muadilci sayesinde MFY Sauvage Benzeri'ni buldum, orijinalden farkı gerçekten minimal!", rating: 5, badge: 'Doğrulanmış Üye' },
  { av: 'S', name: 'Selin M.', text: "Artık parfüm almadan önce mutlaka Muadilci'ye bakıyorum. Orijinale en yakın muadili hızlıca bulup gerçek kullanıcı yorumlarını okuyorum.", rating: 5, badge: 'Parfüm Tutkunları' },
  { av: 'M', name: 'Mehmet T.', text: "Lattafa'nın muadillerini bulmak için biçilmiş kaftan. Koleksiyonum için orijinali, günlük kullanım için muadili tercih ediyorum.", rating: 4, badge: 'Koleksiyoncu' },
];

export function TestimonialsSection() {
  const { sm } = useW();
  return (
    <div style={{ background: '#f7f8fc', padding: sm ? '48px 16px' : '72px 32px' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '44px' }}>
          <span style={{ display: 'inline-block', background: C.goldBg, border: `1px solid ${C.goldBorder}`, borderRadius: '20px', padding: '5px 16px', fontSize: '12px', fontWeight: 700, color: C.gold, marginBottom: '14px' }}>KULLANICILARIN SÖYLEDİKLERİ</span>
          <h2 style={{ fontSize: 'clamp(20px,3vw,32px)', fontWeight: 900, color: C.navy }}>Gerçek kullanıcılar, gerçek deneyimler</h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: '18px' }}>
          {TESTIMONIALS.map((t) => (
            <div key={t.name} style={{ background: '#fff', border: `1px solid ${C.border}`, borderRadius: '18px', padding: '24px', boxShadow: C.shadow }}>
              <div style={{ display: 'flex', gap: '2px', marginBottom: '12px' }}>
                {[1, 2, 3, 4, 5].map((i) => <span key={i} style={{ color: i <= t.rating ? C.gold : '#e0d9ce', fontSize: '16px' }}>★</span>)}
              </div>
              <p style={{ fontSize: '14px', color: C.textMid, lineHeight: 1.7, marginBottom: '16px', fontStyle: 'italic' }}>"{t.text}"</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', paddingTop: '14px', borderTop: `1px solid ${C.borderLight}` }}>
                <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: `linear-gradient(135deg,${C.gold},${C.goldLight})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', color: '#fff', fontWeight: 700, flexShrink: 0 }}>{t.av}</div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '14px', color: C.navy }}>{t.name}</div>
                  <div style={{ fontSize: '12px', color: C.textLight }}>{t.badge}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
