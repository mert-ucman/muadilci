import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from '@/contexts/RouterContext';
import { EMAIL_RE } from '@/utils/strings';
import { Btn } from '@/components/ui';
import { AuthLayout, GoogleBtn, Divider, EyeIcon } from './AuthLayout';
import { C } from '@/constants/theme';

export function RegisterPage() {
  const { login } = useAuth();
  const { navigate } = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showP, setShowP] = useState(false);
  const [showC, setShowC] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [err, setErr] = useState('');
  const [emailErr, setEmailErr] = useState('');
  const [fN, setFN] = useState(false);
  const [fE, setFE] = useState(false);
  const [fP, setFP] = useState(false);
  const [fC, setFC] = useState(false);

  const validate = (v) => {
    if (v && !EMAIL_RE.test(v)) setEmailErr('Geçerli bir e-posta girin (@ içermeli).');
    else setEmailErr('');
  };

  const submit = () => {
    if (!name || !email || !pass) { setErr('Tüm alanları doldurun.'); return; }
    if (!EMAIL_RE.test(email)) { setErr('Geçerli bir e-posta girin.'); return; }
    if (pass !== confirm) { setErr('Şifreler eşleşmiyor.'); return; }
    if (!agreed) { setErr('Kullanım şartlarını kabul edin.'); return; }
    login({ id: Date.now(), name, email, role: 'user', avatar: name[0].toUpperCase() });
    navigate('/');
  };

  const inpStyle = (foc, hasErr) => ({ width: '100%', border: `1px solid ${hasErr ? '#f0b8b0' : foc ? C.gold : C.border}`, borderRadius: '10px', padding: '10px 14px', fontSize: '14px', color: C.text, outline: 'none', transition: 'border-color .2s' });
  const passStyle = (foc) => ({ width: '100%', border: `1px solid ${foc ? C.gold : C.border}`, borderRadius: '10px', padding: '10px 44px 10px 14px', fontSize: '14px', color: C.text, outline: 'none', transition: 'border-color .2s' });

  return (
    <AuthLayout title="Hesap Oluştur" subtitle="Ücretsiz üye olun, keşfetmeye başlayın">
      <GoogleBtn label="Google ile Kayıt Ol" />
      <Divider />

      <div style={{ marginBottom: '14px' }}>
        <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: C.textMid, marginBottom: '6px' }}>Ad Soyad</label>
        <input value={name} onChange={(e) => setName(e.target.value)} onFocus={() => setFN(true)} onBlur={() => setFN(false)} onKeyDown={(e) => e.key === 'Enter' && submit()} placeholder="Adınız Soyadınız" style={inpStyle(fN, false)} />
      </div>

      <div style={{ marginBottom: '14px' }}>
        <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: C.textMid, marginBottom: '6px' }}>E-posta</label>
        <input type="email" value={email} onChange={(e) => { setEmail(e.target.value); if (emailErr) validate(e.target.value); }} onFocus={() => setFE(true)} onBlur={(e) => { setFE(false); validate(e.target.value); }} onKeyDown={(e) => e.key === 'Enter' && submit()} placeholder="ornek@mail.com" style={inpStyle(fE, !!emailErr)} />
        {emailErr && <div style={{ fontSize: '12px', color: C.red, marginTop: '4px' }}>⚠ {emailErr}</div>}
      </div>

      {[['Şifre', pass, setPass, showP, setShowP, fP, setFP], ['Şifre Tekrar', confirm, setConfirm, showC, setShowC, fC, setFC]].map(([label, val, setVal, show, setShow, foc, setFoc]) => (
        <div key={label} style={{ marginBottom: '14px' }}>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: C.textMid, marginBottom: '6px' }}>{label}</label>
          <div style={{ position: 'relative' }}>
            <input type={show ? 'text' : 'password'} value={val} onChange={(e) => setVal(e.target.value)} onFocus={() => setFoc(true)} onBlur={() => setFoc(false)} onKeyDown={(e) => e.key === 'Enter' && submit()} placeholder="••••••••" style={passStyle(foc)} />
            <button type="button" onClick={() => setShow((s) => !s)} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: C.textLight, display: 'flex', padding: '4px' }}>
              <EyeIcon open={show} />
            </button>
          </div>
        </div>
      ))}

      <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', marginBottom: '14px' }}>
        <button type="button" onClick={() => setAgreed((s) => !s)}
          style={{ width: '18px', height: '18px', minWidth: '18px', borderRadius: '5px', border: `2px solid ${agreed ? C.gold : C.border}`, background: agreed ? C.gold : 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '1px', flexShrink: 0 }}>
          {agreed && <span style={{ color: '#fff', fontSize: '11px', fontWeight: 900, lineHeight: 1 }}>✓</span>}
        </button>
        <span style={{ fontSize: '13px', color: C.textMid, lineHeight: 1.5 }}>
          <span style={{ color: C.gold, cursor: 'pointer' }}>Kullanım Şartları</span>'nı okudum ve kabul ediyorum
        </span>
      </div>

      {err && <div style={{ background: C.redBg, border: `1px solid ${C.redBorder}`, borderRadius: '10px', padding: '10px 14px', color: C.red, fontSize: '13px', marginBottom: '12px' }}>⚠ {err}</div>}
      <Btn onClick={submit} style={{ width: '100%', justifyContent: 'center', marginBottom: '14px' }} size="lg">Üye Ol</Btn>
      <div style={{ textAlign: 'center', fontSize: '13px', color: C.textMid }}>
        Zaten üye misin? <span onClick={() => navigate('/giris')} style={{ color: C.gold, fontWeight: 700, cursor: 'pointer' }}>Giriş Yap</span>
      </div>
    </AuthLayout>
  );
}
