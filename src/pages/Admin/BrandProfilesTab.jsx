import { useState } from 'react';
import { uploadDataURL } from '@/lib/storage';
import { C, F } from '@/constants/theme';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUpload, faTrash, faSpinner, faMagnifyingGlass, faGlobe } from '@fortawesome/free-solid-svg-icons';

function compressToDataURL(file, maxW, quality) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const scale = img.width > maxW ? maxW / img.width : 1;
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/webp', quality));
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function GlobalCard({ type, label, accentColor, accentBg, accentBorder, currentUrl, onUpload, onRemove, loading, MAX_SIZE_MB }) {
  const hasImage = !!currentUrl;
  const inputId = `global-hdr-${type}`;

  const handleFile = async (file) => {
    if (!file.type.startsWith('image/')) return;
    if (file.size > MAX_SIZE_MB * 1024 * 1024) return;
    onUpload(file);
  };

  return (
    <div
      className="rounded-[14px] border overflow-hidden flex-1 min-w-[260px]"
      style={{ borderColor: accentBorder, boxShadow: `0 2px 12px ${accentBg}` }}
    >
      {/* Preview */}
      <div
        className="relative w-full overflow-hidden"
        style={{
          height: '100px',
          background: hasImage
            ? `linear-gradient(to bottom, rgba(15,15,15,.45), rgba(15,15,15,.8)), url(${currentUrl}) center/cover no-repeat`
            : `linear-gradient(135deg, ${C.navy}, ${C.navyLight})`,
        }}
      >
        <span
          className="absolute top-[8px] left-[10px] flex items-center gap-[6px] px-[10px] py-[3px] rounded-full text-[11px] font-bold"
          style={{ background: accentBg, color: accentColor, border: `1px solid ${accentBorder}`, fontFamily: F }}
        >
          <FontAwesomeIcon icon={faGlobe} style={{ fontSize: '10px' }} />
          Global · {label}
        </span>
        {hasImage && (
          <span
            className="absolute bottom-[7px] right-[9px] px-[8px] py-[2px] rounded-full text-[10px] font-semibold"
            style={{ background: 'rgba(255,255,255,.2)', color: 'rgba(255,255,255,.85)', fontFamily: F }}
          >
            Aktif
          </span>
        )}
        {!hasImage && (
          <span
            className="absolute inset-0 flex items-center justify-center text-[11px] font-semibold uppercase tracking-widest"
            style={{ color: 'rgba(255,255,255,.2)', fontFamily: F }}
          >
            Görsel yok
          </span>
        )}
      </div>

      {/* Controls */}
      <div className="px-[14px] py-[12px]" style={{ background: '#fafafa', borderTop: `1px solid ${C.border}` }}>
        <p className="text-[11px] m-0 p-0 mb-[10px]" style={{ color: C.textLight, fontFamily: F }}>
          {hasImage
            ? `Tüm ${label.toLowerCase()} markalara uygulanıyor. Bireysel görsel olan markalar kendi görselini kullanır.`
            : `Yüklersen tüm ${label.toLowerCase()} markalara varsayılan olarak uygulanır. Bireysel görsel olan markalar bunu ezer.`}
        </p>
        <div className="flex gap-[8px]">
          <input
            type="file"
            id={inputId}
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => { if (e.target.files[0]) { handleFile(e.target.files[0]); e.target.value = ''; } }}
          />
          <label
            htmlFor={loading ? undefined : inputId}
            className="flex-1 flex items-center justify-center gap-[6px] h-[32px] rounded-[8px] text-[12px] font-semibold transition-all duration-150"
            style={{
              background: loading ? '#f0f0f0' : C.navy,
              color: loading ? C.textLight : '#fff',
              fontFamily: F,
              border: `1px solid ${loading ? C.border : C.navy}`,
              cursor: loading ? 'default' : 'pointer',
            }}
          >
            <FontAwesomeIcon
              icon={loading ? faSpinner : faUpload}
              style={{ fontSize: '11px', animation: loading ? 'spin 0.8s linear infinite' : 'none' }}
            />
            {loading ? 'Yükleniyor…' : hasImage ? 'Değiştir' : 'Global Görsel Yükle'}
          </label>
          {hasImage && (
            <button
              onClick={() => !loading && onRemove()}
              disabled={loading}
              title="Global görseli kaldır"
              className="flex items-center justify-center w-[32px] h-[32px] rounded-[8px] cursor-pointer"
              style={{ background: '#fff5f5', border: '1px solid #fecaca', color: '#ef4444' }}
            >
              <FontAwesomeIcon icon={faTrash} style={{ fontSize: '11px' }} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export function BrandProfilesTab({ brands, updateBrand, MAX_SIZE_MB, globalBrandHeaders, updateBrandGlobalHeader }) {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [loadingIds, setLoadingIds] = useState(new Set());
  const [errors, setErrors] = useState({});
  const [globalLoading, setGlobalLoading] = useState({ original: false, muadil: false });

  const filtered = brands
    .filter((b) => {
      const matchType = typeFilter === 'all' || b.type === typeFilter;
      const matchSearch = !search || b.name.toLowerCase().includes(search.toLowerCase());
      return matchType && matchSearch;
    })
    .sort((a, b) => a.name.localeCompare(b.name, 'tr'));

  const origCount = brands.filter((b) => b.type === 'original').length;
  const muadilCount = brands.filter((b) => b.type === 'muadil').length;

  const handleUpload = async (brand, file) => {
    if (!file.type.startsWith('image/')) {
      setErrors((e) => ({ ...e, [brand.id]: 'Sadece görsel dosyaları kabul edilir.' }));
      return;
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      setErrors((e) => ({ ...e, [brand.id]: `Maks. ${MAX_SIZE_MB}MB olabilir.` }));
      return;
    }
    setLoadingIds((s) => new Set([...s, brand.id]));
    setErrors((e) => { const n = { ...e }; delete n[brand.id]; return n; });
    try {
      const compressed = await compressToDataURL(file, 1920, 0.85);
      const url = await uploadDataURL(compressed, 'brands/headers');
      await updateBrand(brand.id, { headerImage: url });
    } catch {
      setErrors((e) => ({ ...e, [brand.id]: 'Yükleme başarısız, tekrar deneyin.' }));
    } finally {
      setLoadingIds((s) => { const n = new Set(s); n.delete(brand.id); return n; });
    }
  };

  const handleRemove = async (brand) => {
    setLoadingIds((s) => new Set([...s, brand.id]));
    try {
      await updateBrand(brand.id, { headerImage: null });
    } finally {
      setLoadingIds((s) => { const n = new Set(s); n.delete(brand.id); return n; });
    }
  };

  const handleGlobalUpload = async (type, file) => {
    setGlobalLoading((s) => ({ ...s, [type]: true }));
    try {
      const compressed = await compressToDataURL(file, 1920, 0.85);
      const url = await uploadDataURL(compressed, 'brands/headers/global');
      await updateBrandGlobalHeader(type, url);
    } finally {
      setGlobalLoading((s) => ({ ...s, [type]: false }));
    }
  };

  const handleGlobalRemove = async (type) => {
    setGlobalLoading((s) => ({ ...s, [type]: true }));
    try {
      await updateBrandGlobalHeader(type, null);
    } finally {
      setGlobalLoading((s) => ({ ...s, [type]: false }));
    }
  };

  const FILTERS = [
    { k: 'all',      l: 'Tümü',    count: brands.length },
    { k: 'original', l: 'Orijinal', count: origCount },
    { k: 'muadil',   l: 'Muadil',   count: muadilCount },
  ];

  return (
    <div>
      <div className="mb-5">
        <h2 className="text-[18px] font-[800] text-(--color-navy) mb-1">Marka Profil Görselleri</h2>
        <p className="text-[13px] text-(--color-text-light)">
          Global görsel tüm markalara uygulanır. Bireysel görsel olan markalar kendi görselini kullanır; ikisi de yoksa varsayılan koyu gradyan kullanılır.
        </p>
      </div>

      {/* ── Global bölüm ── */}
      <div
        className="rounded-[14px] border border-(--color-border) p-[16px] mb-[28px]"
        style={{ background: '#f9f9fb' }}
      >
        <div className="flex items-center gap-[8px] mb-[14px]">
          <FontAwesomeIcon icon={faGlobe} style={{ fontSize: '13px', color: C.gold }} />
          <span className="text-[14px] font-[800] text-(--color-navy)" style={{ fontFamily: F }}>
            Global Görseller
          </span>
          <span className="text-[12px] text-(--color-text-light)" style={{ fontFamily: F }}>
            — Tüm orijinal veya muadil markalara tek seferde uygula
          </span>
        </div>
        <div className="flex gap-[14px] flex-wrap">
          <GlobalCard
            type="original"
            label="Orijinal"
            accentColor="#f0c97a"
            accentBg="rgba(184,147,90,.2)"
            accentBorder="rgba(184,147,90,.35)"
            currentUrl={globalBrandHeaders?.original}
            onUpload={(file) => handleGlobalUpload('original', file)}
            onRemove={() => handleGlobalRemove('original')}
            loading={globalLoading.original}
            MAX_SIZE_MB={MAX_SIZE_MB}
          />
          <GlobalCard
            type="muadil"
            label="Muadil"
            accentColor="#86efac"
            accentBg="rgba(34,197,94,.15)"
            accentBorder="rgba(34,197,94,.3)"
            currentUrl={globalBrandHeaders?.muadil}
            onUpload={(file) => handleGlobalUpload('muadil', file)}
            onRemove={() => handleGlobalRemove('muadil')}
            loading={globalLoading.muadil}
            MAX_SIZE_MB={MAX_SIZE_MB}
          />
        </div>
      </div>

      {/* ── Bireysel markalar ── */}
      <div className="flex items-center gap-[10px] mb-[16px] flex-wrap">
        <span className="text-[14px] font-[800] text-(--color-navy)" style={{ fontFamily: F }}>
          Bireysel Görseller
        </span>
        <span className="text-[12px] text-(--color-text-light)" style={{ fontFamily: F }}>
          — Markaya özel görsel globalin önüne geçer
        </span>
      </div>

      {/* Filters row */}
      <div className="flex items-center gap-[10px] mb-[16px] flex-wrap">
        <div className="relative">
          <FontAwesomeIcon
            icon={faMagnifyingGlass}
            className="absolute left-[10px] top-1/2 -translate-y-1/2 pointer-events-none"
            style={{ fontSize: '12px', color: C.textLight }}
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Marka ara…"
            className="h-[34px] w-[200px] box-border border border-(--color-border) rounded-[8px] text-[13px] text-(--color-text) bg-white outline-none"
            style={{ paddingLeft: '30px', paddingRight: '10px', fontFamily: F }}
          />
        </div>

        <div className="flex rounded-[8px] border border-(--color-border) overflow-hidden">
          {FILTERS.map(({ k, l, count }, i) => (
            <button
              key={k}
              onClick={() => setTypeFilter(k)}
              className="flex items-center gap-[5px] px-[12px] h-[34px] text-[12px] font-semibold cursor-pointer border-none transition-colors duration-100"
              style={{
                background: typeFilter === k ? C.navy : '#fff',
                color: typeFilter === k ? '#fff' : C.text,
                fontFamily: F,
                borderRight: i < FILTERS.length - 1 ? `1px solid ${C.border}` : 'none',
              }}
            >
              {l}
              <span
                className="px-[6px] py-[1px] rounded-full text-[10px] font-bold"
                style={{
                  background: typeFilter === k ? 'rgba(255,255,255,.2)' : C.bg,
                  color: typeFilter === k ? '#fff' : C.textLight,
                }}
              >
                {count}
              </span>
            </button>
          ))}
        </div>

        <span className="text-[12px] text-(--color-text-light) ml-auto" style={{ fontFamily: F }}>
          {filtered.length} marka
        </span>
      </div>

      {/* Brand grid */}
      <div className="grid gap-[14px]" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))' }}>
        {filtered.map((brand) => {
          const isLoading = loadingIds.has(brand.id);
          const error = errors[brand.id];
          const hasImage = !!brand.headerImage;
          const inputId = `hdr-upload-${brand.id}`;
          const isOrig = brand.type === 'original';
          const globalImg = isOrig ? globalBrandHeaders?.original : globalBrandHeaders?.muadil;

          return (
            <div
              key={brand.id}
              className="rounded-[14px] border border-(--color-border) overflow-hidden bg-(--color-card)"
              style={{ boxShadow: '0 1px 4px rgba(0,0,0,.06)' }}
            >
              {/* Preview strip — kendi görseli > global > gradyan */}
              <div
                className="relative w-full overflow-hidden"
                style={{
                  height: '88px',
                  background: hasImage
                    ? `linear-gradient(to bottom, rgba(15,15,15,.45), rgba(15,15,15,.8)), url(${brand.headerImage}) center/cover no-repeat`
                    : globalImg
                      ? `linear-gradient(to bottom, rgba(15,15,15,.45), rgba(15,15,15,.8)), url(${globalImg}) center/cover no-repeat`
                      : `linear-gradient(135deg, ${C.navy}, ${C.navyLight})`,
                }}
              >
                {/* durum badge */}
                <span
                  className="absolute bottom-[6px] right-[8px] px-[8px] py-[2px] rounded-full text-[10px] font-semibold"
                  style={{ background: 'rgba(0,0,0,.35)', color: 'rgba(255,255,255,.85)', fontFamily: F }}
                >
                  {hasImage ? 'Bireysel' : globalImg ? 'Global' : 'Varsayılan'}
                </span>
                {/* type badge */}
                <span
                  className="absolute top-[8px] left-[10px] px-[8px] py-[2px] rounded-full text-[10px] font-bold"
                  style={{
                    background: isOrig ? 'rgba(184,147,90,.35)' : 'rgba(34,197,94,.25)',
                    color: isOrig ? '#f0c97a' : '#86efac',
                    border: `1px solid ${isOrig ? 'rgba(184,147,90,.4)' : 'rgba(34,197,94,.3)'}`,
                    fontFamily: F,
                  }}
                >
                  {isOrig ? 'Orijinal' : 'Muadil'}
                </span>
              </div>

              {/* Brand info + controls */}
              <div className="px-[14px] pt-[12px] pb-[14px]">
                <div className="flex items-center gap-[10px] mb-[12px]">
                  <div
                    className="w-[34px] h-[34px] rounded-[8px] flex items-center justify-center text-[11px] font-bold overflow-hidden shrink-0"
                    style={{ background: C.goldBg, border: `1px solid ${C.goldBorder}`, color: C.gold }}
                  >
                    {brand.logoImage
                      ? <img src={brand.logoImage} alt="" className="w-full h-full object-cover" />
                      : brand.logo}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div
                      className="text-[14px] font-bold text-(--color-navy) whitespace-nowrap overflow-hidden text-ellipsis"
                      style={{ fontFamily: F }}
                    >
                      {brand.name}
                    </div>
                    {brand.origin && (
                      <div className="text-[11px] text-(--color-text-light)" style={{ fontFamily: F }}>
                        {brand.origin}
                      </div>
                    )}
                  </div>
                </div>

                {error && (
                  <p className="text-[11px] mb-[8px] m-0 p-0" style={{ color: '#ef4444', fontFamily: F }}>
                    {error}
                  </p>
                )}

                <div className="flex gap-[8px]">
                  <input
                    type="file"
                    id={inputId}
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={(e) => { if (e.target.files[0]) { handleUpload(brand, e.target.files[0]); e.target.value = ''; } }}
                  />
                  <label
                    htmlFor={isLoading ? undefined : inputId}
                    className="flex-1 flex items-center justify-center gap-[6px] h-[32px] rounded-[8px] text-[12px] font-semibold transition-all duration-150"
                    style={{
                      background: isLoading ? '#f0f0f0' : C.navy,
                      color: isLoading ? C.textLight : '#fff',
                      fontFamily: F,
                      border: `1px solid ${isLoading ? C.border : C.navy}`,
                      cursor: isLoading ? 'default' : 'pointer',
                    }}
                  >
                    <FontAwesomeIcon
                      icon={isLoading ? faSpinner : faUpload}
                      style={{ fontSize: '11px', animation: isLoading ? 'spin 0.8s linear infinite' : 'none' }}
                    />
                    {isLoading ? 'Yükleniyor…' : hasImage ? 'Değiştir' : 'Görsel Yükle'}
                  </label>

                  {hasImage && (
                    <button
                      onClick={() => !isLoading && handleRemove(brand)}
                      disabled={isLoading}
                      title="Bireysel görseli kaldır"
                      className="flex items-center justify-center w-[32px] h-[32px] rounded-[8px] cursor-pointer transition-colors duration-150"
                      style={{ background: '#fff5f5', border: '1px solid #fecaca', color: '#ef4444' }}
                    >
                      <FontAwesomeIcon icon={faTrash} style={{ fontSize: '11px' }} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {!filtered.length && (
          <div className="col-span-full text-center py-14 text-(--color-text-light)" style={{ fontFamily: F }}>
            Sonuç bulunamadı.
          </div>
        )}
      </div>
    </div>
  );
}
