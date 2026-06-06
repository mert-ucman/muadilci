import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Btn } from '@/components/ui';

const RESEND_COOLDOWN = 60; // saniye

function EnvelopeIcon() {
  return (
    <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  );
}

export function EmailVerificationPage() {
  const { user, logout, sendVerificationEmail, reloadUser } = useAuth();

  const [cooldown, setCooldown]     = useState(0);
  const [sending, setSending]       = useState(false);
  const [sendErr, setSendErr]       = useState('');
  const [sendOk, setSendOk]         = useState(false);
  const [checking, setChecking]     = useState(false);
  const [checkErr, setCheckErr]     = useState('');

  // Geri sayım
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const handleResend = async () => {
    setSending(true);
    setSendErr('');
    setSendOk(false);
    try {
      await sendVerificationEmail();
      setSendOk(true);
      setCooldown(RESEND_COOLDOWN);
    } catch (e) {
      if (e.code === 'auth/too-many-requests') {
        setSendErr('Çok fazla istek gönderildi. Lütfen birkaç dakika bekleyin.');
      } else {
        setSendErr('Mail gönderilemedi. Lütfen tekrar deneyin.');
      }
    } finally {
      setSending(false);
    }
  };

  const handleCheck = async () => {
    setChecking(true);
    setCheckErr('');
    try {
      const verified = await reloadUser();
      if (!verified) {
        setCheckErr('E-posta henüz doğrulanmamış. Gelen kutunuzu kontrol edin.');
      }
      // verified ise AuthContext user state güncellenir → App.jsx gate kalkar
    } catch {
      setCheckErr('Durum kontrol edilemedi. Tekrar deneyin.');
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="min-h-screen bg-(--color-bg) flex items-center justify-center p-5 font-[--font-body]">
      <div className="bg-white rounded-[20px] shadow-[0_8px_40px_rgba(0,0,0,.1)] px-10 py-12 max-w-[440px] w-full text-center">
        {/* Icon */}
        <div className="w-[88px] h-[88px] rounded-full bg-(--color-gold-bg) border-2 border-(--color-gold-border) flex items-center justify-center mx-auto mb-6 text-(--color-gold)">
          <EnvelopeIcon />
        </div>

        <h1 className="text-[22px] font-black text-(--color-navy) mb-[10px]">
          E-postanı Doğrula
        </h1>
        <p className="text-[14px] text-(--color-text-mid) leading-[1.7] mb-2">
          <strong className="text-(--color-text)">{user?.email}</strong> adresine bir doğrulama bağlantısı gönderdik.
        </p>
        <p className="text-[13px] text-(--color-text-light) leading-[1.6] mb-7">
          Bağlantıya tıkladıktan sonra aşağıdaki butona basın.
        </p>

        {/* Verify button */}
        <Btn
          onClick={handleCheck}
          disabled={checking}
          style={{ width: '100%', justifyContent: 'center', marginBottom: '12px' }}
          size="lg"
        >
          {checking ? 'Kontrol ediliyor...' : '✓ Doğruladım, devam et'}
        </Btn>

        {checkErr && (
          <div className="bg-[#fff5f5] border border-[#fc8181] rounded-[10px] px-[14px] py-[10px] text-[#c53030] text-[13px] mb-3">
            {checkErr}
          </div>
        )}

        {/* Resend */}
        <div className="mb-6">
          {sendOk && (
            <div className="bg-[#f0fff4] border border-[#9ae6b4] rounded-[10px] px-[14px] py-[10px] text-[#276749] text-[13px] mb-[10px]">
              ✓ Doğrulama maili tekrar gönderildi.
            </div>
          )}
          {sendErr && (
            <div className="bg-[#fff5f5] border border-[#fc8181] rounded-[10px] px-[14px] py-[10px] text-[#c53030] text-[13px] mb-[10px]">
              {sendErr}
            </div>
          )}
          <button
            onClick={handleResend}
            disabled={sending || cooldown > 0}
            className="bg-transparent border-none p-1 text-[13px] font-semibold font-[--font-body]"
            style={{
              cursor: cooldown > 0 ? 'default' : 'pointer',
              color: cooldown > 0 ? 'var(--color-text-light)' : 'var(--color-gold)',
              textDecoration: cooldown > 0 ? 'none' : 'underline',
              textUnderlineOffset: '3px',
            }}
          >
            {sending
              ? 'Gönderiliyor...'
              : cooldown > 0
                ? `Yeniden gönder (${cooldown}s)`
                : 'Maili almadım, tekrar gönder'}
          </button>
        </div>

        {/* Info box */}
        <div className="bg-[#f8f9fb] border border-(--color-border) rounded-[10px] px-[14px] py-3 text-[12px] text-(--color-text-light) leading-[1.6] mb-6 text-left">
          Mail gelmiyorsa <strong>spam/junk</strong> klasörünü kontrol edin.
          Birkaç dakika içinde ulaşması gerekir.
        </div>

        {/* Logout */}
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
