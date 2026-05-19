import { useState } from 'react';
import { useRouter } from '@/contexts/RouterContext';
import { useAuth } from '@/contexts/AuthContext';
import { Input, Btn } from '@/components/ui';
import { AuthLayout } from './AuthLayout';
import { C } from '@/constants/theme';

export function ForgotPasswordPage() {
  const { navigate } = useRouter();
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  const submit = async () => {
    if (!email) { setErr('E-posta adresinizi girin.'); return; }
    setLoading(true);
    setErr('');
    try {
      await resetPassword(email);
      setSent(true);
    } catch (e) {
      if (e.code === 'auth/user-not-found') {
        setErr('Bu e-posta ile kayıtlı hesap bulunamadı.');
      } else {
        setErr('Bir hata oluştu. Tekrar deneyin.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Şifre Sıfırla" subtitle="E-postanıza sıfırlama bağlantısı gönderilecek">
      {!sent ? (
        <>
          <Input label="E-posta" type="email" value={email} onChange={(e) => setEmail(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && submit()} placeholder="ornek@mail.com" />
          {err && <div style={{ background: C.redBg, border: `1px solid ${C.redBorder}`, borderRadius: '10px', padding: '10px 14px', color: C.red, fontSize: '13px', marginBottom: '12px' }}>⚠ {err}</div>}
          <Btn onClick={submit} disabled={loading} style={{ width: '100%', justifyContent: 'center', marginBottom: '14px' }} size="lg">
            {loading ? 'Gönderiliyor...' : 'Bağlantı Gönder'}
          </Btn>
        </>
      ) : (
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <div style={{ width: '54px', height: '54px', borderRadius: '50%', background: C.greenBg, border: `1px solid ${C.greenBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px', fontSize: '22px' }}>✓</div>
          <div style={{ fontWeight: 700, color: C.text, marginBottom: '8px' }}>E-posta gönderildi!</div>
          <div style={{ fontSize: '13px', color: C.textLight, lineHeight: 1.6 }}>
            <strong style={{ color: C.gold }}>{email}</strong> adresine bağlantı gönderdik.<br />
            <span style={{ display: 'block', marginTop: '6px' }}>Maildeki bağlantıya tıklayarak yeni şifrenizi belirleyebilirsiniz. Spam klasörünü de kontrol edin.</span>
          </div>
        </div>
      )}
      <div style={{ textAlign: 'center' }}>
        <span onClick={() => navigate('/giris')} style={{ fontSize: '13px', color: C.gold, cursor: 'pointer' }}>← Giriş sayfasına dön</span>
      </div>
    </AuthLayout>
  );
}
