import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { C, F } from '@/constants/theme';
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
        {/* İkon */}
        <div style={{
          width: '88px', height: '88px', borderRadius: '50%',
          background: C.goldBg, border: `2px solid ${C.goldBorder}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 24px', color: C.gold,
        }}>
          <EnvelopeIcon />
        </div>

        <h1 style={{ fontSize: '22px', fontWeight: 900, color: C.navy, marginBottom: '10px' }}>
          E-postanı Doğrula
        </h1>
        <p style={{ fontSize: '14px', color: C.textMid, lineHeight: 1.7, marginBottom: '8px' }}>
          <strong style={{ color: C.text }}>{user?.email}</strong> adresine bir doğrulama bağlantısı gönderdik.
        </p>
        <p style={{ fontSize: '13px', color: C.textLight, lineHeight: 1.6, marginBottom: '28px' }}>
          Bağlantıya tıkladıktan sonra aşağıdaki butona basın.
        </p>

        {/* Doğruladım butonu */}
        <Btn
          onClick={handleCheck}
          disabled={checking}
          style={{ width: '100%', justifyContent: 'center', marginBottom: '12px' }}
          size="lg"
        >
          {checking ? 'Kontrol ediliyor...' : '✓ Doğruladım, devam et'}
        </Btn>

        {checkErr && (
          <div style={{
            background: '#fff5f5', border: '1px solid #fc8181',
            borderRadius: '10px', padding: '10px 14px',
            color: '#c53030', fontSize: '13px', marginBottom: '12px',
          }}>
            ⚠ {checkErr}
          </div>
        )}

        {/* Yeniden gönder */}
        <div style={{ marginBottom: '24px' }}>
          {sendOk && (
            <div style={{
              background: '#f0fff4', border: '1px solid #9ae6b4',
              borderRadius: '10px', padding: '10px 14px',
              color: '#276749', fontSize: '13px', marginBottom: '10px',
            }}>
              ✓ Doğrulama maili tekrar gönderildi.
            </div>
          )}
          {sendErr && (
            <div style={{
              background: '#fff5f5', border: '1px solid #fc8181',
              borderRadius: '10px', padding: '10px 14px',
              color: '#c53030', fontSize: '13px', marginBottom: '10px',
            }}>
              ⚠ {sendErr}
            </div>
          )}
          <button
            onClick={handleResend}
            disabled={sending || cooldown > 0}
            style={{
              background: 'none', border: 'none', cursor: cooldown > 0 ? 'default' : 'pointer',
              fontSize: '13px', fontFamily: F, fontWeight: 600,
              color: cooldown > 0 ? C.textLight : C.gold,
              textDecoration: cooldown > 0 ? 'none' : 'underline',
              textUnderlineOffset: '3px', padding: '4px',
            }}
          >
            {sending
              ? 'Gönderiliyor...'
              : cooldown > 0
                ? `Yeniden gönder (${cooldown}s)`
                : 'Maili almadım, tekrar gönder'}
          </button>
        </div>

        {/* Bilgi kutusu */}
        <div style={{
          background: '#f8f9fb', border: `1px solid ${C.border}`,
          borderRadius: '10px', padding: '12px 14px',
          fontSize: '12px', color: C.textLight, lineHeight: 1.6,
          marginBottom: '24px', textAlign: 'left',
        }}>
          💡 Mail gelmiyorsa <strong>spam/junk</strong> klasörünü kontrol edin.
          Birkaç dakika içinde ulaşması gerekir.
        </div>

        {/* Çıkış */}
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
