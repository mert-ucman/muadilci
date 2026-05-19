import { useState } from 'react';
import { useRouter } from '@/contexts/RouterContext';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { useW } from '@/hooks/useW';
import { Badge } from '@/components/ui/Badge';
import { Btn } from '@/components/ui/Btn';
import { C, F } from '@/constants/theme';

export function Navbar() {
  const { navigate, basePath } = useRouter();
  const { user, logout, isAdmin, isMod } = useAuth();
  const { perfumes, brands } = useData();
  const { w, md, lg } = useW();
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQ, setSearchQ] = useState('');

  const navLinks = [
    { l: 'Parfümler', u: '/parfumler' },
    { l: 'Markalar', u: '/markalar' },
    { l: 'Karşılaştır', u: '/karsilastir' },
    { l: 'En İyiler', u: '/en-iyiler' },
  ];
  if (isMod) navLinks.push({ l: 'Moderasyon', u: '/moderasyon' });
  if (isAdmin) navLinks.push({ l: 'Yönetim', u: '/admin' });

  const searchItems = [
    ...perfumes.map((p) => ({ label: `${p.name} — ${p.brandName}`, url: `/${p.brandSlug}/${p.slug}`, type: 'Parfüm' })),
    ...brands.map((b) => ({ label: b.name, url: `/marka/${b.slug}`, type: 'Marka' })),
  ];
  const filtered = searchQ.length > 1
    ? searchItems.filter((i) => i.label.toLowerCase().includes(searchQ.toLowerCase())).slice(0, 6)
    : [];

  const roleLabel = { admin: 'Admin', moderator: 'Moderatör', user: 'Üye' };

  const handleNav = (u) => { navigate(u); setMobileOpen(false); setMenuOpen(false); };

  return (
    <>
      <nav style={{
        position: 'sticky', top: 0, zIndex: 200,
        background: C.card,
        borderBottom: `1px solid ${C.border}`,
        boxShadow: '0 1px 8px rgba(0,0,0,.06)',
      }}>
        <div style={{
          maxWidth: '1320px', margin: '0 auto',
          padding: lg ? '0 16px' : w >= 1280 ? '0 48px' : '0 32px', height: '64px',
          display: 'flex', alignItems: 'center', gap: lg ? '12px' : '20px',
        }}>
          {/* Logo */}
          <div onClick={() => navigate('/')} style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', flexShrink: 0 }}>
            <div style={{ width: '34px', height: '34px', borderRadius: '8px', background: `linear-gradient(135deg,${C.gold},${C.goldLight})`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: '#fff', fontSize: '16px', fontWeight: 900 }}>M</span>
            </div>
            <span style={{ fontSize: '20px', fontWeight: 900, color: C.navy }}>muadilci</span>
          </div>

          {/* Nav Links — desktop only */}
          {!lg && (
            <div style={{ display: 'flex', gap: '4px', flex: 1 }}>
              {navLinks.map((l) => (
                <button
                  key={l.u}
                  onClick={() => navigate(l.u)}
                  style={{
                    background: basePath === l.u ? C.goldBg : 'none',
                    border: `1px solid ${basePath === l.u ? C.goldBorder : 'transparent'}`,
                    borderRadius: '8px',
                    padding: '6px 14px',
                    color: basePath === l.u ? C.gold : C.textMid,
                    fontSize: '14px',
                    fontWeight: basePath === l.u ? 700 : 500,
                    cursor: 'pointer',
                    fontFamily: F,
                    transition: 'all .15s',
                  }}
                  onMouseEnter={(e) => { if (basePath !== l.u) e.currentTarget.style.background = '#f5f5f5'; }}
                  onMouseLeave={(e) => { if (basePath !== l.u) e.currentTarget.style.background = 'none'; }}
                >
                  {l.l}
                </button>
              ))}
            </div>
          )}

          {lg && <div style={{ flex: 1 }} />}

          {/* Search — desktop only */}
          {!lg && (
            <div style={{ position: 'relative' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '260px', background: '#f4f4f8', border: `1.5px solid ${searchOpen ? C.gold : 'transparent'}`, borderRadius: '12px', padding: '0 12px', height: '38px', transition: 'border-color .2s, box-shadow .2s', boxShadow: searchOpen ? `0 0 0 3px ${C.goldBg}` : 'none' }}>
                <svg width="14" height="14" fill="none" stroke={searchOpen ? C.gold : C.textLight} strokeWidth="2" viewBox="0 0 24 24" style={{ flexShrink: 0, transition: 'stroke .2s' }}>
                  <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
                </svg>
                <input
                  value={searchQ}
                  onChange={(e) => { setSearchQ(e.target.value); setSearchOpen(true); }}
                  onFocus={() => setSearchOpen(true)}
                  onBlur={() => setTimeout(() => setSearchOpen(false), 150)}
                  placeholder="Parfüm veya marka ara..."
                  style={{ flex: 1, border: 'none', outline: 'none', fontSize: '13px', color: C.text, background: 'transparent', fontFamily: F }}
                />
                {searchQ ? (
                  <button onClick={() => setSearchQ('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.textLight, fontSize: '16px', lineHeight: 1, padding: 0, display: 'flex', alignItems: 'center' }}>×</button>
                ) : null}
              </div>

              {searchOpen && (searchQ.length > 1) && (
                <div className="fade-in" style={{ position: 'absolute', right: 0, top: 'calc(100% + 6px)', width: '320px', background: C.card, border: `1px solid ${C.border}`, borderRadius: '14px', boxShadow: C.shadowMd, zIndex: 300, overflow: 'hidden' }}>
                  {filtered.length > 0 ? (
                    <>
                      <div style={{ padding: '8px 14px 4px', fontSize: '11px', fontWeight: 700, color: C.textLight, letterSpacing: '.06em' }}>SONUÇLAR</div>
                      {filtered.map((item, i) => (
                        <div
                          key={i}
                          onMouseDown={() => { navigate(item.url); setSearchOpen(false); setSearchQ(''); }}
                          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 14px', cursor: 'pointer', gap: '10px' }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = C.goldBg)}
                          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                            <span style={{ fontSize: '14px', flexShrink: 0 }}>{item.type === 'Parfüm' ? '🧴' : '🏷️'}</span>
                            <span style={{ fontSize: '13px', color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.label}</span>
                          </div>
                          <Badge color={item.type === 'Parfüm' ? 'gold' : 'blue'}>{item.type}</Badge>
                        </div>
                      ))}
                    </>
                  ) : (
                    <div style={{ padding: '20px', textAlign: 'center', color: C.textLight, fontSize: '13px' }}>
                      <div style={{ fontSize: '24px', marginBottom: '6px' }}>🔍</div>
                      "<strong>{searchQ}</strong>" için sonuç bulunamadı
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* User Menu — desktop only */}
          {!lg && user && (
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', background: C.goldBg, border: `1px solid ${C.goldBorder}`, borderRadius: '10px', padding: '6px 12px 6px 8px', cursor: 'pointer' }}
              >
                <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: `linear-gradient(135deg,${C.gold},${C.goldLight})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', color: '#fff', fontWeight: 700, overflow: 'hidden', flexShrink: 0 }}>
                  {user.photoURL
                    ? <img src={user.photoURL} alt={user.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                    : user.name?.[0]?.toUpperCase()
                  }
                </div>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: C.text, lineHeight: 1.2 }}>{user.name}</div>
                  <div style={{ fontSize: '11px', color: C.gold }}>{roleLabel[user.role]}</div>
                </div>
                <svg width="11" height="11" fill="none" stroke={C.textLight} strokeWidth="2" viewBox="0 0 24 24"><path d="m6 9 6 6 6-6" /></svg>
              </button>
              {menuOpen && (
                <div className="fade-in" style={{ position: 'absolute', right: 0, top: 'calc(100% + 8px)', background: C.card, border: `1px solid ${C.border}`, borderRadius: '14px', minWidth: '180px', boxShadow: C.shadowMd, overflow: 'hidden', zIndex: 300 }}>
                  {[{ l: 'Profilim', u: '/profil' }, { l: 'Favorilerim', u: '/profil?tab=favorites' }, { l: 'Yorumlarım', u: '/profil?tab=reviews' }].map(({ l, u }) => (
                    <button key={u} onClick={() => { navigate(u); setMenuOpen(false); }}
                      style={{ display: 'block', width: '100%', padding: '11px 16px', background: 'none', border: 'none', textAlign: 'left', fontSize: '14px', color: C.text, cursor: 'pointer', fontFamily: F }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = C.goldBg)}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}>{l}</button>
                  ))}
                  <div style={{ height: '1px', background: C.border, margin: '4px 0' }} />
                  <button onClick={() => { logout(); navigate('/'); setMenuOpen(false); }}
                    style={{ display: 'block', width: '100%', padding: '11px 16px', background: 'none', border: 'none', textAlign: 'left', fontSize: '14px', color: C.red, cursor: 'pointer', fontFamily: F }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = C.redBg)}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}>Çıkış Yap</button>
                </div>
              )}
            </div>
          )}

          {/* Desktop — not logged in */}
          {!lg && !user && (
            <div style={{ display: 'flex', gap: '8px' }}>
              <Btn variant="secondary" size="sm" onClick={() => navigate('/giris')}>Giriş Yap</Btn>
              <Btn size="sm" onClick={() => navigate('/kayit')}>Üye Ol</Btn>
            </div>
          )}

          {/* Mobile — hamburger */}
          {lg && (
            <button
              onClick={() => setMobileOpen(true)}
              style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#f4f4f8', border: `1px solid ${C.border}`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '5px', cursor: 'pointer', flexShrink: 0 }}
            >
              <span style={{ width: '18px', height: '2px', background: C.navy, borderRadius: '2px', display: 'block' }} />
              <span style={{ width: '18px', height: '2px', background: C.navy, borderRadius: '2px', display: 'block' }} />
              <span style={{ width: '18px', height: '2px', background: C.navy, borderRadius: '2px', display: 'block' }} />
            </button>
          )}
        </div>
      </nav>

      {/* Mobile drawer overlay */}
      {lg && mobileOpen && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 500, background: 'rgba(0,0,0,.45)' }}
          onClick={() => setMobileOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ position: 'absolute', top: 0, right: 0, width: '280px', height: '100%', background: C.card, boxShadow: C.shadowLg, display: 'flex', flexDirection: 'column' }}
          >
            {/* Drawer header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 20px', borderBottom: `1px solid ${C.border}` }}>
              <span style={{ fontSize: '16px', fontWeight: 900, color: C.navy }}>muadilci</span>
              <button onClick={() => setMobileOpen(false)} style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#f4f4f8', border: 'none', fontSize: '18px', cursor: 'pointer', color: C.textMid, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
            </div>

            {/* Search */}
            <div style={{ padding: '14px 20px', borderBottom: `1px solid ${C.border}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#f4f4f8', border: `1px solid ${C.border}`, borderRadius: '10px', padding: '0 12px', height: '38px' }}>
                <svg width="14" height="14" fill="none" stroke={C.textLight} strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /></svg>
                <input
                  value={searchQ}
                  onChange={(e) => setSearchQ(e.target.value)}
                  placeholder="Ara..."
                  style={{ flex: 1, border: 'none', outline: 'none', fontSize: '14px', color: C.text, background: 'transparent', fontFamily: F }}
                />
              </div>
              {searchQ.length > 1 && filtered.length > 0 && (
                <div style={{ marginTop: '8px', border: `1px solid ${C.border}`, borderRadius: '10px', overflow: 'hidden' }}>
                  {filtered.map((item, i) => (
                    <div key={i} onMouseDown={() => { handleNav(item.url); setSearchQ(''); }}
                      style={{ padding: '10px 12px', fontSize: '13px', color: C.text, cursor: 'pointer', borderBottom: i < filtered.length - 1 ? `1px solid ${C.borderLight}` : 'none' }}>
                      {item.label}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Nav links */}
            <div style={{ flex: 1, padding: '10px 12px', overflowY: 'auto' }}>
              {navLinks.map((l) => (
                <button key={l.u} onClick={() => handleNav(l.u)}
                  style={{ display: 'block', width: '100%', padding: '12px 14px', borderRadius: '10px', border: 'none', background: basePath === l.u ? C.goldBg : 'transparent', color: basePath === l.u ? C.gold : C.text, fontSize: '15px', fontWeight: basePath === l.u ? 700 : 500, cursor: 'pointer', textAlign: 'left', fontFamily: F, marginBottom: '2px' }}>
                  {l.l}
                </button>
              ))}
            </div>

            {/* User section */}
            <div style={{ padding: '14px 20px', borderTop: `1px solid ${C.border}` }}>
              {user ? (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: `linear-gradient(135deg,${C.gold},${C.goldLight})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', color: '#fff', fontWeight: 700, flexShrink: 0, overflow: 'hidden' }}>
                      {user.photoURL
                        ? <img src={user.photoURL} alt={user.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                        : user.name?.[0]?.toUpperCase()
                      }
                    </div>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 700, color: C.text }}>{user.name}</div>
                      <div style={{ fontSize: '12px', color: C.gold }}>{roleLabel[user.role]}</div>
                    </div>
                  </div>
                  <button onClick={() => handleNav('/profil')} style={{ display: 'block', width: '100%', padding: '10px 14px', borderRadius: '10px', border: 'none', background: '#f4f4f8', color: C.text, fontSize: '14px', cursor: 'pointer', textAlign: 'left', fontFamily: F, marginBottom: '6px' }}>Profilim</button>
                  <button onClick={() => { logout(); handleNav('/'); }} style={{ display: 'block', width: '100%', padding: '10px 14px', borderRadius: '10px', border: 'none', background: C.redBg, color: C.red, fontSize: '14px', cursor: 'pointer', textAlign: 'left', fontFamily: F }}>Çıkış Yap</button>
                </>
              ) : (
                <div style={{ display: 'flex', gap: '8px' }}>
                  <Btn variant="secondary" style={{ flex: 1, justifyContent: 'center' }} onClick={() => handleNav('/giris')}>Giriş Yap</Btn>
                  <Btn style={{ flex: 1, justifyContent: 'center' }} onClick={() => handleNav('/kayit')}>Üye Ol</Btn>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
