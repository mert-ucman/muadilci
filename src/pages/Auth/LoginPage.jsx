import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from '@/contexts/RouterContext';
import { Btn } from '@/components/ui';
import { AuthLayout, GoogleBtn, Divider, EyeIcon } from './AuthLayout';

// step: 'login' | 'mfa-code'
export function LoginPage() {
  const { loginWithEmail, loginWithGoogle, startTotpLogin, completeTotpLogin } = useAuth();
  const { navigate } = useRouter();

  const [identifier, setIdentifier] = useState('');
  const [pass, setPass] = useState('');
  const [showP, setShowP] = useState(false);
  const [err, setErr] = useState('');
  const [fId, setFId] = useState(false);
  const [fPass, setFPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const [step, setStep] = useState('login');
  const [mfaState, setMfaState] = useState(null); // { resolver, enrollmentId }
  const [mfaCode, setMfaCode] = useState('');
  const [mfaLoading, setMfaLoading] = useState(false);
  const [fMfa, setFMfa] = useState(false);

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
      if (e.code === 'auth/multi-factor-auth-required') {
        // TOTP: SMS/reCAPTCHA yok — doğrudan kod ekranına geç
        try {
          const state = startTotpLogin(e);
          setMfaState(state);
          setStep('mfa-code');
          setErr('');
        } catch (mfaErr) {
          console.error('[MFA login error]', mfaErr?.code, mfaErr?.message);
          setErr('Doğrulama başlatılamadı. Tekrar deneyin.');
        }
      } else if (
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

  const submitMfa = async () => {
    if (!mfaCode) { setErr('Doğrulama kodunu girin.'); return; }
    setMfaLoading(true);
    setErr('');
    try {
      await completeTotpLogin(mfaState.resolver, mfaState.enrollmentId, mfaCode.trim());
      navigate('/');
    } catch (e) {
      console.error('[MFA verify error]', e?.code, e?.message);
      if (e.code === 'auth/invalid-verification-code' || e.code === 'auth/invalid-payload') {
        setErr('Kod hatalı. Authenticator uygulamasındaki güncel kodu girin.');
      } else if (e.code === 'auth/too-many-requests') {
        setErr('Çok fazla deneme. Lütfen bekleyin.');
      } else {
        setErr('Doğrulama başarısız. Tekrar deneyin.');
      }
    } finally {
      setMfaLoading(false);
    }
  };

  const inpClass = 'w-full rounded-[10px] px-[14px] py-[10px] text-[14px] text-(--color-text) outline-none transition-[border-color] duration-200';

  // Authenticator kod girişi
  if (step === 'mfa-code') {
    return (
      <AuthLayout
        title="İki Faktörlü Doğrulama"
        subtitle="Authenticator uygulamanızdaki 6 haneli kodu girin"
        imageKey="loginImage"
      >
        <div className="mb-[14px]">
          <label className="block text-[13px] font-semibold text-(--color-text-mid) mb-[6px]">
            Doğrulama Kodu
          </label>
          <input
            autoFocus
            value={mfaCode}
            onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            onFocus={() => setFMfa(true)}
            onBlur={() => setFMfa(false)}
            onKeyDown={(e) => e.key === 'Enter' && submitMfa()}
            placeholder="123456"
            maxLength={6}
            autoComplete="one-time-code"
            inputMode="numeric"
            className={inpClass}
            style={{ border: `1px solid ${fMfa ? 'var(--color-gold)' : 'var(--color-border)'}`, letterSpacing: '0.2em', textAlign: 'center', fontSize: '20px' }}
          />
        </div>

        {err && (
          <div className="bg-(--color-red-bg) border border-(--color-red-border) rounded-[10px] px-[14px] py-[10px] text-(--color-red) text-[13px] mb-3">
            {err}
          </div>
        )}

        <Btn onClick={submitMfa} disabled={mfaLoading} style={{ width: '100%', justifyContent: 'center', marginBottom: '14px' }} size="lg">
          {mfaLoading ? 'Doğrulanıyor...' : 'Doğrula ve Giriş Yap'}
        </Btn>

        <div className="text-center text-[13px] text-(--color-text-mid)">
          <span
            onClick={() => { setStep('login'); setMfaCode(''); setErr(''); setMfaState(null); }}
            className="text-(--color-gold) font-bold cursor-pointer"
          >
            Geri Dön
          </span>
        </div>
      </AuthLayout>
    );
  }

  // Normal login
  return (
    <AuthLayout
      title="Hoş Geldiniz"
      subtitle="Hesabınıza giriş yapın"
      imageKey="loginImage"
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
