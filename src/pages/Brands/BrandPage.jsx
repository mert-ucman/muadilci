import { useState, useMemo } from 'react';
import { useRouter } from '@/contexts/RouterContext';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import { useW } from '@/hooks/useW';
import { calcScores } from '@/utils/scoring';
import { Card, Badge, ScoreBar } from '@/components/ui';
import { faShirt, faGem, faArrowLeft, faHeart } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { GenderBadge } from '@/components/shared';
import { C, F, FH } from '@/constants/theme';
import noImage from '@/img/no-image.jpg';

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
  const { navigate } = useRouter();
  const { brands, perfumes, muadilPerfumes, comments, toggleBrandFavorite, isBrandFavorite, toggleMuadilFavorite, isMuadilFavorite } = useData();
  const { user } = useAuth();
  const { sm, xs } = useW();
  const [showTooltip, setShowTooltip] = useState(false);
  const [view, setView] = useState('grid');
  const [genderFilter, setGenderFilter] = useState(null); // null = hepsi, 'erkek'|'kadin'|'unisex' = filtreli
  const [sortDir, setSortDir] = useState('az');
  const [listSortKey, setListSortKey] = useState('name');
  const [listSortDir, setListSortDir] = useState('asc');

  const handleListSort = (key) => {
    if (listSortKey === key) setListSortDir((d) => d === 'asc' ? 'desc' : 'asc');
    else { setListSortKey(key); setListSortDir('asc'); }
  };

  const brand = brands.find((b) => b.slug === params?.brandSlug);
  if (!brand) return <div style={{ padding: '60px', textAlign: 'center', color: C.textLight }}>Marka bulunamadı.</div>;

  const isOrig = brand.type === 'original';
  const allItems = isOrig
    ? perfumes.filter((p) => p.brandId === brand.id)
    : muadilPerfumes.filter((m) => m.brandId === brand.id);

  // Orijinal marka: cinsiyet filtresi + sıralama
  const items = useMemo(() => {
    if (!isOrig) return allItems;
    let filtered = genderFilter
      ? allItems.filter((p) => {
          const g = (p.gender || '').toLowerCase();
          if (genderFilter === 'erkek') return g === 'erkek';
          if (genderFilter === 'kadin') return g === 'kadın';
          if (genderFilter === 'unisex') return g === 'unisex';
          return true;
        })
      : allItems;
    return [...filtered].sort((a, b) =>
      sortDir === 'az' ? a.name.localeCompare(b.name, 'tr') : b.name.localeCompare(a.name, 'tr')
    );
  }, [allItems, isOrig, genderFilter, sortDir]);

  // Her orijinal parfüme ait muadil sayısı
  const perfumeMuadilCount = useMemo(() => {
    const map = {};
    muadilPerfumes.forEach((m) => {
      map[m.targetPerfumeId] = (map[m.targetPerfumeId] || 0) + 1;
    });
    return map;
  }, [muadilPerfumes]);

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

  const scoreColor = (v) => v === null || v === undefined ? C.textLight : v <= 4 ? C.red : v <= 6 ? C.orange : C.green;

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
        onClick={() => setGenderFilter(active ? null : field)}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: '6px',
          padding: '5px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 600,
          border: `1px solid ${active ? C.navy : C.border}`,
          background: active ? C.navy : C.card,
          color: active ? '#fff' : C.textMid,
          cursor: 'pointer', fontFamily: F, transition: 'all .15s',
        }}>
        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: active ? '#fff' : C.border, flexShrink: 0 }} />
        {label}
      </button>
    );
  };

  return (
    <div style={{ minHeight: '100vh', background: C.bg }}>
      {/* Header */}
      <div style={{ background: `linear-gradient(135deg,${C.navy},${C.navyLight})`, padding: sm ? '32px 16px' : '48px 32px' }}>
        <div style={{ maxWidth: '960px', margin: '0 auto' }}>
          {/* Üst bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <button onClick={() => navigate('/markalar')}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', background: 'rgba(255,255,255,.12)', border: '1px solid rgba(255,255,255,.2)', borderRadius: '10px', padding: '7px 14px', color: 'rgba(255,255,255,.85)', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: F }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,.2)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,.12)'}>
              <FontAwesomeIcon icon={faArrowLeft} style={{ fontSize: '12px' }} />
              Geri Dön
            </button>
            <button onClick={() => { if (user?.uid) toggleBrandFavorite(user.uid, brand.id); }}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', background: favActive ? 'rgba(184,150,90,.25)' : 'rgba(255,255,255,.12)', border: `1px solid ${favActive ? 'rgba(184,150,90,.5)' : 'rgba(255,255,255,.2)'}`, borderRadius: '10px', padding: '7px 14px', color: favActive ? C.goldLight : 'rgba(255,255,255,.85)', fontSize: '13px', fontWeight: 600, cursor: user ? 'pointer' : 'default', fontFamily: F }}>
              <FontAwesomeIcon icon={faHeart} style={{ fontSize: '13px' }} />
              {favActive ? 'Favorilerde' : 'Favoriye Ekle'}
            </button>
          </div>

          {/* Marka bilgisi */}
          <div style={{ display: 'flex', gap: sm ? '16px' : '24px', alignItems: 'flex-start' }}>
            <div style={{ width: sm ? '64px' : '96px', height: sm ? '64px' : '96px', borderRadius: '50%', background: 'rgba(255,255,255,.12)', border: '2px solid rgba(255,255,255,.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: sm ? '18px' : '26px', color: '#fff', fontWeight: 800, flexShrink: 0, overflow: 'hidden' }}>
              {brand.logoImage
                ? <img src={brand.logoImage} alt={brand.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : brand.logo}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '12px', color: 'rgba(255,255,255,.5)', fontWeight: 600 }}>{brand.origin} · {brand.founded}</span>
                <Badge color={isOrig ? 'gold' : 'green'}>{isOrig ? 'Orijinal Marka' : 'Muadil Marka'}</Badge>
                {isOrig && brand.category && (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '2px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 700, background: brand.category === 'Niche' ? 'rgba(167,139,250,.25)' : 'rgba(147,197,253,.2)', color: brand.category === 'Niche' ? '#c4b5fd' : '#93c5fd', border: `1px solid ${brand.category === 'Niche' ? 'rgba(167,139,250,.4)' : 'rgba(147,197,253,.3)'}` }}>
                    <FontAwesomeIcon icon={brand.category === 'Designer' ? faShirt : faGem} style={{ fontSize: '11px' }} /> {brand.category}
                  </span>
                )}
              </div>
              <h1 style={{ fontSize: sm ? '24px' : 'clamp(24px,4vw,42px)', fontWeight: 600, color: '#fff', marginBottom: '8px', fontFamily: FH, letterSpacing: '0.01em' }}>{brand.name}</h1>
              <p style={{ color: 'rgba(255,255,255,.6)', fontSize: '14px', lineHeight: 1.6 }}>{brand.bio}</p>

              {/* İstatistik kutucukları */}
              <div style={{ display: 'flex', gap: '10px', marginTop: '18px', flexWrap: 'wrap', alignItems: 'center' }}>
                {[
                  { value: allItems.length, label: 'parfüm' },
                  { value: (brand.likes ?? 0).toLocaleString(), label: 'favori' },
                  ...(isOrig ? [{ value: muadilCount, label: 'muadil' }] : []),
                ].map(({ value, label }, i, arr) => (
                  <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ background: 'rgba(255,255,255,.07)', border: '1px solid rgba(255,255,255,.15)', borderRadius: '12px', width: sm ? '60px' : '72px', height: sm ? '60px' : '72px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(8px)', flexShrink: 0 }}>
                      <div style={{ fontSize: sm ? '18px' : '22px', fontWeight: 900, color: '#fff', letterSpacing: '-0.02em', lineHeight: 1.1, fontFamily: F }}>{value}</div>
                      <div style={{ fontSize: '9px', color: 'rgba(255,255,255,.45)', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', marginTop: '3px' }}>{label}</div>
                    </div>
                    {i < arr.length - 1 && <div style={{ width: '1px', height: '32px', background: 'rgba(255,255,255,.15)' }} />}
                  </div>
                ))}
                {!isOrig && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '1px', height: '32px', background: 'rgba(255,255,255,.15)' }} />
                    <div style={{ position: 'relative' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <div style={{ background: 'rgba(255,255,255,.07)', border: '1px solid rgba(255,255,255,.15)', borderRadius: '12px', width: sm ? '60px' : '72px', height: sm ? '60px' : '72px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(8px)', flexShrink: 0 }}>
                          <div style={{ fontSize: sm ? '16px' : '18px', fontWeight: 900, color: brandOverall !== null ? C.goldLight : 'rgba(255,255,255,.4)', letterSpacing: '-0.02em', lineHeight: 1.1, fontFamily: F }}>{brandOverall !== null ? `${brandOverall}/10` : '—'}</div>
                          <div style={{ fontSize: '9px', color: 'rgba(255,255,255,.45)', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', marginTop: '3px' }}>marka puanı</div>
                        </div>
                        <button onMouseEnter={() => setShowTooltip(true)} onMouseLeave={() => setShowTooltip(false)}
                          style={{ width: '18px', height: '18px', borderRadius: '50%', border: '1px solid rgba(255,255,255,.35)', background: 'rgba(255,255,255,.15)', color: 'rgba(255,255,255,.7)', fontSize: '11px', fontWeight: 700, cursor: 'default', fontFamily: F, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>?</button>
                      </div>
                      {showTooltip && (
                        <div style={{ position: 'absolute', top: 0, left: '100%', marginLeft: '10px', width: sm ? '220px' : '260px', background: '#fff', border: `1px solid ${C.border}`, borderRadius: '12px', padding: '14px', boxShadow: '0 8px 24px rgba(0,0,0,.15)', zIndex: 10, fontSize: '12px', color: C.text, lineHeight: 1.6 }}>
                          <div style={{ fontWeight: 700, color: C.navy, marginBottom: '8px', fontSize: '13px' }}>Marka Puanı Nasıl Hesaplanır?</div>
                          <div style={{ marginBottom: '6px' }}>Bu markaya ait tüm muadil parfümlerin <span style={{ fontWeight: 600, color: C.gold }}>Genel Puanları</span> toplanır ve ortalaması alınır.</div>
                          <div style={{ marginBottom: '6px' }}>Her parfümün genel puanı; <span style={{ fontWeight: 600 }}>koku yakınlığı</span>, <span style={{ fontWeight: 600 }}>yayılım</span> ve <span style={{ fontWeight: 600 }}>kalıcılık</span> ortalamasından oluşur.</div>
                          <div style={{ paddingTop: '8px', borderTop: `1px solid ${C.borderLight}`, color: C.textMid }}>Marka puanı bu parfüm puanlarının eşit ağırlıklı ortalamasıdır (0–10).</div>
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
      <div style={{ maxWidth: '960px', margin: '0 auto', padding: sm ? '24px 16px' : '36px 32px' }}>

        {/* Toolbar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', marginBottom: '18px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 800, color: C.navy, margin: 0 }}>
            Parfümler
            <span style={{ fontSize: '13px', fontWeight: 500, color: C.textLight, marginLeft: '8px' }}>({items.length})</span>
          </h2>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            {/* Cinsiyet filtresi — sadece orijinal markada */}
            {isOrig && (
              <div style={{ display: 'flex', gap: '6px' }}>
                <GenderChip label="Erkek" field="erkek" />
                <GenderChip label="Kadın" field="kadin" />
                <GenderChip label="Unisex" field="unisex" />
              </div>
            )}

            {/* Sıralama */}
            {isOrig && (
              <select value={sortDir} onChange={(e) => setSortDir(e.target.value)}
                style={{ height: '34px', padding: '0 10px', borderRadius: '8px', border: `1px solid ${C.border}`, background: C.card, color: C.text, fontSize: '13px', fontFamily: F, cursor: 'pointer', outline: 'none' }}>
                <option value="az">A → Z</option>
                <option value="za">Z → A</option>
              </select>
            )}

            {/* Grid / Liste toggle */}
            <button style={btnStyle(view === 'grid')} onClick={() => setView('grid')} title="Izgara görünümü"><IconGrid /></button>
            <button style={btnStyle(view === 'list')} onClick={() => setView('list')} title="Liste görünümü"><IconList /></button>
          </div>
        </div>

        {/* Grid View */}
        {view === 'grid' && (
          <div style={{ display: 'grid', gridTemplateColumns: xs ? '1fr' : sm ? '1fr 1fr' : 'repeat(auto-fill,minmax(240px,1fr))', gap: '16px' }}>
            {items.map((item) => {
              const ms = !isOrig ? calcScores(item.id, comments) : null;
              const mCount = isOrig ? (perfumeMuadilCount[item.id] || 0) : null;
              const uid = user?.uid || user?.id;
              const fav = !isOrig ? isMuadilFavorite(uid, item.id) : false;
              return (
                <Card key={item.id} hover style={{ padding: '0', cursor: 'pointer', overflow: 'hidden', position: 'relative' }}
                  onClick={() => isOrig ? navigate(`/${item.brandSlug}/${item.slug}`) : navigate(`/karsilastir?orijinal=${item.targetPerfumeId}&muadil=${item.id}`)}>
                  <div style={{ width: '100%', aspectRatio: '4/3', background: '#f0f0f0', overflow: 'hidden', position: 'relative' }}>
                    <img src={item.image || noImage} alt={item.name} onError={(e) => { e.currentTarget.src = noImage; }} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                    {/* Muadil sayı badge — sadece orijinal parfümlerde */}
                    {isOrig && (
                      <div style={{ position: 'absolute', top: '10px', right: '10px', background: mCount > 0 ? C.green : C.textLight, color: '#fff', borderRadius: '20px', padding: '3px 10px', fontSize: '11px', fontWeight: 700, zIndex: 1, boxShadow: '0 2px 6px rgba(0,0,0,.2)' }}>
                        {mCount} muadil
                      </div>
                    )}
                    {/* Favori butonu — sadece muadil parfümlerde */}
                    {!isOrig && (
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleMuadilFavorite(uid, item.id); }}
                        style={{ position: 'absolute', top: '10px', right: '10px', width: '30px', height: '30px', borderRadius: '50%', border: `1px solid ${fav ? C.goldBorder : 'rgba(255,255,255,.6)'}`, background: fav ? C.goldBg : 'rgba(255,255,255,.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', backdropFilter: 'blur(4px)', boxShadow: '0 2px 6px rgba(0,0,0,.1)', zIndex: 1 }}>
                        <FontAwesomeIcon icon={faHeart} style={{ fontSize: '12px', color: fav ? C.gold : C.textLight }} />
                      </button>
                    )}
                  </div>
                  <div style={{ padding: '14px 16px' }}>
                    <div style={{ fontSize: '15px', fontWeight: 700, color: C.navy, marginBottom: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.name}</div>
                    {!isOrig && <div style={{ fontSize: '12px', color: C.textLight, marginBottom: '8px' }}>→ {item.targetBrandName} {item.targetPerfumeName}</div>}
                    {isOrig && <GenderBadge gender={item.gender} />}
                    {!isOrig && ms && (
                      <>
                        <ScoreBar label="Koku Yakınlığı" value={ms.scent} empty={ms.scent === null} />
                        <ScoreBar label="Yayılım" value={ms.projection} empty={ms.projection === null} />
                        <ScoreBar label="Kalıcılık" value={ms.longevity} empty={ms.longevity === null} />
                        {!ms.count && <div style={{ fontSize: '11px', color: C.textLight, fontStyle: 'italic', textAlign: 'center', marginBottom: '4px' }}>Henüz yorum yok</div>}
                        <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: `1px solid ${C.borderLight}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '12px', fontWeight: 700, color: scoreColor(ms.overall) }}>
                            {ms.overall !== null ? `${ms.overall}/10` : '—'}
                          </span>
                          <span style={{ fontSize: '11px', color: C.textLight }}>Genel Puan</span>
                        </div>
                      </>
                    )}
                  </div>
                </Card>
              );
            })}
            {!items.length && <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '60px', color: C.textLight }}>Seçilen filtreye uygun parfüm bulunamadı.</div>}
          </div>
        )}

        {/* List View */}
        {view === 'list' && (() => {
          const LIST_COLS = isOrig
            ? [{ key: 'name', label: 'Parfüm' }, { key: 'gender', label: 'Cinsiyet' }, { key: 'muadil', label: 'Muadil' }]
            : [{ key: 'name', label: 'Parfüm' }, { key: 'target', label: 'Hedef Parfüm' }, { key: 'scent', label: 'Koku' }, { key: 'projection', label: 'Yayılım' }, { key: 'longevity', label: 'Kalıcılık' }, { key: 'score', label: 'Genel Puan' }];

          const listItems = [...items].sort((a, b) => {
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

          return (
          <Card style={{ overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
            <table style={{ width: '100%', minWidth: '520px', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: C.bg }}>
                  {LIST_COLS.map(({ key, label }) => {
                    const sortable = key !== 'target';
                    const active = listSortKey === key;
                    const dir = active ? (listSortDir === 'asc' ? '↑' : '↓') : '↕';
                    return (
                      <th key={key} onClick={() => sortable && handleListSort(key)}
                        style={{ padding: '10px 14px', textAlign: key === 'name' || key === 'target' ? 'left' : 'center', fontSize: '11px', fontWeight: 700, color: active ? C.navy : C.textMid, textTransform: 'uppercase', letterSpacing: '.05em', borderBottom: `1px solid ${C.border}`, whiteSpace: 'nowrap', cursor: sortable ? 'pointer' : 'default', userSelect: 'none' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          {label}
                          {sortable && <span style={{ fontSize: '12px', color: active ? C.navy : C.border, fontWeight: 900 }}>{dir}</span>}
                        </span>
                      </th>
                    );
                  })}
                  {!isOrig && <th style={{ padding: '10px 14px', borderBottom: `1px solid ${C.border}` }} />}
                </tr>
              </thead>
              <tbody>
                {listItems.map((item) => {
                  const ms = !isOrig ? calcScores(item.id, comments) : null;
                  const mCount = isOrig ? (perfumeMuadilCount[item.id] || 0) : null;
                  const uid = user?.uid || user?.id;
                  const fav = !isOrig ? isMuadilFavorite(uid, item.id) : false;
                  return (
                    <tr key={item.id}
                      onClick={() => isOrig ? navigate(`/${item.brandSlug}/${item.slug}`) : navigate(`/karsilastir?orijinal=${item.targetPerfumeId}&muadil=${item.id}`)}
                      style={{ borderBottom: `1px solid ${C.borderLight}`, cursor: 'pointer', transition: 'background .1s' }}
                      onMouseEnter={(e) => e.currentTarget.style.background = C.bg}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                      {/* Parfüm adı */}
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: '#f0f0f0', overflow: 'hidden', flexShrink: 0 }}>
                            <img src={item.image || noImage} alt={item.name} onError={(e) => { e.currentTarget.src = noImage; }} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          </div>
                          <span style={{ fontWeight: 600, fontSize: '14px', color: C.navy }}>{item.name}</span>
                        </div>
                      </td>
                      {/* Orijinal: Cinsiyet | Muadil: Hedef Parfüm */}
                      {isOrig
                        ? <td style={{ padding: '12px 14px', textAlign: 'center' }}><GenderBadge gender={item.gender} /></td>
                        : <td style={{ padding: '12px 14px', fontSize: '12px', color: C.textMid }}>{item.targetBrandName} {item.targetPerfumeName}</td>
                      }
                      {/* Orijinal: Muadil sayısı | Muadil: 4 puan sütunu */}
                      {isOrig
                        ? <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                            <span style={{ display: 'inline-block', background: mCount > 0 ? C.greenBg : C.bg, color: mCount > 0 ? C.green : C.textLight, border: `1px solid ${mCount > 0 ? C.greenBorder : C.border}`, borderRadius: '20px', padding: '2px 10px', fontSize: '12px', fontWeight: 700 }}>{mCount} muadil</span>
                          </td>
                        : <>
                            <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                              <span style={{ fontWeight: 700, fontSize: '13px', color: scoreColor(ms?.scent ?? null) }}>{ms?.scent != null ? `${ms.scent}/10` : '—'}</span>
                            </td>
                            <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                              <span style={{ fontWeight: 700, fontSize: '13px', color: scoreColor(ms?.projection ?? null) }}>{ms?.projection != null ? `${ms.projection}/10` : '—'}</span>
                            </td>
                            <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                              <span style={{ fontWeight: 700, fontSize: '13px', color: scoreColor(ms?.longevity ?? null) }}>{ms?.longevity != null ? `${ms.longevity}/10` : '—'}</span>
                            </td>
                            <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                              <span style={{ fontWeight: 700, fontSize: '14px', color: scoreColor(ms?.overall ?? null) }}>{ms?.overall != null ? `${ms.overall}/10` : '—'}</span>
                            </td>
                          </>
                      }
                      {/* Favori butonu — sadece muadil */}
                      {!isOrig && (
                        <td style={{ padding: '12px 14px', textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => toggleMuadilFavorite(uid, item.id)}
                            style={{ width: '28px', height: '28px', borderRadius: '50%', border: `1px solid ${fav ? C.goldBorder : C.border}`, background: fav ? C.goldBg : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
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
            {!listItems.length && <div style={{ textAlign: 'center', padding: '60px', color: C.textLight }}>Seçilen filtreye uygun parfüm bulunamadı.</div>}
          </Card>
          );
        })()}
      </div>
    </div>
  );
}
