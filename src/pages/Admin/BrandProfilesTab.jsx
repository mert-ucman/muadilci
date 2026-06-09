import { useState } from 'react';
import { uploadDataURL } from '@/lib/storage';
import { C, F } from '@/constants/theme';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUpload, faTrash, faSpinner, faMagnifyingGlass } from '@fortawesome/free-solid-svg-icons';

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
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function BrandProfilesTab({ brands, updateBrand, MAX_SIZE_MB }) {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [loadingIds, setLoadingIds] = useState(new Set());
  const [errors, setErrors] = useState({});

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

  const FILTERS = [
    { k: 'all',      l: 'Tümü',           count: brands.length },
    { k: 'original', l: 'Orijinal',        count: origCount },
    { k: 'muadil',   l: 'Muadil',          count: muadilCount },
  ];

  return (
    <div>
      <div className="mb-5">
        <h2 className="text-[18px] font-[800] text-(--color-navy) mb-1">Marka Profil Görselleri</h2>
        <p className="text-[13px] text-(--color-text-light)">
          Marka profil sayfasının başlık arka plan görselini yönetin. Görsel yüklenmemişse varsayılan koyu renk gradyan kullanılır.
        </p>
      </div>

      {/* Filters row */}
      <div className="flex items-center gap-[10px] mb-[18px] flex-wrap">
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
          {filtered.length} marka gösteriliyor
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

          return (
            <div
              key={brand.id}
              className="rounded-[14px] border border-(--color-border) overflow-hidden bg-(--color-card)"
              style={{ boxShadow: '0 1px 4px rgba(0,0,0,.06)' }}
            >
              {/* Preview strip */}
              <div
                className="relative w-full overflow-hidden"
                style={{
                  height: '88px',
                  background: hasImage
                    ? `linear-gradient(to bottom, rgba(15,15,15,.45), rgba(15,15,15,.8)), url(${brand.headerImage}) center/cover no-repeat`
                    : `linear-gradient(135deg, ${C.navy}, ${C.navyLight})`,
                }}
              >
                {!hasImage && (
                  <span
                    className="absolute inset-0 flex items-center justify-center text-[11px] font-semibold tracking-wide uppercase"
                    style={{ color: 'rgba(255,255,255,.25)', letterSpacing: '.08em', fontFamily: F }}
                  >
                    Varsayılan görünüm
                  </span>
                )}
                {hasImage && (
                  <span
                    className="absolute bottom-[6px] right-[8px] px-[8px] py-[2px] rounded-full text-[10px] font-semibold"
                    style={{ background: 'rgba(255,255,255,.2)', color: 'rgba(255,255,255,.85)', fontFamily: F }}
                  >
                    Özel görsel aktif
                  </span>
                )}
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
                      title="Görseli kaldır"
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
          <div
            className="col-span-full text-center py-14 text-(--color-text-light)"
            style={{ fontFamily: F }}
          >
            Sonuç bulunamadı.
          </div>
        )}
      </div>
    </div>
  );
}
