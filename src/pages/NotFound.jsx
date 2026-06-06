import { useRouter } from '@/contexts/RouterContext';
import { Btn } from '@/components/ui';
import { useSeo } from '@/lib/seo';

export function NotFoundPage() {
  const { navigate } = useRouter();
  useSeo({ title: 'Sayfa Bulunamadı', noindex: true });

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-5 py-[60px] font-[--font-body]">
      <div className="text-[72px] font-black text-(--color-gold) leading-none mb-[10px]">404</div>
      <h1 className="text-[22px] font-extrabold text-(--color-navy) mb-2">Sayfa Bulunamadı</h1>
      <p className="text-[14px] text-(--color-text-light) max-w-[420px] leading-relaxed mb-6">
        Aradığınız sayfa taşınmış, silinmiş ya da hiç var olmamış olabilir.
      </p>
      <div className="flex gap-[10px] flex-wrap justify-center">
        <Btn variant="primary" onClick={() => navigate('/')}>Ana Sayfaya Dön</Btn>
        <Btn variant="secondary" onClick={() => navigate('/parfumler')}>Parfümleri Keşfet</Btn>
      </div>
    </div>
  );
}
