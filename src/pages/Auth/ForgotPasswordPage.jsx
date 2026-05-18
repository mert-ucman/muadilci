import { useState } from 'react';
import { useRouter } from '@/contexts/RouterContext';
import { Input, Btn } from '@/components/ui';
import { AuthLayout } from './AuthLayout';
import { C } from '@/constants/theme';

export function ForgotPasswordPage() {
  const { navigate } = useRouter();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);

  return (
    <AuthLayout title="Şifre Sıfırla" subtitle="E-postanıza sıfırlama bağlantısı gönderilecek">
      {!sent ? (
        <>
          <Input label="E-posta" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="ornek@mail.com" />
          <Btn onClick={() => email && setSent(true)} style={{ width: '100%', justifyContent: 'center', marginBottom: '14px' }} size="lg">
            Bağlantı Gönder
          </Btn>
        </>
      ) : (
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <div style={{ width: '54px', height: '54px', borderRadius: '50%', background: C.greenBg, border: `1px solid ${C.greenBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px', fontSize: '22px' }}>✓</div>
          <div style={{ fontWeight: 700, color: C.text, marginBottom: '8px' }}>E-posta gönderildi!</div>
          <div style={{ fontSize: '13px', color: C.textLight }}><strong style={{ color: C.gold }}>{email}</strong> adresine bağlantı gönderdik.</div>
        </div>
      )}
      <div style={{ textAlign: 'center' }}>
        <span onClick={() => navigate('/giris')} style={{ fontSize: '13px', color: C.gold, cursor: 'pointer' }}>← Giriş sayfasına dön</span>
      </div>
    </AuthLayout>
  );
}
