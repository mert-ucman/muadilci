import { useState, useEffect } from 'react';
import { doc, getDoc, collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useRouter } from '@/contexts/RouterContext';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { useW } from '@/hooks/useW';
import { Card, Badge, Btn } from '@/components/ui';
import { C, F, FH } from '@/constants/theme';
import { useSeo } from '@/lib/seo';
import { levelFor, BADGES, BADGE_ORDER } from '@/lib/gamification';
import { BadgeMedal } from '@/components/shared/Badges';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLock } from '@fortawesome/free-solid-svg-icons';

const ROLE_LABEL = { admin: 'Admin', moderator: 'Moderatör', user: 'Üye' };
const ROLE_COLOR = { admin: 'red', moderator: 'blue', user: 'gold' };

// Koyu başlıkta XP/seviye çipi — sabit yükseklik + cap-center ile dikey ortalı.
function PubStat({ label, value }) {
  return (
    <span className="inline-flex items-center rounded-[20px] px-[12px]"
      style={{ height: '26px', gap: '6px', fontFamily: F, background: 'rgba(255,255,255,.12)', border: '1px solid rgba(255,255,255,.18)' }}>
      <span className="cap-center" style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.05em', color: 'rgba(255,255,255,.6)' }}>{label}</span>
      <span className="cap-center" style={{ fontSize: '13px', fontWeight: 800, color: '#fff', fontVariantNumeric: 'tabular-nums' }}>{value}</span>
    </span>
  );
}

function AccordionList({ list, perfumes, muadilPerfumes, navigate }) {
  const [open, setOpen] = useState(false);

  const getUrl = (item) => {
    if (item.isCustom || !item.perfumeId) return null;
    if (list.category === 'muadil') {
      const m = muadilPerfumes.find((m) => String(m.id) === String(item.perfumeId));
      return m ? `/karsilastir?orijinal=${m.targetPerfumeId}&muadil=${m.id}` : null;
    }
    const p = perfumes.find((p) => String(p.id) === String(item.perfumeId));
    return p ? `/${p.brandSlug}/${p.slug}` : null;
  };

  return (
    <div className="border border-(--color-border) rounded-xl overflow-hidden bg-(--color-card)">
      <div
        className="flex items-center gap-3 p-[14px_18px] cursor-pointer transition-colors duration-200"
        style={{ background: open ? C.goldBg : C.card }}
        onClick={() => setOpen((s) => !s)}
      >
        <svg width="14" height="14" fill="none" stroke={C.textLight} strokeWidth="2.5" viewBox="0 0 24 24"
          style={{ flexShrink: 0, transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
          <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <div className="flex-1 min-w-0">
          <div className="font-bold text-sm text-(--color-navy) overflow-hidden text-ellipsis whitespace-nowrap" style={{ fontFamily: F }}>{list.title}</div>
          <div className="text-[11px] text-(--color-text-light) mt-[2px]">{list.items?.length || 0} parfüm</div>
        </div>
      </div>
      {open && (
        <div className="border-t border-(--color-border-light) p-[14px_18px]">
          {(!list.items?.length) ? (
            <div className="text-[13px] text-(--color-text-light) italic">Bu listede henüz parfüm yok.</div>
          ) : (
            <ol className="m-0 pl-5 flex flex-col gap-2">
              {list.items.map((item, i) => {
                const url = getUrl(item);
                return (
                  <li key={i} className="text-sm text-(--color-text) leading-[1.5]">
                    {url ? (
                      <a href={`/#${url}`} onClick={(e) => { e.preventDefault(); navigate(url); }}
                        style={{ fontWeight: 600, color: C.text, textDecoration: 'none', borderBottom: '1px solid transparent', transition: 'color 0.15s, border-color 0.15s' }}
                        onMouseEnter={e => { e.currentTarget.style.color = C.gold; e.currentTarget.style.borderBottomColor = C.gold; }}
                        onMouseLeave={e => { e.currentTarget.style.color = C.text; e.currentTarget.style.borderBottomColor = 'transparent'; }}
                      >{item.displayName}</a>
                    ) : (
                      <span className="font-semibold">{item.displayName}</span>
                    )}
                  </li>
                );
              })}
            </ol>
          )}
        </div>
      )}
    </div>
  );
}

export function PublicProfilePage({ params, queryParams }) {
  const username = params?.username;
  const { navigate } = useRouter();
  const { user } = useAuth();
  const { perfumes, muadilPerfumes, comments } = useData();
  const { sm } = useW();
  const [profile, setProfile] = useState(null);
  const [lists, setLists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useSeo({ title: profile ? `@${username} — Muadilci` : 'Profil', noindex: false });

  useEffect(() => {
    if (!username) { setNotFound(true); setLoading(false); return; }
    const load = async () => {
      try {
        const unSnap = await getDoc(doc(db, 'usernames', username.toLowerCase()));
        if (!unSnap.exists()) { setNotFound(true); setLoading(false); return; }
        const uid = unSnap.data().uid;

        const profSnap = await getDoc(doc(db, 'publicProfiles', uid));
        if (!profSnap.exists()) { setNotFound(true); setLoading(false); return; }
        setProfile({ ...profSnap.data(), uid });

        const listsSnap = await getDocs(query(collection(db, 'users', uid, 'perfumeLists'), orderBy('createdAt', 'desc')));
        setLists(listsSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
      } catch {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [username]);

  // Belirli bir liste query param'ı ile açılsın
  const highlightListId = queryParams?.list;

  const userReviews = profile
    ? comments.filter((c) => c.userId === profile.uid && (c.status === 'approved' || c.status === 'pending_update'))
    : [];

  if (loading) return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="w-8 h-8 rounded-full border-[3px] border-[#e5e7eb] border-t-[3px] animate-spin" style={{ borderTopColor: C.gold }} />
    </div>
  );

  if (notFound) return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
      <div className="text-[48px]">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke={C.textLight} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
      </div>
      <h2 className="text-[22px] font-black text-(--color-navy)">Kullanıcı bulunamadı</h2>
      <p className="text-(--color-text-light)">@{username} adında bir kullanıcı yok.</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-(--color-bg)">
      {/* Header */}
      <div style={{ background: `linear-gradient(135deg,${C.navy},${C.navyLight})`, padding: sm ? '28px 16px' : '40px 32px' }}>
        <div style={{ maxWidth: '860px', margin: '0 auto', display: 'flex', gap: sm ? '16px' : '22px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ width: sm ? '64px' : '80px', height: sm ? '64px' : '80px', borderRadius: '50%', flexShrink: 0, overflow: 'hidden', border: '3px solid rgba(255,255,255,.25)', background: `linear-gradient(135deg,${C.gold},${C.goldLight})`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {profile.photoURL
              ? <img src={profile.photoURL} alt={profile.name} className="w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
              : <span style={{ fontSize: sm ? '22px' : '28px' }} className="font-bold text-white">{profile.name?.[0]?.toUpperCase()}</span>
            }
          </div>
          <div className="flex-1 min-w-0">
            <div style={{ fontSize: sm ? '20px' : '26px' }} className="font-black text-white mb-1">{profile.name}</div>
            <div className="text-white/60 text-[13px] mb-2">@{username}</div>
            <div className="flex gap-2 items-center flex-wrap">
              <Badge color={ROLE_COLOR[profile.role] || 'gold'}>{ROLE_LABEL[profile.role] || 'Üye'}</Badge>
              <PubStat label="Sv" value={`${levelFor(profile.xpTotal || 0).lvl} · ${levelFor(profile.xpTotal || 0).title}`} />
              <PubStat label="XP" value={profile.xpTotal || 0} />
              {profile.weeklyChampionCount > 0 && (
                <span className="inline-flex items-center justify-center rounded-[20px] px-[12px]" style={{ height: '26px', background: 'rgba(201,164,107,.22)', border: '1px solid rgba(201,164,107,.5)' }}>
                  <p className="m-0 p-0 w-max cap-center" style={{ fontSize: '13px', fontWeight: 800, color: '#e7cf9f', fontFamily: F }}>{profile.weeklyChampionCount}× Şampiyon</p>
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '860px', margin: '0 auto', padding: sm ? '24px 16px' : '32px 32px' }}>
        {/* Başarımlar (kazanılmış rozetler) */}
        {(() => {
          const earned = BADGE_ORDER.filter((id) => profile.badges?.includes(id));
          if (earned.length === 0) return null;
          return (
            <div className="mb-10">
              <h2 className="text-[18px] font-extrabold text-(--color-navy) mb-[14px]">
                Başarımlar <span className="text-[13px] font-medium text-(--color-text-light)">({earned.length})</span>
              </h2>
              <div className="flex flex-wrap gap-4">
                {earned.map((id) => (
                  <div key={id} className="flex flex-col items-center text-center" style={{ width: '92px' }}>
                    <BadgeMedal badge={BADGES[id]} size={56} unlocked />
                    <div className="mt-2 text-[12px] font-bold" style={{ color: C.goldDeep }}>
                      {BADGES[id].label}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })()}

        {/* Listeler */}
        {lists.length > 0 && (
          <div className="mb-10">
            <h2 className="text-[18px] font-extrabold text-(--color-navy) mb-[14px]">
              Listeler <span className="text-[13px] font-medium text-(--color-text-light)">({lists.length})</span>
            </h2>

            {!user ? (
              <div className="border border-(--color-border) rounded-2xl text-center bg-(--color-card) relative overflow-hidden"
                style={{ padding: sm ? '32px 20px' : '40px 48px' }}>
                {/* Blurred background preview */}
                <div className="absolute inset-0 flex flex-col gap-[10px] p-4 blur-[4px] opacity-35 pointer-events-none">
                  {lists.slice(0, 3).map((l) => (
                    <div key={l.id} className="h-[52px] bg-(--color-surface) rounded-[10px] border border-(--color-border)" />
                  ))}
                </div>
                {/* Overlay content */}
                <div className="relative z-10">
                  <div className="w-[52px] h-[52px] rounded-full bg-(--color-gold-bg) border border-(--color-gold-border) flex items-center justify-center mx-auto mb-[14px]">
                    <FontAwesomeIcon icon={faLock} style={{ fontSize: '20px', color: C.gold }} />
                  </div>
                  <h3 className="text-[16px] font-extrabold text-(--color-navy) mb-2">
                    Listeleri görmek için üye olun
                  </h3>
                  <p className="text-[13px] text-(--color-text-light) mb-5 leading-[1.6]">
                    @{username} adlı kullanıcının parfüm listelerini görmek için ücretsiz üye olun.
                  </p>
                  <div className="flex gap-[10px] justify-center flex-wrap">
                    <Btn onClick={() => navigate('/kayit')}>Hemen Üye Ol</Btn>
                    <Btn variant="secondary" onClick={() => navigate('/giris')}>Giriş Yap</Btn>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-[10px]">
                {lists.map((list) => (
                  <AccordionList
                    key={list.id}
                    list={list}
                    perfumes={perfumes}
                    muadilPerfumes={muadilPerfumes}
                    navigate={navigate}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Yorumlar / Karşılaştırmalar */}
        {userReviews.length > 0 && (
          <div>
            <h2 className="text-[18px] font-extrabold text-(--color-navy) mb-[14px]">
              Karşılaştırmalar <span className="text-[13px] font-medium text-(--color-text-light)">({userReviews.length})</span>
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: sm ? '1fr' : 'repeat(auto-fill,minmax(300px,1fr))', gap: '12px' }}>
              {userReviews.map((c) => {
                const muadil = muadilPerfumes.find((m) => m.id === c.muadilPerfumeId || m.id === c.muadilId);
                if (!muadil) return null;
                return (
                  <Card key={c.id} hover style={{ padding: '16px', cursor: 'pointer' }}
                    onClick={() => navigate(`/karsilastir?orijinal=${muadil.targetPerfumeId}&muadil=${muadil.id}`)}>
                    <div className="font-bold text-sm text-(--color-navy) mb-[6px] overflow-hidden text-ellipsis whitespace-nowrap">
                      {muadil.brandName} — {muadil.name}
                    </div>
                    <div className="text-xs text-(--color-text-light) mb-2">→ {muadil.targetBrandName} {muadil.targetPerfumeName}</div>
                    <div className="flex gap-[10px] text-xs text-(--color-text-mid)">
                      <span>Benzerlik <strong style={{ color: C.gold }}>{c.similarity}/10</strong></span>
                      <span>Kalıcılık <strong style={{ color: C.gold }}>{c.longevity}/10</strong></span>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {lists.length === 0 && userReviews.length === 0 && !(profile.badges?.length) && (
          <div className="text-center p-[60px_20px] text-(--color-text-light)">
            <div className="text-[36px] mb-3">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke={C.textLight} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mx-auto"><path d="M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2z"/><path d="M8.5 9a3.5 3.5 0 0 1 7 0c0 2-3.5 3-3.5 5"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>
            </div>
            <div className="text-[15px]">Bu kullanıcı henüz içerik paylaşmamış.</div>
          </div>
        )}
      </div>
    </div>
  );
}
