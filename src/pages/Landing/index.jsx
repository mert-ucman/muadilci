import { HeroSection }          from './HeroSection';
import { HowItWorksSection }    from './HowItWorksSection';
import { ComparisonSection }    from './ComparisonSection';
import { PopularMatchesSection } from './PopularMatchesSection';
import { BrandsBandSection }    from './BrandsBandSection';
import { TestimonialsSection }  from './TestimonialsSection';
import { CTASection }           from './CTASection';
import { useSeo } from '@/lib/seo';

export function LandingPage() {
  useSeo({
    title: null,
    description: 'Orijinal parfümlerin uygun fiyatlı muadillerini keşfet, koku/kalıcılık/yayılım puanlarıyla karşılaştır ve sana en yakın alternatifi bul. Türkiye\'nin muadil parfüm topluluğu.',
  });
  return (
    <div style={{ background: '#fff', minHeight: '100vh', overflowX: 'hidden' }}>
      <HeroSection />
      <HowItWorksSection />
      <ComparisonSection />
      <PopularMatchesSection />
      <BrandsBandSection />
      <TestimonialsSection />
      <CTASection />
    </div>
  );
}
