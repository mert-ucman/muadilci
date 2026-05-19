import { useState, useEffect } from 'react';
import { useRouter } from '@/contexts/RouterContext';
import { useAuth } from '@/contexts/AuthContext';
import { Btn } from '@/components/ui';
import { AuthLayout, EyeIcon } from './AuthLayout';
import { C } from '@/constants/theme';

const PASS_RULES = [
  { key: 'length',  label: 'En az 8 karakter',       test: (p) => p.length >= 8 },
  { key: 'upper',   label: 'En az bir büyük harf',    test: (p) => /[A-Z]/.test(p) },
  { key: 'lower',   label: 'En az bir küçük harf',    test: (p) => /[a-z]/.test(p) },
  { key: 'special', label: 'En az bir özel karakter', test: (p) => /[^A-Za-z0-9]/.test(p) },
];
const STRENGTH_COLORS = ['', '#e53e3e', '#dd6b20', '#d69e2e', '#38a169'];
const STRENGTH_LABELS = ['', 'Zayıf', 'Orta', 'İyi', 'Güçlü'];

function PasswordStrength({ pass }) {
  if (!pass) return null;
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

export function ResetPasswordPage() {
  const { navigate, query } = useRouter();
  const { verifyResetCode, confirmReset } = useAuth();
  const oobCode = query?.oobCode || '';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [codeValid, setCodeValid] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => {
    if (!oobCode) {
      setErr('Geçersiz sıfırlama bağlantısı. Lütfen yeni bir bağlantı talep edin.');
      setVerifying(false);
      return;
    }
    verifyResetCode(oobCode)
      .then((resolvedEmail) => {
        setEmail(resolvedEmail);
        setCodeValid(true);
        setVerifying(false);
      })
      .catch(() => {
        setErr('Bu bağlantı geçersiz veya süresi dolmuş. Lütfen yeni bir bağlantı talep edin.');
        setVerifying(false);
      });
  }, [oobCode]);

  const submit = async () => {
    if (!password) { setErr('Yeni şifrenizi girin.'); return; }
    if (!isPasswordValid(password)) { setErr('Şifre tüm güvenlik gereksinimlerini karşılamalıdır.'); return; }
    if (password !== confirm) { setErr('Şifreler eşleşmiyor.'); return; }
    setLoading(true);
    setErr('');
    try {
      await confirmReset(oobCode, password);
      setDone(true);
    } catch (e) {
      if (e.code === 'auth/expired-action-code') {
        setErr('Bu bağlantının süresi dolmuş. Lütfen yeni bir bağlantı talep edin.');
      } else if (e.code === 'auth/invalid-action-code') {
        setErr('Geçersiz bağlantı. Lütfen yeni bir bağlantı talep edin.');
      } else if (e.code === 'auth/weak-password') {
        setErr('Şifre çok zayıf. En az 6 karakter kullanın.');
      } else {
        setErr('Bir hata oluştu. Tekrar deneyin.');
      }
    } finally {
      setLoading(false);
    }
  };

  const subtitle = verifying
    ? 'Bağlantı doğrulanıyor...'
    : email
    ? `${email} hesabı için yeni şifre`
    : 'Şifrenizi sıfırlayın';

  return (
    <AuthLayout title="Yeni Şifre Belirle" subtitle={subtitle}>
      {verifying && (
        <div style={{ textAlign: 'center', padding: '24px 0' }}>
          <div style={{
            width: '36px', height: '36px',
            border: `3px solid ${C.border}`, borderTop: `3px solid ${C.gold}`,
            borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px',
          }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          <div style={{ fontSize: '14px', color: C.textLight }}>Bağlantı doğrulanıyor...</div>
        </div>
      )}

      {!verifying && done && (
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <div style={{
            width: '54px', height: '54px', borderRadius: '50%',
            background: C.greenBg, border: `1px solid ${C.greenBorder}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 14px', fontSize: '22px',
          }}>✓</div>
          <div style={{ fontWeight: 700, color: C.text, marginBottom: '8px' }}>Şifreniz güncellendi!</div>
          <div style={{ fontSize: '13px', color: C.textLight, marginBottom: '22px' }}>
            Yeni şifrenizle giriş yapabilirsiniz.
          </div>
          <Btn onClick={() => navigate('/giris')} style={{ width: '100%', justifyContent: 'center' }} size="lg">
            Giriş Yap →
          </Btn>
        </div>
      )}

      {!verifying && !done && !codeValid && (
        <>
          <div style={{
            background: C.redBg, border: `1px solid ${C.redBorder}`,
            borderRadius: '10px', padding: '12px 14px', color: C.red,
            fontSize: '13px', marginBottom: '16px',
          }}>
            ⚠ {err}
          </div>
          <Btn onClick={() => navigate('/sifre-sifirla')} style={{ width: '100%', justifyContent: 'center' }} size="lg">
            Yeni Bağlantı İste
          </Btn>
        </>
      )}

      {!verifying && !done && codeValid && (
        <>
          {err && (
            <div style={{
              background: C.redBg, border: `1px solid ${C.redBorder}`,
              borderRadius: '10px', padding: '10px 14px', color: C.red,
              fontSize: '13px', marginBottom: '12px',
            }}>
              ⚠ {err}
            </div>
          )}

          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: C.textMid, marginBottom: '6px' }}>Yeni Şifre</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPass ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="En az 8 karakter"
                style={{ width: '100%', border: `1px solid ${C.border}`, borderRadius: '10px', padding: '10px 44px 10px 14px', fontSize: '14px', color: C.text, outline: 'none' }}
              />
              <button onClick={() => setShowPass((v) => !v)} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: C.textLight, display: 'flex', padding: '4px' }}>
                <EyeIcon open={showPass} />
              </button>
            </div>
          </div>

          <PasswordStrength pass={password} />

          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: C.textMid, marginBottom: '6px' }}>Şifre Tekrar</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPass ? 'text' : 'password'}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Şifreyi tekrar girin"
                style={{ width: '100%', border: `1px solid ${C.border}`, borderRadius: '10px', padding: '10px 44px 10px 14px', fontSize: '14px', color: C.text, outline: 'none' }}
              />
              <button onClick={() => setShowPass((v) => !v)} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: C.textLight, display: 'flex', padding: '4px' }}>
                <EyeIcon open={showPass} />
              </button>
            </div>
            {confirm && password !== confirm && (
              <div style={{ fontSize: '12px', color: C.red, marginTop: '4px' }}>⚠ Şifreler eşleşmiyor.</div>
            )}
          </div>

          <Btn
            onClick={submit}
            disabled={loading}
            style={{ width: '100%', justifyContent: 'center', marginBottom: '14px' }}
            size="lg"
          >
            {loading ? 'Kaydediliyor...' : 'Şifremi Güncelle'}
          </Btn>
        </>
      )}

      {!done && (
        <div style={{ textAlign: 'center' }}>
          <span
            onClick={() => navigate('/giris')}
            style={{ fontSize: '13px', color: C.gold, cursor: 'pointer' }}
          >
            ← Giriş sayfasına dön
          </span>
        </div>
      )}
    </AuthLayout>
  );
}
