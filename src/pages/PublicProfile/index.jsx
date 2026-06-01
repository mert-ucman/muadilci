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
import noImage from '@/img/no-image.jpg';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLock } from '@fortawesome/free-solid-svg-icons';

const ROLE_LABEL = { admin: 'Admin', moderator: 'Moderatör', user: 'Üye' };
const ROLE_COLOR = { admin: 'red', moderator: 'blue', user: 'gold' };

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
    <div style={{ border: `1px solid ${C.border}`, borderRadius: '12px', overflow: 'hidden', background: C.card }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 18px', cursor: 'pointer', background: open ? C.goldBg : C.card, transition: 'background 0.2s' }}
        onClick={() => setOpen((s) => !s)}>
        <svg width="14" height="14" fill="none" stroke={C.textLight} strokeWidth="2.5" viewBox="0 0 24 24"
          style={{ flexShrink: 0, transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
          <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: '14px', color: C.navy, fontFamily: F, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{list.title}</div>
          <div style={{ fontSize: '11px', color: C.textLight, marginTop: '2px' }}>{list.items?.length || 0} parfüm</div>
        </div>
      </div>
      {open && (
        <div style={{ borderTop: `1px solid ${C.borderLight}`, padding: '14px 18px' }}>
          {(!list.items?.length) ? (
            <div style={{ fontSize: '13px', color: C.textLight, fontStyle: 'italic' }}>Bu listede henüz parfüm yok.</div>
          ) : (
            <ol style={{ margin: 0, padding: '0 0 0 20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {list.items.map((item, i) => {
                const url = getUrl(item);
                return (
                  <li key={i} style={{ fontSize: '14px', color: C.text, lineHeight: 1.5 }}>
                    {url ? (
                      <a href={`/#${url}`} onClick={(e) => { e.preventDefault(); navigate(url); }}
                        style={{ fontWeight: 600, color: C.text, textDecoration: 'none', borderBottom: '1px solid transparent', transition: 'color 0.15s, border-color 0.15s' }}
                        onMouseEnter={e => { e.currentTarget.style.color = C.gold; e.currentTarget.style.borderBottomColor = C.gold; }}
                        onMouseLeave={e => { e.currentTarget.style.color = C.text; e.currentTarget.style.borderBottomColor = 'transparent'; }}
                      >{item.displayName}</a>
                    ) : (
                      <span style={{ fontWeight: 600 }}>{item.displayName}</span>
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
    <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: '32px', height: '32px', border: '3px solid #e5e7eb', borderTop: `3px solid ${C.gold}`, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  if (notFound) return (
    <div style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
      <div style={{ fontSize: '48px' }}>🔍</div>
      <h2 style={{ fontSize: '22px', fontWeight: 900, color: C.navy }}>Kullanıcı bulunamadı</h2>
      <p style={{ color: C.textLight }}>@{username} adında bir kullanıcı yok.</p>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: C.bg }}>
      {/* Header */}
      <div style={{ background: `linear-gradient(135deg,${C.navy},${C.navyLight})`, padding: sm ? '28px 16px' : '40px 32px' }}>
        <div style={{ maxWidth: '860px', margin: '0 auto', display: 'flex', gap: sm ? '16px' : '22px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ width: sm ? '64px' : '80px', height: sm ? '64px' : '80px', borderRadius: '50%', flexShrink: 0, overflow: 'hidden', border: '3px solid rgba(255,255,255,.25)', background: `linear-gradient(135deg,${C.gold},${C.goldLight})`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {profile.photoURL
              ? <img src={profile.photoURL} alt={profile.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { e.currentTarget.style.display = 'none'; }} />
              : <span style={{ fontSize: sm ? '22px' : '28px', fontWeight: 700, color: '#fff' }}>{profile.name?.[0]?.toUpperCase()}</span>
            }
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: sm ? '20px' : '26px', fontWeight: 900, color: '#fff', marginBottom: '4px' }}>{profile.name}</div>
            <div style={{ color: 'rgba(255,255,255,.6)', fontSize: '13px', marginBottom: '8px' }}>@{username}</div>
            <Badge color={ROLE_COLOR[profile.role] || 'gold'}>{ROLE_LABEL[profile.role] || 'Üye'}</Badge>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '860px', margin: '0 auto', padding: sm ? '24px 16px' : '32px 32px' }}>
        {/* Listeler */}
        {lists.length > 0 && (
          <div style={{ marginBottom: '40px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 800, color: C.navy, marginBottom: '14px' }}>
              Listeler <span style={{ fontSize: '13px', fontWeight: 500, color: C.textLight }}>({lists.length})</span>
            </h2>

            {!user ? (
              <div style={{
                border: `1px solid ${C.border}`, borderRadius: '16px',
                padding: sm ? '32px 20px' : '40px 48px',
                textAlign: 'center', background: C.card,
                position: 'relative', overflow: 'hidden',
              }}>
                {/* Bulanık arka plan önizleme */}
                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', gap: '10px', padding: '16px', filter: 'blur(4px)', opacity: 0.35, pointerEvents: 'none' }}>
                  {lists.slice(0, 3).map((l) => (
                    <div key={l.id} style={{ height: '52px', background: C.surface, borderRadius: '10px', border: `1px solid ${C.border}` }} />
                  ))}
                </div>
                {/* Overlay içerik */}
                <div style={{ position: 'relative', zIndex: 1 }}>
                  <div style={{ width: '52px', height: '52px', borderRadius: '50%', background: C.goldBg, border: `1px solid ${C.goldBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
                    <FontAwesomeIcon icon={faLock} style={{ fontSize: '20px', color: C.gold }} />
                  </div>
                  <h3 style={{ fontSize: '16px', fontWeight: 800, color: C.navy, marginBottom: '8px' }}>
                    Listeleri görmek için üye olun
                  </h3>
                  <p style={{ fontSize: '13px', color: C.textLight, marginBottom: '20px', lineHeight: 1.6 }}>
                    @{username} adlı kullanıcının parfüm listelerini görmek için ücretsiz üye olun.
                  </p>
                  <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
                    <Btn onClick={() => navigate('/kayit')}>Hemen Üye Ol</Btn>
                    <Btn variant="secondary" onClick={() => navigate('/giris')}>Giriş Yap</Btn>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
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
            <h2 style={{ fontSize: '18px', fontWeight: 800, color: C.navy, marginBottom: '14px' }}>
              Karşılaştırmalar <span style={{ fontSize: '13px', fontWeight: 500, color: C.textLight }}>({userReviews.length})</span>
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: sm ? '1fr' : 'repeat(auto-fill,minmax(300px,1fr))', gap: '12px' }}>
              {userReviews.map((c) => {
                const muadil = muadilPerfumes.find((m) => m.id === c.muadilPerfumeId || m.id === c.muadilId);
                if (!muadil) return null;
                return (
                  <Card key={c.id} hover style={{ padding: '16px', cursor: 'pointer' }}
                    onClick={() => navigate(`/karsilastir?orijinal=${muadil.targetPerfumeId}&muadil=${muadil.id}`)}>
                    <div style={{ fontWeight: 700, fontSize: '14px', color: C.navy, marginBottom: '6px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {muadil.brandName} — {muadil.name}
                    </div>
                    <div style={{ fontSize: '12px', color: C.textLight, marginBottom: '8px' }}>→ {muadil.targetBrandName} {muadil.targetPerfumeName}</div>
                    <div style={{ display: 'flex', gap: '10px', fontSize: '12px', color: C.textMid }}>
                      <span>Benzerlik <strong style={{ color: C.gold }}>{c.similarity}/10</strong></span>
                      <span>Kalıcılık <strong style={{ color: C.gold }}>{c.longevity}/10</strong></span>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {lists.length === 0 && userReviews.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: C.textLight }}>
            <div style={{ fontSize: '36px', marginBottom: '12px' }}>🌸</div>
            <div style={{ fontSize: '15px' }}>Bu kullanıcı henüz içerik paylaşmamış.</div>
          </div>
        )}
      </div>
    </div>
  );
}
