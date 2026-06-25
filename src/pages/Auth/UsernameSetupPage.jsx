import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Btn } from '@/components/ui';
import { AuthLayout } from './AuthLayout';

const USERNAME_RE = /^[a-z0-9_\-]{3,20}$/;

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
    <AuthLayout
      title="Kullanıcı Adı Seç"
      subtitle="Google ile giriş yaptın. Devam etmek için bir kullanıcı adı seçmen gerekiyor."
      imageKey="loginImage"
    >
      <div className="mb-5">
        <label className="block text-[13px] font-semibold text-(--color-text-mid) mb-[6px]">
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
            autoFocus
            value={username}
            onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_\-]/g, ''))}
            onKeyDown={(e) => e.key === 'Enter' && handleSave()}
            placeholder="kullanici_adi"
            maxLength={20}
            className="flex-1 border-none outline-none py-[10px] pr-3 text-[14px] text-(--color-text) bg-transparent"
          />
        </div>
        {availMsg && (
          <p className="text-[12px] mt-[6px]" style={{ color: availColor }}>
            {availMsg}
          </p>
        )}
        <p className="text-[11px] text-(--color-text-light) mt-[5px]">
          3-20 karakter. Harf, rakam, _ ve - kullanılabilir.
        </p>
      </div>

      {err && (
        <div className="bg-(--color-red-bg) border border-(--color-red-border) rounded-[10px] px-[14px] py-[10px] text-(--color-red) text-[13px] mb-4">
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

      <div className="text-center">
        <button
          onClick={() => logout()}
          className="bg-transparent border-none cursor-pointer text-[13px] text-(--color-text-light) underline underline-offset-[3px]"
        >
          Farklı bir hesapla giriş yap
        </button>
      </div>
    </AuthLayout>
  );
}
