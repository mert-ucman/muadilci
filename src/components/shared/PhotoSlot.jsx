import { useRef, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCamera, faXmark, faSpinner } from '@fortawesome/free-solid-svg-icons';
import { C } from '@/constants/theme';
import { fileToResizedDataURL } from '@/utils/image';

/**
 * Tek bir fotoğraf yükleme karesi. Boş durumda kesik çizgili "ekle" kutusu,
 * dolu durumda önizleme + kaldır butonu gösterir.
 * value: dataURL veya uzak URL veya null. onChange(val|null) ile bildirir.
 */
export function PhotoSlot({ label, value, onChange, disabled }) {
  const inputRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  const pick = () => { if (!disabled && !loading) inputRef.current?.click(); };

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!['image/jpeg', 'image/png'].includes(file.type)) { setErr('Sadece JPG veya PNG yüklenebilir.'); return; }
    if (file.size > 3 * 1024 * 1024) { setErr('Dosya 3MB sınırını aşıyor.'); return; }
    setErr('');
    setLoading(true);
    try {
      const dataUrl = await fileToResizedDataURL(file, 900, 0.82);
      onChange(dataUrl);
    } catch {
      setErr('Görsel işlenemedi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="text-[12px] font-semibold mb-[6px]" style={{ color: C.textMid }}>{label}</div>
      <input ref={inputRef} type="file" accept=".jpg,.jpeg,.png,image/jpeg,image/png" onChange={handleFile} className="hidden" />
      {value ? (
        <div className="relative rounded-[10px] overflow-hidden" style={{ aspectRatio: '1/1', border: `1px solid ${C.border}` }}>
          <img src={value} alt={label} className="w-full h-full object-cover" />
          {!disabled && (
            <button
              type="button"
              onClick={() => onChange(null)}
              className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full flex items-center justify-center cursor-pointer border-none"
              style={{ background: 'rgba(0,0,0,0.55)', color: '#fff' }}
              aria-label="Fotoğrafı kaldır"
            >
              <FontAwesomeIcon icon={faXmark} style={{ fontSize: '12px' }} />
            </button>
          )}
        </div>
      ) : (
        <button
          type="button"
          onClick={pick}
          disabled={disabled || loading}
          className="w-full flex flex-col items-center justify-center gap-1.5 rounded-[10px] cursor-pointer"
          style={{ aspectRatio: '1/1', border: `1.5px dashed ${C.goldBorder}`, background: C.card, color: C.textLight }}
        >
          <FontAwesomeIcon icon={loading ? faSpinner : faCamera} spin={loading} style={{ fontSize: '24px', color: C.gold }} />
          <span className="text-[13px]">{loading ? 'Yükleniyor…' : 'Fotoğraf ekle'}</span>
        </button>
      )}
      {err && <div className="text-[11px] mt-1" style={{ color: C.red }}>{err}</div>}
    </div>
  );
}
