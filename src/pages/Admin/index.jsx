import { useState, useMemo, useRef, useEffect } from 'react';
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
import { db } from '@/lib/firebase';
import { ActivityTab } from './ActivityTab';
import { collection, query, where, getDocs, writeBatch, doc } from 'firebase/firestore';
import { useSeo } from '@/lib/seo';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUsers, faFlask, faStar, faCommentDots, faGauge, faBuilding, faSprayCan, faImages, faImage, faCodeMerge, faClockRotateLeft, faComments, faChevronUp, faChevronDown } from '@fortawesome/free-solid-svg-icons';
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

function SearchBar({ value, onChange, placeholder, count, total, deferred = false }) {
  const [local, setLocal] = useState(value);
  const debounceRef = useRef(null);

  useEffect(() => { if (value === '') setLocal(''); }, [value]);

  if (!deferred) {
    const handleChange = (v) => {
      setLocal(v);
      clearTimeout(debounceRef.current);
      if (!v) { onChange(''); return; }
      debounceRef.current = setTimeout(() => onChange(v), 250);
    };
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', borderBottom: `1px solid ${C.border}`, background: '#fafafa' }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: '340px' }}>
          <svg style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: C.textLight }} width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          <input value={local} onChange={(e) => handleChange(e.target.value)} placeholder={placeholder} style={{ width: '100%', paddingLeft: '32px', paddingRight: local ? '60px' : '10px', height: '34px', border: `1px solid ${C.border}`, borderRadius: '8px', fontSize: '13px', color: C.text, background: '#fff', outline: 'none', fontFamily: F, boxSizing: 'border-box' }} />
          {local && (
            <button onClick={() => handleChange('')} style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', fontSize: '11px', color: C.textLight, background: 'none', border: 'none', cursor: 'pointer', fontFamily: F, padding: '2px 6px', borderRadius: '4px' }}>Temizle</button>
          )}
        </div>
        <span style={{ fontSize: '12px', color: C.textLight, marginLeft: 'auto', whiteSpace: 'nowrap' }}>{count} / {total} kayıt</span>
      </div>
    );
  }

  const commit = () => onChange(local.trim());
  const clear  = () => { setLocal(''); onChange(''); };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', borderBottom: `1px solid ${C.border}`, background: '#fafafa' }}>
      <div style={{ position: 'relative', flex: 1, maxWidth: '340px' }}>
        <svg style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: C.textLight }} width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
        <input
          value={local}
          onChange={(e) => setLocal(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') commit(); }}
          placeholder={placeholder}
          style={{ width: '100%', paddingLeft: '32px', paddingRight: local ? '60px' : '10px', height: '34px', border: `1px solid ${C.border}`, borderRadius: '8px', fontSize: '13px', color: C.text, background: '#fff', outline: 'none', fontFamily: F, boxSizing: 'border-box' }}
        />
        {local && (
          <button onClick={clear} style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', fontSize: '11px', color: C.textLight, background: 'none', border: 'none', cursor: 'pointer', fontFamily: F, padding: '2px 6px', borderRadius: '4px' }}>Temizle</button>
        )}
      </div>
      <button
        onClick={commit}
        style={{ height: '34px', padding: '0 16px', background: C.navy, color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 600, fontFamily: F, cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}
      >
        Ara
      </button>
      <span style={{ fontSize: '12px', color: C.textLight, marginLeft: 'auto', whiteSpace: 'nowrap' }}>{count} / {total} kayıt</span>
    </div>
  );
}

function CopyBtn({ text, title = 'Kopyala', variant = 'default' }) {
  const [copied, setCopied] = useState(false);
  const colors = variant === 'brand'
    ? { border: '#bfdbfe', bg: '#eff6ff', color: '#3b82f6', copiedBorder: '#86efac', copiedBg: '#f0fdf4', copiedColor: '#16a34a' }
    : { border: '#e5e7eb', bg: '#fafafa', color: '#9ca3af', copiedBorder: '#86efac', copiedBg: '#f0fdf4', copiedColor: '#16a34a' };
  return (
    <button
      title={title}
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '28px', borderRadius: '6px', border: `1px solid ${copied ? colors.copiedBorder : colors.border}`, background: copied ? colors.copiedBg : colors.bg, color: copied ? colors.copiedColor : colors.color, cursor: 'pointer', transition: 'all .15s', flexShrink: 0 }}
    >
      {copied
        ? <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
        : <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
      }
    </button>
  );
}

const TABS = [
  { k: 'dashboard',       l: 'Genel Bakış',       icon: faGauge },
  { k: 'users',           l: 'Kullanıcılar',       icon: faUsers },
  { k: 'original-brands', l: 'Orijinal Markalar',  icon: faBuilding },
  { k: 'muadil-brands',   l: 'Muadil Markalar',    icon: faFlask },
  { k: 'perfumes',        l: 'Orijinal Parfümler', icon: faSprayCan },
  { k: 'muadil',          l: 'Muadil Parfümler',   icon: faStar },
  { k: 'reviews',         l: 'Tüm Yorumlar',       icon: faComments },
  { k: 'slider',          l: 'Slider',             icon: faImages },
  { k: 'favicon',         l: 'Favicon',            icon: faImage },
  { k: 'merge-perfumes',  l: 'Parfüm Birleştir',  icon: faCodeMerge },
  { k: 'activity',        l: 'Hareketler',         icon: faClockRotateLeft },
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

/* ─── Perfume Edit Modal ──────────────────────────────────────────────── */
function PerfumeEditModal({ perfume, brands, onClose, onDelete, onSave }) {
  const [ef, setEf] = useState(() => ({
    name: perfume.name || '',
    slug: perfume.slug || '',
    brandId: String(perfume.brandId || ''),
    gender: perfume.gender || '',
    year: String(perfume.year || ''),
    description: perfume.description || '',
    topNotes: (perfume.notes?.top || []).join(', '),
    heartNotes: (perfume.notes?.heart || []).join(', '),
    baseNotes: (perfume.notes?.base || []).join(', '),
  }));

  const handleSave = async () => {
    if (!ef.name || !ef.brandId) return;
    const b = brands.find((x) => String(x.id) === ef.brandId);
    const { topNotes, heartNotes, baseNotes, ...efClean } = ef;
    await onSave({
      ...efClean,
      brandId: ef.brandId,
      brandSlug: b?.slug || perfume.brandSlug,
      brandName: b?.name || perfume.brandName,
      year: Number(ef.year) || 0,
      notes: {
        top: (ef.topNotes || '').split(',').map((s) => s.trim()).filter(Boolean),
        heart: (ef.heartNotes || '').split(',').map((s) => s.trim()).filter(Boolean),
        base: (ef.baseNotes || '').split(',').map((s) => s.trim()).filter(Boolean),
      },
    });
  };

  return (
    <Modal open onClose={onClose} title={`Parfüm Düzenle: ${perfume.name}`} width="560px">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
        <Input label="Parfüm Adı *" value={ef.name} onChange={(e) => setEf({ ...ef, name: e.target.value })} />
        <Input label="Slug" value={ef.slug} onChange={(e) => setEf({ ...ef, slug: e.target.value.toLowerCase().replace(/ /g, '-').replace(/^-+/, '') })} />
        <Select label="Marka *" value={ef.brandId} onChange={(e) => setEf({ ...ef, brandId: e.target.value })} options={[{ value: '', label: 'Marka seçin' }, ...brands.filter((b) => b.type === 'original').map((b) => ({ value: String(b.id), label: b.name }))]} />
        <Select label="Cinsiyet" value={ef.gender} onChange={(e) => setEf({ ...ef, gender: e.target.value })} options={[{ value: '', label: '—' }, ...['Erkek', 'Kadın', 'Unisex'].map((g) => ({ value: g, label: g }))]} />
        <Input label="Çıkış Yılı" type="number" value={ef.year} onChange={(e) => setEf({ ...ef, year: e.target.value })} />
      </div>
      <Input label="Üst Notalar (virgülle)" value={ef.topNotes} onChange={(e) => setEf({ ...ef, topNotes: e.target.value })} />
      <Input label="Kalp Notaları" value={ef.heartNotes} onChange={(e) => setEf({ ...ef, heartNotes: e.target.value })} />
      <Input label="Dip Notalar" value={ef.baseNotes} onChange={(e) => setEf({ ...ef, baseNotes: e.target.value })} />
      <Textarea label="Açıklama" value={ef.description} onChange={(e) => setEf({ ...ef, description: e.target.value })} rows={2} />
      <div style={{ display: 'flex', gap: '8px', justifyContent: 'space-between' }}>
        <Btn variant="danger" onClick={onDelete}>Sil</Btn>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Btn variant="secondary" onClick={onClose}>İptal</Btn>
          <Btn onClick={handleSave} disabled={!ef.name || !ef.brandId}>Kaydet</Btn>
        </div>
      </div>
    </Modal>
  );
}

/* ─── Muadil Edit Modal ───────────────────────────────────────────────── */
function MuadilEditModal({ muadil, brands, perfumes, onClose, onDelete, onSave }) {
  const [emf, setEmf] = useState(() => ({
    name: muadil.name || '',
    slug: muadil.slug || '',
    brandId: String(muadil.brandId ?? ''),
    targetPerfumeId: String(muadil.targetPerfumeId ?? ''),
    gender: muadil.gender || '',
    description: muadil.description || '',
  }));

  const handleSave = async () => {
    if (!emf.name || !emf.brandId || !emf.targetPerfumeId) return;
    const b = brands.find((x) => String(x.id) === emf.brandId);
    const t = perfumes.find((x) => String(x.id) === emf.targetPerfumeId);
    await onSave({
      ...emf,
      brandId: emf.brandId,
      targetPerfumeId: emf.targetPerfumeId,
      gender: t?.gender || emf.gender || '',
      brandSlug: b?.slug || muadil.brandSlug,
      brandName: b?.name || muadil.brandName,
      targetPerfumeName: t?.name || muadil.targetPerfumeName,
      targetBrandName: t?.brandName || muadil.targetBrandName,
    });
  };

  return (
    <Modal open onClose={onClose} title={`Muadil Düzenle: ${muadil.name}`} width="540px">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
        <Input label="Muadil Adı *" value={emf.name} onChange={(e) => setEmf({ ...emf, name: e.target.value })} />
        <Input label="Slug" value={emf.slug} onChange={(e) => setEmf({ ...emf, slug: e.target.value.toLowerCase().replace(/ /g, '-').replace(/^-+/, '') })} />
        <Select label="Muadil Marka *" value={emf.brandId} onChange={(e) => setEmf({ ...emf, brandId: e.target.value })} options={[{ value: '', label: 'Marka seçin' }, ...brands.filter((b) => b.type === 'muadil').map((b) => ({ value: String(b.id), label: b.name }))]} />
        <Select label="Hedef Orijinal *" value={emf.targetPerfumeId} onChange={(e) => {
          const p = perfumes.find((x) => String(x.id) === e.target.value);
          setEmf({ ...emf, targetPerfumeId: e.target.value, gender: p?.gender || emf.gender || '' });
        }} options={[{ value: '', label: 'Parfüm seçin' }, ...[...perfumes].sort((a, b) => `${a.brandName} ${a.name}`.localeCompare(`${b.brandName} ${b.name}`, 'tr')).map((p) => ({ value: String(p.id), label: `${p.brandName} — ${p.name}` }))]} />
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
        <Btn variant="danger" onClick={onDelete}>Sil</Btn>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Btn variant="secondary" onClick={onClose}>İptal</Btn>
          <Btn onClick={handleSave} disabled={!emf.name || !emf.brandId || !emf.targetPerfumeId}>Kaydet</Btn>
        </div>
      </div>
    </Modal>
  );
}

/* ─── Brand Edit Modal ────────────────────────────────────────────────── */
function BrandEditModal({ brand, onClose, onDelete, onSave }) {
  const [ebf, setEbf] = useState(() => ({
    name: brand.name || '',
    slug: brand.slug || '',
    type: brand.type || 'original',
    origin: brand.origin || '',
    founded: String(brand.founded || ''),
    logo: brand.logo || '',
    logoImage: brand.logoImage || '',
    category: brand.category || 'Lüks',
    bio: brand.bio || '',
    instagram: brand.instagram || '',
    website: brand.website || '',
  }));
  const [cropModal, setCropModal] = useState({ open: false, src: '' });

  const handleCropConfirm = async (dataURL) => {
    setCropModal({ open: false, src: '' });
    setEbf((s) => ({ ...s, _logoUploading: true, _logoErr: '' }));
    try {
      const url = await uploadDataURL(dataURL, 'brands');
      setEbf((s) => ({ ...s, logoImage: url, _logoUploading: false }));
    } catch {
      setEbf((s) => ({ ...s, _logoErr: 'Görsel yüklenirken hata oluştu.', _logoUploading: false }));
    }
  };

  const handleSave = async () => {
    if (!ebf.name) return;
    const { _logoErr, _logoUploading, ...cleanEbf } = ebf;
    const founded = Number(ebf.founded) || Number(brand.founded) || 0;
    await onSave({ ...cleanEbf, founded });
  };

  return (
    <>
      <Modal open onClose={onClose} title={`Marka Düzenle: ${brand.name}`} width="540px">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <Input label="Marka Adı *" value={ebf.name} onChange={(e) => setEbf({ ...ebf, name: e.target.value })} />
          <Input label="Slug" value={ebf.slug} onChange={(e) => setEbf({ ...ebf, slug: e.target.value.toLowerCase().replace(/ /g, '-').replace(/^-+/, '') })} />
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
                : <span style={{ fontSize: '22px' }}>+</span>}
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
                reader.onload = (ev) => setCropModal({ open: true, src: ev.target.result });
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
          <Btn variant="danger" onClick={onDelete}>Sil</Btn>
          <div style={{ display: 'flex', gap: '8px' }}>
            <Btn variant="secondary" onClick={onClose}>İptal</Btn>
            <Btn onClick={handleSave} disabled={!ebf.name}>Kaydet</Btn>
          </div>
        </div>
      </Modal>
      {cropModal.open && (
        <ImageCropModal
          src={cropModal.src}
          aspect={1}
          outputW={300}
          outputH={300}
          title="Logo Görselini Kırp"
          onConfirm={handleCropConfirm}
          onCancel={() => setCropModal({ open: false, src: '' })}
        />
      )}
    </>
  );
}

/* ─── Add Brand Modal ─────────────────────────────────────────────────── */
function AddBrandModal({ brands, onClose, onAdd }) {
  const [bf, setBf] = useState({ name: '', slug: '', type: 'original', origin: '', founded: '', logo: '', logoImage: '', category: 'Designer', bio: '', instagram: '', website: '' });
  const [brandErr, setBrandErr] = useState('');
  const [cropModal, setCropModal] = useState({ open: false, src: '' });

  const handleCropConfirm = async (dataURL) => {
    setCropModal({ open: false, src: '' });
    setBf((s) => ({ ...s, _logoUploading: true, _logoErr: '' }));
    try {
      const url = await uploadDataURL(dataURL, 'brands');
      setBf((s) => ({ ...s, logoImage: url, _logoUploading: false }));
    } catch {
      setBf((s) => ({ ...s, _logoErr: 'Görsel yüklenirken hata oluştu.', _logoUploading: false }));
    }
  };

  const handleAdd = () => {
    if (!bf.name) return;
    const norm = bf.name.trim().toLowerCase();
    const dup = brands.find((b) => b.type === bf.type && b.name.trim().toLowerCase() === norm);
    if (dup) { setBrandErr(`"${bf.name}" adında bir ${bf.type === 'original' ? 'orijinal' : 'muadil'} marka zaten mevcut.`); return; }
    setBrandErr('');
    const { _logoErr, _logoUploading, ...cleanBf } = bf;
    onAdd({ ...cleanBf, slug: bf.slug || slugify(bf.name), founded: Number(bf.founded) || 2000 });
  };

  return (
    <>
      <Modal open onClose={onClose} title={`Yeni ${bf.type === 'original' ? 'Orijinal' : 'Muadil'} Marka Ekle`} width="540px">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <Input label="Marka Adı *" value={bf.name} onChange={(e) => setBf({ ...bf, name: e.target.value })} />
          <Input label="Slug" value={bf.slug} onChange={(e) => setBf({ ...bf, slug: e.target.value.toLowerCase().replace(/ /g, '-').replace(/^-+/, '') })} />
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
            <div onClick={() => document.getElementById('brand-logo-add').click()}
              style={{ width: '64px', height: '64px', borderRadius: '50%', border: `2px dashed ${bf.logoImage ? C.gold : C.border}`, background: bf.logoImage ? '#fff' : '#fafafa', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', overflow: 'hidden', flexShrink: 0 }}>
              {bf.logoImage ? <img src={bf.logoImage} alt="logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: '22px' }}>+</span>}
            </div>
            <input id="brand-logo-add" type="file" accept="image/jpeg,image/png,image/webp" style={{ display: 'none' }}
              onChange={(e) => {
                const file = e.target.files[0]; e.target.value = '';
                if (!file) return;
                if (!file.type.startsWith('image/')) { setBf((s) => ({ ...s, _logoErr: 'Sadece JPG, PNG veya WebP yüklenebilir.' })); return; }
                if (file.size > 2 * 1024 * 1024) { setBf((s) => ({ ...s, _logoErr: `Dosya boyutu 2MB sınırını aşıyor (${(file.size / 1024 / 1024).toFixed(1)}MB).` })); return; }
                setBf((s) => ({ ...s, _logoErr: '' }));
                const reader = new FileReader();
                reader.onload = (ev) => setCropModal({ open: true, src: ev.target.result });
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
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
          <Btn variant="secondary" onClick={onClose}>İptal</Btn>
          <Btn onClick={handleAdd} disabled={!bf.name}>Ekle</Btn>
        </div>
      </Modal>
      {cropModal.open && (
        <ImageCropModal src={cropModal.src} aspect={1} outputW={300} outputH={300} title="Logo Görselini Kırp"
          onConfirm={handleCropConfirm} onCancel={() => setCropModal({ open: false, src: '' })} />
      )}
    </>
  );
}

/* ─── Add Perfume Modal ───────────────────────────────────────────────── */
function AddPerfumeModal({ brands, perfumes, onClose, onAdd }) {
  const [pf, setPf] = useState({ name: '', slug: '', brandId: '', gender: 'Erkek', year: '', description: '', topNotes: '', heartNotes: '', baseNotes: '', images: [null, null, null] });
  const [perfErr, setPerfErr] = useState('');

  const handleAdd = () => {
    if (!pf.name || !pf.brandId) return;
    const norm = pf.name.trim().toLowerCase();
    const dup = perfumes.find((p) => p.name.trim().toLowerCase() === norm);
    if (dup) { setPerfErr(`"${pf.name}" adında bir orijinal parfüm zaten mevcut.`); return; }
    setPerfErr('');
    const b = brands.find((x) => String(x.id) === pf.brandId);
    const pPrimary = pf.images.find(Boolean)?.src || '';
    onAdd({ ...pf, brandId: pf.brandId, slug: pf.slug || slugify(pf.name), brandSlug: b?.slug || '', brandName: b?.name || '', year: Number(pf.year) || 2020, notes: { top: (pf.topNotes || '').split(',').map((s) => s.trim()).filter(Boolean), heart: (pf.heartNotes || '').split(',').map((s) => s.trim()).filter(Boolean), base: (pf.baseNotes || '').split(',').map((s) => s.trim()).filter(Boolean) }, image: pPrimary, images: pf.images });
  };

  return (
    <Modal open onClose={onClose} title="Yeni Parfüm Ekle" width="560px">
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
      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '24px' }}>
        <Btn variant="secondary" onClick={onClose}>İptal</Btn>
        <Btn onClick={handleAdd} disabled={!pf.name || !pf.brandId}>Ekle</Btn>
      </div>
    </Modal>
  );
}

/* ─── Add Muadil Modal ────────────────────────────────────────────────── */
function AddMuadilModal({ brands, perfumes, muadilPerfumes, onClose, onAdd }) {
  const [mf, setMf] = useState({ name: '', slug: '', brandId: '', targetPerfumeId: '', gender: '', description: '', images: [null, null, null] });
  const [muadilErr, setMuadilErr] = useState('');

  const handleAdd = () => {
    if (!mf.name || !mf.brandId || !mf.targetPerfumeId) return;
    const norm = mf.name.trim().toLowerCase();
    const dup = muadilPerfumes.find((m) => m.name.trim().toLowerCase() === norm);
    if (dup) { setMuadilErr(`"${mf.name}" adında bir muadil parfüm zaten mevcut.`); return; }
    setMuadilErr('');
    const b = brands.find((x) => String(x.id) === mf.brandId);
    const t = perfumes.find((x) => String(x.id) === mf.targetPerfumeId);
    const mPrimary = mf.images.find(Boolean)?.src || '';
    onAdd({ ...mf, brandId: mf.brandId, targetPerfumeId: mf.targetPerfumeId, slug: mf.slug || slugify(mf.name), brandSlug: b?.slug || '', brandName: b?.name || '', targetPerfumeName: t?.name || '', targetBrandName: t?.brandName || '', gender: t?.gender || mf.gender || '', image: mPrimary, images: mf.images });
  };

  return (
    <Modal open onClose={onClose} title="Muadil Parfüm Ekle" width="540px">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
        <Select label="Muadil Marka *" value={mf.brandId} onChange={(e) => setMf({ ...mf, brandId: e.target.value })} options={[{ value: '', label: 'Marka seçin' }, ...brands.filter((b) => b.type === 'muadil').map((b) => ({ value: String(b.id), label: b.name }))]} />
        <Select label="Hedef Orijinal *" value={mf.targetPerfumeId} onChange={(e) => {
          const p = perfumes.find((x) => String(x.id) === e.target.value);
          setMf({ ...mf, targetPerfumeId: e.target.value, name: p ? `${p.name} Benzeri` : '', gender: p?.gender || '' });
        }} options={[{ value: '', label: 'Parfüm seçin' }, ...[...perfumes].sort((a, b) => `${a.brandName} ${a.name}`.localeCompare(`${b.brandName} ${b.name}`, 'tr')).map((p) => ({ value: String(p.id), label: `${p.brandName} — ${p.name}` }))]} />
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
      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '24px' }}>
        <Btn variant="secondary" onClick={onClose}>İptal</Btn>
        <Btn onClick={handleAdd} disabled={!mf.name || !mf.brandId || !mf.targetPerfumeId}>Ekle</Btn>
      </div>
    </Modal>
  );
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

const GENDER_STYLE = {
  Erkek:  { bg: '#eff6ff', color: '#2563eb', border: '#bfdbfe' },
  Kadın:  { bg: '#fdf2f8', color: '#db2777', border: '#fbcfe8' },
  Unisex: { bg: '#f5f3ff', color: '#7c3aed', border: '#ddd6fe' },
};

function GChip({ g }) {
  if (!g) return null;
  const s = GENDER_STYLE[g];
  if (!s) return null;
  return (
    <span style={{ display: 'inline-block', padding: '1px 8px', borderRadius: '20px', fontSize: '11px', fontWeight: 600, background: s.bg, color: s.color, border: `1px solid ${s.border}` }}>{g}</span>
  );
}

function MergePerfDropItem({ p, onSel, muadilCountById }) {
  return (
    <button
      onMouseDown={(e) => { e.preventDefault(); onSel(p); }}
      style={{ width: '100%', textAlign: 'left', padding: '9px 12px', background: 'none', border: 'none', borderBottom: `1px solid ${C.borderLight}`, cursor: 'pointer', fontFamily: F, display: 'flex', alignItems: 'center', gap: '10px' }}
      onMouseEnter={(e) => (e.currentTarget.style.background = '#f4f4f8')}
      onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '13px', fontWeight: 600, color: C.text }}>{p.name}</div>
        <div style={{ fontSize: '11px', color: C.textLight }}>{p.brandName}</div>
      </div>
      <GChip g={p.gender} />
      {muadilCountById[p.id] > 0 && <span style={{ fontSize: '11px', color: C.green, fontWeight: 600, flexShrink: 0 }}>{muadilCountById[p.id]}m</span>}
    </button>
  );
}

function MergePerfRow({ p, side, muadilCountById }) {
  return (
    <div style={{ padding: '10px 14px', borderRadius: '10px', border: `2px solid ${side === 'src' ? '#fecaca' : '#bbf7d0'}`, background: side === 'src' ? '#fff5f5' : '#f0fdf4', display: 'flex', alignItems: 'center', gap: '10px', marginTop: '8px' }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: '14px', color: C.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</div>
        <div style={{ fontSize: '12px', color: C.textLight }}>{p.brandName}</div>
      </div>
      <GChip g={p.gender} />
      {muadilCountById[p.id] > 0 && <span style={{ fontSize: '12px', fontWeight: 700, color: C.green, flexShrink: 0 }}>{muadilCountById[p.id]}m</span>}
    </div>
  );
}

function MergePerfSearchBox({ label, labelColor, q, setQ, open, setOpen, refEl, results: res, groupedResults, onSel, selected, side, muadilCountById }) {
  const handleSel = (x) => { onSel(x); setQ(x.name); setOpen(false); };
  const handleClear = () => { setQ(''); onSel(null); setOpen(false); };
  const hasGrouped = !!groupedResults;
  const hasItems = hasGrouped
    ? (groupedResults.sameBrand.length + groupedResults.others.length) > 0
    : res?.length > 0;

  return (
    <div>
      <div style={{ fontSize: '12px', fontWeight: 700, color: labelColor, textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: '6px' }}>{label}</div>
      <div ref={refEl} style={{ position: 'relative' }}>
        <div style={{ position: 'relative' }}>
          <svg style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: C.textLight, pointerEvents: 'none' }} width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          <input
            value={q}
            onChange={(e) => { setQ(e.target.value); setOpen(true); if (!e.target.value) onSel(null); }}
            onFocus={() => { if (q) setOpen(true); }}
            placeholder="Parfüm adı veya marka ara…"
            style={{ width: '100%', boxSizing: 'border-box', paddingLeft: '32px', paddingRight: q ? '32px' : '10px', height: '38px', border: `1.5px solid ${selected ? (side === 'src' ? '#fca5a5' : '#86efac') : C.border}`, borderRadius: '9px', fontSize: '13px', color: C.text, background: '#fff', outline: 'none', fontFamily: F }}
          />
          {q && (
            <button onClick={handleClear} style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: C.textLight, fontSize: '16px', lineHeight: 1, padding: '2px', display: 'flex', alignItems: 'center' }}>×</button>
          )}
        </div>
        {selected && <MergePerfRow p={selected} side={side} muadilCountById={muadilCountById} />}
        {open && hasItems && (
          <div style={{ position: 'absolute', top: '42px', left: 0, right: 0, background: '#fff', border: `1px solid ${C.border}`, borderRadius: '10px', boxShadow: '0 6px 24px rgba(0,0,0,.12)', zIndex: 200, overflow: 'hidden' }}>
            {hasGrouped ? (
              <>
                {groupedResults.sameBrand.length > 0 && (
                  <>
                    <div style={{ padding: '5px 12px 3px', fontSize: '10px', fontWeight: 700, color: C.gold, textTransform: 'uppercase', letterSpacing: '.07em', background: C.goldBg, borderBottom: `1px solid ${C.goldBorder}` }}>
                      Aynı Marka
                    </div>
                    {groupedResults.sameBrand.map((p) => <MergePerfDropItem key={p.id} p={p} muadilCountById={muadilCountById} onSel={handleSel} />)}
                  </>
                )}
                {groupedResults.others.length > 0 && (
                  <>
                    <div style={{ padding: '5px 12px 3px', fontSize: '10px', fontWeight: 700, color: C.red, textTransform: 'uppercase', letterSpacing: '.07em', background: '#fff5f5', borderBottom: `1px solid #fecaca`, borderTop: groupedResults.sameBrand.length > 0 ? `1px solid #fecaca` : 'none' }}>
                      Diğer Markalar
                    </div>
                    {groupedResults.others.map((p) => <MergePerfDropItem key={p.id} p={p} muadilCountById={muadilCountById} onSel={handleSel} />)}
                  </>
                )}
              </>
            ) : (
              res.map((p) => <MergePerfDropItem key={p.id} p={p} muadilCountById={muadilCountById} onSel={handleSel} />)
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function MergePerfumesTab({ perfumes, muadilPerfumes, pairs, setPairs, running, setRunning, progress, setProgress, results, setResults, onRefresh }) {
  const [srcQ, setSrcQ] = useState('');
  const [tgtQ, setTgtQ] = useState('');
  const [source, setSource] = useState(null);
  const [target, setTarget] = useState(null);
  const [srcOpen, setSrcOpen] = useState(false);
  const [tgtOpen, setTgtOpen] = useState(false);
  const [mergeRefreshing, setMergeRefreshing] = useState(false);
  const srcRef = useRef(null);
  const tgtRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (srcRef.current && !srcRef.current.contains(e.target)) setSrcOpen(false);
      if (tgtRef.current && !tgtRef.current.contains(e.target)) setTgtOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const muadilCountById = useMemo(() => {
    const map = {};
    muadilPerfumes.forEach((m) => { map[m.targetPerfumeId] = (map[m.targetPerfumeId] || 0) + 1; });
    return map;
  }, [muadilPerfumes]);

  const normQ = (s) => (s || '').toLowerCase();

  const filterPerfs = (q) => {
    if (!q.trim()) return [];
    const lq = normQ(q);
    return perfumes
      .filter((p) => normQ(p.name).includes(lq) || normQ(p.brandName).includes(lq))
      .sort((a, b) => {
        const aS = normQ(a.name).startsWith(lq) ? 0 : 1;
        const bS = normQ(b.name).startsWith(lq) ? 0 : 1;
        return aS - bS || a.name.localeCompare(b.name, 'tr');
      })
      .slice(0, 8);
  };

  const srcResults = useMemo(() => filterPerfs(srcQ), [srcQ, perfumes]);

  const tgtResults = useMemo(() => {
    if (!tgtQ.trim()) return { sameBrand: [], others: [] };
    const lq = normQ(tgtQ);
    const matches = perfumes
      .filter((p) => normQ(p.name).includes(lq) || normQ(p.brandName).includes(lq))
      .sort((a, b) => {
        const aS = normQ(a.name).startsWith(lq) ? 0 : 1;
        const bS = normQ(b.name).startsWith(lq) ? 0 : 1;
        return aS - bS || a.name.localeCompare(b.name, 'tr');
      });
    if (source) {
      const sameBrand = matches.filter((p) => p.brandName === source.brandName).slice(0, 6);
      const sameBrandIds = new Set(sameBrand.map((p) => p.id));
      const others = matches.filter((p) => !sameBrandIds.has(p.id)).slice(0, 6);
      return { sameBrand, others };
    }
    return { sameBrand: [], others: matches.slice(0, 8) };
  }, [tgtQ, perfumes, source]);

  const selectSrc = (p) => { setSource(p); setSrcQ(p.name); setSrcOpen(false); };
  const selectTgt = (p) => { setTarget(p); setTgtQ(p.name); setTgtOpen(false); };

  const addPair = () => {
    if (!source || !target || source.id === target.id) return;
    if (pairs.some((p) => p.source.id === source.id && p.target.id === target.id)) return;
    setPairs((prev) => [...prev, { source, target, id: Date.now() }]);
    setSource(null); setTarget(null); setSrcQ(''); setTgtQ('');
  };

  const removePair = (id) => setPairs((prev) => prev.filter((p) => p.id !== id));

  const [undoData, setUndoData] = useState(null);
  const [undoing, setUndoing] = useState(false);

  const runMerges = async () => {
    if (!pairs.length) return;
    setRunning(true);
    setProgress({ done: 0, total: pairs.length });
    setResults(null);
    setUndoData(null);
    const res = [];
    const undoList = [];

    for (let i = 0; i < pairs.length; i++) {
      const { source: src, target: tgt } = pairs[i];
      try {
        const mSnap = await getDocs(query(collection(db, 'muadils'), where('targetPerfumeId', '==', src.id)));
        const existSnap = await getDocs(query(collection(db, 'muadils'), where('targetPerfumeId', '==', tgt.id)));
        const existingBrands = new Set(existSnap.docs.map((d) => d.data().brandId));

        const batch = writeBatch(db);
        let moved = 0, skipped = 0;
        const movedIds = [];
        const deletedMuadils = [];

        mSnap.docs.forEach((d) => {
          if (existingBrands.has(d.data().brandId)) {
            deletedMuadils.push({ id: d.id, ...d.data() });
            batch.delete(d.ref);
            skipped++;
          } else {
            movedIds.push(d.id);
            batch.update(d.ref, { targetPerfumeId: tgt.id, targetPerfumeName: tgt.name, targetBrandName: tgt.brandName, name: `${tgt.brandName} ${tgt.name} Benzeri` });
            moved++;
          }
        });

        const tgtUpdates = {};
        if (!tgt.gender && src.gender) tgtUpdates.gender = src.gender;
        const srcHasNotes = src.notes?.top?.length || src.notes?.heart?.length || src.notes?.base?.length;
        const tgtHasNotes = tgt.notes?.top?.length || tgt.notes?.heart?.length || tgt.notes?.base?.length;
        if (srcHasNotes && !tgtHasNotes) tgtUpdates.notes = src.notes;
        if (!tgt.description && src.description) tgtUpdates.description = src.description;
        if (!tgt.image && src.image) tgtUpdates.image = src.image;
        if (Object.keys(tgtUpdates).length > 0) batch.update(doc(db, 'perfumes', tgt.id), tgtUpdates);

        batch.delete(doc(db, 'perfumes', src.id));
        await batch.commit();
        res.push({ source: src, target: tgt, status: 'ok', moved, skipped, inherited: Object.keys(tgtUpdates) });
        undoList.push({ source: src, target: tgt, tgtUpdates, movedIds, deletedMuadils });
      } catch (e) {
        res.push({ source: src, target: tgt, status: 'error', error: e.message });
      }
      setProgress({ done: i + 1, total: pairs.length });
    }

    setResults(res);
    setUndoData(undoList.length > 0 ? undoList : null);
    setRunning(false);
    const failedSrcIds = new Set(res.filter((r) => r.status === 'error').map((r) => r.source.id));
    setPairs((prev) => prev.filter((p) => failedSrcIds.has(p.source.id)));
    if (onRefresh) onRefresh();
  };

  const handleUndo = async () => {
    if (!undoData?.length) return;
    setUndoing(true);
    try {
      for (const { source: src, target: tgt, tgtUpdates, movedIds, deletedMuadils } of undoData) {
        const batch = writeBatch(db);

        // 1. Kaynak parfümü yeniden oluştur
        batch.set(doc(db, 'perfumes', src.id), src);

        // 2. Hedef parfümün inherited alanlarını geri al
        if (Object.keys(tgtUpdates).length > 0) {
          const revert = {};
          for (const key of Object.keys(tgtUpdates)) revert[key] = tgt[key] ?? null;
          batch.update(doc(db, 'perfumes', tgt.id), revert);
        }

        // 3. Taşınan muadilleri geri taşı
        for (const mId of movedIds) {
          batch.update(doc(db, 'muadils', mId), {
            targetPerfumeId: src.id,
            targetPerfumeName: src.name,
            targetBrandName: src.brandName,
            name: `${src.brandName} ${src.name} Benzeri`,
          });
        }

        // 4. Silinen muadilleri yeniden oluştur
        for (const m of deletedMuadils) {
          const { id, ...data } = m;
          batch.set(doc(db, 'muadils', id), { ...data, id });
        }

        await batch.commit();
      }
      setUndoData(null);
      setResults(null);
      if (onRefresh) onRefresh();
    } catch (e) {
      alert('Geri alma başarısız: ' + e.message);
    } finally {
      setUndoing(false);
    }
  };

  return (
    <div style={{ maxWidth: '960px' }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      {/* Selector card */}
      <Card style={{ padding: '24px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
          <div style={{ fontWeight: 800, fontSize: '17px', color: C.navy }}>Parfüm Birleştirme</div>
          {onRefresh && (
            <button
              onClick={async () => { setMergeRefreshing(true); try { await onRefresh(); } finally { setMergeRefreshing(false); } }}
              disabled={mergeRefreshing}
              style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '5px 10px', borderRadius: '7px', border: `1px solid ${C.border}`, background: '#fff', color: C.textMid, fontSize: '12px', fontWeight: 600, cursor: mergeRefreshing ? 'default' : 'pointer', fontFamily: F, opacity: mergeRefreshing ? 0.6 : 1 }}>
              <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ animation: mergeRefreshing ? 'spin 0.8s linear infinite' : 'none' }}><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
              {mergeRefreshing ? 'Yenileniyor…' : 'Yenile'}
            </button>
          )}
        </div>
        <div style={{ fontSize: '13px', color: C.textLight, marginBottom: '24px' }}>Solda <b>silinecek</b> (kaynak), sağda <b>korunacak</b> (hedef) parfümü seçin. Muadiller otomatik taşınır; eksik cinsiyet / nota / açıklama kopyalanır.</div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 32px 1fr', gap: '12px', alignItems: 'start' }}>
          <MergePerfSearchBox
            label="Silinecek (Kaynak)" labelColor="#dc2626"
            q={srcQ} setQ={setSrcQ} open={srcOpen} setOpen={setSrcOpen}
            refEl={srcRef} results={srcResults}
            onSel={(p) => { setSource(p); if (!p) setSrcQ(''); }}
            selected={source} side="src" muadilCountById={muadilCountById}
          />
          <div style={{ paddingTop: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.textLight }}>
            <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
          </div>
          <MergePerfSearchBox
            label="Korunacak (Hedef)" labelColor="#16a34a"
            q={tgtQ} setQ={setTgtQ} open={tgtOpen} setOpen={setTgtOpen}
            refEl={tgtRef} groupedResults={tgtResults}
            onSel={(p) => { setTarget(p); if (!p) setTgtQ(''); }}
            selected={target} side="tgt" muadilCountById={muadilCountById}
          />
        </div>

        {source && target && source.id === target.id && (
          <div style={{ marginTop: '12px', fontSize: '13px', color: C.red, textAlign: 'center' }}>Kaynak ve hedef aynı parfüm olamaz.</div>
        )}

        <div style={{ marginTop: '18px', display: 'flex', justifyContent: 'center' }}>
          <Btn onClick={addPair} disabled={!source || !target || source?.id === target?.id}>
            + Listeye Ekle
          </Btn>
        </div>
      </Card>

      {/* Pending pairs */}
      {pairs.length > 0 && (
        <Card style={{ overflow: 'hidden', marginBottom: '20px' }}>
          <div style={{ padding: '13px 18px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
            <span style={{ fontWeight: 700, color: C.navy }}>Bekleyen Birleştirmeler <span style={{ fontWeight: 400, fontSize: '13px', color: C.textLight }}>({pairs.length} çift)</span></span>
            <Btn onClick={runMerges} disabled={running}>
              {running ? `İşleniyor… ${progress.done}/${progress.total}` : `Tümünü Birleştir (${pairs.length})`}
            </Btn>
          </div>

          {running && (
            <div style={{ padding: '10px 18px', background: '#fffbeb', borderBottom: `1px solid #fde68a`, display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '16px', height: '16px', border: `2.5px solid #fde68a`, borderTop: `2.5px solid ${C.gold}`, borderRadius: '50%', animation: 'spin 0.8s linear infinite', flexShrink: 0 }} />
              <div style={{ flex: 1, height: '6px', background: '#fde68a', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ height: '100%', background: C.gold, borderRadius: '3px', width: `${(progress.done / progress.total) * 100}%`, transition: 'width .3s' }} />
              </div>
              <span style={{ fontSize: '12px', color: '#92400e', flexShrink: 0 }}>{progress.done}/{progress.total}</span>
            </div>
          )}

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', minWidth: '560px', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f9f9fb' }}>
                  <th style={{ ...thBase, width: '44%' }}>Silinecek</th>
                  <th style={{ ...thBase, width: '8%', textAlign: 'center' }}></th>
                  <th style={{ ...thBase, width: '44%' }}>Korunacak</th>
                  <th style={{ ...thBase, width: '36px' }}></th>
                </tr>
              </thead>
              <tbody>
                {pairs.map((pair) => (
                  <tr key={pair.id} style={{ borderBottom: `1px solid ${C.borderLight}` }} onMouseEnter={(e) => (e.currentTarget.style.background = '#fafafa')} onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}>
                    <td style={{ padding: '10px 14px' }}>
                      <div style={{ fontWeight: 600, fontSize: '13px', color: '#dc2626' }}>{pair.source.name}</div>
                      <div style={{ fontSize: '11px', color: C.textLight, marginBottom: '4px' }}>{pair.source.brandName}</div>
                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                        <GChip g={pair.source.gender} />
                        {muadilCountById[pair.source.id] > 0 && <span style={{ fontSize: '11px', color: C.green, fontWeight: 600 }}>{muadilCountById[pair.source.id]} muadil</span>}
                      </div>
                    </td>
                    <td style={{ textAlign: 'center', color: C.textLight, fontSize: '16px' }}>→</td>
                    <td style={{ padding: '10px 14px' }}>
                      <div style={{ fontWeight: 600, fontSize: '13px', color: '#16a34a' }}>{pair.target.name}</div>
                      <div style={{ fontSize: '11px', color: C.textLight, marginBottom: '4px' }}>{pair.target.brandName}</div>
                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                        <GChip g={pair.target.gender} />
                        {muadilCountById[pair.target.id] > 0 && <span style={{ fontSize: '11px', color: C.green, fontWeight: 600 }}>{muadilCountById[pair.target.id]} muadil</span>}
                      </div>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <button
                        onClick={() => removePair(pair.id)}
                        disabled={running}
                        style={{ background: 'none', border: 'none', cursor: running ? 'default' : 'pointer', color: C.textLight, fontSize: '20px', lineHeight: 1, padding: '4px 8px', borderRadius: '6px', opacity: running ? 0.4 : 1 }}
                        onMouseEnter={(e) => { if (!running) e.currentTarget.style.color = C.red; }}
                        onMouseLeave={(e) => (e.currentTarget.style.color = C.textLight)}
                      >×</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Results */}
      {results && (
        <Card style={{ overflow: 'hidden' }}>
          <div style={{ padding: '13px 18px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontWeight: 700, color: C.navy }}>Sonuçlar</span>
            <span style={{ fontSize: '13px', color: C.green, fontWeight: 600 }}>{results.filter((r) => r.status === 'ok').length} başarılı</span>
            {results.some((r) => r.status === 'error') && (
              <span style={{ fontSize: '13px', color: C.red, fontWeight: 600 }}>{results.filter((r) => r.status === 'error').length} hatalı</span>
            )}
            {undoData && (
              <button
                onClick={handleUndo}
                disabled={undoing}
                style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '5px', padding: '5px 12px', borderRadius: '7px', border: `1px solid ${C.border}`, background: '#fff', color: C.textMid, fontSize: '12px', fontWeight: 600, cursor: undoing ? 'default' : 'pointer', fontFamily: F, opacity: undoing ? 0.6 : 1 }}
              >
                <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="9 14 4 9 9 4"/><path d="M20 20v-7a4 4 0 0 0-4-4H4"/></svg>
                {undoing ? 'Geri alınıyor…' : 'Son Birleştirmeyi Geri Al'}
              </button>
            )}
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', minWidth: '560px', borderCollapse: 'collapse' }}>
              <tbody>
                {results.map((r, i) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${C.borderLight}`, background: r.status === 'ok' ? '#f0fdf4' : '#fff5f5' }}>
                    <td style={{ padding: '10px 14px', width: '30%' }}>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: '#dc2626' }}>{r.source.name}</div>
                      <div style={{ fontSize: '11px', color: C.textLight }}>{r.source.brandName}</div>
                    </td>
                    <td style={{ textAlign: 'center', color: C.textLight, width: '30px' }}>→</td>
                    <td style={{ padding: '10px 14px', width: '30%' }}>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: '#16a34a' }}>{r.target.name}</div>
                      <div style={{ fontSize: '11px', color: C.textLight }}>{r.target.brandName}</div>
                    </td>
                    <td style={{ padding: '10px 14px', fontSize: '12px', color: C.textMid }}>
                      {r.status === 'ok' ? (
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                          {r.moved > 0 && <span style={{ color: C.green, fontWeight: 600 }}>+{r.moved} muadil</span>}
                          {r.skipped > 0 && <span style={{ color: C.textLight }}>{r.skipped} dup. silindi</span>}
                          {r.inherited?.includes('gender') && <span style={{ color: C.blue }}>cinsiyet kopyalandı</span>}
                          {r.inherited?.includes('notes') && <span style={{ color: C.blue }}>notalar kopyalandı</span>}
                          {r.inherited?.includes('description') && <span style={{ color: C.blue }}>açıklama kopyalandı</span>}
                        </div>
                      ) : (
                        <span style={{ color: C.red }}>Hata: {r.error}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}

export function AdminPanel() {
  useSeo({ title: 'Yönetim', noindex: true });
  const { isAdmin, reauthenticate } = useAuth();
  const { navigate } = useRouter();
  const { brands, perfumes, muadilPerfumes, users, comments, addBrand, updateUser, deleteUser, addPerfume, updatePerfume, deletePerfume, addMuadil, updateMuadil, deleteMuadil, updateBrand, deleteBrand, fetchReviewsByDateRange, adminDeleteReviews, sliderImages, addSliderImage, removeSliderImage, updateSliderImage, reorderSliderImages, MAX_SLIDER, MAX_SIZE_MB, faviconUrl, updateFavicon, refreshPerfumes, refreshMuadils } = useData();

  const { sm, xs } = useW();
  const [tab, setTabRaw] = useState('dashboard');
  const [openActionId, setOpenActionId] = useState(null);
  const [uam, setUam] = useState({ open: false, user: null, step: 'actions', action: null, loading: false, error: '' });
  const [iam, setIam] = useState({ open: false, item: null, itemType: null, step: 'actions', loading: false, error: '', withMuadils: false });
  const [sort, setSort] = useState({ key: '', dir: 'asc' });
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [perfPage, setPerfPage] = useState(1);
  const [muadilPage, setMuadilPage] = useState(1);
  const [perfBrandFilter, setPerfBrandFilter] = useState('');
  const [muadilBrandFilter, setMuadilBrandFilter] = useState('');
  const [mergePairs, setMergePairs] = useState([]);
  const [mergeRunning, setMergeRunning] = useState(false);
  const [mergeProgress, setMergeProgress] = useState({ done: 0, total: 0 });
  const [mergeResults, setMergeResults] = useState(null);
  const PERF_PER_PAGE = 50;
  const [userInput, setUserInput] = useState('');
  const [userQuery, setUserQuery] = useState('');
  const [bulkDel, setBulkDel] = useState({ open: false, loading: false, error: '' });

  // ─── Tüm Yorumlar sekmesi ───────────────────────────────────────────────
  const _today = new Date().toISOString().slice(0, 10);
  const _weekAgo = new Date(Date.now() - 7 * 864e5).toISOString().slice(0, 10);
  const [revRange, setRevRange] = useState({ start: _weekAgo, end: _today });
  const [revList, setRevList] = useState([]);
  const [revLoading, setRevLoading] = useState(false);
  const [revLoaded, setRevLoaded] = useState(false);
  const [revError, setRevError] = useState('');
  const [revDel, setRevDel] = useState({ open: false, ids: [], loading: false, error: '' });

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

  const openRevDel = (ids) => setRevDel({ open: true, ids, loading: false, error: '' });
  const closeRevDel = () => setRevDel({ open: false, ids: [], loading: false, error: '' });
  const handleRevDelete = async () => {
    setRevDel((s) => ({ ...s, loading: true, error: '' }));
    try { await reauthenticate(revDelPwRef.current?.value ?? ''); }
    catch { setRevDel((s) => ({ ...s, loading: false, error: 'Şifre hatalı. Lütfen tekrar deneyin.' })); return; }
    await adminDeleteReviews(revDel.ids);
    const removed = new Set(revDel.ids);
    setRevList((prev) => prev.filter((r) => !removed.has(r.id)));
    setSelectedIds(new Set());
    closeRevDel();
  };

  const setTab = (t) => { setTabRaw(t); setSort({ key: '', dir: 'asc' }); setSearch(''); setSelectedIds(new Set()); setPerfPage(1); setMuadilPage(1); setPerfBrandFilter(''); setMuadilBrandFilter(''); };

  const toggleSelect = (id) => setSelectedIds((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const toggleAll = (ids) => setSelectedIds((prev) => ids.every((id) => prev.has(id)) ? new Set() : new Set(ids));
  const openBulkDel = () => setBulkDel({ open: true, loading: false, error: '' });
  const closeBulkDel = () => setBulkDel({ open: false, loading: false, error: '' });

  const handleBulkDelete = async () => {
    setBulkDel((s) => ({ ...s, loading: true, error: '' }));
    try {
      await reauthenticate(bulkDelPwRef.current?.value ?? '');
    } catch {
      setBulkDel((s) => ({ ...s, loading: false, error: 'Şifre hatalı. Lütfen tekrar deneyin.' }));
      return;
    }
    const ids = [...selectedIds];
    if (tab === 'original-brands' || tab === 'muadil-brands') await Promise.all(ids.map((id) => { const b = brands.find((x) => x.id === id); return deleteBrand(id, b?.type); }));
    else if (tab === 'perfumes') await Promise.all(ids.map((id) => deletePerfume(id, true)));
    else if (tab === 'muadil') await Promise.all(ids.map(deleteMuadil));
    setSelectedIds(new Set());
    closeBulkDel();
  };

  const closeIam = () => setIam({ open: false, item: null, itemType: null, step: 'actions', loading: false, error: '', withMuadils: false });
  const openIam = (item, itemType) => setIam({ open: true, item, itemType, step: 'actions', loading: false, error: '', withMuadils: false });
  const handleIamDelete = async () => {
    setIam((s) => ({ ...s, loading: true, error: '' }));
    try { await reauthenticate(iamPwRef.current?.value ?? ''); } catch { setIam((s) => ({ ...s, loading: false, error: 'Şifre hatalı. Lütfen tekrar deneyin.' })); return; }
    if (iam.itemType === 'brand') await deleteBrand(iam.item.id, iam.item.type);
    else if (iam.itemType === 'perfume') await deletePerfume(iam.item.id, iam.withMuadils);
    else if (iam.itemType === 'muadil') await deleteMuadil(iam.item.id);
    closeIam();
  };

  const closeUam = () => setUam({ open: false, user: null, step: 'actions', action: null, loading: false, error: '' });
  const openUamConfirm = (action) => setUam((s) => ({ ...s, step: 'confirm', action, error: '' }));
  const handleUamSubmit = async () => {
    const { user: u, action } = uam;
    setUam((s) => ({ ...s, loading: true, error: '' }));
    try { await reauthenticate(uamPwRef.current?.value ?? ''); } catch { setUam((s) => ({ ...s, loading: false, error: 'Şifre hatalı. Lütfen tekrar deneyin.' })); return; }
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
  const [delBrandPw, setDelBrandPw] = useState({ loading: false, error: '', withMuadils: false });
  const iamPwRef = useRef(null);
  const uamPwRef = useRef(null);
  const bulkDelPwRef = useRef(null);
  const revDelPwRef = useRef(null);
  const delBrandPwRef = useRef(null);
  const [selBrand, setSelBrand] = useState(null);

  // ─── Perfumes tablosu için memoized hesaplamalar ───────────────────────────
  // muadilCount: her parfüm için kaç muadil var — O(n) map yerine O(n+m)
  const muadilCountMap = useMemo(() => {
    const map = {};
    muadilPerfumes.forEach((m) => { map[m.targetPerfumeId] = (map[m.targetPerfumeId] || 0) + 1; });
    return map;
  }, [muadilPerfumes]);

  const basePerfumes = useMemo(() =>
    perfumes.map((p) => ({ ...p, muadilCount: muadilCountMap[p.id] || 0 })),
  [perfumes, muadilCountMap]);

  const perfBrandList = useMemo(() =>
    Array.from(new Set(perfumes.map((p) => p.brandName).filter(Boolean))).sort((a, b) => a.localeCompare(b, 'tr')),
  [perfumes]);

  const filteredPerfs = useMemo(() => {
    const q = search.toLowerCase();
    return basePerfumes.filter((p) =>
      (!perfBrandFilter || p.brandName === perfBrandFilter) &&
      (!q || p.name.toLowerCase().includes(q) || p.brandName.toLowerCase().includes(q) || (p.gender || '').toLowerCase().includes(q))
    );
  }, [basePerfumes, search, perfBrandFilter]);

  const sortedPerfs = useMemo(() =>
    applySort(filteredPerfs, (p, k) => ({ name: p.name, brandName: p.brandName, gender: p.gender, muadilCount: p.muadilCount })[k]),
  [filteredPerfs, sort]);

  // ─── Muadils tablosu için memoized hesaplamalar ───────────────────────────
  // Yorumları muadilId'ye göre önceden grupla — her satırda filter() yerine O(1) lookup
  const commentsByMuadil = useMemo(() => {
    const map = {};
    comments.filter((c) => c.status === 'approved').forEach((c) => {
      if (!map[c.muadilPerfumeId]) map[c.muadilPerfumeId] = [];
      map[c.muadilPerfumeId].push(c);
    });
    return map;
  }, [comments]);

  const baseMuadil = useMemo(() =>
    muadilPerfumes.map((m) => {
      const ok = commentsByMuadil[m.id] || [];
      if (!ok.length) return { ...m, overall: -1, commentCount: 0 };
      const avg = (arr) => parseFloat((arr.reduce((s, v) => s + v, 0) / arr.length).toFixed(1));
      const scent = avg(ok.map((c) => c.similarity));
      const projection = avg(ok.map((c) => c.projection));
      const longevity = avg(ok.map((c) => c.longevity));
      return { ...m, overall: parseFloat(((scent + projection + longevity) / 3).toFixed(1)), commentCount: ok.length };
    }),
  [muadilPerfumes, commentsByMuadil]);

  const muadilBrandList = useMemo(() =>
    Array.from(new Set(muadilPerfumes.map((m) => m.brandName).filter(Boolean))).sort((a, b) => a.localeCompare(b, 'tr')),
  [muadilPerfumes]);

  const filteredMuadils = useMemo(() => {
    const q = search.toLowerCase();
    return baseMuadil.filter((m) =>
      (!muadilBrandFilter || m.brandName === muadilBrandFilter) &&
      (!q || m.name.toLowerCase().includes(q) || m.brandName.toLowerCase().includes(q) || (m.targetPerfumeName || '').toLowerCase().includes(q) || (m.targetBrandName || '').toLowerCase().includes(q))
    );
  }, [baseMuadil, search, muadilBrandFilter]);

  const sortedMuadils = useMemo(() =>
    applySort(filteredMuadils, (m, k) => ({ name: m.name, brandName: m.brandName, targetPerfumeName: `${m.targetBrandName} ${m.targetPerfumeName}`, overall: m.overall, commentCount: m.commentCount })[k]),
  [filteredMuadils, sort]);

  // ─── Brands tablosu için memoized hesaplamalar ────────────────────────────
  const perfCountByBrand = useMemo(() => {
    const map = {};
    perfumes.forEach((p) => { map[p.brandId] = (map[p.brandId] || 0) + 1; });
    return map;
  }, [perfumes]);

  const muadilCountByBrand = useMemo(() => {
    const map = {};
    muadilPerfumes.forEach((m) => { map[m.brandId] = (map[m.brandId] || 0) + 1; });
    return map;
  }, [muadilPerfumes]);

  const baseOrigBrands = useMemo(() =>
    brands.filter((b) => b.type === 'original').map((b) => ({ ...b, perfumeCount: perfCountByBrand[b.id] || 0 })),
  [brands, perfCountByBrand]);

  const baseMuadilBrands = useMemo(() =>
    brands.filter((b) => b.type === 'muadil').map((b) => ({ ...b, perfumeCount: muadilCountByBrand[b.id] || 0 })),
  [brands, muadilCountByBrand]);

  const filteredOrigBrands = useMemo(() => {
    const q = search.toLowerCase();
    return baseOrigBrands.filter((b) => !q || b.name.toLowerCase().includes(q) || (b.origin || '').toLowerCase().includes(q));
  }, [baseOrigBrands, search]);

  const filteredMuadilBrands = useMemo(() => {
    const q = search.toLowerCase();
    return baseMuadilBrands.filter((b) => !q || b.name.toLowerCase().includes(q) || (b.origin || '').toLowerCase().includes(q));
  }, [baseMuadilBrands, search]);

  const sortedOrigBrands = useMemo(() =>
    applySort(filteredOrigBrands, (b, k) => ({ name: b.name, origin: b.origin || '', category: b.category || '', perfumeCount: b.perfumeCount })[k]),
  [filteredOrigBrands, sort]);

  const sortedMuadilBrands = useMemo(() =>
    applySort(filteredMuadilBrands, (b, k) => ({ name: b.name, origin: b.origin || '', category: b.category || '', perfumeCount: b.perfumeCount })[k]),
  [filteredMuadilBrands, sort]);

  // ─── Export ───────────────────────────────────────────────────────────────
  const [exportModal, setExportModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showFloatingRefresh, setShowFloatingRefresh] = useState(false);
  const refreshBtnRef = useRef(null);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      if (tab === 'perfumes') await Promise.all([refreshPerfumes(), refreshMuadils()]);
      else if (tab === 'muadil') await refreshMuadils();
      else if (tab === 'original-brands' || tab === 'muadil-brands') { await refreshPerfumes(); await refreshMuadils(); }
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    setShowFloatingRefresh(false);
    const el = refreshBtnRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setShowFloatingRefresh(!entry.isIntersecting),
      { threshold: 1.0 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [tab]);

  const getExportData = () => {
    if (tab === 'perfumes') {
      return {
        headers: ['Marka', 'Parfüm Adı', 'Cinsiyet', 'Muadil Sayısı', 'URL'],
        rows: sortedPerfs.map((p) => [p.brandName, p.name, p.gender || '', p.muadilCount, `/${p.brandSlug}/${p.slug}`]),
        filename: 'parfumler',
      };
    }
    const isOrig = tab === 'original-brands';
    const data = isOrig ? sortedOrigBrands : sortedMuadilBrands;
    return {
      headers: ['Marka', 'Köken', 'Kategori', 'Parfüm Sayısı'],
      rows: data.map((b) => [b.name, b.origin || '', b.category || '', b.perfumeCount]),
      filename: isOrig ? 'orijinal-markalar' : 'muadil-markalar',
    };
  };

  const exportCSV = () => {
    const { headers, rows, filename } = getExportData();
    const escape = (v) => `"${String(v).replace(/"/g, '""')}"`;
    const csv = [headers, ...rows].map((r) => r.map(escape).join(',')).join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `${filename}.csv`; a.click();
    setExportModal(false);
  };

  const exportExcel = async () => {
    const XLSX = await import('xlsx');
    const { headers, rows, filename } = getExportData();
    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    ws['!cols'] = headers.map(() => ({ wch: 24 }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Liste');
    XLSX.writeFile(wb, `${filename}.xlsx`);
    setExportModal(false);
  };

  const exportPDF = () => {
    const { headers, rows, filename } = getExportData();
    const thStyle = 'padding:8px 12px;background:#1a1a2e;color:#fff;font-weight:700;font-size:12px;text-align:left;border:1px solid #ddd;';
    const tdStyle = 'padding:7px 12px;font-size:12px;border:1px solid #ddd;';
    const trEven = 'background:#f9f9fb;';
    const ths = headers.map((h) => `<th style="${thStyle}">${h}</th>`).join('');
    const trs = rows.map((r, i) => `<tr style="${i % 2 === 1 ? trEven : ''}">${r.map((c) => `<td style="${tdStyle}">${c}</td>`).join('')}</tr>`).join('');
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${filename}</title><style>body{font-family:Arial,sans-serif;padding:20px}table{border-collapse:collapse;width:100%}h2{margin-bottom:16px;font-size:16px}@media print{button{display:none}}</style></head><body><h2>${filename} — ${rows.length} kayıt</h2><table><thead><tr>${ths}</tr></thead><tbody>${trs}</tbody></table><script>setTimeout(()=>window.print(),400)<\/script></body></html>`;
    const w = window.open('', '_blank'); w.document.write(html); w.document.close();
    setExportModal(false);
  };

  if (!isAdmin) return <div style={{ padding: '60px', textAlign: 'center', color: C.textLight }}>Erişim yetkisi yok.</div>;

  const stats = [
    { label: 'Toplam Kullanıcı', val: users.length, icon: faUsers, color: C.blue },
    { label: 'Orijinal Parfüm', val: perfumes.length, icon: faFlask, color: C.gold },
    { label: 'Muadil Parfüm', val: muadilPerfumes.length, icon: faStar, color: C.green },
    { label: 'Bekleyen Yorum', val: comments.filter((c) => c.status === 'pending').length, icon: faCommentDots, color: C.orange },
  ];


  const openEditBrand = (b) => setSelBrand(b);

  const saveBrand = async (data) => {
    try {
      await updateBrand(selBrand.id, data);
      setSelBrand(null);
    } catch (e) {
      console.error('Marka güncelleme hatası:', e);
      alert('Güncelleme başarısız: ' + (e?.message || e));
    }
  };

  const openEditPerf = (p) => setSelPerf(p);

  const savePerf = async (data) => {
    try {
      await updatePerfume(selPerf.id, data);
      setSelPerf(null);
    } catch (e) {
      console.error('Parfüm güncelleme hatası:', e);
      alert('Güncelleme başarısız: ' + (e?.message || e));
    }
  };

  const openEditMuadil = (m) => setSelMuadil(m);

  const saveMuadil = async (data) => {
    try {
      await updateMuadil(selMuadil.id, data);
      setSelMuadil(null);
    } catch (e) {
      console.error('Muadil güncelleme hatası:', e);
      alert('Güncelleme başarısız: ' + (e?.message || e));
    }
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

      {/* ── Yatay sekme barı ─────────────────────────────────────────────── */}
      <div style={{ background: C.card, borderBottom: `1px solid ${C.border}`, position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 32px', display: 'flex', flexWrap: 'wrap', gap: '0' }}>
          {TABS.map(({ k, l, icon }) => {
            const active = tab === k;
            return (
              <button key={k} onClick={() => setTab(k)} style={{
                display: 'flex', alignItems: 'center', gap: '7px',
                padding: '13px 16px',
                border: 'none', borderBottom: `2px solid ${active ? C.gold : 'transparent'}`,
                background: 'transparent',
                color: active ? C.gold : C.textMid,
                fontSize: '13px', fontWeight: active ? 700 : 500,
                cursor: 'pointer', fontFamily: F,
                transition: 'color 0.15s, border-color 0.15s',
                whiteSpace: 'nowrap',
              }}
                onMouseEnter={e => { if (!active) e.currentTarget.style.color = C.text; }}
                onMouseLeave={e => { if (!active) e.currentTarget.style.color = C.textMid; }}
              >
                <FontAwesomeIcon icon={icon} style={{ fontSize: '12px' }} />
                {l}
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        {/* ── İçerik alanı ─────────────────────────────────────────────────── */}
        <div style={{ padding: sm ? '16px' : '28px 32px' }}>

        {/* Dashboard */}
        {tab === 'dashboard' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
              <a
                href="https://console.firebase.google.com/project/muadilci-890e4/analytics/overview"
                target="_blank"
                rel="noopener noreferrer"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', padding: '8px 16px', borderRadius: '9px', background: '#FF6D00', color: '#fff', fontSize: '13px', fontWeight: 600, textDecoration: 'none', fontFamily: F, transition: 'opacity .15s' }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.85')}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
              >
                <svg width="16" height="16" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6 26L13.5 5l4.5 9.5L22 12l4 14H6z" fill="#fff" fillOpacity=".9"/></svg>
                Firebase Analytics
              </a>
            </div>
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
            </div>
          </div>
        )}

        {/* Users */}
        {tab === 'users' && (() => {
          const fmtTs = (ts) => ts?.toDate ? ts.toDate().toLocaleString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';
          const allSorted = [...users].sort((a, b) => {
            const ta = a.createdAt?.toDate?.() ?? new Date(0);
            const tb = b.createdAt?.toDate?.() ?? new Date(0);
            return tb - ta;
          });
          const q = userQuery.trim().toLowerCase();
          const displayed = q
            ? allSorted.filter((u) => (u.name || '').toLowerCase().includes(q) || (u.email || '').toLowerCase().includes(q) || (RL[u.role] || '').toLowerCase().includes(q))
            : allSorted.slice(0, 10);
          const submitSearch = () => setUserQuery(userInput);
          return (
            <Card style={{ overflow: 'hidden' }}>
              <div style={{ padding: '14px 18px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
                <span style={{ fontWeight: 700, color: C.navy }}>
                  Kullanıcılar
                  <span style={{ fontWeight: 400, fontSize: '13px', color: C.textLight, marginLeft: '8px' }}>
                    {q ? `${displayed.length} sonuç` : `Son ${displayed.length} üye`}
                  </span>
                </span>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <div style={{ position: 'relative' }}>
                    <input
                      value={userInput}
                      onChange={(e) => setUserInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && submitSearch()}
                      placeholder="İsim veya e-posta ara…"
                      style={{ height: '34px', padding: '0 10px', paddingRight: userInput ? '60px' : '10px', border: `1px solid ${C.border}`, borderRadius: '8px', fontSize: '13px', color: C.text, background: '#fff', outline: 'none', fontFamily: F, width: '220px' }}
                    />
                    {userInput && (
                      <button onClick={() => { setUserInput(''); setUserQuery(''); }} style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', fontSize: '11px', color: C.textLight, background: 'none', border: 'none', cursor: 'pointer', fontFamily: F, padding: '2px 4px' }}>Temizle</button>
                    )}
                  </div>
                  <Btn size="sm" onClick={submitSearch}>Ara</Btn>
                </div>
              </div>
              <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                <table style={{ width: '100%', minWidth: '700px', borderCollapse: 'collapse' }}>
                  <thead><tr style={{ background: '#f9f9fb' }}>
                    <th style={thBase}>Kullanıcı</th>
                    <th style={thBase}>E-posta</th>
                    <th style={thBase}>Rol</th>
                    <th style={thBase}>Durum</th>
                    <th style={thBase}>Üyelik Tarihi</th>
                    <th style={thBase}>Silinme Tarihi</th>
                    <th style={thStyle}>İşlemler</th>
                  </tr></thead>
                  <tbody>
                    {displayed.map((u) => (
                      <tr key={u.id} style={{ borderBottom: `1px solid ${C.borderLight}`, opacity: u.deleted ? 0.6 : 1 }} onMouseEnter={(e) => (e.currentTarget.style.background = '#fafafa')} onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}>
                        <td style={tdStyle}>
                          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                            <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: `linear-gradient(135deg,${C.gold},${C.goldLight})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', color: '#fff', fontWeight: 700, overflow: 'hidden', flexShrink: 0 }}>
                              {u.photoURL
                                ? <img src={u.photoURL} alt={u.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                                : (u.avatar?.length === 1 ? u.avatar : u.name?.[0]?.toUpperCase() || '?')
                              }
                            </div>
                            <button onClick={() => setSelUser(u)} style={{ fontWeight: 600, fontSize: '14px', color: C.navy, background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', fontFamily: F }}>{u.name || '—'}</button>
                          </div>
                        </td>
                        <td style={{ ...tdStyle, fontSize: '13px', color: C.textMid }}>{u.email}</td>
                        <td style={tdStyle}><Badge color={RC[u.role] || 'gold'}>{RL[u.role] || u.role}</Badge></td>
                        <td style={tdStyle}>
                          {u.deleted
                            ? <Badge color="gray">Silindi</Badge>
                            : <Badge color={u.role === 'admin' || u.active ? 'green' : 'red'}>{u.role === 'admin' || u.active ? 'Aktif' : 'Dondurulmuş'}</Badge>
                          }
                        </td>
                        <td style={{ ...tdStyle, fontSize: '12px', color: C.textMid, whiteSpace: 'nowrap' }}>{fmtTs(u.createdAt)}</td>
                        <td style={{ ...tdStyle, fontSize: '12px', color: u.deletedAt ? '#e55' : C.textLight, whiteSpace: 'nowrap' }}>{fmtTs(u.deletedAt)}</td>
                        <td style={tdStyle}>
                          {u.role !== 'admin' && !u.deleted && (
                            sm ? (
                              <Btn size="sm" variant="navy" style={{ whiteSpace: 'nowrap' }} onClick={() => setUam({ open: true, user: u, step: 'actions', action: null, loading: false, error: '' })}>İşlem Yap</Btn>
                            ) : (
                              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                <Btn size="sm" variant={u.role === 'moderator' ? 'orange' : 'navy'} onClick={() => updateUser(u.id, { role: u.role === 'moderator' ? 'user' : 'moderator' })}>{u.role === 'moderator' ? 'Mod. Al' : 'Mod. Ver'}</Btn>
                                <Btn size="sm" variant={u.active ? 'danger' : 'success'} onClick={() => updateUser(u.id, { active: !u.active })}>{u.active ? 'Dondur' : 'Aktif Et'}</Btn>
                                <Btn size="sm" variant="danger" onClick={() => setUam({ open: true, user: u, step: 'confirm', action: 'delete', loading: false, error: '' })}>Sil</Btn>
                              </div>
                            )
                          )}
                        </td>
                      </tr>
                    ))}
                    {!displayed.length && <tr><td colSpan={7} style={{ ...tdStyle, textAlign: 'center', color: C.textLight, padding: '32px' }}>Sonuç bulunamadı.</td></tr>}
                  </tbody>
                </table>
              </div>
            </Card>
          );
        })()}

        {/* Original / Muadil Brands */}
        {(tab === 'original-brands' || tab === 'muadil-brands') && (() => {
          const isOrig = tab === 'original-brands';
          const baseBrands = isOrig ? baseOrigBrands : baseMuadilBrands;
          const sorted = isOrig ? sortedOrigBrands : sortedMuadilBrands;
          return (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                {selectedIds.size > 0 ? (
                  <Btn variant="danger" onClick={openBulkDel}>Seçilenleri Sil ({selectedIds.size})</Btn>
                ) : <div />}
                <Btn onClick={() => { setBf({ name: '', slug: '', type: isOrig ? 'original' : 'muadil', origin: '', founded: '', logo: '', logoImage: '', category: 'Designer', bio: '' }); setShowBM(true); }}>+ Marka Ekle</Btn>
              </div>
              <Card style={{ overflow: 'hidden' }}>
                <div style={{ padding: '14px 18px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontWeight: 700, color: C.navy }}>{isOrig ? 'Orijinal Markalar' : 'Muadil Markalar'}</span>
                  <button onClick={() => setExportModal(true)} style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '5px 10px', borderRadius: '7px', border: `1px solid ${C.border}`, background: '#fff', color: C.textMid, fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: F }}>
                    <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                    Listeye Aktar
                  </button>
                  <button onClick={handleRefresh} disabled={refreshing} style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '5px 10px', borderRadius: '7px', border: `1px solid ${C.border}`, background: '#fff', color: C.textMid, fontSize: '12px', fontWeight: 600, cursor: refreshing ? 'default' : 'pointer', fontFamily: F, opacity: refreshing ? 0.6 : 1 }}>
                    <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ animation: refreshing ? 'spin 0.8s linear infinite' : 'none' }}><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
                    {refreshing ? 'Yenileniyor…' : 'Yenile'}
                  </button>
                </div>
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
                        <td style={tdStyle}><div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}><div style={{ width: '30px', height: '30px', borderRadius: '7px', background: C.goldBg, border: `1px solid ${C.goldBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 700, color: C.gold, overflow: 'hidden' }}>{b.logoImage ? <img src={b.logoImage} alt={b.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : b.logo}</div><div><a href={`/marka/${b.slug}`} onClick={(e) => { if (e.button !== 0) return; e.preventDefault(); e.stopPropagation(); navigate(`/marka/${b.slug}`); }} style={{ fontWeight: 600, fontSize: '14px', color: C.navy, cursor: 'pointer', textDecoration: 'none' }}>{b.name}</a><div style={{ fontSize: '11px', color: C.textLight }}>/{b.slug}</div></div></div></td>
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
          const sorted = sortedPerfs;
          const totalPages = Math.ceil(sorted.length / PERF_PER_PAGE);
          const safePage = Math.min(perfPage, totalPages || 1);
          const pageItems = sorted.slice((safePage - 1) * PERF_PER_PAGE, safePage * PERF_PER_PAGE);
          return (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                {selectedIds.size > 0 ? (
                  <Btn variant="danger" onClick={openBulkDel}>Seçilenleri Sil ({selectedIds.size})</Btn>
                ) : <div />}
                <Btn onClick={() => setShowPM(true)}>+ Parfüm Ekle</Btn>
              </div>
              <Card style={{ overflow: 'hidden' }}>
                <div style={{ padding: '14px 18px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                  <span style={{ fontWeight: 700, color: C.navy }}>Orijinal Parfümler</span>
                  <button onClick={() => setExportModal(true)} style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '5px 10px', borderRadius: '7px', border: `1px solid ${C.border}`, background: '#fff', color: C.textMid, fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: F }}>
                    <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                    Listeye Aktar
                  </button>
                  <button ref={refreshBtnRef} onClick={handleRefresh} disabled={refreshing} style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '5px 10px', borderRadius: '7px', border: `1px solid ${C.border}`, background: '#fff', color: C.textMid, fontSize: '12px', fontWeight: 600, cursor: refreshing ? 'default' : 'pointer', fontFamily: F, opacity: refreshing ? 0.6 : 1 }}>
                    <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ animation: refreshing ? 'spin 0.8s linear infinite' : 'none' }}><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
                    {refreshing ? 'Yenileniyor…' : 'Yenile'}
                  </button>
                  {(() => {
                      const list = ['', ...perfBrandList];
                      const idx = list.indexOf(perfBrandFilter);
                      const btnBase = { display: 'flex', alignItems: 'center', justifyContent: 'center', width: '22px', height: '22px', border: 'none', background: 'transparent', cursor: 'pointer', color: C.textMid, padding: 0, transition: 'color .15s' };
                      return (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginLeft: 'auto' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', border: `1.5px solid ${C.border}`, borderRadius: '8px', overflow: 'hidden', background: '#fff' }}>
                            <button onClick={() => { setPerfBrandFilter(list[(idx - 1 + list.length) % list.length]); setPerfPage(1); }} title="Önceki marka" style={{ ...btnBase, borderBottom: `1px solid ${C.border}` }} onMouseEnter={e => e.currentTarget.style.color = C.gold} onMouseLeave={e => e.currentTarget.style.color = C.textMid}>
                              <FontAwesomeIcon icon={faChevronUp} style={{ fontSize: '9px' }} />
                            </button>
                            <button onClick={() => { setPerfBrandFilter(list[(idx + 1) % list.length]); setPerfPage(1); }} title="Sonraki marka" style={btnBase} onMouseEnter={e => e.currentTarget.style.color = C.gold} onMouseLeave={e => e.currentTarget.style.color = C.textMid}>
                              <FontAwesomeIcon icon={faChevronDown} style={{ fontSize: '9px' }} />
                            </button>
                          </div>
                          <svg width="13" height="13" fill="none" stroke={C.textLight} strokeWidth="2" viewBox="0 0 24 24"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
                          <select
                            value={perfBrandFilter}
                            onChange={(e) => { setPerfBrandFilter(e.target.value); setPerfPage(1); }}
                            style={{ height: '32px', border: `1.5px solid ${perfBrandFilter ? C.navy : C.border}`, borderRadius: '8px', fontSize: '13px', color: perfBrandFilter ? C.navy : C.textLight, background: perfBrandFilter ? '#eef2ff' : '#fff', padding: '0 10px', fontFamily: F, cursor: 'pointer', outline: 'none', fontWeight: perfBrandFilter ? 700 : 400 }}
                          >
                            <option value="">Tüm Markalar</option>
                            {perfBrandList.map((b) => <option key={b} value={b}>{b}</option>)}
                          </select>
                          {perfBrandFilter && (
                            <button onClick={() => { setPerfBrandFilter(''); setPerfPage(1); }} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '24px', height: '24px', borderRadius: '50%', border: 'none', background: '#e5e7eb', cursor: 'pointer', color: C.text, fontSize: '14px', lineHeight: 1, fontFamily: F }}>×</button>
                          )}
                        </div>
                      );
                  })()}
                </div>
                <SearchBar deferred value={search} onChange={(v) => { setSearch(v); setPerfPage(1); }} placeholder="Parfüm adı, marka veya cinsiyet ara…" count={sorted.length} total={perfumes.length} />
                <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                <table style={{ width: '100%', minWidth: '620px', borderCollapse: 'collapse' }}>
                  <thead><tr style={{ background: '#f9f9fb' }}>
                    <th style={{ ...thBase, width: '40px' }}>
                      <input type="checkbox" checked={sorted.length > 0 && sorted.every((p) => selectedIds.has(p.id))} onChange={() => toggleAll(sorted.map((p) => p.id))} />
                    </th>
                    <SortTh label="Parfüm" sortKey="name" sort={sort} onSort={toggleSort} />
                    <th style={{ ...thStyle, width: '70px' }} />
                    <SortTh label="Marka" sortKey="brandName" sort={sort} onSort={toggleSort} />
                    <th style={thStyle}>URL</th>
                    <SortTh label="Cinsiyet" sortKey="gender" sort={sort} onSort={toggleSort} />
                    <SortTh label="Muadil Sayısı" sortKey="muadilCount" sort={sort} onSort={toggleSort} />
                    <th style={thStyle}>İşlem</th>
                  </tr></thead>
                  <tbody>
                    {pageItems.map((p) => (
                      <tr key={p.id} style={{ borderBottom: `1px solid ${C.borderLight}`, background: selectedIds.has(p.id) ? '#fffbeb' : 'transparent' }} onMouseEnter={(e) => { if (!selectedIds.has(p.id)) e.currentTarget.style.background = '#fafafa'; }} onMouseLeave={(e) => { e.currentTarget.style.background = selectedIds.has(p.id) ? '#fffbeb' : 'transparent'; }}>
                        <td style={{ ...tdStyle, width: '40px' }}><input type="checkbox" checked={selectedIds.has(p.id)} onChange={() => toggleSelect(p.id)} /></td>
                        <td style={{ ...tdStyle, fontWeight: 600, fontSize: '14px' }}><a href={`/${p.brandSlug}/${p.slug}`} onClick={(e) => { if (e.button !== 0 || e.ctrlKey || e.metaKey || e.shiftKey) return; e.preventDefault(); e.stopPropagation(); navigate(`/${p.brandSlug}/${p.slug}`); }} style={{ fontWeight: 600, fontSize: '14px', color: C.navy, cursor: 'pointer', textDecoration: 'none' }}>{p.name}</a></td>
                        <td style={{ ...tdStyle, width: '70px', padding: '0 4px' }}>
                          <div style={{ display: 'flex', gap: '4px' }}>
                            <CopyBtn text={p.name} title="Parfüm adını kopyala" />
                            <CopyBtn text={`${p.brandName} ${p.name}`} title="Marka + parfüm adını kopyala" variant="brand" />
                          </div>
                        </td>
                        <td style={{ ...tdStyle, fontSize: '13px' }}><a href={`/marka/${p.brandSlug}`} onClick={(e) => { if (e.button !== 0 || e.ctrlKey || e.metaKey || e.shiftKey) return; e.preventDefault(); e.stopPropagation(); navigate(`/marka/${p.brandSlug}`); }} style={{ fontSize: '13px', color: C.textMid, cursor: 'pointer', textDecoration: 'none' }}>{p.brandName}</a></td>
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
                {totalPages > 1 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 18px', borderTop: `1px solid ${C.border}`, flexWrap: 'wrap', gap: '8px' }}>
                    <span style={{ fontSize: '12px', color: C.textLight }}>{(safePage - 1) * PERF_PER_PAGE + 1}–{Math.min(safePage * PERF_PER_PAGE, sorted.length)} / {sorted.length} kayıt</span>
                    <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                      <button onClick={() => setPerfPage(p => Math.max(1, p - 1))} disabled={safePage === 1} style={{ padding: '5px 10px', borderRadius: '7px', border: `1px solid ${C.border}`, background: C.card, color: safePage === 1 ? C.textLight : C.text, cursor: safePage === 1 ? 'default' : 'pointer', fontSize: '13px', fontFamily: F }}>‹</button>
                      {Array.from({ length: totalPages }, (_, i) => i + 1).filter(n => n === 1 || n === totalPages || Math.abs(n - safePage) <= 1).reduce((acc, n, idx, arr) => { if (idx > 0 && n - arr[idx - 1] > 1) acc.push('…'); acc.push(n); return acc; }, []).map((n, i) => n === '…' ? (
                        <span key={`e${i}`} style={{ padding: '0 4px', color: C.textLight, fontSize: '13px' }}>…</span>
                      ) : (
                        <button key={n} onClick={() => setPerfPage(n)} style={{ padding: '5px 10px', borderRadius: '7px', border: `1px solid ${n === safePage ? C.navy : C.border}`, background: n === safePage ? C.navy : C.card, color: n === safePage ? '#fff' : C.text, cursor: 'pointer', fontSize: '13px', fontWeight: n === safePage ? 700 : 400, fontFamily: F }}>{n}</button>
                      ))}
                      <button onClick={() => setPerfPage(p => Math.min(totalPages, p + 1))} disabled={safePage === totalPages} style={{ padding: '5px 10px', borderRadius: '7px', border: `1px solid ${C.border}`, background: C.card, color: safePage === totalPages ? C.textLight : C.text, cursor: safePage === totalPages ? 'default' : 'pointer', fontSize: '13px', fontFamily: F }}>›</button>
                    </div>
                  </div>
                )}
              </Card>
            </div>
          );
        })()}

        {/* Muadil */}
        {tab === 'muadil' && (() => {
          const baseMuadil = muadilPerfumes.map((m) => { const ms = calcScores(m.id, comments); return { ...m, overall: ms.overall ?? -1, commentCount: ms.count }; });
          const muadilBrandList = Array.from(new Set(muadilPerfumes.map((m) => m.brandName).filter(Boolean))).sort((a, b) => a.localeCompare(b, 'tr'));
          const q = search.toLowerCase();
          const filtered = baseMuadil.filter((m) =>
            (!muadilBrandFilter || m.brandName === muadilBrandFilter) &&
            (!q || m.name.toLowerCase().includes(q) || m.brandName.toLowerCase().includes(q) || (m.targetPerfumeName || '').toLowerCase().includes(q) || (m.targetBrandName || '').toLowerCase().includes(q))
          );
          const sorted = applySort(filtered, (m, k) => ({ name: m.name, brandName: m.brandName, targetPerfumeName: `${m.targetBrandName} ${m.targetPerfumeName}`, overall: m.overall, commentCount: m.commentCount })[k]);
          const totalPages = Math.ceil(sorted.length / PERF_PER_PAGE);
          const safePage = Math.min(muadilPage, totalPages || 1);
          const pageItems = sorted.slice((safePage - 1) * PERF_PER_PAGE, safePage * PERF_PER_PAGE);
          return (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                {selectedIds.size > 0 ? (
                  <Btn variant="danger" onClick={openBulkDel}>Seçilenleri Sil ({selectedIds.size})</Btn>
                ) : <div />}
                <Btn onClick={() => setShowMM(true)}>+ Muadil Parfüm Ekle</Btn>
              </div>
              <Card style={{ overflow: 'hidden' }}>
                <div style={{ padding: '14px 18px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                  <span style={{ fontWeight: 700, color: C.navy }}>Muadil Parfümler</span>
                  {(() => {
                      const list = ['', ...muadilBrandList];
                      const idx = list.indexOf(muadilBrandFilter);
                      const btnBase = { display: 'flex', alignItems: 'center', justifyContent: 'center', width: '22px', height: '22px', border: 'none', background: 'transparent', cursor: 'pointer', color: C.textMid, padding: 0, transition: 'color .15s' };
                      return (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginLeft: 'auto' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', border: `1.5px solid ${C.border}`, borderRadius: '8px', overflow: 'hidden', background: '#fff' }}>
                            <button onClick={() => { setMuadilBrandFilter(list[(idx - 1 + list.length) % list.length]); setMuadilPage(1); }} title="Önceki marka" style={{ ...btnBase, borderBottom: `1px solid ${C.border}` }} onMouseEnter={e => e.currentTarget.style.color = C.gold} onMouseLeave={e => e.currentTarget.style.color = C.textMid}>
                              <FontAwesomeIcon icon={faChevronUp} style={{ fontSize: '9px' }} />
                            </button>
                            <button onClick={() => { setMuadilBrandFilter(list[(idx + 1) % list.length]); setMuadilPage(1); }} title="Sonraki marka" style={btnBase} onMouseEnter={e => e.currentTarget.style.color = C.gold} onMouseLeave={e => e.currentTarget.style.color = C.textMid}>
                              <FontAwesomeIcon icon={faChevronDown} style={{ fontSize: '9px' }} />
                            </button>
                          </div>
                          <svg width="13" height="13" fill="none" stroke={C.textLight} strokeWidth="2" viewBox="0 0 24 24"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
                          <select
                            value={muadilBrandFilter}
                            onChange={(e) => { setMuadilBrandFilter(e.target.value); setMuadilPage(1); }}
                            style={{ height: '32px', border: `1.5px solid ${muadilBrandFilter ? C.navy : C.border}`, borderRadius: '8px', fontSize: '13px', color: muadilBrandFilter ? C.navy : C.textLight, background: muadilBrandFilter ? '#eef2ff' : '#fff', padding: '0 10px', fontFamily: F, cursor: 'pointer', outline: 'none', fontWeight: muadilBrandFilter ? 700 : 400 }}
                          >
                            <option value="">Tüm Markalar</option>
                            {muadilBrandList.map((b) => <option key={b} value={b}>{b}</option>)}
                          </select>
                          {muadilBrandFilter && (
                            <button onClick={() => { setMuadilBrandFilter(''); setMuadilPage(1); }} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '24px', height: '24px', borderRadius: '50%', border: 'none', background: '#e5e7eb', cursor: 'pointer', color: C.text, fontSize: '14px', lineHeight: 1, fontFamily: F }}>×</button>
                          )}
                        </div>
                      );
                  })()}
                </div>
                <SearchBar deferred value={search} onChange={(v) => { setSearch(v); setMuadilPage(1); }} placeholder="Muadil adı, marka veya hedef parfüm ara…" count={sorted.length} total={muadilPerfumes.length} />
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
                    {pageItems.map((m) => (
                      <tr key={m.id} style={{ borderBottom: `1px solid ${C.borderLight}`, background: selectedIds.has(m.id) ? '#fffbeb' : 'transparent' }} onMouseEnter={(e) => { if (!selectedIds.has(m.id)) e.currentTarget.style.background = '#fafafa'; }} onMouseLeave={(e) => { e.currentTarget.style.background = selectedIds.has(m.id) ? '#fffbeb' : 'transparent'; }}>
                        <td style={{ ...tdStyle, width: '40px' }}><input type="checkbox" checked={selectedIds.has(m.id)} onChange={() => toggleSelect(m.id)} /></td>
                        <td style={{ ...tdStyle, fontWeight: 600, fontSize: '14px' }}><a href={`/karsilastir?orijinal=${m.targetPerfumeId}&muadil=${m.id}`} onClick={(e) => { if (e.button !== 0 || e.ctrlKey || e.metaKey || e.shiftKey) return; e.preventDefault(); e.stopPropagation(); navigate(`/karsilastir?orijinal=${m.targetPerfumeId}&muadil=${m.id}`); }} style={{ fontWeight: 600, fontSize: '14px', color: C.navy, cursor: 'pointer', textDecoration: 'none' }}>{m.name}</a></td>
                        <td style={{ ...tdStyle, fontSize: '13px' }}><a href={`/marka/${m.brandSlug}`} onClick={(e) => { if (e.button !== 0 || e.ctrlKey || e.metaKey || e.shiftKey) return; e.preventDefault(); e.stopPropagation(); navigate(`/marka/${m.brandSlug}`); }} style={{ fontSize: '13px', color: C.textMid, cursor: 'pointer', textDecoration: 'none' }}>{m.brandName}</a></td>
                        <td style={{ ...tdStyle, fontSize: '13px', color: C.textMid }}>{(() => { const tp = perfumes.find((x) => String(x.id) === String(m.targetPerfumeId)); return tp ? <a href={`/${tp.brandSlug}/${tp.slug}`} onClick={(e) => { if (e.button !== 0 || e.ctrlKey || e.metaKey || e.shiftKey) return; e.preventDefault(); e.stopPropagation(); navigate(`/${tp.brandSlug}/${tp.slug}`); }} style={{ fontSize: '13px', color: C.textMid, cursor: 'pointer', textDecoration: 'none' }}>{m.targetBrandName} — {m.targetPerfumeName}</a> : <span>{m.targetBrandName} — {m.targetPerfumeName}</span>; })()}</td>
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
                {totalPages > 1 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 18px', borderTop: `1px solid ${C.border}`, flexWrap: 'wrap', gap: '8px' }}>
                    <span style={{ fontSize: '12px', color: C.textLight }}>{(safePage - 1) * PERF_PER_PAGE + 1}–{Math.min(safePage * PERF_PER_PAGE, sorted.length)} / {sorted.length} kayıt</span>
                    <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                      <button onClick={() => setMuadilPage(p => Math.max(1, p - 1))} disabled={safePage === 1} style={{ padding: '5px 10px', borderRadius: '7px', border: `1px solid ${C.border}`, background: C.card, color: safePage === 1 ? C.textLight : C.text, cursor: safePage === 1 ? 'default' : 'pointer', fontSize: '13px', fontFamily: F }}>‹</button>
                      {Array.from({ length: totalPages }, (_, i) => i + 1).filter(n => n === 1 || n === totalPages || Math.abs(n - safePage) <= 1).reduce((acc, n, idx, arr) => { if (idx > 0 && n - arr[idx - 1] > 1) acc.push('…'); acc.push(n); return acc; }, []).map((n, i) => n === '…' ? (
                        <span key={`e${i}`} style={{ padding: '0 4px', color: C.textLight, fontSize: '13px' }}>…</span>
                      ) : (
                        <button key={n} onClick={() => setMuadilPage(n)} style={{ padding: '5px 10px', borderRadius: '7px', border: `1px solid ${n === safePage ? C.navy : C.border}`, background: n === safePage ? C.navy : C.card, color: n === safePage ? '#fff' : C.text, cursor: 'pointer', fontSize: '13px', fontWeight: n === safePage ? 700 : 400, fontFamily: F }}>{n}</button>
                      ))}
                      <button onClick={() => setMuadilPage(p => Math.min(totalPages, p + 1))} disabled={safePage === totalPages} style={{ padding: '5px 10px', borderRadius: '7px', border: `1px solid ${C.border}`, background: C.card, color: safePage === totalPages ? C.textLight : C.text, cursor: safePage === totalPages ? 'default' : 'pointer', fontSize: '13px', fontFamily: F }}>›</button>
                    </div>
                  </div>
                )}
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

        {tab === 'activity' && <ActivityTab />}

        {tab === 'merge-perfumes' && (
          <MergePerfumesTab
            perfumes={perfumes} muadilPerfumes={muadilPerfumes}
            pairs={mergePairs} setPairs={setMergePairs}
            running={mergeRunning} setRunning={setMergeRunning}
            progress={mergeProgress} setProgress={setMergeProgress}
            results={mergeResults} setResults={setMergeResults}
            onRefresh={async () => { await refreshPerfumes(); await refreshMuadils(); }}
          />
        )}
        </div>{/* kapanış: içerik alanı */}
      </div>{/* kapanış: flex wrapper */}

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
            <Btn variant="danger" onClick={() => setIam((s) => ({ ...s, step: 'confirm', error: '' }))}>Sil</Btn>
          </div>
        )}
        {iam.item && iam.step === 'confirm' && (
          <div>
            <div style={{ marginBottom: '16px', padding: '12px 16px', background: '#fff5f5', border: '1px solid #fecaca', borderRadius: '10px', fontSize: '13px', color: C.red, lineHeight: 1.6 }}>
              <strong>"{iam.item.name}"</strong> kalıcı olarak silinecek. Bu işlem geri alınamaz.
              {iam.withMuadils && <><br /><strong>Dikkat:</strong> Bağlı bulunduğu muadillerle birlikte silinecektir.</>}
            </div>
            {iam.itemType === 'perfume' && (
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px', padding: '10px 14px', background: iam.withMuadils ? '#fff5f5' : '#f9f9fb', border: `1px solid ${iam.withMuadils ? '#fecaca' : C.border}`, borderRadius: '10px', cursor: 'pointer', fontSize: '13px', fontWeight: 600, color: iam.withMuadils ? C.red : C.textMid, transition: 'all .15s' }}>
                <input
                  type="checkbox"
                  checked={iam.withMuadils}
                  onChange={(e) => {
                    if (iamPwRef.current) iamPwRef.current.value = '';
                    setIam((s) => ({ ...s, withMuadils: e.target.checked, error: '' }));
                  }}
                  style={{ width: '16px', height: '16px', accentColor: C.red, cursor: 'pointer', flexShrink: 0 }}
                />
                Bağlı muadil parfümleri de sil ({muadilPerfumes.filter((m) => String(m.targetPerfumeId) === String(iam.item.id)).length} adet)
              </label>
            )}
            <div style={{ marginBottom: '8px', fontSize: '13px', fontWeight: 600, color: C.navy }}>Admin Şifresi</div>
            <input
              key={iam.item?.id + iam.withMuadils}
              ref={iamPwRef}
              type="password"
              onChange={() => { if (iam.error) setIam((s) => ({ ...s, error: '' })); }}
              onKeyDown={(e) => e.key === 'Enter' && !iam.loading && handleIamDelete()}
              placeholder="Şifrenizi girin"
              autoFocus
              style={{ width: '100%', padding: '10px 14px', border: `1px solid ${iam.error ? C.red : C.border}`, borderRadius: '10px', fontSize: '14px', fontFamily: F, outline: 'none', boxSizing: 'border-box', marginBottom: '6px' }}
            />
            {iam.error && <div style={{ fontSize: '12px', color: C.red, marginBottom: '10px' }}>{iam.error}</div>}
            <div style={{ display: 'flex', gap: '10px', marginTop: '16px', justifyContent: 'flex-end' }}>
              <Btn variant="ghost" onClick={() => setIam((s) => ({ ...s, step: 'actions', error: '' }))} disabled={iam.loading}>Geri</Btn>
              <Btn variant="danger" onClick={handleIamDelete} disabled={iam.loading}>
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
              key={uam.user?.id + uam.action}
              ref={uamPwRef}
              type="password"
              onChange={() => { if (uam.error) setUam((s) => ({ ...s, error: '' })); }}
              onKeyDown={(e) => e.key === 'Enter' && !uam.loading && handleUamSubmit()}
              placeholder="Şifrenizi girin"
              autoFocus
              style={{ width: '100%', padding: '10px 14px', border: `1px solid ${uam.error ? C.red : C.border}`, borderRadius: '10px', fontSize: '14px', fontFamily: F, outline: 'none', boxSizing: 'border-box', marginBottom: '6px' }}
            />
            {uam.error && <div style={{ fontSize: '12px', color: C.red, marginBottom: '10px' }}>{uam.error}</div>}
            <div style={{ display: 'flex', gap: '10px', marginTop: '16px', justifyContent: 'flex-end' }}>
              <Btn variant={uam.action === 'delete' ? 'danger' : 'primary'} onClick={handleUamSubmit} disabled={uam.loading}>
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

      {/* Export Modalı */}
      <Modal open={exportModal} onClose={() => setExportModal(false)} title="Listeyi Dışa Aktar" width="360px">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <p style={{ fontSize: '13px', color: C.textMid, marginBottom: '4px' }}>
            Şu an görünen <strong>{
              tab === 'perfumes' ? sortedPerfs.length :
              tab === 'original-brands' ? sortedOrigBrands.length :
              sortedMuadilBrands.length
            } kayıt</strong> hangi formatta aktarılsın?
          </p>
          <Btn variant="primary" onClick={exportExcel} style={{ justifyContent: 'center' }}>
            Excel (.xlsx)
          </Btn>
          <Btn variant="ghost" onClick={exportCSV} style={{ justifyContent: 'center' }}>
            CSV (.csv)
          </Btn>
          <Btn variant="ghost" onClick={exportPDF} style={{ justifyContent: 'center' }}>
            PDF (yazdır)
          </Btn>
        </div>
      </Modal>

      {/* Toplu Silme Şifre Modalı */}
      {(() => {
        const selPerfumes = tab === 'perfumes'
          ? basePerfumes.filter((p) => selectedIds.has(p.id))
          : [];
        const totalMuadils = selPerfumes.reduce((acc, p) => acc + (p.muadilCount || 0), 0);
        return (
          <Modal open={bulkDel.open} onClose={closeBulkDel} title="Toplu Silme Onayı" width="460px">
            <div style={{ marginBottom: '14px', padding: '12px 16px', background: '#fff5f5', border: '1px solid #fecaca', borderRadius: '10px', fontSize: '13px', color: C.red, lineHeight: 1.6 }}>
              {tab === 'perfumes' ? (
                <>
                  <strong>{selectedIds.size} parfüm</strong>
                  {totalMuadils > 0 && <> ve bağlı <strong>{totalMuadils} muadil</strong></>}
                  {' '}kalıcı olarak silinecek. Bu işlem geri alınamaz. Devam etmek için admin şifrenizi girin.
                </>
              ) : (
                <><strong>{selectedIds.size} kayıt</strong> kalıcı olarak silinecek. Bu işlem geri alınamaz. Devam etmek için admin şifrenizi girin.</>
              )}
            </div>

            {tab === 'perfumes' && selPerfumes.length > 0 && (
              <div style={{ marginBottom: '14px', border: `1px solid ${C.border}`, borderRadius: '10px', overflow: 'hidden', maxHeight: '220px', overflowY: 'auto' }}>
                {selPerfumes.map((p, i) => (
                  <div key={p.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 14px', borderBottom: i < selPerfumes.length - 1 ? `1px solid ${C.borderLight}` : 'none', background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: C.navy, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
                      <div style={{ fontSize: '11px', color: C.textLight }}>{p.brandName}</div>
                    </div>
                    <div style={{ flexShrink: 0, marginLeft: '12px' }}>
                      {p.muadilCount > 0
                        ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#fff5f5', border: '1px solid #fecaca', borderRadius: '6px', padding: '2px 8px', fontSize: '11px', fontWeight: 700, color: C.red }}>{p.muadilCount} muadil silinecek</span>
                        : <span style={{ fontSize: '11px', color: C.textLight }}>muadil yok</span>
                      }
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div style={{ marginBottom: '8px', fontSize: '13px', fontWeight: 600, color: C.navy }}>Admin Şifresi</div>
            <input
              key={bulkDel.open}
              ref={bulkDelPwRef}
              type="password"
              onChange={() => { if (bulkDel.error) setBulkDel((s) => ({ ...s, error: '' })); }}
              onKeyDown={(e) => e.key === 'Enter' && !bulkDel.loading && handleBulkDelete()}
              placeholder="Şifrenizi girin"
              autoFocus
              style={{ width: '100%', padding: '10px 14px', border: `1px solid ${bulkDel.error ? C.red : C.border}`, borderRadius: '10px', fontSize: '14px', fontFamily: F, outline: 'none', boxSizing: 'border-box', marginBottom: '8px' }}
            />
            {bulkDel.error && <div style={{ fontSize: '12px', color: C.red, marginBottom: '12px' }}>{bulkDel.error}</div>}
            <div style={{ display: 'flex', gap: '10px', marginTop: '16px', justifyContent: 'flex-end' }}>
              <Btn variant="ghost" onClick={closeBulkDel} disabled={bulkDel.loading}>İptal</Btn>
              <Btn variant="danger" onClick={handleBulkDelete} disabled={bulkDel.loading}>
                {bulkDel.loading ? 'Siliniyor…' : tab === 'perfumes'
                  ? `${selectedIds.size} Parfüm${totalMuadils > 0 ? ` + ${totalMuadils} Muadil` : ''} Sil`
                  : `${selectedIds.size} Kaydı Sil`}
              </Btn>
            </div>
          </Modal>
        );
      })()}

      {/* Yorum Silme Şifre Modalı (tekli + çoklu) */}
      <Modal open={revDel.open} onClose={closeRevDel} title={revDel.ids.length > 1 ? 'Yorumları Sil' : 'Yorumu Sil'} width="420px">
        <div style={{ marginBottom: '16px', padding: '12px 16px', background: '#fff5f5', border: '1px solid #fecaca', borderRadius: '10px', fontSize: '13px', color: C.red, lineHeight: 1.6 }}>
          <strong>{revDel.ids.length} yorum</strong> kalıcı olarak silinecek. Bu işlem geri alınamaz. Devam etmek için admin şifrenizi girin.
        </div>
        <div style={{ marginBottom: '8px', fontSize: '13px', fontWeight: 600, color: C.navy }}>Admin Şifresi</div>
        <input
          key={revDel.open + revDel.ids.join()}
          ref={revDelPwRef}
          type="password"
          onChange={() => { if (revDel.error) setRevDel((s) => ({ ...s, error: '' })); }}
          onKeyDown={(e) => e.key === 'Enter' && !revDel.loading && handleRevDelete()}
          placeholder="Şifrenizi girin"
          autoFocus
          style={{ width: '100%', padding: '10px 14px', border: `1px solid ${revDel.error ? C.red : C.border}`, borderRadius: '10px', fontSize: '14px', fontFamily: F, outline: 'none', boxSizing: 'border-box', marginBottom: '8px' }}
        />
        {revDel.error && <div style={{ fontSize: '12px', color: C.red, marginBottom: '12px' }}>{revDel.error}</div>}
        <div style={{ display: 'flex', gap: '10px', marginTop: '16px', justifyContent: 'flex-end' }}>
          <Btn variant="ghost" onClick={closeRevDel} disabled={revDel.loading}>İptal</Btn>
          <Btn variant="danger" onClick={handleRevDelete} disabled={revDel.loading}>
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
      {showBM && (
        <AddBrandModal
          brands={brands}
          onClose={() => setShowBM(false)}
          onAdd={(data) => { addBrand(data); setShowBM(false); }}
        />
      )}

      {showPM && (
        <AddPerfumeModal
          brands={brands}
          perfumes={perfumes}
          onClose={() => setShowPM(false)}
          onAdd={(data) => { addPerfume(data); setShowPM(false); }}
        />
      )}

      {showMM && (
        <AddMuadilModal
          brands={brands}
          perfumes={perfumes}
          muadilPerfumes={muadilPerfumes}
          onClose={() => setShowMM(false)}
          onAdd={(data) => { addMuadil(data); setShowMM(false); }}
        />
      )}

      {/* Orijinal Parfüm Düzenle Modal */}
      {selPerf && (
        <PerfumeEditModal
          perfume={selPerf}
          brands={brands}
          onClose={() => setSelPerf(null)}
          onDelete={() => { setDelTarget({ id: selPerf.id, name: selPerf.name, type: 'perfume' }); setSelPerf(null); }}
          onSave={savePerf}
        />
      )}

      {/* Muadil Parfüm Düzenle Modal */}
      {selMuadil && (
        <MuadilEditModal
          muadil={selMuadil}
          brands={brands}
          perfumes={perfumes}
          onClose={() => setSelMuadil(null)}
          onDelete={() => { setDelTarget({ id: selMuadil.id, name: selMuadil.name, type: 'muadil' }); setSelMuadil(null); }}
          onSave={saveMuadil}
        />
      )}

      {/* Marka Düzenle Modal */}
      {selBrand && (
        <BrandEditModal
          brand={selBrand}
          onClose={() => setSelBrand(null)}
          onDelete={() => { setDelTarget({ id: selBrand.id, name: selBrand.name, type: 'brand', brandType: selBrand.type }); setSelBrand(null); }}
          onSave={saveBrand}
        />
      )}


      {/* Silme Onay Modal */}
      <Modal open={!!delTarget} onClose={() => { setDelTarget(null); setDelBrandPw({ loading: false, error: '', withMuadils: false }); }} title="Silme Onayı" width="400px">
        {delTarget && (
          <div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ width: '52px', height: '52px', borderRadius: '50%', background: '#fff5f5', border: '1px solid #fecaca', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px' }}>
                <svg width="24" height="24" fill="none" stroke={C.red} strokeWidth="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
              </div>
              <div style={{ fontSize: '16px', fontWeight: 700, color: C.navy, marginBottom: '6px', textAlign: 'center' }}>Emin misiniz?</div>
              <div style={{ fontSize: '14px', color: C.textMid, textAlign: 'center', lineHeight: 1.6 }}>
                <span style={{ fontWeight: 600, color: C.text }}>"{delTarget.name}"</span> kalıcı olarak silinecek. Bu işlem geri alınamaz.
                {delBrandPw.withMuadils && <><br /><span style={{ color: C.red, fontWeight: 700 }}>Dikkat:</span> Bağlı bulunduğu muadillerle birlikte silinecektir.</>}
              </div>
            </div>
            {delTarget.type === 'brand' ? (
              <>
                <div style={{ marginBottom: '8px', fontSize: '13px', fontWeight: 600, color: C.navy }}>Admin Şifresi</div>
                <input
                  key={delTarget.id}
                  ref={delBrandPwRef}
                  type="password"
                  onChange={() => { if (delBrandPw.error) setDelBrandPw((s) => ({ ...s, error: '' })); }}
                  onKeyDown={async (e) => {
                    if (e.key !== 'Enter' || delBrandPw.loading) return;
                    setDelBrandPw((s) => ({ ...s, loading: true, error: '' }));
                    try { await reauthenticate(delBrandPwRef.current?.value ?? ''); } catch { setDelBrandPw((s) => ({ ...s, loading: false, error: 'Şifre hatalı. Lütfen tekrar deneyin.' })); return; }
                    await deleteBrand(delTarget.id, delTarget.brandType);
                    setSelectedIds((prev) => { const n = new Set(prev); n.delete(delTarget.id); return n; });
                    setDelTarget(null); setDelBrandPw({ loading: false, error: '' });
                  }}
                  placeholder="Şifrenizi girin"
                  autoFocus
                  style={{ width: '100%', padding: '10px 14px', border: `1px solid ${delBrandPw.error ? C.red : C.border}`, borderRadius: '10px', fontSize: '14px', fontFamily: F, outline: 'none', boxSizing: 'border-box', marginBottom: '6px' }}
                />
                {delBrandPw.error && <div style={{ fontSize: '12px', color: C.red, marginBottom: '10px' }}>{delBrandPw.error}</div>}
                <div style={{ display: 'flex', gap: '10px', marginTop: '16px', justifyContent: 'flex-end' }}>
                  <Btn variant="secondary" onClick={() => { setDelTarget(null); setDelBrandPw({ loading: false, error: '' }); }} disabled={delBrandPw.loading}>Vazgeç</Btn>
                  <Btn variant="danger" disabled={delBrandPw.loading} onClick={async () => {
                    setDelBrandPw((s) => ({ ...s, loading: true, error: '' }));
                    try { await reauthenticate(delBrandPwRef.current?.value ?? ''); } catch { setDelBrandPw((s) => ({ ...s, loading: false, error: 'Şifre hatalı. Lütfen tekrar deneyin.' })); return; }
                    await deleteBrand(delTarget.id, delTarget.brandType);
                    setSelectedIds((prev) => { const n = new Set(prev); n.delete(delTarget.id); return n; });
                    setDelTarget(null); setDelBrandPw({ loading: false, error: '' });
                  }}>{delBrandPw.loading ? 'Siliniyor…' : 'Evet, Sil'}</Btn>
                </div>
              </>
            ) : (
              <>
                {delTarget.type === 'perfume' && (
                  <label style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px', padding: '10px 14px', background: delBrandPw.withMuadils ? '#fff5f5' : '#f9f9fb', border: `1px solid ${delBrandPw.withMuadils ? '#fecaca' : C.border}`, borderRadius: '10px', cursor: 'pointer', fontSize: '13px', fontWeight: 600, color: delBrandPw.withMuadils ? C.red : C.textMid, transition: 'all .15s' }}>
                    <input
                      type="checkbox"
                      checked={delBrandPw.withMuadils}
                      onChange={(e) => {
                        if (delBrandPwRef.current) delBrandPwRef.current.value = '';
                        setDelBrandPw((s) => ({ ...s, withMuadils: e.target.checked, error: '' }));
                      }}
                      style={{ width: '16px', height: '16px', accentColor: C.red, cursor: 'pointer', flexShrink: 0 }}
                    />
                    Bağlı muadil parfümleri de sil ({muadilPerfumes.filter((m) => String(m.targetPerfumeId) === String(delTarget.id)).length} adet)
                  </label>
                )}
                <div style={{ marginBottom: '8px', fontSize: '13px', fontWeight: 600, color: C.navy }}>Admin Şifresi</div>
                <input
                  key={delTarget.id + delBrandPw.withMuadils}
                  ref={delBrandPwRef}
                  type="password"
                  onChange={() => { if (delBrandPw.error) setDelBrandPw((s) => ({ ...s, error: '' })); }}
                  onKeyDown={async (e) => {
                    if (e.key !== 'Enter' || delBrandPw.loading) return;
                    setDelBrandPw((s) => ({ ...s, loading: true, error: '' }));
                    try { await reauthenticate(delBrandPwRef.current?.value ?? ''); } catch { setDelBrandPw((s) => ({ ...s, loading: false, error: 'Şifre hatalı. Lütfen tekrar deneyin.' })); return; }
                    if (delTarget.type === 'perfume') await deletePerfume(delTarget.id, delBrandPw.withMuadils);
                    else if (delTarget.type === 'muadil') await deleteMuadil(delTarget.id);
                    setSelectedIds((prev) => { const n = new Set(prev); n.delete(delTarget.id); return n; });
                    setDelTarget(null); setDelBrandPw({ loading: false, error: '', withMuadils: false });
                  }}
                  placeholder="Şifrenizi girin"
                  autoFocus
                  style={{ width: '100%', padding: '10px 14px', border: `1px solid ${delBrandPw.error ? C.red : C.border}`, borderRadius: '10px', fontSize: '14px', fontFamily: F, outline: 'none', boxSizing: 'border-box', marginBottom: '6px' }}
                />
                {delBrandPw.error && <div style={{ fontSize: '12px', color: C.red, marginBottom: '10px' }}>{delBrandPw.error}</div>}
                <div style={{ display: 'flex', gap: '10px', marginTop: '16px', justifyContent: 'flex-end' }}>
                  <Btn variant="secondary" onClick={() => { setDelTarget(null); setDelBrandPw({ loading: false, error: '', withMuadils: false }); }} disabled={delBrandPw.loading}>Vazgeç</Btn>
                  <Btn variant="danger" disabled={delBrandPw.loading} onClick={async () => {
                    setDelBrandPw((s) => ({ ...s, loading: true, error: '' }));
                    try { await reauthenticate(delBrandPwRef.current?.value ?? ''); } catch { setDelBrandPw((s) => ({ ...s, loading: false, error: 'Şifre hatalı. Lütfen tekrar deneyin.' })); return; }
                    if (delTarget.type === 'perfume') await deletePerfume(delTarget.id, delBrandPw.withMuadils);
                    else if (delTarget.type === 'muadil') await deleteMuadil(delTarget.id);
                    setSelectedIds((prev) => { const n = new Set(prev); n.delete(delTarget.id); return n; });
                    setDelTarget(null); setDelBrandPw({ loading: false, error: '', withMuadils: false });
                  }}>{delBrandPw.loading ? 'Siliniyor…' : 'Evet, Sil'}</Btn>
                </div>
              </>
            )}
          </div>
        )}
      </Modal>

      {/* ── Sabit Yenile Butonu (scroll aşıldığında) ── */}
      {showFloatingRefresh && (
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          style={{
            position: 'fixed', bottom: '28px', left: '24px',
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '10px 20px', borderRadius: '50px',
            background: C.navy, color: '#fff',
            border: 'none', cursor: refreshing ? 'default' : 'pointer',
            fontSize: '13px', fontWeight: 700, fontFamily: F,
            boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
            opacity: refreshing ? 0.75 : 1,
            transition: 'left 0.2s ease, opacity 0.15s',
            zIndex: 100,
          }}
        >
          <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" style={{ animation: refreshing ? 'spin 0.8s linear infinite' : 'none' }}>
            <polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
          </svg>
          {refreshing ? 'Yenileniyor…' : 'Yenile'}
        </button>
      )}
    </div>
  );
}
