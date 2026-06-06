import { useEffect } from 'react';
import { useRouter } from '@/contexts/RouterContext';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { matchRoute, NO_LAYOUT_PATHS } from '@/constants/routes';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { LandingPage }       from '@/pages/Landing';
import { ComparisonPage }    from '@/pages/Comparison';
import { PerfumesPage }      from '@/pages/Perfumes';
import { BrandsPage }        from '@/pages/Brands/BrandsPage';
import { BrandPage }         from '@/pages/Brands/BrandPage';
import { PerfumeDetailPage } from '@/pages/PerfumeDetail';
import { LoginPage }         from '@/pages/Auth/LoginPage';
import { RegisterPage }      from '@/pages/Auth/RegisterPage';
import { ForgotPasswordPage }        from '@/pages/Auth/ForgotPasswordPage';
import { ResetPasswordPage }         from '@/pages/Auth/ResetPasswordPage';
import { EmailVerificationPage }     from '@/pages/Auth/EmailVerificationPage';
import { UsernameSetupPage }         from '@/pages/Auth/UsernameSetupPage';
import { ProfilePage }       from '@/pages/Profile';
import { ModerationPage }    from '@/pages/Moderation';
import { AdminPanel }        from '@/pages/Admin';
import { LeaderboardPage }   from '@/pages/Leaderboard';
import { NotFoundPage }      from '@/pages/NotFound';
import { PublicProfilePage } from '@/pages/PublicProfile';

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
  const { loading, user, isAdmin, isMod } = useAuth();
  const { faviconUrl } = useData();

  useEffect(() => {
    if (!faviconUrl) return;
    let link = document.querySelector("link[rel~='icon']");
    if (!link) { link = document.createElement('link'); link.rel = 'icon'; document.head.appendChild(link); }
    link.href = faviconUrl;
  }, [faviconUrl]);

  // Route korumaları — render sırasında değil, effect içinde yönlendir
  useEffect(() => {
    if (loading) return;
    if (!user && (basePath === '/profil' || basePath === '/moderasyon' || basePath === '/admin')) {
      navigate('/giris');
    } else if (user && !isMod && basePath === '/moderasyon') {
      navigate('/');
    } else if (user && !isAdmin && basePath === '/admin') {
      navigate('/');
    } else if (user && (basePath === '/giris' || basePath === '/kayit')) {
      navigate('/');
    }
  }, [loading, user, isAdmin, isMod, basePath]);

  const noLayout = NO_LAYOUT_PATHS.includes(basePath);

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8f9fb' }}>
      <div style={{ width: '36px', height: '36px', border: '3px solid #e5e7eb', borderTop: '3px solid #b8965a', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  // E-posta doğrulama gate — Google kullanıcıları, admin ve şifre sıfırlama hariç
  if (user && !user.emailVerified && user.provider !== 'google.com' && !isAdmin && basePath !== '/sifre-yenile') {
    return <EmailVerificationPage />;
  }

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
{!noLayout && <Navbar />}
      <div style={{ flex: 1 }}>
        <Page params={params} queryParams={query} />
      </div>
      {!noLayout && <Footer />}
    </div>
  );
}
