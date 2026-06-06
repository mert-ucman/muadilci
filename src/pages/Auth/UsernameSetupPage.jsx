import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
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

  const availColor  = avail === true ? '#276749' : avail === false ? '#c53030' : 'var(--color-text-light)';
  const availBg     = avail === true ? '#f0fff4' : avail === false ? '#fff5f5' : 'var(--color-surface)';
  const availBorder = avail === true ? '#9ae6b4' : avail === false ? '#fc8181' : 'var(--color-border)';
  const availMsg    = avail === true ? 'Kullanıcı adı müsait'
    : avail === 'checking' ? 'Kontrol ediliyor...'
    : avail === false ? 'Bu kullanıcı adı alınmış ya da geçersiz'
    : '';

  return (
    <div className="min-h-screen bg-(--color-bg) flex items-center justify-center p-5 font-[--font-body]">
      <div className="bg-white rounded-[20px] shadow-[0_8px_40px_rgba(0,0,0,.1)] px-10 py-12 max-w-[440px] w-full text-center">
        <div className="w-[88px] h-[88px] rounded-full bg-(--color-gold-bg) border-2 border-(--color-gold-border) flex items-center justify-center mx-auto mb-6 text-(--color-gold)">
          <AtIcon />
        </div>

        <h1 className="text-[22px] font-black text-(--color-navy) mb-[10px]">
          Kullanıcı Adı Seç
        </h1>
        <p className="text-[14px] text-(--color-text-mid) leading-[1.7] mb-7">
          Google ile giriş yaptın. Devam etmek için bir kullanıcı adı seçmen gerekiyor.
        </p>

        <div className="text-left mb-5">
          <label className="block text-[12px] font-semibold text-(--color-text-mid) mb-[6px] tracking-[.05em] uppercase">
            Kullanıcı Adı
          </label>
          <div
            className="flex items-center rounded-[10px] overflow-hidden transition-[border-color,background] duration-200"
            style={{
              border: `1px solid ${username.length >= 3 ? availBorder : 'var(--color-border)'}`,
              background: username.length >= 3 ? availBg : '#fff',
            }}
          >
            <span className="px-3 text-(--color-text-light) text-[15px] font-medium select-none">@</span>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_\-]/g, ''))}
              placeholder="kullanici_adi"
              maxLength={20}
              className="flex-1 border-none outline-none py-3 pr-3 text-[15px] text-(--color-text) bg-transparent font-[--font-body]"
            />
          </div>
          {availMsg && (
            <p className="text-[12px] mt-[6px] text-left" style={{ color: availColor }}>
              {availMsg}
            </p>
          )}
          <p className="text-[11px] text-(--color-text-light) mt-[5px]">
            3-20 karakter. Harf, rakam, _ ve - kullanılabilir.
          </p>
        </div>

        {err && (
          <div className="bg-[#fff5f5] border border-[#fc8181] rounded-[10px] px-[14px] py-[10px] text-[#c53030] text-[13px] mb-4 text-left">
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
          className="bg-transparent border-none cursor-pointer text-[13px] text-(--color-text-light) font-[--font-body] underline underline-offset-[3px]"
        >
          Farklı bir hesapla giriş yap
        </button>
      </div>
    </div>
  );
}
