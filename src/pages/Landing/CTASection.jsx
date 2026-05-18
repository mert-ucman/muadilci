import { useRouter } from '@/contexts/RouterContext';
import { C, F } from '@/constants/theme';

export function CTASection() {
  const { navigate } = useRouter();
  return (
    <>
      {/* Atmosfer görseli */}
      <div style={{ position: 'relative', height: '300px', overflow: 'hidden', background: `linear-gradient(135deg,${C.navy},#0f1c38)` }}>
        <img src="https://images.unsplash.com/photo-1585386959984-a4155224a1ad?w=1400&q=80" alt=""
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.5 }}
          onError={(e) => (e.target.style.display = 'none')} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right,rgba(26,39,68,.9) 0%,rgba(26,39,68,.6) 50%,rgba(26,39,68,.3) 100%)' }} />
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', padding: '0 10%' }}>
          <div>
            <h2 style={{ fontSize: 'clamp(22px,3.5vw,42px)', fontWeight: 900, color: '#fff', lineHeight: 1.15, marginBottom: '14px' }}>Koku dünyasını demokratize ediyoruz.</h2>
            <p style={{ fontSize: '15px', color: 'rgba(255,255,255,.65)', marginBottom: '22px', maxWidth: '400px', lineHeight: 1.7 }}>Orijinale en yakın muadili bul. Muadilci topluluğu sana en iyi alternatifleri bulduruyor.</p>
            <button onClick={() => navigate('/kayit')} style={{ background: `linear-gradient(135deg,${C.gold},${C.goldLight})`, border: 'none', borderRadius: '12px', padding: '13px 26px', color: '#fff', fontSize: '15px', fontWeight: 700, cursor: 'pointer', fontFamily: F }}>
              Ücretsiz Üye Ol
            </button>
          </div>
        </div>
      </div>

      {/* CTA Banner */}
      <div style={{ background: `linear-gradient(135deg,${C.navy},#0f1c38)`, padding: '72px 32px', textAlign: 'center' }}>
        <div style={{ maxWidth: '580px', margin: '0 auto' }}>
          <div style={{ fontSize: '40px', marginBottom: '14px' }}>🧴</div>
          <h2 style={{ fontSize: 'clamp(22px,4vw,38px)', fontWeight: 900, color: '#fff', marginBottom: '12px', lineHeight: 1.2 }}>
            Koku yolculuğuna <span style={{ color: C.goldLight }}>bugün başla</span>
          </h2>
          <p style={{ color: 'rgba(255,255,255,.55)', fontSize: '15px', lineHeight: 1.7, marginBottom: '28px' }}>Ücretsiz üye ol, binlerce muadil eşleşmesine eriş, yorum yap.</p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={() => navigate('/kayit')} style={{ background: `linear-gradient(135deg,${C.gold},${C.goldLight})`, border: 'none', borderRadius: '12px', padding: '14px 32px', color: '#fff', fontSize: '15px', fontWeight: 700, cursor: 'pointer', fontFamily: F, boxShadow: '0 4px 20px rgba(184,150,90,.4)' }}>
              Ücretsiz Üye Ol
            </button>
            <button onClick={() => navigate('/karsilastir')} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,.25)', borderRadius: '12px', padding: '14px 32px', color: '#fff', fontSize: '15px', fontWeight: 600, cursor: 'pointer', fontFamily: F }}>
              Karşılaştırmaya Başla
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
