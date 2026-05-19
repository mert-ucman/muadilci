import { HeroSection }          from './HeroSection';
import { HowItWorksSection }    from './HowItWorksSection';
import { ComparisonSection }    from './ComparisonSection';
import { PopularMatchesSection } from './PopularMatchesSection';
import { BrandsBandSection }    from './BrandsBandSection';
import { TestimonialsSection }  from './TestimonialsSection';
import { CTASection }           from './CTASection';

export function LandingPage() {
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
