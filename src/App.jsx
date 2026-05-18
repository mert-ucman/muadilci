import { useRouter } from '@/contexts/RouterContext';
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
import { ForgotPasswordPage } from '@/pages/Auth/ForgotPasswordPage';
import { ProfilePage }       from '@/pages/Profile';
import { ModerationPage }    from '@/pages/Moderation';
import { AdminPanel }        from '@/pages/Admin';

const ROUTES = [
  { pat: '/',                       C: LandingPage },
  { pat: '/parfumler',              C: PerfumesPage },
  { pat: '/markalar',               C: BrandsPage },
  { pat: '/karsilastir',            C: ComparisonPage },
  { pat: '/giris',                  C: LoginPage },
  { pat: '/kayit',                  C: RegisterPage },
  { pat: '/sifre-sifirla',          C: ForgotPasswordPage },
  { pat: '/profil',                 C: ProfilePage },
  { pat: '/moderasyon',             C: ModerationPage },
  { pat: '/admin',                  C: AdminPanel },
  { pat: '/marka/:brandSlug',       C: BrandPage },
  { pat: '/:brandSlug/:perfumeSlug', C: PerfumeDetailPage },
];

export function App() {
  const { basePath, query } = useRouter();
  const noLayout = NO_LAYOUT_PATHS.includes(basePath);
  const isLanding = basePath === '/';

  let Page = LandingPage;
  let params = {};
  for (const r of ROUTES) {
    const p = matchRoute(r.pat, basePath);
    if (p !== null) { Page = r.C; params = p; break; }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {!noLayout && <Navbar />}
      <div style={{ flex: 1 }}>
        <Page params={params} queryParams={query} />
      </div>
      {!noLayout && <Footer />}
    </div>
  );
}
