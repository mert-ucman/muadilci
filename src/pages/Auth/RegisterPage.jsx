import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from '@/contexts/RouterContext';
import { EMAIL_RE } from '@/utils/strings';
import { containsProfanity } from '@/utils/profanity';
import { Btn } from '@/components/ui';
import { AuthLayout, GoogleBtn, Divider, EyeIcon } from './AuthLayout';
import { TermsModal } from './TermsModal';

const USERNAME_RE = /^[a-z0-9_\-]{3,20}$/;

// Her kelimenin ilk harfini Türkçe uyumlu büyütür
function toTitleCase(str) {
  return str.replace(/\S+/g, (w) =>
    w.replace(/^./,  (c) => c.toLocaleUpperCase('tr-TR'))
  );
}
const RESERVED_WORDS = [
  'admin', 'mod', 'moderator', 'moderatör', 'muadilci',
  'support', 'destek', 'official', 'resmi', 'sistem',
  'yonetim', 'yönetim', 'staff', 'ekip', 'team', 'root', 'superuser',
];
const isReserved = (key) => RESERVED_WORDS.some((w) => key.includes(w)) || containsProfanity(key);

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
    <div className="-mt-2 mb-[14px]">
      <div className="flex gap-1 mb-2">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="flex-1 h-1 rounded-[2px] transition-[background] duration-200"
            style={{ background: i < score ? STRENGTH_COLORS[score] : 'var(--color-border)' }}
          />
        ))}
        {score > 0 && (
          <span
            className="text-[11px] font-bold ml-[6px] whitespace-nowrap"
            style={{ color: STRENGTH_COLORS[score] }}
          >
            {STRENGTH_LABELS[score]}
          </span>
        )}
      </div>
      <div className="grid grid-cols-2 gap-x-2 gap-y-1">
        {PASS_RULES.map((r, i) => (
          <div key={r.key} className="flex items-center gap-[5px]">
            <span
              className="text-[12px] font-bold"
              style={{ color: passed[i] ? '#38a169' : 'var(--color-text-light)' }}
            >
              {passed[i] ? '✓' : '○'}
            </span>
            <span
              className="text-[11px]"
              style={{ color: passed[i] ? '#38a169' : 'var(--color-text-light)' }}
            >
              {r.label}
            </span>
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
    <div className="flex items-center gap-[5px] mt-1">
      <div
        className="w-[10px] h-[10px] rounded-full border-2 border-(--color-border)"
        style={{ borderTopColor: 'var(--color-gold)', animation: 'spin 0.7s linear infinite' }}
      />
      <span className="text-[12px] text-(--color-text-light)">Kontrol ediliyor...</span>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
  if (status === 'available') return (
    <div className="text-[12px] mt-1 font-semibold" style={{ color: '#38a169' }}>✓ Kullanıcı adı müsait</div>
  );
  if (status === 'taken') return (
    <div className="text-[12px] text-(--color-red) mt-1">✗ Bu kullanıcı adı alınmış</div>
  );
  if (status === 'invalid') return (
    <div className="text-[12px] text-(--color-red) mt-1">3–20 karakter, yalnızca harf, rakam, _ ve -</div>
  );
  if (status === 'reserved') return (
    <div className="text-[12px] text-(--color-red) mt-1">✗ Bu kullanıcı adı kullanılamaz</div>
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
    if (isReserved(ukey)) { setUsernameStatus('reserved'); return; }
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

  const inpClass = 'w-full rounded-[10px] px-[14px] py-[10px] text-[14px] text-(--color-text) outline-none transition-[border-color] duration-200';
  const unameBorderColor = usernameStatus === 'available' ? '#38a169' : usernameStatus === 'taken' || usernameStatus === 'invalid' ? 'var(--color-red-border)' : fU ? 'var(--color-gold)' : 'var(--color-border)';

  return (
    <>
      <TermsModal open={showTerms} onClose={() => setShowTerms(false)} />
      <AuthLayout title="Hesap Oluştur" subtitle="Ücretsiz üye olun, keşfetmeye başlayın" imageKey="signupImage" wide>
        <GoogleBtn label="Google ile Kayıt Ol" onClick={handleGoogle} loading={googleLoading} />
        <Divider />

        {/* 2-column grid — mobilede tek sütun */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-3">

          {/* Sol sütun: Ad Soyad + Kullanıcı Adı */}
          <div>
            <div className="mb-[12px]">
              <label className="block text-[13px] font-semibold text-(--color-text-mid) mb-[6px]">Ad Soyad</label>
              <input
                value={name}
                onChange={(e) => setName(toTitleCase(e.target.value))}
                onFocus={() => setFN(true)}
                onBlur={() => setFN(false)}
                onKeyDown={(e) => e.key === 'Enter' && submit()}
                placeholder=""
                className={inpClass}
                style={{ border: `1px solid ${fN ? 'var(--color-gold)' : 'var(--color-border)'}` }}
              />
            </div>

            <div className="mb-[12px]">
              <label className="block text-[13px] font-semibold text-(--color-text-mid) mb-[6px]">
                Kullanıcı Adı
              </label>
              <div className="relative">
                <span className="absolute left-[13px] top-1/2 -translate-y-1/2 text-[14px] text-(--color-text-light) pointer-events-none">@</span>
                <input
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_\-]/g, ''))}
                  onFocus={() => setFU(true)}
                  onBlur={() => setFU(false)}
                  onKeyDown={(e) => e.key === 'Enter' && submit()}
                  placeholder=""
                  maxLength={20}
                  className={inpClass}
                  style={{ paddingLeft: '28px', border: `1px solid ${unameBorderColor}` }}
                />
              </div>
              <UsernameStatus status={usernameStatus} />
            </div>
          </div>

          {/* Sağ sütun: E-posta + Şifre */}
          <div>
            <div className="mb-[12px]">
              <label className="block text-[13px] font-semibold text-(--color-text-mid) mb-[6px]">E-posta</label>
              <input
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); if (emailErr) validateEmail(e.target.value); }}
                onFocus={() => setFE(true)}
                onBlur={(e) => { setFE(false); validateEmail(e.target.value); }}
                onKeyDown={(e) => e.key === 'Enter' && submit()}
                placeholder=""
                className={inpClass}
                style={{ border: `1px solid ${emailErr ? 'var(--color-red-border)' : fE ? 'var(--color-gold)' : 'var(--color-border)'}` }}
              />
              {emailErr && (
                <div className="text-[12px] text-(--color-red) mt-1">{emailErr}</div>
              )}
            </div>

            <div className="mb-[4px]">
              <label className="block text-[13px] font-semibold text-(--color-text-mid) mb-[6px]">Şifre</label>
              <div className="relative">
                <input
                  type={showP ? 'text' : 'password'}
                  value={pass}
                  onChange={(e) => setPass(e.target.value)}
                  onFocus={() => { setFP(true); setPassTouched(true); }}
                  onBlur={() => setFP(false)}
                  onKeyDown={(e) => e.key === 'Enter' && submit()}
                  placeholder=""
                  className={inpClass}
                  style={{ paddingRight: '44px', border: `1px solid ${fP ? 'var(--color-gold)' : 'var(--color-border)'}` }}
                />
                <button
                  type="button"
                  onClick={() => setShowP((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 bg-transparent border-none cursor-pointer text-(--color-text-light) flex p-1"
                >
                  <EyeIcon open={showP} />
                </button>
              </div>
            </div>
          </div>

        </div>

        <PasswordStrength pass={pass} touched={passTouched} />

        {/* Şifre Tekrar — tam genişlik */}
        <div className="mb-[12px]">
          <label className="block text-[13px] font-semibold text-(--color-text-mid) mb-[6px]">Şifre Tekrar</label>
          <div className="relative">
            <input
              type={showC ? 'text' : 'password'}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              onFocus={() => setFC(true)}
              onBlur={() => setFC(false)}
              onKeyDown={(e) => e.key === 'Enter' && submit()}
              placeholder=""
              className={inpClass}
              style={{ paddingRight: '44px', border: `1px solid ${fC ? 'var(--color-gold)' : 'var(--color-border)'}` }}
            />
            <button
              type="button"
              onClick={() => setShowC((s) => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 bg-transparent border-none cursor-pointer text-(--color-text-light) flex p-1"
            >
              <EyeIcon open={showC} />
            </button>
          </div>
          {confirm && pass !== confirm && (
            <div className="text-[12px] text-(--color-red) mt-1">Şifreler eşleşmiyor.</div>
          )}
        </div>

        {/* Kullanım şartları */}
        <div className="flex gap-[10px] items-start mb-[12px]">
          <button
            type="button"
            onClick={() => setAgreed((s) => !s)}
            className="w-[18px] h-[18px] min-w-[18px] rounded-[5px] cursor-pointer flex items-center justify-center mt-[1px] shrink-0"
            style={{
              border: `2px solid ${agreed ? 'var(--color-gold)' : 'var(--color-border)'}`,
              background: agreed ? 'var(--color-gold)' : 'transparent',
            }}
          >
            {agreed && <span className="text-white text-[11px] font-black leading-none">✓</span>}
          </button>
          <span className="text-[13px] text-(--color-text-mid) leading-[1.5]">
            <span
              onClick={() => setShowTerms(true)}
              className="text-(--color-gold) cursor-pointer underline underline-offset-[2px]"
            >
              Kullanım Şartları
            </span>'nı okudum ve kabul ediyorum
          </span>
        </div>

        {err && (
          <div className="bg-(--color-red-bg) border border-(--color-red-border) rounded-[10px] px-[14px] py-[10px] text-(--color-red) text-[13px] mb-3">
            {err}
          </div>
        )}
        <Btn onClick={submit} disabled={loading} style={{ width: '100%', justifyContent: 'center', marginBottom: '14px' }} size="lg">
          {loading ? 'Kayıt olunuyor...' : 'Üye Ol'}
        </Btn>
        <div className="text-center text-[13px] text-(--color-text-mid)">
          Zaten üye misin?
          <br />
          <span
            onClick={() => navigate('/giris')}
            className="text-(--color-gold) font-bold cursor-pointer"
          >
            Giriş Yap
          </span>
        </div>
      </AuthLayout>
    </>
  );
}
