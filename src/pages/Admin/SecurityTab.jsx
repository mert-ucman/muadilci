import { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { useAuth } from '@/contexts/AuthContext';
import { Btn, Card, Input } from '@/components/ui';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faShieldHalved, faCircleCheck, faCircleXmark, faMobileScreen, faCopy } from '@fortawesome/free-solid-svg-icons';
import { C } from '@/constants/theme';

const STEPS = { idle: 'idle', setup: 'setup', done: 'done' };

export function SecurityTab() {
  const { startTotpEnrollment, completeTotpEnrollment, getMfaFactors, unenrollMfa, reauthenticate } = useAuth();

  const [factors, setFactors] = useState([]);
  const [step, setStep] = useState(STEPS.idle);
  const [code, setCode] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);
  const [reAuthPass, setReAuthPass] = useState('');
  const [needsReAuth, setNeedsReAuth] = useState(true);

  // TOTP enrollment state
  const [secret, setSecret] = useState(null);
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [secretKey, setSecretKey] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setFactors(getMfaFactors());
  }, [step]);

  // Önce şifre doğrula, sonra TOTP secret üret + QR çiz
  const handleStartSetup = async () => {
    setLoading(true);
    setErr('');
    try {
      if (needsReAuth) {
        await reauthenticate(reAuthPass);
        setNeedsReAuth(false);
        setReAuthPass('');
      }
      const { secret: s, qrCodeUrl, secretKey: sk } = await startTotpEnrollment();
      const dataUrl = await QRCode.toDataURL(qrCodeUrl, { width: 220, margin: 1 });
      setSecret(s);
      setSecretKey(sk);
      setQrDataUrl(dataUrl);
      setStep(STEPS.setup);
    } catch (e) {
      console.error('[TOTP setup error]', e?.code, e?.message);
      if (e.code === 'auth/wrong-password' || e.code === 'auth/invalid-credential') {
        setErr('Şifre hatalı.');
      } else if (e.code === 'auth/requires-recent-login') {
        setNeedsReAuth(true);
        setErr('Güvenlik için şifrenizi tekrar girin.');
      } else if (e.code === 'auth/too-many-requests') {
        setErr('Çok fazla deneme. Lütfen bekleyin.');
      } else if (e.code === 'auth/operation-not-allowed') {
        setErr('TOTP, Firebase Console → Identity Platform → MFA bölümünden aktifleştirilmemiş.');
      } else {
        setErr(`Kurulum başlatılamadı. (${e?.code || 'bilinmeyen hata'})`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!code) { setErr('Authenticator kodunu girin.'); return; }
    setLoading(true);
    setErr('');
    try {
      await completeTotpEnrollment(secret, code.trim(), 'Authenticator');
      setStep(STEPS.done);
      setCode('');
      setSecret(null);
      setQrDataUrl('');
      setSecretKey('');
    } catch (e) {
      console.error('[TOTP verify error]', e?.code, e?.message);
      if (e.code === 'auth/invalid-verification-code' || e.code === 'auth/invalid-payload') {
        setErr('Kod hatalı. Authenticator uygulamasındaki güncel kodu girin.');
      } else {
        setErr('Doğrulama başarısız. Tekrar deneyin.');
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

  const copySecret = async () => {
    try {
      await navigator.clipboard.writeText(secretKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch { /* noop */ }
  };

  const cancelSetup = () => {
    setStep(STEPS.idle);
    setErr('');
    setReAuthPass('');
    setCode('');
    setSecret(null);
    setQrDataUrl('');
    setSecretKey('');
    setNeedsReAuth(true);
  };

  const isEnrolled = factors.length > 0;

  return (
    <div className="max-w-[560px]">

      <div className="mb-5">
        <h2 className="text-[18px] font-[800] text-(--color-navy) mb-1">Hesap Güvenliği</h2>
        <p className="text-[13px] text-(--color-text-light)">Admin hesabı için authenticator tabanlı iki faktörlü doğrulama</p>
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
                  <div className="text-[13px] font-semibold text-(--color-text)">{f.displayName || 'Authenticator'}</div>
                  <div className="text-[12px] text-(--color-text-light)">Authenticator uygulaması</div>
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

      {/* Kurulum başlat */}
      {!isEnrolled && step === STEPS.idle && (
        <Card style={{ padding: '20px 24px' }}>
          <div className="font-bold text-[14px] text-(--color-navy) mb-1">Authenticator ile 2FA Kur</div>
          <p className="text-[12px] text-(--color-text-light) mb-4">
            Google Authenticator, Microsoft Authenticator veya benzeri bir uygulama gerekir.
          </p>

          <div className="mb-3">
            <Input
              label="Mevcut Şifreniz"
              type="password"
              value={reAuthPass}
              onChange={(e) => setReAuthPass(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleStartSetup()}
              placeholder="Şifrenizi girin"
            />
          </div>

          {err && (
            <div className="px-3 py-2 bg-[#fff5f5] border border-[#fecaca] rounded-lg text-[13px] text-(--color-red) mb-3">{err}</div>
          )}

          <Btn onClick={handleStartSetup} disabled={loading}>
            {loading ? 'Hazırlanıyor...' : 'Kuruluma Başla'}
          </Btn>
        </Card>
      )}

      {/* QR + kod doğrulama */}
      {step === STEPS.setup && (
        <Card style={{ padding: '20px 24px' }}>
          <div className="font-bold text-[14px] text-(--color-navy) mb-1">1. QR Kodu Tara</div>
          <p className="text-[12px] text-(--color-text-light) mb-3">
            Authenticator uygulamanızla aşağıdaki QR kodu tarayın.
          </p>

          <div className="flex justify-center mb-4">
            {qrDataUrl && (
              <img
                src={qrDataUrl}
                alt="TOTP QR"
                className="rounded-[12px]"
                style={{ border: `1px solid ${C.border}` }}
                width={220}
                height={220}
              />
            )}
          </div>

          <div className="mb-4">
            <div className="text-[12px] text-(--color-text-light) mb-1">QR taranamıyorsa bu anahtarı elle girin:</div>
            <div className="flex items-center gap-2 rounded-[10px] px-3 py-2" style={{ border: `1px solid ${C.border}`, background: '#f5f5f3' }}>
              <code className="flex-1 text-[12px] break-all text-(--color-text)" style={{ letterSpacing: '0.05em' }}>{secretKey}</code>
              <button
                onClick={copySecret}
                className="shrink-0 flex items-center gap-1 text-[12px] font-semibold text-(--color-gold) cursor-pointer bg-transparent border-none"
                style={{ fontFamily: 'inherit' }}
              >
                <FontAwesomeIcon icon={faCopy} />
                {copied ? 'Kopyalandı' : 'Kopyala'}
              </button>
            </div>
          </div>

          <div className="font-bold text-[14px] text-(--color-navy) mb-1">2. Kodu Girin</div>
          <p className="text-[12px] text-(--color-text-light) mb-2">
            Uygulamanın ürettiği 6 haneli kodu girin.
          </p>

          <Input
            label="Doğrulama Kodu"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            onKeyDown={(e) => e.key === 'Enter' && handleVerifyCode()}
            placeholder="123456"
            maxLength={6}
            inputMode="numeric"
          />

          {err && (
            <div className="px-3 py-2 bg-[#fff5f5] border border-[#fecaca] rounded-lg text-[13px] text-(--color-red) my-3">{err}</div>
          )}

          <div className="flex gap-2 mt-4">
            <Btn variant="secondary" onClick={cancelSetup}>İptal</Btn>
            <Btn onClick={handleVerifyCode} disabled={loading}>
              {loading ? 'Doğrulanıyor...' : 'Doğrula ve Kaydet'}
            </Btn>
          </div>
        </Card>
      )}

      {step === STEPS.done && (
        <div className="flex items-center gap-3 px-4 py-3 bg-[#f0fdf4] border border-[#86efac] rounded-[10px] text-[13px] font-semibold" style={{ color: '#16a34a' }}>
          <FontAwesomeIcon icon={faCircleCheck} />
          2FA başarıyla kuruldu. Bir sonraki girişte authenticator kodu istenecek.
        </div>
      )}
    </div>
  );
}
