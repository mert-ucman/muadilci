import { useState } from 'react';
import { useData } from '@/contexts/DataContext';
import { Lightbox } from './Lightbox';

/**
 * Parfüm fotoğraf önizlemesi — 2×2 grid. İlk 4 fotoğraf gösterilir,
 * boş kareler no-image placeholder olur. 4'ten fazla varsa son karede
 * "+N görsel" örtüsü çıkar. Foto karesine tıklayınca lightbox açılır.
 *
 * photos: yayınlanmış görsel URL dizisi (yeni → eski sıralı)
 */
export function PerfumeGallery({ photos = [], className = '', onEmptyClick }) {
  const { noImageUrl } = useData();
  const [lb, setLb] = useState(-1);
  const shown = photos.slice(0, 4);
  const extra = Math.max(0, photos.length - 4);

  return (
    <>
      <div className={`grid grid-cols-2 gap-2 w-full p-2 ${className}`} style={{ background: '#ffffff' }}>
        {[0, 1, 2, 3].map((i) => {
          const src = shown[i];
          const isOverflow = i === 3 && extra > 0;
          return (
            <div
              key={i}
              className="relative overflow-hidden rounded-[10px] bg-[#f3f2ef] aspect-square"
              style={{ cursor: src ? 'zoom-in' : (onEmptyClick ? 'pointer' : 'default'), border: '1px solid #ececea' }}
              onClick={(e) => {
                if (src) { e.stopPropagation(); setLb(i); }
                else if (onEmptyClick) { /* boş kare → kart tıklamasına bırak */ }
              }}
            >
              {(src || noImageUrl) && <img src={src || noImageUrl} alt="" loading="lazy" className="w-full h-full object-cover" onError={e => { e.currentTarget.onerror = null; e.currentTarget.style.display = 'none'; }} />}
              {isOverflow && (
                <div className="absolute inset-0 flex items-center justify-center" style={{ background: 'rgba(15,15,15,0.58)' }}>
                  <span className="text-white font-bold text-[13px] text-center leading-tight px-1">+{extra} görsel<br />daha</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
      {lb >= 0 && <Lightbox photos={photos} index={lb} onClose={() => setLb(-1)} onIndex={setLb} />}
    </>
  );
}
