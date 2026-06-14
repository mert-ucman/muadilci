import { Modal } from '@/components/ui/Modal';
import { Btn } from '@/components/ui/Btn';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faClock } from '@fortawesome/free-solid-svg-icons';
import { C } from '@/constants/theme';

// 10 dk hareketsizlik sonrası otomatik çıkış bildirimi. AuthProvider tarafından
// mount edilir; "Tamam" veya kapatma → ana sayfaya yönlendirir.
export function AutoLogoutModal({ open, onClose }) {
  return (
    <Modal open={open} onClose={onClose} title="Oturum Sonlandırıldı" width="420px">
      <div className="flex flex-col items-center text-center">
        <div className="w-[52px] h-[52px] rounded-full flex items-center justify-center mb-4"
          style={{ background: C.goldBg, border: `1px solid ${C.goldBorder}` }}>
          <FontAwesomeIcon icon={faClock} style={{ fontSize: '22px', color: C.gold }} />
        </div>
        <div className="text-sm text-(--color-text-mid) leading-[1.7] mb-5">
          Uzun süre hareketsiz kaldığınızdan dolayı güvenliğiniz için hesabınızdan otomatik olarak çıkış yapıldı.
        </div>
        <Btn variant="primary" onClick={onClose} style={{ width: '100%', justifyContent: 'center' }}>Tamam</Btn>
      </div>
    </Modal>
  );
}
