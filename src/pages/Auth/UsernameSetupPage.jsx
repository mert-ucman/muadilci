import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { C, F } from '@/constants/theme';
import { Btn } from '@/components/ui';

const USERNAME_RE = /^[a-z0-9_\-]{3,20}$/;

function AtIcon() {
  return (
    <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="4" />
      <path d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-3.92 7.94" />
    </svg>
  );
}

export function UsernameSetupPage() {
  const { user, logout, updateUsername, checkUsername } = useAuth();

  const [username, setUsername]   = useState('');
  const [avail, setAvail]         = useState(null); // null | true | false | 'checking'
  const [saving, setSaving]       = useState(false);
  const [err, setErr]             = useState('');
  const debounceRef               = useRef(null);

  useEffect(() => {
    const key = username.toLowerCase().trim();
    if (!key || key.length < 3) { setAvail(null); return; }
    if (!USERNAME_RE.test(key)) { setAvail(false); return; }
    setAvail('checking');
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      const ok = await checkUsername(key);
      setAvail(ok);
    }, 450);
  }, [username]);

  const handleSave = async () => {
    const key = username.toLowerCase().trim();
    setErr('');
    if (!key) { setErr('Kullanıcı adı boş olamaz.'); return; }
    if (!USERNAME_RE.test(key)) { setErr('3-20 karakter, yalnızca harf, rakam, _ veya - kullanabilirsiniz.'); return; }
    if (!avail) { setErr('Bu kullanıcı adı müsait değil.'); return; }
    setSaving(true);
    try {
      await updateUsername(key);
    } catch (e) {
      if (e.code === 'username-taken') setErr('Bu kullanıcı adı zaten alınmış.');
      else if (e.code === 'username-reserved') setErr('Bu kullanıcı adı kullanılamaz.');
      else setErr('Bir hata oluştu. Tekrar deneyin.');
    } finally {
      setSaving(false);
    }
  };

  const availColor  = avail === true ? '#276749' : avail === false ? '#c53030' : C.textLight;
  const availBg     = avail === true ? '#f0fff4' : avail === false ? '#fff5f5' : C.surface;
  const availBorder = avail === true ? '#9ae6b4' : avail === false ? '#fc8181' : C.border;
  const availMsg    = avail === true ? 'Kullanıcı adı müsait'
    : avail === 'checking' ? 'Kontrol ediliyor...'
    : avail === false ? 'Bu kullanıcı adı alınmış ya da geçersiz'
    : '';

  return (
    <div style={{
      minHeight: '100vh', background: C.bg,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '20px', fontFamily: F,
    }}>
      <div style={{
        background: '#fff', borderRadius: '20px',
        boxShadow: '0 8px 40px rgba(0,0,0,.1)',
        padding: '48px 40px', maxWidth: '440px', width: '100%',
        textAlign: 'center',
      }}>
        <div style={{
          width: '88px', height: '88px', borderRadius: '50%',
          background: C.goldBg, border: `2px solid ${C.goldBorder}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 24px', color: C.gold,
        }}>
          <AtIcon />
        </div>

        <h1 style={{ fontSize: '22px', fontWeight: 900, color: C.navy, marginBottom: '10px' }}>
          Kullanıcı Adı Seç
        </h1>
        <p style={{ fontSize: '14px', color: C.textMid, lineHeight: 1.7, marginBottom: '28px' }}>
          Google ile giriş yaptın. Devam etmek için bir kullanıcı adı seçmen gerekiyor.
        </p>

        <div style={{ textAlign: 'left', marginBottom: '20px' }}>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: C.textMid, marginBottom: '6px', letterSpacing: '.05em', textTransform: 'uppercase' }}>
            Kullanıcı Adı
          </label>
          <div style={{
            display: 'flex', alignItems: 'center',
            border: `1px solid ${username.length >= 3 ? availBorder : C.border}`,
            borderRadius: '10px', overflow: 'hidden',
            background: username.length >= 3 ? availBg : '#fff',
            transition: 'border-color 0.2s, background 0.2s',
          }}>
            <span style={{ padding: '0 12px', color: C.textLight, fontSize: '15px', fontWeight: 500, userSelect: 'none' }}>@</span>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_\-]/g, ''))}
              placeholder="kullanici_adi"
              maxLength={20}
              style={{
                flex: 1, border: 'none', outline: 'none',
                padding: '12px 12px 12px 0',
                fontSize: '15px', color: C.text, background: 'transparent', fontFamily: F,
              }}
            />
          </div>
          {availMsg && (
            <p style={{ fontSize: '12px', color: availColor, marginTop: '6px', textAlign: 'left' }}>
              {availMsg}
            </p>
          )}
          <p style={{ fontSize: '11px', color: C.textLight, marginTop: '5px' }}>
            3-20 karakter. Harf, rakam, _ ve - kullanılabilir.
          </p>
        </div>

        {err && (
          <div style={{
            background: '#fff5f5', border: '1px solid #fc8181',
            borderRadius: '10px', padding: '10px 14px',
            color: '#c53030', fontSize: '13px', marginBottom: '16px', textAlign: 'left',
          }}>
            {err}
          </div>
        )}

        <Btn
          onClick={handleSave}
          disabled={saving || avail !== true}
          style={{ width: '100%', justifyContent: 'center', marginBottom: '16px' }}
          size="lg"
        >
          {saving ? 'Kaydediliyor...' : 'Devam Et'}
        </Btn>

        <button
          onClick={() => logout()}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: '13px', color: C.textLight, fontFamily: F,
            textDecoration: 'underline', textUnderlineOffset: '3px',
          }}
        >
          Farklı bir hesapla giriş yap
        </button>
      </div>
    </div>
  );
}
