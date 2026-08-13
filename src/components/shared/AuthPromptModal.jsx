import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from '@/contexts/RouterContext';
import { Modal, Btn } from '@/components/ui';
import { C, F } from '@/constants/theme';

// Resmi Google "G" logosu (free-solid ikon setinde marka logosu yok → inline SVG)
function GoogleG() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
    </svg>
  );
}

// Anonim kullanıcı "Gönder"e basınca açılır. Değerlendirme taslağı bu modal
// açılmadan ÖNCE localStorage'a kaydedilmiştir; giriş/üyelik sonrası otomatik
// gönderilir. Modal yalnızca kimlik doğrulamayı yürütür.
export function AuthPromptModal({ open, onClose }) {
  const { loginWithGoogle, loginWithEmail } = useAuth();
  const { navigate } = useRouter();
  const [identifier, setIdentifier] = useState('');
  const [pass, setPass] = useState('');
  const [loading, setLoading] = useState('');
  const [err, setErr] = useState('');

  const handleGoogle = async () => {
    setErr(''); setLoading('google');
    try {
      await loginWithGoogle();
      onClose();
      // Giriş sonrası Comparison resume effect taslağı otomatik gönderir.
    } catch (e) {
      if (e.code === 'auth/popup-closed-by-user' || e.code === 'auth/cancelled-popup-request') setErr('');
      else setErr('Google ile giriş yapılamadı. Tekrar deneyin.');
    } finally { setLoading(''); }
  };

  const handleLogin = async () => {
    if (!identifier.trim() || !pass) { setErr('E-posta/kullanıcı adı ve şifre gerekli.'); return; }
    setErr(''); setLoading('email');
    try {
      await loginWithEmail(identifier.trim(), pass);
      onClose();
    } catch (e) {
      if (e.code === 'auth/multi-factor-auth-required') setErr('Bu hesap için lütfen Giriş sayfasını kullanın.');
      else if (e.code === 'auth/account-expired') setErr('Doğrulama süresi doldu; lütfen tekrar üye olun.');
      else if (e.code === 'auth/too-many-requests') setErr('Çok fazla deneme yapıldı. Lütfen bekleyin.');
      else if (e.code === 'auth/network-request-failed') setErr('İnternet bağlantınız yok.');
      else setErr('E-posta/kullanıcı adı veya şifre hatalı.');
    } finally { setLoading(''); }
  };

  const busy = !!loading;
  const inputStyle = {
    width: '100%', boxSizing: 'border-box', border: `1px solid ${C.border}`,
    borderRadius: '10px', padding: '10px 14px', fontSize: '14px', color: C.text,
    outline: 'none', fontFamily: F, background: C.card,
  };

  return (
    <Modal open={open} onClose={onClose} title="Değerlendirmeni kaydet" width="420px">
      <p className="text-[13px] leading-[1.7] mb-4" style={{ color: C.textMid }}>
        Puanını kaydetmek ve profilinde biriktirmek için ücretsiz üye ol ya da giriş yap.
        Değerlendirmen kaybolmaz — girişten hemen sonra otomatik gönderilir.
      </p>

      {/* Google (birincil) */}
      <button
        onClick={handleGoogle}
        disabled={busy}
        className="w-full flex items-center justify-center gap-[10px] rounded-[10px] py-[11px] text-[14px] font-semibold cursor-pointer transition-[background] duration-150"
        style={{ border: `1px solid ${C.border}`, background: '#fff', color: C.text, fontFamily: F, opacity: busy ? 0.7 : 1 }}
      >
        <GoogleG />
        {loading === 'google' ? 'Google açılıyor…' : 'Google ile devam et'}
      </button>

      {/* Ayraç */}
      <div className="flex items-center gap-3 my-4">
        <div className="flex-1 h-px" style={{ background: C.border }} />
        <span className="text-[12px]" style={{ color: C.textLight, fontFamily: F }}>veya</span>
        <div className="flex-1 h-px" style={{ background: C.border }} />
      </div>

      {/* E-posta ile giriş */}
      <div className="flex flex-col gap-[10px]">
        <input
          type="text" value={identifier} onChange={(e) => { setIdentifier(e.target.value); if (err) setErr(''); }}
          placeholder="E-posta veya kullanıcı adı" autoComplete="username" style={inputStyle}
        />
        <input
          type="password" value={pass} onChange={(e) => { setPass(e.target.value); if (err) setErr(''); }}
          onKeyDown={(e) => { if (e.key === 'Enter' && !busy) handleLogin(); }}
          placeholder="Şifre" autoComplete="current-password" style={inputStyle}
        />
        {err && (
          <div className="rounded-[10px] px-[12px] py-[9px] text-[13px]" style={{ background: '#fff5f5', border: '1px solid #fc8181', color: '#c53030' }}>
            {err}
          </div>
        )}
        <Btn onClick={handleLogin} disabled={busy} style={{ width: '100%', justifyContent: 'center' }}>
          {loading === 'email' ? 'Giriş yapılıyor…' : 'Giriş Yap'}
        </Btn>
      </div>

      {/* Üye ol → kayıt sayfası (taslak korunur, dönüşte otomatik gönderilir) */}
      <div className="text-center mt-4 text-[13px]" style={{ color: C.textMid, fontFamily: F }}>
        Hesabın yok mu?{' '}
        <button
          onClick={() => { onClose(); navigate('/kayit'); }}
          disabled={busy}
          className="font-bold cursor-pointer bg-transparent border-none p-0"
          style={{ color: C.gold, fontFamily: F }}
        >
          Ücretsiz Üye Ol
        </button>
      </div>
    </Modal>
  );
}
