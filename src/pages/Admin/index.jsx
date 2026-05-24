import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from '@/contexts/RouterContext';
import { useData } from '@/contexts/DataContext';
import { useW } from '@/hooks/useW';
import { calcScores } from '@/utils/scoring';
import { slugify } from '@/utils/strings';
import { Card, Badge, Btn, Modal, Input, Select, Textarea } from '@/components/ui';
import { GenderBadge } from '@/components/shared';
import { C, F } from '@/constants/theme';
import { uploadDataURL } from '@/lib/storage';
import { useSeo } from '@/lib/seo';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUsers, faFlask, faStar, faCommentDots } from '@fortawesome/free-solid-svg-icons';
import Cropper from 'react-easy-crop';

const RL = { admin: 'Admin', moderator: 'Moderatör', user: 'Üye' };
const RC = { admin: 'red', moderator: 'blue', user: 'gold' };

const thBase = { padding: '11px 14px', textAlign: 'left', fontSize: '12px', fontWeight: 700, color: C.textLight, letterSpacing: '.05em', textTransform: 'uppercase', borderBottom: `1px solid ${C.border}` };

function SortTh({ label, sortKey, sort, onSort }) {
  const active = sort.key === sortKey;
  return (
    <th onClick={() => sortKey && onSort(sortKey)} style={{ ...thBase, cursor: sortKey ? 'pointer' : 'default', userSelect: 'none', whiteSpace: 'nowrap', background: active ? '#f0f0f8' : undefined }}>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
        {label}
        {sortKey && <span style={{ fontSize: '11px', color: active ? C.navy : C.textLight, fontWeight: 700 }}>{active ? (sort.dir === 'asc' ? ' ↑' : ' ↓') : ' ↕'}</span>}
      </span>
    </th>
  );
}

function SearchBar({ value, onChange, placeholder, count, total }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', borderBottom: `1px solid ${C.border}`, background: '#fafafa' }}>
      <div style={{ position: 'relative', flex: 1, maxWidth: '340px' }}>
        <svg style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: C.textLight }} width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
        <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} style={{ width: '100%', paddingLeft: '32px', paddingRight: value ? '60px' : '10px', height: '34px', border: `1px solid ${C.border}`, borderRadius: '8px', fontSize: '13px', color: C.text, background: '#fff', outline: 'none', fontFamily: F, boxSizing: 'border-box' }} />
        {value && (
          <button onClick={() => onChange('')} style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', fontSize: '11px', color: C.textLight, background: 'none', border: 'none', cursor: 'pointer', fontFamily: F, padding: '2px 6px', borderRadius: '4px' }}>Temizle</button>
        )}
      </div>
      <span style={{ fontSize: '12px', color: C.textLight, marginLeft: 'auto', whiteSpace: 'nowrap' }}>{count} / {total} kayıt</span>
    </div>
  );
}

const TABS = [
  { k: 'dashboard', l: 'Genel Bakış' },
  { k: 'users', l: 'Kullanıcılar' },
  { k: 'original-brands', l: 'Orijinal Markalar' },
  { k: 'muadil-brands', l: 'Muadil Markalar' },
  { k: 'perfumes', l: 'Orijinal Parfümler' },
  { k: 'muadil', l: 'Muadil Parfümler' },
  { k: 'reviews', l: 'Tüm Yorumlar' },
  { k: 'slider', l: 'Ana Sayfa Slider' },
  { k: 'favicon', l: 'Favicon' },
];

function SliderTab({ sliderImages, addSliderImage, removeSliderImage, updateSliderImage, reorderSliderImages, MAX_SLIDER, MAX_SIZE_MB }) {
  const [dragOver, setDragOver] = useState(false);
  const [dragIdx, setDragIdx] = useState(null);
  const [error, setError] = useState('');

  const processFiles = (files) => {
    setError('');
    const arr = Array.from(files);
    const remaining = MAX_SLIDER - sliderImages.length;
    if (arr.length > remaining) setError(`En fazla ${MAX_SLIDER} görsel eklenebilir. ${arr.length - remaining} görsel atlandı.`);
    arr.slice(0, remaining).forEach((file) => {
      if (!file.type.startsWith('image/')) { setError('Sadece görsel dosyaları (JPG, PNG, WebP) kabul edilir.'); return; }
      if (file.size > MAX_SIZE_MB * 1024 * 1024) { setError(`"${file.name}" ${MAX_SIZE_MB}MB sınırını aşıyor.`); return; }
      compressToDataURL(file, 1920, 0.82, 800)
        .then((src) => uploadDataURL(src, 'slider'))
        .then((url) => addSliderImage({ src: url, name: file.name }))
        .catch(() => setError(`"${file.name}" yüklenirken hata oluştu.`));
    });
  };

  const onDrop = (e) => { e.preventDefault(); setDragOver(false); processFiles(e.dataTransfer.files); };
  const onDragStartItem = (i) => setDragIdx(i);
  const onDragOverItem = (e, i) => {
    e.preventDefault();
    if (dragIdx === null || dragIdx === i) return;
    const next = [...sliderImages];
    const [moved] = next.splice(dragIdx, 1);
    next.splice(i, 0, moved);
    reorderSliderImages(next);
    setDragIdx(i);
  };

  return (
    <div>
      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 800, color: C.navy, marginBottom: '4px' }}>Ana Sayfa Slider Görselleri</h2>
        <p style={{ fontSize: '13px', color: C.textLight }}>En fazla {MAX_SLIDER} görsel · Maks. {MAX_SIZE_MB}MB/görsel · Otomatik 1920×800px'e yeniden boyutlandırılır · Sürükle-bırak ile sıra değiştir</p>
      </div>

      {sliderImages.length < MAX_SLIDER && (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          onClick={() => document.getElementById('slider-file-input').click()}
          style={{ border: `2px dashed ${dragOver ? C.gold : C.border}`, borderRadius: '14px', padding: '40px', textAlign: 'center', cursor: 'pointer', background: dragOver ? C.goldBg : '#fafafa', transition: 'all .2s', marginBottom: '20px' }}>
          <input id="slider-file-input" type="file" accept="image/jpeg,image/png,image/webp" multiple style={{ display: 'none' }} onChange={(e) => processFiles(e.target.files)} />
          <div style={{ fontSize: '36px', marginBottom: '10px' }}>🖼️</div>
          <div style={{ fontSize: '15px', fontWeight: 700, color: C.navy, marginBottom: '6px' }}>Görselleri buraya sürükleyin veya tıklayın</div>
          <div style={{ fontSize: '12px', color: C.textLight }}>{sliderImages.length}/{MAX_SLIDER} görsel · JPG, PNG, WebP · Maks. {MAX_SIZE_MB}MB</div>
        </div>
      )}

      {error && (
        <div style={{ background: '#fff5f5', border: '1px solid #fecaca', borderRadius: '10px', padding: '10px 14px', fontSize: '13px', color: C.red, marginBottom: '16px' }}>{error}</div>
      )}

      {sliderImages.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '14px' }}>
          {sliderImages.map((img, i) => (
            <div key={img.id} draggable
              onDragStart={() => onDragStartItem(i)}
              onDragOver={(e) => onDragOverItem(e, i)}
              onDragEnd={() => setDragIdx(null)}
              style={{ borderRadius: '12px', overflow: 'hidden', border: `2px solid ${dragIdx === i ? C.gold : C.border}`, cursor: 'grab', position: 'relative', boxShadow: dragIdx === i ? `0 6px 24px rgba(184,150,90,.35)` : 'none', transition: 'box-shadow .15s', userSelect: 'none' }}>
              <img src={img.src} alt={img.name} style={{ width: '100%', aspectRatio: '16/9', objectFit: 'cover', display: 'block', opacity: dragIdx === i ? 0.55 : 1, transition: 'opacity .15s' }} />
              <div style={{ position: 'absolute', top: '8px', left: '8px', background: 'rgba(0,0,0,.6)', borderRadius: '6px', padding: '3px 9px', fontSize: '12px', fontWeight: 800, color: '#fff' }}>{i + 1}</div>
              <div style={{ position: 'absolute', top: '8px', right: '8px', background: 'rgba(0,0,0,.4)', borderRadius: '6px', padding: '3px 7px', fontSize: '13px', color: 'rgba(255,255,255,.7)', cursor: 'grab' }}>⠿</div>
              <div style={{ padding: '8px 12px', background: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '12px', color: C.textMid, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{img.name}</span>
                <button onClick={() => removeSliderImage(img.id)} style={{ background: '#fff5f5', border: '1px solid #fecaca', borderRadius: '6px', padding: '3px 9px', fontSize: '11px', color: C.red, cursor: 'pointer', fontFamily: F, fontWeight: 700, flexShrink: 0 }}>Sil</button>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '7px 12px', background: '#f8f9fb', borderTop: `1px solid ${C.border}` }}>
                {[
                  { key: 'showMobile', label: 'Mobil' },
                  { key: 'showTablet', label: 'Tablet' },
                  { key: 'showDesktop', label: 'PC' },
                ].map(({ key, label }) => (
                  <label key={key} style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer', userSelect: 'none', flex: 1, padding: '3px 6px', borderRadius: '6px', background: img[key] !== false ? '#eef2ff' : 'transparent', border: `1px solid ${img[key] !== false ? '#c7d2fe' : C.border}`, transition: 'all .15s' }}>
                    <input
                      type="checkbox"
                      checked={img[key] !== false}
                      onChange={() => updateSliderImage(img.id, { [key]: img[key] === false })}
                      style={{ width: '13px', height: '13px', accentColor: C.navy, cursor: 'pointer', flexShrink: 0 }}
                    />
                    <span style={{ fontSize: '11px', fontWeight: img[key] !== false ? 700 : 400, color: img[key] !== false ? C.navy : C.textLight, whiteSpace: 'nowrap' }}>{label}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '50px', color: C.textLight, fontSize: '14px', background: '#fafafa', borderRadius: '14px', border: `1px dashed ${C.border}` }}>
          Henüz görsel eklenmedi. Görsel eklenene kadar landing page varsayılan görünümünü gösterir.
        </div>
      )}
    </div>
  );
}

function FaviconTab({ faviconUrl, updateFavicon }) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview]     = useState(null);
  const [error, setError]         = useState('');

  const handleFile = async (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) { setError('Sadece görsel dosyaları desteklenir.'); return; }
    if (file.size > 1 * 1024 * 1024) { setError('Dosya boyutu maks. 1 MB olmalıdır.'); return; }
    setError('');
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target.result);
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!preview) return;
    setUploading(true);
    try {
      const url = await uploadDataURL(preview, 'favicon');
      await updateFavicon(url);
      setPreview(null);
    } catch (e) {
      setError('Yükleme başarısız: ' + (e?.message || 'bilinmeyen hata'));
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ maxWidth: '520px' }}>
      <Card style={{ padding: '28px' }}>
        <div style={{ fontWeight: 700, fontSize: '16px', color: C.navy, marginBottom: '20px' }}>Favicon Yönetimi</div>

        {/* Mevcut favicon */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ fontSize: '12px', fontWeight: 600, color: C.textLight, textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: '10px' }}>Mevcut Favicon</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '12px', border: `1px solid ${C.border}`, background: '#f9f9fb', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
              {faviconUrl
                ? <img src={faviconUrl} alt="favicon" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                : <span style={{ fontSize: '11px', color: C.textLight }}>Yok</span>
              }
            </div>
            <div style={{ fontSize: '13px', color: C.textMid }}>
              {faviconUrl ? <a href={faviconUrl} target="_blank" rel="noopener noreferrer" style={{ color: C.gold, textDecoration: 'none', wordBreak: 'break-all' }}>Mevcut favicon görüntüle</a> : 'Henüz favicon yüklenmedi.'}
            </div>
          </div>
        </div>

        {/* Yeni favicon yükle */}
        <div style={{ fontSize: '12px', fontWeight: 600, color: C.textLight, textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: '10px' }}>Yeni Favicon Yükle</div>
        <div
          onClick={() => document.getElementById('favicon-file-input').click()}
          style={{ border: `2px dashed ${preview ? C.gold : C.border}`, borderRadius: '12px', padding: '28px', textAlign: 'center', cursor: 'pointer', background: preview ? C.goldBg : '#fafafa', transition: 'all .2s', marginBottom: '14px' }}>
          <input id="favicon-file-input" type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => handleFile(e.target.files[0])} />
          {preview ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
              <img src={preview} alt="preview" style={{ width: '64px', height: '64px', objectFit: 'contain', borderRadius: '8px', border: `1px solid ${C.goldBorder}` }} />
              <span style={{ fontSize: '12px', color: C.gold, fontWeight: 600 }}>Önizleme — kaydetmek için aşağıdaki butona tıkla</span>
            </div>
          ) : (
            <div>
              <svg width="28" height="28" fill="none" stroke={C.textLight} strokeWidth="1.5" viewBox="0 0 24 24" style={{ marginBottom: '8px' }}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
              <div style={{ fontSize: '13px', color: C.textMid }}>Tıkla veya sürükle · PNG, ICO, SVG · Maks. 1 MB</div>
            </div>
          )}
        </div>

        {error && <div style={{ padding: '8px 12px', background: '#fff5f5', border: '1px solid #fecaca', borderRadius: '8px', fontSize: '13px', color: C.red, marginBottom: '14px' }}>{error}</div>}

        <div style={{ display: 'flex', gap: '8px' }}>
          {preview && <Btn variant="secondary" onClick={() => { setPreview(null); setError(''); }}>İptal</Btn>}
          <Btn onClick={handleSave} disabled={!preview || uploading}>{uploading ? 'Yükleniyor…' : 'Favicon Kaydet'}</Btn>
        </div>
      </Card>
    </div>
  );
}

function PerfumeImageSlots({ images, onChange, MAX_SIZE_MB = 2 }) {
  const [dragSrcIdx, setDragSrcIdx] = useState(null);
  const [dragOverIdx, setDragOverIdx] = useState(null);
  const [sizeErr, setSizeErr] = useState('');
  const [uploadingIdx, setUploadingIdx] = useState(null);
  const [cropModal, setCropModal] = useState({ open: false, src: '', slotIdx: null });

  const readFile = (idx, file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) { setSizeErr('Sadece JPG, PNG veya WebP görseli yüklenebilir.'); return; }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) { setSizeErr(`"${file.name}" ${MAX_SIZE_MB}MB sınırını aşıyor.`); return; }
    setSizeErr('');
    const reader = new FileReader();
    reader.onload = (e) => setCropModal({ open: true, src: e.target.result, slotIdx: idx });
    reader.readAsDataURL(file);
  };

  const handleCropConfirm = async (dataURL) => {
    const idx = cropModal.slotIdx;
    setCropModal({ open: false, src: '', slotIdx: null });
    setUploadingIdx(idx);
    try {
      const url = await uploadDataURL(dataURL, 'perfumes');
      const next = [...images];
      next[idx] = { src: url, name: 'gorsel' };
      onChange(next);
    } catch {
      setSizeErr('Görsel yüklenirken hata oluştu.');
    } finally {
      setUploadingIdx(null);
    }
  };

  return (
    <div style={{ marginTop: '4px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
        <div style={{ fontSize: '13px', fontWeight: 700, color: C.navy }}>Parfüm Görselleri</div>
        <div style={{ fontSize: '12px', color: C.textLight }}>JPG · PNG · WebP · maks. {MAX_SIZE_MB}MB · sürükleyerek sırala</div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
        {images.map((img, idx) => (
          <div
            key={idx}
            draggable={!!img}
            onDragStart={(e) => { if (!img) { e.preventDefault(); return; } setDragSrcIdx(idx); }}
            onDragOver={(e) => { e.preventDefault(); setDragOverIdx(idx); }}
            onDragLeave={() => setDragOverIdx(null)}
            onDragEnd={() => { setDragSrcIdx(null); setDragOverIdx(null); }}
            onDrop={(e) => {
              e.preventDefault();
              setDragOverIdx(null);
              if (dragSrcIdx !== null) {
                if (dragSrcIdx !== idx) {
                  const next = [...images];
                  [next[dragSrcIdx], next[idx]] = [next[idx], next[dragSrcIdx]];
                  onChange(next);
                }
                setDragSrcIdx(null);
                return;
              }
              readFile(idx, e.dataTransfer.files[0]);
            }}
            onClick={() => !img && document.getElementById(`perf-img-${idx}`).click()}
            style={{
              aspectRatio: '4/3',
              borderRadius: '12px',
              border: `2px ${dragOverIdx === idx ? 'solid' : 'dashed'} ${dragOverIdx === idx ? C.gold : img ? C.goldBorder : C.border}`,
              background: dragOverIdx === idx ? C.goldBg : img ? '#fff' : '#fafafa',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: img ? 'grab' : 'pointer',
              overflow: 'hidden',
              position: 'relative',
              transition: 'all .15s',
              opacity: dragSrcIdx === idx ? 0.4 : 1,
              userSelect: 'none',
              boxShadow: dragOverIdx === idx ? `0 0 0 3px ${C.goldBg}` : 'none',
            }}
          >
            <input
              id={`perf-img-${idx}`}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              style={{ display: 'none' }}
              onChange={(e) => { readFile(idx, e.target.files[0]); e.target.value = ''; }}
            />
            {uploadingIdx === idx ? (
              <div style={{ textAlign: 'center', padding: '10px', pointerEvents: 'none' }}>
                <div style={{ width: '26px', height: '26px', margin: '0 auto 8px', border: `3px solid ${C.border}`, borderTop: `3px solid ${C.gold}`, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                <div style={{ fontSize: '11px', color: C.textLight }}>Yükleniyor…</div>
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
              </div>
            ) : img ? (
              <>
                <img src={img.src} alt={img.name} style={{ width: '100%', height: '100%', objectFit: 'cover', pointerEvents: 'none' }} />
                <div style={{ position: 'absolute', top: '8px', left: '8px', background: 'rgba(0,0,0,.6)', borderRadius: '6px', padding: '2px 8px', fontSize: '11px', fontWeight: 800, color: '#fff' }}>{idx + 1}</div>
                <button
                  onClick={(e) => { e.stopPropagation(); setSizeErr(''); const next = [...images]; next[idx] = null; onChange(next); }}
                  style={{ position: 'absolute', top: '8px', right: '8px', width: '24px', height: '24px', borderRadius: '50%', background: 'rgba(220,38,38,.9)', border: 'none', cursor: 'pointer', color: '#fff', fontSize: '15px', fontFamily: F, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, lineHeight: 1 }}
                >×</button>
                <div style={{ position: 'absolute', bottom: '8px', right: '8px', background: 'rgba(0,0,0,.45)', borderRadius: '6px', padding: '3px 7px', fontSize: '12px', color: 'rgba(255,255,255,.85)' }}>⠿</div>
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '10px', pointerEvents: 'none' }}>
                <svg width="32" height="32" fill="none" stroke={C.textLight} strokeWidth="1.5" viewBox="0 0 24 24" style={{ marginBottom: '8px' }}>
                  <rect x="3" y="3" width="18" height="18" rx="3" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <path d="m21 15-5-5L5 21" />
                </svg>
                <div style={{ fontSize: '12px', fontWeight: 600, color: C.textMid, marginBottom: '3px' }}>Görsel {idx + 1}</div>
                <div style={{ fontSize: '11px', color: C.textLight }}>Tıkla veya sürükle bırak</div>
              </div>
            )}
          </div>
        ))}
      </div>
      {sizeErr && (
        <div style={{ marginTop: '8px', fontSize: '12px', color: C.red, background: '#fff5f5', border: '1px solid #fecaca', borderRadius: '8px', padding: '7px 12px' }}>{sizeErr}</div>
      )}
      {cropModal.open && (
        <ImageCropModal
          src={cropModal.src}
          aspect={4 / 3}
          outputW={800}
          outputH={600}
          title="Parfüm Görselini Kırp"
          onConfirm={handleCropConfirm}
          onCancel={() => setCropModal({ open: false, src: '', slotIdx: null })}
        />
      )}
    </div>
  );
}

async function getCroppedImg(imageSrc, pixelCrop, outputW, outputH) {
  const image = await new Promise((res, rej) => {
    const img = new Image();
    img.onload = () => res(img);
    img.onerror = rej;
    img.src = imageSrc;
  });
  const canvas = document.createElement('canvas');
  canvas.width = outputW;
  canvas.height = outputH;
  canvas.getContext('2d').drawImage(
    image,
    pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height,
    0, 0, outputW, outputH,
  );
  return canvas.toDataURL('image/jpeg', 0.88);
}

function ImageCropModal({ src, aspect, outputW, outputH, title, onConfirm, onCancel }) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    if (!croppedAreaPixels) return;
    setLoading(true);
    try {
      const dataURL = await getCroppedImg(src, croppedAreaPixels, outputW, outputH);
      onConfirm(dataURL);
    } catch {
      setLoading(false);
    }
  };

  return (
    <Modal open onClose={onCancel} title={title || 'Görseli Kırp'} width="560px">
      <div style={{ position: 'relative', width: '100%', height: '320px', background: '#111', borderRadius: '10px', overflow: 'hidden' }}>
        <Cropper
          image={src}
          crop={crop}
          zoom={zoom}
          aspect={aspect}
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onCropComplete={(_, pixels) => setCroppedAreaPixels(pixels)}
        />
      </div>
      <div style={{ paddingTop: '14px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '12px', color: C.textLight, flexShrink: 0 }}>Yakınlaştır</span>
          <input type="range" min={1} max={3} step={0.01} value={zoom} onChange={(e) => setZoom(Number(e.target.value))} style={{ flex: 1, accentColor: C.navy, cursor: 'pointer' }} />
        </div>
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
          <Btn variant="secondary" onClick={onCancel} disabled={loading}>İptal</Btn>
          <Btn onClick={handleConfirm} disabled={loading || !croppedAreaPixels}>
            {loading ? 'İşleniyor…' : 'Kırp ve Kullan'}
          </Btn>
        </div>
      </div>
    </Modal>
  );
}

// maxH: sadece slider gibi sabit yüksekliği olan yerlerde crop için kullan
function compressToDataURL(file, maxW, quality, maxH = null) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        // Önce genişliğe göre ölçekle
        const scale = img.width > maxW ? maxW / img.width : 1;
        const scaledW = Math.round(img.width * scale);
        const scaledH = Math.round(img.height * scale);

        // maxH verilmişse yüksekliği kırp (center crop)
        const outH = maxH ? Math.min(scaledH, maxH) : scaledH;
        const srcY = maxH && scaledH > maxH
          ? Math.round((scaledH - maxH) / 2 / scale)
          : 0;
        const srcH = Math.round(outH / scale);

        const canvas = document.createElement('canvas');
        canvas.width = scaledW;
        canvas.height = outH;
        canvas.getContext('2d').drawImage(img, 0, srcY, img.width, srcH, 0, 0, scaledW, outH);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function AdminPanel() {
  useSeo({ title: 'Yönetim', noindex: true });
  const { isAdmin, reauthenticate } = useAuth();
  const { navigate } = useRouter();
  const { brands, perfumes, muadilPerfumes, users, comments, addBrand, updateUser, deleteUser, addPerfume, updatePerfume, deletePerfume, addMuadil, updateMuadil, deleteMuadil, updateBrand, deleteBrand, fetchReviewsByDateRange, adminDeleteReviews, sliderImages, addSliderImage, removeSliderImage, updateSliderImage, reorderSliderImages, MAX_SLIDER, MAX_SIZE_MB, faviconUrl, updateFavicon } = useData();

  const { sm, xs } = useW();
  const [tab, setTabRaw] = useState('dashboard');
  const [openActionId, setOpenActionId] = useState(null);
  const [uam, setUam] = useState({ open: false, user: null, step: 'actions', action: null, password: '', loading: false, error: '' });
  const [iam, setIam] = useState({ open: false, item: null, itemType: null, step: 'actions', password: '', loading: false, error: '' });
  const [sort, setSort] = useState({ key: '', dir: 'asc' });
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [bulkDel, setBulkDel] = useState({ open: false, password: '', loading: false, error: '' });

  // ─── Tüm Yorumlar sekmesi ───────────────────────────────────────────────
  const _today = new Date().toISOString().slice(0, 10);
  const _weekAgo = new Date(Date.now() - 7 * 864e5).toISOString().slice(0, 10);
  const [revRange, setRevRange] = useState({ start: _weekAgo, end: _today });
  const [revList, setRevList] = useState([]);
  const [revLoading, setRevLoading] = useState(false);
  const [revLoaded, setRevLoaded] = useState(false);
  const [revError, setRevError] = useState('');
  const [revDel, setRevDel] = useState({ open: false, ids: [], password: '', loading: false, error: '' });

  const loadReviews = async () => {
    setRevLoading(true); setRevError('');
    try {
      const list = await fetchReviewsByDateRange(revRange.start, revRange.end);
      setRevList(list);
      setRevLoaded(true);
      setSelectedIds(new Set());
    } catch (e) {
      setRevError('Yorumlar getirilemedi: ' + (e?.message || 'bilinmeyen hata'));
    } finally {
      setRevLoading(false);
    }
  };

  const openRevDel = (ids) => setRevDel({ open: true, ids, password: '', loading: false, error: '' });
  const closeRevDel = () => setRevDel({ open: false, ids: [], password: '', loading: false, error: '' });
  const handleRevDelete = async () => {
    setRevDel((s) => ({ ...s, loading: true, error: '' }));
    try { await reauthenticate(revDel.password); }
    catch { setRevDel((s) => ({ ...s, loading: false, error: 'Şifre hatalı. Lütfen tekrar deneyin.' })); return; }
    await adminDeleteReviews(revDel.ids);
    const removed = new Set(revDel.ids);
    setRevList((prev) => prev.filter((r) => !removed.has(r.id)));
    setSelectedIds(new Set());
    closeRevDel();
  };

  const setTab = (t) => { setTabRaw(t); setSort({ key: '', dir: 'asc' }); setSearch(''); setSelectedIds(new Set()); };

  const toggleSelect = (id) => setSelectedIds((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const toggleAll = (ids) => setSelectedIds((prev) => ids.every((id) => prev.has(id)) ? new Set() : new Set(ids));
  const openBulkDel = () => setBulkDel({ open: true, password: '', loading: false, error: '' });
  const closeBulkDel = () => setBulkDel({ open: false, password: '', loading: false, error: '' });

  const handleBulkDelete = async () => {
    setBulkDel((s) => ({ ...s, loading: true, error: '' }));
    try {
      await reauthenticate(bulkDel.password);
    } catch {
      setBulkDel((s) => ({ ...s, loading: false, error: 'Şifre hatalı. Lütfen tekrar deneyin.' }));
      return;
    }
    const ids = [...selectedIds];
    if (tab === 'original-brands' || tab === 'muadil-brands') await Promise.all(ids.map((id) => { const b = brands.find((x) => x.id === id); return deleteBrand(id, b?.type); }));
    else if (tab === 'perfumes') await Promise.all(ids.map(deletePerfume));
    else if (tab === 'muadil') await Promise.all(ids.map(deleteMuadil));
    setSelectedIds(new Set());
    closeBulkDel();
  };

  const closeIam = () => setIam({ open: false, item: null, itemType: null, step: 'actions', password: '', loading: false, error: '' });
  const openIam = (item, itemType) => setIam({ open: true, item, itemType, step: 'actions', password: '', loading: false, error: '' });
  const handleIamDelete = async () => {
    setIam((s) => ({ ...s, loading: true, error: '' }));
    try { await reauthenticate(iam.password); } catch { setIam((s) => ({ ...s, loading: false, error: 'Şifre hatalı. Lütfen tekrar deneyin.' })); return; }
    if (iam.itemType === 'brand') await deleteBrand(iam.item.id, iam.item.type);
    else if (iam.itemType === 'perfume') await deletePerfume(iam.item.id);
    else if (iam.itemType === 'muadil') await deleteMuadil(iam.item.id);
    closeIam();
  };

  const closeUam = () => setUam({ open: false, user: null, step: 'actions', action: null, password: '', loading: false, error: '' });
  const openUamConfirm = (action) => setUam((s) => ({ ...s, step: 'confirm', action, password: '', error: '' }));
  const handleUamSubmit = async () => {
    const { user: u, action, password } = uam;
    setUam((s) => ({ ...s, loading: true, error: '' }));
    try { await reauthenticate(password); } catch { setUam((s) => ({ ...s, loading: false, error: 'Şifre hatalı. Lütfen tekrar deneyin.' })); return; }
    if (action === 'mod') await updateUser(u.id, { role: u.role === 'moderator' ? 'user' : 'moderator' });
    else if (action === 'freeze') await updateUser(u.id, { active: !u.active });
    else if (action === 'delete') {
      await deleteUser(u.id);
      setUam((s) => ({ ...s, loading: false, step: 'deleted', deletedEmail: u.email }));
      return;
    }
    closeUam();
  };

  const toggleSort = (key) => setSort((s) => s.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' });

  const applySort = (arr, keyFn) => {
    if (!sort.key) return arr;
    return [...arr].sort((a, b) => {
      const av = keyFn(a, sort.key) ?? '';
      const bv = keyFn(b, sort.key) ?? '';
      const cmp = typeof av === 'number' && typeof bv === 'number' ? av - bv : String(av).localeCompare(String(bv), 'tr');
      return sort.dir === 'asc' ? cmp : -cmp;
    });
  };


  const [showBM, setShowBM] = useState(false);
  const [showPM, setShowPM] = useState(false);
  const [showMM, setShowMM] = useState(false);
  const [selUser, setSelUser] = useState(null);
  const [selPerf, setSelPerf] = useState(null);
  const [selMuadil, setSelMuadil] = useState(null);
  const [delTarget, setDelTarget] = useState(null);
  const [delBrandPw, setDelBrandPw] = useState({ password: '', loading: false, error: '' });
  const [selBrand, setSelBrand] = useState(null);
  const [ebf, setEbf] = useState(null);
  const [bf, setBf] = useState({ name: '', slug: '', type: 'original', origin: '', founded: '', logo: '', logoImage: '', category: 'Designer', bio: '', instagram: '', website: '' });
  const [brandCropModal, setBrandCropModal] = useState({ open: false, src: '', target: null });

  const handleBrandCropConfirm = async (dataURL) => {
    const { target } = brandCropModal;
    setBrandCropModal({ open: false, src: '', target: null });
    const setter = target === 'add' ? setBf : setEbf;
    setter((s) => ({ ...s, _logoUploading: true, _logoErr: '' }));
    try {
      const url = await uploadDataURL(dataURL, 'brands');
      setter((s) => ({ ...s, logoImage: url, _logoUploading: false }));
    } catch {
      setter((s) => ({ ...s, _logoErr: 'Görsel yüklenirken hata oluştu.', _logoUploading: false }));
    }
  };
  const [pf, setPf] = useState({ name: '', slug: '', brandId: '', gender: 'Erkek', year: '', description: '', topNotes: '', heartNotes: '', baseNotes: '', images: [null, null, null] });
  const [mf, setMf] = useState({ name: '', slug: '', brandId: '', targetPerfumeId: '', gender: '', description: '', images: [null, null, null] });
  const [ef, setEf] = useState(null);
  const [emf, setEmf] = useState(null);

  if (!isAdmin) return <div style={{ padding: '60px', textAlign: 'center', color: C.textLight }}>Erişim yetkisi yok.</div>;

  const stats = [
    { label: 'Toplam Kullanıcı', val: users.length, icon: faUsers, color: C.blue },
    { label: 'Orijinal Parfüm', val: perfumes.length, icon: faFlask, color: C.gold },
    { label: 'Muadil Parfüm', val: muadilPerfumes.length, icon: faStar, color: C.green },
    { label: 'Bekleyen Yorum', val: comments.filter((c) => c.status === 'pending').length, icon: faCommentDots, color: C.orange },
  ];

  const [brandErr, setBrandErr] = useState('');
  const [perfErr, setPerfErr] = useState('');
  const [muadilErr, setMuadilErr] = useState('');

  const sbrand = () => {
    if (!bf.name) return;
    const norm = bf.name.trim().toLowerCase();
    const dup = brands.find((b) => b.type === bf.type && b.name.trim().toLowerCase() === norm);
    if (dup) { setBrandErr(`"${bf.name}" adında bir ${bf.type === 'original' ? 'orijinal' : 'muadil'} marka zaten mevcut.`); return; }
    setBrandErr('');
    const { _logoErr, _logoUploading, ...cleanBf } = bf;
    addBrand({ ...cleanBf, slug: bf.slug || slugify(bf.name), founded: Number(bf.founded) || 2000 });
    setBf({ name: '', slug: '', type: 'original', origin: '', founded: '', logo: '', logoImage: '', category: 'Lüks', bio: '', instagram: '', website: '' });
    setShowBM(false);
  };

  const sperf = () => {
    if (!pf.name || !pf.brandId) return;
    const norm = pf.name.trim().toLowerCase();
    const dup = perfumes.find((p) => p.name.trim().toLowerCase() === norm);
    if (dup) { setPerfErr(`"${pf.name}" adında bir orijinal parfüm zaten mevcut.`); return; }
    setPerfErr('');
    const b = brands.find((x) => String(x.id) === pf.brandId);
    const pPrimary = pf.images.find(Boolean)?.src || '';
    addPerfume({ ...pf, brandId: pf.brandId, slug: pf.slug || slugify(pf.name), brandSlug: b?.slug || '', brandName: b?.name || '', year: Number(pf.year) || 2020, notes: { top: (pf.topNotes || '').split(',').map((s) => s.trim()).filter(Boolean), heart: (pf.heartNotes || '').split(',').map((s) => s.trim()).filter(Boolean), base: (pf.baseNotes || '').split(',').map((s) => s.trim()).filter(Boolean) }, image: pPrimary, images: pf.images });
    setPf({ name: '', slug: '', brandId: '', gender: 'Erkek', year: '', description: '', topNotes: '', heartNotes: '', baseNotes: '', images: [null, null, null] });
    setShowPM(false);
  };

  const smuadil = () => {
    if (!mf.name || !mf.brandId || !mf.targetPerfumeId) return;
    const norm = mf.name.trim().toLowerCase();
    const dup = muadilPerfumes.find((m) => m.name.trim().toLowerCase() === norm);
    if (dup) { setMuadilErr(`"${mf.name}" adında bir muadil parfüm zaten mevcut.`); return; }
    setMuadilErr('');
    const b = brands.find((x) => String(x.id) === mf.brandId);
    const t = perfumes.find((x) => String(x.id) === mf.targetPerfumeId);
    const mPrimary = mf.images.find(Boolean)?.src || '';
    addMuadil({ ...mf, brandId: mf.brandId, targetPerfumeId: mf.targetPerfumeId, slug: mf.slug || slugify(mf.name), brandSlug: b?.slug || '', brandName: b?.name || '', targetPerfumeName: t?.name || '', targetBrandName: t?.brandName || '', gender: t?.gender || mf.gender || '', image: mPrimary, images: mf.images });
    setMf({ name: '', slug: '', brandId: '', targetPerfumeId: '', gender: '', description: '', images: [null, null, null] });
    setShowMM(false);
  };

  const openEditBrand = (b) => {
    setSelBrand(b);
    setEbf({ name: b.name, slug: b.slug, type: b.type, origin: b.origin || '', founded: String(b.founded || ''), logo: b.logo || '', logoImage: b.logoImage || '', category: b.category || 'Lüks', bio: b.bio || '', instagram: b.instagram || '', website: b.website || '' });
  };

  const saveBrand = () => {
    if (!ebf.name) return;
    const { _logoErr, _logoUploading, ...cleanEbf } = ebf;
    updateBrand(selBrand.id, { ...cleanEbf, founded: Number(ebf.founded) || selBrand.founded });
    setSelBrand(null);
    setEbf(null);
  };

  const openEditPerf = (p) => {
    setSelPerf(p);
    setEf({ name: p.name, slug: p.slug, brandId: String(p.brandId), gender: p.gender, year: String(p.year || ''), description: p.description || '', topNotes: (p.notes?.top || []).join(', '), heartNotes: (p.notes?.heart || []).join(', '), baseNotes: (p.notes?.base || []).join(', ') });
  };

  const savePerf = () => {
    if (!ef.name || !ef.brandId) return;
    const b = brands.find((x) => String(x.id) === ef.brandId);
    updatePerfume(selPerf.id, { ...ef, brandId: ef.brandId, brandSlug: b?.slug || selPerf.brandSlug, brandName: b?.name || selPerf.brandName, year: Number(ef.year) || selPerf.year, notes: { top: (ef.topNotes || '').split(',').map((s) => s.trim()).filter(Boolean), heart: (ef.heartNotes || '').split(',').map((s) => s.trim()).filter(Boolean), base: (ef.baseNotes || '').split(',').map((s) => s.trim()).filter(Boolean) } });
    setSelPerf(null);
    setEf(null);
  };

  const openEditMuadil = (m) => {
    setSelMuadil(m);
    setEmf({ name: m.name, slug: m.slug, brandId: String(m.brandId ?? ''), targetPerfumeId: String(m.targetPerfumeId ?? ''), gender: m.gender || '', description: m.description || '' });
  };

  const saveMuadil = () => {
    if (!emf.name || !emf.brandId || !emf.targetPerfumeId) return;
    const bid = emf.brandId;
    const tid = emf.targetPerfumeId;
    const b = brands.find((x) => String(x.id) === bid);
    const t = perfumes.find((x) => String(x.id) === tid);
    updateMuadil(selMuadil.id, { ...emf, brandId: bid, targetPerfumeId: tid, gender: t?.gender || emf.gender || '', brandSlug: b?.slug || selMuadil.brandSlug, brandName: b?.name || selMuadil.brandName, targetPerfumeName: t?.name || selMuadil.targetPerfumeName, targetBrandName: t?.brandName || selMuadil.targetBrandName });
    setSelMuadil(null);
    setEmf(null);
  };

  const thStyle = thBase;
  const tdStyle = { padding: '11px 14px' };

  return (
    <div style={{ minHeight: '100vh', background: C.bg }}>
      <div style={{ background: C.navy, padding: sm ? '16px' : '22px 32px' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
          <div>
            <h1 style={{ fontSize: sm ? '18px' : '22px', fontWeight: 900, color: '#fff' }}>Admin Paneli</h1>
            <p style={{ color: 'rgba(255,255,255,.5)', fontSize: '13px' }}>muadilci.com yönetim merkezi</p>
          </div>
          <Btn variant="ghost" style={{ borderColor: 'rgba(255,255,255,.3)', color: '#fff', flexShrink: 0 }} onClick={() => navigate('/')}>← Siteye Dön</Btn>
        </div>
      </div>

      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: sm ? '16px' : xs ? '16px' : '26px 32px' }}>
        {/* Tabs — desktop: buton grubu, tablet/mobil: dropdown */}
        {sm ? (
          <select
            value={tab}
            onChange={(e) => setTab(e.target.value)}
            style={{ width: '100%', marginBottom: '18px', height: '42px', padding: '0 14px', borderRadius: '10px', border: `1px solid ${C.border}`, background: C.card, color: C.navy, fontSize: '14px', fontWeight: 700, fontFamily: F, cursor: 'pointer', outline: 'none' }}>
            {TABS.map(({ k, l }) => <option key={k} value={k}>{l}</option>)}
          </select>
        ) : (
          <div style={{ display: 'flex', gap: '4px', marginBottom: '26px', background: C.card, border: `1px solid ${C.border}`, borderRadius: '12px', padding: '4px', overflowX: 'auto', width: 'fit-content', maxWidth: '100%' }}>
            {TABS.map(({ k, l }) => (
              <button key={k} onClick={() => setTab(k)} style={{ padding: '8px 16px', borderRadius: '9px', border: 'none', background: tab === k ? C.navy : 'transparent', color: tab === k ? '#fff' : C.textMid, fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: F, whiteSpace: 'nowrap' }}>{l}</button>
            ))}
          </div>
        )}

        {/* Dashboard */}
        {tab === 'dashboard' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: '14px', marginBottom: '26px' }}>
              {stats.map((s) => (
                <Card key={s.label} style={{ padding: '18px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontSize: '13px', color: C.textLight }}>{s.label}</span>
                    <FontAwesomeIcon icon={s.icon} style={{ fontSize: '20px', color: s.color, opacity: 0.7 }} />
                  </div>
                  <div style={{ fontSize: '30px', fontWeight: 900, color: s.color }}>{s.val}</div>
                </Card>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: sm ? '1fr' : '1fr 1fr', gap: '18px' }}>
              <Card style={{ padding: '20px' }}>
                <h3 style={{ fontWeight: 700, color: C.navy, marginBottom: '12px' }}>Son Kullanıcılar</h3>
                {users.slice(-4).reverse().map((u) => (
                  <div key={u.id} style={{ display: 'flex', gap: '10px', alignItems: 'center', paddingBottom: '10px', marginBottom: '10px', borderBottom: `1px solid ${C.borderLight}` }}>
                    <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: C.goldBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 700, color: C.gold, overflow: 'hidden', flexShrink: 0 }}>
                      {u.photoURL
                        ? <img src={u.photoURL} alt={u.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                        : (u.avatar?.length === 1 ? u.avatar : u.name?.[0]?.toUpperCase() || '?')
                      }
                    </div>
                    <div style={{ flex: 1 }}><div style={{ fontSize: '13px', fontWeight: 600, color: C.text }}>{u.name}</div><div style={{ fontSize: '12px', color: C.textLight }}>{u.email}</div></div>
                    <Badge color={RC[u.role]}>{RL[u.role]}</Badge>
                  </div>
                ))}
              </Card>
              <Card style={{ padding: '20px' }}>
                <h3 style={{ fontWeight: 700, color: C.navy, marginBottom: '12px' }}>Bekleyen Yorumlar</h3>
                {comments.filter((c) => c.status === 'pending').slice(0, 4).map((c) => (
                  <div key={c.id} style={{ paddingBottom: '10px', marginBottom: '10px', borderBottom: `1px solid ${C.borderLight}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                      <span style={{ fontSize: '13px', fontWeight: 600, color: C.text }}>{c.userName}</span>
                      <Badge color="orange">Bekliyor</Badge>
                    </div>
                    <p style={{ fontSize: '12px', color: C.textMid, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.text}</p>
                  </div>
                ))}
                {!comments.filter((c) => c.status === 'pending').length && <div style={{ color: C.textLight, fontSize: '14px', textAlign: 'center', padding: '16px' }}>Bekleyen yorum yok ✓</div>}
              </Card>
            </div>
          </div>
        )}

        {/* Users */}
        {tab === 'users' && (() => {
          const q = search.toLowerCase();
          const filtered = users.filter((u) => !q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || RL[u.role].toLowerCase().includes(q));
          const sorted = applySort(filtered, (u, k) => ({ name: u.name, email: u.email, role: RL[u.role], active: u.active ? 'Aktif' : 'Dondurulmuş' })[k]);
          return (
            <Card style={{ overflow: 'hidden' }}>
              <div style={{ padding: '14px 18px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center' }}><span style={{ fontWeight: 700, color: C.navy }}>Kullanıcılar</span></div>
              <SearchBar value={search} onChange={setSearch} placeholder="İsim, e-posta veya rol ara…" count={sorted.length} total={users.length} />
              <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                <table style={{ width: '100%', minWidth: '620px', borderCollapse: 'collapse' }}>
                  <thead><tr style={{ background: '#f9f9fb' }}>
                    <SortTh label="Kullanıcı" sortKey="name" sort={sort} onSort={toggleSort} />
                    <SortTh label="E-posta" sortKey="email" sort={sort} onSort={toggleSort} />
                    <SortTh label="Rol" sortKey="role" sort={sort} onSort={toggleSort} />
                    <SortTh label="Durum" sortKey="active" sort={sort} onSort={toggleSort} />
                    <th style={thStyle}>İşlemler</th>
                  </tr></thead>
                  <tbody>
                    {sorted.map((u) => (
                      <tr key={u.id} style={{ borderBottom: `1px solid ${C.borderLight}` }} onMouseEnter={(e) => (e.currentTarget.style.background = '#fafafa')} onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}>
                        <td style={tdStyle}>
                          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                            <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: `linear-gradient(135deg,${C.gold},${C.goldLight})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', color: '#fff', fontWeight: 700, overflow: 'hidden', flexShrink: 0 }}>
                              {u.photoURL
                                ? <img src={u.photoURL} alt={u.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                                : (u.avatar?.length === 1 ? u.avatar : u.name?.[0]?.toUpperCase() || '?')
                              }
                            </div>
                            <button onClick={() => setSelUser(u)} style={{ fontWeight: 600, fontSize: '14px', color: C.navy, background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', fontFamily: F }}>{u.name}</button>
                          </div>
                        </td>
                        <td style={{ ...tdStyle, fontSize: '13px', color: C.textMid }}>{u.email}</td>
                        <td style={tdStyle}><Badge color={RC[u.role]}>{RL[u.role]}</Badge></td>
                        <td style={tdStyle}><Badge color={u.role === 'admin' || u.active ? 'green' : 'red'}>{u.role === 'admin' || u.active ? 'Aktif' : 'Dondurulmuş'}</Badge></td>
                        <td style={tdStyle}>
                          {u.role !== 'admin' && (
                            sm ? (
                              <Btn size="sm" variant="navy" style={{ whiteSpace: 'nowrap' }} onClick={() => setUam({ open: true, user: u, step: 'actions', action: null, password: '', loading: false, error: '' })}>İşlem Yap</Btn>
                            ) : (
                              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                <Btn size="sm" variant={u.role === 'moderator' ? 'orange' : 'navy'} onClick={() => updateUser(u.id, { role: u.role === 'moderator' ? 'user' : 'moderator' })}>{u.role === 'moderator' ? 'Mod. Al' : 'Mod. Ver'}</Btn>
                                <Btn size="sm" variant={u.active ? 'danger' : 'success'} onClick={() => updateUser(u.id, { active: !u.active })}>{u.active ? 'Dondur' : 'Aktif Et'}</Btn>
                                <Btn size="sm" variant="danger" onClick={() => setUam({ open: true, user: u, step: 'confirm', action: 'delete', password: '', loading: false, error: '' })}>Sil</Btn>
                              </div>
                            )
                          )}
                        </td>
                      </tr>
                    ))}
                    {!sorted.length && <tr><td colSpan={5} style={{ ...tdStyle, textAlign: 'center', color: C.textLight, padding: '32px' }}>Sonuç bulunamadı.</td></tr>}
                  </tbody>
                </table>
              </div>
            </Card>
          );
        })()}

        {/* Original / Muadil Brands */}
        {(tab === 'original-brands' || tab === 'muadil-brands') && (() => {
          const isOrig = tab === 'original-brands';
          const baseBrands = brands.filter((b) => b.type === (isOrig ? 'original' : 'muadil')).map((b) => ({
            ...b,
            perfumeCount: isOrig ? perfumes.filter((p) => p.brandId === b.id).length : muadilPerfumes.filter((m) => m.brandId === b.id).length,
          }));
          const q = search.toLowerCase();
          const filtered = baseBrands.filter((b) => !q || b.name.toLowerCase().includes(q) || (b.origin || '').toLowerCase().includes(q));
          const sorted = applySort(filtered, (b, k) => ({ name: b.name, origin: b.origin || '', category: b.category || '', perfumeCount: b.perfumeCount, active: b.active ? 'Aktif' : 'Pasif' })[k]);
          return (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                {selectedIds.size > 0 ? (
                  <Btn variant="danger" onClick={openBulkDel}>Seçilenleri Sil ({selectedIds.size})</Btn>
                ) : <div />}
                <Btn onClick={() => { setBf({ name: '', slug: '', type: isOrig ? 'original' : 'muadil', origin: '', founded: '', logo: '', logoImage: '', category: 'Designer', bio: '' }); setShowBM(true); }}>+ Marka Ekle</Btn>
              </div>
              <Card style={{ overflow: 'hidden' }}>
                <div style={{ padding: '14px 18px', borderBottom: `1px solid ${C.border}` }}><span style={{ fontWeight: 700, color: C.navy }}>{isOrig ? 'Orijinal Markalar' : 'Muadil Markalar'}</span></div>
                <SearchBar value={search} onChange={setSearch} placeholder="Marka adı veya köken ara…" count={sorted.length} total={baseBrands.length} />
                <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                <table style={{ width: '100%', minWidth: '580px', borderCollapse: 'collapse' }}>
                  <thead><tr style={{ background: '#f9f9fb' }}>
                    <th style={{ ...thBase, width: '40px' }}>
                      <input type="checkbox" checked={sorted.length > 0 && sorted.every((b) => selectedIds.has(b.id))} onChange={() => toggleAll(sorted.map((b) => b.id))} />
                    </th>
                    <SortTh label="Marka" sortKey="name" sort={sort} onSort={toggleSort} />
                    <SortTh label="Köken" sortKey="origin" sort={sort} onSort={toggleSort} />
                    {isOrig && <SortTh label="Kategori" sortKey="category" sort={sort} onSort={toggleSort} />}
                    <SortTh label="Parfüm Sayısı" sortKey="perfumeCount" sort={sort} onSort={toggleSort} />
                    <SortTh label="Durum" sortKey="active" sort={sort} onSort={toggleSort} />
                    <th style={thStyle}>İşlem</th>
                  </tr></thead>
                  <tbody>
                    {sorted.map((b) => (
                      <tr key={b.id} style={{ borderBottom: `1px solid ${C.borderLight}`, background: selectedIds.has(b.id) ? '#fffbeb' : 'transparent' }} onMouseEnter={(e) => { if (!selectedIds.has(b.id)) e.currentTarget.style.background = '#fafafa'; }} onMouseLeave={(e) => { e.currentTarget.style.background = selectedIds.has(b.id) ? '#fffbeb' : 'transparent'; }}>
                        <td style={{ ...tdStyle, width: '40px' }}><input type="checkbox" checked={selectedIds.has(b.id)} onChange={() => toggleSelect(b.id)} /></td>
                        <td style={tdStyle}><div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}><div style={{ width: '30px', height: '30px', borderRadius: '7px', background: C.goldBg, border: `1px solid ${C.goldBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 700, color: C.gold, overflow: 'hidden' }}>{b.logoImage ? <img src={b.logoImage} alt={b.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : b.logo}</div><div><a onClick={(e) => { e.stopPropagation(); navigate(`/marka/${b.slug}`); }} style={{ fontWeight: 600, fontSize: '14px', color: C.navy, cursor: 'pointer', textDecoration: 'none' }}>{b.name}</a><div style={{ fontSize: '11px', color: C.textLight }}>/{b.slug}</div></div></div></td>
                        <td style={{ ...tdStyle, fontSize: '13px', color: C.textMid }}>{b.origin}</td>
                        {isOrig && (
                          <td style={tdStyle}>
                            {b.category && (
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 600, background: b.category === 'Niche' ? '#f3e8ff' : '#eff6ff', color: b.category === 'Niche' ? '#7c3aed' : '#2563eb', border: `1px solid ${b.category === 'Niche' ? '#ddd6fe' : '#bfdbfe'}` }}>
                                {b.category}
                              </span>
                            )}
                          </td>
                        )}
                        <td style={tdStyle}><span style={{ fontSize: '15px', fontWeight: 700, color: b.perfumeCount > 0 ? C.gold : C.textLight }}>{b.perfumeCount}</span></td>
                        <td style={tdStyle}><Badge color={b.active ? 'green' : 'red'}>{b.active ? 'Aktif' : 'Pasif'}</Badge></td>
                        <td style={tdStyle}>
                          {sm ? (
                            <Btn size="sm" variant="navy" style={{ whiteSpace: 'nowrap' }} onClick={() => openIam({ ...b, type: b.type }, 'brand')}>İşlem Yap</Btn>
                          ) : (
                            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                              <button onClick={() => updateBrand(b.id, { active: !b.active })} style={{ padding: '5px 10px', borderRadius: '7px', border: `1px solid ${C.border}`, background: '#fff', color: C.textMid, fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: F }}>{b.active ? 'Pasif Et' : 'Aktif Et'}</button>
                              <button onClick={() => openEditBrand(b)} title="Düzenle" style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '5px 10px', borderRadius: '7px', border: `1px solid ${C.border}`, background: '#fff', color: C.navy, fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: F }}>
                                <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4Z"/></svg>
                                Düzenle
                              </button>
                              <button onClick={() => setDelTarget({ id: b.id, name: b.name, type: 'brand', brandType: b.type })} title="Sil" style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '5px 10px', borderRadius: '7px', border: '1px solid #fecaca', background: '#fff5f5', color: C.red, fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: F }}>
                                <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                                Sil
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                    {!sorted.length && <tr><td colSpan={isOrig ? 7 : 6} style={{ ...tdStyle, textAlign: 'center', color: C.textLight, padding: '32px' }}>Sonuç bulunamadı.</td></tr>}
                  </tbody>
                </table>
                </div>
              </Card>
            </div>
          );
        })()}

        {/* Perfumes */}
        {tab === 'perfumes' && (() => {
          const basePerfumes = perfumes.map((p) => ({ ...p, muadilCount: muadilPerfumes.filter((m) => m.targetPerfumeId === p.id).length }));
          const q = search.toLowerCase();
          const filtered = basePerfumes.filter((p) => !q || p.name.toLowerCase().includes(q) || p.brandName.toLowerCase().includes(q) || p.gender.toLowerCase().includes(q));
          const sorted = applySort(filtered, (p, k) => ({ name: p.name, brandName: p.brandName, gender: p.gender, muadilCount: p.muadilCount })[k]);
          return (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                {selectedIds.size > 0 ? (
                  <Btn variant="danger" onClick={openBulkDel}>Seçilenleri Sil ({selectedIds.size})</Btn>
                ) : <div />}
                <Btn onClick={() => setShowPM(true)}>+ Parfüm Ekle</Btn>
              </div>
              <Card style={{ overflow: 'hidden' }}>
                <div style={{ padding: '14px 18px', borderBottom: `1px solid ${C.border}` }}><span style={{ fontWeight: 700, color: C.navy }}>Orijinal Parfümler</span></div>
                <SearchBar value={search} onChange={setSearch} placeholder="Parfüm adı, marka veya cinsiyet ara…" count={sorted.length} total={perfumes.length} />
                <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                <table style={{ width: '100%', minWidth: '620px', borderCollapse: 'collapse' }}>
                  <thead><tr style={{ background: '#f9f9fb' }}>
                    <th style={{ ...thBase, width: '40px' }}>
                      <input type="checkbox" checked={sorted.length > 0 && sorted.every((p) => selectedIds.has(p.id))} onChange={() => toggleAll(sorted.map((p) => p.id))} />
                    </th>
                    <SortTh label="Parfüm" sortKey="name" sort={sort} onSort={toggleSort} />
                    <SortTh label="Marka" sortKey="brandName" sort={sort} onSort={toggleSort} />
                    <th style={thStyle}>URL</th>
                    <SortTh label="Cinsiyet" sortKey="gender" sort={sort} onSort={toggleSort} />
                    <SortTh label="Muadil Sayısı" sortKey="muadilCount" sort={sort} onSort={toggleSort} />
                    <th style={thStyle}>İşlem</th>
                  </tr></thead>
                  <tbody>
                    {sorted.map((p) => (
                      <tr key={p.id} style={{ borderBottom: `1px solid ${C.borderLight}`, background: selectedIds.has(p.id) ? '#fffbeb' : 'transparent' }} onMouseEnter={(e) => { if (!selectedIds.has(p.id)) e.currentTarget.style.background = '#fafafa'; }} onMouseLeave={(e) => { e.currentTarget.style.background = selectedIds.has(p.id) ? '#fffbeb' : 'transparent'; }}>
                        <td style={{ ...tdStyle, width: '40px' }}><input type="checkbox" checked={selectedIds.has(p.id)} onChange={() => toggleSelect(p.id)} /></td>
                        <td style={{ ...tdStyle, fontWeight: 600, fontSize: '14px' }}><a onClick={(e) => { e.stopPropagation(); navigate(`/${p.brandSlug}/${p.slug}`); }} style={{ fontWeight: 600, fontSize: '14px', color: C.navy, cursor: 'pointer', textDecoration: 'none' }}>{p.name}</a></td>
                        <td style={{ ...tdStyle, fontSize: '13px' }}><a onClick={(e) => { e.stopPropagation(); navigate(`/marka/${p.brandSlug}`); }} style={{ fontSize: '13px', color: C.textMid, cursor: 'pointer', textDecoration: 'none' }}>{p.brandName}</a></td>
                        <td style={{ ...tdStyle, fontSize: '12px', color: C.gold }}>/{p.brandSlug}/{p.slug}</td>
                        <td style={tdStyle}><GenderBadge gender={p.gender} /></td>
                        <td style={{ ...tdStyle, fontSize: '13px', color: C.green, fontWeight: 600 }}>{p.muadilCount}</td>
                        <td style={tdStyle}>
                          {sm ? (
                            <Btn size="sm" variant="navy" style={{ whiteSpace: 'nowrap' }} onClick={() => openIam(p, 'perfume')}>İşlem Yap</Btn>
                          ) : (
                            <div style={{ display: 'flex', gap: '6px' }}>
                              <button onClick={() => openEditPerf(p)} title="Düzenle" style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '5px 10px', borderRadius: '7px', border: `1px solid ${C.border}`, background: '#fff', color: C.navy, fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: F }}>
                                <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4Z"/></svg>
                                Düzenle
                              </button>
                              <button onClick={() => setDelTarget({ id: p.id, name: p.name, type: 'perfume' })} title="Sil" style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '5px 10px', borderRadius: '7px', border: `1px solid #fecaca`, background: '#fff5f5', color: C.red, fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: F }}>
                                <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                                Sil
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                    {!sorted.length && <tr><td colSpan={7} style={{ ...tdStyle, textAlign: 'center', color: C.textLight, padding: '32px' }}>Sonuç bulunamadı.</td></tr>}
                  </tbody>
                </table>
                </div>
              </Card>
            </div>
          );
        })()}

        {/* Muadil */}
        {tab === 'muadil' && (() => {
          const baseMuadil = muadilPerfumes.map((m) => { const ms = calcScores(m.id, comments); return { ...m, overall: ms.overall ?? -1, commentCount: ms.count }; });
          const q = search.toLowerCase();
          const filtered = baseMuadil.filter((m) => !q || m.name.toLowerCase().includes(q) || m.brandName.toLowerCase().includes(q) || m.targetPerfumeName.toLowerCase().includes(q) || m.targetBrandName.toLowerCase().includes(q));
          const sorted = applySort(filtered, (m, k) => ({ name: m.name, brandName: m.brandName, targetPerfumeName: `${m.targetBrandName} ${m.targetPerfumeName}`, overall: m.overall, commentCount: m.commentCount })[k]);
          return (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                {selectedIds.size > 0 ? (
                  <Btn variant="danger" onClick={openBulkDel}>Seçilenleri Sil ({selectedIds.size})</Btn>
                ) : <div />}
                <Btn onClick={() => setShowMM(true)}>+ Muadil Parfüm Ekle</Btn>
              </div>
              <Card style={{ overflow: 'hidden' }}>
                <div style={{ padding: '14px 18px', borderBottom: `1px solid ${C.border}` }}><span style={{ fontWeight: 700, color: C.navy }}>Muadil Parfümler</span></div>
                <SearchBar value={search} onChange={setSearch} placeholder="Muadil adı, marka veya hedef parfüm ara…" count={sorted.length} total={muadilPerfumes.length} />
                <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                <table style={{ width: '100%', minWidth: '680px', borderCollapse: 'collapse' }}>
                  <thead><tr style={{ background: '#f9f9fb' }}>
                    <th style={{ ...thBase, width: '40px' }}>
                      <input type="checkbox" checked={sorted.length > 0 && sorted.every((m) => selectedIds.has(m.id))} onChange={() => toggleAll(sorted.map((m) => m.id))} />
                    </th>
                    <SortTh label="Muadil" sortKey="name" sort={sort} onSort={toggleSort} />
                    <SortTh label="Marka" sortKey="brandName" sort={sort} onSort={toggleSort} />
                    <SortTh label="Hedef Parfüm" sortKey="targetPerfumeName" sort={sort} onSort={toggleSort} />
                    <SortTh label="Genel Puan" sortKey="overall" sort={sort} onSort={toggleSort} />
                    <SortTh label="Yorum" sortKey="commentCount" sort={sort} onSort={toggleSort} />
                    <th style={thStyle}>İşlem</th>
                  </tr></thead>
                  <tbody>
                    {sorted.map((m) => (
                      <tr key={m.id} style={{ borderBottom: `1px solid ${C.borderLight}`, background: selectedIds.has(m.id) ? '#fffbeb' : 'transparent' }} onMouseEnter={(e) => { if (!selectedIds.has(m.id)) e.currentTarget.style.background = '#fafafa'; }} onMouseLeave={(e) => { e.currentTarget.style.background = selectedIds.has(m.id) ? '#fffbeb' : 'transparent'; }}>
                        <td style={{ ...tdStyle, width: '40px' }}><input type="checkbox" checked={selectedIds.has(m.id)} onChange={() => toggleSelect(m.id)} /></td>
                        <td style={{ ...tdStyle, fontWeight: 600, fontSize: '14px' }}><a onClick={(e) => { e.stopPropagation(); navigate(`/karsilastir?orijinal=${m.targetPerfumeId}&muadil=${m.id}`); }} style={{ fontWeight: 600, fontSize: '14px', color: C.navy, cursor: 'pointer', textDecoration: 'none' }}>{m.name}</a></td>
                        <td style={{ ...tdStyle, fontSize: '13px' }}><a onClick={(e) => { e.stopPropagation(); navigate(`/marka/${m.brandSlug}`); }} style={{ fontSize: '13px', color: C.textMid, cursor: 'pointer', textDecoration: 'none' }}>{m.brandName}</a></td>
                        <td style={{ ...tdStyle, fontSize: '13px', color: C.textMid }}>{(() => { const tp = perfumes.find((x) => String(x.id) === String(m.targetPerfumeId)); return tp ? <a onClick={(e) => { e.stopPropagation(); navigate(`/${tp.brandSlug}/${tp.slug}`); }} style={{ fontSize: '13px', color: C.textMid, cursor: 'pointer', textDecoration: 'none' }}>{m.targetBrandName} — {m.targetPerfumeName}</a> : <span>{m.targetBrandName} — {m.targetPerfumeName}</span>; })()}</td>
                        <td style={tdStyle}>{m.overall >= 0 ? <Badge color="gold">{m.overall}/10</Badge> : <span style={{ fontSize: '12px', color: C.textLight }}>—</span>}</td>
                        <td style={{ ...tdStyle, fontSize: '13px', color: C.textMid }}>{m.commentCount}</td>
                        <td style={tdStyle}>
                          {sm ? (
                            <Btn size="sm" variant="navy" style={{ whiteSpace: 'nowrap' }} onClick={() => openIam(m, 'muadil')}>İşlem Yap</Btn>
                          ) : (
                            <div style={{ display: 'flex', gap: '6px' }}>
                              <button onClick={() => openEditMuadil(m)} title="Düzenle" style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '5px 10px', borderRadius: '7px', border: `1px solid ${C.border}`, background: '#fff', color: C.navy, fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: F }}>
                                <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4Z"/></svg>
                                Düzenle
                              </button>
                              <button onClick={() => setDelTarget({ id: m.id, name: m.name, type: 'muadil' })} title="Sil" style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '5px 10px', borderRadius: '7px', border: `1px solid #fecaca`, background: '#fff5f5', color: C.red, fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: F }}>
                                <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                                Sil
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                    {!sorted.length && <tr><td colSpan={7} style={{ ...tdStyle, textAlign: 'center', color: C.textLight, padding: '32px' }}>Sonuç bulunamadı.</td></tr>}
                  </tbody>
                </table>
                </div>
              </Card>
            </div>
          );
        })()}

        {/* Tüm Yorumlar */}
        {tab === 'reviews' && (() => {
          const dateInputStyle = { padding: '9px 12px', border: `1px solid ${C.border}`, borderRadius: '9px', fontSize: '13px', fontFamily: F, color: C.text, background: '#fff', outline: 'none' };
          const q = search.toLowerCase();
          const filtered = revList.filter((r) => !q || (r.userName || '').toLowerCase().includes(q) || (r.text || '').toLowerCase().includes(q));
          const fmtDate = (ts) => ts?.toDate ? ts.toDate().toLocaleString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';
          const muadilName = (r) => {
            const mid = r.muadilId || String(r.muadilPerfumeId ?? '');
            const m = muadilPerfumes.find((x) => String(x.id) === String(mid));
            return m ? `${m.brandName} — ${m.name}` : '—';
          };
          const allSel = filtered.length > 0 && filtered.every((r) => selectedIds.has(r.id));
          return (
            <div>
              {/* Tarih aralığı seçici */}
              <Card style={{ padding: '16px 18px', marginBottom: '14px' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'flex-end' }}>
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: C.navy, marginBottom: '6px' }}>Başlangıç Tarihi</div>
                    <input type="date" value={revRange.start} max={revRange.end} onChange={(e) => setRevRange((s) => ({ ...s, start: e.target.value }))} style={dateInputStyle} />
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: C.navy, marginBottom: '6px' }}>Bitiş Tarihi</div>
                    <input type="date" value={revRange.end} min={revRange.start} max={_today} onChange={(e) => setRevRange((s) => ({ ...s, end: e.target.value }))} style={dateInputStyle} />
                  </div>
                  <Btn variant="primary" onClick={loadReviews} disabled={revLoading}>{revLoading ? 'Getiriliyor…' : 'Yorumları Getir'}</Btn>
                  {revLoaded && !revLoading && <span style={{ fontSize: '12px', color: C.textLight }}>Bu aralıkta {revList.length} yorum bulundu.</span>}
                </div>
                <p style={{ fontSize: '12px', color: C.textLight, marginTop: '12px', lineHeight: 1.5 }}>
                  💡 Sunucuyu yormamak için yalnızca seçtiğiniz tarih aralığındaki yorumlar getirilir. Kapatılmış/silinmiş hesapların yorumları da bu listede görünür ve silinebilir.
                </p>
                {revError && <div style={{ fontSize: '12px', color: C.red, marginTop: '8px' }}>{revError}</div>}
              </Card>

              {revLoaded && (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                    {selectedIds.size > 0 ? (
                      <Btn variant="danger" onClick={() => openRevDel([...selectedIds])}>Seçilenleri Sil ({selectedIds.size})</Btn>
                    ) : <div />}
                  </div>
                  <Card style={{ overflow: 'hidden' }}>
                    <div style={{ padding: '14px 18px', borderBottom: `1px solid ${C.border}` }}><span style={{ fontWeight: 700, color: C.navy }}>Yorumlar</span></div>
                    <SearchBar value={search} onChange={setSearch} placeholder="Kullanıcı adı veya yorum içeriği ara…" count={filtered.length} total={revList.length} />
                    <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                    <table style={{ width: '100%', minWidth: '760px', borderCollapse: 'collapse' }}>
                      <thead><tr style={{ background: '#f9f9fb' }}>
                        <th style={{ ...thBase, width: '40px' }}>
                          <input type="checkbox" checked={allSel} onChange={() => toggleAll(filtered.map((r) => r.id))} />
                        </th>
                        <th style={thBase}>Tarih</th>
                        <th style={thBase}>Kullanıcı</th>
                        <th style={thBase}>Muadil</th>
                        <th style={thBase}>Yorum İçeriği</th>
                        <th style={thBase}>Durum</th>
                        <th style={thStyle}>İşlem</th>
                      </tr></thead>
                      <tbody>
                        {filtered.map((r) => (
                          <tr key={r.id} style={{ borderBottom: `1px solid ${C.borderLight}`, background: selectedIds.has(r.id) ? '#fffbeb' : 'transparent' }} onMouseEnter={(e) => { if (!selectedIds.has(r.id)) e.currentTarget.style.background = '#fafafa'; }} onMouseLeave={(e) => { e.currentTarget.style.background = selectedIds.has(r.id) ? '#fffbeb' : 'transparent'; }}>
                            <td style={{ ...tdStyle, width: '40px' }}><input type="checkbox" checked={selectedIds.has(r.id)} onChange={() => toggleSelect(r.id)} /></td>
                            <td style={{ ...tdStyle, fontSize: '12px', color: C.textMid, whiteSpace: 'nowrap' }}>{fmtDate(r.createdAt)}</td>
                            <td style={{ ...tdStyle, fontSize: '13px', color: C.text, fontWeight: 600, whiteSpace: 'nowrap' }}>{r.userName || '—'}</td>
                            <td style={{ ...tdStyle, fontSize: '12px', color: C.textMid }}>{muadilName(r)}</td>
                            <td style={{ ...tdStyle, fontSize: '13px', color: C.text, maxWidth: '340px', lineHeight: 1.5 }}>{r.text || <span style={{ color: C.textLight }}>—</span>}</td>
                            <td style={tdStyle}><Badge color={r.status === 'approved' ? 'green' : 'orange'}>{r.status === 'approved' ? 'Onaylı' : 'Beklemede'}</Badge></td>
                            <td style={tdStyle}>
                              <button onClick={() => openRevDel([r.id])} title="Sil" style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '5px 10px', borderRadius: '7px', border: `1px solid #fecaca`, background: '#fff5f5', color: C.red, fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: F, whiteSpace: 'nowrap' }}>
                                <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                                Sil
                              </button>
                            </td>
                          </tr>
                        ))}
                        {!filtered.length && <tr><td colSpan={7} style={{ ...tdStyle, textAlign: 'center', color: C.textLight, padding: '32px' }}>{revList.length ? 'Aramayla eşleşen yorum yok.' : 'Bu tarih aralığında yorum bulunamadı.'}</td></tr>}
                      </tbody>
                    </table>
                    </div>
                  </Card>
                </>
              )}
            </div>
          );
        })()}

        {/* Slider */}
        {tab === 'slider' && (
          <SliderTab
            sliderImages={sliderImages}
            addSliderImage={addSliderImage}
            removeSliderImage={removeSliderImage}
            updateSliderImage={updateSliderImage}
            reorderSliderImages={reorderSliderImages}
            MAX_SLIDER={MAX_SLIDER}
            MAX_SIZE_MB={MAX_SIZE_MB}
          />
        )}
        {tab === 'favicon' && (
          <FaviconTab faviconUrl={faviconUrl} updateFavicon={updateFavicon} />
        )}
      </div>

      {/* Kayıt İşlem Modalı (mobil) */}
      <Modal open={iam.open} onClose={closeIam} title={iam.item ? `${iam.item.name} için işlem yap` : ''} width="360px">
        {iam.item && iam.step === 'actions' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {iam.itemType === 'brand' && (
              <Btn variant="secondary" onClick={() => { updateBrand(iam.item.id, { active: !iam.item.active }); closeIam(); }}>
                {iam.item.active ? 'Pasif Et' : 'Aktif Et'}
              </Btn>
            )}
            <Btn variant="navy" onClick={() => {
              if (iam.itemType === 'brand') openEditBrand(iam.item);
              else if (iam.itemType === 'perfume') openEditPerf(iam.item);
              else if (iam.itemType === 'muadil') openEditMuadil(iam.item);
              closeIam();
            }}>Düzenle</Btn>
            <Btn variant="danger" onClick={() => setIam((s) => ({ ...s, step: 'confirm', password: '', error: '' }))}>Sil</Btn>
          </div>
        )}
        {iam.item && iam.step === 'confirm' && (
          <div>
            <div style={{ marginBottom: '16px', padding: '12px 16px', background: '#fff5f5', border: '1px solid #fecaca', borderRadius: '10px', fontSize: '13px', color: C.red, lineHeight: 1.6 }}>
              <strong>"{iam.item.name}"</strong> kalıcı olarak silinecek. Bu işlem geri alınamaz.
            </div>
            <div style={{ marginBottom: '8px', fontSize: '13px', fontWeight: 600, color: C.navy }}>Admin Şifresi</div>
            <input
              type="password"
              value={iam.password}
              onChange={(e) => setIam((s) => ({ ...s, password: e.target.value, error: '' }))}
              onKeyDown={(e) => e.key === 'Enter' && !iam.loading && iam.password && handleIamDelete()}
              placeholder="Şifrenizi girin"
              autoFocus
              style={{ width: '100%', padding: '10px 14px', border: `1px solid ${iam.error ? C.red : C.border}`, borderRadius: '10px', fontSize: '14px', fontFamily: F, outline: 'none', boxSizing: 'border-box', marginBottom: '6px' }}
            />
            {iam.error && <div style={{ fontSize: '12px', color: C.red, marginBottom: '10px' }}>{iam.error}</div>}
            <div style={{ display: 'flex', gap: '10px', marginTop: '16px', justifyContent: 'flex-end' }}>
              <Btn variant="ghost" onClick={() => setIam((s) => ({ ...s, step: 'actions', password: '', error: '' }))} disabled={iam.loading}>Geri</Btn>
              <Btn variant="danger" onClick={handleIamDelete} disabled={!iam.password || iam.loading}>
                {iam.loading ? 'Siliniyor…' : 'Evet, Sil'}
              </Btn>
            </div>
          </div>
        )}
      </Modal>

      {/* Kullanıcı İşlem Modalı (mobil) */}
      <Modal open={uam.open} onClose={closeUam} title={uam.step === 'deleted' ? 'Kullanıcı Silindi' : (uam.user ? `${uam.user.name} için işlem yap` : '')} width="400px">
        {uam.user && uam.step === 'actions' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <Btn variant={uam.user.role === 'moderator' ? 'orange' : 'navy'} onClick={() => openUamConfirm('mod')}>
              {uam.user.role === 'moderator' ? 'Moderatörlüğü Al' : 'Moderatör Yap'}
            </Btn>
            <Btn variant={uam.user.active ? 'danger' : 'success'} onClick={() => openUamConfirm('freeze')}>
              {uam.user.active ? 'Hesabı Dondur' : 'Hesabı Aktif Et'}
            </Btn>
            <Btn variant="danger" onClick={() => openUamConfirm('delete')}>Kullanıcıyı Sil</Btn>
          </div>
        )}
        {uam.user && uam.step === 'confirm' && (
          <div>
            <div style={{ marginBottom: '16px', padding: '12px 16px', background: uam.action === 'delete' ? '#fff5f5' : '#fffbeb', border: `1px solid ${uam.action === 'delete' ? '#fecaca' : '#fde68a'}`, borderRadius: '10px', fontSize: '13px', color: uam.action === 'delete' ? C.red : C.orange, lineHeight: 1.6 }}>
              {uam.action === 'mod' && `${uam.user.name} kullanıcısının moderatör rolü ${uam.user.role === 'moderator' ? 'alınacak' : 'verilecek'}.`}
              {uam.action === 'freeze' && `${uam.user.name} hesabı ${uam.user.active ? 'dondurulacak' : 'aktif edilecek'}.`}
              {uam.action === 'delete' && `${uam.user.name} kalıcı olarak silinecek. Bu işlem geri alınamaz.`}
            </div>
            <div style={{ marginBottom: '8px', fontSize: '13px', fontWeight: 600, color: C.navy }}>Admin Şifresi</div>
            <input
              type="password"
              value={uam.password}
              onChange={(e) => setUam((s) => ({ ...s, password: e.target.value, error: '' }))}
              onKeyDown={(e) => e.key === 'Enter' && !uam.loading && uam.password && handleUamSubmit()}
              placeholder="Şifrenizi girin"
              autoFocus
              style={{ width: '100%', padding: '10px 14px', border: `1px solid ${uam.error ? C.red : C.border}`, borderRadius: '10px', fontSize: '14px', fontFamily: F, outline: 'none', boxSizing: 'border-box', marginBottom: '6px' }}
            />
            {uam.error && <div style={{ fontSize: '12px', color: C.red, marginBottom: '10px' }}>{uam.error}</div>}
            <div style={{ display: 'flex', gap: '10px', marginTop: '16px', justifyContent: 'flex-end' }}>
              <Btn variant={uam.action === 'delete' ? 'danger' : 'primary'} onClick={handleUamSubmit} disabled={!uam.password || uam.loading}>
                {uam.loading ? 'İşleniyor…' : 'Onayla'}
              </Btn>
            </div>
          </div>
        )}
        {uam.step === 'deleted' && (
          <div style={{ textAlign: 'center', padding: '8px 0 4px' }}>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>✅</div>
            <p style={{ fontSize: '15px', fontWeight: 700, color: C.navy, marginBottom: '6px' }}>Kullanıcı silindi</p>
            <p style={{ fontSize: '13px', color: C.textLight, lineHeight: 1.6, marginBottom: '20px' }}>
              Hesap, yorumlar ve tüm veriler başarıyla temizlendi.
            </p>
            <Btn variant="primary" onClick={closeUam} style={{ width: '100%', justifyContent: 'center' }}>Tamam</Btn>
          </div>
        )}
      </Modal>

      {/* Toplu Silme Şifre Modalı */}
      <Modal open={bulkDel.open} onClose={closeBulkDel} title="Toplu Silme Onayı" width="420px">
        <div style={{ marginBottom: '16px', padding: '12px 16px', background: '#fff5f5', border: '1px solid #fecaca', borderRadius: '10px', fontSize: '13px', color: C.red, lineHeight: 1.6 }}>
          <strong>{selectedIds.size} kayıt</strong> kalıcı olarak silinecek. Bu işlem geri alınamaz. Devam etmek için admin şifrenizi girin.
        </div>
        <div style={{ marginBottom: '8px', fontSize: '13px', fontWeight: 600, color: C.navy }}>Admin Şifresi</div>
        <input
          type="password"
          value={bulkDel.password}
          onChange={(e) => setBulkDel((s) => ({ ...s, password: e.target.value, error: '' }))}
          onKeyDown={(e) => e.key === 'Enter' && !bulkDel.loading && handleBulkDelete()}
          placeholder="Şifrenizi girin"
          autoFocus
          style={{ width: '100%', padding: '10px 14px', border: `1px solid ${bulkDel.error ? C.red : C.border}`, borderRadius: '10px', fontSize: '14px', fontFamily: F, outline: 'none', boxSizing: 'border-box', marginBottom: '8px' }}
        />
        {bulkDel.error && <div style={{ fontSize: '12px', color: C.red, marginBottom: '12px' }}>{bulkDel.error}</div>}
        <div style={{ display: 'flex', gap: '10px', marginTop: '16px', justifyContent: 'flex-end' }}>
          <Btn variant="ghost" onClick={closeBulkDel} disabled={bulkDel.loading}>İptal</Btn>
          <Btn variant="danger" onClick={handleBulkDelete} disabled={!bulkDel.password || bulkDel.loading}>
            {bulkDel.loading ? 'Siliniyor…' : `${selectedIds.size} Kaydı Sil`}
          </Btn>
        </div>
      </Modal>

      {/* Yorum Silme Şifre Modalı (tekli + çoklu) */}
      <Modal open={revDel.open} onClose={closeRevDel} title={revDel.ids.length > 1 ? 'Yorumları Sil' : 'Yorumu Sil'} width="420px">
        <div style={{ marginBottom: '16px', padding: '12px 16px', background: '#fff5f5', border: '1px solid #fecaca', borderRadius: '10px', fontSize: '13px', color: C.red, lineHeight: 1.6 }}>
          <strong>{revDel.ids.length} yorum</strong> kalıcı olarak silinecek. Bu işlem geri alınamaz. Devam etmek için admin şifrenizi girin.
        </div>
        <div style={{ marginBottom: '8px', fontSize: '13px', fontWeight: 600, color: C.navy }}>Admin Şifresi</div>
        <input
          type="password"
          value={revDel.password}
          onChange={(e) => setRevDel((s) => ({ ...s, password: e.target.value, error: '' }))}
          onKeyDown={(e) => e.key === 'Enter' && !revDel.loading && revDel.password && handleRevDelete()}
          placeholder="Şifrenizi girin"
          autoFocus
          style={{ width: '100%', padding: '10px 14px', border: `1px solid ${revDel.error ? C.red : C.border}`, borderRadius: '10px', fontSize: '14px', fontFamily: F, outline: 'none', boxSizing: 'border-box', marginBottom: '8px' }}
        />
        {revDel.error && <div style={{ fontSize: '12px', color: C.red, marginBottom: '12px' }}>{revDel.error}</div>}
        <div style={{ display: 'flex', gap: '10px', marginTop: '16px', justifyContent: 'flex-end' }}>
          <Btn variant="ghost" onClick={closeRevDel} disabled={revDel.loading}>İptal</Btn>
          <Btn variant="danger" onClick={handleRevDelete} disabled={!revDel.password || revDel.loading}>
            {revDel.loading ? 'Siliniyor…' : `${revDel.ids.length} Yorumu Sil`}
          </Btn>
        </div>
      </Modal>

      {/* Kullanıcı Detay Modal */}
      <Modal open={!!selUser} onClose={() => setSelUser(null)} title={`Kullanıcı: ${selUser?.name}`} width="580px">
        {selUser && (() => {
          const uc = comments.filter((c) => c.userId === selUser.id);
          return (
            <>
              <div style={{ display: 'flex', gap: '14px', alignItems: 'center', padding: '14px', background: C.goldBg, borderRadius: '12px', border: `1px solid ${C.goldBorder}`, marginBottom: '18px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: `linear-gradient(135deg,${C.gold},${C.goldLight})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', color: '#fff', fontWeight: 700, flexShrink: 0, overflow: 'hidden' }}>
                  {(selUser.photoURL || (selUser.avatar?.startsWith?.('http') ? selUser.avatar : null))
                    ? <img src={selUser.photoURL || selUser.avatar} alt={selUser.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                    : (selUser.avatar?.length === 1 ? selUser.avatar : selUser.name?.[0]?.toUpperCase() || '?')
                  }
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: '16px', color: C.navy }}>{selUser.name}</div>
                  <div style={{ fontSize: '13px', color: C.textMid }}>{selUser.email}</div>
                  <div style={{ display: 'flex', gap: '8px', marginTop: '6px', flexWrap: 'wrap' }}>
                    <Badge color={RC[selUser.role]}>{RL[selUser.role]}</Badge>
                    <Badge color={selUser.role === 'admin' || selUser.active ? 'green' : 'red'}>{selUser.role === 'admin' || selUser.active ? 'Aktif' : 'Dondurulmuş'}</Badge>
                  </div>
                </div>
              </div>
              <div style={{ marginBottom: '18px' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: C.navy, marginBottom: '10px', letterSpacing: '.05em' }}>OTURUM BİLGİLERİ</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  {[['Son Giriş', '—'], ['Son Çıkış', '—'], ['Katılım Tarihi', selUser.createdAt?.toDate?.()?.toLocaleDateString('tr-TR') || '—'], ['Toplam Yorum', uc.length]].map(([k, v]) => (
                    <div key={k} style={{ background: '#f9f9fb', borderRadius: '10px', padding: '10px 14px', border: `1px solid ${C.border}` }}>
                      <div style={{ fontSize: '11px', color: C.textLight, marginBottom: '3px', textTransform: 'uppercase', letterSpacing: '.05em' }}>{k}</div>
                      <div style={{ fontSize: '14px', fontWeight: 600, color: C.text }}>{v}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: C.navy, marginBottom: '10px', letterSpacing: '.05em' }}>YORUMLARI ({uc.length})</div>
                {!uc.length && <div style={{ textAlign: 'center', padding: '20px', color: C.textLight, fontSize: '14px', background: '#f9f9fb', borderRadius: '10px' }}>Henüz yorum yapmamış.</div>}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '220px', overflow: 'auto' }}>
                  {uc.map((c) => {
                    const mp = muadilPerfumes.find((m) => m.id === c.muadilPerfumeId);
                    return (
                      <div key={c.id} style={{ border: `1px solid ${c.status === 'pending' ? C.goldBorder : C.border}`, borderRadius: '10px', padding: '12px 14px', background: c.status === 'pending' ? C.goldBg : '#fff' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px', flexWrap: 'wrap', gap: '6px' }}>
                          <span style={{ fontWeight: 600, fontSize: '13px', color: C.navy }}>{mp ? `${mp.brandName} — ${mp.name}` : 'Parfüm'}</span>
                          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                            <Badge color={c.status === 'approved' ? 'green' : 'orange'}>{c.status === 'approved' ? 'Yayında' : 'Bekliyor'}</Badge>
                            <span style={{ fontSize: '11px', color: C.textLight }}>{c.date}</span>
                          </div>
                        </div>
                        <p style={{ fontSize: '13px', color: C.text, lineHeight: 1.5 }}>{c.text}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          );
        })()}
      </Modal>

      {/* Marka Modal */}
      <Modal open={showBM} onClose={() => setShowBM(false)} title={`Yeni ${bf.type === 'original' ? 'Orijinal' : 'Muadil'} Marka Ekle`} width="540px">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <Input label="Marka Adı *" value={bf.name} onChange={(e) => setBf({ ...bf, name: e.target.value })} />
          <Input label="Slug" value={bf.slug} onChange={(e) => setBf({ ...bf, slug: e.target.value })} />
          <Input label="Logo Kısaltma" value={bf.logo} onChange={(e) => setBf({ ...bf, logo: e.target.value })} />
          <Input label="Köken" value={bf.origin} onChange={(e) => setBf({ ...bf, origin: e.target.value })} />
          <Input label="Kuruluş Yılı" type="number" value={bf.founded} onChange={(e) => setBf({ ...bf, founded: e.target.value })} />
        </div>
        {bf.type === 'original' && (
          <div style={{ marginTop: '8px' }}>
            <div style={{ fontSize: '12px', fontWeight: 600, color: C.textMid, marginBottom: '8px' }}>Parfüm Kategorisi</div>
            <div style={{ display: 'flex', gap: '10px' }}>
              {['Designer', 'Niche'].map((cat) => (
                <label key={cat} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', border: `1px solid ${bf.category === cat ? C.navy : C.border}`, borderRadius: '10px', background: bf.category === cat ? '#f0f0f8' : '#fafafa', cursor: 'pointer', fontSize: '13px', fontWeight: 600, color: bf.category === cat ? C.navy : C.textMid, transition: 'all .15s' }}>
                  <input type="radio" name="bf-category" value={cat} checked={bf.category === cat} onChange={() => setBf({ ...bf, category: cat })} style={{ accentColor: C.navy }} />
                  {cat}
                </label>
              ))}
            </div>
          </div>
        )}
        <div style={{ marginTop: '4px' }}>
          <div style={{ fontSize: '12px', fontWeight: 600, color: C.textMid, marginBottom: '6px' }}>Logo Görseli</div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div
              onClick={() => document.getElementById('brand-logo-add').click()}
              style={{ width: '64px', height: '64px', borderRadius: '50%', border: `2px dashed ${bf.logoImage ? C.gold : C.border}`, background: bf.logoImage ? '#fff' : '#fafafa', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', overflow: 'hidden', flexShrink: 0 }}>
              {bf.logoImage
                ? <img src={bf.logoImage} alt="logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <span style={{ fontSize: '22px' }}>🖼️</span>}
            </div>
            <input id="brand-logo-add" type="file" accept="image/jpeg,image/png,image/webp" style={{ display: 'none' }}
              onChange={(e) => {
                const file = e.target.files[0];
                e.target.value = '';
                if (!file) return;
                if (!file.type.startsWith('image/')) { setBf((s) => ({ ...s, _logoErr: 'Sadece JPG, PNG veya WebP yüklenebilir.' })); return; }
                if (file.size > 2 * 1024 * 1024) { setBf((s) => ({ ...s, _logoErr: `Dosya boyutu 2MB sınırını aşıyor (${(file.size / 1024 / 1024).toFixed(1)}MB).` })); return; }
                setBf((s) => ({ ...s, _logoErr: '' }));
                const reader = new FileReader();
                reader.onload = (ev) => setBrandCropModal({ open: true, src: ev.target.result, target: 'add' });
                reader.readAsDataURL(file);
              }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '12px', color: C.textMid, lineHeight: 1.5 }}>JPG, PNG veya WebP · Maks. 2MB<br />Görsel yoksa kısaltma metin olarak gösterilir.</div>
              {bf._logoErr && <div style={{ marginTop: '6px', fontSize: '12px', color: C.red, background: '#fff5f5', border: '1px solid #fecaca', borderRadius: '6px', padding: '5px 10px' }}>{bf._logoErr}</div>}
              {bf.logoImage && <button onClick={() => setBf((s) => ({ ...s, logoImage: '', _logoErr: '' }))} style={{ marginTop: '6px', fontSize: '12px', color: C.red, background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: F }}>Görseli kaldır</button>}
            </div>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '4px' }}>
          <Input label="Web Sitesi" placeholder="https://marka.com" value={bf.website} onChange={(e) => setBf({ ...bf, website: e.target.value })} />
          <Input label="Instagram" placeholder="https://instagram.com/..." value={bf.instagram} onChange={(e) => setBf({ ...bf, instagram: e.target.value })} />
        </div>
        <Textarea label="Açıklama" value={bf.bio} onChange={(e) => setBf({ ...bf, bio: e.target.value })} rows={3} />
        {brandErr && <div style={{ marginBottom: '10px', padding: '8px 12px', background: '#fff5f5', border: '1px solid #fecaca', borderRadius: '8px', fontSize: '13px', color: C.red }}>{brandErr}</div>}
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}><Btn variant="secondary" onClick={() => { setShowBM(false); setBrandErr(''); }}>İptal</Btn><Btn onClick={sbrand} disabled={!bf.name}>Ekle</Btn></div>
      </Modal>

      {/* Parfüm Modal */}
      <Modal open={showPM} onClose={() => setShowPM(false)} title="Yeni Parfüm Ekle" width="560px">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <Input label="Parfüm Adı *" value={pf.name} onChange={(e) => setPf({ ...pf, name: e.target.value })} placeholder="Sauvage" />
          <Select label="Marka *" value={pf.brandId} onChange={(e) => setPf({ ...pf, brandId: e.target.value })} options={[{ value: '', label: 'Marka seçin' }, ...brands.filter((b) => b.type === 'original').map((b) => ({ value: String(b.id), label: b.name }))]} />
          <Select label="Cinsiyet" value={pf.gender} onChange={(e) => setPf({ ...pf, gender: e.target.value })} options={['Erkek', 'Kadın', 'Unisex'].map((g) => ({ value: g, label: g }))} />
          <Input label="Çıkış Yılı" type="number" value={pf.year} onChange={(e) => setPf({ ...pf, year: e.target.value })} placeholder="2015" />
        </div>
        <Input label="Üst Notalar (virgülle)" value={pf.topNotes} onChange={(e) => setPf({ ...pf, topNotes: e.target.value })} placeholder="Bergamot, Biber" />
        <Input label="Kalp Notaları" value={pf.heartNotes} onChange={(e) => setPf({ ...pf, heartNotes: e.target.value })} placeholder="Lavanta, Sedir" />
        <Input label="Dip Notalar" value={pf.baseNotes} onChange={(e) => setPf({ ...pf, baseNotes: e.target.value })} placeholder="Amber, Misk" />
        <Textarea label="Açıklama" value={pf.description} onChange={(e) => setPf({ ...pf, description: e.target.value })} rows={2} />
        <PerfumeImageSlots images={pf.images} onChange={(imgs) => setPf({ ...pf, images: imgs })} />
        {perfErr && <div style={{ marginTop: '10px', padding: '8px 12px', background: '#fff5f5', border: '1px solid #fecaca', borderRadius: '8px', fontSize: '13px', color: C.red }}>{perfErr}</div>}
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '24px' }}><Btn variant="secondary" onClick={() => { setShowPM(false); setPerfErr(''); }}>İptal</Btn><Btn onClick={sperf} disabled={!pf.name || !pf.brandId}>Ekle</Btn></div>
      </Modal>

      {/* Muadil Modal */}
      <Modal open={showMM} onClose={() => setShowMM(false)} title="Muadil Parfüm Ekle" width="540px">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <Select label="Muadil Marka *" value={mf.brandId} onChange={(e) => setMf({ ...mf, brandId: e.target.value })} options={[{ value: '', label: 'Marka seçin' }, ...brands.filter((b) => b.type === 'muadil').map((b) => ({ value: String(b.id), label: b.name }))]} />
          <Select label="Hedef Orijinal *" value={mf.targetPerfumeId} onChange={(e) => {
            const p = perfumes.find((x) => String(x.id) === e.target.value);
            setMf({ ...mf, targetPerfumeId: e.target.value, name: p ? `${p.name} Benzeri` : '', gender: p?.gender || '' });
          }} options={[{ value: '', label: 'Parfüm seçin' }, ...perfumes.map((p) => ({ value: String(p.id), label: `${p.brandName} — ${p.name}` }))]} />
        </div>
        {mf.gender && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', background: '#f8f9fb', border: `1px solid ${C.border}`, borderRadius: '8px', fontSize: '13px', color: C.textMid }}>
            <span style={{ fontWeight: 600, color: C.textLight, letterSpacing: '.03em', textTransform: 'uppercase', fontSize: '11px' }}>Cinsiyet</span>
            <span style={{ fontWeight: 700, color: C.navy }}>{mf.gender}</span>
            <span style={{ marginLeft: 'auto', fontSize: '11px', color: C.textLight }}>Hedef parfümden alındı</span>
          </div>
        )}
        {mf.name && (
          <div style={{ marginTop: '2px', padding: '8px 12px', background: C.goldBg, border: `1px solid ${C.goldBorder}`, borderRadius: '8px', fontSize: '13px', color: C.navy, fontWeight: 600 }}>
            Muadil adı: <span style={{ color: C.gold }}>{mf.name}</span>
          </div>
        )}
        <Textarea label="Açıklama" value={mf.description} onChange={(e) => setMf({ ...mf, description: e.target.value })} rows={3} />
        <PerfumeImageSlots images={mf.images} onChange={(imgs) => setMf({ ...mf, images: imgs })} />
        {muadilErr && <div style={{ marginTop: '10px', padding: '8px 12px', background: '#fff5f5', border: '1px solid #fecaca', borderRadius: '8px', fontSize: '13px', color: C.red }}>{muadilErr}</div>}
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '24px' }}><Btn variant="secondary" onClick={() => { setShowMM(false); setMuadilErr(''); }}>İptal</Btn><Btn onClick={smuadil} disabled={!mf.name || !mf.brandId || !mf.targetPerfumeId}>Ekle</Btn></div>
      </Modal>

      {/* Orijinal Parfüm Düzenle Modal */}
      <Modal open={!!selPerf} onClose={() => { setSelPerf(null); setEf(null); }} title={`Parfüm Düzenle: ${selPerf?.name}`} width="560px">
        {ef && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <Input label="Parfüm Adı *" value={ef.name} onChange={(e) => setEf({ ...ef, name: e.target.value })} />
              <Input label="Slug" value={ef.slug} onChange={(e) => setEf({ ...ef, slug: e.target.value })} />
              <Select label="Marka *" value={ef.brandId} onChange={(e) => setEf({ ...ef, brandId: e.target.value })} options={[{ value: '', label: 'Marka seçin' }, ...brands.filter((b) => b.type === 'original').map((b) => ({ value: String(b.id), label: b.name }))]} />
              <Select label="Cinsiyet" value={ef.gender} onChange={(e) => setEf({ ...ef, gender: e.target.value })} options={['Erkek', 'Kadın', 'Unisex'].map((g) => ({ value: g, label: g }))} />
              <Input label="Çıkış Yılı" type="number" value={ef.year} onChange={(e) => setEf({ ...ef, year: e.target.value })} />
            </div>
            <Input label="Üst Notalar (virgülle)" value={ef.topNotes} onChange={(e) => setEf({ ...ef, topNotes: e.target.value })} />
            <Input label="Kalp Notaları" value={ef.heartNotes} onChange={(e) => setEf({ ...ef, heartNotes: e.target.value })} />
            <Input label="Dip Notalar" value={ef.baseNotes} onChange={(e) => setEf({ ...ef, baseNotes: e.target.value })} />
            <Textarea label="Açıklama" value={ef.description} onChange={(e) => setEf({ ...ef, description: e.target.value })} rows={2} />
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'space-between' }}>
              <Btn variant="danger" onClick={() => { setDelTarget({ id: selPerf.id, name: selPerf.name, type: 'perfume' }); setSelPerf(null); setEf(null); }}>Sil</Btn>
              <div style={{ display: 'flex', gap: '8px' }}>
                <Btn variant="secondary" onClick={() => { setSelPerf(null); setEf(null); }}>İptal</Btn>
                <Btn onClick={savePerf} disabled={!ef.name || !ef.brandId}>Kaydet</Btn>
              </div>
            </div>
          </>
        )}
      </Modal>

      {/* Muadil Parfüm Düzenle Modal */}
      <Modal open={!!selMuadil} onClose={() => { setSelMuadil(null); setEmf(null); }} title={`Muadil Düzenle: ${selMuadil?.name}`} width="540px">
        {emf && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <Input label="Muadil Adı *" value={emf.name} onChange={(e) => setEmf({ ...emf, name: e.target.value })} />
              <Input label="Slug" value={emf.slug} onChange={(e) => setEmf({ ...emf, slug: e.target.value })} />
              <Select label="Muadil Marka *" value={emf.brandId} onChange={(e) => setEmf({ ...emf, brandId: e.target.value })} options={[{ value: '', label: 'Marka seçin' }, ...brands.filter((b) => b.type === 'muadil').map((b) => ({ value: String(b.id), label: b.name }))]} />
              <Select label="Hedef Orijinal *" value={emf.targetPerfumeId} onChange={(e) => {
                const p = perfumes.find((x) => String(x.id) === e.target.value);
                setEmf({ ...emf, targetPerfumeId: e.target.value, gender: p?.gender || emf.gender || '' });
              }} options={[{ value: '', label: 'Parfüm seçin' }, ...perfumes.map((p) => ({ value: String(p.id), label: `${p.brandName} — ${p.name}` }))]} />
            </div>
            {emf.gender && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', background: '#f8f9fb', border: `1px solid ${C.border}`, borderRadius: '8px', fontSize: '13px', color: C.textMid }}>
                <span style={{ fontWeight: 600, color: C.textLight, letterSpacing: '.03em', textTransform: 'uppercase', fontSize: '11px' }}>Cinsiyet</span>
                <span style={{ fontWeight: 700, color: C.navy }}>{emf.gender}</span>
                <span style={{ marginLeft: 'auto', fontSize: '11px', color: C.textLight }}>Hedef parfümden alındı</span>
              </div>
            )}
            <Textarea label="Açıklama" value={emf.description} onChange={(e) => setEmf({ ...emf, description: e.target.value })} rows={3} />
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'space-between' }}>
              <Btn variant="danger" onClick={() => { setDelTarget({ id: selMuadil.id, name: selMuadil.name, type: 'muadil' }); setSelMuadil(null); setEmf(null); }}>Sil</Btn>
              <div style={{ display: 'flex', gap: '8px' }}>
                <Btn variant="secondary" onClick={() => { setSelMuadil(null); setEmf(null); }}>İptal</Btn>
                <Btn onClick={saveMuadil} disabled={!emf.name || !emf.brandId || !emf.targetPerfumeId}>Kaydet</Btn>
              </div>
            </div>
          </>
        )}
      </Modal>
      {/* Marka Düzenle Modal */}
      <Modal open={!!selBrand} onClose={() => { setSelBrand(null); setEbf(null); }} title={`Marka Düzenle: ${selBrand?.name}`} width="540px">
        {ebf && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <Input label="Marka Adı *" value={ebf.name} onChange={(e) => setEbf({ ...ebf, name: e.target.value })} />
              <Input label="Slug" value={ebf.slug} onChange={(e) => setEbf({ ...ebf, slug: e.target.value })} />
              <Select label="Tür" value={ebf.type} onChange={(e) => setEbf({ ...ebf, type: e.target.value })} options={[{ value: 'original', label: 'Orijinal' }, { value: 'muadil', label: 'Muadil' }]} />
              <Input label="Logo Kısaltma" value={ebf.logo} onChange={(e) => setEbf({ ...ebf, logo: e.target.value })} />
              <Input label="Köken" value={ebf.origin} onChange={(e) => setEbf({ ...ebf, origin: e.target.value })} />
              <Input label="Kuruluş Yılı" type="number" value={ebf.founded} onChange={(e) => setEbf({ ...ebf, founded: e.target.value })} />
            </div>
            {ebf.type === 'original' && (
              <div style={{ marginTop: '8px' }}>
                <div style={{ fontSize: '12px', fontWeight: 600, color: C.textMid, marginBottom: '8px' }}>Parfüm Kategorisi</div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  {['Designer', 'Niche'].map((cat) => (
                    <label key={cat} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', border: `1px solid ${ebf.category === cat ? C.navy : C.border}`, borderRadius: '10px', background: ebf.category === cat ? '#f0f0f8' : '#fafafa', cursor: 'pointer', fontSize: '13px', fontWeight: 600, color: ebf.category === cat ? C.navy : C.textMid, transition: 'all .15s' }}>
                      <input type="radio" name="ebf-category" value={cat} checked={ebf.category === cat} onChange={() => setEbf({ ...ebf, category: cat })} style={{ accentColor: C.navy }} />
                      {cat}
                    </label>
                  ))}
                </div>
              </div>
            )}
            <div style={{ marginTop: '4px' }}>
              <div style={{ fontSize: '12px', fontWeight: 600, color: C.textMid, marginBottom: '6px' }}>Logo Görseli</div>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <div
                  onClick={() => document.getElementById('brand-logo-edit').click()}
                  style={{ width: '64px', height: '64px', borderRadius: '12px', border: `2px dashed ${ebf.logoImage ? C.gold : C.border}`, background: ebf.logoImage ? '#fff' : '#fafafa', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', overflow: 'hidden', flexShrink: 0 }}>
                  {ebf.logoImage
                    ? <img src={ebf.logoImage} alt="logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <span style={{ fontSize: '22px' }}>🖼️</span>}
                </div>
                <input id="brand-logo-edit" type="file" accept="image/jpeg,image/png,image/webp" style={{ display: 'none' }}
                  onChange={(e) => {
                    const file = e.target.files[0];
                    e.target.value = '';
                    if (!file) return;
                    if (!file.type.startsWith('image/')) { setEbf((s) => ({ ...s, _logoErr: 'Sadece JPG, PNG veya WebP yüklenebilir.' })); return; }
                    if (file.size > 2 * 1024 * 1024) { setEbf((s) => ({ ...s, _logoErr: `Dosya boyutu 2MB sınırını aşıyor (${(file.size / 1024 / 1024).toFixed(1)}MB).` })); return; }
                    setEbf((s) => ({ ...s, _logoErr: '' }));
                    const reader = new FileReader();
                    reader.onload = (ev) => setBrandCropModal({ open: true, src: ev.target.result, target: 'edit' });
                    reader.readAsDataURL(file);
                  }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '12px', color: C.textMid, lineHeight: 1.5 }}>JPG, PNG veya WebP · Maks. 2MB<br />Görsel yoksa kısaltma metin olarak gösterilir.</div>
                  {ebf._logoErr && <div style={{ marginTop: '6px', fontSize: '12px', color: C.red, background: '#fff5f5', border: '1px solid #fecaca', borderRadius: '6px', padding: '5px 10px' }}>{ebf._logoErr}</div>}
                  {ebf.logoImage && <button onClick={() => setEbf((s) => ({ ...s, logoImage: '', _logoErr: '' }))} style={{ marginTop: '6px', fontSize: '12px', color: C.red, background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: F }}>Görseli kaldır</button>}
                </div>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '4px' }}>
              <Input label="Web Sitesi" placeholder="https://marka.com" value={ebf.website} onChange={(e) => setEbf({ ...ebf, website: e.target.value })} />
              <Input label="Instagram" placeholder="https://instagram.com/..." value={ebf.instagram} onChange={(e) => setEbf({ ...ebf, instagram: e.target.value })} />
            </div>
            <Textarea label="Açıklama" value={ebf.bio} onChange={(e) => setEbf({ ...ebf, bio: e.target.value })} rows={3} />
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'space-between' }}>
              <Btn variant="danger" onClick={() => { setDelTarget({ id: selBrand.id, name: selBrand.name, type: 'brand', brandType: selBrand.type }); setSelBrand(null); setEbf(null); }}>Sil</Btn>
              <div style={{ display: 'flex', gap: '8px' }}>
                <Btn variant="secondary" onClick={() => { setSelBrand(null); setEbf(null); }}>İptal</Btn>
                <Btn onClick={saveBrand} disabled={!ebf.name}>Kaydet</Btn>
              </div>
            </div>
          </>
        )}
      </Modal>

      {brandCropModal.open && (
        <ImageCropModal
          src={brandCropModal.src}
          aspect={1}
          outputW={300}
          outputH={300}
          title="Logo Görselini Kırp"
          onConfirm={handleBrandCropConfirm}
          onCancel={() => setBrandCropModal({ open: false, src: '', target: null })}
        />
      )}

      {/* Silme Onay Modal */}
      <Modal open={!!delTarget} onClose={() => { setDelTarget(null); setDelBrandPw({ password: '', loading: false, error: '' }); }} title="Silme Onayı" width="400px">
        {delTarget && (
          <div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ width: '52px', height: '52px', borderRadius: '50%', background: '#fff5f5', border: '1px solid #fecaca', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px' }}>
                <svg width="24" height="24" fill="none" stroke={C.red} strokeWidth="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
              </div>
              <div style={{ fontSize: '16px', fontWeight: 700, color: C.navy, marginBottom: '6px', textAlign: 'center' }}>Emin misiniz?</div>
              <div style={{ fontSize: '14px', color: C.textMid, textAlign: 'center' }}>
                <span style={{ fontWeight: 600, color: C.text }}>"{delTarget.name}"</span> kalıcı olarak silinecek. Bu işlem geri alınamaz.
              </div>
            </div>
            {delTarget.type === 'brand' ? (
              <>
                <div style={{ marginBottom: '8px', fontSize: '13px', fontWeight: 600, color: C.navy }}>Admin Şifresi</div>
                <input
                  type="password"
                  value={delBrandPw.password}
                  onChange={(e) => setDelBrandPw((s) => ({ ...s, password: e.target.value, error: '' }))}
                  onKeyDown={async (e) => {
                    if (e.key !== 'Enter' || delBrandPw.loading || !delBrandPw.password) return;
                    setDelBrandPw((s) => ({ ...s, loading: true, error: '' }));
                    try { await reauthenticate(delBrandPw.password); } catch { setDelBrandPw((s) => ({ ...s, loading: false, error: 'Şifre hatalı. Lütfen tekrar deneyin.' })); return; }
                    await deleteBrand(delTarget.id, delTarget.brandType);
                    setSelectedIds((prev) => { const n = new Set(prev); n.delete(delTarget.id); return n; });
                    setDelTarget(null); setDelBrandPw({ password: '', loading: false, error: '' });
                  }}
                  placeholder="Şifrenizi girin"
                  autoFocus
                  style={{ width: '100%', padding: '10px 14px', border: `1px solid ${delBrandPw.error ? C.red : C.border}`, borderRadius: '10px', fontSize: '14px', fontFamily: F, outline: 'none', boxSizing: 'border-box', marginBottom: '6px' }}
                />
                {delBrandPw.error && <div style={{ fontSize: '12px', color: C.red, marginBottom: '10px' }}>{delBrandPw.error}</div>}
                <div style={{ display: 'flex', gap: '10px', marginTop: '16px', justifyContent: 'flex-end' }}>
                  <Btn variant="secondary" onClick={() => { setDelTarget(null); setDelBrandPw({ password: '', loading: false, error: '' }); }} disabled={delBrandPw.loading}>Vazgeç</Btn>
                  <Btn variant="danger" disabled={!delBrandPw.password || delBrandPw.loading} onClick={async () => {
                    setDelBrandPw((s) => ({ ...s, loading: true, error: '' }));
                    try { await reauthenticate(delBrandPw.password); } catch { setDelBrandPw((s) => ({ ...s, loading: false, error: 'Şifre hatalı. Lütfen tekrar deneyin.' })); return; }
                    await deleteBrand(delTarget.id, delTarget.brandType);
                    setSelectedIds((prev) => { const n = new Set(prev); n.delete(delTarget.id); return n; });
                    setDelTarget(null); setDelBrandPw({ password: '', loading: false, error: '' });
                  }}>{delBrandPw.loading ? 'Siliniyor…' : 'Evet, Sil'}</Btn>
                </div>
              </>
            ) : (
              <>
                <div style={{ marginBottom: '8px', fontSize: '13px', fontWeight: 600, color: C.navy }}>Admin Şifresi</div>
                <input
                  type="password"
                  value={delBrandPw.password}
                  onChange={(e) => setDelBrandPw((s) => ({ ...s, password: e.target.value, error: '' }))}
                  onKeyDown={async (e) => {
                    if (e.key !== 'Enter' || delBrandPw.loading || !delBrandPw.password) return;
                    setDelBrandPw((s) => ({ ...s, loading: true, error: '' }));
                    try { await reauthenticate(delBrandPw.password); } catch { setDelBrandPw((s) => ({ ...s, loading: false, error: 'Şifre hatalı. Lütfen tekrar deneyin.' })); return; }
                    if (delTarget.type === 'perfume') await deletePerfume(delTarget.id);
                    else if (delTarget.type === 'muadil') await deleteMuadil(delTarget.id);
                    setSelectedIds((prev) => { const n = new Set(prev); n.delete(delTarget.id); return n; });
                    setDelTarget(null); setDelBrandPw({ password: '', loading: false, error: '' });
                  }}
                  placeholder="Şifrenizi girin"
                  autoFocus
                  style={{ width: '100%', padding: '10px 14px', border: `1px solid ${delBrandPw.error ? C.red : C.border}`, borderRadius: '10px', fontSize: '14px', fontFamily: F, outline: 'none', boxSizing: 'border-box', marginBottom: '6px' }}
                />
                {delBrandPw.error && <div style={{ fontSize: '12px', color: C.red, marginBottom: '10px' }}>{delBrandPw.error}</div>}
                <div style={{ display: 'flex', gap: '10px', marginTop: '16px', justifyContent: 'flex-end' }}>
                  <Btn variant="secondary" onClick={() => { setDelTarget(null); setDelBrandPw({ password: '', loading: false, error: '' }); }} disabled={delBrandPw.loading}>Vazgeç</Btn>
                  <Btn variant="danger" disabled={!delBrandPw.password || delBrandPw.loading} onClick={async () => {
                    setDelBrandPw((s) => ({ ...s, loading: true, error: '' }));
                    try { await reauthenticate(delBrandPw.password); } catch { setDelBrandPw((s) => ({ ...s, loading: false, error: 'Şifre hatalı. Lütfen tekrar deneyin.' })); return; }
                    if (delTarget.type === 'perfume') await deletePerfume(delTarget.id);
                    else if (delTarget.type === 'muadil') await deleteMuadil(delTarget.id);
                    setSelectedIds((prev) => { const n = new Set(prev); n.delete(delTarget.id); return n; });
                    setDelTarget(null); setDelBrandPw({ password: '', loading: false, error: '' });
                  }}>{delBrandPw.loading ? 'Siliniyor…' : 'Evet, Sil'}</Btn>
                </div>
              </>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
