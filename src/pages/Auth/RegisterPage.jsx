import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from '@/contexts/RouterContext';
import { EMAIL_RE } from '@/utils/strings';
import { Btn } from '@/components/ui';
import { AuthLayout, GoogleBtn, Divider, EyeIcon } from './AuthLayout';
import { TermsModal } from './TermsModal';
import { C } from '@/constants/theme';

const USERNAME_RE = /^[a-z0-9_\-]{3,20}$/;

const PASS_RULES = [
  { key: 'length',  label: 'En az 8 karakter',       test: (p) => p.length >= 8 },
  { key: 'upper',   label: 'En az bir büyük harf',    test: (p) => /[A-Z]/.test(p) },
  { key: 'lower',   label: 'En az bir küçük harf',    test: (p) => /[a-z]/.test(p) },
  { key: 'special', label: 'En az bir özel karakter', test: (p) => /[^A-Za-z0-9]/.test(p) },
];
const STRENGTH_LABELS = ['', 'Zayıf', 'Orta', 'İyi', 'Güçlü'];
const STRENGTH_COLORS = ['', '#e53e3e', '#dd6b20', '#d69e2e', '#38a169'];

function PasswordStrength({ pass, touched }) {
  if (!touched && !pass) return null;
  const passed = PASS_RULES.map((r) => r.test(pass));
  const score = passed.filter(Boolean).length;
  return (
    <div style={{ marginTop: '-8px', marginBottom: '14px' }}>
      <div style={{ display: 'flex', gap: '4px', marginBottom: '8px' }}>
        {[0, 1, 2, 3].map((i) => (
          <div key={i} style={{ flex: 1, height: '4px', borderRadius: '2px', background: i < score ? STRENGTH_COLORS[score] : C.border, transition: 'background .25s' }} />
        ))}
        {score > 0 && <span style={{ fontSize: '11px', fontWeight: 700, color: STRENGTH_COLORS[score], marginLeft: '6px', whiteSpace: 'nowrap' }}>{STRENGTH_LABELS[score]}</span>}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 8px' }}>
        {PASS_RULES.map((r, i) => (
          <div key={r.key} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span style={{ fontSize: '12px', color: passed[i] ? '#38a169' : C.textLight, fontWeight: 700 }}>{passed[i] ? '✓' : '○'}</span>
            <span style={{ fontSize: '11px', color: passed[i] ? '#38a169' : C.textLight }}>{r.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function isPasswordValid(p) {
  return PASS_RULES.every((r) => r.test(p));
}

// Kullanıcı adı durum göstergesi
function UsernameStatus({ status }) {
  if (status === 'checking') return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '4px' }}>
      <div style={{ width: '10px', height: '10px', border: `2px solid ${C.border}`, borderTop: `2px solid ${C.gold}`, borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
      <span style={{ fontSize: '12px', color: C.textLight }}>Kontrol ediliyor...</span>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
  if (status === 'available') return (
    <div style={{ fontSize: '12px', color: '#38a169', marginTop: '4px', fontWeight: 600 }}>✓ Kullanıcı adı müsait</div>
  );
  if (status === 'taken') return (
    <div style={{ fontSize: '12px', color: C.red, marginTop: '4px' }}>✗ Bu kullanıcı adı alınmış</div>
  );
  if (status === 'invalid') return (
    <div style={{ fontSize: '12px', color: C.red, marginTop: '4px' }}>3–20 karakter, yalnızca harf, rakam, _ ve -</div>
  );
  if (status === 'reserved') return (
    <div style={{ fontSize: '12px', color: C.red, marginTop: '4px' }}>✗ Bu kullanıcı adı kullanılamaz</div>
  );
  return null;
}

export function RegisterPage() {
  const { register, loginWithGoogle, checkUsername } = useAuth();
  const { navigate } = useRouter();
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showP, setShowP] = useState(false);
  const [showC, setShowC] = useState(false);
  const [passTouched, setPassTouched] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [err, setErr] = useState('');
  const [emailErr, setEmailErr] = useState('');
  const [usernameStatus, setUsernameStatus] = useState(''); // '', 'checking', 'available', 'taken', 'invalid'
  const [fN, setFN] = useState(false);
  const [fU, setFU] = useState(false);
  const [fE, setFE] = useState(false);
  const [fP, setFP] = useState(false);
  const [fC, setFC] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const debounceRef = useRef(null);

  // Kullanıcı adı real-time kontrolü (debounced)
  useEffect(() => {
    if (!username) { setUsernameStatus(''); return; }
    if (!USERNAME_RE.test(username.toLowerCase())) { setUsernameStatus('invalid'); return; }
    const ukey = username.toLowerCase();
    if (ukey.startsWith('admin') || ukey.startsWith('mod')) { setUsernameStatus('reserved'); return; }
    setUsernameStatus('checking');
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      const available = await checkUsername(username);
      setUsernameStatus(available ? 'available' : 'taken');
    }, 600);
    return () => clearTimeout(debounceRef.current);
  }, [username]);

  const validateEmail = (v) => {
    if (v && !EMAIL_RE.test(v)) setEmailErr('Geçerli bir e-posta girin (@ içermeli).');
    else setEmailErr('');
  };

  const handleGoogle = async () => {
    setGoogleLoading(true);
    setErr('');
    try {
      await loginWithGoogle();
      navigate('/');
    } catch {
      setErr('Google ile kayıt olunamadı. Tekrar deneyin.');
    } finally {
      setGoogleLoading(false);
    }
  };

  const submit = async () => {
    if (!name || !username || !email || !pass) { setErr('Tüm alanları doldurun.'); return; }
    if (!EMAIL_RE.test(email)) { setErr('Geçerli bir e-posta girin.'); return; }
    if (!USERNAME_RE.test(username.toLowerCase())) { setErr('Kullanıcı adı geçersiz. 3–20 karakter, yalnızca harf, rakam, _ ve - kullanın.'); return; }
    if (usernameStatus === 'taken') { setErr('Bu kullanıcı adı zaten alınmış.'); return; }
    if (usernameStatus === 'reserved') { setErr('Bu kullanıcı adı kullanılamaz.'); return; }
    if (!isPasswordValid(pass)) { setErr('Şifre tüm güvenlik gereksinimlerini karşılamalıdır.'); setPassTouched(true); return; }
    if (pass !== confirm) { setErr('Şifreler eşleşmiyor.'); return; }
    if (!agreed) { setErr('Kullanım şartlarını kabul edin.'); return; }
    setLoading(true);
    setErr('');
    try {
      await register(name, username, email, pass);
      navigate('/');
    } catch (e) {
      if (e.code === 'username-taken') {
        setErr('Bu kullanıcı adı zaten alınmış.');
      } else if (e.code === 'username-reserved') {
        setErr('Bu kullanıcı adı kullanılamaz.');
      } else if (e.code === 'auth/email-already-in-use') {
        setErr('Bu e-posta zaten kullanımda.');
      } else {
        setErr('Kayıt olunamadı. Tekrar deneyin.');
      }
    } finally {
      setLoading(false);
    }
  };

  const inpStyle = (foc, hasErr) => ({
    width: '100%',
    border: `1px solid ${hasErr ? '#f0b8b0' : foc ? C.gold : C.border}`,
    borderRadius: '10px', padding: '10px 14px', fontSize: '14px',
    color: C.text, outline: 'none', transition: 'border-color .2s',
  });
  const unameBorderColor = usernameStatus === 'available' ? '#38a169' : usernameStatus === 'taken' || usernameStatus === 'invalid' ? '#f0b8b0' : fU ? C.gold : C.border;
  const passStyle = (foc) => ({
    width: '100%',
    border: `1px solid ${foc ? C.gold : C.border}`,
    borderRadius: '10px', padding: '10px 44px 10px 14px', fontSize: '14px',
    color: C.text, outline: 'none', transition: 'border-color .2s',
  });

  return (
    <>
      <TermsModal open={showTerms} onClose={() => setShowTerms(false)} />
      <AuthLayout title="Hesap Oluştur" subtitle="Ücretsiz üye olun, keşfetmeye başlayın">
        <GoogleBtn label="Google ile Kayıt Ol" onClick={handleGoogle} loading={googleLoading} />
        <Divider />

        {/* Ad Soyad */}
        <div style={{ marginBottom: '14px' }}>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: C.textMid, marginBottom: '6px' }}>Ad Soyad</label>
          <input value={name} onChange={(e) => setName(e.target.value)} onFocus={() => setFN(true)} onBlur={() => setFN(false)} onKeyDown={(e) => e.key === 'Enter' && submit()} placeholder="" style={inpStyle(fN, false)} />
        </div>

        {/* Kullanıcı Adı */}
        <div style={{ marginBottom: '14px' }}>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: C.textMid, marginBottom: '6px' }}>
            Kullanıcı Adı
            <span style={{ fontSize: '11px', fontWeight: 400, color: C.textLight, marginLeft: '6px' }}>harf, rakam, _ ve - kullanabilirsiniz</span>
          </label>
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: '13px', top: '50%', transform: 'translateY(-50%)', fontSize: '14px', color: C.textLight, pointerEvents: 'none' }}>@</span>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_\-]/g, ''))}
              onFocus={() => setFU(true)}
              onBlur={() => setFU(false)}
              onKeyDown={(e) => e.key === 'Enter' && submit()}
              placeholder=""
              maxLength={20}
              style={{ ...inpStyle(fU, false), paddingLeft: '28px', border: `1px solid ${unameBorderColor}` }}
            />
          </div>
          <UsernameStatus status={usernameStatus} />
        </div>

        {/* E-posta */}
        <div style={{ marginBottom: '14px' }}>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: C.textMid, marginBottom: '6px' }}>E-posta</label>
          <input type="email" value={email} onChange={(e) => { setEmail(e.target.value); if (emailErr) validateEmail(e.target.value); }} onFocus={() => setFE(true)} onBlur={(e) => { setFE(false); validateEmail(e.target.value); }} onKeyDown={(e) => e.key === 'Enter' && submit()} placeholder="" style={inpStyle(fE, !!emailErr)} />
          {emailErr && <div style={{ fontSize: '12px', color: C.red, marginTop: '4px' }}>⚠ {emailErr}</div>}
        </div>

        {/* Şifre */}
        <div style={{ marginBottom: '14px' }}>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: C.textMid, marginBottom: '6px' }}>Şifre</label>
          <div style={{ position: 'relative' }}>
            <input type={showP ? 'text' : 'password'} value={pass} onChange={(e) => setPass(e.target.value)} onFocus={() => { setFP(true); setPassTouched(true); }} onBlur={() => setFP(false)} onKeyDown={(e) => e.key === 'Enter' && submit()} placeholder="" style={passStyle(fP)} />
            <button type="button" onClick={() => setShowP((s) => !s)} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: C.textLight, display: 'flex', padding: '4px' }}>
              <EyeIcon open={showP} />
            </button>
          </div>
        </div>

        <PasswordStrength pass={pass} touched={passTouched} />

        {/* Şifre Tekrar */}
        <div style={{ marginBottom: '14px' }}>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: C.textMid, marginBottom: '6px' }}>Şifre Tekrar</label>
          <div style={{ position: 'relative' }}>
            <input type={showC ? 'text' : 'password'} value={confirm} onChange={(e) => setConfirm(e.target.value)} onFocus={() => setFC(true)} onBlur={() => setFC(false)} onKeyDown={(e) => e.key === 'Enter' && submit()} placeholder="" style={passStyle(fC)} />
            <button type="button" onClick={() => setShowC((s) => !s)} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: C.textLight, display: 'flex', padding: '4px' }}>
              <EyeIcon open={showC} />
            </button>
          </div>
          {confirm && pass !== confirm && (
            <div style={{ fontSize: '12px', color: C.red, marginTop: '4px' }}>⚠ Şifreler eşleşmiyor.</div>
          )}
        </div>

        {/* Kullanım şartları */}
        <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', marginBottom: '14px' }}>
          <button type="button" onClick={() => setAgreed((s) => !s)}
            style={{ width: '18px', height: '18px', minWidth: '18px', borderRadius: '5px', border: `2px solid ${agreed ? C.gold : C.border}`, background: agreed ? C.gold : 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '1px', flexShrink: 0 }}>
            {agreed && <span style={{ color: '#fff', fontSize: '11px', fontWeight: 900, lineHeight: 1 }}>✓</span>}
          </button>
          <span style={{ fontSize: '13px', color: C.textMid, lineHeight: 1.5 }}>
            <span onClick={() => setShowTerms(true)} style={{ color: C.gold, cursor: 'pointer', textDecoration: 'underline', textUnderlineOffset: '2px' }}>Kullanım Şartları</span>'nı okudum ve kabul ediyorum
          </span>
        </div>

        {err && <div style={{ background: C.redBg, border: `1px solid ${C.redBorder}`, borderRadius: '10px', padding: '10px 14px', color: C.red, fontSize: '13px', marginBottom: '12px' }}>⚠ {err}</div>}
        <Btn onClick={submit} disabled={loading} style={{ width: '100%', justifyContent: 'center', marginBottom: '14px' }} size="lg">
          {loading ? 'Kayıt olunuyor...' : 'Üye Ol'}
        </Btn>
        <div style={{ textAlign: 'center', fontSize: '13px', color: C.textMid }}>
          Zaten üye misin? <span onClick={() => navigate('/giris')} style={{ color: C.gold, fontWeight: 700, cursor: 'pointer' }}>Giriş Yap</span>
        </div>
      </AuthLayout>
    </>
  );
}
