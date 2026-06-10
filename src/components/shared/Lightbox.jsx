import { useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXmark, faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';

/**
 * Tam ekran görsel görüntüleyici. photos: URL dizisi, index: açık görsel,
 * onClose ve onIndex ile kontrol edilir. Ok tuşları + Esc destekli.
 */
export function Lightbox({ photos = [], index = 0, onClose, onIndex }) {
  const count = photos.length;
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowLeft') onIndex((index - 1 + count) % count);
      else if (e.key === 'ArrowRight') onIndex((index + 1) % count);
    };
    window.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = ''; window.removeEventListener('keydown', onKey); };
  }, [index, count, onClose, onIndex]);

  if (count === 0) return null;
  const go = (d) => (e) => { e.stopPropagation(); onIndex((index + d + count) % count); };

  const navBtn = 'absolute top-1/2 -translate-y-1/2 w-11 h-11 rounded-full flex items-center justify-center cursor-pointer border-none text-white';

  return (
    <div onClick={onClose} className="fixed inset-0 z-[2000] flex items-center justify-center fade-in" style={{ background: 'rgba(0,0,0,0.92)' }}>
      <button
        onClick={(e) => { e.stopPropagation(); onClose(); }}
        className="absolute top-4 right-4 w-11 h-11 rounded-full flex items-center justify-center cursor-pointer border-none text-white z-[1]"
        style={{ background: 'rgba(255,255,255,0.12)' }}
        aria-label="Kapat"
      >
        <FontAwesomeIcon icon={faXmark} style={{ fontSize: '20px' }} />
      </button>

      {count > 1 && (
        <button onClick={go(-1)} className={navBtn} style={{ left: '16px', background: 'rgba(255,255,255,0.12)' }} aria-label="Önceki">
          <FontAwesomeIcon icon={faChevronLeft} style={{ fontSize: '18px' }} />
        </button>
      )}

      <img
        src={photos[index]}
        alt=""
        onClick={(e) => e.stopPropagation()}
        className="max-w-[90vw] max-h-[85vh] object-contain rounded-[10px]"
        style={{ boxShadow: '0 12px 48px rgba(0,0,0,0.5)' }}
      />

      {count > 1 && (
        <button onClick={go(1)} className={navBtn} style={{ right: '16px', background: 'rgba(255,255,255,0.12)' }} aria-label="Sonraki">
          <FontAwesomeIcon icon={faChevronRight} style={{ fontSize: '18px' }} />
        </button>
      )}

      {count > 1 && (
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-white text-[13px] font-semibold" style={{ background: 'rgba(255,255,255,0.14)' }}>
          {index + 1} / {count}
        </div>
      )}
    </div>
  );
}
