import { useState } from 'react';
import { useRouter } from '@/contexts/RouterContext';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { Badge } from '@/components/ui/Badge';
import { Btn } from '@/components/ui/Btn';
import { C, F } from '@/constants/theme';

export function Navbar() {
  const { navigate, basePath } = useRouter();
  const { user, logout, isAdmin, isMod } = useAuth();
  const { perfumes, brands } = useData();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQ, setSearchQ] = useState('');

  const navLinks = [
    { l: 'Parfümler', u: '/parfumler' },
    { l: 'Markalar', u: '/markalar' },
    { l: 'Karşılaştır', u: '/karsilastir' },
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
  const roleColor = { admin: 'red', moderator: 'blue', user: 'gold' };

  return (
    <nav style={{
      position: 'sticky', top: 0, zIndex: 200,
      background: C.card,
      borderBottom: `1px solid ${C.border}`,
      boxShadow: '0 1px 8px rgba(0,0,0,.06)',
    }}>
      <div style={{
        maxWidth: '1280px', margin: '0 auto',
        padding: '0 32px', height: '64px',
        display: 'flex', alignItems: 'center', gap: '20px',
      }}>
        {/* Logo */}
        <div onClick={() => navigate('/')} style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', flexShrink: 0 }}>
          <div style={{ width: '34px', height: '34px', borderRadius: '8px', background: `linear-gradient(135deg,${C.gold},${C.goldLight})`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: '#fff', fontSize: '16px', fontWeight: 900 }}>M</span>
          </div>
          <span style={{ fontSize: '20px', fontWeight: 900, color: C.navy }}>muadilci</span>
        </div>

        {/* Nav Links */}
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

        {/* Search */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setSearchOpen(!searchOpen)}
            style={{ background: 'none', border: `1px solid ${C.border}`, borderRadius: '8px', padding: '7px 12px', cursor: 'pointer', color: C.textMid, display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontFamily: F }}
          >
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
            </svg>
            Ara
          </button>
          {searchOpen && (
            <div className="fade-in" style={{ position: 'absolute', right: 0, top: 'calc(100% + 8px)', width: '340px', background: C.card, border: `1px solid ${C.border}`, borderRadius: '14px', boxShadow: C.shadowMd, zIndex: 300 }}>
              <div style={{ padding: '12px 16px', borderBottom: `1px solid ${C.borderLight}` }}>
                <input
                  autoFocus
                  value={searchQ}
                  onChange={(e) => setSearchQ(e.target.value)}
                  placeholder="Parfüm veya marka ara..."
                  style={{ width: '100%', border: 'none', outline: 'none', fontSize: '14px', color: C.text, background: 'transparent' }}
                />
              </div>
              {filtered.length > 0 && (
                <div style={{ maxHeight: '260px', overflow: 'auto' }}>
                  {filtered.map((item, i) => (
                    <div
                      key={i}
                      onClick={() => { navigate(item.url); setSearchOpen(false); setSearchQ(''); }}
                      style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 16px', cursor: 'pointer' }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = C.goldBg)}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      <span style={{ fontSize: '14px', color: C.text }}>{item.label}</span>
                      <Badge color="gray">{item.type}</Badge>
                    </div>
                  ))}
                </div>
              )}
              {searchQ.length > 1 && !filtered.length && (
                <div style={{ padding: '20px', textAlign: 'center', color: C.textLight, fontSize: '14px' }}>Sonuç bulunamadı</div>
              )}
            </div>
          )}
        </div>

        {/* User Menu */}
        {user ? (
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', background: C.goldBg, border: `1px solid ${C.goldBorder}`, borderRadius: '10px', padding: '6px 12px 6px 8px', cursor: 'pointer' }}
            >
              <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: `linear-gradient(135deg,${C.gold},${C.goldLight})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', color: '#fff', fontWeight: 700 }}>
                {user.name?.[0]?.toUpperCase()}
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
                  <button
                    key={u}
                    onClick={() => { navigate(u); setMenuOpen(false); }}
                    style={{ display: 'block', width: '100%', padding: '11px 16px', background: 'none', border: 'none', textAlign: 'left', fontSize: '14px', color: C.text, cursor: 'pointer', fontFamily: F }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = C.goldBg)}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
                  >
                    {l}
                  </button>
                ))}
                <div style={{ height: '1px', background: C.border, margin: '4px 0' }} />
                <button
                  onClick={() => { logout(); navigate('/'); setMenuOpen(false); }}
                  style={{ display: 'block', width: '100%', padding: '11px 16px', background: 'none', border: 'none', textAlign: 'left', fontSize: '14px', color: C.red, cursor: 'pointer', fontFamily: F }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = C.redBg)}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
                >
                  Çıkış Yap
                </button>
              </div>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', gap: '8px' }}>
            <Btn variant="secondary" size="sm" onClick={() => navigate('/giris')}>Giriş Yap</Btn>
            <Btn size="sm" onClick={() => navigate('/kayit')}>Üye Ol</Btn>
          </div>
        )}
      </div>
    </nav>
  );
}
