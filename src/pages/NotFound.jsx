import { useRouter } from '@/contexts/RouterContext';
import { Btn } from '@/components/ui';
import { C, F } from '@/constants/theme';
import { useSeo } from '@/lib/seo';

export function NotFoundPage() {
  const { navigate } = useRouter();
  useSeo({ title: 'Sayfa Bulunamadı', noindex: true });

  return (
    <div style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '60px 20px', fontFamily: F }}>
      <div style={{ fontSize: '72px', fontWeight: 900, color: C.gold, lineHeight: 1, marginBottom: '10px' }}>404</div>
      <h1 style={{ fontSize: '22px', fontWeight: 800, color: C.navy, marginBottom: '8px' }}>Sayfa Bulunamadı</h1>
      <p style={{ fontSize: '14px', color: C.textLight, maxWidth: '420px', lineHeight: 1.6, marginBottom: '24px' }}>
        Aradığınız sayfa taşınmış, silinmiş ya da hiç var olmamış olabilir.
      </p>
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center' }}>
        <Btn variant="primary" onClick={() => navigate('/')}>Ana Sayfaya Dön</Btn>
        <Btn variant="secondary" onClick={() => navigate('/parfumler')}>Parfümleri Keşfet</Btn>
      </div>
    </div>
  );
}
