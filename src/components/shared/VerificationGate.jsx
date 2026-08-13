import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Modal, Btn } from '@/components/ui';
import { C, F } from '@/constants/theme';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEnvelope, faTriangleExclamation } from '@fortawesome/free-solid-svg-icons';

// Sunucu tarafındaki cleanupUnverifiedUsers ile AYNI süre olmalı (48 saat).
const ACCOUNT_TTL_MS = 48 * 60 * 60 * 1000;
const RESEND_COOLDOWN = 60; // saniye
// Modal oturumda yalnızca bir kez otomatik açılır; şerit kalıcıdır.
const SESSION_FLAG = 'muadilci_verif_modal_shown';

function formatRemaining(ms) {
  const totalMinutes = Math.max(0, Math.floor(ms / 60000));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours > 0) return `${hours} saat ${minutes} dakika`;
  return `${minutes} dakika`;
}

// Doğrulanmamış (e-posta) kullanıcıya siteyi kapatmadan sürekli uyarı gösterir:
//  • Oturumda bir kez otomatik açılan ekran-ortası modal (kapatılabilir)
//  • Alt köşede kalıcı, kapatılabilir uyarı şeridi (tıklayınca modal geri açılır)
// Google/admin/moderatör kullanıcılarında hiç görünmez.
export function VerificationGate() {
  const { user, sendVerificationEmail, reloadUser, logout } = useAuth();

  const needsVerification = !!user
    && user.emailVerified === false
    && user.provider !== 'google.com'
    && user.role !== 'admin'
    && user.role !== 'moderator';

  const [modalOpen, setModalOpen]       = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [remaining, setRemaining]       = useState(null);
  const [cooldown, setCooldown]         = useState(0);
  const [sending, setSending]           = useState(false);
  const [sendOk, setSendOk]             = useState(false);
  const [sendErr, setSendErr]           = useState('');
  const [checking, setChecking]         = useState(false);
  const [checkErr, setCheckErr]         = useState('');

  // Oturumda bir kez otomatik aç (ilk kayıt / her yeni giriş oturumu)
  useEffect(() => {
    if (!needsVerification) return;
    if (sessionStorage.getItem(SESSION_FLAG)) return;
    sessionStorage.setItem(SESSION_FLAG, '1');
    setModalOpen(true);
  }, [needsVerification]);

  // Hesap silinmesine kalan süre — createdAt üzerinden (48 saat).
  // Yeni kayıtta createdAt henüz serverTimestamp placeholder'ı olabilir (.toDate yok)
  // → "şimdi" kabul edilir (kayıt gerçekten az önce oldu).
  useEffect(() => {
    if (!needsVerification) return;
    const createdMs = user.createdAt?.toDate?.().getTime() ?? Date.now();
    const deadline = createdMs + ACCOUNT_TTL_MS;
    const tick = () => setRemaining(deadline - Date.now());
    tick();
    const id = setInterval(tick, 30_000);
    return () => clearInterval(id);
  }, [needsVerification, user?.createdAt]);

  // Yeniden gönder geri sayımı
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  if (!needsVerification) return null;

  const handleResend = async () => {
    setSending(true); setSendErr(''); setSendOk(false);
    try {
      await sendVerificationEmail();
      setSendOk(true);
      setCooldown(RESEND_COOLDOWN);
    } catch (e) {
      if (e.code === 'auth/too-many-requests') setSendErr('Çok fazla istek gönderildi. Lütfen birkaç dakika bekleyin.');
      else setSendErr('Mail gönderilemedi. Lütfen tekrar deneyin.');
    } finally {
      setSending(false);
    }
  };

  const handleCheck = async () => {
    setChecking(true); setCheckErr('');
    try {
      const verified = await reloadUser();
      // verified ise needsVerification false olur → bileşen kendini gizler
      if (!verified) setCheckErr('E-posta henüz doğrulanmamış. Gelen kutunuzu (ve spam) kontrol edin.');
    } catch {
      setCheckErr('Durum kontrol edilemedi. Tekrar deneyin.');
    } finally {
      setChecking(false);
    }
  };

  const expired = remaining != null && remaining <= 0;

  return (
    <>
      {/* Alt köşe kalıcı uyarı şeridi (rahatsız etmeyen, kapatılabilir) */}
      {!bannerDismissed && (
        <div
          className="fixed left-0 right-0 bottom-0 z-[900] px-4 py-[10px] flex items-center gap-3 flex-wrap justify-center"
          style={{ background: '#3a2a10', borderTop: `1px solid ${C.gold}`, boxShadow: '0 -4px 20px rgba(0,0,0,.22)' }}
        >
          <div className="flex items-center gap-[10px] min-w-0">
            <FontAwesomeIcon icon={faTriangleExclamation} style={{ width: '16px', height: '16px', color: C.goldLight }} />
            <span className="text-[13px]" style={{ color: '#f4ead6', fontFamily: F }}>
              {expired
                ? <>Doğrulama süren doldu — hesabın kısa süre içinde silinecek.</>
                : <>E-postanı doğrula. Kalan süre: <strong style={{ color: '#fff' }}>{remaining != null ? formatRemaining(remaining) : '—'}</strong>. Doğrulanmazsa hesabın ve tüm yorumların silinir.</>}
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Btn size="sm" onClick={() => setModalOpen(true)}>Doğrula</Btn>
            <button
              onClick={() => setBannerDismissed(true)}
              aria-label="Kapat"
              className="bg-transparent border-none cursor-pointer text-[20px] leading-none px-1"
              style={{ color: '#c9b78e', fontFamily: F }}
            >
              ×
            </button>
          </div>
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="E-postanı Doğrula" width="440px">
        <div className="text-center">
          <div className="w-[72px] h-[72px] rounded-full bg-(--color-gold-bg) border-2 border-(--color-gold-border) flex items-center justify-center mx-auto mb-5 text-(--color-gold)">
            <FontAwesomeIcon icon={faEnvelope} style={{ width: '30px', height: '30px' }} />
          </div>

          <p className="text-[14px] text-(--color-text-mid) leading-[1.7] mb-1">
            <strong className="text-(--color-text)">{user?.email}</strong> adresine bir doğrulama bağlantısı gönderdik.
          </p>
          <p className="text-[13px] text-(--color-text-light) leading-[1.6] mb-5">
            Bağlantıya tıkladıktan sonra “Doğruladım” butonuna basın. Siteyi kullanmaya devam edebilirsiniz.
          </p>

          {remaining != null && (
            <div
              className="rounded-[10px] px-[14px] py-[10px] text-[13px] mb-5 text-left leading-[1.6]"
              style={{ background: 'var(--color-orange-bg)', border: '1px solid #f0c878', color: 'var(--color-orange)' }}
            >
              {expired
                ? <>Doğrulama süreniz doldu. Hesabınız ve tüm yorumlarınız kısa süre içinde kalıcı olarak silinecek.</>
                : <>Doğrulama için kalan süre: <strong>{formatRemaining(remaining)}</strong>. Bu süre içinde doğrulanmazsa hesabınız ve tüm yorumlarınız <strong>kalıcı olarak silinir</strong> ve tekrar üye olmanız gerekir. Bu önlem sahte/bot yorumları engellemek içindir.</>}
            </div>
          )}

          <Btn onClick={handleCheck} disabled={checking} style={{ width: '100%', justifyContent: 'center', marginBottom: '10px' }} size="lg">
            {checking ? 'Kontrol ediliyor...' : '✓ Doğruladım, kontrol et'}
          </Btn>

          {checkErr && (
            <div className="bg-[#fff5f5] border border-[#fc8181] rounded-[10px] px-[14px] py-[10px] text-[#c53030] text-[13px] mb-3">
              {checkErr}
            </div>
          )}

          <div className="mb-4">
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
              className="bg-transparent border-none p-1 text-[13px] font-semibold"
              style={{
                cursor: cooldown > 0 ? 'default' : 'pointer',
                color: cooldown > 0 ? C.textLight : C.gold,
                textDecoration: cooldown > 0 ? 'none' : 'underline',
                textUnderlineOffset: '3px',
                fontFamily: F,
              }}
            >
              {sending ? 'Gönderiliyor...' : cooldown > 0 ? `Yeniden gönder (${cooldown}s)` : 'Maili almadım, tekrar gönder'}
            </button>
          </div>

          <div className="flex items-center justify-center gap-4">
            <button
              onClick={() => setModalOpen(false)}
              className="bg-transparent border-none cursor-pointer text-[13px] text-(--color-text-mid) underline underline-offset-[3px]"
              style={{ fontFamily: F }}
            >
              Daha sonra
            </button>
            <button
              onClick={() => logout()}
              className="bg-transparent border-none cursor-pointer text-[13px] text-(--color-text-light) underline underline-offset-[3px]"
              style={{ fontFamily: F }}
            >
              Farklı bir hesapla giriş yap
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
