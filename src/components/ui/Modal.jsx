import { useEffect } from 'react';
import { C } from '@/constants/theme';

export function Modal({ open, onClose, title, children, width = '500px' }) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/45 z-[1000] flex items-center justify-center p-5">
      <div
        onClick={(e) => e.stopPropagation()}
        className="fade-in bg-card rounded-[20px] w-full max-h-[90vh] overflow-auto"
        style={{ maxWidth: width, boxShadow: C.shadowLg }}
      >
        <div className="flex justify-between items-center px-6 py-5 border-b border-border">
          <span className="text-[17px] font-bold text-text">{title}</span>
          <button
            onClick={onClose}
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
