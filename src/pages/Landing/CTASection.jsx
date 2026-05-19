import { useRouter } from '@/contexts/RouterContext';
import { useW } from '@/hooks/useW';
import { C, F } from '@/constants/theme';

export function CTASection() {
  const { navigate } = useRouter();
  const { sm } = useW();
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
      <div style={{ background: `linear-gradient(135deg,#fdf6e3,#fef9ee,#fdf3d0)`, padding: sm ? '56px 16px' : '80px 32px', textAlign: 'center', borderTop: `1px solid ${C.goldBorder}` }}>
        <div style={{ maxWidth: '580px', margin: '0 auto' }}>
          <div style={{ display: 'inline-block', background: C.goldBg, border: `1px solid ${C.goldBorder}`, borderRadius: '20px', padding: '5px 16px', fontSize: '12px', fontWeight: 700, color: C.gold, marginBottom: '18px', letterSpacing: '.06em' }}>ÜCRETSİZ</div>
          <h2 style={{ fontSize: 'clamp(22px,4vw,38px)', fontWeight: 900, color: C.navy, marginBottom: '12px', lineHeight: 1.2 }}>
            Koku yolculuğuna <span style={{ color: C.gold }}>bugün başla</span>
          </h2>
          <p style={{ color: C.textMid, fontSize: '15px', lineHeight: 1.7, marginBottom: '28px' }}>Ücretsiz üye ol, binlerce muadil eşleşmesine eriş, yorum yap.</p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={() => navigate('/kayit')} style={{ background: `linear-gradient(135deg,${C.gold},${C.goldLight})`, border: 'none', borderRadius: '12px', padding: '14px 32px', color: '#fff', fontSize: '15px', fontWeight: 700, cursor: 'pointer', fontFamily: F, boxShadow: '0 4px 20px rgba(184,150,90,.35)' }}>
              Ücretsiz Üye Ol
            </button>
            <button onClick={() => navigate('/karsilastir')} style={{ background: '#fff', border: `1px solid ${C.border}`, borderRadius: '12px', padding: '14px 32px', color: C.navy, fontSize: '15px', fontWeight: 600, cursor: 'pointer', fontFamily: F, boxShadow: C.shadow }}>
              Karşılaştırmaya Başla
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
