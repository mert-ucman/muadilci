import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from '@/contexts/RouterContext';
import { Btn } from '@/components/ui';
import { AuthLayout, GoogleBtn, Divider, EyeIcon } from './AuthLayout';
import { C } from '@/constants/theme';

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

  const inpStyle = (foc) => ({
    width: '100%',
    border: `1px solid ${foc ? C.gold : C.border}`,
    borderRadius: '10px', padding: '10px 14px', fontSize: '14px',
    color: C.text, outline: 'none', transition: 'border-color .2s',
  });

  return (
    <AuthLayout title="Hoş Geldiniz" subtitle="Hesabınıza giriş yapın">
      <GoogleBtn label="Google ile Giriş Yap" onClick={handleGoogle} loading={googleLoading} />
      <Divider />

      <div style={{ marginBottom: '14px' }}>
        <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: C.textMid, marginBottom: '6px' }}>
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
          style={inpStyle(fId)}
        />
      </div>

      <div style={{ marginBottom: '6px' }}>
        <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: C.textMid, marginBottom: '6px' }}>Şifre</label>
        <div style={{ position: 'relative' }}>
          <input
            type={showP ? 'text' : 'password'}
            value={pass}
            onChange={(e) => setPass(e.target.value)}
            onFocus={() => setFPass(true)}
            onBlur={() => setFPass(false)}
            onKeyDown={(e) => e.key === 'Enter' && submit()}
            placeholder=""
            style={{ ...inpStyle(fPass), padding: '10px 44px 10px 14px' }}
          />
          <button type="button" onClick={() => setShowP((s) => !s)} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: C.textLight, display: 'flex', alignItems: 'center', padding: '4px' }}>
            <EyeIcon open={showP} />
          </button>
        </div>
      </div>

      <div style={{ textAlign: 'right', marginBottom: '16px' }}>
        <span onClick={() => navigate('/sifre-sifirla')} style={{ fontSize: '13px', color: C.gold, cursor: 'pointer', fontWeight: 600 }}>Şifremi unuttum</span>
      </div>

      {err && <div style={{ background: C.redBg, border: `1px solid ${C.redBorder}`, borderRadius: '10px', padding: '10px 14px', color: C.red, fontSize: '13px', marginBottom: '12px' }}>⚠ {err}</div>}
      <Btn onClick={submit} disabled={loading} style={{ width: '100%', justifyContent: 'center', marginBottom: '14px' }} size="lg">
        {loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
      </Btn>
      <div style={{ textAlign: 'center', fontSize: '13px', color: C.textMid }}>
        Hesabın yok mu? <span onClick={() => navigate('/kayit')} style={{ color: C.gold, fontWeight: 700, cursor: 'pointer' }}>Üye Ol</span>
      </div>
    </AuthLayout>
  );
}
