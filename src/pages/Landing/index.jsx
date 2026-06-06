import { HeroSection }          from './HeroSection';
import { HowItWorksSection }    from './HowItWorksSection';
import { ComparisonSection }    from './ComparisonSection';
import { PopularMatchesSection } from './PopularMatchesSection';
import { BrandsBandSection }    from './BrandsBandSection';
import { TestimonialsSection }  from './TestimonialsSection';
import { CTASection }           from './CTASection';
import { PageNavigator }        from '@/components/ui/PageNavigator';
import { useSeo } from '@/lib/seo';

const SECTIONS = [
  { id: 'hero',        label: 'Keşfet' },
  { id: 'how',         label: 'Nasıl Çalışır' },
  { id: 'comparison',  label: 'Karşılaştır' },
  { id: 'popular',     label: 'Popüler Eşleşmeler' },
  { id: 'brands',      label: 'Markalar' },
  { id: 'testimonials',label: 'Yorumlar' },
  { id: 'cta',         label: 'Başla' },
];

export function LandingPage() {
  useSeo({
    title: null,
    description: 'Orijinal parfümlerin uygun fiyatlı muadillerini keşfet, koku/kalıcılık/yayılım puanlarıyla karşılaştır ve sana en yakın alternatifi bul. Türkiye\'nin muadil parfüm topluluğu.',
  });
  return (
    <div className="bg-white min-h-screen overflow-x-hidden">
      <PageNavigator sections={SECTIONS} />
      <div id="hero"><HeroSection /></div>
      <div id="how"><HowItWorksSection /></div>
      <div id="comparison"><ComparisonSection /></div>
      <div id="popular"><PopularMatchesSection /></div>
      <div id="brands"><BrandsBandSection /></div>
      <div id="testimonials"><TestimonialsSection /></div>
      <div id="cta"><CTASection /></div>
    </div>
  );
}
