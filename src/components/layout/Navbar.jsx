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
import { faRightToBracket, faUserPlus, faBars, faBell, faCheck, faXmark } from '@fortawesome/free-solid-svg-icons';

export function Navbar() {
  const { navigate, basePath } = useRouter();
  const { user, logout, isAdmin, isMod } = useAuth();
  const { perfumes, brands, muadilPerfumes, comments, notifications, unreadNotifCount, notifHasMore, markNotificationRead, markAllNotificationsRead, loadMoreNotifications, clearAllNotifications } = useData();
  const { lg } = useW();

  const [scrolled,       setScrolled]       = useState(false);
  const [menuOpen,       setMenuOpen]       = useState(false);
  const [mobileOpen,     setMobileOpen]     = useState(false);
  const [drawerVisible,  setDrawerVisible]  = useState(false);
  const [searchOpen,     setSearchOpen]     = useState(false);
  const [searchQ,        setSearchQ]        = useState('');
  const [notifOpen,      setNotifOpen]      = useState(false);
  const [confirmClear,   setConfirmClear]   = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!notifOpen) { setConfirmClear(false); return; }
    const close = (e) => {
      if (!e.target.closest('[data-notif-root]')) setNotifOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [notifOpen]);

  useEffect(() => {
    if (!menuOpen) return;
    const close = (e) => {
      if (!e.target.closest('[data-menu-root]')) setMenuOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [menuOpen]);

  const pendingCount = comments.filter((c) => c.status === 'pending' || c.status === 'pending_update').length;

  const navLinks = [
    { l: 'Parfümler',   u: '/parfumler' },
    { l: 'Markalar',    u: '/markalar' },
    { l: 'Karşılaştır', u: '/karsilastir' },
    { l: 'En İyiler',   u: '/en-iyiler' },
  ];
  if (isMod)   navLinks.push({ l: 'Moderasyon', u: '/moderasyon', badge: pendingCount });
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
      <nav
        className="sticky top-0 z-[200] transition-[background,border-color,backdrop-filter] duration-300"
        style={{
          background: scrolled ? 'rgba(250,250,248,0.97)' : '#FAFAF8',
          borderBottom: `1px solid ${scrolled ? C.border : C.borderLight}`,
          backdropFilter: scrolled ? 'blur(12px) saturate(160%)' : 'none',
        }}
      >
        <div
          className="max-w-[1280px] mx-auto h-24 flex items-center gap-8"
          style={{ padding: lg ? '0 20px' : '0 48px' }}
        >

          {/* Logo */}
          <a
            href="/#/"
            onClick={e => { e.preventDefault(); navigate('/'); }}
            className="shrink-0 no-underline flex items-center"
          >
            <img src={logoDark} alt="muadilci" className="h-[68px] w-auto" />
          </a>

          {/* Desktop nav links */}
          {!lg && (
            <div className="flex gap-[2px] flex-1">
              {navLinks.map(link => {
                const isActive = basePath === link.u;
                return (
                  <a
                    key={link.u}
                    href={`/#${link.u}`}
                    onClick={e => { e.preventDefault(); navigate(link.u); }}
                    className="relative inline-flex items-center no-underline px-[14px] py-[6px] text-[14px] transition-[color] duration-200 bg-transparent border-none cursor-pointer"
                    style={{
                      fontWeight: isActive ? 600 : 400,
                      color: isActive ? C.gold : C.textMid,
                      fontFamily: F,
                      letterSpacing: isActive ? '0' : '0.01em',
                    }}
                    onMouseEnter={e => { if (!isActive) e.currentTarget.style.color = C.text; }}
                    onMouseLeave={e => { if (!isActive) e.currentTarget.style.color = C.textMid; }}
                  >
                    {link.l}
                    {link.badge > 0 && (
                      <span
                        className="absolute top-[-2px] right-[2px] inline-flex items-center justify-center min-w-[16px] h-4 rounded-[8px] text-white text-[9px] font-bold px-1 leading-none"
                        style={{ background: C.gold }}
                      >
                        {link.badge > 99 ? '99+' : link.badge}
                      </span>
                    )}
                    {isActive && (
                      <span
                        className="absolute bottom-0 left-[14px] right-[14px] h-px rounded-[1px]"
                        style={{ background: C.gold }}
                      />
                    )}
                  </a>
                );
              })}
            </div>
          )}

          {lg && <div className="flex-1" />}

          {/* Desktop search */}
          {!lg && (
            <div className="relative">
              <div
                className="flex items-center gap-2 w-[240px] h-9 rounded-[8px] px-3 transition-[border-color,box-shadow] duration-200"
                style={{
                  background: C.surface,
                  border: `1px solid ${searchOpen ? C.gold : C.border}`,
                  boxShadow: searchOpen ? `0 0 0 3px ${C.goldBg}` : 'none',
                }}
              >
                <svg width="13" height="13" fill="none" stroke={searchOpen ? C.gold : C.textLight} strokeWidth="2" viewBox="0 0 24 24" className="shrink-0">
                  <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
                </svg>
                <input
                  value={searchQ}
                  onChange={e => { setSearchQ(e.target.value); setSearchOpen(true); }}
                  onFocus={() => setSearchOpen(true)}
                  onBlur={() => setTimeout(() => setSearchOpen(false), 150)}
                  placeholder="Parfüm veya marka ara..."
                  className="flex-1 border-none outline-none text-[13px] bg-transparent"
                  style={{ color: C.text, fontFamily: F }}
                />
                {searchQ && (
                  <button
                    onClick={() => setSearchQ('')}
                    className="bg-transparent border-none cursor-pointer text-base leading-none p-0"
                    style={{ color: C.textLight }}
                  >
                    ×
                  </button>
                )}
              </div>

              {searchOpen && searchQ.length > 1 && (
                <div
                  className="scale-in absolute right-0 top-[calc(100%+6px)] w-[320px] rounded-[12px] z-[300] overflow-hidden"
                  style={{ background: C.card, border: `1px solid ${C.border}`, boxShadow: C.shadowMd }}
                >
                  {filtered.length > 0 ? (
                    <>
                      <div
                        className="px-[14px] pt-[10px] pb-1 text-[10px] font-semibold uppercase tracking-[.1em]"
                        style={{ color: C.textMuted }}
                      >
                        Sonuçlar
                      </div>
                      {filtered.map((item, i) => (
                        <div
                          key={i}
                          onMouseDown={() => { navigate(item.url); setSearchOpen(false); setSearchQ(''); }}
                          className="flex justify-between items-center px-[14px] py-[9px] cursor-pointer gap-[10px] transition-[background] duration-150"
                          onMouseEnter={e => e.currentTarget.style.background = C.goldBg}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                        >
                          <div className="flex items-center gap-[10px] min-w-0">
                            <div
                              className="w-[30px] h-[30px] overflow-hidden shrink-0"
                              style={{
                                borderRadius: item.type === 'Marka' ? '50%' : '6px',
                                background: C.surface,
                                border: `1px solid ${C.border}`,
                              }}
                            >
                              <img src={item.image || noImage} alt={item.label} onError={e => { e.currentTarget.src = noImage; }} className="w-full h-full object-cover" />
                            </div>
                            <span
                              className="text-[13px] overflow-hidden text-ellipsis whitespace-nowrap"
                              style={{ color: C.text }}
                            >
                              {item.label}
                            </span>
                          </div>
                          <Badge color={item.type === 'Parfüm' ? 'gold' : 'blue'}>{item.type}</Badge>
                        </div>
                      ))}
                    </>
                  ) : (
                    <div className="p-5 text-center text-[13px]" style={{ color: C.textLight }}>
                      "<strong>{searchQ}</strong>" için sonuç bulunamadı
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Desktop bildirim zili */}
          {!lg && user && !isAdmin && (
            <div data-notif-root className="relative">
              <button
                onClick={() => { setNotifOpen(!notifOpen); setMenuOpen(false); if (!notifOpen && unreadNotifCount > 0) markAllNotificationsRead(); }}
                className="relative bg-transparent rounded-[8px] w-9 h-9 flex items-center justify-center cursor-pointer transition-[color,border-color] duration-200"
                style={{
                  border: `1px solid ${notifOpen ? C.gold : C.border}`,
                  color: notifOpen ? C.gold : C.textMid,
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = C.gold; e.currentTarget.style.color = C.gold; }}
                onMouseLeave={e => { if (!notifOpen) { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.textMid; } }}
              >
                <FontAwesomeIcon icon={faBell} className="text-[13px]" />
                {unreadNotifCount > 0 && (
                  <span
                    className="absolute top-[-6px] right-[-6px] min-w-[18px] h-[18px] rounded-[9px] text-white text-[11px] font-bold flex items-center justify-center px-1 border-2 border-[#FAFAF8]"
                    style={{ background: C.gold }}
                  >
                    {unreadNotifCount > 9 ? '9+' : unreadNotifCount}
                  </span>
                )}
              </button>

              {notifOpen && (
                <div
                  className="fade-in absolute right-0 top-[calc(100%+6px)] rounded-[12px] w-[320px] z-[300] overflow-hidden flex flex-col"
                  style={{ background: C.card, border: `1px solid ${C.border}`, boxShadow: C.shadowMd }}
                >
                  <div
                    className="px-[14px] py-[10px] flex items-center justify-between gap-2 min-h-[44px]"
                    style={{ borderBottom: `1px solid ${C.border}` }}
                  >
                    <span className="text-[13px] font-bold shrink-0" style={{ color: C.text }}>Bildirimler</span>
                    {notifications.length > 0 && !confirmClear && (
                      <button
                        onClick={() => setConfirmClear(true)}
                        className="bg-transparent border-none text-[11px] cursor-pointer font-semibold shrink-0"
                        style={{ color: C.red, fontFamily: F }}
                      >
                        Tümünü Temizle
                      </button>
                    )}
                    {confirmClear && (
                      <div className="flex items-center gap-[6px] flex-1 justify-end">
                        <span className="text-[11px] font-medium" style={{ color: C.red }}>Geri alınamaz!</span>
                        <button
                          onClick={() => { clearAllNotifications(); setConfirmClear(false); }}
                          className="border-none rounded-[5px] px-2 py-[3px] text-[11px] font-bold text-white cursor-pointer"
                          style={{ background: C.red, fontFamily: F }}
                        >
                          Evet
                        </button>
                        <button
                          onClick={() => setConfirmClear(false)}
                          className="rounded-[5px] px-2 py-[3px] text-[11px] cursor-pointer"
                          style={{ background: C.surface, border: `1px solid ${C.border}`, color: C.textMid, fontFamily: F }}
                        >
                          İptal
                        </button>
                      </div>
                    )}
                  </div>
                  <div
                    className="overflow-y-auto h-[280px]"
                    onScroll={(e) => {
                      const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
                      if (scrollTop + clientHeight >= scrollHeight - 20 && notifHasMore) loadMoreNotifications();
                    }}
                  >
                    {notifications.length === 0 ? (
                      <div className="px-4 py-8 text-center text-[13px]" style={{ color: C.textLight }}>
                        Henüz bildirim yok
                      </div>
                    ) : notifications.map((n) => {
                      const isUnread = n.forStaff ? !(n.readBy ?? []).includes(user.uid) : !n.read;
                      return (
                        <div
                          key={n.id}
                          onClick={() => {
                            markNotificationRead(n.id);
                            setNotifOpen(false);
                            if (n.type === 'new_review' || n.type === 'review_updated') {
                              navigate('/moderasyon');
                            } else if (n.type === 'review_approved' || n.type === 'review_rejected') {
                              if (n.perfumeUrl) {
                                navigate(n.perfumeUrl);
                              } else if (n.muadilId) {
                                const m = muadilPerfumes.find((m) => String(m.id) === String(n.muadilId));
                                if (m?.targetPerfumeId) navigate(`/karsilastir?orijinal=${m.targetPerfumeId}&muadil=${m.id}`);
                              }
                            }
                          }}
                          className="px-4 py-[11px] cursor-pointer flex items-start gap-[10px] transition-[background] duration-150"
                          style={{
                            borderBottom: `1px solid ${C.borderLight}`,
                            background: isUnread ? C.goldBg : 'transparent',
                          }}
                          onMouseEnter={e => e.currentTarget.style.background = C.goldBg}
                          onMouseLeave={e => e.currentTarget.style.background = isUnread ? C.goldBg : 'transparent'}
                        >
                          {n.type === 'review_approved' ? (
                            <div
                              className="w-[22px] h-[22px] rounded-full shrink-0 flex items-center justify-center"
                              style={{ background: C.greenBg, border: `1px solid ${C.greenBorder}` }}
                            >
                              <FontAwesomeIcon icon={faCheck} className="text-[10px]" style={{ color: C.green }} />
                            </div>
                          ) : n.type === 'review_rejected' ? (
                            <div
                              className="w-[22px] h-[22px] rounded-full shrink-0 flex items-center justify-center"
                              style={{ background: C.redBg, border: `1px solid ${C.redBorder}` }}
                            >
                              <FontAwesomeIcon icon={faXmark} className="text-[10px]" style={{ color: C.red }} />
                            </div>
                          ) : (
                            <div
                              className="w-[7px] h-[7px] rounded-full shrink-0 mt-[5px]"
                              style={{
                                background: isUnread ? C.gold : 'transparent',
                                border: isUnread ? 'none' : `1px solid ${C.border}`,
                              }}
                            />
                          )}
                          <div className="flex-1 min-w-0">
                            <div
                              className="text-[12px] leading-[1.5]"
                              style={{ fontWeight: isUnread ? 600 : 400, color: C.text }}
                            >
                              {n.type === 'new_review'
                                ? `Yeni yorum: ${n.authorName}${n.muadilName ? ` — ${n.muadilName}` : ''}`
                                : n.type === 'review_updated'
                                ? `Yorum güncelleme: ${n.authorName}${n.muadilName ? ` — ${n.muadilName}` : ''}`
                                : n.type === 'review_rejected'
                                ? (() => {
                                    const d = n.reviewCreatedAt?.seconds
                                      ? new Date(n.reviewCreatedAt.seconds * 1000).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })
                                      : null;
                                    return `${d ? `${d} tarihli` : ''} yorumunuz onaylanmadı${n.muadilName ? `: ${n.muadilName}` : ''}`.trim();
                                  })()
                                : (() => {
                                    const d = n.reviewCreatedAt?.seconds
                                      ? new Date(n.reviewCreatedAt.seconds * 1000).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })
                                      : null;
                                    return `${d ? `${d} tarihli` : ''} yorumunuz onaylandı${n.muadilName ? `: ${n.muadilName}` : ''}`.trim();
                                  })()
                              }
                            </div>
                            {n.createdAt?.seconds && (
                              <div className="text-[11px] mt-[2px]" style={{ color: C.textLight }}>
                                {new Date(n.createdAt.seconds * 1000).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Desktop user menu */}
          {!lg && user && (
            <div data-menu-root className="relative">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="flex items-center gap-2 bg-transparent rounded-[8px] px-[10px] py-[5px] pl-[6px] cursor-pointer transition-[border-color] duration-200"
                style={{ border: `1px solid ${C.border}` }}
                onMouseEnter={e => e.currentTarget.style.borderColor = C.gold}
                onMouseLeave={e => e.currentTarget.style.borderColor = C.border}
              >
                <div
                  className="w-[26px] h-[26px] rounded-full flex items-center justify-center text-[11px] text-white font-semibold overflow-hidden shrink-0"
                  style={{ background: `linear-gradient(135deg,${C.gold},${C.goldLight})` }}
                >
                  {user.photoURL
                    ? <img src={user.photoURL} alt="" className="w-full h-full object-cover" onError={e => { e.currentTarget.style.display = 'none'; }} />
                    : user.name?.[0]?.toUpperCase()}
                </div>
                <span className="text-[13px] font-medium" style={{ color: C.text, fontFamily: F }}>{user.name}</span>
                <svg width="10" height="10" fill="none" stroke={C.textLight} strokeWidth="2" viewBox="0 0 24 24"><path d="m6 9 6 6 6-6" /></svg>
              </button>

              {menuOpen && (
                <div
                  className="fade-in absolute right-0 top-[calc(100%+6px)] rounded-[12px] min-w-[176px] z-[300] overflow-hidden"
                  style={{ background: C.card, border: `1px solid ${C.border}`, boxShadow: C.shadowMd }}
                >
                  {[
                    { l: 'Profilim',     u: '/profil' },
                    { l: 'Favorilerim',  u: '/profil?tab=favorites' },
                    { l: 'Yorumlarım',   u: '/profil?tab=reviews' },
                  ].map(({ l, u }) => (
                    <a key={u} href={`/#${u}`} onClick={e => { e.preventDefault(); navigate(u); setMenuOpen(false); }}
                      className="block w-full px-4 py-[10px] bg-transparent text-left text-[13px] cursor-pointer no-underline"
                      style={{ color: C.text, fontFamily: F }}
                      onMouseEnter={e => e.currentTarget.style.background = C.goldBg}
                      onMouseLeave={e => e.currentTarget.style.background = 'none'}>{l}</a>
                  ))}
                  <div className="h-px" style={{ background: C.borderLight }} />
                  <button onClick={() => { logout(); navigate('/'); setMenuOpen(false); }}
                    className="block w-full px-4 py-[10px] bg-transparent border-none text-left text-[13px] cursor-pointer"
                    style={{ color: C.red, fontFamily: F }}
                    onMouseEnter={e => e.currentTarget.style.background = C.redBg}
                    onMouseLeave={e => e.currentTarget.style.background = 'none'}>Çıkış Yap</button>
                </div>
              )}
            </div>
          )}

          {/* Desktop auth buttons */}
          {!lg && !user && (
            <div className="flex gap-[10px] items-center">
              <button
                onClick={() => navigate('/giris')}
                className="bg-transparent rounded-[10px] px-[18px] py-2 text-[13px] font-medium cursor-pointer flex items-center gap-[7px] transition-[color,border-color] duration-200 tracking-[0.02em]"
                style={{ border: `1px solid ${C.border}`, color: C.textMid, fontFamily: F }}
                onMouseEnter={e => { e.currentTarget.style.color = C.gold; e.currentTarget.style.borderColor = C.gold; }}
                onMouseLeave={e => { e.currentTarget.style.color = C.textMid; e.currentTarget.style.borderColor = C.border; }}
              >
                <FontAwesomeIcon icon={faRightToBracket} className="text-[12px]" />
                Giriş Yap
              </button>
              <button
                onClick={() => navigate('/kayit')}
                className="border-none rounded-[10px] px-5 py-2 text-[13px] font-semibold text-white cursor-pointer flex items-center gap-[7px] transition-[background,transform,box-shadow] duration-200 tracking-[0.02em]"
                style={{
                  background: `linear-gradient(135deg, ${C.text} 0%, #2a2218 100%)`,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                  fontFamily: F,
                }}
                onMouseEnter={e => { e.currentTarget.style.background = `linear-gradient(135deg, ${C.gold} 0%, ${C.goldLight} 100%)`; e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = `0 4px 16px rgba(184,147,90,0.3)`; }}
                onMouseLeave={e => { e.currentTarget.style.background = `linear-gradient(135deg, ${C.text} 0%, #2a2218 100%)`; e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)'; }}
              >
                <FontAwesomeIcon icon={faUserPlus} className="text-[12px]" />
                Üye Ol
              </button>
            </div>
          )}

          {/* Mobile hamburger */}
          {lg && (
            <button
              onClick={() => openDrawer()}
              className="w-10 h-10 rounded-[10px] bg-transparent flex items-center justify-center cursor-pointer shrink-0 transition-[border-color,color] duration-200"
              style={{ border: `1px solid ${C.border}`, color: C.text }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = C.gold; e.currentTarget.style.color = C.gold; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.text; }}
            >
              <FontAwesomeIcon icon={faBars} className="text-[15px]" />
            </button>
          )}
        </div>
      </nav>

      {/* ── Mobile drawer ────────────────────────────────────────────── */}
      {lg && mobileOpen && (
        <div
          className="fixed inset-0 z-[500] transition-[background,backdrop-filter] duration-300"
          style={{
            background: drawerVisible ? 'rgba(0,0,0,.35)' : 'rgba(0,0,0,0)',
            backdropFilter: drawerVisible ? 'blur(4px)' : 'none',
          }}
          onClick={() => closeDrawer()}
        >
          <div
            onClick={e => e.stopPropagation()}
            className="absolute top-0 right-0 w-[280px] h-full flex flex-col transition-transform duration-[480ms]"
            style={{
              background: C.card,
              boxShadow: C.shadowLg,
              transitionTimingFunction: 'cubic-bezier(0.22,1,0.36,1)',
              transform: drawerVisible ? 'translateX(0)' : 'translateX(100%)',
            }}
          >
            {/* Drawer header */}
            <div
              className="flex items-center justify-between px-5 py-[18px]"
              style={{ borderBottom: `1px solid ${C.border}` }}
            >
              <img src={logoDark} alt="muadilci" className="h-8 w-auto" />
              <button
                onClick={() => closeDrawer()}
                className="w-[34px] h-[34px] rounded-[8px] cursor-pointer flex items-center justify-center p-0 leading-none transition-[color,border-color] duration-200"
                style={{ background: C.surface, border: `1px solid ${C.border}`, color: C.textMid }}
                onMouseEnter={e => { e.currentTarget.style.color = C.text; e.currentTarget.style.borderColor = C.text; }}
                onMouseLeave={e => { e.currentTarget.style.color = C.textMid; e.currentTarget.style.borderColor = C.border; }}
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M1 1L11 11M11 1L1 11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                </svg>
              </button>
            </div>

            {/* Mobile search */}
            <div className="px-5 py-[14px]" style={{ borderBottom: `1px solid ${C.border}` }}>
              <div
                className="flex items-center gap-2 rounded-[8px] px-3 h-[38px]"
                style={{ background: C.surface, border: `1px solid ${C.border}` }}
              >
                <svg width="13" height="13" fill="none" stroke={C.textLight} strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /></svg>
                <input
                  value={searchQ}
                  onChange={e => setSearchQ(e.target.value)}
                  placeholder="Ara..."
                  className="flex-1 border-none outline-none text-[14px] bg-transparent"
                  style={{ color: C.text, fontFamily: F }}
                />
              </div>
              {searchQ.length > 1 && filtered.length > 0 && (
                <div
                  className="mt-2 rounded-[8px] overflow-hidden"
                  style={{ border: `1px solid ${C.border}` }}
                >
                  {filtered.map((item, i) => (
                    <div
                      key={i}
                      onMouseDown={() => { handleNav(item.url); setSearchQ(''); }}
                      className="px-3 py-[10px] text-[13px] cursor-pointer"
                      style={{
                        color: C.text,
                        borderBottom: i < filtered.length - 1 ? `1px solid ${C.borderLight}` : 'none',
                      }}
                    >
                      {item.label}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Mobile nav links */}
            <div className="flex-1 px-3 py-[10px] overflow-y-auto">
              {navLinks.map(link => (
                <a
                  key={link.u}
                  href={`/#${link.u}`}
                  onClick={e => { e.preventDefault(); handleNav(link.u); }}
                  className="flex items-center justify-between w-full px-[14px] py-3 rounded-[8px] text-[15px] cursor-pointer text-left no-underline mb-[2px]"
                  style={{
                    background: basePath === link.u ? C.goldBg : 'transparent',
                    color: basePath === link.u ? C.gold : C.text,
                    fontWeight: basePath === link.u ? 600 : 400,
                    fontFamily: F,
                  }}
                >
                  <span>{link.l}</span>
                  {link.badge > 0 && (
                    <span
                      className="min-w-[20px] h-5 rounded-[10px] text-white text-[11px] font-bold flex items-center justify-center px-[5px]"
                      style={{ background: C.gold }}
                    >
                      {link.badge > 99 ? '99+' : link.badge}
                    </span>
                  )}
                </a>
              ))}
            </div>

            {/* Mobile user section */}
            <div className="px-5 py-[14px]" style={{ borderTop: `1px solid ${C.border}` }}>
              {user ? (
                <>
                  <div className="flex items-center gap-[10px] mb-3">
                    <div
                      className="w-[34px] h-[34px] rounded-full flex items-center justify-center text-[13px] text-white font-semibold shrink-0 overflow-hidden"
                      style={{ background: `linear-gradient(135deg,${C.gold},${C.goldLight})` }}
                    >
                      {user.photoURL
                        ? <img src={user.photoURL} alt="" className="w-full h-full object-cover" onError={e => { e.currentTarget.style.display = 'none'; }} />
                        : user.name?.[0]?.toUpperCase()}
                    </div>
                    <div>
                      <div className="text-[14px] font-semibold" style={{ color: C.text }}>{user.name}</div>
                      <div className="text-[12px]" style={{ color: C.gold }}>{roleLabel[user.role]}</div>
                    </div>
                  </div>
                  <a
                    href="/#/profil"
                    onClick={e => { e.preventDefault(); handleNav('/profil'); }}
                    className="block w-full px-[14px] py-[10px] rounded-[8px] text-[14px] cursor-pointer text-left no-underline mb-[6px]"
                    style={{ border: `1px solid ${C.border}`, background: C.surface, color: C.text, fontFamily: F }}
                  >
                    Profilim
                  </a>
                  <button
                    onClick={() => { logout(); handleNav('/'); }}
                    className="block w-full px-[14px] py-[10px] rounded-[8px] border-none text-[14px] cursor-pointer text-left"
                    style={{ background: C.redBg, color: C.red, fontFamily: F }}
                  >
                    Çıkış Yap
                  </button>
                </>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={() => handleNav('/giris')}
                    className="flex-1 px-0 py-[10px] rounded-[8px] text-[14px] font-medium cursor-pointer"
                    style={{ border: `1px solid ${C.border}`, background: C.surface, color: C.text, fontFamily: F }}
                  >
                    Giriş Yap
                  </button>
                  <button
                    onClick={() => handleNav('/kayit')}
                    className="flex-1 px-0 py-[10px] rounded-[8px] border-none text-[14px] font-semibold text-white cursor-pointer"
                    style={{ background: C.text, fontFamily: F }}
                  >
                    Üye Ol
                  </button>
                </div>
              )}
            </div>

            {/* Instagram */}
            <div className="px-5 pt-3 pb-5" style={{ borderTop: `1px solid ${C.border}` }}>
              <a
                href="https://www.instagram.com/muadilciapp"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-[13px] font-medium no-underline transition-[color] duration-200"
                style={{ color: C.textLight, fontFamily: F }}
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
