import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { Card, Badge, Btn } from '@/components/ui';
import { C } from '@/constants/theme';
import { useSeo } from '@/lib/seo';

export function ModerationPage() {
  useSeo({ title: 'Moderasyon', noindex: true });
  const { isMod } = useAuth();
  const { comments, approveComment, rejectComment, muadilPerfumes } = useData();

  if (!isMod) return (
    <div className="p-[60px] text-center text-[color:var(--color-text-light)]">
      Erişim yetkisi yok.
    </div>
  );

  const pending = comments.filter((c) => c.status === 'pending' || c.status === 'pending_update');

  return (
    <div className="min-h-screen bg-(--color-bg) p-8">
      <div className="max-w-[860px] mx-auto">
        <h1 className="text-[26px] font-black text-(--color-navy) mb-1">Yorum Moderasyonu</h1>
        <p className="text-(--color-text-light) text-sm mb-7">{pending.length} yorum onay bekliyor</p>

        {!pending.length && (
          <Card style={{ padding: '60px', textAlign: 'center' }}>
            <div className="text-[36px] mb-3 flex justify-center">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke={C.green} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
            <div className="font-semibold text-(--color-navy)">Onay bekleyen yorum yok</div>
          </Card>
        )}

        <div className="flex flex-col gap-[14px]">
          {pending.map((c) => {
            const mp = muadilPerfumes.find((m) => m.id === c.muadilPerfumeId);
            const isUpdate = c.status === 'pending_update';
            const pu = c.pendingUpdate;
            return (
              <Card key={c.id} style={{ padding: '20px', border: `1px solid ${isUpdate ? '#c4b5fd' : C.goldBorder}`, background: isUpdate ? '#faf5ff' : C.card }}>
                <div className="flex gap-[10px] mb-[10px]">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm text-white font-bold shrink-0 overflow-hidden"
                    style={{ background: `linear-gradient(135deg,${C.gold},${C.goldLight})` }}>
                    {c.userPhotoURL
                      ? <img src={c.userPhotoURL} alt={c.userName} className="w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                      : (c.userAvatar?.length === 1 ? c.userAvatar : c.userName?.[0]?.toUpperCase() || '?')
                    }
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-center flex-wrap gap-[6px]">
                      <span className="font-bold text-(--color-text)">{c.userName}</span>
                      <div className="flex gap-[6px] items-center">
                        {isUpdate
                          ? <Badge color="purple">Güncelleme İsteği</Badge>
                          : <Badge color="orange">Yeni Yorum</Badge>
                        }
                        {c.abuseFlag && <Badge color="red">Şüpheli</Badge>}
                        <span className="text-xs text-(--color-text-light)">{c.date}</span>
                      </div>
                    </div>
                    {mp && <div className="text-xs text-(--color-text-mid) mt-[2px]">→ {mp.brandName} {mp.name}</div>}
                    {!isUpdate && (
                      <div className="flex gap-[10px] text-xs text-(--color-text-mid) mt-1">
                        <span>Ben. {c.similarity}/10</span><span>Yay. {c.projection}/10</span><span>Kal. {c.longevity}/10</span>
                      </div>
                    )}
                  </div>
                </div>

                {isUpdate && pu ? (
                  <div className="grid grid-cols-2 gap-[10px] mb-3">
                    <div className="bg-(--color-surface) border border-(--color-border) rounded-lg p-3">
                      <div className="text-[11px] font-bold text-(--color-text-mid) tracking-[.05em] uppercase mb-2">Mevcut Yorum</div>
                      <div className="flex gap-2 text-xs text-(--color-text-mid) mb-[6px] flex-wrap">
                        <span>Ben. {c.similarity}/10</span><span>Yay. {c.projection}/10</span><span>Kal. {c.longevity}/10</span>
                      </div>
                      <p className="text-[13px] text-(--color-text) leading-relaxed m-0">{c.text}</p>
                    </div>
                    <div className="bg-[#ede9fe] border border-[#c4b5fd] rounded-lg p-3">
                      <div className="text-[11px] font-bold text-[#6d28d9] tracking-[.05em] uppercase mb-2">Yeni Hali</div>
                      <div className="flex gap-2 text-xs text-[#6d28d9] mb-[6px] flex-wrap">
                        <span>Ben. {pu.similarity}/10</span><span>Yay. {pu.projection}/10</span><span>Kal. {pu.longevity}/10</span>
                      </div>
                      <p className="text-[13px] text-[#3b0764] leading-relaxed m-0">{pu.text}</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-(--color-text) leading-relaxed mb-3">{c.text}</p>
                )}

                {c.abuseFlag && c.abuseReason && (
                  <div className="flex items-center gap-2 rounded-lg px-3 py-2 mb-3 text-[13px] font-semibold" style={{ background: '#fff5f5', border: '1px solid #fecaca', color: C.red }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                    Spam şüphesi: {c.abuseReason}
                  </div>
                )}
                <div className="flex gap-2 justify-end">
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
