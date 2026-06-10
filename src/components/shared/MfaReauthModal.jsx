import { useState, useEffect, useRef } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Btn } from '@/components/ui/Btn';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faShieldHalved } from '@fortawesome/free-solid-svg-icons';
import { C } from '@/constants/theme';

// Hassas işlemler (silme vb.) öncesi MFA kuruluyken authenticator kodunu
// toplayan merkezi modal. AuthProvider tarafından mount edilir.
export function MfaReauthModal({ open, error, loading, onSubmit, onCancel }) {
  const [code, setCode] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (open) {
      setCode('');
      const t = setTimeout(() => inputRef.current?.focus(), 50);
      return () => clearTimeout(t);
    }
  }, [open]);

  const submit = () => {
    if (code.length !== 6 || loading) return;
    onSubmit(code);
  };

  return (
    <Modal open={open} onClose={onCancel} title="Kimlik Doğrulama" width="400px">
      <div className="flex flex-col items-center mb-4">
        <div className="w-[52px] h-[52px] rounded-full flex items-center justify-center mb-3"
          style={{ background: '#f5f5f3', border: `1px solid ${C.border}` }}>
          <FontAwesomeIcon icon={faShieldHalved} style={{ fontSize: '22px', color: C.gold }} />
        </div>
        <div className="text-sm text-(--color-text-mid) text-center leading-[1.6]">
          Bu işlemi onaylamak için Authenticator uygulamanızdaki 6 haneli kodu girin.
        </div>
      </div>

      <input
        ref={inputRef}
        value={code}
        onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
        onKeyDown={(e) => e.key === 'Enter' && submit()}
        placeholder="123456"
        maxLength={6}
        inputMode="numeric"
        autoComplete="one-time-code"
        className="w-full px-[14px] py-[10px] rounded-[10px] outline-none box-border mb-1.5"
        style={{ border: `1px solid ${error ? C.red : C.border}`, letterSpacing: '0.2em', textAlign: 'center', fontSize: '20px' }}
      />
      {error && <div className="text-xs text-(--color-red) mb-[10px]">{error}</div>}

      <div className="flex gap-[10px] mt-4 justify-end">
        <Btn variant="ghost" onClick={onCancel} disabled={loading}>İptal</Btn>
        <Btn variant="primary" onClick={submit} disabled={loading || code.length !== 6}>
          {loading ? 'Doğrulanıyor…' : 'Onayla'}
        </Btn>
      </div>
    </Modal>
  );
}
