import { useState } from 'react';
import { useRouter } from '@/contexts/RouterContext';
import { useAuth } from '@/contexts/AuthContext';
import { Input, Btn } from '@/components/ui';
import { AuthLayout } from './AuthLayout';

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
          {err && (
            <div className="bg-(--color-red-bg) border border-(--color-red-border) rounded-[10px] px-[14px] py-[10px] text-(--color-red) text-[13px] mb-3">
              {err}
            </div>
          )}
          <Btn onClick={submit} disabled={loading} style={{ width: '100%', justifyContent: 'center', marginBottom: '14px' }} size="lg">
            {loading ? 'Gönderiliyor...' : 'Bağlantı Gönder'}
          </Btn>
        </>
      ) : (
        <div className="text-center py-5">
          <div className="w-[54px] h-[54px] rounded-full bg-(--color-green-bg) border border-(--color-green-border) flex items-center justify-center mx-auto mb-[14px] text-[22px]">✓</div>
          <div className="font-bold text-(--color-text) mb-2">E-posta gönderildi!</div>
          <div className="text-[13px] text-(--color-text-light) leading-[1.6]">
            <strong className="text-(--color-gold)">{email}</strong> adresine bağlantı gönderdik.<br />
            <span className="block mt-[6px]">Maildeki bağlantıya tıklayarak yeni şifrenizi belirleyebilirsiniz. Spam klasörünü de kontrol edin.</span>
          </div>
        </div>
      )}
      <div className="text-center">
        <span
          onClick={() => navigate('/giris')}
          className="text-[13px] text-(--color-gold) cursor-pointer"
        >
          ← Giriş sayfasına dön
        </span>
      </div>
    </AuthLayout>
  );
}
