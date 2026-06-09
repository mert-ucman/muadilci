import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowRight } from '@fortawesome/free-solid-svg-icons';
import { useW } from '@/hooks/useW';
import { C, F } from '@/constants/theme';

export function TableScrollHint() {
  const { lg } = useW();
  if (!lg) return null;
  return (
    <div
      className="flex items-center gap-[5px] px-4 py-[7px] text-[11px]"
      style={{ color: C.textLight, fontFamily: F, borderBottom: `1px solid ${C.border}`, background: '#fafaf8' }}
    >
      <FontAwesomeIcon icon={faArrowRight} style={{ fontSize: '9px' }} />
      Tabloyu incelemek için sağa kaydırınız
    </div>
  );
}
