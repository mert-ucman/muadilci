import { useEffect, useState, lazy, Suspense } from 'react';
import { useRouter } from '@/contexts/RouterContext';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { matchRoute, NO_LAYOUT_PATHS } from '@/constants/routes';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { VerificationGate } from '@/components/shared/VerificationGate';
import { PendingReviewResumer } from '@/components/shared/PendingReviewResumer';
import { claimDailyLoginFn, istanbulToday } from '@/lib/gamification';
import { LandingPage } from '@/pages/Landing';

const ComparisonPage    = lazy(() => import('@/pages/Comparison').then(m => ({ default: m.ComparisonPage })));
const PerfumesPage      = lazy(() => import('@/pages/Perfumes').then(m => ({ default: m.PerfumesPage })));
const BrandsPage        = lazy(() => import('@/pages/Brands/BrandsPage').then(m => ({ default: m.BrandsPage })));
const BrandPage         = lazy(() => import('@/pages/Brands/BrandPage').then(m => ({ default: m.BrandPage })));
const PerfumeDetailPage = lazy(() => import('@/pages/PerfumeDetail').then(m => ({ default: m.PerfumeDetailPage })));
const LoginPage         = lazy(() => import('@/pages/Auth/LoginPage').then(m => ({ default: m.LoginPage })));
const RegisterPage      = lazy(() => import('@/pages/Auth/RegisterPage').then(m => ({ default: m.RegisterPage })));
const ForgotPasswordPage    = lazy(() => import('@/pages/Auth/ForgotPasswordPage').then(m => ({ default: m.ForgotPasswordPage })));
const ResetPasswordPage     = lazy(() => import('@/pages/Auth/ResetPasswordPage').then(m => ({ default: m.ResetPasswordPage })));
const UsernameSetupPage     = lazy(() => import('@/pages/Auth/UsernameSetupPage').then(m => ({ default: m.UsernameSetupPage })));
const ProfilePage       = lazy(() => import('@/pages/Profile').then(m => ({ default: m.ProfilePage })));
const ModerationPage    = lazy(() => import('@/pages/Moderation').then(m => ({ default: m.ModerationPage })));
const AdminPanel        = lazy(() => import('@/pages/Admin').then(m => ({ default: m.AdminPanel })));
const LeaderboardPage   = lazy(() => import('@/pages/Leaderboard').then(m => ({ default: m.LeaderboardPage })));
const NotFoundPage      = lazy(() => import('@/pages/NotFound').then(m => ({ default: m.NotFoundPage })));
const PublicProfilePage = lazy(() => import('@/pages/PublicProfile').then(m => ({ default: m.PublicProfilePage })));

function PageSpinner() {
  return (
    <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: '36px', height: '36px', border: '3px solid #e5e7eb', borderTop: '3px solid #b8965a', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
    </div>
  );
}

// Katalog + yorumlar inene kadar gösterilen tam ekran yükleme.
// Gerçek indirme baytları takip edilmediğinden yüzde, ~%95'e doğru
// yavaşlayarak yaklaşan simüle bir sayaçtır; veri hazır olunca ekran kalkar.
function LoadingScreen({ logoUrl }) {
  const [pct, setPct] = useState(6);
  useEffect(() => {
    let raf, cur = 6;
    const tick = () => {
      cur += (95 - cur) * 0.02;
      setPct(Math.min(95, Math.round(cur)));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '22px', background: '#f8f9fb', padding: '24px' }}>
      {logoUrl
        ? <img src={logoUrl} alt="muadilci" style={{ height: '38px', objectFit: 'contain' }} />
        : <div style={{ fontSize: '26px', fontWeight: 800, letterSpacing: '.14em', color: '#1a1a2e', textTransform: 'uppercase' }}>muadilci</div>}
      <div style={{ width: 'min(320px, 80vw)', height: '6px', borderRadius: '999px', background: '#e5e7eb', overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: 'linear-gradient(90deg,#b8965a,#d4b578)', borderRadius: '999px', transition: 'width .2s ease-out' }} />
      </div>
      <div style={{ fontSize: '13px', fontWeight: 600, color: '#6b7280', fontVariantNumeric: 'tabular-nums' }}>Yükleniyor %{pct}</div>
    </div>
  );
}

const ROUTES = [
  { pat: '/',                       C: LandingPage },
  { pat: '/parfumler',              C: PerfumesPage },
  { pat: '/markalar',               C: BrandsPage },
  { pat: '/karsilastir',            C: ComparisonPage },
  { pat: '/giris',                  C: LoginPage },
  { pat: '/kayit',                  C: RegisterPage },
  { pat: '/sifre-sifirla',          C: ForgotPasswordPage },
  { pat: '/sifre-yenile',          C: ResetPasswordPage },
  { pat: '/profil',                 C: ProfilePage },
  { pat: '/en-iyiler',               C: LeaderboardPage },
  { pat: '/moderasyon',             C: ModerationPage },
  { pat: '/admin',                  C: AdminPanel },
  { pat: '/@:username',              C: PublicProfilePage },
  { pat: '/marka/:brandSlug',       C: BrandPage },
  { pat: '/:brandSlug/:perfumeSlug', C: PerfumeDetailPage },
];


export function App() {
  const { basePath, query, navigate } = useRouter();
  const { loading: authLoading, user, isAdmin, isMod } = useAuth();
  const { faviconUrl, logoUrl, loading: dataLoading } = useData();

  useEffect(() => {
    if (!faviconUrl) return;
    let link = document.querySelector("link[rel~='icon']");
    if (!link) { link = document.createElement('link'); link.rel = 'icon'; document.head.appendChild(link); }
    link.href = faviconUrl;
  }, [faviconUrl]);

  // Günlük giriş ödülü — oturum açık kullanıcı için günde 1 kez (tarayıcı guard'ı
  // + sunucu idempotent). Fonksiyon deploy değilse sessizce yutulur (localde UI çalışır).
  useEffect(() => {
    if (!user?.uid) return;
    const key = `muadilci_login_${user.uid}_${istanbulToday()}`;
    try { if (localStorage.getItem(key)) return; } catch { /* noop */ }
    claimDailyLoginFn()
      .then(() => { try { localStorage.setItem(key, '1'); } catch { /* noop */ } })
      .catch(() => { /* deploy edilmemiş / offline — sessiz geç */ });
  }, [user?.uid]);

  // Route korumaları — render sırasında değil, effect içinde yönlendir
  useEffect(() => {
    if (authLoading) return;
    if (!user && (basePath === '/profil' || basePath === '/moderasyon' || basePath === '/admin')) {
      navigate('/giris');
    } else if (user && !isMod && basePath === '/moderasyon') {
      navigate('/');
    } else if (user && !isAdmin && basePath === '/admin') {
      navigate('/');
    } else if (user && (basePath === '/giris' || basePath === '/kayit')) {
      navigate('/');
    }
  }, [authLoading, user, isAdmin, isMod, basePath]);

  const noLayout = NO_LAYOUT_PATHS.includes(basePath);

  // Auth + katalog/yorum verisi hazır olana kadar yüzdeli yükleme ekranı.
  // (Aksi halde veri gelmeden sayfalar "Marka bulunamadı" / boş kart gösteriyordu.)
  if (authLoading || dataLoading) return <LoadingScreen logoUrl={logoUrl} />;

  // NOT: Doğrulanmamış e-posta kullanıcıları artık siteden KİLİTLENMEZ. Siteyi
  // gezip yorum yapabilirler; <VerificationGate/> sürekli uyarır ve 48 saat içinde
  // doğrulanmazsa cleanupUnverifiedUsers hesabı + tüm yorumları siler.

  // Google ile giriş yapan kullanıcılar için kullanıcı adı seçim ekranı
  if (user && user.provider === 'google.com' && !user.username) {
    return <UsernameSetupPage />;
  }

  // Koruma gerektiren sayfalarda yönlendirme beklenirken boş render
  if (!user && (basePath === '/profil' || basePath === '/moderasyon' || basePath === '/admin')) return null;
  if (user && !isMod && basePath === '/moderasyon') return null;
  if (user && !isAdmin && basePath === '/admin') return null;
  if (user && (basePath === '/giris' || basePath === '/kayit')) return null;

  let Page = NotFoundPage;
  let params = {};
  for (const r of ROUTES) {
    const p = matchRoute(r.pat, basePath);
    if (p !== null) { Page = r.C; params = p; break; }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', overflowX: 'hidden' }}>
      <VerificationGate />
      <PendingReviewResumer />
      {!noLayout && <Navbar />}
      <div style={{ flex: 1 }}>
        <Suspense fallback={<PageSpinner />}>
          <Page params={params} queryParams={query} />
        </Suspense>
      </div>
      {!noLayout && <Footer />}
    </div>
  );
}
