import { useState, useEffect } from 'react';
import { useRouter } from '@/contexts/RouterContext';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { useW } from '@/hooks/useW';
import { Badge } from '@/components/ui/Badge';
import { C, F, FH } from '@/constants/theme';
import logoDark from '@/img/logos/logo-dark-minified.png';
import noImage from '@/img/no-image.jpg';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRightToBracket, faUserPlus, faBars } from '@fortawesome/free-solid-svg-icons';

export function Navbar() {
  const { navigate, basePath } = useRouter();
  const { user, logout, isAdmin, isMod } = useAuth();
  const { perfumes, brands } = useData();
  const { lg } = useW();

  const [scrolled,    setScrolled]    = useState(false);
  const [menuOpen,    setMenuOpen]    = useState(false);
  const [mobileOpen,  setMobileOpen]  = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [searchOpen,  setSearchOpen]  = useState(false);
  const [searchQ,     setSearchQ]     = useState('');

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const navLinks = [
    { l: 'Parfümler', u: '/parfumler' },
    { l: 'Markalar',  u: '/markalar' },
    { l: 'Karşılaştır', u: '/karsilastir' },
    { l: 'En İyiler', u: '/en-iyiler' },
  ];
  if (isMod)   navLinks.push({ l: 'Moderasyon', u: '/moderasyon' });
  if (isAdmin) navLinks.push({ l: 'Yönetim',    u: '/admin' });

  const searchItems = [
    ...perfumes.map(p => ({ label: `${p.name} — ${p.brandName}`, url: `/${p.brandSlug}/${p.slug}`, type: 'Parfüm', image: p.image || '' })),
    ...brands.map(b   => ({ label: b.name, url: `/marka/${b.slug}`,           type: 'Marka',  image: b.logoImage || '' })),
  ];
  const filtered = searchQ.length > 1
    ? searchItems.filter(i => i.label.toLowerCase().includes(searchQ.toLowerCase())).slice(0, 6)
    : [];

  const roleLabel = { admin: 'Admin', moderator: 'Moderatör', user: 'Üye' };

  const openDrawer  = () => { setMobileOpen(true);  setTimeout(() => setDrawerVisible(true),  16); };
  const closeDrawer = () => { setDrawerVisible(false); setTimeout(() => setMobileOpen(false), 480); };
  const handleNav   = (u) => { navigate(u); closeDrawer(); setMenuOpen(false); };

  return (
    <>
      {/* ── Main nav ─────────────────────────────────────────────────── */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 200,
        background: scrolled ? 'rgba(250,250,248,0.97)' : '#FAFAF8',
        borderBottom: `1px solid ${scrolled ? C.border : C.borderLight}`,
        backdropFilter: scrolled ? 'blur(12px) saturate(160%)' : 'none',
        transition: 'background 0.3s, border-color 0.3s, backdrop-filter 0.3s',
      }}>
        <div style={{
          maxWidth: '1280px', margin: '0 auto',
          padding: lg ? '0 20px' : '0 48px',
          height: '96px',
          display: 'flex', alignItems: 'center', gap: '32px',
        }}>

          {/* Logo */}
          <a
            href="/#/"
            onClick={e => { e.preventDefault(); navigate('/'); }}
            style={{ flexShrink: 0, textDecoration: 'none', display: 'flex', alignItems: 'center' }}
          >
            <img src={logoDark} alt="muadilci" style={{ height: '68px', width: 'auto' }} />
          </a>

          {/* Desktop nav links */}
          {!lg && (
            <div style={{ display: 'flex', gap: '2px', flex: 1 }}>
              {navLinks.map(link => {
                const isActive = basePath === link.u;
                return (
                  <button
                    key={link.u}
                    onClick={() => navigate(link.u)}
                    style={{
                      background: 'none',
                      border: 'none',
                      padding: '6px 14px',
                      fontSize: '14px',
                      fontWeight: isActive ? 600 : 400,
                      color: isActive ? C.gold : C.textMid,
                      cursor: 'pointer',
                      fontFamily: F,
                      letterSpacing: isActive ? '0' : '0.01em',
                      position: 'relative',
                      transition: 'color 0.2s',
                    }}
                    onMouseEnter={e => { if (!isActive) e.currentTarget.style.color = C.text; }}
                    onMouseLeave={e => { if (!isActive) e.currentTarget.style.color = C.textMid; }}
                  >
                    {link.l}
                    {isActive && (
                      <span style={{
                        position: 'absolute', bottom: 0, left: '14px', right: '14px',
                        height: '1px', background: C.gold, borderRadius: '1px',
                      }} />
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {lg && <div style={{ flex: 1 }} />}

          {/* Desktop search */}
          {!lg && (
            <div style={{ position: 'relative' }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                width: '240px', height: '36px',
                background: C.surface, border: `1px solid ${searchOpen ? C.gold : C.border}`,
                borderRadius: '8px', padding: '0 12px',
                transition: 'border-color 0.2s, box-shadow 0.2s',
                boxShadow: searchOpen ? `0 0 0 3px ${C.goldBg}` : 'none',
              }}>
                <svg width="13" height="13" fill="none" stroke={searchOpen ? C.gold : C.textLight} strokeWidth="2" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
                  <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
                </svg>
                <input
                  value={searchQ}
                  onChange={e => { setSearchQ(e.target.value); setSearchOpen(true); }}
                  onFocus={() => setSearchOpen(true)}
                  onBlur={() => setTimeout(() => setSearchOpen(false), 150)}
                  placeholder="Parfüm veya marka ara..."
                  style={{ flex: 1, border: 'none', outline: 'none', fontSize: '13px', color: C.text, background: 'transparent', fontFamily: F }}
                />
                {searchQ && (
                  <button onClick={() => setSearchQ('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.textLight, fontSize: '16px', lineHeight: 1, padding: 0 }}>×</button>
                )}
              </div>

              {searchOpen && searchQ.length > 1 && (
                <div className="scale-in" style={{
                  position: 'absolute', right: 0, top: 'calc(100% + 6px)', width: '320px',
                  background: C.card, border: `1px solid ${C.border}`,
                  borderRadius: '12px', boxShadow: C.shadowMd, zIndex: 300, overflow: 'hidden',
                }}>
                  {filtered.length > 0 ? (
                    <>
                      <div style={{ padding: '10px 14px 4px', fontSize: '10px', fontWeight: 600, color: C.textMuted, letterSpacing: '.1em', textTransform: 'uppercase' }}>Sonuçlar</div>
                      {filtered.map((item, i) => (
                        <div
                          key={i}
                          onMouseDown={() => { navigate(item.url); setSearchOpen(false); setSearchQ(''); }}
                          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 14px', cursor: 'pointer', gap: '10px', transition: 'background 0.15s' }}
                          onMouseEnter={e => e.currentTarget.style.background = C.goldBg}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                            <div style={{ width: '30px', height: '30px', borderRadius: item.type === 'Marka' ? '50%' : '6px', overflow: 'hidden', flexShrink: 0, background: C.surface, border: `1px solid ${C.border}` }}>
                              <img src={item.image || noImage} alt={item.label} onError={e => { e.currentTarget.src = noImage; }} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            </div>
                            <span style={{ fontSize: '13px', color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.label}</span>
                          </div>
                          <Badge color={item.type === 'Parfüm' ? 'gold' : 'blue'}>{item.type}</Badge>
                        </div>
                      ))}
                    </>
                  ) : (
                    <div style={{ padding: '20px', textAlign: 'center', color: C.textLight, fontSize: '13px' }}>
                      "<strong>{searchQ}</strong>" için sonuç bulunamadı
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Desktop user menu */}
          {!lg && user && (
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: `1px solid ${C.border}`, borderRadius: '8px', padding: '5px 10px 5px 6px', cursor: 'pointer', transition: 'border-color 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.borderColor = C.gold}
                onMouseLeave={e => e.currentTarget.style.borderColor = C.border}
              >
                <div style={{ width: '26px', height: '26px', borderRadius: '50%', background: `linear-gradient(135deg,${C.gold},${C.goldLight})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', color: '#fff', fontWeight: 600, overflow: 'hidden', flexShrink: 0 }}>
                  {user.photoURL
                    ? <img src={user.photoURL} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { e.currentTarget.style.display = 'none'; }} />
                    : user.name?.[0]?.toUpperCase()}
                </div>
                <span style={{ fontSize: '13px', fontWeight: 500, color: C.text, fontFamily: F }}>{user.name}</span>
                <svg width="10" height="10" fill="none" stroke={C.textLight} strokeWidth="2" viewBox="0 0 24 24"><path d="m6 9 6 6 6-6" /></svg>
              </button>

              {menuOpen && (
                <div className="fade-in" style={{ position: 'absolute', right: 0, top: 'calc(100% + 6px)', background: C.card, border: `1px solid ${C.border}`, borderRadius: '12px', minWidth: '176px', boxShadow: C.shadowMd, overflow: 'hidden', zIndex: 300 }}>
                  {[
                    { l: 'Profilim',     u: '/profil' },
                    { l: 'Favorilerim',  u: '/profil?tab=favorites' },
                    { l: 'Yorumlarım',   u: '/profil?tab=reviews' },
                  ].map(({ l, u }) => (
                    <button key={u} onClick={() => { navigate(u); setMenuOpen(false); }}
                      style={{ display: 'block', width: '100%', padding: '10px 16px', background: 'none', border: 'none', textAlign: 'left', fontSize: '13px', color: C.text, cursor: 'pointer', fontFamily: F }}
                      onMouseEnter={e => e.currentTarget.style.background = C.goldBg}
                      onMouseLeave={e => e.currentTarget.style.background = 'none'}>{l}</button>
                  ))}
                  <div style={{ height: '1px', background: C.borderLight }} />
                  <button onClick={() => { logout(); navigate('/'); setMenuOpen(false); }}
                    style={{ display: 'block', width: '100%', padding: '10px 16px', background: 'none', border: 'none', textAlign: 'left', fontSize: '13px', color: C.red, cursor: 'pointer', fontFamily: F }}
                    onMouseEnter={e => e.currentTarget.style.background = C.redBg}
                    onMouseLeave={e => e.currentTarget.style.background = 'none'}>Çıkış Yap</button>
                </div>
              )}
            </div>
          )}

          {/* Desktop auth buttons */}
          {!lg && !user && (
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <button
                onClick={() => navigate('/giris')}
                style={{
                  background: 'none',
                  border: `1px solid ${C.border}`,
                  padding: '8px 18px',
                  borderRadius: '10px',
                  fontSize: '13px',
                  fontWeight: 500,
                  color: C.textMid,
                  cursor: 'pointer',
                  fontFamily: F,
                  display: 'flex', alignItems: 'center', gap: '7px',
                  transition: 'color 0.2s, border-color 0.2s',
                  letterSpacing: '0.02em',
                }}
                onMouseEnter={e => { e.currentTarget.style.color = C.gold; e.currentTarget.style.borderColor = C.gold; }}
                onMouseLeave={e => { e.currentTarget.style.color = C.textMid; e.currentTarget.style.borderColor = C.border; }}
              >
                <FontAwesomeIcon icon={faRightToBracket} style={{ fontSize: '12px' }} />
                Giriş Yap
              </button>
              <button
                onClick={() => navigate('/kayit')}
                style={{
                  background: `linear-gradient(135deg, ${C.text} 0%, #2a2218 100%)`,
                  border: 'none',
                  padding: '8px 20px',
                  borderRadius: '10px',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: '#fff',
                  cursor: 'pointer',
                  fontFamily: F,
                  display: 'flex', alignItems: 'center', gap: '7px',
                  transition: 'background 0.2s, transform 0.15s, box-shadow 0.2s',
                  letterSpacing: '0.02em',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = `linear-gradient(135deg, ${C.gold} 0%, ${C.goldLight} 100%)`; e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = `0 4px 16px rgba(184,147,90,0.3)`; }}
                onMouseLeave={e => { e.currentTarget.style.background = `linear-gradient(135deg, ${C.text} 0%, #2a2218 100%)`; e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)'; }}
              >
                <FontAwesomeIcon icon={faUserPlus} style={{ fontSize: '12px' }} />
                Üye Ol
              </button>
            </div>
          )}

          {/* Mobile hamburger */}
          {lg && (
            <button
              onClick={() => openDrawer()}
              style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'none', border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, color: C.text, transition: 'border-color 0.2s, color 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = C.gold; e.currentTarget.style.color = C.gold; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.text; }}
            >
              <FontAwesomeIcon icon={faBars} style={{ fontSize: '15px' }} />
            </button>
          )}
        </div>
      </nav>

      {/* ── Mobile drawer ────────────────────────────────────────────── */}
      {lg && mobileOpen && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 500, background: drawerVisible ? 'rgba(0,0,0,.35)' : 'rgba(0,0,0,0)', backdropFilter: drawerVisible ? 'blur(4px)' : 'none', transition: 'background 0.3s, backdrop-filter 0.3s' }}
          onClick={() => closeDrawer()}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{ position: 'absolute', top: 0, right: 0, width: '280px', height: '100%', background: C.card, boxShadow: C.shadowLg, display: 'flex', flexDirection: 'column', transform: drawerVisible ? 'translateX(0)' : 'translateX(100%)', transition: 'transform 0.48s cubic-bezier(0.22,1,0.36,1)' }}
          >
            {/* Drawer header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 20px', borderBottom: `1px solid ${C.border}` }}>
              <img src={logoDark} alt="muadilci" style={{ height: '32px', width: 'auto' }} />
              <button onClick={() => closeDrawer()} style={{ width: '34px', height: '34px', borderRadius: '8px', background: C.surface, border: `1px solid ${C.border}`, cursor: 'pointer', color: C.textMid, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, lineHeight: 1, transition: 'color 0.2s, border-color 0.2s' }}
                onMouseEnter={e => { e.currentTarget.style.color = C.text; e.currentTarget.style.borderColor = C.text; }}
                onMouseLeave={e => { e.currentTarget.style.color = C.textMid; e.currentTarget.style.borderColor = C.border; }}
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M1 1L11 11M11 1L1 11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                </svg>
              </button>
            </div>

            {/* Mobile search */}
            <div style={{ padding: '14px 20px', borderBottom: `1px solid ${C.border}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: C.surface, border: `1px solid ${C.border}`, borderRadius: '8px', padding: '0 12px', height: '38px' }}>
                <svg width="13" height="13" fill="none" stroke={C.textLight} strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /></svg>
                <input value={searchQ} onChange={e => setSearchQ(e.target.value)} placeholder="Ara..." style={{ flex: 1, border: 'none', outline: 'none', fontSize: '14px', color: C.text, background: 'transparent', fontFamily: F }} />
              </div>
              {searchQ.length > 1 && filtered.length > 0 && (
                <div style={{ marginTop: '8px', border: `1px solid ${C.border}`, borderRadius: '8px', overflow: 'hidden' }}>
                  {filtered.map((item, i) => (
                    <div key={i} onMouseDown={() => { handleNav(item.url); setSearchQ(''); }}
                      style={{ padding: '10px 12px', fontSize: '13px', color: C.text, cursor: 'pointer', borderBottom: i < filtered.length - 1 ? `1px solid ${C.borderLight}` : 'none' }}>
                      {item.label}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Mobile nav links */}
            <div style={{ flex: 1, padding: '10px 12px', overflowY: 'auto' }}>
              {navLinks.map(link => (
                <button key={link.u} onClick={() => handleNav(link.u)}
                  style={{ display: 'block', width: '100%', padding: '12px 14px', borderRadius: '8px', border: 'none', background: basePath === link.u ? C.goldBg : 'transparent', color: basePath === link.u ? C.gold : C.text, fontSize: '15px', fontWeight: basePath === link.u ? 600 : 400, cursor: 'pointer', textAlign: 'left', fontFamily: F, marginBottom: '2px' }}>
                  {link.l}
                </button>
              ))}
            </div>

            {/* Mobile user section */}
            <div style={{ padding: '14px 20px', borderTop: `1px solid ${C.border}` }}>
              {user ? (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                    <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: `linear-gradient(135deg,${C.gold},${C.goldLight})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', color: '#fff', fontWeight: 600, flexShrink: 0, overflow: 'hidden' }}>
                      {user.photoURL ? <img src={user.photoURL} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { e.currentTarget.style.display = 'none'; }} /> : user.name?.[0]?.toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 600, color: C.text }}>{user.name}</div>
                      <div style={{ fontSize: '12px', color: C.gold }}>{roleLabel[user.role]}</div>
                    </div>
                  </div>
                  <button onClick={() => handleNav('/profil')} style={{ display: 'block', width: '100%', padding: '10px 14px', borderRadius: '8px', border: `1px solid ${C.border}`, background: C.surface, color: C.text, fontSize: '14px', cursor: 'pointer', textAlign: 'left', fontFamily: F, marginBottom: '6px' }}>Profilim</button>
                  <button onClick={() => { logout(); handleNav('/'); }} style={{ display: 'block', width: '100%', padding: '10px 14px', borderRadius: '8px', border: 'none', background: C.redBg, color: C.red, fontSize: '14px', cursor: 'pointer', textAlign: 'left', fontFamily: F }}>Çıkış Yap</button>
                </>
              ) : (
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => handleNav('/giris')} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: `1px solid ${C.border}`, background: C.surface, color: C.text, fontSize: '14px', fontWeight: 500, cursor: 'pointer', fontFamily: F }}>Giriş Yap</button>
                  <button onClick={() => handleNav('/kayit')} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', background: C.text, color: '#fff', fontSize: '14px', fontWeight: 600, cursor: 'pointer', fontFamily: F }}>Üye Ol</button>
                </div>
              )}
            </div>

            {/* Instagram */}
            <div style={{ padding: '12px 20px 20px', borderTop: `1px solid ${C.border}` }}>
              <a
                href="https://www.instagram.com/muadilciapp"
                target="_blank"
                rel="noopener noreferrer"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: C.textLight, fontSize: '13px', fontFamily: F, fontWeight: 500, textDecoration: 'none', transition: 'color 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.color = C.gold}
                onMouseLeave={e => e.currentTarget.style.color = C.textLight}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
                </svg>
                @muadilciapp
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
