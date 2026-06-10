import { useState, useRef, useEffect } from 'react';
import { RecaptchaVerifier } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { Btn, Card, Input } from '@/components/ui';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faShieldHalved, faCircleCheck, faCircleXmark, faMobileScreen } from '@fortawesome/free-solid-svg-icons';
import { C } from '@/constants/theme';

const STEPS = { idle: 'idle', phone: 'phone', code: 'code', done: 'done' };

// digits: sadece rakamlar (10 hane), format: (5XX) XXX XX XX
function formatTR(digits) {
  const d = digits.replace(/\D/g, '').slice(0, 10);
  if (d.length === 0) return '';
  if (d.length <= 3) return `(${d}`;
  if (d.length <= 6) return `(${d.slice(0, 3)}) ${d.slice(3)}`;
  if (d.length <= 8) return `(${d.slice(0, 3)}) ${d.slice(3, 6)} ${d.slice(6)}`;
  return `(${d.slice(0, 3)}) ${d.slice(3, 6)} ${d.slice(6, 8)} ${d.slice(8)}`;
}

export function SecurityTab() {
  const { startMfaEnrollment, completeMfaEnrollment, getMfaFactors, unenrollMfa, reauthenticate } = useAuth();

  const [factors, setFactors] = useState([]);
  const [step, setStep] = useState(STEPS.idle);
  const [phoneDigits, setPhoneDigits] = useState(''); // sadece rakamlar
  const [code, setCode] = useState('');
  const [verificationId, setVerificationId] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);
  const [reAuthPass, setReAuthPass] = useState('');
  const [needsReAuth, setNeedsReAuth] = useState(true);

  const recaptchaVerifierRef = useRef(null);

  useEffect(() => {
    setFactors(getMfaFactors());
  }, [step]);

  // Telefon adımına geçilince reCAPTCHA widget'ını önceden render et
  useEffect(() => {
    if (step !== STEPS.phone) return;
    let verifier;
    const timer = setTimeout(() => {
      try {
        verifier = new RecaptchaVerifier(auth, 'security-recaptcha', { size: 'normal' });
        verifier.render().then(() => {
          recaptchaVerifierRef.current = verifier;
        }).catch((e) => console.error('[reCAPTCHA render]', e));
      } catch (e) {
        console.error('[reCAPTCHA init]', e);
      }
    }, 100); // DOM'un hazır olması için kısa bekleme
    return () => {
      clearTimeout(timer);
      try { verifier?.clear(); } catch { /* noop */ }
      recaptchaVerifierRef.current = null;
    };
  }, [step]);

  const handleSendCode = async () => {
    const digits = phoneDigits.replace(/\D/g, '');
    if (digits.length !== 10) { setErr('10 haneli geçerli bir numara girin.'); return; }
    if (!digits.startsWith('5')) { setErr('Numara 5 ile başlamalıdır.'); return; }
    const normalized = `+90${digits}`;
    setLoading(true);
    setErr('');
    try {
      if (needsReAuth) {
        await reauthenticate(reAuthPass);
        setNeedsReAuth(false);
        setReAuthPass('');
      }
      const verifier = recaptchaVerifierRef.current;
      if (!verifier) { setErr('reCAPTCHA henüz hazır değil. Birkaç saniye bekleyin.'); setLoading(false); return; }
      const vid = await startMfaEnrollment(normalized, verifier);
      setVerificationId(vid);
      setStep(STEPS.code);
    } catch (e) {
      console.error('[MFA enroll error]', e?.code, e?.message);
      if (e.code === 'auth/requires-recent-login') {
        setNeedsReAuth(true);
        setErr('Güvenlik için şifrenizi tekrar girmeniz gerekiyor.');
      } else if (e.code === 'auth/invalid-phone-number') {
        setErr('Geçersiz telefon numarası.');
      } else if (e.code === 'auth/too-many-requests') {
        setErr('Çok fazla deneme. Lütfen bekleyin.');
      } else if (e.code === 'auth/operation-not-allowed') {
        setErr('Telefon doğrulama Firebase Console\'dan aktifleştirilmemiş. Sign-in method → Phone → Enable yapın.');
      } else if (e.code === 'auth/captcha-check-failed') {
        setErr('reCAPTCHA doğrulaması başarısız. Sayfayı yenileyip tekrar deneyin.');
      } else if (e.code === 'auth/network-request-failed') {
        setErr('Ağ hatası. İnternet bağlantınızı kontrol edin.');
      } else {
        setErr(`SMS gönderilemedi. (${e?.code || 'bilinmeyen hata'})`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!code) { setErr('Doğrulama kodunu girin.'); return; }
    setLoading(true);
    setErr('');
    try {
      await completeMfaEnrollment(verificationId, code.trim());
      setStep(STEPS.done);
      setPhoneDigits('');
      setCode('');
    } catch (e) {
      if (e.code === 'auth/invalid-verification-code') {
        setErr('Kod hatalı. Tekrar deneyin.');
      } else if (e.code === 'auth/code-expired') {
        setErr('Kod süresi doldu. Baştan başlayın.');
        setStep(STEPS.phone);
      } else {
        setErr('Doğrulama başarısız.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUnenroll = async (factorUid) => {
    if (!window.confirm('MFA kaldırılacak. Emin misiniz?')) return;
    setErr('');
    try {
      await unenrollMfa(factorUid);
      setFactors(getMfaFactors());
    } catch (e) {
      if (e.code === 'auth/requires-recent-login') {
        setErr('Kaldırmak için önce çıkış yapıp tekrar giriş yapın.');
      } else {
        setErr('MFA kaldırılamadı.');
      }
    }
  };

  const isEnrolled = factors.length > 0;

  return (
    <div className="max-w-[560px]">

      <div className="mb-5">
        <h2 className="text-[18px] font-[800] text-(--color-navy) mb-1">Hesap Güvenliği</h2>
        <p className="text-[13px] text-(--color-text-light)">Admin hesabı için SMS tabanlı iki faktörlü doğrulama</p>
      </div>

      {/* MFA Durum Kartı */}
      <Card style={{ padding: '20px 24px', marginBottom: '20px' }}>
        <div className="flex items-center gap-3">
          <FontAwesomeIcon
            icon={faShieldHalved}
            style={{ fontSize: '22px', color: isEnrolled ? '#16a34a' : C.textLight }}
          />
          <div className="flex-1">
            <div className="font-bold text-[14px] text-(--color-navy)">İki Faktörlü Doğrulama (2FA)</div>
            <div className="text-[12px] mt-[2px]" style={{ color: isEnrolled ? '#16a34a' : C.textLight }}>
              {isEnrolled ? 'Aktif' : 'Aktif Değil'}
            </div>
          </div>
          <div className="flex items-center justify-center w-7 h-7">
            <FontAwesomeIcon
              icon={isEnrolled ? faCircleCheck : faCircleXmark}
              style={{ fontSize: '20px', color: isEnrolled ? '#16a34a' : '#ef4444' }}
            />
          </div>
        </div>

        {isEnrolled && (
          <div className="mt-4 pt-4" style={{ borderTop: `1px solid ${C.border}` }}>
            {factors.map((f) => (
              <div key={f.uid} className="flex items-center gap-3 py-2">
                <FontAwesomeIcon icon={faMobileScreen} style={{ color: C.textLight, fontSize: '14px' }} />
                <div className="flex-1">
                  <div className="text-[13px] font-semibold text-(--color-text)">{f.displayName || 'Telefon'}</div>
                  {f.phoneNumber && (
                    <div className="text-[12px] text-(--color-text-light)">{f.phoneNumber}</div>
                  )}
                </div>
                <button
                  onClick={() => handleUnenroll(f.uid)}
                  className="text-[12px] font-semibold px-3 py-[5px] rounded-[7px] cursor-pointer border border-[#fecaca] bg-[#fff5f5] text-(--color-red)"
                  style={{ fontFamily: 'inherit' }}
                >
                  Kaldır
                </button>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Enrollment adımları */}
      {!isEnrolled && step === STEPS.idle && (
        <Btn onClick={() => setStep(STEPS.phone)}>MFA Kur</Btn>
      )}

      {step === STEPS.phone && (
        <Card style={{ padding: '20px 24px' }}>
          <div className="font-bold text-[14px] text-(--color-navy) mb-4">Telefon Numarası Ekle</div>

          {needsReAuth && (
            <div className="mb-3">
              <Input
                label="Mevcut Şifreniz"
                type="password"
                value={reAuthPass}
                onChange={(e) => setReAuthPass(e.target.value)}
                placeholder="Şifrenizi girin"
              />
            </div>
          )}

          <div className="mb-1">
            <label className="block text-[12px] font-semibold text-(--color-text-mid) mb-[6px]">Telefon Numarası</label>
            <div className="flex items-center rounded-[10px] overflow-hidden" style={{ border: `1px solid ${C.border}` }}>
              <div className="px-3 py-[10px] text-[14px] font-bold text-(--color-text-mid) bg-[#f5f5f3] shrink-0 select-none" style={{ borderRight: `1px solid ${C.border}` }}>
                +90
              </div>
              <input
                value={formatTR(phoneDigits)}
                onChange={(e) => {
                  const raw = e.target.value.replace(/\D/g, '').slice(0, 10);
                  setPhoneDigits(raw);
                }}
                onKeyDown={(e) => e.key === 'Enter' && handleSendCode()}
                placeholder="(5XX) XXX XX XX"
                inputMode="numeric"
                className="flex-1 px-3 py-[10px] text-[14px] text-(--color-text) outline-none bg-transparent"
                style={{ fontFamily: 'inherit' }}
              />
            </div>
          </div>

          {/* reCAPTCHA widget — normal (görünür) mod */}
          <div id="security-recaptcha" className="my-3" />

          {err && (
            <div className="px-3 py-2 bg-[#fff5f5] border border-[#fecaca] rounded-lg text-[13px] text-(--color-red) mb-3">{err}</div>
          )}

          <div className="flex gap-2">
            <Btn variant="secondary" onClick={() => { setStep(STEPS.idle); setErr(''); setReAuthPass(''); setPhoneDigits(''); }}>İptal</Btn>
            <Btn onClick={handleSendCode} disabled={loading}>
              {loading ? 'Gönderiliyor...' : 'SMS Kodu Gönder'}
            </Btn>
          </div>
        </Card>
      )}

      {step === STEPS.code && (
        <Card style={{ padding: '20px 24px' }}>
          <div className="font-bold text-[14px] text-(--color-navy) mb-1">SMS Kodunu Girin</div>
          <p className="text-[12px] text-(--color-text-light) mb-4">+90{phoneDigits} numarasına gönderildi</p>

          <Input
            label="Doğrulama Kodu"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleVerifyCode()}
            placeholder="123456"
            maxLength={6}
            inputMode="numeric"
          />

          {err && (
            <div className="px-3 py-2 bg-[#fff5f5] border border-[#fecaca] rounded-lg text-[13px] text-(--color-red) my-3">{err}</div>
          )}

          <div className="flex gap-2 mt-4">
            <Btn variant="secondary" onClick={() => { setStep(STEPS.phone); setErr(''); }}>Geri</Btn>
            <Btn onClick={handleVerifyCode} disabled={loading}>
              {loading ? 'Doğrulanıyor...' : 'Doğrula ve Kaydet'}
            </Btn>
          </div>
        </Card>
      )}

      {step === STEPS.done && (
        <div className="flex items-center gap-3 px-4 py-3 bg-[#f0fdf4] border border-[#86efac] rounded-[10px] text-[13px] font-semibold" style={{ color: '#16a34a' }}>
          <FontAwesomeIcon icon={faCircleCheck} />
          MFA başarıyla kuruldu. Bir sonraki girişte SMS doğrulaması istenecek.
        </div>
      )}
    </div>
  );
}
