import { useState, useMemo } from 'react';
import { useRouter } from '@/contexts/RouterContext';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import { useW } from '@/hooks/useW';
import { calcScores } from '@/utils/scoring';
import { Card, Badge, ScoreBar, TableScrollHint } from '@/components/ui';
import { faShirt, faGem, faArrowLeft, faHeart, faGlobe } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { GenderBadge } from '@/components/shared';
import { C, F, FH } from '@/constants/theme';
import { useSeo } from '@/lib/seo';
import noImage from '@/img/no-image.jpg';

function IconInstagram() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
    </svg>
  );
}
function PaginationBar({ page, totalPages, onPage, sm }) {
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1)
    .filter(n => n === 1 || n === totalPages || Math.abs(n - page) <= 1);

  const withEllipsis = pages.reduce((acc, n, idx, arr) => {
    if (idx > 0 && n - arr[idx - 1] > 1) acc.push('…');
    acc.push(n);
    return acc;
  }, []);

  return (
    <div className="flex justify-center items-center gap-[6px] mt-[20px] flex-wrap">
      <button
        onClick={() => onPage(Math.max(1, page - 1))}
        disabled={page === 1}
        className="px-[14px] py-[6px] rounded-[8px] border border-(--color-border) bg-(--color-card) text-[13px]"
        style={{ color: page === 1 ? C.textLight : C.text, cursor: page === 1 ? 'default' : 'pointer', fontFamily: F }}
      >
        ‹
      </button>
      {withEllipsis.map((n, i) => n === '…' ? (
        <span key={`e${i}`} className="px-[4px] text-(--color-text-light)">…</span>
      ) : (
        <button
          key={n}
          onClick={() => onPage(n)}
          className="px-[11px] py-[6px] rounded-[8px] text-[13px]"
          style={{
            border: `1px solid ${n === page ? C.navy : C.border}`,
            background: n === page ? C.navy : C.card,
            color: n === page ? '#fff' : C.text,
            cursor: 'pointer',
            fontWeight: n === page ? 700 : 400,
            fontFamily: F,
          }}
        >
          {n}
        </button>
      ))}
      <button
        onClick={() => onPage(Math.min(totalPages, page + 1))}
        disabled={page === totalPages}
        className="px-[14px] py-[6px] rounded-[8px] border border-(--color-border) bg-(--color-card) text-[13px]"
        style={{ color: page === totalPages ? C.textLight : C.text, cursor: page === totalPages ? 'default' : 'pointer', fontFamily: F }}
      >
        ›
      </button>
    </div>
  );
}

function IconGrid() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
      <rect x="1" y="1" width="6" height="6" rx="1"/><rect x="9" y="1" width="6" height="6" rx="1"/>
      <rect x="1" y="9" width="6" height="6" rx="1"/><rect x="9" y="9" width="6" height="6" rx="1"/>
    </svg>
  );
}
function IconList() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
      <rect x="1" y="2" width="14" height="3" rx="1"/><rect x="1" y="7" width="14" height="3" rx="1"/>
      <rect x="1" y="12" width="14" height="3" rx="1"/>
    </svg>
  );
}

export function BrandPage({ params }) {
  const { navigate, goBack } = useRouter();
  const { brands, perfumes, muadilPerfumes, comments, toggleBrandFavorite, isBrandFavorite, toggleMuadilFavorite, isMuadilFavorite } = useData();
  const { user } = useAuth();
  const { sm, xs } = useW();
  const [showTooltip, setShowTooltip] = useState(false);
  const [view, setView] = useState('list');
  const [genderFilter, setGenderFilter] = useState(null); // null = hepsi, 'erkek'|'kadin'|'unisex' = filtreli
  const [sortDir, setSortDir] = useState('az');
  const [listSortKey, setListSortKey] = useState('name');
  const [listSortDir, setListSortDir] = useState('asc');
  const [searchQ, setSearchQ] = useState('');
  const [page, setPage] = useState(1);
  const PER_PAGE = 25;

  const brand = brands.find((b) => b.slug === params?.brandSlug);
  useSeo({
    title: brand ? brand.name : 'Marka',
    description: brand
      ? (brand.bio || `${brand.name} markasının orijinal ve muadil parfümlerini, kökenini ve topluluk puanlarını keşfet.`)
      : undefined,
    image: brand?.logoImage || undefined,
    noindex: !brand,
  });

  const handleListSort = (key) => {
    if (listSortKey === key) setListSortDir((d) => d === 'asc' ? 'desc' : 'asc');
    else { setListSortKey(key); setListSortDir('asc'); }
  };

  // Tüm hook'lar erken return'den ÖNCE — Rules of Hooks
  const isOrig = brand?.type === 'original';
  const allItems = useMemo(() => {
    if (!brand) return [];
    return isOrig
      ? perfumes.filter((p) => p.brandId === brand.id)
      : muadilPerfumes.filter((m) => m.brandId === brand.id);
  }, [brand, isOrig, perfumes, muadilPerfumes]);

  const items = useMemo(() => {
    const q = searchQ.trim().toLowerCase();
    let base = q
      ? allItems.filter((p) => {
          const haystack = isOrig
            ? (p.name || '').toLowerCase()
            : [(p.name || ''), (p.targetPerfumeName || ''), (p.targetBrandName || '')].join(' ').toLowerCase();
          return haystack.includes(q);
        })
      : allItems;
    if (!isOrig) return base;
    let filtered = genderFilter
      ? base.filter((p) => {
          const g = (p.gender || '').toLowerCase();
          if (genderFilter === 'erkek') return g === 'erkek';
          if (genderFilter === 'kadin') return g === 'kadın';
          if (genderFilter === 'unisex') return g === 'unisex';
          return true;
        })
      : base;
    return [...filtered].sort((a, b) =>
      sortDir === 'az' ? a.name.localeCompare(b.name, 'tr') : b.name.localeCompare(a.name, 'tr')
    );
  }, [allItems, isOrig, genderFilter, sortDir, searchQ]);

  const perfumeMuadilCount = useMemo(() => {
    const map = {};
    muadilPerfumes.forEach((m) => {
      map[m.targetPerfumeId] = (map[m.targetPerfumeId] || 0) + 1;
    });
    return map;
  }, [muadilPerfumes]);

  if (!brand) return (
    <div className="px-[60px] py-[60px] text-center text-(--color-text-light)">
      Marka bulunamadı.
    </div>
  );

  const brandPerfumeIds = new Set(allItems.map((p) => p.id));
  const muadilCount = isOrig
    ? muadilPerfumes.filter((m) => brandPerfumeIds.has(m.targetPerfumeId)).length
    : null;

  const brandOverall = (() => {
    if (isOrig) return null;
    const scores = allItems.map((m) => calcScores(m.id, comments).overall).filter((v) => v !== null);
    if (!scores.length) return null;
    return parseFloat((scores.reduce((s, v) => s + v, 0) / scores.length).toFixed(1));
  })();

  const favActive = isBrandFavorite(user?.uid, brand.id);

  const scoreColor = (v) => v === null || v === undefined ? C.textLight : v <= 4 ? C.red : v < 7 ? C.orange : C.green;

  const btnStyle = (active) => ({
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    width: '34px', height: '34px', borderRadius: '8px', border: `1px solid ${C.border}`,
    background: active ? C.navy : C.card, color: active ? '#fff' : C.textMid,
    cursor: 'pointer', transition: 'all .15s', flexShrink: 0,
  });

  const GenderChip = ({ label, field }) => {
    const active = genderFilter === field;
    return (
      <button
        onClick={() => { setGenderFilter(active ? null : field); setPage(1); }}
        className="inline-flex items-center gap-[6px] px-[12px] py-[5px] rounded-[20px] text-[12px] font-semibold cursor-pointer transition-all duration-150"
        style={{
          border: `1px solid ${active ? C.navy : C.border}`,
          background: active ? C.navy : C.card,
          color: active ? '#fff' : C.textMid,
          fontFamily: F,
        }}
      >
        <span
          className="w-[8px] h-[8px] rounded-full shrink-0"
          style={{ background: active ? '#fff' : C.border }}
        />
        {label}
      </button>
    );
  };

  return (
    <div className="min-h-screen bg-(--color-bg)">
      {/* Header */}
      <div
        className="padding"
        style={{
          background: `linear-gradient(135deg,${C.navy},${C.navyLight})`,
          padding: sm ? '32px 16px' : '48px 32px',
        }}
      >
        <div className="max-w-[960px] mx-auto">
          {/* Üst bar */}
          <div className="flex justify-between items-center mb-[20px]">
            <button
              onClick={() => goBack('/markalar')}
              className="inline-flex items-center gap-[7px] rounded-[10px] px-[14px] py-[7px] text-[13px] font-semibold cursor-pointer"
              style={{
                background: 'rgba(255,255,255,.12)',
                border: '1px solid rgba(255,255,255,.2)',
                color: 'rgba(255,255,255,.85)',
                fontFamily: F,
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,.2)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,.12)'}
            >
              <FontAwesomeIcon icon={faArrowLeft} className="text-[12px]" />
              Geri Dön
            </button>
            <button
              onClick={() => { if (user?.uid) toggleBrandFavorite(user.uid, brand.id); }}
              className="inline-flex items-center gap-[7px] rounded-[10px] px-[14px] py-[7px] text-[13px] font-semibold"
              style={{
                background: favActive ? 'rgba(184,150,90,.25)' : 'rgba(255,255,255,.12)',
                border: `1px solid ${favActive ? 'rgba(184,150,90,.5)' : 'rgba(255,255,255,.2)'}`,
                color: favActive ? C.goldLight : 'rgba(255,255,255,.85)',
                cursor: user ? 'pointer' : 'default',
                fontFamily: F,
              }}
            >
              <FontAwesomeIcon icon={faHeart} className="text-[13px]" />
              {favActive ? 'Favorilerde' : 'Favoriye Ekle'}
            </button>
          </div>

          {/* Marka bilgisi */}
          <div
            className="flex items-start"
            style={{ gap: sm ? '16px' : '24px' }}
          >
            <div
              className="rounded-full border-2 flex items-center justify-center font-extrabold text-white shrink-0 overflow-hidden"
              style={{
                width: sm ? '64px' : '96px',
                height: sm ? '64px' : '96px',
                fontSize: sm ? '18px' : '26px',
                background: 'rgba(255,255,255,.12)',
                borderColor: 'rgba(255,255,255,.25)',
              }}
            >
              {brand.logoImage
                ? <img src={brand.logoImage} alt={brand.name} className="w-full h-full object-cover" />
                : brand.logo}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-[8px] mb-[6px] flex-wrap">
                <span className="text-[12px] font-semibold" style={{ color: 'rgba(255,255,255,.5)' }}>
                  {brand.origin}{isOrig && brand.founded ? ` · ${brand.founded}` : ''}
                </span>
                <Badge color={isOrig ? 'gold' : 'green'}>{isOrig ? 'Orijinal Marka' : 'Muadil Marka'}</Badge>
                {isOrig && brand.category && (
                  <div
                    className="inline-flex items-center justify-center gap-[4px] px-[10px] py-[2px] rounded-[20px] text-[11px] font-bold"
                    style={{
                      background: brand.category === 'Niche' ? 'rgba(167,139,250,.25)' : 'rgba(147,197,253,.2)',
                      color: brand.category === 'Niche' ? '#c4b5fd' : '#93c5fd',
                      border: `1px solid ${brand.category === 'Niche' ? 'rgba(167,139,250,.4)' : 'rgba(147,197,253,.3)'}`,
                    }}
                  >
                    <FontAwesomeIcon icon={brand.category === 'Designer' ? faShirt : faGem} className="text-[11px]" />
                    <p className="m-0 p-0 w-max">{brand.category}</p>
                  </div>
                )}
              </div>
              <h1
                className="font-semibold text-white mb-[8px]"
                style={{
                  fontSize: sm ? '24px' : 'clamp(24px,4vw,42px)',
                  fontFamily: FH,
                  letterSpacing: '0.01em',
                }}
              >
                {brand.name}
              </h1>
              <p className="text-[14px] leading-[1.6]" style={{ color: 'rgba(255,255,255,.6)' }}>{brand.bio}</p>

              {/* Sosyal medya / web sitesi bağlantıları */}
              {(brand.instagram || brand.website) && (
                <div className="flex gap-[8px] mt-[12px] flex-wrap items-center">
                  {/* Web sitesi — her iki marka türü için */}
                  {brand.website && brand.website !== 'website yok' && (
                    <a
                      href={brand.website.startsWith('http') ? brand.website : `https://${brand.website}`}
                      target="_blank" rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-[7px] px-[14px] py-[6px] rounded-[20px] text-[13px] font-semibold no-underline transition-[background] duration-150"
                      style={{
                        background: 'rgba(255,255,255,.1)',
                        border: '1px solid rgba(255,255,255,.2)',
                        color: 'rgba(255,255,255,.85)',
                        fontFamily: F,
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,.2)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,.1)'}
                    >
                      <FontAwesomeIcon icon={faGlobe} className="text-[13px]" />
                      Web Sitesi
                    </a>
                  )}
                  {/* "Website yok" etiketi — sadece muadil markalar için */}
                  {!isOrig && brand.website === 'website yok' && (
                    <div
                      className="inline-flex items-center justify-center gap-[7px] px-[14px] py-[6px] rounded-[20px] text-[13px] font-semibold"
                      style={{
                        background: 'rgba(255,255,255,.06)',
                        border: '1px solid rgba(255,255,255,.12)',
                        color: 'rgba(255,255,255,.4)',
                        fontFamily: F,
                      }}
                    >
                      <FontAwesomeIcon icon={faGlobe} className="text-[13px]" />
                      <p className="m-0 p-0 w-max">Web Sitesi Yok</p>
                    </div>
                  )}
                  {/* Instagram */}
                  {brand.instagram && (
                    <a
                      href={brand.instagram.startsWith('http') ? brand.instagram : `https://instagram.com/${brand.instagram.replace(/^@/, '')}`}
                      target="_blank" rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-[7px] px-[14px] py-[6px] rounded-[20px] text-[13px] font-semibold no-underline transition-[background] duration-150"
                      style={{
                        background: 'rgba(255,255,255,.1)',
                        border: '1px solid rgba(255,255,255,.2)',
                        color: 'rgba(255,255,255,.85)',
                        fontFamily: F,
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,.2)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,.1)'}
                    >
                      <IconInstagram />
                      Instagram
                    </a>
                  )}
                </div>
              )}

              {/* İstatistik kutucukları */}
              <div className="flex gap-[10px] mt-[18px] flex-wrap items-center">
                {[
                  { value: allItems.length, label: 'parfüm' },
                  { value: (brand.likes ?? 0).toLocaleString(), label: 'favori' },
                  ...(isOrig ? [{ value: muadilCount, label: 'muadil' }] : []),
                ].map(({ value, label }, i, arr) => (
                  <div key={label} className="flex items-center gap-[10px]">
                    <div
                      className="flex flex-col items-center justify-center backdrop-blur-[8px] shrink-0 rounded-[12px]"
                      style={{
                        background: 'rgba(255,255,255,.07)',
                        border: '1px solid rgba(255,255,255,.15)',
                        width: sm ? '60px' : '72px',
                        height: sm ? '60px' : '72px',
                      }}
                    >
                      <div
                        className="font-black text-white leading-[1.1]"
                        style={{ fontSize: sm ? '18px' : '22px', letterSpacing: '-0.02em', fontFamily: F }}
                      >
                        {value}
                      </div>
                      <div className="text-[9px] font-semibold tracking-[0.06em] uppercase mt-[3px]" style={{ color: 'rgba(255,255,255,.45)' }}>{label}</div>
                    </div>
                    {i < arr.length - 1 && <div className="w-[1px] h-[32px]" style={{ background: 'rgba(255,255,255,.15)' }} />}
                  </div>
                ))}
                {!isOrig && (
                  <div className="flex items-center gap-[10px]">
                    <div className="w-[1px] h-[32px]" style={{ background: 'rgba(255,255,255,.15)' }} />
                    <div className="relative">
                      <div className="flex items-center gap-[6px]">
                        <div
                          className="flex flex-col items-center justify-center backdrop-blur-[8px] shrink-0 rounded-[12px]"
                          style={{
                            background: 'rgba(255,255,255,.07)',
                            border: '1px solid rgba(255,255,255,.15)',
                            width: sm ? '60px' : '72px',
                            height: sm ? '60px' : '72px',
                          }}
                        >
                          <div
                            className="font-black leading-[1.1]"
                            style={{
                              fontSize: sm ? '16px' : '18px',
                              letterSpacing: '-0.02em',
                              color: brandOverall !== null ? C.goldLight : 'rgba(255,255,255,.4)',
                              fontFamily: F,
                            }}
                          >
                            {brandOverall !== null ? `${brandOverall}/10` : '—'}
                          </div>
                          <div className="text-[9px] font-semibold tracking-[0.06em] uppercase mt-[3px] text-center" style={{ color: 'rgba(255,255,255,.45)' }}>marka puanı</div>
                        </div>
                        <button
                          onMouseEnter={() => setShowTooltip(true)}
                          onMouseLeave={() => setShowTooltip(false)}
                          className="w-[18px] h-[18px] rounded-full text-[11px] font-bold cursor-default flex items-center justify-center shrink-0"
                          style={{
                            border: '1px solid rgba(255,255,255,.35)',
                            background: 'rgba(255,255,255,.15)',
                            color: 'rgba(255,255,255,.7)',
                            fontFamily: F,
                          }}
                        >
                          ?
                        </button>
                      </div>
                      {showTooltip && (
                        <div
                          className="absolute top-0 rounded-[12px] p-[14px] shadow-[0_8px_24px_rgba(0,0,0,.15)] z-10 text-[12px] text-(--color-text) leading-[1.6]"
                          style={{
                            left: '100%',
                            marginLeft: '10px',
                            width: sm ? '220px' : '260px',
                            background: '#fff',
                            border: `1px solid ${C.border}`,
                          }}
                        >
                          <div className="font-bold text-(--color-navy) mb-[8px] text-[13px]">Marka Puanı Nasıl Hesaplanır?</div>
                          <div className="mb-[6px]">Bu markaya ait tüm muadil parfümlerin <span className="font-semibold text-(--color-gold)">Genel Puanları</span> toplanır ve ortalaması alınır.</div>
                          <div className="mb-[6px]">Her parfümün genel puanı; <span className="font-semibold">koku yakınlığı</span>, <span className="font-semibold">yayılım</span> ve <span className="font-semibold">kalıcılık</span> ortalamasından oluşur.</div>
                          <div className="pt-[8px] border-t border-(--color-border-light) text-(--color-text-mid)">Marka puanı bu parfüm puanlarının eşit ağırlıklı ortalamasıdır (0–10).</div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* İçerik */}
      <div
        className="max-w-[960px] mx-auto"
        style={{ padding: sm ? '24px 16px' : '36px 32px' }}
      >

        {/* Toolbar */}
        <div className="flex flex-col gap-[12px] mb-[18px]">
          {/* Üst satır: başlık + görünüm toggle */}
          <div className="flex items-center justify-between gap-[10px] flex-wrap">
            <h2 className="text-[20px] font-extrabold text-(--color-navy) m-0">
              Parfümler
              <span className="text-[13px] font-medium text-(--color-text-light) ml-[8px]">({items.length})</span>
            </h2>
            <div className="flex items-center gap-[8px]">
              <button style={btnStyle(view === 'grid')} onClick={() => setView('grid')} title="Izgara görünümü"><IconGrid /></button>
              <button style={btnStyle(view === 'list')} onClick={() => setView('list')} title="Liste görünümü"><IconList /></button>
            </div>
          </div>

          {/* Alt satır: arama + filtreler */}
          <div className="flex items-center gap-[8px] flex-wrap">
            {/* Arama kutusu */}
            <div className="relative flex-1 min-w-[200px] max-w-[320px]">
              <svg
                width="14" height="14" viewBox="0 0 20 20" fill="none"
                stroke={C.textLight} strokeWidth="2" strokeLinecap="round"
                className="absolute left-[10px] top-1/2 -translate-y-1/2 pointer-events-none"
              >
                <circle cx="9" cy="9" r="7"/><line x1="16" y1="16" x2="12.5" y2="12.5"/>
              </svg>
              <input
                value={searchQ}
                onChange={(e) => { setSearchQ(e.target.value); setPage(1); }}
                placeholder={isOrig ? 'Parfüm ara...' : 'Parfüm veya hedef ara...'}
                className="w-full box-border h-[34px] pl-[32px] pr-[10px] rounded-[8px] border border-(--color-border) bg-(--color-card) text-(--color-text) text-[13px] outline-none"
                style={{ fontFamily: F }}
              />
            </div>

            {/* Cinsiyet filtresi — sadece orijinal markada */}
            {isOrig && (
              <div className="flex gap-[6px]">
                <GenderChip label="Erkek" field="erkek" />
                <GenderChip label="Kadın" field="kadin" />
                <GenderChip label="Unisex" field="unisex" />
              </div>
            )}

            {/* Sıralama — sadece orijinal */}
            {isOrig && (
              <select
                value={sortDir}
                onChange={(e) => { setSortDir(e.target.value); setPage(1); }}
                className="h-[34px] px-[10px] rounded-[8px] border border-(--color-border) bg-(--color-card) text-(--color-text) text-[13px] cursor-pointer outline-none"
                style={{ fontFamily: F }}
              >
                <option value="az">A → Z</option>
                <option value="za">Z → A</option>
              </select>
            )}
          </div>
        </div>

        {/* Grid View */}
        {view === 'grid' && (() => {
          const totalPages = Math.max(1, Math.ceil(items.length / PER_PAGE));
          const safePage = Math.min(page, totalPages);
          const pageItems = items.slice((safePage - 1) * PER_PAGE, safePage * PER_PAGE);
          return (
          <>
          <div
            className="grid gap-[16px]"
            style={{ gridTemplateColumns: xs ? '1fr' : sm ? '1fr 1fr' : 'repeat(auto-fill,minmax(240px,1fr))' }}
          >
            {pageItems.map((item) => {
              const ms = !isOrig ? calcScores(item.id, comments) : null;
              const mCount = isOrig ? (perfumeMuadilCount[item.id] || 0) : null;
              const uid = user?.uid || user?.id;
              const fav = !isOrig ? isMuadilFavorite(uid, item.id) : false;
              return (
                <Card key={item.id} hover style={{ padding: '0', cursor: 'pointer', overflow: 'hidden', position: 'relative' }}
                  onClick={() => isOrig ? navigate(`/${item.brandSlug}/${item.slug}`) : navigate(`/karsilastir?orijinal=${item.targetPerfumeId}&muadil=${item.id}`)}>
                  <div className="w-full bg-[#f0f0f0] overflow-hidden relative" style={{ aspectRatio: '4/3' }}>
                    <img src={item.image || noImage} alt={item.name} onError={(e) => { e.currentTarget.src = noImage; }} className="w-full h-full object-cover block" />
                    {/* Muadil sayı badge — sadece orijinal parfümlerde */}
                    {isOrig && (
                      <div
                        className="absolute top-[10px] right-[10px] text-white rounded-[20px] px-[10px] py-[3px] text-[11px] font-bold z-[1] shadow-[0_2px_6px_rgba(0,0,0,.2)]"
                        style={{ background: mCount > 0 ? C.green : C.textLight }}
                      >
                        {mCount} muadil
                      </div>
                    )}
                    {/* Favori butonu — sadece muadil parfümlerde */}
                    {!isOrig && (
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleMuadilFavorite(uid, item.id); }}
                        className="absolute top-[10px] right-[10px] w-[30px] h-[30px] rounded-full flex items-center justify-center cursor-pointer backdrop-blur-[4px] shadow-[0_2px_6px_rgba(0,0,0,.1)] z-[1]"
                        style={{
                          border: `1px solid ${fav ? C.goldBorder : 'rgba(255,255,255,.6)'}`,
                          background: fav ? C.goldBg : 'rgba(255,255,255,.9)',
                        }}
                      >
                        <FontAwesomeIcon icon={faHeart} style={{ fontSize: '12px', color: fav ? C.gold : C.textLight }} />
                      </button>
                    )}
                  </div>
                  <div className="px-[16px] py-[14px]">
                    <div className="text-[15px] font-bold text-(--color-navy) mb-[4px] whitespace-nowrap overflow-hidden text-ellipsis">{item.name}</div>
                    {!isOrig && <div className="text-[12px] text-(--color-text-light) mb-[8px]">→ {item.targetBrandName} {item.targetPerfumeName}</div>}
                    {isOrig && <GenderBadge gender={item.gender} />}
                    {!isOrig && ms && (
                      <>
                        <ScoreBar label="Koku Yakınlığı" value={ms.scent} empty={ms.scent === null} />
                        <ScoreBar label="Yayılım" value={ms.projection} empty={ms.projection === null} />
                        <ScoreBar label="Kalıcılık" value={ms.longevity} empty={ms.longevity === null} />
                        {!ms.count && <div className="text-[11px] text-(--color-text-light) italic text-center mb-[4px]">Henüz yorum yok</div>}
                        <div className="mt-[10px] pt-[10px] border-t border-(--color-border-light) flex justify-between items-center">
                          <span style={{ fontSize: '12px', fontWeight: 700, color: scoreColor(ms.overall) }}>
                            {ms.overall !== null ? `${ms.overall}/10` : '—'}
                          </span>
                          <span className="text-[11px] text-(--color-text-light)">Genel Puan</span>
                        </div>
                      </>
                    )}
                  </div>
                </Card>
              );
            })}
            {!items.length && (
              <div className="col-span-full text-center py-[60px] px-[60px] text-(--color-text-light)">
                Seçilen filtreye uygun parfüm bulunamadı.
              </div>
            )}
          </div>
          {totalPages > 1 && <PaginationBar page={safePage} totalPages={totalPages} onPage={(p) => { setPage(p); window.scrollTo({top:0,behavior:'smooth'}); }} sm={sm} />}
          </>
          );
        })()}

        {/* List View */}
        {view === 'list' && (() => {
          const LIST_COLS = isOrig
            ? [{ key: 'name', label: 'Parfüm' }, { key: 'gender', label: 'Cinsiyet' }, { key: 'muadil', label: 'Muadil' }]
            : [{ key: 'name', label: 'Parfüm' }, { key: 'target', label: 'Hedef Parfüm' }, { key: 'scent', label: 'Koku' }, { key: 'projection', label: 'Yayılım' }, { key: 'longevity', label: 'Kalıcılık' }, { key: 'score', label: 'Genel Puan' }];

          const allListItems = [...items].sort((a, b) => {
            let av, bv;
            if (listSortKey === 'name')       { av = a.name || ''; bv = b.name || ''; return listSortDir === 'asc' ? av.localeCompare(bv, 'tr') : bv.localeCompare(av, 'tr'); }
            if (listSortKey === 'gender')     { av = a.gender || ''; bv = b.gender || ''; return listSortDir === 'asc' ? av.localeCompare(bv, 'tr') : bv.localeCompare(av, 'tr'); }
            if (listSortKey === 'muadil')     { av = perfumeMuadilCount[a.id] || 0; bv = perfumeMuadilCount[b.id] || 0; return listSortDir === 'asc' ? av - bv : bv - av; }
            if (listSortKey === 'score')      { av = calcScores(a.id, comments).overall ?? -1; bv = calcScores(b.id, comments).overall ?? -1; return listSortDir === 'asc' ? av - bv : bv - av; }
            if (listSortKey === 'scent')      { av = calcScores(a.id, comments).scent ?? -1; bv = calcScores(b.id, comments).scent ?? -1; return listSortDir === 'asc' ? av - bv : bv - av; }
            if (listSortKey === 'projection') { av = calcScores(a.id, comments).projection ?? -1; bv = calcScores(b.id, comments).projection ?? -1; return listSortDir === 'asc' ? av - bv : bv - av; }
            if (listSortKey === 'longevity')  { av = calcScores(a.id, comments).longevity ?? -1; bv = calcScores(b.id, comments).longevity ?? -1; return listSortDir === 'asc' ? av - bv : bv - av; }
            return 0;
          });

          const totalPages = Math.max(1, Math.ceil(allListItems.length / PER_PAGE));
          const safePage = Math.min(page, totalPages);
          const listItems = allListItems.slice((safePage - 1) * PER_PAGE, safePage * PER_PAGE);

          return (
          <>
          <Card style={{ overflow: 'hidden' }}>
            <TableScrollHint />
            <div className="overflow-x-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
            <table className="w-full min-w-[520px] border-collapse">
              <thead>
                <tr className="bg-(--color-bg)">
                  {LIST_COLS.map(({ key, label }) => {
                    const sortable = key !== 'target';
                    const active = listSortKey === key;
                    const dir = active ? (listSortDir === 'asc' ? '↑' : '↓') : '↕';
                    return (
                      <th
                        key={key}
                        onClick={() => sortable && handleListSort(key)}
                        className="px-[14px] py-[10px] text-[11px] font-bold uppercase tracking-[.05em] border-b border-(--color-border) whitespace-nowrap select-none"
                        style={{
                          textAlign: key === 'name' || key === 'target' ? 'left' : 'center',
                          color: active ? C.navy : C.textMid,
                          cursor: sortable ? 'pointer' : 'default',
                        }}
                      >
                        <span className="inline-flex items-center gap-[4px]">
                          {label}
                          {sortable && (
                            <span style={{ fontSize: '12px', color: active ? C.navy : C.border, fontWeight: 900 }}>{dir}</span>
                          )}
                        </span>
                      </th>
                    );
                  })}
                  {!isOrig && <th className="px-[14px] py-[10px] border-b border-(--color-border)" />}
                </tr>
              </thead>
              <tbody>
                {listItems.map((item) => {
                  const ms = !isOrig ? calcScores(item.id, comments) : null;
                  const mCount = isOrig ? (perfumeMuadilCount[item.id] || 0) : null;
                  const uid = user?.uid || user?.id;
                  const fav = !isOrig ? isMuadilFavorite(uid, item.id) : false;
                  return (
                    <tr
                      key={item.id}
                      onMouseDown={(e) => { e.currentTarget._mdX = e.clientX; e.currentTarget._mdY = e.clientY; }}
                      onClick={(e) => { if (Math.abs(e.clientX - e.currentTarget._mdX) > 5 || Math.abs(e.clientY - e.currentTarget._mdY) > 5) return; isOrig ? navigate(`/${item.brandSlug}/${item.slug}`) : navigate(`/karsilastir?orijinal=${item.targetPerfumeId}&muadil=${item.id}`); }}
                      className="border-b border-(--color-border-light) cursor-pointer transition-[background] duration-100"
                      onMouseEnter={(e) => e.currentTarget.style.background = C.bg}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      {/* Parfüm adı */}
                      <td className="px-[14px] py-[12px]">
                        <div className="flex items-center gap-[10px]">
                          <div className="w-[40px] h-[40px] rounded-[8px] bg-[#f0f0f0] overflow-hidden shrink-0">
                            <img src={item.image || noImage} alt={item.name} onError={(e) => { e.currentTarget.src = noImage; }} className="w-full h-full object-cover" />
                          </div>
                          <span className="font-semibold text-[14px] text-(--color-navy)">{item.name}</span>
                        </div>
                      </td>
                      {/* Orijinal: Cinsiyet | Muadil: Hedef Parfüm */}
                      {isOrig
                        ? <td className="px-[14px] py-[12px] text-center"><GenderBadge gender={item.gender} /></td>
                        : <td className="px-[14px] py-[12px] text-[12px] text-(--color-text-mid)">{item.targetBrandName} {item.targetPerfumeName}</td>
                      }
                      {/* Orijinal: Muadil sayısı | Muadil: 4 puan sütunu */}
                      {isOrig
                        ? <td className="px-[14px] py-[12px] text-center">
                            <div
                              className="inline-block rounded-[20px] px-[10px] py-[2px] text-[12px] font-bold"
                              style={{
                                background: mCount > 0 ? C.greenBg : C.bg,
                                color: mCount > 0 ? C.green : C.textLight,
                                border: `1px solid ${mCount > 0 ? C.greenBorder : C.border}`,
                              }}
                            >
                              {mCount} muadil
                            </div>
                          </td>
                        : <>
                            <td className="px-[14px] py-[12px] text-center">
                              <span style={{ fontWeight: 700, fontSize: '13px', color: scoreColor(ms?.scent ?? null) }}>{ms?.scent != null ? `${ms.scent}/10` : '—'}</span>
                            </td>
                            <td className="px-[14px] py-[12px] text-center">
                              <span style={{ fontWeight: 700, fontSize: '13px', color: scoreColor(ms?.projection ?? null) }}>{ms?.projection != null ? `${ms.projection}/10` : '—'}</span>
                            </td>
                            <td className="px-[14px] py-[12px] text-center">
                              <span style={{ fontWeight: 700, fontSize: '13px', color: scoreColor(ms?.longevity ?? null) }}>{ms?.longevity != null ? `${ms.longevity}/10` : '—'}</span>
                            </td>
                            <td className="px-[14px] py-[12px] text-center">
                              <span style={{ fontWeight: 700, fontSize: '14px', color: scoreColor(ms?.overall ?? null) }}>{ms?.overall != null ? `${ms.overall}/10` : '—'}</span>
                            </td>
                          </>
                      }
                      {/* Favori butonu — sadece muadil */}
                      {!isOrig && (
                        <td className="px-[14px] py-[12px] text-center" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => toggleMuadilFavorite(uid, item.id)}
                            className="w-[28px] h-[28px] rounded-full flex items-center justify-center cursor-pointer"
                            style={{
                              border: `1px solid ${fav ? C.goldBorder : C.border}`,
                              background: fav ? C.goldBg : '#fff',
                            }}
                          >
                            <FontAwesomeIcon icon={faHeart} style={{ fontSize: '12px', color: fav ? C.gold : C.textLight }} />
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
            </div>
            {!allListItems.length && (
              <div className="text-center py-[60px] px-[60px] text-(--color-text-light)">
                Seçilen filtreye uygun parfüm bulunamadı.
              </div>
            )}
          </Card>
          {totalPages > 1 && <PaginationBar page={safePage} totalPages={totalPages} onPage={(p) => { setPage(p); window.scrollTo({top:0,behavior:'smooth'}); }} sm={sm} />}
          </>
          );
        })()}
      </div>
    </div>
  );
}
