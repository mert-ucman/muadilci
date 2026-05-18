import { useRouter } from '@/contexts/RouterContext';
import { useData } from '@/contexts/DataContext';
import { calcScores } from '@/utils/scoring';
import { C, F } from '@/constants/theme';

export function PopularMatchesSection() {
  const { navigate } = useRouter();
  const { muadilPerfumes, comments } = useData();
  const top = muadilPerfumes.slice(0, 3);

  return (
    <div style={{ background: '#f7f8fc', padding: '72px 32px' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '32px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <span style={{ display: 'inline-block', background: C.goldBg, border: `1px solid ${C.goldBorder}`, borderRadius: '20px', padding: '5px 16px', fontSize: '12px', fontWeight: 700, color: C.gold, marginBottom: '10px' }}>POPÜLER EŞLEŞMELER</span>
            <h2 style={{ fontSize: 'clamp(20px,3vw,32px)', fontWeight: 900, color: C.navy }}>En çok incelenen muadiller</h2>
          </div>
          <button onClick={() => navigate('/karsilastir')} style={{ background: 'transparent', border: `1px solid ${C.border}`, borderRadius: '10px', padding: '9px 18px', color: C.textMid, fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: F }}>
            Tümünü Gör →
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: '16px' }}>
          {top.map((mp) => {
            const sc = calcScores(mp.id, comments);
            return (
              <div
                key={mp.id}
                onClick={() => navigate(`/karsilastir?orijinal=${mp.targetPerfumeId}&muadil=${mp.id}`)}
                style={{ background: '#fff', border: `1px solid ${C.border}`, borderRadius: '16px', padding: '20px', cursor: 'pointer', transition: 'transform .2s,box-shadow .2s', boxShadow: C.shadow }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = C.shadowMd; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = C.shadow; }}
              >
                <div style={{ marginBottom: '14px' }}>
                  <div style={{ fontSize: '12px', color: C.textLight, marginBottom: '4px' }}>Orijinal → Muadil</div>
                  <div style={{ fontWeight: 700, fontSize: '15px', color: C.navy }}>{mp.targetBrandName} {mp.targetPerfumeName}</div>
                  <div style={{ fontSize: '13px', color: C.green, fontWeight: 600, marginTop: '2px' }}>→ {mp.brandName} {mp.name}</div>
                </div>
                <div style={{ marginBottom: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                    <span style={{ fontSize: '12px', color: C.textMid }}>Genel Puan</span>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: sc.overall !== null ? C.gold : C.textLight }}>
                      {sc.overall !== null ? `${sc.overall}/10` : 'Henüz puan yok'}
                    </span>
                  </div>
                  <div style={{ height: '5px', background: C.borderLight, borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: sc.overall !== null ? `${(sc.overall / 10) * 100}%` : '0%', background: `linear-gradient(90deg,${C.gold},${C.goldLight})`, borderRadius: '3px' }} />
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', paddingTop: '10px', borderTop: `1px solid ${C.borderLight}` }}>
                  <span style={{ fontSize: '12px', color: C.textLight }}>{sc.count} kullanıcı yorumu</span>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: C.gold }}>Karşılaştır →</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
