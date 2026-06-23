import { useEffect, useRef } from 'react';
import { C } from '@/constants/theme';

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function Modal({ open, onClose, title, children, width = '500px' }) {
  const panelRef = useRef(null);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    };
  }, [open]);

  // Açılışta ilk alana odaklan + Tab odağını modal içinde tut (focus trap)
  useEffect(() => {
    if (!open) return;
    const panel = panelRef.current;
    if (!panel) return;

    // Görünür + sekmelenebilir (tabindex=-1 hariç, ör. × kapatma butonu) alanlar
    const getItems = () => Array.from(panel.querySelectorAll(FOCUSABLE)).filter(
      (el) => el.tabIndex >= 0 && (el.offsetParent !== null || el === document.activeElement)
    );

    const t = setTimeout(() => {
      // Odak zaten modal panelinin içindeyse dokunma (kullanıcı/komponent
      // bir alanı bilerek odaklamış olabilir). Aksi halde ilk alana odaklan.
      if (panel.contains(document.activeElement)) return;
      getItems()[0]?.focus();
    }, 0);

    const onKeyDown = (e) => {
      if (e.key !== 'Tab') return;
      // Odak modal panel içindeyse döngüyü panelle sınırla.
      // (SearchableSelect gibi portal'a açılan menülerde odak panel dışındaysa
      //  kendi davranışına dokunma.)
      if (!panel.contains(document.activeElement)) return;
      const items = getItems();
      if (!items.length) return;
      const firstEl = items[0];
      const lastEl = items[items.length - 1];
      if (e.shiftKey && document.activeElement === firstEl) {
        e.preventDefault();
        lastEl.focus();
      } else if (!e.shiftKey && document.activeElement === lastEl) {
        e.preventDefault();
        firstEl.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => {
      clearTimeout(t);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/45 z-[1000] flex items-center justify-center p-5">
      <div
        ref={panelRef}
        onClick={(e) => e.stopPropagation()}
        className="fade-in bg-card rounded-[20px] w-full max-h-[90vh] overflow-auto"
        style={{ maxWidth: width, boxShadow: C.shadowLg }}
      >
        <div className="flex justify-between items-center px-6 py-5 border-b border-border">
          <span className="text-[17px] font-bold text-text">{title}</span>
          <button
            onClick={onClose}
            tabIndex={-1}
            className="bg-transparent border-none cursor-pointer text-[22px] leading-none text-[#8A8A8A]"
          >
            ×
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}
