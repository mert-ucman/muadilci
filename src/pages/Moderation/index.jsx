import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { Card, Badge, Btn } from '@/components/ui';
import { C } from '@/constants/theme';

export function ModerationPage() {
  const { isMod } = useAuth();
  const { comments, approveComment, rejectComment, muadilPerfumes } = useData();

  if (!isMod) return <div style={{ padding: '60px', textAlign: 'center', color: C.textLight }}>Erişim yetkisi yok.</div>;

  const pending = comments.filter((c) => c.status === 'pending');

  return (
    <div style={{ minHeight: '100vh', background: C.bg, padding: '32px' }}>
      <div style={{ maxWidth: '860px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '26px', fontWeight: 900, color: C.navy, marginBottom: '4px' }}>Yorum Moderasyonu</h1>
        <p style={{ color: C.textLight, fontSize: '14px', marginBottom: '28px' }}>{pending.length} yorum onay bekliyor</p>

        {!pending.length && (
          <Card style={{ padding: '60px', textAlign: 'center' }}>
            <div style={{ fontSize: '36px', marginBottom: '12px' }}>✅</div>
            <div style={{ fontWeight: 600, color: C.navy }}>Onay bekleyen yorum yok</div>
          </Card>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {pending.map((c) => {
            const mp = muadilPerfumes.find((m) => m.id === c.muadilPerfumeId);
            return (
              <Card key={c.id} style={{ padding: '20px', border: `1px solid ${C.goldBorder}` }}>
                <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: `linear-gradient(135deg,${C.gold},${C.goldLight})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', color: '#fff', fontWeight: 700, flexShrink: 0 }}>{c.userAvatar}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontWeight: 700, color: C.text }}>{c.userName}</span>
                      <span style={{ fontSize: '12px', color: C.textLight }}>{c.date}</span>
                    </div>
                    {mp && <div style={{ fontSize: '12px', color: C.textMid, marginTop: '2px' }}>→ {mp.brandName} {mp.name}</div>}
                    <div style={{ display: 'flex', gap: '10px', fontSize: '12px', color: C.textMid, marginTop: '4px' }}>
                      <span>Ben. {c.similarity}/10</span><span>Yay. {c.projection}/10</span><span>Kal. {c.longevity}/10</span>
                    </div>
                  </div>
                </div>
                <p style={{ fontSize: '14px', color: C.text, lineHeight: 1.6, marginBottom: '12px' }}>{c.text}</p>
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                  <Btn variant="danger" size="sm" onClick={() => rejectComment(c.id)}>Reddet</Btn>
                  <Btn variant="success" size="sm" onClick={() => approveComment(c.id)}>Onayla</Btn>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
