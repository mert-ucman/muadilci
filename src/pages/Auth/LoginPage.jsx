import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from '@/contexts/RouterContext';
import { EMAIL_RE } from '@/utils/strings';
import { Btn } from '@/components/ui';
import { AuthLayout, GoogleBtn, Divider, EyeIcon } from './AuthLayout';
import { C } from '@/constants/theme';

const DEMO_USERS = [
  { id: 1, name: 'Admin', email: 'admin@muadilci.com', role: 'admin', avatar: 'A' },
  { id: 2, name: 'Moderatör', email: 'mod@muadilci.com', role: 'moderator', avatar: 'M' },
];

export function LoginPage() {
  const { login } = useAuth();
  const { navigate } = useRouter();
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [showP, setShowP] = useState(false);
  const [err, setErr] = useState('');
  const [emailErr, setEmailErr] = useState('');
  const [fEmail, setFEmail] = useState(false);
  const [fPass, setFPass] = useState(false);

  const validate = (v) => {
    if (v && !EMAIL_RE.test(v)) setEmailErr('Geçerli bir e-posta girin (@ içermeli).');
    else setEmailErr('');
  };

  const submit = () => {
    if (!email || !pass) { setErr('Tüm alanları doldurun.'); return; }
    if (!EMAIL_RE.test(email)) { setErr('Geçerli bir e-posta girin.'); return; }
    const demo = DEMO_USERS.find((u) => u.email === email);
    if (demo) { login(demo); navigate('/'); return; }
    login({ id: Date.now(), name: email.split('@')[0], email, role: 'user', avatar: email[0].toUpperCase() });
    navigate('/');
  };

  return (
    <AuthLayout title="Hoş Geldiniz" subtitle="Hesabınıza giriş yapın">
      <GoogleBtn label="Google ile Giriş Yap" />
      <Divider />
      <div style={{ background: C.blueBg, border: '1px solid #bdd3f8', borderRadius: '10px', padding: '10px 14px', marginBottom: '14px', fontSize: '12px', color: '#1e40af', lineHeight: 1.7 }}>
        <strong>Demo:</strong> admin@muadilci.com → Admin | mod@muadilci.com → Moderatör | Başka e-posta → Üye
      </div>

      <div style={{ marginBottom: '14px' }}>
        <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: C.textMid, marginBottom: '6px' }}>E-posta</label>
        <input type="email" value={email}
          onChange={(e) => { setEmail(e.target.value); if (emailErr) validate(e.target.value); }}
          onFocus={() => setFEmail(true)}
          onBlur={(e) => { setFEmail(false); validate(e.target.value); }}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
          placeholder="ornek@mail.com"
          style={{ width: '100%', border: `1px solid ${emailErr ? '#f0b8b0' : fEmail ? C.gold : C.border}`, borderRadius: '10px', padding: '10px 14px', fontSize: '14px', color: C.text, outline: 'none', transition: 'border-color .2s' }} />
        {emailErr && <div style={{ fontSize: '12px', color: C.red, marginTop: '4px' }}>⚠ {emailErr}</div>}
      </div>

      <div style={{ marginBottom: '6px' }}>
        <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: C.textMid, marginBottom: '6px' }}>Şifre</label>
        <div style={{ position: 'relative' }}>
          <input type={showP ? 'text' : 'password'} value={pass}
            onChange={(e) => setPass(e.target.value)}
            onFocus={() => setFPass(true)} onBlur={() => setFPass(false)}
            onKeyDown={(e) => e.key === 'Enter' && submit()}
            placeholder="••••••••"
            style={{ width: '100%', border: `1px solid ${fPass ? C.gold : C.border}`, borderRadius: '10px', padding: '10px 44px 10px 14px', fontSize: '14px', color: C.text, outline: 'none', transition: 'border-color .2s' }} />
          <button type="button" onClick={() => setShowP((s) => !s)} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: C.textLight, display: 'flex', alignItems: 'center', padding: '4px' }}>
            <EyeIcon open={showP} />
          </button>
        </div>
      </div>

      <div style={{ textAlign: 'right', marginBottom: '16px' }}>
        <span onClick={() => navigate('/sifre-sifirla')} style={{ fontSize: '13px', color: C.gold, cursor: 'pointer', fontWeight: 600 }}>Şifremi unuttum</span>
      </div>

      {err && <div style={{ background: C.redBg, border: `1px solid ${C.redBorder}`, borderRadius: '10px', padding: '10px 14px', color: C.red, fontSize: '13px', marginBottom: '12px' }}>⚠ {err}</div>}
      <Btn onClick={submit} style={{ width: '100%', justifyContent: 'center', marginBottom: '14px' }} size="lg">Giriş Yap</Btn>
      <div style={{ textAlign: 'center', fontSize: '13px', color: C.textMid }}>
        Hesabın yok mu? <span onClick={() => navigate('/kayit')} style={{ color: C.gold, fontWeight: 700, cursor: 'pointer' }}>Üye Ol</span>
      </div>
    </AuthLayout>
  );
}
