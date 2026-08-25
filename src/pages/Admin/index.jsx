import { useState, useMemo, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from '@/contexts/RouterContext';
import { useData } from '@/contexts/DataContext';
import { useW } from '@/hooks/useW';
import { calcScores } from '@/utils/scoring';
import { slugify } from '@/utils/strings';
import { Card, Badge, Btn, Modal, Input, Select, Textarea, TableScrollHint, SearchableSelect } from '@/components/ui';
import { GenderBadge } from '@/components/shared';
import { C, F, FH } from '@/constants/theme';
import { uploadDataURL, uploadBrandLogo } from '@/lib/storage';
import { db } from '@/lib/firebase';
import { ActivityTab } from './ActivityTab';
import { BrandProfilesTab } from './BrandProfilesTab';
import { SecurityTab } from './SecurityTab';
import { DailyComparisonTab } from './DailyComparisonTab';
import { collection, query, where, getDocs, writeBatch, doc } from 'firebase/firestore';
import { useSeo } from '@/lib/seo';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUsers, faFlask, faStar, faCommentDots, faGauge, faBuilding, faSprayCan, faImages, faImage, faCodeMerge, faClockRotateLeft, faComments, faChevronUp, faChevronDown, faDownload, faTable, faFilePdf, faFile, faPalette, faShieldHalved, faTriangleExclamation, faSignature, faCalendarDay } from '@fortawesome/free-solid-svg-icons';
import Cropper from 'react-easy-crop';

const RL = { admin: 'Admin', moderator: 'Moderatör', user: 'Üye' };
const RC = { admin: 'red', moderator: 'blue', user: 'gold' };

const thBase = { padding: '11px 14px', textAlign: 'left', fontSize: '12px', fontWeight: 700, color: C.textLight, letterSpacing: '.05em', textTransform: 'uppercase', borderBottom: `1px solid ${C.border}` };

function SortTh({ label, sortKey, sort, onSort }) {
  const active = sort.key === sortKey;
  return (
    <th onClick={() => sortKey && onSort(sortKey)} style={{ ...thBase, cursor: sortKey ? 'pointer' : 'default', userSelect: 'none', whiteSpace: 'nowrap', background: active ? '#f0f0f8' : undefined }}>
      <span className="inline-flex items-center gap-1">
        {label}
        {sortKey && <span className="text-[11px] font-bold" style={{ color: active ? C.navy : C.textLight }}>{active ? (sort.dir === 'asc' ? ' ↑' : ' ↓') : ' ↕'}</span>}
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
      <div className="flex items-center gap-[10px] px-4 py-3 border-b border-(--color-border) bg-[#fafafa]">
        <div className="relative flex-1 max-w-[340px]">
          <svg className="absolute left-[10px] top-1/2 -translate-y-1/2 pointer-events-none text-(--color-text-light)" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          <input value={local} onChange={(e) => handleChange(e.target.value)} placeholder={placeholder} className="w-full box-border h-[34px] border border-(--color-border) rounded-lg text-[13px] text-(--color-text) bg-white outline-none font-[family-name:var(--font-body)]" style={{ paddingLeft: '32px', paddingRight: local ? '60px' : '10px' }} />
          {local && (
            <button onClick={() => handleChange('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-[11px] text-(--color-text-light) bg-transparent border-none cursor-pointer font-[family-name:var(--font-body)] px-1.5 py-0.5 rounded">Temizle</button>
          )}
        </div>
        <span className="text-xs text-(--color-text-light) ml-auto whitespace-nowrap">{count} / {total} kayıt</span>
      </div>
    );
  }

  const commit = () => onChange(local.trim());
  const clear  = () => { setLocal(''); onChange(''); };

  return (
    <div className="flex items-center gap-[10px] px-4 py-3 border-b border-(--color-border) bg-[#fafafa]">
      <div className="relative flex-1 max-w-[340px]">
        <svg className="absolute left-[10px] top-1/2 -translate-y-1/2 pointer-events-none text-(--color-text-light)" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
        <input
          value={local}
          onChange={(e) => setLocal(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') commit(); }}
          placeholder={placeholder}
          className="w-full box-border h-[34px] border border-(--color-border) rounded-lg text-[13px] text-(--color-text) bg-white outline-none font-[family-name:var(--font-body)]"
          style={{ paddingLeft: '32px', paddingRight: local ? '60px' : '10px' }}
        />
        {local && (
          <button onClick={clear} className="absolute right-2 top-1/2 -translate-y-1/2 text-[11px] text-(--color-text-light) bg-transparent border-none cursor-pointer font-[family-name:var(--font-body)] px-1.5 py-0.5 rounded">Temizle</button>
        )}
      </div>
      <button
        onClick={commit}
        className="h-[34px] px-4 bg-(--color-navy) text-white border-none rounded-lg text-[13px] font-semibold font-[family-name:var(--font-body)] cursor-pointer whitespace-nowrap shrink-0"
      >
        Ara
      </button>
      <span className="text-xs text-(--color-text-light) ml-auto whitespace-nowrap">{count} / {total} kayıt</span>
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
      className="flex items-center justify-center w-7 h-7 rounded-[6px] cursor-pointer transition-all duration-150 shrink-0"
      style={{ border: `1px solid ${copied ? colors.copiedBorder : colors.border}`, background: copied ? colors.copiedBg : colors.bg, color: copied ? colors.copiedColor : colors.color }}
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
  { k: 'daily-comparison', l: 'Günün Karşılaştırması', icon: faCalendarDay },
  { k: 'brand-profiles',  l: 'Marka Profilleri',   icon: faPalette },
  { k: 'slider',          l: 'Görsel Yönetimi',    icon: faImages },
  { k: 'favicon',         l: 'Favicon',            icon: faImage },
  { k: 'logo',            l: 'Navbar Logo',        icon: faSignature },
  { k: 'footer-logo',    l: 'Footer Logo',        icon: faSignature },
  { k: 'merge-perfumes',  l: 'Parfüm Birleştir',  icon: faCodeMerge },
  { k: 'activity',        l: 'Hareketler',         icon: faClockRotateLeft },
  { k: 'security',        l: 'Güvenlik',           icon: faShieldHalved },
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
      <div className="mb-5">
        <h2 className="text-[18px] font-[800] text-(--color-navy) mb-1">Ana Sayfa Slider Görselleri</h2>
        <p className="text-[13px] text-(--color-text-light)">En fazla {MAX_SLIDER} görsel · Maks. {MAX_SIZE_MB}MB/görsel · Otomatik 1920×800px'e yeniden boyutlandırılır · Sürükle-bırak ile sıra değiştir</p>
      </div>

      {sliderImages.length < MAX_SLIDER && (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          onClick={() => document.getElementById('slider-file-input').click()}
          className="rounded-[14px] p-10 text-center cursor-pointer transition-all duration-200 mb-5"
          style={{ border: `2px dashed ${dragOver ? C.gold : C.border}`, background: dragOver ? C.goldBg : '#fafafa' }}>
          <input id="slider-file-input" type="file" accept="image/jpeg,image/png,image/webp" multiple className="hidden" onChange={(e) => processFiles(e.target.files)} />
          <div className="text-[36px] mb-[10px]">🖼️</div>
          <div className="text-[15px] font-bold text-(--color-navy) mb-1.5">Görselleri buraya sürükleyin veya tıklayın</div>
          <div className="text-xs text-(--color-text-light)">{sliderImages.length}/{MAX_SLIDER} görsel · JPG, PNG, WebP · Maks. {MAX_SIZE_MB}MB</div>
        </div>
      )}

      {error && (
        <div className="bg-[#fff5f5] border border-[#fecaca] rounded-[10px] px-[14px] py-[10px] text-[13px] text-(--color-red) mb-4">{error}</div>
      )}

      {sliderImages.length > 0 ? (
        <div className="grid gap-[14px]" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))' }}>
          {sliderImages.map((img, i) => (
            <div key={img.id} draggable
              onDragStart={() => onDragStartItem(i)}
              onDragOver={(e) => onDragOverItem(e, i)}
              onDragEnd={() => setDragIdx(null)}
              className="rounded-xl overflow-hidden cursor-grab relative transition-shadow duration-150 select-none"
              style={{ border: `2px solid ${dragIdx === i ? C.gold : C.border}`, boxShadow: dragIdx === i ? `0 6px 24px rgba(184,150,90,.35)` : 'none' }}>
              <img src={img.src} alt={img.name} className="w-full object-cover block transition-opacity duration-150" style={{ aspectRatio: '16/9', opacity: dragIdx === i ? 0.55 : 1 }} />
              <div className="absolute top-2 left-2 bg-[rgba(0,0,0,.6)] rounded-[6px] px-[9px] py-[3px] text-xs font-[800] text-white">{i + 1}</div>
              <div className="absolute top-2 right-2 bg-[rgba(0,0,0,.4)] rounded-[6px] px-[7px] py-[3px] text-[13px] text-[rgba(255,255,255,.7)] cursor-grab">⠿</div>
              <div className="px-3 py-2 bg-white flex justify-between items-center gap-2">
                <span className="text-xs text-(--color-text-mid) overflow-hidden text-ellipsis whitespace-nowrap">{img.name}</span>
                <button onClick={() => removeSliderImage(img.id)} className="bg-[#fff5f5] border border-[#fecaca] rounded-[6px] px-[9px] py-[3px] text-[11px] text-(--color-red) cursor-pointer font-[family-name:var(--font-body)] font-bold shrink-0">Sil</button>
              </div>
              <div className="flex items-center gap-1 px-3 py-[7px] bg-[#f8f9fb]" style={{ borderTop: `1px solid ${C.border}` }}>
                {[
                  { key: 'showMobile', label: 'Mobil' },
                  { key: 'showTablet', label: 'Tablet' },
                  { key: 'showDesktop', label: 'PC' },
                ].map(({ key, label }) => (
                  <label key={key} className="flex items-center gap-[5px] cursor-pointer select-none flex-1 px-1.5 py-[3px] rounded-[6px] transition-all duration-150"
                    style={{ background: img[key] !== false ? '#eef2ff' : 'transparent', border: `1px solid ${img[key] !== false ? '#c7d2fe' : C.border}` }}>
                    <input
                      type="checkbox"
                      checked={img[key] !== false}
                      onChange={() => updateSliderImage(img.id, { [key]: img[key] === false })}
                      className="w-[13px] h-[13px] cursor-pointer shrink-0"
                      style={{ accentColor: C.navy }}
                    />
                    <span className="text-[11px] whitespace-nowrap" style={{ fontWeight: img[key] !== false ? 700 : 400, color: img[key] !== false ? C.navy : C.textLight }}>{label}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center p-[50px] text-(--color-text-light) text-sm bg-[#fafafa] rounded-[14px]" style={{ border: `1px dashed ${C.border}` }}>
          Henüz görsel eklenmedi. Görsel eklenene kadar landing page varsayılan görünümünü gösterir.
        </div>
      )}
    </div>
  );
}

const LANDING_SLOTS = [
  { key: 'howItWorksBg',   label: 'Nasıl Çalışır Arkaplanı',  desc: 'HowItWorksSection arkaplan görseli',   aspect: '16/9' },
  { key: 'comparisonImg',  label: 'Karşılaştırma Bölümü',      desc: 'ComparisonSection sağ panel görseli',  aspect: '4/3'  },
  { key: 'testimonialsBg', label: 'Yorumlar Arkaplanı',         desc: 'TestimonialsSection arkaplan görseli', aspect: '16/9' },
  { key: 'ctaBg',          label: 'CTA Bölümü',                 desc: 'CTASection atmosfer görseli',          aspect: '16/9' },
  { key: 'noImageUrl',     label: 'Boş Görsel Placeholder',     desc: 'Parfüm/marka görseli yokken gösterilir', aspect: '1/1' },
  { key: 'loginImage',     label: 'Giriş Sayfası Görseli',     desc: 'Giriş ve 2FA sayfası sol panel görseli',  aspect: '9/16' },
  { key: 'signupImage',    label: 'Kayıt Sayfası Görseli',     desc: 'Üye ol sayfası sol panel görseli',        aspect: '9/16' },
];

const AUTH_DEFAULT_HTML = 'Kokuların<br><em style="color:#B8935A;font-style:italic">Zarif</em> Dünyasına<br>Hoş Geldiniz';
const AUTH_DEFAULT_SUB  = 'Lüks parfümlerin muadillerini\nkeşfet, karşılaştır ve en iyisini bul.';

function RichTextEditor({ label, initialHtml, onChange }) {
  const editorRef = useRef(null);
  const [colorHex, setColorHex] = useState('#B8935A');
  const hasMounted = useRef(false);

  useEffect(() => {
    if (!hasMounted.current && editorRef.current && initialHtml !== undefined) {
      editorRef.current.innerHTML = initialHtml || '';
      hasMounted.current = true;
      onChange(initialHtml || '');
    }
  }, [initialHtml]);

  const cmd = (command, val) => {
    if (!editorRef.current) return;
    editorRef.current.focus();
    document.execCommand(command, false, val || null);
    onChange(editorRef.current.innerHTML);
  };

  return (
    <div>
      <label className="block text-[13px] font-semibold text-(--color-text-mid) mb-[6px]">{label}</label>
      <div className="flex items-center gap-2 flex-wrap px-3 py-2 rounded-t-[10px]"
           style={{ background: '#f8f7f5', border: `1px solid ${C.border}`, borderBottom: 'none' }}>
        <button
          onMouseDown={(e) => { e.preventDefault(); cmd('italic'); }}
          title="Seçili metni italik yap"
          className="w-[28px] h-[28px] rounded-[6px] flex items-center justify-center cursor-pointer text-[14px] font-bold transition-all"
          style={{ background: '#fff', border: `1px solid ${C.border}`, fontStyle: 'italic', color: C.navy, fontFamily: 'Georgia, serif' }}
        >I</button>
        <div className="flex items-center gap-[6px]">
          <input
            type="color"
            value={colorHex}
            onChange={(e) => setColorHex(e.target.value)}
            className="w-[28px] h-[28px] rounded-[6px] cursor-pointer"
            style={{ padding: '2px 3px', border: `1px solid ${C.border}` }}
            title="Renk seç"
          />
          <input
            type="text"
            value={colorHex}
            onChange={(e) => setColorHex(e.target.value)}
            placeholder="#B8935A"
            maxLength={7}
            className="h-[28px] rounded-[6px] text-[12px] text-(--color-text) outline-none px-2"
            style={{ width: '76px', border: `1px solid ${C.border}` }}
          />
          <button
            onMouseDown={(e) => { e.preventDefault(); cmd('foreColor', colorHex); }}
            className="h-[28px] px-2 rounded-[6px] text-[11px] font-bold cursor-pointer whitespace-nowrap"
            style={{ background: colorHex, color: '#fff', border: 'none' }}
            title="Seçili metnin rengini değiştir"
          >Renk Uygula</button>
        </div>
        <button
          onMouseDown={(e) => { e.preventDefault(); cmd('insertHTML', '<br>'); }}
          className="h-[28px] px-2 rounded-[6px] text-[11px] font-semibold cursor-pointer whitespace-nowrap"
          style={{ background: '#fff', color: C.textLight, border: `1px solid ${C.border}` }}
          title="Satır sonu ekle"
        >↵ Satır</button>
        <button
          onMouseDown={(e) => { e.preventDefault(); cmd('removeFormat'); }}
          className="h-[28px] px-2 rounded-[6px] text-[11px] font-semibold cursor-pointer whitespace-nowrap"
          style={{ background: '#fff5f5', color: C.red, border: '1px solid #fecaca' }}
          title="Seçili metindeki formatı temizle"
        >Temizle</button>
      </div>
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={() => onChange(editorRef.current?.innerHTML || '')}
        className="min-h-[72px] rounded-b-[10px] px-[14px] py-[10px] text-[16px] outline-none transition-[border-color] duration-200"
        style={{ border: `1px solid ${C.border}`, fontFamily: FH, lineHeight: 1.4, color: '#1a1208' }}
        onFocus={(e) => (e.currentTarget.style.borderColor = C.gold)}
        onBlur={(e) => (e.currentTarget.style.borderColor = C.border)}
      />
    </div>
  );
}

function AuthPanelPreview({ imageUrl, headlineHtml, subtextText, label }) {
  const sub = subtextText || AUTH_DEFAULT_SUB;
  const subLines = sub.split('\n');
  return (
    <div className="flex flex-col items-center gap-2 mt-4">
      <div className="text-[11px] font-semibold text-(--color-text-light) tracking-wide uppercase">{label}</div>
      <div style={{
        width: '164px', minHeight: '246px',
        background: imageUrl ? `url(${imageUrl}) center top / cover no-repeat` : 'linear-gradient(170deg, #1a1208 0%, #0f0a04 100%)',
        borderRadius: '12px', overflow: 'hidden', position: 'relative',
        boxShadow: '0 6px 20px rgba(0,0,0,0.28)', flexShrink: 0,
      }}>
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(170deg, rgba(15,10,5,0.18) 0%, rgba(18,12,4,0.80) 65%)' }} />
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '14px' }}>
          <div
            style={{ fontFamily: FH, fontSize: '14px', fontWeight: 400, color: '#fff', lineHeight: 1.32, marginBottom: '6px', letterSpacing: '-0.01em' }}
            dangerouslySetInnerHTML={{ __html: headlineHtml || AUTH_DEFAULT_HTML }}
          />
          <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: '8px', fontWeight: 300, color: 'rgba(255,255,255,0.58)', lineHeight: 1.85 }}>
            {subLines.map((l, i) => <span key={i}>{l}{i < subLines.length - 1 && <br />}</span>)}
          </p>
        </div>
      </div>
    </div>
  );
}

function LandingImagesSection({ landingImages, updateLandingImage, MAX_SIZE_MB = 3 }) {
  const [uploading, setUploading] = useState(null);
  const [error, setError] = useState('');
  const [loginHtml, setLoginHtml] = useState('');
  const [signupHtml, setSignupHtml] = useState('');
  const [authSubtext, setAuthSubtext] = useState('');
  const [textSaving, setTextSaving] = useState(false);
  const [textSaved, setTextSaved] = useState(false);

  useEffect(() => {
    if (landingImages?.authSubtext !== undefined) setAuthSubtext(landingImages.authSubtext);
  }, [landingImages?.authSubtext]);

  const saveAuthTexts = async () => {
    setTextSaving(true);
    setTextSaved(false);
    try {
      await updateLandingImage('loginHeadline', loginHtml);
      await updateLandingImage('signupHeadline', signupHtml);
      await updateLandingImage('authSubtext', authSubtext);
      setTextSaved(true);
      setTimeout(() => setTextSaved(false), 2000);
    } finally {
      setTextSaving(false);
    }
  };

  const handleFile = async (key, file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) { setError('Sadece JPG, PNG veya WebP görseli yüklenebilir.'); return; }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) { setError(`"${file.name}" ${MAX_SIZE_MB}MB sınırını aşıyor.`); return; }
    setError('');
    setUploading(key);
    try {
      const dataURL = await compressToDataURL(file, 1920, 0.85);
      const url = await uploadDataURL(dataURL, 'landing');
      await updateLandingImage(key, url);
    } catch {
      setError('Görsel yüklenirken hata oluştu.');
    } finally {
      setUploading(null);
    }
  };

  const handleReset = async (key) => {
    await updateLandingImage(key, null);
  };

  return (
    <div className="mt-10 pt-8" style={{ borderTop: `2px solid ${C.border}` }}>
      <div className="mb-6">
        <h2 className="text-[18px] font-[800] text-(--color-navy) mb-1">Landing Page Görselleri</h2>
        <p className="text-[13px] text-(--color-text-light)">
          Her bölüm için özel görsel yükleyebilirsiniz. Boş bırakılan slotlar varsayılan görseli kullanmaya devam eder.
        </p>
      </div>

      {error && (
        <div className="bg-[#fff5f5] border border-[#fecaca] rounded-[10px] px-[14px] py-[10px] text-[13px] text-(--color-red) mb-4">{error}</div>
      )}

      <div className="grid gap-5" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
        {LANDING_SLOTS.map(({ key, label, desc, aspect }) => {
          const currentUrl = landingImages?.[key];
          const isUploading = uploading === key;
          return (
            <div key={key} className="rounded-[14px] overflow-hidden bg-white flex flex-col" style={{ border: `1px solid ${C.border}` }}>
              {/* Preview */}
              <div className="relative overflow-hidden flex items-center justify-center" style={{ aspectRatio: aspect, maxHeight: '200px', background: currentUrl ? '#000' : C.goldBg }}>
                {currentUrl ? (
                  <>
                    <img src={currentUrl} alt={label} className="w-full h-full object-cover" />
                    <div className="absolute bottom-0 left-0 right-0 px-2 py-[5px] text-center text-[10px] font-semibold text-white tracking-wide" style={{ background: 'rgba(184,147,90,.75)' }}>
                      Özel görsel aktif
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center gap-2 text-(--color-text-light)">
                    <FontAwesomeIcon icon={faImage} style={{ fontSize: '28px', opacity: 0.35 }} />
                    <span className="text-[11px] font-medium">Tema rengi gösterilir</span>
                  </div>
                )}
                {isUploading && (
                  <div className="absolute inset-0 bg-[rgba(255,255,255,.8)] flex items-center justify-center">
                    <div className="w-8 h-8 rounded-full animate-spin" style={{ border: `3px solid ${C.border}`, borderTop: `3px solid ${C.gold}` }} />
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="px-4 pt-3 pb-1 flex-1">
                <div className="font-bold text-[13px] text-(--color-navy) mb-[2px]">{label}</div>
                <div className="text-[11px] text-(--color-text-light)">{desc}</div>
              </div>

              {/* Actions — always at bottom */}
              <div className="px-4 pb-4 pt-3">
                <div className="flex gap-2">
                  <label className="flex-1 flex items-center justify-center gap-[6px] h-[34px] rounded-[8px] cursor-pointer text-[12px] font-semibold transition-all duration-150"
                    style={{ background: C.navy, color: '#fff', border: 'none' }}>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      disabled={isUploading}
                      onChange={(e) => { handleFile(key, e.target.files[0]); e.target.value = ''; }}
                    />
                    <FontAwesomeIcon icon={faImage} style={{ fontSize: '12px' }} />
                    {currentUrl ? 'Değiştir' : 'Yükle'}
                  </label>
                  {currentUrl && (
                    <button
                      onClick={() => handleReset(key)}
                      disabled={isUploading}
                      className="px-3 h-[34px] rounded-[8px] text-[12px] font-semibold cursor-pointer transition-all duration-150"
                      style={{ background: '#fff5f5', color: C.red, border: `1px solid #fecaca` }}
                    >
                      Sıfırla
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Auth sayfası panel metinleri */}
      <div className="mt-8 pt-7" style={{ borderTop: `1px solid ${C.border}` }}>
        <div className="mb-5">
          <h3 className="text-[15px] font-bold text-(--color-navy) mb-1">Giriş / Kayıt Sayfası Metinleri</h3>
          <p className="text-[13px] text-(--color-text-light)">Sol panel görsel üzerinde görünen başlık metinleri. Metni seçip araç çubuğu ile italik ve renk uygulayın — anlık önizleme aşağıda görünür.</p>
        </div>

        <div className="grid gap-8" style={{ gridTemplateColumns: '1fr 1fr', maxWidth: '900px' }}>
          {/* Giriş Sayfası */}
          <div>
            <RichTextEditor
              label="Giriş Sayfası Başlığı"
              initialHtml={landingImages?.loginHeadline}
              onChange={setLoginHtml}
            />
            <AuthPanelPreview
              imageUrl={landingImages?.loginImage}
              headlineHtml={loginHtml}
              subtextText={authSubtext}
              label="Giriş Sayfası Önizleme"
            />
          </div>

          {/* Kayıt Sayfası */}
          <div>
            <RichTextEditor
              label="Kayıt Sayfası Başlığı"
              initialHtml={landingImages?.signupHeadline}
              onChange={setSignupHtml}
            />
            <AuthPanelPreview
              imageUrl={landingImages?.signupImage}
              headlineHtml={signupHtml}
              subtextText={authSubtext}
              label="Kayıt Sayfası Önizleme"
            />
          </div>
        </div>

        {/* Ortak alt metin */}
        <div className="mt-6" style={{ maxWidth: '620px' }}>
          <label className="block text-[13px] font-semibold text-(--color-text-mid) mb-[6px]">
            Alt Açıklama <span className="text-[11px] font-normal text-(--color-text-light)">(her iki sayfada ortak gösterilir)</span>
          </label>
          <textarea
            value={authSubtext}
            onChange={(e) => setAuthSubtext(e.target.value)}
            placeholder={'Lüks parfümlerin muadillerini\nkeşfet, karşılaştır ve en iyisini bul.'}
            rows={2}
            className="w-full rounded-[10px] px-[14px] py-[10px] text-[14px] text-(--color-text) outline-none transition-[border-color] duration-200 resize-none"
            style={{ border: `1px solid ${C.border}`, fontFamily: 'inherit', lineHeight: 1.6 }}
            onFocus={(e) => (e.target.style.borderColor = C.gold)}
            onBlur={(e) => (e.target.style.borderColor = C.border)}
          />
        </div>

        <div className="mt-4">
          <button
            onClick={saveAuthTexts}
            disabled={textSaving}
            className="h-[36px] px-5 rounded-[8px] text-[13px] font-semibold cursor-pointer transition-all duration-150 disabled:opacity-60"
            style={{ background: textSaved ? '#f0fdf4' : C.navy, color: textSaved ? '#16a34a' : '#fff', border: textSaved ? '1px solid #86efac' : 'none' }}
          >
            {textSaving ? 'Kaydediliyor...' : textSaved ? '✓ Kaydedildi' : 'Kaydet'}
          </button>
        </div>
      </div>
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
    <div className="max-w-[520px]">
      <Card style={{ padding: '28px' }}>
        <div className="font-bold text-[16px] text-(--color-navy) mb-5">Favicon Yönetimi</div>

        {/* Mevcut favicon */}
        <div className="mb-6">
          <div className="text-xs font-semibold text-(--color-text-light) uppercase tracking-[.05em] mb-[10px]">Mevcut Favicon</div>
          <div className="flex items-center gap-[14px]">
            <div className="w-16 h-16 rounded-xl border border-(--color-border) bg-[#f9f9fb] flex items-center justify-center overflow-hidden">
              {faviconUrl
                ? <img src={faviconUrl} alt="favicon" className="w-full h-full object-contain" />
                : <span className="text-[11px] text-(--color-text-light)">Yok</span>
              }
            </div>
            <div className="text-[13px] text-(--color-text-mid)">
              {faviconUrl ? <a href={faviconUrl} target="_blank" rel="noopener noreferrer" className="text-(--color-gold) no-underline break-all">Mevcut favicon görüntüle</a> : 'Henüz favicon yüklenmedi.'}
            </div>
          </div>
        </div>

        {/* Yeni favicon yükle */}
        <div className="text-xs font-semibold text-(--color-text-light) uppercase tracking-[.05em] mb-[10px]">Yeni Favicon Yükle</div>
        <div
          onClick={() => document.getElementById('favicon-file-input').click()}
          className="rounded-xl p-7 text-center cursor-pointer transition-all duration-200 mb-[14px]"
          style={{ border: `2px dashed ${preview ? C.gold : C.border}`, background: preview ? C.goldBg : '#fafafa' }}>
          <input id="favicon-file-input" type="file" accept="image/*" className="hidden" onChange={(e) => handleFile(e.target.files[0])} />
          {preview ? (
            <div className="flex flex-col items-center gap-[10px]">
              <img src={preview} alt="preview" className="w-16 h-16 object-contain rounded-lg" style={{ border: `1px solid ${C.goldBorder}` }} />
              <span className="text-xs text-(--color-gold) font-semibold">Önizleme — kaydetmek için aşağıdaki butona tıkla</span>
            </div>
          ) : (
            <div>
              <svg width="28" height="28" fill="none" stroke={C.textLight} strokeWidth="1.5" viewBox="0 0 24 24" className="mb-2 mx-auto"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
              <div className="text-[13px] text-(--color-text-mid)">Tıkla veya sürükle · PNG, ICO, SVG · Maks. 1 MB</div>
            </div>
          )}
        </div>

        {error && <div className="px-3 py-2 bg-[#fff5f5] border border-[#fecaca] rounded-lg text-[13px] text-(--color-red) mb-[14px]">{error}</div>}

        <div className="flex gap-2">
          {preview && <Btn variant="secondary" onClick={() => { setPreview(null); setError(''); }}>İptal</Btn>}
          <Btn onClick={handleSave} disabled={!preview || uploading}>{uploading ? 'Yükleniyor…' : 'Favicon Kaydet'}</Btn>
        </div>
      </Card>
    </div>
  );
}

function LogoTab({ logoUrl, updateLogo }) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview]     = useState(null);
  const [error, setError]         = useState('');

  const handleFile = (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) { setError('Sadece görsel dosyaları desteklenir.'); return; }
    if (file.size > 2 * 1024 * 1024) { setError('Dosya boyutu maks. 2 MB olmalıdır.'); return; }
    setError('');
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target.result);
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!preview) return;
    setUploading(true);
    try {
      const url = await uploadDataURL(preview, 'brands');
      await updateLogo(url);
      setPreview(null);
    } catch (e) {
      setError('Yükleme başarısız: ' + (e?.message || 'bilinmeyen hata'));
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-[520px]">
      <Card style={{ padding: '28px' }}>
        <div className="font-bold text-[16px] text-(--color-navy) mb-5">Navbar Logo Yönetimi</div>

        <div className="mb-6">
          <div className="text-xs font-semibold text-(--color-text-light) uppercase tracking-[.05em] mb-[10px]">Mevcut Logo</div>
          <div className="h-16 px-4 rounded-xl border border-(--color-border) bg-[#f9f9fb] flex items-center justify-center overflow-hidden" style={{ maxWidth: '200px' }}>
            {logoUrl
              ? <img src={logoUrl} alt="logo" className="h-full w-auto object-contain" style={{ maxWidth: '160px' }} />
              : <span className="text-[11px] text-(--color-text-light)">Henüz logo yüklenmedi</span>
            }
          </div>
        </div>

        <div className="text-xs font-semibold text-(--color-text-light) uppercase tracking-[.05em] mb-[10px]">Yeni Logo Yükle</div>
        <div
          onClick={() => document.getElementById('logo-file-input').click()}
          className="rounded-xl p-7 text-center cursor-pointer transition-all duration-200 mb-[14px]"
          style={{ border: `2px dashed ${preview ? C.gold : C.border}`, background: preview ? C.goldBg : '#fafafa' }}>
          <input id="logo-file-input" type="file" accept="image/*" className="hidden" onChange={(e) => handleFile(e.target.files[0])} />
          {preview ? (
            <div className="flex flex-col items-center gap-[10px]">
              <div className="h-16 px-4 rounded-lg flex items-center justify-center overflow-hidden" style={{ border: `1px solid ${C.goldBorder}`, background: '#fff' }}>
                <img src={preview} alt="preview" className="h-full w-auto object-contain" style={{ maxWidth: '200px' }} />
              </div>
              <span className="text-xs text-(--color-gold) font-semibold">Önizleme — kaydetmek için aşağıdaki butona tıkla</span>
            </div>
          ) : (
            <div>
              <svg width="28" height="28" fill="none" stroke={C.textLight} strokeWidth="1.5" viewBox="0 0 24 24" className="mb-2 mx-auto"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
              <div className="text-[13px] text-(--color-text-mid)">Tıkla veya sürükle · PNG, SVG, WebP · Maks. 2 MB</div>
              <div className="text-[11px] text-(--color-text-light) mt-1">Şeffaf arka plan olan PNG/SVG önerilir</div>
            </div>
          )}
        </div>

        {error && <div className="px-3 py-2 bg-[#fff5f5] border border-[#fecaca] rounded-lg text-[13px] text-(--color-red) mb-[14px]">{error}</div>}

        <div className="flex gap-2">
          {preview && <Btn variant="secondary" onClick={() => { setPreview(null); setError(''); }}>İptal</Btn>}
          <Btn onClick={handleSave} disabled={!preview || uploading}>{uploading ? 'Yükleniyor…' : 'Logo Kaydet'}</Btn>
        </div>
      </Card>
    </div>
  );
}

function FooterLogoTab({ footerLogoUrl, updateFooterLogo }) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview]     = useState(null);
  const [error, setError]         = useState('');

  const handleFile = (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) { setError('Sadece görsel dosyaları desteklenir.'); return; }
    if (file.size > 2 * 1024 * 1024) { setError('Dosya boyutu maks. 2 MB olmalıdır.'); return; }
    setError('');
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target.result);
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!preview) return;
    setUploading(true);
    try {
      const url = await uploadDataURL(preview, 'brands');
      await updateFooterLogo(url);
      setPreview(null);
    } catch (e) {
      setError('Yükleme başarısız: ' + (e?.message || 'bilinmeyen hata'));
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-[520px]">
      <Card style={{ padding: '28px' }}>
        <div className="font-bold text-[16px] text-(--color-navy) mb-5">Footer Logo Yönetimi</div>

        <div className="mb-6">
          <div className="text-xs font-semibold text-(--color-text-light) uppercase tracking-[.05em] mb-[10px]">Mevcut Logo</div>
          <div className="h-16 px-4 rounded-xl border border-(--color-border) bg-[#f9f9fb] flex items-center justify-center overflow-hidden" style={{ maxWidth: '200px' }}>
            {footerLogoUrl
              ? <img src={footerLogoUrl} alt="footer logo" className="h-full w-auto object-contain" style={{ maxWidth: '160px' }} />
              : <span className="text-[11px] text-(--color-text-light)">Henüz logo yüklenmedi</span>
            }
          </div>
        </div>

        <div className="text-xs font-semibold text-(--color-text-light) uppercase tracking-[.05em] mb-[10px]">Yeni Logo Yükle</div>
        <div
          onClick={() => document.getElementById('footer-logo-file-input').click()}
          className="rounded-xl p-7 text-center cursor-pointer transition-all duration-200 mb-[14px]"
          style={{ border: `2px dashed ${preview ? C.gold : C.border}`, background: preview ? C.goldBg : '#fafafa' }}>
          <input id="footer-logo-file-input" type="file" accept="image/*" className="hidden" onChange={(e) => handleFile(e.target.files[0])} />
          {preview ? (
            <div className="flex flex-col items-center gap-[10px]">
              <div className="h-16 px-4 rounded-lg flex items-center justify-center overflow-hidden" style={{ border: `1px solid ${C.goldBorder}`, background: '#fff' }}>
                <img src={preview} alt="preview" className="h-full w-auto object-contain" style={{ maxWidth: '200px' }} />
              </div>
              <span className="text-xs text-(--color-gold) font-semibold">Önizleme — kaydetmek için aşağıdaki butona tıkla</span>
            </div>
          ) : (
            <div>
              <svg width="28" height="28" fill="none" stroke={C.textLight} strokeWidth="1.5" viewBox="0 0 24 24" className="mb-2 mx-auto"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
              <div className="text-[13px] text-(--color-text-mid)">Tıkla veya sürükle · PNG, SVG, WebP · Maks. 2 MB</div>
              <div className="text-[11px] text-(--color-text-light) mt-1">Şeffaf arka plan olan PNG/SVG önerilir</div>
            </div>
          )}
        </div>

        {error && <div className="px-3 py-2 bg-[#fff5f5] border border-[#fecaca] rounded-lg text-[13px] text-(--color-red) mb-[14px]">{error}</div>}

        <div className="flex gap-2">
          {preview && <Btn variant="secondary" onClick={() => { setPreview(null); setError(''); }}>İptal</Btn>}
          <Btn onClick={handleSave} disabled={!preview || uploading}>{uploading ? 'Yükleniyor…' : 'Logo Kaydet'}</Btn>
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
    <div className="mt-1">
      <div className="flex items-center justify-between mb-[10px]">
        <div className="text-[13px] font-bold text-(--color-navy)">Parfüm Görselleri</div>
        <div className="text-xs text-(--color-text-light)">JPG · PNG · WebP · maks. {MAX_SIZE_MB}MB · sürükleyerek sırala</div>
      </div>
      <div className="grid grid-cols-3 gap-3">
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
            className="rounded-xl flex flex-col items-center justify-center overflow-hidden relative transition-all duration-150 select-none"
            style={{
              aspectRatio: '4/3',
              border: `2px ${dragOverIdx === idx ? 'solid' : 'dashed'} ${dragOverIdx === idx ? C.gold : img ? C.goldBorder : C.border}`,
              background: dragOverIdx === idx ? C.goldBg : img ? '#fff' : '#fafafa',
              cursor: img ? 'grab' : 'pointer',
              opacity: dragSrcIdx === idx ? 0.4 : 1,
              boxShadow: dragOverIdx === idx ? `0 0 0 3px ${C.goldBg}` : 'none',
            }}
          >
            <input
              id={`perf-img-${idx}`}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(e) => { readFile(idx, e.target.files[0]); e.target.value = ''; }}
            />
            {uploadingIdx === idx ? (
              <div className="text-center p-[10px] pointer-events-none">
                <div className="w-[26px] h-[26px] mx-auto mb-2 rounded-full animate-spin" style={{ border: `3px solid ${C.border}`, borderTop: `3px solid ${C.gold}` }} />
                <div className="text-[11px] text-(--color-text-light)">Yükleniyor…</div>
              </div>
            ) : img ? (
              <>
                <img src={img.src} alt={img.name} className="w-full h-full object-cover pointer-events-none" />
                <div className="absolute top-2 left-2 bg-[rgba(0,0,0,.6)] rounded-[6px] px-2 py-0.5 text-[11px] font-[800] text-white">{idx + 1}</div>
                <button
                  onClick={(e) => { e.stopPropagation(); setSizeErr(''); const next = [...images]; next[idx] = null; onChange(next); }}
                  className="absolute top-2 right-2 w-6 h-6 rounded-full bg-[rgba(220,38,38,.9)] border-none cursor-pointer text-white text-[15px] font-bold flex items-center justify-center p-0 leading-none"
                >×</button>
                <div className="absolute bottom-2 right-2 bg-[rgba(0,0,0,.45)] rounded-[6px] px-[7px] py-[3px] text-xs text-[rgba(255,255,255,.85)]">⠿</div>
              </>
            ) : (
              <div className="text-center p-[10px] pointer-events-none">
                <svg width="32" height="32" fill="none" stroke={C.textLight} strokeWidth="1.5" viewBox="0 0 24 24" className="mb-2 mx-auto">
                  <rect x="3" y="3" width="18" height="18" rx="3" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <path d="m21 15-5-5L5 21" />
                </svg>
                <div className="text-xs font-semibold text-(--color-text-mid) mb-[3px]">Görsel {idx + 1}</div>
                <div className="text-[11px] text-(--color-text-light)">Tıkla veya sürükle bırak</div>
              </div>
            )}
          </div>
        ))}
      </div>
      {sizeErr && (
        <div className="mt-2 text-xs text-(--color-red) bg-[#fff5f5] border border-[#fecaca] rounded-lg px-3 py-[7px]">{sizeErr}</div>
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
  return canvas.toDataURL('image/webp', 0.88);
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
      <div className="grid grid-cols-2 gap-[10px]">
        <Input label="Parfüm Adı *" value={ef.name} onChange={(e) => setEf({ ...ef, name: e.target.value })} />
        <Input label="Slug" value={ef.slug} onChange={(e) => setEf({ ...ef, slug: e.target.value.toLowerCase().replace(/ /g, '-').replace(/^-+/, '') })} />
        <SearchableSelect label="Marka *" placeholder="Marka ara veya seçin…" value={ef.brandId} onChange={(val) => setEf({ ...ef, brandId: val })} options={brands.filter((b) => b.type === 'original').map((b) => ({ value: String(b.id), label: b.name }))} />
        <Select label="Cinsiyet" value={ef.gender} onChange={(e) => setEf({ ...ef, gender: e.target.value })} options={[{ value: '', label: '—' }, ...['Erkek', 'Kadın', 'Unisex'].map((g) => ({ value: g, label: g }))]} />
        <Input label="Çıkış Yılı" type="number" value={ef.year} onChange={(e) => setEf({ ...ef, year: e.target.value })} />
      </div>
      <Input label="Üst Notalar (virgülle)" value={ef.topNotes} onChange={(e) => setEf({ ...ef, topNotes: e.target.value })} />
      <Input label="Kalp Notaları" value={ef.heartNotes} onChange={(e) => setEf({ ...ef, heartNotes: e.target.value })} />
      <Input label="Dip Notalar" value={ef.baseNotes} onChange={(e) => setEf({ ...ef, baseNotes: e.target.value })} />
      <Textarea label="Açıklama" value={ef.description} onChange={(e) => setEf({ ...ef, description: e.target.value })} rows={2} />
      <div className="flex gap-2 justify-between">
        <Btn variant="danger" onClick={onDelete}>Sil</Btn>
        <div className="flex gap-2">
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
      <div className="grid grid-cols-2 gap-[10px]">
        <Input label="Muadil Adı *" value={emf.name} onChange={(e) => setEmf({ ...emf, name: e.target.value })} />
        <Input label="Slug" value={emf.slug} onChange={(e) => setEmf({ ...emf, slug: e.target.value.toLowerCase().replace(/ /g, '-').replace(/^-+/, '') })} />
        <SearchableSelect label="Muadil Marka *" placeholder="Marka ara veya seçin…" value={emf.brandId} onChange={(val) => setEmf({ ...emf, brandId: val })} options={brands.filter((b) => b.type === 'muadil').map((b) => ({ value: String(b.id), label: b.name }))} />
        <SearchableSelect label="Hedef Orijinal *" placeholder="Parfüm ara veya seçin…" value={emf.targetPerfumeId} onChange={(val) => {
          const p = perfumes.find((x) => String(x.id) === val);
          setEmf({ ...emf, targetPerfumeId: val, gender: p?.gender || emf.gender || '' });
        }} options={[...perfumes].sort((a, b) => `${a.brandName} ${a.name}`.localeCompare(`${b.brandName} ${b.name}`, 'tr')).map((p) => ({ value: String(p.id), label: `${p.brandName} — ${p.name}` }))} />
      </div>
      {emf.gender && (
        <div className="flex items-center gap-2 px-3 py-2 bg-[#f8f9fb] border border-(--color-border) rounded-lg text-[13px] text-(--color-text-mid)">
          <span className="font-semibold text-(--color-text-light) tracking-[.03em] uppercase text-[11px]">Cinsiyet</span>
          <span className="font-bold text-(--color-navy)">{emf.gender}</span>
          <span className="ml-auto text-[11px] text-(--color-text-light)">Hedef parfümden alındı</span>
        </div>
      )}
      <Textarea label="Açıklama" value={emf.description} onChange={(e) => setEmf({ ...emf, description: e.target.value })} rows={3} />
      <div className="flex gap-2 justify-between">
        <Btn variant="danger" onClick={onDelete}>Sil</Btn>
        <div className="flex gap-2">
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
    arabClone: brand.arabClone || false,
  }));
  const [cropModal, setCropModal] = useState({ open: false, src: '' });

  const handleCropConfirm = async (dataURL) => {
    setCropModal({ open: false, src: '' });
    setEbf((s) => ({ ...s, _logoUploading: true, _logoErr: '' }));
    try {
      const url = await uploadBrandLogo(dataURL, ebf.slug);
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
        <div className="grid grid-cols-2 gap-[10px]">
          <Input label="Marka Adı *" value={ebf.name} onChange={(e) => setEbf({ ...ebf, name: e.target.value })} />
          <Input label="Slug" value={ebf.slug} onChange={(e) => setEbf({ ...ebf, slug: e.target.value.toLowerCase().replace(/ /g, '-').replace(/^-+/, '') })} />
          <Select label="Tür" value={ebf.type} onChange={(e) => setEbf({ ...ebf, type: e.target.value })} options={[{ value: 'original', label: 'Orijinal' }, { value: 'muadil', label: 'Muadil' }]} />
          <Input label="Logo Kısaltma" value={ebf.logo} onChange={(e) => setEbf({ ...ebf, logo: e.target.value })} />
          <Input label="Köken" value={ebf.origin} onChange={(e) => setEbf({ ...ebf, origin: e.target.value })} />
          <Input label="Kuruluş Yılı" type="number" value={ebf.founded} onChange={(e) => setEbf({ ...ebf, founded: e.target.value })} />
        </div>
        {ebf.type === 'original' && (
          <div className="mt-2">
            <div className="text-xs font-semibold text-(--color-text-mid) mb-2">Parfüm Kategorisi</div>
            <div className="flex gap-[10px]">
              {['Designer', 'Niche'].map((cat) => (
                <label key={cat} className="flex items-center gap-2 px-4 py-2 rounded-[10px] cursor-pointer text-[13px] font-semibold transition-all duration-150"
                  style={{ border: `1px solid ${ebf.category === cat ? C.navy : C.border}`, background: ebf.category === cat ? '#f0f0f8' : '#fafafa', color: ebf.category === cat ? C.navy : C.textMid }}>
                  <input type="radio" name="ebf-category" value={cat} checked={ebf.category === cat} onChange={() => setEbf({ ...ebf, category: cat })} style={{ accentColor: C.navy }} />
                  {cat}
                </label>
              ))}
            </div>
          </div>
        )}
        {ebf.type === 'muadil' && (
          <label className="mt-2 flex items-start gap-2.5 px-4 py-3 rounded-[10px] cursor-pointer transition-all duration-150"
            style={{ border: `1px solid ${ebf.arabClone ? C.gold : C.border}`, background: ebf.arabClone ? C.goldBg : '#fafafa' }}>
            <input type="checkbox" checked={ebf.arabClone} onChange={(e) => setEbf({ ...ebf, arabClone: e.target.checked })} style={{ accentColor: C.gold, marginTop: '2px' }} />
            <div>
              <div className="text-[13px] font-semibold" style={{ color: ebf.arabClone ? C.gold : C.textMid }}>Arap Klonu</div>
              <div className="text-[12px] mt-0.5" style={{ color: C.textLight }}>Muadiller "Benzeri" eki almaz; her parfüme kendi adını yazarsınız (ör. 9 P.M.).</div>
            </div>
          </label>
        )}
        <div className="mt-1">
          <div className="text-xs font-semibold text-(--color-text-mid) mb-1.5">Logo Görseli</div>
          <div className="flex gap-3 items-center">
            <div
              onClick={() => document.getElementById('brand-logo-edit').click()}
              className="w-16 h-16 rounded-xl flex items-center justify-center cursor-pointer overflow-hidden shrink-0"
              style={{ border: `2px dashed ${ebf.logoImage ? C.gold : C.border}`, background: ebf.logoImage ? '#fff' : '#fafafa' }}>
              {ebf.logoImage
                ? <img src={ebf.logoImage} alt="logo" className="w-full h-full object-cover" />
                : <span className="text-[22px]">+</span>}
            </div>
            <input id="brand-logo-edit" type="file" accept="image/jpeg,image/png,image/webp" className="hidden"
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
            <div className="flex-1">
              <div className="text-xs text-(--color-text-mid) leading-[1.5]">JPG, PNG veya WebP · Maks. 2MB<br />Görsel yoksa kısaltma metin olarak gösterilir.</div>
              {ebf._logoErr && <div className="mt-1.5 text-xs text-(--color-red) bg-[#fff5f5] border border-[#fecaca] rounded-[6px] px-[10px] py-[5px]">{ebf._logoErr}</div>}
              {ebf.logoImage && <button onClick={() => setEbf((s) => ({ ...s, logoImage: '', _logoErr: '' }))} className="mt-1.5 text-xs text-(--color-red) bg-transparent border-none cursor-pointer p-0 font-[family-name:var(--font-body)]">Görseli kaldır</button>}
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-[10px] mt-1">
          <Input label="Web Sitesi" placeholder="https://marka.com" value={ebf.website} onChange={(e) => setEbf({ ...ebf, website: e.target.value })} />
          <Input label="Instagram" placeholder="https://instagram.com/..." value={ebf.instagram} onChange={(e) => setEbf({ ...ebf, instagram: e.target.value })} />
        </div>
        <Textarea label="Açıklama" value={ebf.bio} onChange={(e) => setEbf({ ...ebf, bio: e.target.value })} rows={3} />
        <div className="flex gap-2 justify-between">
          <Btn variant="danger" onClick={onDelete}>Sil</Btn>
          <div className="flex gap-2">
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
function AddBrandModal({ brands, onClose, onAdd, initialType = 'original' }) {
  const [bf, setBf] = useState({ name: '', slug: '', type: initialType, origin: '', founded: '', logo: '', logoImage: '', category: 'Designer', bio: '', instagram: '', website: '', arabClone: false });
  const [brandErr, setBrandErr] = useState('');
  const [cropModal, setCropModal] = useState({ open: false, src: '' });

  const handleCropConfirm = async (dataURL) => {
    setCropModal({ open: false, src: '' });
    setBf((s) => ({ ...s, _logoUploading: true, _logoErr: '' }));
    try {
      const url = await uploadBrandLogo(dataURL, bf.slug);
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
        <div className="grid grid-cols-2 gap-[10px]">
          <Input label="Marka Adı *" value={bf.name} onChange={(e) => setBf({ ...bf, name: e.target.value })} />
          <Input label="Slug" value={bf.slug} onChange={(e) => setBf({ ...bf, slug: e.target.value.toLowerCase().replace(/ /g, '-').replace(/^-+/, '') })} />
          <Input label="Logo Kısaltma" value={bf.logo} onChange={(e) => setBf({ ...bf, logo: e.target.value })} />
          <Input label="Köken" value={bf.origin} onChange={(e) => setBf({ ...bf, origin: e.target.value })} />
          <Input label="Kuruluş Yılı" type="number" value={bf.founded} onChange={(e) => setBf({ ...bf, founded: e.target.value })} />
        </div>
        {bf.type === 'original' && (
          <div className="mt-2">
            <div className="text-xs font-semibold text-(--color-text-mid) mb-2">Parfüm Kategorisi</div>
            <div className="flex gap-[10px]">
              {['Designer', 'Niche'].map((cat) => (
                <label key={cat} className="flex items-center gap-2 px-4 py-2 rounded-[10px] cursor-pointer text-[13px] font-semibold transition-all duration-150"
                  style={{ border: `1px solid ${bf.category === cat ? C.navy : C.border}`, background: bf.category === cat ? '#f0f0f8' : '#fafafa', color: bf.category === cat ? C.navy : C.textMid }}>
                  <input type="radio" name="bf-category" value={cat} checked={bf.category === cat} onChange={() => setBf({ ...bf, category: cat })} style={{ accentColor: C.navy }} />
                  {cat}
                </label>
              ))}
            </div>
          </div>
        )}
        {bf.type === 'muadil' && (
          <label className="mt-2 flex items-start gap-2.5 px-4 py-3 rounded-[10px] cursor-pointer transition-all duration-150"
            style={{ border: `1px solid ${bf.arabClone ? C.gold : C.border}`, background: bf.arabClone ? C.goldBg : '#fafafa' }}>
            <input type="checkbox" checked={bf.arabClone} onChange={(e) => setBf({ ...bf, arabClone: e.target.checked })} style={{ accentColor: C.gold, marginTop: '2px' }} />
            <div>
              <div className="text-[13px] font-semibold" style={{ color: bf.arabClone ? C.gold : C.textMid }}>Arap Klonu</div>
              <div className="text-[12px] mt-0.5" style={{ color: C.textLight }}>Muadiller "Benzeri" eki almaz; her parfüme kendi adını yazarsınız (ör. 9 P.M.).</div>
            </div>
          </label>
        )}
        <div className="mt-1">
          <div className="text-xs font-semibold text-(--color-text-mid) mb-1.5">Logo Görseli</div>
          <div className="flex gap-3 items-center">
            <div onClick={() => document.getElementById('brand-logo-add').click()}
              className="w-16 h-16 rounded-full flex items-center justify-center cursor-pointer overflow-hidden shrink-0"
              style={{ border: `2px dashed ${bf.logoImage ? C.gold : C.border}`, background: bf.logoImage ? '#fff' : '#fafafa' }}>
              {bf.logoImage ? <img src={bf.logoImage} alt="logo" className="w-full h-full object-cover" /> : <span className="text-[22px]">+</span>}
            </div>
            <input id="brand-logo-add" type="file" accept="image/jpeg,image/png,image/webp" className="hidden"
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
            <div className="flex-1">
              <div className="text-xs text-(--color-text-mid) leading-[1.5]">JPG, PNG veya WebP · Maks. 2MB<br />Görsel yoksa kısaltma metin olarak gösterilir.</div>
              {bf._logoErr && <div className="mt-1.5 text-xs text-(--color-red) bg-[#fff5f5] border border-[#fecaca] rounded-[6px] px-[10px] py-[5px]">{bf._logoErr}</div>}
              {bf.logoImage && <button onClick={() => setBf((s) => ({ ...s, logoImage: '', _logoErr: '' }))} className="mt-1.5 text-xs text-(--color-red) bg-transparent border-none cursor-pointer p-0 font-[family-name:var(--font-body)]">Görseli kaldır</button>}
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-[10px] mt-1">
          <Input label="Web Sitesi" placeholder="https://marka.com" value={bf.website} onChange={(e) => setBf({ ...bf, website: e.target.value })} />
          <Input label="Instagram" placeholder="https://instagram.com/..." value={bf.instagram} onChange={(e) => setBf({ ...bf, instagram: e.target.value })} />
        </div>
        <Textarea label="Açıklama" value={bf.bio} onChange={(e) => setBf({ ...bf, bio: e.target.value })} rows={3} />
        {brandErr && <div className="mb-[10px] px-3 py-2 bg-[#fff5f5] border border-[#fecaca] rounded-lg text-[13px] text-(--color-red)">{brandErr}</div>}
        <div className="flex gap-2 justify-end">
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
      <div className="grid grid-cols-2 gap-[10px]">
        <Input label="Parfüm Adı *" value={pf.name} onChange={(e) => setPf({ ...pf, name: e.target.value })} placeholder="Sauvage" />
        <SearchableSelect label="Marka *" placeholder="Marka ara veya seçin…" value={pf.brandId} onChange={(val) => setPf({ ...pf, brandId: val })} options={brands.filter((b) => b.type === 'original').map((b) => ({ value: String(b.id), label: b.name }))} />
        <Select label="Cinsiyet" value={pf.gender} onChange={(e) => setPf({ ...pf, gender: e.target.value })} options={['Erkek', 'Kadın', 'Unisex'].map((g) => ({ value: g, label: g }))} />
        <Input label="Çıkış Yılı" type="number" value={pf.year} onChange={(e) => setPf({ ...pf, year: e.target.value })} placeholder="2015" />
      </div>
      <Input label="Üst Notalar (virgülle)" value={pf.topNotes} onChange={(e) => setPf({ ...pf, topNotes: e.target.value })} placeholder="Bergamot, Biber" />
      <Input label="Kalp Notaları" value={pf.heartNotes} onChange={(e) => setPf({ ...pf, heartNotes: e.target.value })} placeholder="Lavanta, Sedir" />
      <Input label="Dip Notalar" value={pf.baseNotes} onChange={(e) => setPf({ ...pf, baseNotes: e.target.value })} placeholder="Amber, Misk" />
      <Textarea label="Açıklama" value={pf.description} onChange={(e) => setPf({ ...pf, description: e.target.value })} rows={2} />
      <PerfumeImageSlots images={pf.images} onChange={(imgs) => setPf({ ...pf, images: imgs })} />
      {perfErr && <div className="mt-[10px] px-3 py-2 bg-[#fff5f5] border border-[#fecaca] rounded-lg text-[13px] text-(--color-red)">{perfErr}</div>}
      <div className="flex gap-2 justify-end mt-6">
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
  const isArabClone = !!brands.find((x) => String(x.id) === mf.brandId)?.arabClone;

  const handleAdd = () => {
    if (!mf.name || !mf.brandId || !mf.targetPerfumeId) return;
    const norm = mf.name.trim().toLowerCase();
    // Mükerrer kontrolü muadil MARKASINA göre kapsanır: farklı muadil markaları aynı
    // orijinalin muadilini ("Homme Marine Benzeri") ekleyebilir; ama aynı marka aynı
    // adlı muadili iki kez ekleyemez.
    const dup = muadilPerfumes.find((m) => m.name.trim().toLowerCase() === norm && String(m.brandId) === String(mf.brandId));
    if (dup) { setMuadilErr(`Bu markada "${mf.name}" adlı muadil zaten mevcut.`); return; }
    setMuadilErr('');
    const b = brands.find((x) => String(x.id) === mf.brandId);
    const t = perfumes.find((x) => String(x.id) === mf.targetPerfumeId);
    const mPrimary = mf.images.find(Boolean)?.src || '';
    onAdd({ ...mf, brandId: mf.brandId, targetPerfumeId: mf.targetPerfumeId, slug: mf.slug || slugify(mf.name), brandSlug: b?.slug || '', brandName: b?.name || '', targetPerfumeName: t?.name || '', targetBrandName: t?.brandName || '', gender: t?.gender || mf.gender || '', image: mPrimary, images: mf.images });
  };

  return (
    <Modal open onClose={onClose} title="Muadil Parfüm Ekle" width="540px">
      <div className="grid grid-cols-2 gap-[10px]">
        <SearchableSelect label="Muadil Marka *" placeholder="Marka ara veya seçin…" value={mf.brandId} onChange={(val) => setMf((s) => {
          const arab = !!brands.find((x) => String(x.id) === val)?.arabClone;
          const p = perfumes.find((x) => String(x.id) === s.targetPerfumeId);
          // Arap klonu markasında ad elle yazılır; değilse parfüm adından "Benzeri" üretilir.
          return { ...s, brandId: val, name: arab ? '' : (p ? `${p.name} Benzeri` : s.name) };
        })} options={brands.filter((b) => b.type === 'muadil').map((b) => ({ value: String(b.id), label: b.name }))} />
        <SearchableSelect label="Hedef Orijinal *" placeholder="Parfüm ara veya seçin…" value={mf.targetPerfumeId} onChange={(val) => setMf((s) => {
          const p = perfumes.find((x) => String(x.id) === val);
          const arab = !!brands.find((x) => String(x.id) === s.brandId)?.arabClone;
          // Muadil adı yalnızca parfüm adından üretilir (marka adı HARİÇ).
          // Ör. "Kenzo Homme Marine" seçilirse → "Homme Marine Benzeri".
          // Arap klonunda ad elle yazıldığı için otomatik üretilmez.
          return { ...s, targetPerfumeId: val, name: arab ? s.name : (p ? `${p.name} Benzeri` : ''), gender: p?.gender || '' };
        })} options={[...perfumes].sort((a, b) => `${a.brandName} ${a.name}`.localeCompare(`${b.brandName} ${b.name}`, 'tr')).map((p) => ({ value: String(p.id), label: `${p.brandName} — ${p.name}` }))} />
      </div>
      {mf.gender && (
        <div className="flex items-center gap-2 px-3 py-2 bg-[#f8f9fb] border border-(--color-border) rounded-lg text-[13px] text-(--color-text-mid)">
          <span className="font-semibold text-(--color-text-light) tracking-[.03em] uppercase text-[11px]">Cinsiyet</span>
          <span className="font-bold text-(--color-navy)">{mf.gender}</span>
          <span className="ml-auto text-[11px] text-(--color-text-light)">Hedef parfümden alındı</span>
        </div>
      )}
      {isArabClone ? (
        <Input label="Muadil Parfüm Adı *" value={mf.name} onChange={(e) => setMf({ ...mf, name: e.target.value })} placeholder="Ör. 9 P.M." />
      ) : (mf.name && (
        <div className="mt-0.5 px-3 py-2 bg-(--color-gold-bg) border border-(--color-gold-border) rounded-lg text-[13px] text-(--color-navy) font-semibold">
          Muadil adı: <span className="text-(--color-gold)">{mf.name}</span>
        </div>
      ))}
      <Textarea label="Açıklama" value={mf.description} onChange={(e) => setMf({ ...mf, description: e.target.value })} rows={3} />
      <PerfumeImageSlots images={mf.images} onChange={(imgs) => setMf({ ...mf, images: imgs })} />
      {muadilErr && <div className="mt-[10px] px-3 py-2 bg-[#fff5f5] border border-[#fecaca] rounded-lg text-[13px] text-(--color-red)">{muadilErr}</div>}
      <div className="flex gap-2 justify-end mt-6">
        <Btn variant="secondary" onClick={onClose}>İptal</Btn>
        <Btn onClick={handleAdd} disabled={!mf.name || !mf.brandId || !mf.targetPerfumeId}>Ekle</Btn>
      </div>
    </Modal>
  );
}

/* ─── Bulk Add Muadil Modal ─────────────────────────────────────────────── */
function BulkAddMuadilModal({ brands, perfumes, muadilPerfumes, onClose, onAdd }) {
  const mkRow = () => ({ id: Date.now() + Math.random(), targetPerfumeId: '', name: '' });
  const [brandId, setBrandId] = useState('');
  const [rows, setRows] = useState(() => [mkRow()]);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState([]);
  const [lastAddedId, setLastAddedId] = useState(null);
  const rowsEndRef = useRef(null);
  const nameInputRefs = useRef({});
  const savingRef = useRef(false);
  savingRef.current = saving;
  const addRowRef = useRef(null);

  const isArabClone = !!brands.find((b) => String(b.id) === brandId)?.arabClone;
  const muadilBrands = brands.filter((b) => b.type === 'muadil').sort((a, b) => a.name.localeCompare(b.name, 'tr'));
  const sortedPerfumes = [...perfumes].sort((a, b) => `${a.brandName} ${a.name}`.localeCompare(`${b.brandName} ${b.name}`, 'tr'));
  const perfumeOptions = sortedPerfumes.map((p) => ({ value: String(p.id), label: `${p.brandName} — ${p.name}` }));
  const brandOptions = [{ value: '', label: 'Önce marka seçin' }, ...muadilBrands.map((b) => ({ value: String(b.id), label: b.name }))];

  const setRow = (id, targetPerfumeId) => setRows((prev) => prev.map((r) => r.id === id ? { ...r, targetPerfumeId } : r));
  const setRowName = (id, name) => setRows((prev) => prev.map((r) => r.id === id ? { ...r, name } : r));
  const removeRow = (id) => setRows((prev) => prev.length > 1 ? prev.filter((r) => r.id !== id) : prev);

  const addRow = () => {
    const r = mkRow();
    setRows((prev) => [...prev, r]);
    setLastAddedId(r.id);
    setTimeout(() => {
      rowsEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      setLastAddedId(null);
    }, 80);
  };
  addRowRef.current = addRow;

  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && !savingRef.current) {
        e.preventDefault();
        addRowRef.current();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  const handleSave = async () => {
    const brand = brands.find((b) => String(b.id) === brandId);
    if (!brand) { setErrors(['Muadil marka seçilmedi.']); return; }

    const validRows = rows.filter((r) => r.targetPerfumeId);
    if (!validRows.length) { setErrors(['En az bir hedef parfüm seçilmeli.']); return; }

    // Form içi aynı parfümü iki kez seçme kontrolü
    const perfumeIds = validRows.map((r) => r.targetPerfumeId);
    if (perfumeIds.length !== new Set(perfumeIds).size) {
      setErrors(['Aynı hedef parfüm birden fazla satırda seçilmiş.']);
      return;
    }

    // Arap klonu markasında her satıra muadil parfüm adı yazılmalı
    if (isArabClone && validRows.some((r) => !r.name || !r.name.trim())) {
      setErrors(['Arap klonu markasında her satır için muadil parfüm adı girilmeli.']);
      return;
    }

    // Veritabanındaki mükerrer kontrolü — targetPerfumeId + brandId ile
    const skipped = [];
    const toSave = [];
    validRows.forEach((r) => {
      const p = perfumes.find((x) => String(x.id) === r.targetPerfumeId);
      if (!p) return;
      const dup = muadilPerfumes.find(
        (m) => String(m.targetPerfumeId) === String(r.targetPerfumeId) && String(m.brandId) === String(brandId)
      );
      if (dup) skipped.push({ muadilName: isArabClone ? (r.name?.trim() || p.name) : `${p.name} Benzeri`, target: `${p.brandName} — ${p.name}` });
      else toSave.push(r);
    });

    if (!toSave.length) {
      setErrors(skipped.map((s) => `"${s.muadilName}" zaten eklenmiş  ·  Hedef: ${s.target}`));
      return;
    }

    setErrors([]);
    setSaving(true);
    try {
      for (const r of toSave) {
        const p = perfumes.find((x) => String(x.id) === r.targetPerfumeId);
        const name = isArabClone ? r.name.trim() : `${p.name} Benzeri`;
        await onAdd({ name, slug: slugify(name), brandId, brandSlug: brand.slug, brandName: brand.name, targetPerfumeId: r.targetPerfumeId, targetPerfumeName: p.name, targetBrandName: p.brandName, gender: p.gender || '', description: '', image: '', images: [null, null, null] });
      }
      if (skipped.length) {
        // Kaydedilenler eklendi, ama bazıları atlandı — modal açık kalsın, uyarı göster
        const skippedTargets = new Set(skipped.map((s) => s.target));
        setRows((prev) => prev.filter((r) => {
          const p = perfumes.find((x) => String(x.id) === r.targetPerfumeId);
          return p && skippedTargets.has(`${p.brandName} — ${p.name}`);
        }));
        setErrors(skipped.map((s) => `"${s.muadilName}" zaten eklenmiş  ·  Hedef: ${s.target}`));
        setSaving(false);
      } else {
        onClose();
      }
    } catch {
      setSaving(false);
    }
  };

  const filledCount = rows.filter((r) => r.targetPerfumeId).length;

  return (
    <Modal open onClose={onClose} title="Toplu Muadil Parfüm Ekle" width="680px">
      {/* Marka Seçimi */}
      <div className="mb-5 pb-5" style={{ borderBottom: `1px solid ${C.border}` }}>
        <label className="block text-[13px] font-semibold mb-[6px]" style={{ color: C.textMid }}>Muadil Marka *</label>
        <SearchableSelect
          options={brandOptions}
          value={brandId}
          onChange={(val) => { setBrandId(val); if (val && rows[0]) setLastAddedId(rows[0].id); }}
          placeholder="Marka ara veya seçin…"
          autoOpen
        />
        {brandId && (
          <div className="mt-2 px-3 py-1.5 inline-flex items-center gap-1.5 rounded-lg text-[12px] font-semibold" style={{ background: C.goldBg, border: `1px solid ${C.goldBorder}`, color: C.gold }}>
            <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
            {brands.find((b) => String(b.id) === brandId)?.name}
          </div>
        )}
      </div>

      {/* Satır başlıkları */}
      <div className="grid gap-x-3 px-1 mb-2" style={{ gridTemplateColumns: '22px 1fr 190px 28px' }}>
        {['#', 'Hedef Orijinal Parfüm', isArabClone ? 'Muadil Adı' : 'Muadil Adı (otomatik)', ''].map((h, i) => (
          <span key={i} className="text-[11px] font-bold uppercase tracking-[.05em]" style={{ color: C.textLight }}>{h}</span>
        ))}
      </div>

      {/* Satırlar */}
      <div className="flex flex-col gap-[6px] mb-3">
        {rows.map((row, idx) => {
          const p = perfumes.find((x) => String(x.id) === row.targetPerfumeId);
          const muadilName = p ? `${p.name} Benzeri` : '';
          return (
            <div key={row.id} className="grid gap-x-3 items-center" style={{ gridTemplateColumns: '22px 1fr 190px 28px' }}>
              <span className="text-[12px] font-bold text-center" style={{ color: C.textLight }}>{idx + 1}</span>
              <SearchableSelect
                options={perfumeOptions}
                value={row.targetPerfumeId}
                onChange={(val) => setRow(row.id, val)}
                onCommit={() => { if (isArabClone) setTimeout(() => nameInputRefs.current[row.id]?.focus(), 0); }}
                placeholder="Parfüm ara veya seçin…"
                disabled={!brandId}
                autoOpen={row.id === lastAddedId}
              />
              {isArabClone ? (
                <input
                  ref={(el) => { nameInputRefs.current[row.id] = el; }}
                  value={row.name}
                  onChange={(e) => setRowName(row.id, e.target.value)}
                  disabled={!row.targetPerfumeId}
                  placeholder="Parfüm adı"
                  className="h-[36px] box-border w-full rounded-[8px] px-[10px] text-[12px] font-semibold bg-white outline-none font-[family-name:var(--font-body)]"
                  style={{ border: `1px solid ${row.name ? C.goldBorder : C.border}`, color: C.navy }}
                />
              ) : (
                <div
                  className="h-[36px] rounded-[8px] px-[10px] flex items-center text-[12px] font-semibold truncate"
                  style={{ background: muadilName ? C.goldBg : '#f5f5f5', border: `1px solid ${muadilName ? C.goldBorder : C.border}`, color: muadilName ? C.gold : C.textLight }}
                >
                  {muadilName || '—'}
                </div>
              )}
              <button
                onClick={() => removeRow(row.id)}
                disabled={rows.length === 1}
                className="flex items-center justify-center w-7 h-7 rounded-[7px] border-none text-[17px] font-bold leading-none transition-all"
                style={{ background: rows.length === 1 ? '#f5f5f5' : '#fff5f5', color: rows.length === 1 ? C.textLight : C.red, cursor: rows.length === 1 ? 'not-allowed' : 'pointer' }}
              >×</button>
            </div>
          );
        })}
        <div ref={rowsEndRef} />
      </div>

      {/* Satır Ekle + kısayol ipucu */}
      <div className="flex items-center gap-3 mb-5">
        <button
          onClick={addRow}
          disabled={!brandId}
          className="flex items-center gap-[6px] h-[34px] px-[14px] rounded-[8px] text-[13px] font-semibold transition-all"
          style={{ border: `1.5px dashed ${brandId ? C.gold : C.border}`, color: brandId ? C.gold : C.textLight, background: brandId ? C.goldBg : '#fafafa', cursor: brandId ? 'pointer' : 'not-allowed' }}
        >
          <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Satır Ekle
        </button>
        <span className="text-[11px]" style={{ color: C.textLight }}>
          ya da{' '}
          <kbd style={{ padding: '2px 5px', borderRadius: '4px', fontSize: '10px', fontWeight: 700, background: '#f0f0f0', border: `1px solid ${C.border}`, color: C.textMid, fontFamily: 'inherit' }}>Ctrl</kbd>
          {' + '}
          <kbd style={{ padding: '2px 5px', borderRadius: '4px', fontSize: '10px', fontWeight: 700, background: '#f0f0f0', border: `1px solid ${C.border}`, color: C.textMid, fontFamily: 'inherit' }}>↵</kbd>
          {' '}— yeni satır ekler ve arama odaklanır
        </span>
      </div>

      {errors.length > 0 && (
        <div className="mb-4 px-3 py-2 bg-[#fff5f5] border border-[#fecaca] rounded-lg">
          {errors.map((e, i) => <div key={i} className="text-[13px]" style={{ color: C.red }}>{e}</div>)}
        </div>
      )}

      <div className="flex items-center justify-between pt-1">
        <span className="text-[13px]" style={{ color: C.textLight }}>
          {filledCount} / {rows.length} satır dolu
        </span>
        <div className="flex gap-2">
          <Btn variant="secondary" onClick={onClose}>İptal</Btn>
          <Btn onClick={handleSave} disabled={saving || !brandId || !filledCount}>
            {saving ? 'Kaydediliyor…' : `${filledCount} Muadil Kaydet`}
          </Btn>
        </div>
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
      <div className="relative w-full h-[320px] bg-[#111] rounded-[10px] overflow-hidden">
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
      <div className="pt-[14px] flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <span className="text-xs text-(--color-text-light) shrink-0">Yakınlaştır</span>
          <input type="range" min={1} max={3} step={0.01} value={zoom} onChange={(e) => setZoom(Number(e.target.value))} className="flex-1 cursor-pointer" style={{ accentColor: C.navy }} />
        </div>
        <div className="flex gap-2 justify-end">
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
        resolve(canvas.toDataURL('image/webp', quality));
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
    <div className="inline-flex items-center justify-center px-2 rounded-[20px] text-[11px] font-semibold" style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}`, height: '20px' }}><p className="m-0 p-0 w-max cap-center" style={{ lineHeight: '18px' }}>{g}</p></div>
  );
}

function MergePerfDropItem({ p, onSel, muadilCountById }) {
  return (
    <button
      onMouseDown={(e) => { e.preventDefault(); onSel(p); }}
      className="w-full text-left px-3 py-[9px] bg-transparent border-none cursor-pointer font-[family-name:var(--font-body)] flex items-center gap-[10px]"
      style={{ borderBottom: `1px solid ${C.borderLight}` }}
      onMouseEnter={(e) => (e.currentTarget.style.background = '#f4f4f8')}
      onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
    >
      <div className="flex-1 min-w-0">
        <div className="text-[13px] font-semibold text-(--color-text)">{p.name}</div>
        <div className="text-[11px] text-(--color-text-light)">{p.brandName}</div>
      </div>
      <GChip g={p.gender} />
      {muadilCountById[p.id] > 0 && <span className="text-[11px] text-(--color-green) font-semibold shrink-0">{muadilCountById[p.id]}m</span>}
    </button>
  );
}

function MergePerfRow({ p, side, muadilCountById }) {
  return (
    <div className="px-[14px] py-[10px] rounded-[10px] flex items-center gap-[10px] mt-2"
      style={{ border: `2px solid ${side === 'src' ? '#fecaca' : '#bbf7d0'}`, background: side === 'src' ? '#fff5f5' : '#f0fdf4' }}>
      <div className="flex-1 min-w-0">
        <div className="font-bold text-sm text-(--color-text) whitespace-nowrap overflow-hidden text-ellipsis">{p.name}</div>
        <div className="text-xs text-(--color-text-light)">{p.brandName}</div>
      </div>
      <GChip g={p.gender} />
      {muadilCountById[p.id] > 0 && <span className="text-xs font-bold text-(--color-green) shrink-0">{muadilCountById[p.id]}m</span>}
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
      <div className="text-xs font-bold uppercase tracking-[.05em] mb-1.5" style={{ color: labelColor }}>{label}</div>
      <div ref={refEl} className="relative">
        <div className="relative">
          <svg className="absolute left-[10px] top-1/2 -translate-y-1/2 text-(--color-text-light) pointer-events-none" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          <input
            value={q}
            onChange={(e) => { setQ(e.target.value); setOpen(true); if (!e.target.value) onSel(null); }}
            onFocus={() => { if (q) setOpen(true); }}
            placeholder="Parfüm adı veya marka ara…"
            className="w-full box-border h-[38px] rounded-[9px] text-[13px] text-(--color-text) bg-white outline-none font-[family-name:var(--font-body)]"
            style={{ paddingLeft: '32px', paddingRight: q ? '32px' : '10px', border: `1.5px solid ${selected ? (side === 'src' ? '#fca5a5' : '#86efac') : C.border}` }}
          />
          {q && (
            <button onClick={handleClear} className="absolute right-2 top-1/2 -translate-y-1/2 bg-transparent border-none cursor-pointer text-(--color-text-light) text-base leading-none p-0.5 flex items-center">×</button>
          )}
        </div>
        {selected && <MergePerfRow p={selected} side={side} muadilCountById={muadilCountById} />}
        {open && hasItems && (
          <div className="absolute top-[42px] left-0 right-0 bg-white border border-(--color-border) rounded-[10px] shadow-[0_6px_24px_rgba(0,0,0,.12)] z-[200] overflow-hidden">
            {hasGrouped ? (
              <>
                {groupedResults.sameBrand.length > 0 && (
                  <>
                    <div className="px-3 pt-[5px] pb-[3px] text-[10px] font-bold text-(--color-gold) uppercase tracking-[.07em] bg-(--color-gold-bg)" style={{ borderBottom: `1px solid ${C.goldBorder}` }}>
                      Aynı Marka
                    </div>
                    {groupedResults.sameBrand.map((p) => <MergePerfDropItem key={p.id} p={p} muadilCountById={muadilCountById} onSel={handleSel} />)}
                  </>
                )}
                {groupedResults.others.length > 0 && (
                  <>
                    <div className="px-3 pt-[5px] pb-[3px] text-[10px] font-bold text-(--color-red) uppercase tracking-[.07em] bg-[#fff5f5]"
                      style={{ borderBottom: '1px solid #fecaca', borderTop: groupedResults.sameBrand.length > 0 ? '1px solid #fecaca' : 'none' }}>
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
            batch.update(d.ref, { targetPerfumeId: tgt.id, targetPerfumeName: tgt.name, targetBrandName: tgt.brandName, name: `${tgt.name} Benzeri` });
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
            name: `${src.name} Benzeri`,
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
    <div className="max-w-[960px]">
      {/* Selector card */}
      <Card style={{ padding: '24px', marginBottom: '20px' }}>
        <div className="flex justify-between items-center mb-1">
          <div className="font-[800] text-[17px] text-(--color-navy)">Parfüm Birleştirme</div>
          {onRefresh && (
            <button
              onClick={async () => { setMergeRefreshing(true); try { await onRefresh(); } finally { setMergeRefreshing(false); } }}
              disabled={mergeRefreshing}
              className="flex items-center gap-[5px] px-[10px] py-[5px] rounded-[7px] border border-(--color-border) bg-white text-(--color-text-mid) text-xs font-semibold font-[family-name:var(--font-body)]"
              style={{ cursor: mergeRefreshing ? 'default' : 'pointer', opacity: mergeRefreshing ? 0.6 : 1 }}>
              <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ animation: mergeRefreshing ? 'spin 0.8s linear infinite' : 'none' }}><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
              {mergeRefreshing ? 'Yenileniyor…' : 'Yenile'}
            </button>
          )}
        </div>
        <div className="text-[13px] text-(--color-text-light) mb-6">Solda <b>silinecek</b> (kaynak), sağda <b>korunacak</b> (hedef) parfümü seçin. Muadiller otomatik taşınır; eksik cinsiyet / nota / açıklama kopyalanır.</div>

        <div className="grid gap-3 items-start" style={{ gridTemplateColumns: '1fr 32px 1fr' }}>
          <MergePerfSearchBox
            label="Silinecek (Kaynak)" labelColor="#dc2626"
            q={srcQ} setQ={setSrcQ} open={srcOpen} setOpen={setSrcOpen}
            refEl={srcRef} results={srcResults}
            onSel={(p) => { setSource(p); if (!p) setSrcQ(''); }}
            selected={source} side="src" muadilCountById={muadilCountById}
          />
          <div className="pt-6 flex items-center justify-center text-(--color-text-light)">
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
          <div className="mt-3 text-[13px] text-(--color-red) text-center">Kaynak ve hedef aynı parfüm olamaz.</div>
        )}

        <div className="mt-[18px] flex justify-center">
          <Btn onClick={addPair} disabled={!source || !target || source?.id === target?.id}>
            + Listeye Ekle
          </Btn>
        </div>
      </Card>

      {/* Pending pairs */}
      {pairs.length > 0 && (
        <Card style={{ overflow: 'hidden', marginBottom: '20px' }}>
          <div className="px-[18px] py-[13px] border-b border-(--color-border) flex items-center justify-between gap-3">
            <span className="font-bold text-(--color-navy)">Bekleyen Birleştirmeler <span className="font-normal text-[13px] text-(--color-text-light)">({pairs.length} çift)</span></span>
            <Btn onClick={runMerges} disabled={running}>
              {running ? `İşleniyor… ${progress.done}/${progress.total}` : `Tümünü Birleştir (${pairs.length})`}
            </Btn>
          </div>

          {running && (
            <div className="px-[18px] py-[10px] bg-[#fffbeb] border-b border-[#fde68a] flex items-center gap-[10px]">
              <div className="w-4 h-4 rounded-full animate-spin shrink-0" style={{ border: '2.5px solid #fde68a', borderTop: `2.5px solid ${C.gold}` }} />
              <div className="flex-1 h-1.5 bg-[#fde68a] rounded-[3px] overflow-hidden">
                <div className="h-full rounded-[3px] transition-[width] duration-300" style={{ background: C.gold, width: `${(progress.done / progress.total) * 100}%` }} />
              </div>
              <span className="text-xs text-[#92400e] shrink-0">{progress.done}/{progress.total}</span>
            </div>
          )}

          <TableScrollHint />
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] border-collapse">
              <thead>
                <tr className="bg-[#f9f9fb]">
                  <th style={{ ...thBase, width: '44%' }}>Silinecek</th>
                  <th style={{ ...thBase, width: '8%', textAlign: 'center' }}></th>
                  <th style={{ ...thBase, width: '44%' }}>Korunacak</th>
                  <th style={{ ...thBase, width: '36px' }}></th>
                </tr>
              </thead>
              <tbody>
                {pairs.map((pair) => (
                  <tr key={pair.id} style={{ borderBottom: `1px solid ${C.borderLight}` }} onMouseEnter={(e) => (e.currentTarget.style.background = '#fafafa')} onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}>
                    <td className="px-[14px] py-[10px]">
                      <div className="font-semibold text-[13px] text-[#dc2626]">{pair.source.name}</div>
                      <div className="text-[11px] text-(--color-text-light) mb-1">{pair.source.brandName}</div>
                      <div className="flex gap-1.5 items-center">
                        <GChip g={pair.source.gender} />
                        {muadilCountById[pair.source.id] > 0 && <span className="text-[11px] text-(--color-green) font-semibold">{muadilCountById[pair.source.id]} muadil</span>}
                      </div>
                    </td>
                    <td className="text-center text-(--color-text-light) text-base">→</td>
                    <td className="px-[14px] py-[10px]">
                      <div className="font-semibold text-[13px] text-[#16a34a]">{pair.target.name}</div>
                      <div className="text-[11px] text-(--color-text-light) mb-1">{pair.target.brandName}</div>
                      <div className="flex gap-1.5 items-center">
                        <GChip g={pair.target.gender} />
                        {muadilCountById[pair.target.id] > 0 && <span className="text-[11px] text-(--color-green) font-semibold">{muadilCountById[pair.target.id]} muadil</span>}
                      </div>
                    </td>
                    <td className="text-center">
                      <button
                        onClick={() => removePair(pair.id)}
                        disabled={running}
                        className="bg-transparent border-none text-[20px] leading-none px-2 py-1 rounded-[6px]"
                        style={{ cursor: running ? 'default' : 'pointer', color: C.textLight, opacity: running ? 0.4 : 1 }}
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
          <div className="px-[18px] py-[13px] border-b border-(--color-border) flex items-center gap-3">
            <span className="font-bold text-(--color-navy)">Sonuçlar</span>
            <span className="text-[13px] text-(--color-green) font-semibold">{results.filter((r) => r.status === 'ok').length} başarılı</span>
            {results.some((r) => r.status === 'error') && (
              <span className="text-[13px] text-(--color-red) font-semibold">{results.filter((r) => r.status === 'error').length} hatalı</span>
            )}
            {undoData && (
              <button
                onClick={handleUndo}
                disabled={undoing}
                className="ml-auto flex items-center gap-[5px] px-3 py-[5px] rounded-[7px] border border-(--color-border) bg-white text-(--color-text-mid) text-xs font-semibold font-[family-name:var(--font-body)]"
                style={{ cursor: undoing ? 'default' : 'pointer', opacity: undoing ? 0.6 : 1 }}
              >
                <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="9 14 4 9 9 4"/><path d="M20 20v-7a4 4 0 0 0-4-4H4"/></svg>
                {undoing ? 'Geri alınıyor…' : 'Son Birleştirmeyi Geri Al'}
              </button>
            )}
          </div>
          <TableScrollHint />
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] border-collapse">
              <tbody>
                {results.map((r, i) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${C.borderLight}`, background: r.status === 'ok' ? '#f0fdf4' : '#fff5f5' }}>
                    <td className="px-[14px] py-[10px] w-[30%]">
                      <div className="text-[13px] font-semibold text-[#dc2626]">{r.source.name}</div>
                      <div className="text-[11px] text-(--color-text-light)">{r.source.brandName}</div>
                    </td>
                    <td className="text-center text-(--color-text-light) w-[30px]">→</td>
                    <td className="px-[14px] py-[10px] w-[30%]">
                      <div className="text-[13px] font-semibold text-[#16a34a]">{r.target.name}</div>
                      <div className="text-[11px] text-(--color-text-light)">{r.target.brandName}</div>
                    </td>
                    <td className="px-[14px] py-[10px] text-xs text-(--color-text-mid)">
                      {r.status === 'ok' ? (
                        <div className="flex gap-2 flex-wrap">
                          {r.moved > 0 && <span className="text-(--color-green) font-semibold">+{r.moved} muadil</span>}
                          {r.skipped > 0 && <span className="text-(--color-text-light)">{r.skipped} dup. silindi</span>}
                          {r.inherited?.includes('gender') && <span className="text-(--color-blue)">cinsiyet kopyalandı</span>}
                          {r.inherited?.includes('notes') && <span className="text-(--color-blue)">notalar kopyalandı</span>}
                          {r.inherited?.includes('description') && <span className="text-(--color-blue)">açıklama kopyalandı</span>}
                        </div>
                      ) : (
                        <span className="text-(--color-red)">Hata: {r.error}</span>
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
  const { brands, perfumes, muadilPerfumes, users, comments, addBrand, updateUser, deleteUser, addPerfume, updatePerfume, deletePerfume, addMuadil, updateMuadil, deleteMuadil, updateBrand, deleteBrand, fetchReviewsByDateRange, adminDeleteReviews, sliderImages, addSliderImage, removeSliderImage, updateSliderImage, reorderSliderImages, MAX_SLIDER, MAX_SIZE_MB, faviconUrl, updateFavicon, logoUrl, updateLogo, footerLogoUrl, updateFooterLogo, globalBrandHeaders, updateBrandGlobalHeader, refreshPerfumes, refreshMuadils, landingImages, updateLandingImage } = useData();

  const { sm, xs } = useW();
  const [tab, setTabRaw] = useState('dashboard');
  const [tabDropOpen, setTabDropOpen] = useState(false);
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
  const [showExportMenu, setShowExportMenu] = useState(false);
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
  const [showBulkMM, setShowBulkMM] = useState(false);
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
  const [exportOpts, setExportOpts] = useState({ notes: false, description: false, year: false });
  const toggleExportOpt = (k) => setExportOpts((prev) => ({ ...prev, [k]: !prev[k] }));
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

  // perfumes/muadils (1.541 + 7.731 doküman) artık sekme açılışında OTOMATIK
  // Firestore'dan çekilmez. Tüm admin tabloları mount'ta catalog.json'dan gelen
  // (bedava, ≤5 dk taze) state ile render edilir; kendi düzenlemeler optimistic
  // olarak anında görünür. Firestore'dan taze tam liste yalnızca "Yenile"
  // butonuyla (refreshPerfumes/refreshMuadils) bilinçli çekilir — panelin her
  // açılışında ~9.272 gereksiz okuma yapmasını önlemek için.

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
      const headers = ['Marka', 'Parfüm Adı', 'Cinsiyet', 'Muadil Sayısı', 'URL'];
      if (exportOpts.year)        headers.push('Çıkış Yılı');
      if (exportOpts.notes)       headers.push('Üst Notalar', 'Kalp Notaları', 'Dip Notalar');
      if (exportOpts.description) headers.push('Açıklama');

      const noteStr = (arr) => Array.isArray(arr) ? arr.join(', ') : (arr || '');

      const rows = sortedPerfs.map((p) => {
        const row = [p.brandName, p.name, p.gender || '', p.muadilCount, `/${p.brandSlug}/${p.slug}`];
        if (exportOpts.year)        row.push(p.year || '');
        if (exportOpts.notes)       row.push(noteStr(p.notes?.top), noteStr(p.notes?.heart), noteStr(p.notes?.base));
        if (exportOpts.description) row.push(p.description || '');
        return row;
      });

      return { headers, rows, filename: 'parfumler' };
    }
    if (tab === 'muadil') {
      const headers = ['Marka', 'Model', 'Muadil Firma', 'Genel Puan'];
      const rows = sortedMuadils.map((m) => [
        m.targetBrandName || '',
        m.targetPerfumeName || '',
        m.brandName || '',
        m.overall >= 0 ? m.overall : '',
      ]);
      return { headers, rows, filename: 'muadil-parfumler' };
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
    // HTML entity escaping — Firestore verisinin XSS vektörü olmasını önler
    const esc = (v) => String(v ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
    const thStyle = 'padding:8px 12px;background:#1a1a2e;color:#fff;font-weight:700;font-size:12px;text-align:left;border:1px solid #ddd;';
    const tdStyle = 'padding:7px 12px;font-size:12px;border:1px solid #ddd;';
    const trEven = 'background:#f9f9fb;';
    const ths = headers.map((h) => `<th style="${thStyle}">${esc(h)}</th>`).join('');
    const trs = rows.map((r, i) => `<tr style="${i % 2 === 1 ? trEven : ''}">${r.map((c) => `<td style="${tdStyle}">${esc(c)}</td>`).join('')}</tr>`).join('');
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${esc(filename)}</title><style>body{font-family:Arial,sans-serif;padding:20px}table{border-collapse:collapse;width:100%}h2{margin-bottom:16px;font-size:16px}@media print{button{display:none}}</style></head><body><h2>${esc(filename)} — ${rows.length} kayıt</h2><table><thead><tr>${ths}</tr></thead><tbody>${trs}</tbody></table><script>setTimeout(()=>window.print(),400)<\/script></body></html>`;
    const w = window.open('', '_blank'); w.document.write(html); w.document.close();
    setExportModal(false);
  };

  if (!isAdmin) return <div className="p-[60px] text-center text-(--color-text-light)">Erişim yetkisi yok.</div>;

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
    <div className="min-h-screen bg-(--color-bg)">
      <div className="bg-(--color-navy)" style={{ padding: sm ? '16px' : '22px 32px' }}>
        <div className="max-w-[1280px] mx-auto flex justify-between items-center gap-3">
          <div>
            <h1 className="font-[900] text-white" style={{ fontSize: sm ? '18px' : '22px' }}>Admin Paneli</h1>
            <p className="text-[rgba(255,255,255,.5)] text-[13px]">muadilci.com yönetim merkezi</p>
          </div>
          <Btn variant="ghost" style={{ borderColor: 'rgba(255,255,255,.3)', color: '#fff', flexShrink: 0 }} onClick={() => navigate('/')}>← Siteye Dön</Btn>
        </div>
      </div>

      {/* ── Sekme barı — masaüstü: yatay, mobil: dropdown ────────────────── */}
      <div className="bg-(--color-card) border-b border-(--color-border) sticky top-0 z-50">
        {sm ? (
          /* ── Mobil dropdown ── */
          <div className="relative px-4 py-2">
            <button
              onClick={() => setTabDropOpen(v => !v)}
              className="w-full flex items-center justify-between gap-2 px-4 py-3 rounded-xl border border-(--color-border) bg-(--color-bg) text-[14px] font-semibold cursor-pointer"
              style={{ color: C.text }}
            >
              <span className="flex items-center gap-2" style={{ color: C.gold }}>
                <FontAwesomeIcon icon={TABS.find(t => t.k === tab)?.icon || faGauge} className="text-xs" />
                {TABS.find(t => t.k === tab)?.l}
              </span>
              <FontAwesomeIcon icon={tabDropOpen ? faChevronUp : faChevronDown} className="text-xs" style={{ color: C.textLight }} />
            </button>
            {tabDropOpen && (
              <div className="absolute left-4 right-4 top-[calc(100%-4px)] bg-(--color-card) border border-(--color-border) rounded-xl shadow-lg z-50 overflow-hidden" style={{ boxShadow: C.shadowLg }}>
                {TABS.map(({ k, l, icon }) => {
                  const active = tab === k;
                  return (
                    <button key={k} onClick={() => { setTab(k); setTabDropOpen(false); }}
                      className="w-full flex items-center gap-3 px-4 py-3 border-none text-[13px] cursor-pointer text-left transition-colors duration-100"
                      style={{ background: active ? C.goldBg : 'transparent', color: active ? C.gold : C.text, fontWeight: active ? 700 : 400, borderBottom: `1px solid ${C.borderLight}` }}
                    >
                      <FontAwesomeIcon icon={icon} className="text-xs w-4" style={{ color: active ? C.gold : C.textMid }} />
                      {l}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          /* ── Masaüstü yatay bar ── */
          <div className="max-w-[1400px] mx-auto px-8 flex flex-wrap">
            {TABS.map(({ k, l, icon }) => {
              const active = tab === k;
              return (
                <button key={k} onClick={() => setTab(k)}
                  className="flex items-center gap-[7px] px-4 py-[13px] border-none bg-transparent text-[13px] cursor-pointer font-[family-name:var(--font-body)] transition-[color,border-color] duration-150 whitespace-nowrap"
                  style={{
                    borderBottom: `2px solid ${active ? C.gold : 'transparent'}`,
                    color: active ? C.gold : C.textMid,
                    fontWeight: active ? 700 : 500,
                  }}
                  onMouseEnter={e => { if (!active) e.currentTarget.style.color = C.text; }}
                  onMouseLeave={e => { if (!active) e.currentTarget.style.color = C.textMid; }}
                >
                  <FontAwesomeIcon icon={icon} className="text-xs" />
                  {l}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="max-w-[1400px] mx-auto">
        {/* ── İçerik alanı ─────────────────────────────────────────────────── */}
        <div style={{ padding: sm ? '16px' : '28px 32px' }}>

        {/* Dashboard */}
        {tab === 'dashboard' && (
          <div>
            <div className="flex justify-end mb-4">
              <a
                href="https://console.firebase.google.com/project/muadilci-890e4/analytics/overview"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-[7px] px-4 py-2 rounded-[9px] bg-[#FF6D00] text-white text-[13px] font-semibold no-underline font-[family-name:var(--font-body)] transition-opacity duration-150"
                onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.85')}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
              >
                <svg width="16" height="16" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6 26L13.5 5l4.5 9.5L22 12l4 14H6z" fill="#fff" fillOpacity=".9"/></svg>
                Firebase Analytics
              </a>
            </div>
            <div className="grid gap-[14px] mb-[26px]" style={{ gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))' }}>
              {stats.map((s) => (
                <Card key={s.label} style={{ padding: '18px' }}>
                  <div className="flex justify-between mb-2">
                    <span className="text-[13px] text-(--color-text-light)">{s.label}</span>
                    <FontAwesomeIcon icon={s.icon} style={{ fontSize: '20px', color: s.color, opacity: 0.7 }} />
                  </div>
                  <div className="text-[30px] font-[900]" style={{ color: s.color }}>{s.val}</div>
                </Card>
              ))}
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
            ? allSorted.filter((u) => (u.name || '').toLowerCase().includes(q) || (u.email || '').toLowerCase().includes(q) || (u.username || '').toLowerCase().includes(q) || (RL[u.role] || '').toLowerCase().includes(q))
            : allSorted.slice(0, 10);
          const submitSearch = () => setUserQuery(userInput);

          const exportRows = allSorted.map((u) => ({
            'Ad Soyad':       u.name  || '—',
            'Kullanıcı Adı':  u.username ? `@${u.username}` : '—',
            'E-posta':        u.email || '—',
            'Rol':            RL[u.role] || u.role || '—',
            'Durum':          u.deleted ? 'Silindi' : (u.role === 'admin' || u.active ? 'Aktif' : 'Dondurulmuş'),
            'Üyelik Tarihi':  fmtTs(u.createdAt),
            'Silinme Tarihi': fmtTs(u.deletedAt),
          }));

          const exportCSV = () => {
            const headers = Object.keys(exportRows[0]);
            const lines = [
              headers.join(','),
              ...exportRows.map((r) => headers.map((h) => `"${String(r[h]).replace(/"/g, '""')}"`).join(',')),
            ];
            const blob = new Blob(['﻿' + lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = 'kullaniciler.csv';
            a.click();
            URL.revokeObjectURL(a.href);
            setShowExportMenu(false);
          };

          const exportXLSX = async () => {
            const XLSX = await import('xlsx');
            const ws = XLSX.utils.json_to_sheet(exportRows);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Kullanıcılar');
            XLSX.writeFile(wb, 'kullaniciler.xlsx');
            setShowExportMenu(false);
          };

          const exportPDF = async () => {
            const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
              import('jspdf'),
              import('jspdf-autotable'),
            ]);
            const doc = new jsPDF({ orientation: 'landscape' });
            doc.setFontSize(13);
            doc.text('Kullanıcı Listesi', 14, 14);
            autoTable(doc, {
              head: [Object.keys(exportRows[0])],
              body: exportRows.map((r) => Object.values(r)),
              startY: 22,
              styles: { fontSize: 8, cellPadding: 3 },
              headStyles: { fillColor: [184, 147, 90], textColor: 255, fontStyle: 'bold' },
              alternateRowStyles: { fillColor: [250, 250, 248] },
            });
            doc.save('kullaniciler.pdf');
            setShowExportMenu(false);
          };
          return (
            <Card style={{ overflow: 'hidden' }}>
              <div className="px-[18px] py-[14px] border-b border-(--color-border) flex items-center justify-between flex-wrap gap-[10px]">
                <span className="font-bold text-(--color-navy)">
                  Kullanıcılar
                  <span className="font-normal text-[13px] text-(--color-text-light) ml-2">
                    {q ? `${displayed.length} sonuç` : `Son ${displayed.length} üye`}
                  </span>
                </span>
                <div className="flex gap-2 items-center flex-wrap">
                  <div className="relative">
                    <input
                      value={userInput}
                      onChange={(e) => setUserInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && submitSearch()}
                      placeholder="İsim, e-posta veya kullanıcı adı ara…"
                      className="h-[34px] border border-(--color-border) rounded-lg text-[13px] text-(--color-text) bg-white outline-none font-[family-name:var(--font-body)] w-[220px]"
                      style={{ padding: '0 10px', paddingRight: userInput ? '60px' : '10px' }}
                    />
                    {userInput && (
                      <button onClick={() => { setUserInput(''); setUserQuery(''); }} className="absolute right-2 top-1/2 -translate-y-1/2 text-[11px] text-(--color-text-light) bg-transparent border-none cursor-pointer font-[family-name:var(--font-body)] px-1 py-0.5">Temizle</button>
                    )}
                  </div>
                  <Btn size="sm" onClick={submitSearch}>Ara</Btn>
                  <div className="relative">
                    <button
                      onClick={() => setShowExportMenu((v) => !v)}
                      className="h-[34px] inline-flex items-center gap-[6px] px-[12px] rounded-lg text-[13px] font-semibold cursor-pointer transition-all duration-150"
                      style={{ border: `1px solid ${C.goldBorder}`, background: C.goldBg, color: C.gold, fontFamily: F }}
                    >
                      <FontAwesomeIcon icon={faDownload} style={{ fontSize: '12px' }} />
                      Dışa Aktar
                    </button>
                    {showExportMenu && (
                      <>
                        <div className="fixed inset-0 z-10" onClick={() => setShowExportMenu(false)} />
                        <div className="absolute right-0 top-[calc(100%+6px)] z-20 rounded-xl overflow-hidden"
                          style={{ background: C.card, border: `1px solid ${C.border}`, boxShadow: '0 8px 24px rgba(0,0,0,.1)', minWidth: '160px' }}>
                          {[
                            { label: 'Excel (.xlsx)', icon: faTable,   color: '#217346', fn: exportXLSX },
                            { label: 'PDF (.pdf)',    icon: faFilePdf, color: '#e53e3e', fn: exportPDF  },
                            { label: 'CSV (.csv)',    icon: faFile,    color: '#0ea5e9', fn: exportCSV  },
                          ].map(({ label, icon, color, fn }) => (
                            <button key={label} onClick={fn}
                              className="w-full flex items-center gap-[10px] px-4 py-[10px] text-[13px] font-semibold cursor-pointer transition-colors duration-100 border-none bg-transparent"
                              style={{ color: C.text, fontFamily: F }}
                              onMouseEnter={(e) => { e.currentTarget.style.background = '#f5f5f5'; }}
                              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}>
                              <FontAwesomeIcon icon={icon} style={{ fontSize: '14px', color, width: '16px' }} />
                              {label}
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <TableScrollHint />
              <div className="overflow-x-auto scroll-x">
                <table className="w-full min-w-[700px] border-collapse">
                  <thead><tr className="bg-[#f9f9fb]">
                    <th style={thBase}>Kullanıcı</th>
                    <th style={thBase}>Kullanıcı Adı</th>
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
                          <div className="flex gap-[10px] items-center">
                            <div className="w-[30px] h-[30px] rounded-full flex items-center justify-center text-xs text-white font-bold overflow-hidden shrink-0"
                              style={{ background: `linear-gradient(135deg,${C.gold},${C.goldLight})` }}>
                              {u.photoURL
                                ? <img src={u.photoURL} alt={u.name} className="w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                                : (u.avatar?.length === 1 ? u.avatar : u.name?.[0]?.toUpperCase() || '?')
                              }
                            </div>
                            <button onClick={() => setSelUser(u)} className="font-semibold text-sm text-(--color-navy) bg-transparent border-none cursor-pointer underline font-[family-name:var(--font-body)]">{u.name || '—'}</button>
                          </div>
                        </td>
                        <td className="px-[14px] py-[11px] text-[13px] text-(--color-text-mid)">{u.username ? `@${u.username}` : '—'}</td>
                        <td className="px-[14px] py-[11px] text-[13px] text-(--color-text-mid)">{u.email}</td>
                        <td style={tdStyle}><Badge color={RC[u.role] || 'gold'}>{RL[u.role] || u.role}</Badge></td>
                        <td style={tdStyle}>
                          {u.deleted
                            ? <Badge color="gray">Silindi</Badge>
                            : <Badge color={u.role === 'admin' || u.active ? 'green' : 'red'}>{u.role === 'admin' || u.active ? 'Aktif' : 'Dondurulmuş'}</Badge>
                          }
                        </td>
                        <td className="px-[14px] py-[11px] text-xs text-(--color-text-mid) whitespace-nowrap">{fmtTs(u.createdAt)}</td>
                        <td className="px-[14px] py-[11px] text-xs whitespace-nowrap" style={{ color: u.deletedAt ? '#e55' : C.textLight }}>{fmtTs(u.deletedAt)}</td>
                        <td style={tdStyle}>
                          {u.role !== 'admin' && !u.deleted && (
                            sm ? (
                              <Btn size="sm" variant="navy" style={{ whiteSpace: 'nowrap' }} onClick={() => setUam({ open: true, user: u, step: 'actions', action: null, loading: false, error: '' })}>İşlem Yap</Btn>
                            ) : (
                              <div className="flex gap-1.5 flex-wrap">
                                <Btn size="sm" variant={u.role === 'moderator' ? 'orange' : 'navy'} onClick={() => updateUser(u.id, { role: u.role === 'moderator' ? 'user' : 'moderator' })}>{u.role === 'moderator' ? 'Mod. Al' : 'Mod. Ver'}</Btn>
                                <Btn size="sm" variant={u.active ? 'danger' : 'success'} onClick={() => updateUser(u.id, { active: !u.active })}>{u.active ? 'Dondur' : 'Aktif Et'}</Btn>
                                <Btn size="sm" variant="danger" onClick={() => setUam({ open: true, user: u, step: 'confirm', action: 'delete', loading: false, error: '' })}>Sil</Btn>
                              </div>
                            )
                          )}
                        </td>
                      </tr>
                    ))}
                    {!displayed.length && <tr><td colSpan={8} className="px-[14px] py-8 text-center text-(--color-text-light)">Sonuç bulunamadı.</td></tr>}
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
              <div className="flex justify-between items-center mb-[14px]">
                {selectedIds.size > 0 ? (
                  <Btn variant="danger" onClick={openBulkDel}>Seçilenleri Sil ({selectedIds.size})</Btn>
                ) : <div />}
                <Btn onClick={() => setShowBM(true)}>+ Marka Ekle</Btn>
              </div>
              <Card style={{ overflow: 'hidden' }}>
                <div className="px-[18px] py-[14px] border-b border-(--color-border) flex items-center gap-3">
                  <span className="font-bold text-(--color-navy)">{isOrig ? 'Orijinal Markalar' : 'Muadil Markalar'}</span>
                  <button onClick={() => setExportModal(true)} className="flex items-center gap-[5px] px-[10px] py-[5px] rounded-[7px] border border-(--color-border) bg-white text-(--color-text-mid) text-xs font-semibold cursor-pointer font-[family-name:var(--font-body)]">
                    <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                    Listeye Aktar
                  </button>
                  <button onClick={handleRefresh} disabled={refreshing} title="Firestore'dan en güncel tam listeyi çeker. Kendi düzenlemelerin zaten anında görünür; bunu yalnızca başka birinin değişikliğini görmek için kullan." className="flex items-center gap-[5px] px-[10px] py-[5px] rounded-[7px] border border-(--color-border) bg-white text-(--color-text-mid) text-xs font-semibold font-[family-name:var(--font-body)]" style={{ cursor: refreshing ? 'default' : 'pointer', opacity: refreshing ? 0.6 : 1 }}>
                    <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ animation: refreshing ? 'spin 0.8s linear infinite' : 'none' }}><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
                    {refreshing ? 'Yenileniyor…' : 'Yenile'}
                  </button>
                </div>
                <SearchBar value={search} onChange={setSearch} placeholder="Marka adı veya köken ara…" count={sorted.length} total={baseBrands.length} />
                <TableScrollHint />
                <div className="overflow-x-auto scroll-x">
                <table className="w-full min-w-[580px] border-collapse">
                  <thead><tr className="bg-[#f9f9fb]">
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
                        <td className="px-[14px] py-[11px] w-[40px]"><input type="checkbox" checked={selectedIds.has(b.id)} onChange={() => toggleSelect(b.id)} /></td>
                        <td style={tdStyle}>
                          <div className="flex gap-[10px] items-center">
                            <div className="w-[30px] h-[30px] rounded-[7px] bg-(--color-gold-bg) border border-(--color-gold-border) flex items-center justify-center text-[10px] font-bold text-(--color-gold) overflow-hidden">
                              {b.logoImage ? <img src={b.logoImage} alt={b.name} className="w-full h-full object-cover" /> : b.logo}
                            </div>
                            <div>
                              <a href={`/marka/${b.slug}`} onClick={(e) => { if (e.button !== 0 || e.ctrlKey || e.metaKey || e.shiftKey) return; e.preventDefault(); e.stopPropagation(); navigate(`/marka/${b.slug}`); }} className="font-semibold text-sm text-(--color-navy) cursor-pointer no-underline">{b.name}</a>
                              <div className="text-[11px] text-(--color-text-light)">/{b.slug}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-[14px] py-[11px] text-[13px] text-(--color-text-mid)">{b.origin}</td>
                        {isOrig && (
                          <td style={tdStyle}>
                            {b.category && (
                              <div className="inline-flex items-center justify-center gap-1 px-[10px] rounded-[20px] text-xs font-semibold" style={{ background: b.category === 'Niche' ? '#f3e8ff' : '#eff6ff', color: b.category === 'Niche' ? '#7c3aed' : '#2563eb', border: `1px solid ${b.category === 'Niche' ? '#ddd6fe' : '#bfdbfe'}`, height: '22px' }}>
                                <p className="m-0 p-0 w-max cap-center" style={{ lineHeight: '20px' }}>{b.category}</p>
                              </div>
                            )}
                          </td>
                        )}
                        <td style={tdStyle}><span className="text-[15px] font-bold" style={{ color: b.perfumeCount > 0 ? C.gold : C.textLight }}>{b.perfumeCount}</span></td>
                        <td style={tdStyle}><Badge color={b.active ? 'green' : 'red'}>{b.active ? 'Aktif' : 'Pasif'}</Badge></td>
                        <td style={tdStyle}>
                          {sm ? (
                            <Btn size="sm" variant="navy" style={{ whiteSpace: 'nowrap' }} onClick={() => openIam({ ...b, type: b.type }, 'brand')}>İşlem Yap</Btn>
                          ) : (
                            <div className="flex gap-1.5 flex-wrap">
                              <button onClick={() => updateBrand(b.id, { active: !b.active })} className="px-[10px] py-[5px] rounded-[7px] border border-(--color-border) bg-white text-(--color-text-mid) text-xs font-semibold cursor-pointer font-[family-name:var(--font-body)]">{b.active ? 'Pasif Et' : 'Aktif Et'}</button>
                              <button onClick={() => openEditBrand(b)} title="Düzenle" className="flex items-center gap-[5px] px-[10px] py-[5px] rounded-[7px] border border-(--color-border) bg-white text-(--color-navy) text-xs font-semibold cursor-pointer font-[family-name:var(--font-body)]">
                                <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4Z"/></svg>
                                Düzenle
                              </button>
                              <button onClick={() => setDelTarget({ id: b.id, name: b.name, type: 'brand', brandType: b.type })} title="Sil" className="flex items-center gap-[5px] px-[10px] py-[5px] rounded-[7px] border border-[#fecaca] bg-[#fff5f5] text-(--color-red) text-xs font-semibold cursor-pointer font-[family-name:var(--font-body)]">
                                <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                                Sil
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                    {!sorted.length && <tr><td colSpan={isOrig ? 7 : 6} className="px-[14px] py-8 text-center text-(--color-text-light)">Sonuç bulunamadı.</td></tr>}
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
              <div className="flex justify-between items-center mb-[14px]">
                {selectedIds.size > 0 ? (
                  <Btn variant="danger" onClick={openBulkDel}>Seçilenleri Sil ({selectedIds.size})</Btn>
                ) : <div />}
                <Btn onClick={() => setShowPM(true)}>+ Parfüm Ekle</Btn>
              </div>
              <Card style={{ overflow: 'hidden' }}>
                <div className="px-[18px] py-[14px] border-b border-(--color-border) flex items-center gap-3 flex-wrap">
                  <span className="font-bold text-(--color-navy)">Orijinal Parfümler</span>
                  <button onClick={() => setExportModal(true)} className="flex items-center gap-[5px] px-[10px] py-[5px] rounded-[7px] border border-(--color-border) bg-white text-(--color-text-mid) text-xs font-semibold cursor-pointer font-[family-name:var(--font-body)]">
                    <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                    Listeye Aktar
                  </button>
                  <button ref={refreshBtnRef} onClick={handleRefresh} disabled={refreshing} title="Firestore'dan en güncel tam listeyi çeker. Kendi düzenlemelerin zaten anında görünür; bunu yalnızca başka birinin değişikliğini görmek için kullan." className="flex items-center gap-[5px] px-[10px] py-[5px] rounded-[7px] border border-(--color-border) bg-white text-(--color-text-mid) text-xs font-semibold font-[family-name:var(--font-body)]" style={{ cursor: refreshing ? 'default' : 'pointer', opacity: refreshing ? 0.6 : 1 }}>
                    <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ animation: refreshing ? 'spin 0.8s linear infinite' : 'none' }}><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
                    {refreshing ? 'Yenileniyor…' : 'Yenile'}
                  </button>
                  {(() => {
                      const list = ['', ...perfBrandList];
                      const idx = list.indexOf(perfBrandFilter);
                      return (
                        <div className="flex items-center gap-1.5 ml-auto">
                          <div className="flex flex-col border-[1.5px] border-(--color-border) rounded-lg overflow-hidden bg-white">
                            <button onClick={() => { setPerfBrandFilter(list[(idx - 1 + list.length) % list.length]); setPerfPage(1); }} title="Önceki marka" className="flex items-center justify-center w-[22px] h-[22px] border-none bg-transparent cursor-pointer p-0 transition-colors duration-150 text-(--color-text-mid)" style={{ borderBottom: `1px solid ${C.border}` }} onMouseEnter={e => e.currentTarget.style.color = C.gold} onMouseLeave={e => e.currentTarget.style.color = C.textMid}>
                              <FontAwesomeIcon icon={faChevronUp} className="text-[9px]" />
                            </button>
                            <button onClick={() => { setPerfBrandFilter(list[(idx + 1) % list.length]); setPerfPage(1); }} title="Sonraki marka" className="flex items-center justify-center w-[22px] h-[22px] border-none bg-transparent cursor-pointer p-0 transition-colors duration-150 text-(--color-text-mid)" onMouseEnter={e => e.currentTarget.style.color = C.gold} onMouseLeave={e => e.currentTarget.style.color = C.textMid}>
                              <FontAwesomeIcon icon={faChevronDown} className="text-[9px]" />
                            </button>
                          </div>
                          <svg width="13" height="13" fill="none" stroke={C.textLight} strokeWidth="2" viewBox="0 0 24 24"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
                          <select
                            value={perfBrandFilter}
                            onChange={(e) => { setPerfBrandFilter(e.target.value); setPerfPage(1); }}
                            className="h-8 rounded-lg text-[13px] px-[10px] font-[family-name:var(--font-body)] cursor-pointer outline-none"
                            style={{ border: `1.5px solid ${perfBrandFilter ? C.navy : C.border}`, color: perfBrandFilter ? C.navy : C.textLight, background: perfBrandFilter ? '#eef2ff' : '#fff', fontWeight: perfBrandFilter ? 700 : 400 }}
                          >
                            <option value="">Tüm Markalar</option>
                            {perfBrandList.map((b) => <option key={b} value={b}>{b}</option>)}
                          </select>
                          {perfBrandFilter && (
                            <button onClick={() => { setPerfBrandFilter(''); setPerfPage(1); }} className="flex items-center justify-center w-6 h-6 rounded-full border-none bg-[#e5e7eb] cursor-pointer text-(--color-text) text-sm leading-none font-[family-name:var(--font-body)]">×</button>
                          )}
                        </div>
                      );
                  })()}
                </div>
                <SearchBar deferred value={search} onChange={(v) => { setSearch(v); setPerfPage(1); }} placeholder="Parfüm adı, marka veya cinsiyet ara…" count={sorted.length} total={perfumes.length} />
                <TableScrollHint />
                <div className="overflow-x-auto scroll-x">
                <table className="w-full min-w-[620px] border-collapse">
                  <thead><tr className="bg-[#f9f9fb]">
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
                        <td className="px-[14px] py-[11px] w-[40px]"><input type="checkbox" checked={selectedIds.has(p.id)} onChange={() => toggleSelect(p.id)} /></td>
                        <td style={tdStyle}><a href={`/${p.brandSlug}/${p.slug}`} onClick={(e) => { if (e.button !== 0 || e.ctrlKey || e.metaKey || e.shiftKey) return; e.preventDefault(); e.stopPropagation(); navigate(`/${p.brandSlug}/${p.slug}`); }} className="font-semibold text-sm text-(--color-navy) cursor-pointer no-underline">{p.name}</a></td>
                        <td className="px-1 py-[11px] w-[70px]">
                          <div className="flex gap-1">
                            <CopyBtn text={p.name} title="Parfüm adını kopyala" />
                            <CopyBtn text={`${p.brandName} ${p.name}`} title="Marka + parfüm adını kopyala" variant="brand" />
                          </div>
                        </td>
                        <td className="px-[14px] py-[11px] text-[13px]"><a href={`/marka/${p.brandSlug}`} onClick={(e) => { if (e.button !== 0 || e.ctrlKey || e.metaKey || e.shiftKey) return; e.preventDefault(); e.stopPropagation(); navigate(`/marka/${p.brandSlug}`); }} className="text-[13px] text-(--color-text-mid) cursor-pointer no-underline">{p.brandName}</a></td>
                        <td className="px-[14px] py-[11px] text-xs text-(--color-gold)">/{p.brandSlug}/{p.slug}</td>
                        <td style={tdStyle}><GenderBadge gender={p.gender} /></td>
                        <td className="px-[14px] py-[11px] text-[13px] text-(--color-green) font-semibold">{p.muadilCount}</td>
                        <td style={tdStyle}>
                          {sm ? (
                            <Btn size="sm" variant="navy" style={{ whiteSpace: 'nowrap' }} onClick={() => openIam(p, 'perfume')}>İşlem Yap</Btn>
                          ) : (
                            <div className="flex gap-1.5">
                              <button onClick={() => openEditPerf(p)} title="Düzenle" className="flex items-center gap-[5px] px-[10px] py-[5px] rounded-[7px] border border-(--color-border) bg-white text-(--color-navy) text-xs font-semibold cursor-pointer font-[family-name:var(--font-body)]">
                                <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4Z"/></svg>
                                Düzenle
                              </button>
                              <button onClick={() => setDelTarget({ id: p.id, name: p.name, type: 'perfume' })} title="Sil" className="flex items-center gap-[5px] px-[10px] py-[5px] rounded-[7px] border border-[#fecaca] bg-[#fff5f5] text-(--color-red) text-xs font-semibold cursor-pointer font-[family-name:var(--font-body)]">
                                <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                                Sil
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                    {!sorted.length && <tr><td colSpan={7} className="px-[14px] py-8 text-center text-(--color-text-light)">Sonuç bulunamadı.</td></tr>}
                  </tbody>
                </table>
                </div>
                {totalPages > 1 && (
                  <div className="flex justify-between items-center px-[18px] py-3 border-t border-(--color-border) flex-wrap gap-2">
                    <span className="text-xs text-(--color-text-light)">{(safePage - 1) * PERF_PER_PAGE + 1}–{Math.min(safePage * PERF_PER_PAGE, sorted.length)} / {sorted.length} kayıt</span>
                    <div className="flex gap-1 items-center">
                      <button onClick={() => setPerfPage(p => Math.max(1, p - 1))} disabled={safePage === 1} className="px-[10px] py-[5px] rounded-[7px] border border-(--color-border) bg-(--color-card) text-[13px] font-[family-name:var(--font-body)]" style={{ color: safePage === 1 ? C.textLight : C.text, cursor: safePage === 1 ? 'default' : 'pointer' }}>‹</button>
                      {Array.from({ length: totalPages }, (_, i) => i + 1).filter(n => n === 1 || n === totalPages || Math.abs(n - safePage) <= 1).reduce((acc, n, idx, arr) => { if (idx > 0 && n - arr[idx - 1] > 1) acc.push('…'); acc.push(n); return acc; }, []).map((n, i) => n === '…' ? (
                        <span key={`e${i}`} className="px-1 text-(--color-text-light) text-[13px]">…</span>
                      ) : (
                        <button key={n} onClick={() => setPerfPage(n)} className="px-[10px] py-[5px] rounded-[7px] text-[13px] cursor-pointer font-[family-name:var(--font-body)]" style={{ border: `1px solid ${n === safePage ? C.navy : C.border}`, background: n === safePage ? C.navy : C.card, color: n === safePage ? '#fff' : C.text, fontWeight: n === safePage ? 700 : 400 }}>{n}</button>
                      ))}
                      <button onClick={() => setPerfPage(p => Math.min(totalPages, p + 1))} disabled={safePage === totalPages} className="px-[10px] py-[5px] rounded-[7px] border border-(--color-border) bg-(--color-card) text-[13px] font-[family-name:var(--font-body)]" style={{ color: safePage === totalPages ? C.textLight : C.text, cursor: safePage === totalPages ? 'default' : 'pointer' }}>›</button>
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
              <div className="flex justify-between items-center mb-[14px]">
                {selectedIds.size > 0 ? (
                  <Btn variant="danger" onClick={openBulkDel}>Seçilenleri Sil ({selectedIds.size})</Btn>
                ) : <div />}
                <div className="flex gap-2">
                  <Btn variant="secondary" onClick={() => setShowBulkMM(true)}>Toplu Ekle</Btn>
                  <Btn onClick={() => setShowMM(true)}>+ Muadil Parfüm Ekle</Btn>
                </div>
              </div>
              <Card style={{ overflow: 'hidden' }}>
                <div className="px-[18px] py-[14px] border-b border-(--color-border) flex items-center gap-3 flex-wrap">
                  <span className="font-bold text-(--color-navy)">Muadil Parfümler</span>
                  <button onClick={() => setExportModal(true)} className="flex items-center gap-[5px] px-[10px] py-[5px] rounded-[7px] border border-(--color-border) bg-white text-(--color-text-mid) text-xs font-semibold cursor-pointer font-[family-name:var(--font-body)]">
                    <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                    Listeye Aktar
                  </button>
                  <button onClick={handleRefresh} disabled={refreshing} title="Firestore'dan en güncel tam listeyi çeker. Kendi düzenlemelerin zaten anında görünür; bunu yalnızca başka birinin değişikliğini görmek için kullan." className="flex items-center gap-[5px] px-[10px] py-[5px] rounded-[7px] border border-(--color-border) bg-white text-(--color-text-mid) text-xs font-semibold font-[family-name:var(--font-body)]" style={{ cursor: refreshing ? 'default' : 'pointer', opacity: refreshing ? 0.6 : 1 }}>
                    <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ animation: refreshing ? 'spin 0.8s linear infinite' : 'none' }}><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
                    {refreshing ? 'Yenileniyor…' : 'Yenile'}
                  </button>
                  {(() => {
                      const list = ['', ...muadilBrandList];
                      const idx = list.indexOf(muadilBrandFilter);
                      return (
                        <div className="flex items-center gap-1.5 ml-auto">
                          <div className="flex flex-col border-[1.5px] border-(--color-border) rounded-lg overflow-hidden bg-white">
                            <button onClick={() => { setMuadilBrandFilter(list[(idx - 1 + list.length) % list.length]); setMuadilPage(1); }} title="Önceki marka" className="flex items-center justify-center w-[22px] h-[22px] border-none bg-transparent cursor-pointer p-0 transition-colors duration-150 text-(--color-text-mid)" style={{ borderBottom: `1px solid ${C.border}` }} onMouseEnter={e => e.currentTarget.style.color = C.gold} onMouseLeave={e => e.currentTarget.style.color = C.textMid}>
                              <FontAwesomeIcon icon={faChevronUp} className="text-[9px]" />
                            </button>
                            <button onClick={() => { setMuadilBrandFilter(list[(idx + 1) % list.length]); setMuadilPage(1); }} title="Sonraki marka" className="flex items-center justify-center w-[22px] h-[22px] border-none bg-transparent cursor-pointer p-0 transition-colors duration-150 text-(--color-text-mid)" onMouseEnter={e => e.currentTarget.style.color = C.gold} onMouseLeave={e => e.currentTarget.style.color = C.textMid}>
                              <FontAwesomeIcon icon={faChevronDown} className="text-[9px]" />
                            </button>
                          </div>
                          <svg width="13" height="13" fill="none" stroke={C.textLight} strokeWidth="2" viewBox="0 0 24 24"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
                          <select
                            value={muadilBrandFilter}
                            onChange={(e) => { setMuadilBrandFilter(e.target.value); setMuadilPage(1); }}
                            className="h-8 rounded-lg text-[13px] px-[10px] font-[family-name:var(--font-body)] cursor-pointer outline-none"
                            style={{ border: `1.5px solid ${muadilBrandFilter ? C.navy : C.border}`, color: muadilBrandFilter ? C.navy : C.textLight, background: muadilBrandFilter ? '#eef2ff' : '#fff', fontWeight: muadilBrandFilter ? 700 : 400 }}
                          >
                            <option value="">Tüm Markalar</option>
                            {muadilBrandList.map((b) => <option key={b} value={b}>{b}</option>)}
                          </select>
                          {muadilBrandFilter && (
                            <button onClick={() => { setMuadilBrandFilter(''); setMuadilPage(1); }} className="flex items-center justify-center w-6 h-6 rounded-full border-none bg-[#e5e7eb] cursor-pointer text-(--color-text) text-sm leading-none font-[family-name:var(--font-body)]">×</button>
                          )}
                        </div>
                      );
                  })()}
                </div>
                <SearchBar deferred value={search} onChange={(v) => { setSearch(v); setMuadilPage(1); }} placeholder="Muadil adı, marka veya hedef parfüm ara…" count={sorted.length} total={muadilPerfumes.length} />
                <TableScrollHint />
                <div className="overflow-x-auto scroll-x">
                <table className="w-full min-w-[680px] border-collapse">
                  <thead><tr className="bg-[#f9f9fb]">
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
                        <td className="px-[14px] py-[11px] w-[40px]"><input type="checkbox" checked={selectedIds.has(m.id)} onChange={() => toggleSelect(m.id)} /></td>
                        <td style={tdStyle}><a href={`/karsilastir?orijinal=${m.targetPerfumeId}&muadil=${m.id}`} onClick={(e) => { if (e.button !== 0 || e.ctrlKey || e.metaKey || e.shiftKey) return; e.preventDefault(); e.stopPropagation(); navigate(`/karsilastir?orijinal=${m.targetPerfumeId}&muadil=${m.id}`); }} className="font-semibold text-sm text-(--color-navy) cursor-pointer no-underline">{m.name}</a></td>
                        <td className="px-[14px] py-[11px] text-[13px]"><a href={`/marka/${m.brandSlug}`} onClick={(e) => { if (e.button !== 0 || e.ctrlKey || e.metaKey || e.shiftKey) return; e.preventDefault(); e.stopPropagation(); navigate(`/marka/${m.brandSlug}`); }} className="text-[13px] text-(--color-text-mid) cursor-pointer no-underline">{m.brandName}</a></td>
                        <td className="px-[14px] py-[11px] text-[13px] text-(--color-text-mid)">{(() => { const tp = perfumes.find((x) => String(x.id) === String(m.targetPerfumeId)); return tp ? <a href={`/${tp.brandSlug}/${tp.slug}`} onClick={(e) => { if (e.button !== 0 || e.ctrlKey || e.metaKey || e.shiftKey) return; e.preventDefault(); e.stopPropagation(); navigate(`/${tp.brandSlug}/${tp.slug}`); }} className="text-[13px] text-(--color-text-mid) cursor-pointer no-underline">{m.targetBrandName} — {m.targetPerfumeName}</a> : <span>{m.targetBrandName} — {m.targetPerfumeName}</span>; })()}</td>
                        <td style={tdStyle}>{m.overall >= 0 ? <Badge color="gold">{m.overall}/10</Badge> : <span className="text-xs text-(--color-text-light)">—</span>}</td>
                        <td className="px-[14px] py-[11px] text-[13px] text-(--color-text-mid)">{m.commentCount}</td>
                        <td style={tdStyle}>
                          {sm ? (
                            <Btn size="sm" variant="navy" style={{ whiteSpace: 'nowrap' }} onClick={() => openIam(m, 'muadil')}>İşlem Yap</Btn>
                          ) : (
                            <div className="flex gap-1.5">
                              <button onClick={() => openEditMuadil(m)} title="Düzenle" className="flex items-center gap-[5px] px-[10px] py-[5px] rounded-[7px] border border-(--color-border) bg-white text-(--color-navy) text-xs font-semibold cursor-pointer font-[family-name:var(--font-body)]">
                                <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4Z"/></svg>
                                Düzenle
                              </button>
                              <button onClick={() => setDelTarget({ id: m.id, name: m.name, type: 'muadil' })} title="Sil" className="flex items-center gap-[5px] px-[10px] py-[5px] rounded-[7px] border border-[#fecaca] bg-[#fff5f5] text-(--color-red) text-xs font-semibold cursor-pointer font-[family-name:var(--font-body)]">
                                <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                                Sil
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                    {!sorted.length && <tr><td colSpan={7} className="px-[14px] py-8 text-center text-(--color-text-light)">Sonuç bulunamadı.</td></tr>}
                  </tbody>
                </table>
                </div>
                {totalPages > 1 && (
                  <div className="flex justify-between items-center px-[18px] py-3 border-t border-(--color-border) flex-wrap gap-2">
                    <span className="text-xs text-(--color-text-light)">{(safePage - 1) * PERF_PER_PAGE + 1}–{Math.min(safePage * PERF_PER_PAGE, sorted.length)} / {sorted.length} kayıt</span>
                    <div className="flex gap-1 items-center">
                      <button onClick={() => setMuadilPage(p => Math.max(1, p - 1))} disabled={safePage === 1} className="px-[10px] py-[5px] rounded-[7px] border border-(--color-border) bg-(--color-card) text-[13px] font-[family-name:var(--font-body)]" style={{ color: safePage === 1 ? C.textLight : C.text, cursor: safePage === 1 ? 'default' : 'pointer' }}>‹</button>
                      {Array.from({ length: totalPages }, (_, i) => i + 1).filter(n => n === 1 || n === totalPages || Math.abs(n - safePage) <= 1).reduce((acc, n, idx, arr) => { if (idx > 0 && n - arr[idx - 1] > 1) acc.push('…'); acc.push(n); return acc; }, []).map((n, i) => n === '…' ? (
                        <span key={`e${i}`} className="px-1 text-(--color-text-light) text-[13px]">…</span>
                      ) : (
                        <button key={n} onClick={() => setMuadilPage(n)} className="px-[10px] py-[5px] rounded-[7px] text-[13px] cursor-pointer font-[family-name:var(--font-body)]" style={{ border: `1px solid ${n === safePage ? C.navy : C.border}`, background: n === safePage ? C.navy : C.card, color: n === safePage ? '#fff' : C.text, fontWeight: n === safePage ? 700 : 400 }}>{n}</button>
                      ))}
                      <button onClick={() => setMuadilPage(p => Math.min(totalPages, p + 1))} disabled={safePage === totalPages} className="px-[10px] py-[5px] rounded-[7px] border border-(--color-border) bg-(--color-card) text-[13px] font-[family-name:var(--font-body)]" style={{ color: safePage === totalPages ? C.textLight : C.text, cursor: safePage === totalPages ? 'default' : 'pointer' }}>›</button>
                    </div>
                  </div>
                )}
              </Card>
            </div>
          );
        })()}

        {/* Tüm Yorumlar */}
        {tab === 'reviews' && (() => {
          const dateInputStyle = { border: `1px solid ${C.border}` };
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
                <div className="flex flex-wrap gap-3 items-end">
                  <div>
                    <div className="text-xs font-bold text-(--color-navy) mb-1.5">Başlangıç Tarihi</div>
                    <input type="date" value={revRange.start} max={revRange.end} onChange={(e) => setRevRange((s) => ({ ...s, start: e.target.value }))} className="px-3 py-[9px] rounded-[9px] text-[13px] font-[family-name:var(--font-body)] text-(--color-text) bg-white outline-none" style={dateInputStyle} />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-(--color-navy) mb-1.5">Bitiş Tarihi</div>
                    <input type="date" value={revRange.end} min={revRange.start} max={_today} onChange={(e) => setRevRange((s) => ({ ...s, end: e.target.value }))} className="px-3 py-[9px] rounded-[9px] text-[13px] font-[family-name:var(--font-body)] text-(--color-text) bg-white outline-none" style={dateInputStyle} />
                  </div>
                  <Btn variant="primary" onClick={loadReviews} disabled={revLoading}>{revLoading ? 'Getiriliyor…' : 'Yorumları Getir'}</Btn>
                  {revLoaded && !revLoading && <span className="text-xs text-(--color-text-light)">Bu aralıkta {revList.length} yorum bulundu.</span>}
                </div>
                <p className="text-xs text-(--color-text-light) mt-3 leading-[1.5]">
                  Sunucuyu yormamak için yalnızca seçtiğiniz tarih aralığındaki yorumlar getirilir. Kapatılmış/silinmiş hesapların yorumları da bu listede görünür ve silinebilir.
                </p>
                {revError && <div className="text-xs text-(--color-red) mt-2">{revError}</div>}
              </Card>

              {revLoaded && (
                <>
                  <div className="flex justify-between items-center mb-[14px]">
                    {selectedIds.size > 0 ? (
                      <Btn variant="danger" onClick={() => openRevDel([...selectedIds])}>Seçilenleri Sil ({selectedIds.size})</Btn>
                    ) : <div />}
                  </div>
                  <Card style={{ overflow: 'hidden' }}>
                    <div className="px-[18px] py-[14px] border-b border-(--color-border)"><span className="font-bold text-(--color-navy)">Yorumlar</span></div>
                    <SearchBar value={search} onChange={setSearch} placeholder="Kullanıcı adı veya yorum içeriği ara…" count={filtered.length} total={revList.length} />
                    <TableScrollHint />
                    <div className="overflow-x-auto scroll-x">
                    <table className="w-full min-w-[760px] border-collapse">
                      <thead><tr className="bg-[#f9f9fb]">
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
                            <td className="px-[14px] py-[11px] w-[40px]"><input type="checkbox" checked={selectedIds.has(r.id)} onChange={() => toggleSelect(r.id)} /></td>
                            <td className="px-[14px] py-[11px] text-xs text-(--color-text-mid) whitespace-nowrap">{fmtDate(r.createdAt)}</td>
                            <td className="px-[14px] py-[11px] text-[13px] text-(--color-text) font-semibold whitespace-nowrap">{r.userName || '—'}</td>
                            <td className="px-[14px] py-[11px] text-xs text-(--color-text-mid)">{muadilName(r)}</td>
                            <td className="px-[14px] py-[11px] text-[13px] text-(--color-text) max-w-[340px] leading-[1.5]">
                              {r.text || <span className="text-(--color-text-light)">—</span>}
                              {r.abuseFlag && r.abuseReason && (
                                <div className="mt-[5px] inline-flex items-center gap-[5px] rounded-[6px] px-[7px] py-[3px] text-[11px] font-semibold" style={{ background: '#fff5f5', border: '1px solid #fecaca', color: C.red }}>
                                  <FontAwesomeIcon icon={faTriangleExclamation} style={{ fontSize: '10px' }} />
                                  <span>{r.abuseReason}</span>
                                </div>
                              )}
                            </td>
                            <td style={tdStyle}>
                              <Badge color={r.status === 'approved' ? 'green' : 'orange'}>{r.status === 'approved' ? 'Onaylı' : 'Beklemede'}</Badge>
                              {r.abuseFlag && <Badge color="red">Şüpheli</Badge>}
                            </td>
                            <td style={tdStyle}>
                              <button onClick={() => openRevDel([r.id])} title="Sil" className="flex items-center gap-[5px] px-[10px] py-[5px] rounded-[7px] border border-[#fecaca] bg-[#fff5f5] text-(--color-red) text-xs font-semibold cursor-pointer font-[family-name:var(--font-body)] whitespace-nowrap">
                                <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                                Sil
                              </button>
                            </td>
                          </tr>
                        ))}
                        {!filtered.length && <tr><td colSpan={7} className="px-[14px] py-8 text-center text-(--color-text-light)">{revList.length ? 'Aramayla eşleşen yorum yok.' : 'Bu tarih aralığında yorum bulunamadı.'}</td></tr>}
                      </tbody>
                    </table>
                    </div>
                  </Card>
                </>
              )}
            </div>
          );
        })()}

        {/* Brand Profiles */}
        {tab === 'brand-profiles' && (
          <BrandProfilesTab
            brands={brands}
            updateBrand={updateBrand}
            MAX_SIZE_MB={MAX_SIZE_MB}
            globalBrandHeaders={globalBrandHeaders}
            updateBrandGlobalHeader={updateBrandGlobalHeader}
          />
        )}

        {/* Slider */}
        {tab === 'slider' && (
          <>
            <SliderTab
              sliderImages={sliderImages}
              addSliderImage={addSliderImage}
              removeSliderImage={removeSliderImage}
              updateSliderImage={updateSliderImage}
              reorderSliderImages={reorderSliderImages}
              MAX_SLIDER={MAX_SLIDER}
              MAX_SIZE_MB={MAX_SIZE_MB}
            />
            <LandingImagesSection
              landingImages={landingImages}
              updateLandingImage={updateLandingImage}
            />
          </>
        )}
        {tab === 'favicon' && (
          <FaviconTab faviconUrl={faviconUrl} updateFavicon={updateFavicon} />
        )}

        {tab === 'logo' && (
          <LogoTab logoUrl={logoUrl} updateLogo={updateLogo} />
        )}

        {tab === 'footer-logo' && (
          <FooterLogoTab footerLogoUrl={footerLogoUrl} updateFooterLogo={updateFooterLogo} />
        )}

        {tab === 'activity' && <ActivityTab />}
        {tab === 'security' && <SecurityTab />}
        {tab === 'daily-comparison' && <DailyComparisonTab />}

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
          <div className="flex flex-col gap-[10px]">
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
            <div className="mb-4 px-4 py-3 bg-[#fff5f5] border border-[#fecaca] rounded-[10px] text-[13px] text-(--color-red) leading-[1.6]">
              <strong>"{iam.item.name}"</strong> kalıcı olarak silinecek. Bu işlem geri alınamaz.
              {iam.withMuadils && <><br /><strong>Dikkat:</strong> Bağlı bulunduğu muadillerle birlikte silinecektir.</>}
            </div>
            {iam.itemType === 'perfume' && (
              <label className="flex items-center gap-[10px] mb-[14px] px-[14px] py-[10px] rounded-[10px] cursor-pointer text-[13px] font-semibold transition-all duration-150"
                style={{ background: iam.withMuadils ? '#fff5f5' : '#f9f9fb', border: `1px solid ${iam.withMuadils ? '#fecaca' : C.border}`, color: iam.withMuadils ? C.red : C.textMid }}>
                <input
                  type="checkbox"
                  checked={iam.withMuadils}
                  onChange={(e) => {
                    if (iamPwRef.current) iamPwRef.current.value = '';
                    setIam((s) => ({ ...s, withMuadils: e.target.checked, error: '' }));
                  }}
                  className="w-4 h-4 cursor-pointer shrink-0"
                  style={{ accentColor: C.red }}
                />
                Bağlı muadil parfümleri de sil ({muadilPerfumes.filter((m) => String(m.targetPerfumeId) === String(iam.item.id)).length} adet)
              </label>
            )}
            <div className="mb-2 text-[13px] font-semibold text-(--color-navy)">Admin Şifresi</div>
            <input
              key={iam.item?.id + iam.withMuadils}
              ref={iamPwRef}
              type="password"
              onChange={() => { if (iam.error) setIam((s) => ({ ...s, error: '' })); }}
              onKeyDown={(e) => e.key === 'Enter' && !iam.loading && handleIamDelete()}
              placeholder="Şifrenizi girin"
              autoFocus
              className="w-full px-[14px] py-[10px] rounded-[10px] text-sm font-[family-name:var(--font-body)] outline-none box-border mb-1.5"
              style={{ border: `1px solid ${iam.error ? C.red : C.border}` }}
            />
            {iam.error && <div className="text-xs text-(--color-red) mb-[10px]">{iam.error}</div>}
            <div className="flex gap-[10px] mt-4 justify-end">
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
          <div className="flex flex-col gap-[10px]">
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
            <div className="mb-4 px-4 py-3 rounded-[10px] text-[13px] leading-[1.6]" style={{ background: uam.action === 'delete' ? '#fff5f5' : '#fffbeb', border: `1px solid ${uam.action === 'delete' ? '#fecaca' : '#fde68a'}`, color: uam.action === 'delete' ? C.red : C.orange }}>
              {uam.action === 'mod' && `${uam.user.name} kullanıcısının moderatör rolü ${uam.user.role === 'moderator' ? 'alınacak' : 'verilecek'}.`}
              {uam.action === 'freeze' && `${uam.user.name} hesabı ${uam.user.active ? 'dondurulacak' : 'aktif edilecek'}.`}
              {uam.action === 'delete' && `${uam.user.name} kalıcı olarak silinecek. Bu işlem geri alınamaz.`}
            </div>
            <div className="mb-2 text-[13px] font-semibold text-(--color-navy)">Admin Şifresi</div>
            <input
              key={uam.user?.id + uam.action}
              ref={uamPwRef}
              type="password"
              onChange={() => { if (uam.error) setUam((s) => ({ ...s, error: '' })); }}
              onKeyDown={(e) => e.key === 'Enter' && !uam.loading && handleUamSubmit()}
              placeholder="Şifrenizi girin"
              autoFocus
              className="w-full px-[14px] py-[10px] rounded-[10px] text-sm font-[family-name:var(--font-body)] outline-none box-border mb-1.5"
              style={{ border: `1px solid ${uam.error ? C.red : C.border}` }}
            />
            {uam.error && <div className="text-xs text-(--color-red) mb-[10px]">{uam.error}</div>}
            <div className="flex gap-[10px] mt-4 justify-end">
              <Btn variant={uam.action === 'delete' ? 'danger' : 'primary'} onClick={handleUamSubmit} disabled={uam.loading}>
                {uam.loading ? 'İşleniyor…' : 'Onayla'}
              </Btn>
            </div>
          </div>
        )}
        {uam.step === 'deleted' && (
          <div className="text-center py-2 pb-1">
            <div className="text-[40px] mb-3">✅</div>
            <p className="text-[15px] font-bold text-(--color-navy) mb-1.5">Kullanıcı silindi</p>
            <p className="text-[13px] text-(--color-text-light) leading-[1.6] mb-5">
              Hesap, yorumlar ve tüm veriler başarıyla temizlendi.
            </p>
            <Btn variant="primary" onClick={closeUam} style={{ width: '100%', justifyContent: 'center' }}>Tamam</Btn>
          </div>
        )}
      </Modal>

      {/* Export Modalı */}
      <Modal open={exportModal} onClose={() => setExportModal(false)} title="Listeyi Dışa Aktar" width="360px">
        <div className="flex flex-col gap-[10px]">
          <p className="text-[13px] text-(--color-text-mid) mb-1">
            Şu an görünen <strong>{
              tab === 'perfumes' ? sortedPerfs.length :
              tab === 'muadil' ? sortedMuadils.length :
              tab === 'original-brands' ? sortedOrigBrands.length :
              sortedMuadilBrands.length
            } kayıt</strong> hangi formatta aktarılsın?
          </p>

          {tab === 'perfumes' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: '8px 12px', background: 'var(--color-bg-soft, #f7f5f0)', borderRadius: 8, marginBottom: 2 }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-mid)', letterSpacing: '.05em', textTransform: 'uppercase', marginBottom: 2 }}>Ekstra sütunlar</p>
              {[
                { key: 'year',        label: 'Çıkış yılı eklensin mi?' },
                { key: 'notes',       label: 'Notalar eklensin mi?' },
                { key: 'description', label: 'Açıklama eklensin mi?' },
              ].map(({ key, label }) => (
                <label key={key} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, color: 'var(--color-text)' }}>
                  <input
                    type="checkbox"
                    checked={exportOpts[key]}
                    onChange={() => toggleExportOpt(key)}
                    style={{ width: 15, height: 15, accentColor: 'var(--color-primary)', cursor: 'pointer' }}
                  />
                  {label}
                </label>
              ))}
            </div>
          )}

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
            <div className="mb-[14px] px-4 py-3 bg-[#fff5f5] border border-[#fecaca] rounded-[10px] text-[13px] text-(--color-red) leading-[1.6]">
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
              <div className="mb-[14px] border border-(--color-border) rounded-[10px] overflow-hidden max-h-[220px] overflow-y-auto">
                {selPerfumes.map((p, i) => (
                  <div key={p.id} className="flex items-center justify-between px-[14px] py-2" style={{ borderBottom: i < selPerfumes.length - 1 ? `1px solid ${C.borderLight}` : 'none', background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                    <div className="min-w-0">
                      <div className="text-[13px] font-bold text-(--color-navy) overflow-hidden text-ellipsis whitespace-nowrap">{p.name}</div>
                      <div className="text-[11px] text-(--color-text-light)">{p.brandName}</div>
                    </div>
                    <div className="shrink-0 ml-3">
                      {p.muadilCount > 0
                        ? <div className="inline-flex items-center justify-center gap-1 bg-[#fff5f5] border border-[#fecaca] rounded-[6px] px-2 text-[11px] font-bold text-(--color-red)" style={{ height: '20px' }}><p className="m-0 p-0 w-max cap-center" style={{ lineHeight: '18px' }}>{p.muadilCount} muadil silinecek</p></div>
                        : <span className="text-[11px] text-(--color-text-light)">muadil yok</span>
                      }
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="mb-2 text-[13px] font-semibold text-(--color-navy)">Admin Şifresi</div>
            <input
              key={bulkDel.open}
              ref={bulkDelPwRef}
              type="password"
              onChange={() => { if (bulkDel.error) setBulkDel((s) => ({ ...s, error: '' })); }}
              onKeyDown={(e) => e.key === 'Enter' && !bulkDel.loading && handleBulkDelete()}
              placeholder="Şifrenizi girin"
              autoFocus
              className="w-full px-[14px] py-[10px] rounded-[10px] text-sm font-[family-name:var(--font-body)] outline-none box-border mb-2"
              style={{ border: `1px solid ${bulkDel.error ? C.red : C.border}` }}
            />
            {bulkDel.error && <div className="text-xs text-(--color-red) mb-3">{bulkDel.error}</div>}
            <div className="flex gap-[10px] mt-4 justify-end">
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
        <div className="mb-4 px-4 py-3 bg-[#fff5f5] border border-[#fecaca] rounded-[10px] text-[13px] text-(--color-red) leading-[1.6]">
          <strong>{revDel.ids.length} yorum</strong> kalıcı olarak silinecek. Bu işlem geri alınamaz. Devam etmek için admin şifrenizi girin.
        </div>
        <div className="mb-2 text-[13px] font-semibold text-(--color-navy)">Admin Şifresi</div>
        <input
          key={revDel.open + revDel.ids.join()}
          ref={revDelPwRef}
          type="password"
          onChange={() => { if (revDel.error) setRevDel((s) => ({ ...s, error: '' })); }}
          onKeyDown={(e) => e.key === 'Enter' && !revDel.loading && handleRevDelete()}
          placeholder="Şifrenizi girin"
          autoFocus
          className="w-full px-[14px] py-[10px] rounded-[10px] text-sm font-[family-name:var(--font-body)] outline-none box-border mb-2"
          style={{ border: `1px solid ${revDel.error ? C.red : C.border}` }}
        />
        {revDel.error && <div className="text-xs text-(--color-red) mb-3">{revDel.error}</div>}
        <div className="flex gap-[10px] mt-4 justify-end">
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
              <div className="flex gap-[14px] items-center p-[14px] bg-(--color-gold-bg) rounded-xl border border-(--color-gold-border) mb-[18px]">
                <div className="w-12 h-12 rounded-full flex items-center justify-center text-[18px] text-white font-bold shrink-0 overflow-hidden"
                  style={{ background: `linear-gradient(135deg,${C.gold},${C.goldLight})` }}>
                  {(selUser.photoURL || (selUser.avatar?.startsWith?.('http') ? selUser.avatar : null))
                    ? <img src={selUser.photoURL || selUser.avatar} alt={selUser.name} className="w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                    : (selUser.avatar?.length === 1 ? selUser.avatar : selUser.name?.[0]?.toUpperCase() || '?')
                  }
                </div>
                <div className="flex-1">
                  <div className="font-bold text-[16px] text-(--color-navy)">{selUser.name}</div>
                  <div className="text-[13px] text-(--color-text-mid)">{selUser.email}</div>
                  <div className="flex gap-2 mt-1.5 flex-wrap">
                    <Badge color={RC[selUser.role]}>{RL[selUser.role]}</Badge>
                    <Badge color={selUser.role === 'admin' || selUser.active ? 'green' : 'red'}>{selUser.role === 'admin' || selUser.active ? 'Aktif' : 'Dondurulmuş'}</Badge>
                  </div>
                </div>
              </div>
              <div className="mb-[18px]">
                <div className="text-xs font-bold text-(--color-navy) mb-[10px] tracking-[.05em]">OTURUM BİLGİLERİ</div>
                <div className="grid grid-cols-2 gap-2">
                  {[['Son Giriş', '—'], ['Son Çıkış', '—'], ['Katılım Tarihi', selUser.createdAt?.toDate?.()?.toLocaleDateString('tr-TR') || '—'], ['Toplam Yorum', uc.length]].map(([k, v]) => (
                    <div key={k} className="bg-[#f9f9fb] rounded-[10px] px-[14px] py-[10px] border border-(--color-border)">
                      <div className="text-[11px] text-(--color-text-light) mb-[3px] uppercase tracking-[.05em]">{k}</div>
                      <div className="text-sm font-semibold text-(--color-text)">{v}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <div className="text-xs font-bold text-(--color-navy) mb-[10px] tracking-[.05em]">YORUMLARI ({uc.length})</div>
                {!uc.length && <div className="text-center p-5 text-(--color-text-light) text-sm bg-[#f9f9fb] rounded-[10px]">Henüz yorum yapmamış.</div>}
                <div className="flex flex-col gap-2 max-h-[220px] overflow-auto">
                  {uc.map((c) => {
                    const mp = muadilPerfumes.find((m) => m.id === c.muadilPerfumeId);
                    return (
                      <div key={c.id} className="rounded-[10px] px-[14px] py-3" style={{ border: `1px solid ${c.status === 'pending' ? C.goldBorder : C.border}`, background: c.status === 'pending' ? C.goldBg : '#fff' }}>
                        <div className="flex justify-between mb-[5px] flex-wrap gap-1.5">
                          <span className="font-semibold text-[13px] text-(--color-navy)">{mp ? `${mp.brandName} — ${mp.name}` : 'Parfüm'}</span>
                          <div className="flex gap-1.5 items-center">
                            <Badge color={c.status === 'approved' ? 'green' : 'orange'}>{c.status === 'approved' ? 'Yayında' : 'Bekliyor'}</Badge>
                            <span className="text-[11px] text-(--color-text-light)">{c.date}</span>
                          </div>
                        </div>
                        <p className="text-[13px] text-(--color-text) leading-[1.5]">{c.text}</p>
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
          initialType={tab === 'muadil-brands' ? 'muadil' : 'original'}
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

      {showBulkMM && (
        <BulkAddMuadilModal
          brands={brands}
          perfumes={perfumes}
          muadilPerfumes={muadilPerfumes}
          onClose={() => setShowBulkMM(false)}
          onAdd={addMuadil}
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
            <div className="flex flex-col items-center mb-4">
              <div className="w-[52px] h-[52px] rounded-full bg-[#fff5f5] border border-[#fecaca] flex items-center justify-center mb-3">
                <svg width="24" height="24" fill="none" stroke={C.red} strokeWidth="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
              </div>
              <div className="text-[16px] font-bold text-(--color-navy) mb-1.5 text-center">Emin misiniz?</div>
              <div className="text-sm text-(--color-text-mid) text-center leading-[1.6]">
                <span className="font-semibold text-(--color-text)">"{delTarget.name}"</span> kalıcı olarak silinecek. Bu işlem geri alınamaz.
                {delBrandPw.withMuadils && <><br /><span className="text-(--color-red) font-bold">Dikkat:</span> Bağlı bulunduğu muadillerle birlikte silinecektir.</>}
              </div>
            </div>
            {delTarget.type === 'brand' ? (
              <>
                <div className="mb-2 text-[13px] font-semibold text-(--color-navy)">Admin Şifresi</div>
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
                  className="w-full px-[14px] py-[10px] rounded-[10px] text-sm font-[family-name:var(--font-body)] outline-none box-border mb-1.5"
                  style={{ border: `1px solid ${delBrandPw.error ? C.red : C.border}` }}
                />
                {delBrandPw.error && <div className="text-xs text-(--color-red) mb-[10px]">{delBrandPw.error}</div>}
                <div className="flex gap-[10px] mt-4 justify-end">
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
                  <label className="flex items-center gap-[10px] mb-[14px] px-[14px] py-[10px] rounded-[10px] cursor-pointer text-[13px] font-semibold transition-all duration-150"
                    style={{ background: delBrandPw.withMuadils ? '#fff5f5' : '#f9f9fb', border: `1px solid ${delBrandPw.withMuadils ? '#fecaca' : C.border}`, color: delBrandPw.withMuadils ? C.red : C.textMid }}>
                    <input
                      type="checkbox"
                      checked={delBrandPw.withMuadils}
                      onChange={(e) => {
                        if (delBrandPwRef.current) delBrandPwRef.current.value = '';
                        setDelBrandPw((s) => ({ ...s, withMuadils: e.target.checked, error: '' }));
                      }}
                      className="w-4 h-4 cursor-pointer shrink-0"
                      style={{ accentColor: C.red }}
                    />
                    Bağlı muadil parfümleri de sil ({muadilPerfumes.filter((m) => String(m.targetPerfumeId) === String(delTarget.id)).length} adet)
                  </label>
                )}
                <div className="mb-2 text-[13px] font-semibold text-(--color-navy)">Admin Şifresi</div>
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
                  className="w-full px-[14px] py-[10px] rounded-[10px] text-sm font-[family-name:var(--font-body)] outline-none box-border mb-1.5"
                  style={{ border: `1px solid ${delBrandPw.error ? C.red : C.border}` }}
                />
                {delBrandPw.error && <div className="text-xs text-(--color-red) mb-[10px]">{delBrandPw.error}</div>}
                <div className="flex gap-[10px] mt-4 justify-end">
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
          className="fixed bottom-7 left-6 flex items-center gap-2 px-5 py-[10px] rounded-[50px] bg-(--color-navy) text-white border-none font-bold text-[13px] font-[family-name:var(--font-body)] shadow-[0_4px_20px_rgba(0,0,0,0.2)] transition-[left,opacity] duration-200 z-[100]"
          style={{ cursor: refreshing ? 'default' : 'pointer', opacity: refreshing ? 0.75 : 1 }}
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
