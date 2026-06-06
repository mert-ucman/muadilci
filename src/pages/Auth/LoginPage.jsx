import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from '@/contexts/RouterContext';
import { Btn } from '@/components/ui';
import { AuthLayout, GoogleBtn, Divider, EyeIcon, signUpBg } from './AuthLayout';

export function LoginPage() {
  const { loginWithEmail, loginWithGoogle } = useAuth();
  const { navigate } = useRouter();
  const [identifier, setIdentifier] = useState(''); // e-posta veya kullanıcı adı
  const [pass, setPass] = useState('');
  const [showP, setShowP] = useState(false);
  const [err, setErr] = useState('');
  const [fId, setFId] = useState(false);
  const [fPass, setFPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleGoogle = async () => {
    setGoogleLoading(true);
    setErr('');
    try {
      await loginWithGoogle();
      navigate('/');
    } catch {
      setErr('Google ile giriş yapılamadı. Tekrar deneyin.');
    } finally {
      setGoogleLoading(false);
    }
  };

  const submit = async () => {
    if (!identifier || !pass) { setErr('Tüm alanları doldurun.'); return; }
    setLoading(true);
    setErr('');
    try {
      await loginWithEmail(identifier.trim(), pass);
      navigate('/');
    } catch (e) {
      if (
        e.code === 'auth/user-not-found' ||
        e.code === 'auth/wrong-password' ||
        e.code === 'auth/invalid-credential'
      ) {
        setErr('E-posta/kullanıcı adı veya şifre hatalı.');
      } else if (e.code === 'auth/too-many-requests') {
        setErr('Çok fazla deneme yapıldı. Lütfen bekleyin.');
      } else {
        setErr('Giriş yapılamadı. Tekrar deneyin.');
      }
    } finally {
      setLoading(false);
    }
  };

  const inpClass = 'w-full rounded-[10px] px-[14px] py-[10px] text-[14px] text-(--color-text) outline-none transition-[border-color] duration-200';

  return (
    <AuthLayout
      title="Hoş Geldiniz"
      subtitle="Hesabınıza giriş yapın"
      bgImage={signUpBg}
      headline={<>Kokuların<br /><em style={{ color: 'rgb(184,147,90)', fontStyle: 'italic' }}>Güçlü</em> Dünyasına<br />Hoş Geldiniz</>}
    >
      <GoogleBtn label="Google ile Giriş Yap" onClick={handleGoogle} loading={googleLoading} />
      <Divider />

      <div className="mb-[14px]">
        <label className="block text-[13px] font-semibold text-(--color-text-mid) mb-[6px]">
          E-posta veya Kullanıcı Adı
        </label>
        <input
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          onFocus={() => setFId(true)}
          onBlur={() => setFId(false)}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
          placeholder=""
          autoComplete="username"
          className={inpClass}
          style={{ border: `1px solid ${fId ? 'var(--color-gold)' : 'var(--color-border)'}` }}
        />
      </div>

      <div className="mb-[6px]">
        <label className="block text-[13px] font-semibold text-(--color-text-mid) mb-[6px]">Şifre</label>
        <div className="relative">
          <input
            type={showP ? 'text' : 'password'}
            value={pass}
            onChange={(e) => setPass(e.target.value)}
            onFocus={() => setFPass(true)}
            onBlur={() => setFPass(false)}
            onKeyDown={(e) => e.key === 'Enter' && submit()}
            placeholder=""
            className={inpClass}
            style={{
              paddingRight: '44px',
              border: `1px solid ${fPass ? 'var(--color-gold)' : 'var(--color-border)'}`,
            }}
          />
          <button
            type="button"
            onClick={() => setShowP((s) => !s)}
            className="absolute right-3 top-1/2 -translate-y-1/2 bg-transparent border-none cursor-pointer text-(--color-text-light) flex items-center p-1"
          >
            <EyeIcon open={showP} />
          </button>
        </div>
      </div>

      <div className="text-right mb-4">
        <span
          onClick={() => navigate('/sifre-sifirla')}
          className="text-[13px] text-(--color-gold) cursor-pointer font-semibold"
        >
          Şifremi unuttum
        </span>
      </div>

      {err && (
        <div className="bg-(--color-red-bg) border border-(--color-red-border) rounded-[10px] px-[14px] py-[10px] text-(--color-red) text-[13px] mb-3">
          {err}
        </div>
      )}
      <Btn onClick={submit} disabled={loading} style={{ width: '100%', justifyContent: 'center', marginBottom: '14px' }} size="lg">
        {loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
      </Btn>
      <div className="text-center text-[13px] text-(--color-text-mid)">
        Hesabın yok mu?{' '}
        <span
          onClick={() => navigate('/kayit')}
          className="text-(--color-gold) font-bold cursor-pointer"
        >
          Üye Ol
        </span>
      </div>
    </AuthLayout>
  );
}
