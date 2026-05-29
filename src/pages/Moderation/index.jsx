import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { Card, Badge, Btn } from '@/components/ui';
import { C } from '@/constants/theme';
import { useSeo } from '@/lib/seo';

export function ModerationPage() {
  useSeo({ title: 'Moderasyon', noindex: true });
  const { isMod } = useAuth();
  const { comments, approveComment, rejectComment, muadilPerfumes } = useData();

  if (!isMod) return <div style={{ padding: '60px', textAlign: 'center', color: C.textLight }}>Erişim yetkisi yok.</div>;

  const pending = comments.filter((c) => c.status === 'pending' || c.status === 'pending_update');

  return (
    <div style={{ minHeight: '100vh', background: C.bg, padding: '32px' }}>
      <div style={{ maxWidth: '860px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '26px', fontWeight: 900, color: C.navy, marginBottom: '4px' }}>Yorum Moderasyonu</h1>
        <p style={{ color: C.textLight, fontSize: '14px', marginBottom: '28px' }}>{pending.length} yorum onay bekliyor</p>

        {!pending.length && (
          <Card style={{ padding: '60px', textAlign: 'center' }}>
            <div style={{ fontSize: '36px', marginBottom: '12px' }}>
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke={C.green} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
            <div style={{ fontWeight: 600, color: C.navy }}>Onay bekleyen yorum yok</div>
          </Card>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {pending.map((c) => {
            const mp = muadilPerfumes.find((m) => m.id === c.muadilPerfumeId);
            const isUpdate = c.status === 'pending_update';
            const pu = c.pendingUpdate;
            return (
              <Card key={c.id} style={{ padding: '20px', border: `1px solid ${isUpdate ? '#c4b5fd' : C.goldBorder}`, background: isUpdate ? '#faf5ff' : C.card }}>
                <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: `linear-gradient(135deg,${C.gold},${C.goldLight})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', color: '#fff', fontWeight: 700, flexShrink: 0, overflow: 'hidden' }}>
                    {c.userPhotoURL
                      ? <img src={c.userPhotoURL} alt={c.userName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                      : (c.userAvatar?.length === 1 ? c.userAvatar : c.userName?.[0]?.toUpperCase() || '?')
                    }
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
                      <span style={{ fontWeight: 700, color: C.text }}>{c.userName}</span>
                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                        {isUpdate
                          ? <Badge color="purple">Güncelleme İsteği</Badge>
                          : <Badge color="orange">Yeni Yorum</Badge>
                        }
                        <span style={{ fontSize: '12px', color: C.textLight }}>{c.date}</span>
                      </div>
                    </div>
                    {mp && <div style={{ fontSize: '12px', color: C.textMid, marginTop: '2px' }}>→ {mp.brandName} {mp.name}</div>}
                    {!isUpdate && (
                      <div style={{ display: 'flex', gap: '10px', fontSize: '12px', color: C.textMid, marginTop: '4px' }}>
                        <span>Ben. {c.similarity}/10</span><span>Yay. {c.projection}/10</span><span>Kal. {c.longevity}/10</span>
                      </div>
                    )}
                  </div>
                </div>

                {isUpdate && pu ? (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
                    <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: '8px', padding: '12px' }}>
                      <div style={{ fontSize: '11px', fontWeight: 700, color: C.textMid, letterSpacing: '.05em', textTransform: 'uppercase', marginBottom: '8px' }}>Mevcut Yorum</div>
                      <div style={{ display: 'flex', gap: '8px', fontSize: '12px', color: C.textMid, marginBottom: '6px', flexWrap: 'wrap' }}>
                        <span>Ben. {c.similarity}/10</span><span>Yay. {c.projection}/10</span><span>Kal. {c.longevity}/10</span>
                      </div>
                      <p style={{ fontSize: '13px', color: C.text, lineHeight: 1.6, margin: 0 }}>{c.text}</p>
                    </div>
                    <div style={{ background: '#ede9fe', border: '1px solid #c4b5fd', borderRadius: '8px', padding: '12px' }}>
                      <div style={{ fontSize: '11px', fontWeight: 700, color: '#6d28d9', letterSpacing: '.05em', textTransform: 'uppercase', marginBottom: '8px' }}>Yeni Hali</div>
                      <div style={{ display: 'flex', gap: '8px', fontSize: '12px', color: '#6d28d9', marginBottom: '6px', flexWrap: 'wrap' }}>
                        <span>Ben. {pu.similarity}/10</span><span>Yay. {pu.projection}/10</span><span>Kal. {pu.longevity}/10</span>
                      </div>
                      <p style={{ fontSize: '13px', color: '#3b0764', lineHeight: 1.6, margin: 0 }}>{pu.text}</p>
                    </div>
                  </div>
                ) : (
                  <p style={{ fontSize: '14px', color: C.text, lineHeight: 1.6, marginBottom: '12px' }}>{c.text}</p>
                )}

                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                  <Btn variant="danger" size="sm" onClick={() => rejectComment(c.id)}>
                    {isUpdate ? 'Reddet (Eskiyi Koru)' : 'Reddet'}
                  </Btn>
                  <Btn variant="success" size="sm" onClick={() => approveComment(c.id)}>
                    {isUpdate ? 'Onayla (Güncelle)' : 'Onayla'}
                  </Btn>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
