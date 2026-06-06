import { useState, useEffect } from 'react';
import { useRouter } from '@/contexts/RouterContext';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { useW } from '@/hooks/useW';
import { calcScores } from '@/utils/scoring';
import { containsProfanity } from '@/utils/profanity';
import { Card, Select, Btn, ScoreBar } from '@/components/ui';
import { GenderBadge } from '@/components/shared';
import { Badge } from '@/components/ui/Badge';
import { C, F, FH, FE } from '@/constants/theme';
import { useSeo } from '@/lib/seo';
import { faArrowUp, faHeart, faArrowDown, faCrown, faShield, faThumbsUp, faThumbsDown, faMagnifyingGlass, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import noImage from '@/img/no-image.jpg';

function CommentForm({ initialValues, isEditMode, isMod, sm, onSubmit, onCancel, submitError }) {
  const [cSim, setCSim] = useState(initialValues?.sim ?? 5);
  const [cProj, setCProj] = useState(initialValues?.proj ?? 5);
  const [cLon, setCLon] = useState(initialValues?.lon ?? 5);
  const [cText, setCText] = useState(initialValues?.text ?? '');
  const [cRecommend, setCRecommend] = useState(initialValues?.recommend ?? null);
  const [profanityError, setProfanityError] = useState(false);

  const submit = () => {
    if (!cText.trim()) return;
    if (containsProfanity(cText)) { setProfanityError(true); return; }
    onSubmit({ similarity: cSim, projection: cProj, longevity: cLon, text: cText, recommend: cRecommend });
  };

  return (
    <div className="fade-in" style={{ background: C.goldBg, border: `1px solid ${C.goldBorder}`, borderRadius: '12px', padding: '16px', marginBottom: '18px' }}>
      {isEditMode && <div style={{ fontSize: '13px', fontWeight: 700, color: C.gold, marginBottom: '12px' }}>Yorumunu Düzenle</div>}
      <div style={{ display: 'grid', gridTemplateColumns: sm ? '1fr' : '1fr 1fr 1fr', gap: '12px', marginBottom: '12px' }}>
        {[['Benzerlik', cSim, setCSim], ['Yayılım', cProj, setCProj], ['Kalıcılık', cLon, setCLon]].map(([l, v, sv]) => (
          <div key={l}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span style={{ fontSize: '13px', color: C.textMid }}>{l}</span>
              <span style={{ fontSize: '13px', fontWeight: 700, color: C.gold }}>{v}/10</span>
            </div>
            <input type="range" min="1" max="10" value={v} onChange={(e) => sv(Number(e.target.value))} style={{ width: '100%', accentColor: C.gold }} />
          </div>
        ))}
      </div>
      <textarea
        value={cText}
        onChange={(e) => { setCText(e.target.value); if (profanityError) setProfanityError(containsProfanity(e.target.value)); }}
        placeholder="Deneyiminizi paylaşın..."
        rows={3}
        style={{ width: '100%', border: `1px solid ${profanityError ? C.red : C.border}`, borderRadius: '8px', padding: '10px 12px', fontSize: '14px', color: C.text, background: C.card, outline: 'none', resize: 'none', marginBottom: profanityError ? '6px' : '12px', boxSizing: 'border-box', transition: 'border-color .2s' }}
      />
      {profanityError && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '8px 12px', marginBottom: '12px', fontSize: '13px', color: C.red, fontWeight: 600 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          Hakaret veya uygunsuz ifade içeren yorumlar yapılamaz.
        </div>
      )}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
        <span style={{ fontSize: '13px', color: C.textMid, fontWeight: 600 }}>Bu muadili tavsiye eder misiniz?</span>
        <button onClick={() => setCRecommend(cRecommend === true ? null : true)}
          style={{ width: '38px', height: '38px', borderRadius: '50%', border: `2px solid ${cRecommend === true ? C.green : C.border}`, background: cRecommend === true ? C.greenBg : '#fff', color: cRecommend === true ? C.green : C.textLight, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all .15s', flexShrink: 0 }}>
          <FontAwesomeIcon icon={faThumbsUp} style={{ fontSize: '15px' }} />
        </button>
        <button onClick={() => setCRecommend(cRecommend === false ? null : false)}
          style={{ width: '38px', height: '38px', borderRadius: '50%', border: `2px solid ${cRecommend === false ? C.red : C.border}`, background: cRecommend === false ? C.redBg : '#fff', color: cRecommend === false ? C.red : C.textLight, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all .15s', flexShrink: 0 }}>
          <FontAwesomeIcon icon={faThumbsDown} style={{ fontSize: '15px' }} />
        </button>
      </div>
      <div style={{ fontSize: '12px', color: C.textMid, background: C.blueBg, border: '1px solid #bfdbfe', borderRadius: '8px', padding: '8px 12px', marginBottom: '8px' }}>
        Verdiğiniz puanlar parfümün genel puan ortalamasına etki edecektir.
      </div>
      {!isMod && !isAdmin && <div style={{ fontSize: '12px', color: C.orange, marginBottom: '8px' }}>Bu yorum moderatör onayından sonra yayınlanacak.</div>}
      {submitError && <div style={{ fontSize: '13px', color: C.red, background: '#fff5f5', border: '1px solid #fecaca', borderRadius: '8px', padding: '8px 12px', marginBottom: '8px' }}>{submitError}</div>}
      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
        <Btn variant="secondary" size="sm" onClick={onCancel}>İptal</Btn>
        <Btn size="sm" onClick={submit} disabled={!cText.trim() || profanityError}>{isEditMode ? 'Güncelle' : 'Gönder'}</Btn>
      </div>
    </div>
  );
}

export function ComparisonPage({ queryParams }) {
  useSeo({
    title: 'Karşılaştır',
    description: 'Orijinal parfüm ile muadilini yan yana karşılaştır; koku benzerliği, kalıcılık ve yayılım puanlarını topluluk yorumlarıyla incele.',
  });
  const { navigate } = useRouter();
  const { perfumes, muadilPerfumes, brands, comments, users, addComment, updateComment, deleteComment, toggleCompFavorite, isCompFavorite, toggleMuadilFavorite, isMuadilFavorite, incrementCompareCount, toggleMuadilRecommend, getMuadilRecommendStatus } = useData();
  const { user, isMod, isAdmin } = useAuth();
  const { w, sm, md, xs } = useW();

  const initOrigId    = queryParams?.orijinal || '';
  const initMuadilId  = queryParams?.muadil   || '';
  const [selOrigBrand,   setSelOrigBrand]   = useState('');
  const [selOrigId,      setSelOrigId]      = useState(initOrigId);
  const [selMuadilBrand, setSelMuadilBrand] = useState('');
  const [selMuadilId,    setSelMuadilId]    = useState(initMuadilId);

  // Data geç yüklenince (refresh) brand seçimini otomatik doldur
  useEffect(() => {
    if (!selOrigBrand && selOrigId && perfumes.length > 0) {
      const p = perfumes.find((p) => String(p.id) === String(selOrigId));
      if (p) setSelOrigBrand(p.brandName);
    }
  }, [perfumes, selOrigId]);

  useEffect(() => {
    if (!selMuadilBrand && selMuadilId && muadilPerfumes.length > 0) {
      const m = muadilPerfumes.find((m) => String(m.id) === String(selMuadilId));
      if (m) setSelMuadilBrand(m.brandName);
    }
  }, [muadilPerfumes, selMuadilId]);
  const [muadilSortDir, setMuadilSortDir] = useState('desc');
  const [showCForm, setShowCForm] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editInitials, setEditInitials] = useState(null);
  const [submitError, setSubmitError] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [showScoreInfo, setShowScoreInfo] = useState(false);


  const origBrands = [...new Set(perfumes.map((p) => p.brandName))].sort((a, b) => a.localeCompare(b, 'tr'));
  const origFiltered = selOrigBrand ? perfumes.filter((p) => p.brandName === selOrigBrand) : perfumes;
  const selOrig = perfumes.find((p) => String(p.id) === String(selOrigId));

  const matching = selOrig ? muadilPerfumes.filter((m) => String(m.targetPerfumeId) === String(selOrig.id)) : [];
  const mBrands = [...new Set(matching.map((m) => m.brandName))];
  const mFiltered = selMuadilBrand ? matching.filter((m) => m.brandName === selMuadilBrand) : matching;
  // selMuadil yalnızca seçili orijinale ait muadiller arasında aranır
  const selMuadil = selMuadilId ? matching.find((m) => String(m.id) === String(selMuadilId)) : undefined;
  const muadilBrand = selMuadil ? brands.find((b) => b.slug === selMuadil.brandSlug || String(b.id) === String(selMuadil.brandId)) : null;
  const origBrand   = selOrig   ? brands.find((b) => b.slug === selOrig.brandSlug   || String(b.id) === String(selOrig.brandId))   : null;

  const muadilComments = selMuadil
    ? comments.filter((c) => c.muadilPerfumeId === selMuadil.id && (isMod || c.status === 'approved' || c.status === 'pending_update' || (c.status === 'pending' && c.userId === user?.uid)))
    : [];
  const userReview = selMuadil && user
    ? comments.find((c) => c.muadilPerfumeId === selMuadil.id && c.userId === user.uid)
    : null;
  const scores = selMuadil ? calcScores(selMuadil.id, comments) : { scent: null, projection: null, longevity: null, overall: null, count: 0 };

  // Tavsiye sayıları: onaylanmış yorumlardan hesapla
  const approvedMuadilComments = selMuadil
    ? comments.filter((c) => c.muadilPerfumeId === selMuadil.id && c.status === 'approved')
    : [];
  const recCount = approvedMuadilComments.filter((c) => c.recommend === true).length;
  const notRecCount = approvedMuadilComments.filter((c) => c.recommend === false).length;

  const submitC = async (data) => {
    if (!user || !selMuadil) return;
    setSubmitError('');
    try {
      if (isEditMode && userReview) {
        await updateComment(userReview.id, data);
      } else {
        await addComment({ muadilPerfumeId: selMuadil.id, ...data, status: isMod ? 'approved' : 'pending' });
      }
      setShowCForm(false); setIsEditMode(false); setEditInitials(null);
    } catch (e) {
      if (e.code === 'rate-limited') setSubmitError(e.message);
    }
  };

  const openEditForm = () => {
    if (!userReview) return;
    setEditInitials({
      sim: userReview.similarity ?? 5,
      proj: userReview.projection ?? 5,
      lon: userReview.longevity ?? 5,
      text: userReview.pendingUpdate?.text ?? userReview.text ?? '',
      recommend: userReview.recommend ?? null,
    });
    setIsEditMode(true);
    setShowCForm(true);
  };

  const origBrandOpts = [{ value: '', label: 'Orijinal Marka Seçin' }, ...origBrands.map((b) => ({ value: b, label: b }))];
  const origPerfOpts = [{ value: '', label: 'Orijinal Parfüm Seçin' }, ...origFiltered.map((p) => ({ value: String(p.id), label: p.name }))];
  const mBrandOpts = [{ value: '', label: 'Muadil Marka Seçin' }, ...mBrands.map((b) => ({ value: b, label: b }))];
  const mPerfOpts = [{ value: '', label: 'Muadil Parfüm Seçin' }, ...mFiltered.map((m) => ({ value: String(m.id), label: m.name }))];

  return (
    <div style={{ minHeight: '100vh', background: C.bg, padding: xs ? '16px' : sm ? '20px 16px' : '32px' }}>
      <div style={{ maxWidth: '1320px', margin: '0 auto' }}>
        <h1 style={{ fontSize: sm ? '22px' : '26px', fontWeight: 900, color: C.navy, marginBottom: '6px' }}>Parfüm Karşılaştır</h1>
        <p style={{ color: C.textLight, fontSize: '14px', marginBottom: '24px' }}>Orijinal parfümü ve muadilini seçerek karşılaştırın</p>

        {/* Selectors */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '8px', minHeight: '30px' }}>
          {(selOrigBrand || selOrigId || selMuadilBrand || selMuadilId) && (
            <button
              onClick={() => { setSelOrigBrand(''); setSelOrigId(''); setSelMuadilBrand(''); setSelMuadilId(''); }}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '7px 14px', borderRadius: '8px', border: `1px solid ${C.border}`, background: C.card, color: C.textMid, fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: F, transition: 'all .15s', whiteSpace: 'nowrap' }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = C.red; e.currentTarget.style.color = C.red; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.textMid; }}>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="1" y1="1" x2="11" y2="11"/><line x1="11" y1="1" x2="1" y2="11"/></svg>
              Temizle
            </button>
          )}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: sm ? '1fr' : '1fr 1fr', gap: '14px', marginBottom: '22px' }}>
          <Card style={{ padding: '20px' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: C.textLight, letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: '12px' }}>Orijinal Parfüm</div>
            <div style={{ display: 'flex', gap: '10px', flexDirection: sm ? 'column' : 'row' }}>
              <div style={{ flex: 1 }}><Select label="Marka" value={selOrigBrand} onChange={(e) => { setSelOrigBrand(e.target.value); setSelOrigId(''); setSelMuadilBrand(''); setSelMuadilId(''); }} options={origBrandOpts} /></div>
              <div style={{ flex: 1 }}><Select label="Ürün" value={selOrigId} onChange={(e) => { const id = e.target.value; setSelOrigId(id); if (id) { const p = perfumes.find((p) => String(p.id) === String(id)); if (p) setSelOrigBrand(p.brandName); } setSelMuadilBrand(''); setSelMuadilId(''); }} options={origPerfOpts} /></div>
            </div>
          </Card>
          <Card style={{ padding: '20px' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: C.textLight, letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: '12px' }}>Muadil Parfüm</div>
            <div style={{ display: 'flex', gap: '10px', flexDirection: sm ? 'column' : 'row' }}>
              <div style={{ flex: 1 }}><Select label="Marka" value={selMuadilBrand} onChange={(e) => { setSelMuadilBrand(e.target.value); setSelMuadilId(''); }} options={mBrandOpts} /></div>
              <div style={{ flex: 1 }}><Select label="Ürün" value={selMuadilId} onChange={(e) => { const id = e.target.value; setSelMuadilId(id); if (id) { const m = muadilPerfumes.find((m) => String(m.id) === String(id)); if (m) setSelMuadilBrand(m.brandName); if (selOrigId && id) window.history.replaceState(null, '', `/karsilastir?orijinal=${selOrigId}&muadil=${id}`); } }} options={mPerfOpts} disabled={!selMuadilBrand} /></div>
            </div>
          </Card>
        </div>

        {selOrig && selMuadil ? (
          <div className="fade-in">
            {/* Top cards */}
            <div style={{ display: 'grid', gridTemplateColumns: sm ? '1fr 1fr' : md ? '1fr 1fr' : '1fr 1fr 1.4fr', gap: sm ? '8px' : '14px', marginBottom: '14px' }}>
              {/* ── Orijinal Parfüm Kartı ── */}
              {(() => {
                const FI = "'Inter', 'DM Sans', sans-serif";
                const badgeStyle = { display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '3px 9px', borderRadius: '20px', fontSize: '10px', fontWeight: 600, fontFamily: FI, letterSpacing: '.08em', textTransform: 'uppercase', background: '#EDE9E0', color: C.textMid, border: '1px solid #DDD8CE' };
                return (
                  <div style={{ borderRadius: '18px', overflow: 'hidden', background: '#F5F2EC', border: '1px solid #E8E3D8', boxShadow: '0 2px 16px rgba(0,0,0,.07)', display: 'flex', flexDirection: 'column' }}>
                    {/* Görsel */}
                    <div style={{ width: '100%', overflow: 'hidden' }}>
                      <img src={selOrig.image || noImage} alt={selOrig.name} onError={(e) => { e.currentTarget.src = noImage; }} style={{ width: '100%', display: 'block' }} />
                    </div>
                    {/* İçerik */}
                    <div style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '50px', height: '50px', borderRadius: '10px', background: '#EDE9E0', border: '1px solid #DDD8CE', overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {origBrand?.logoImage
                          ? <img src={origBrand.logoImage} alt={origBrand.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          : <span style={{ fontSize: '10px', fontWeight: 700, color: C.textMid, fontFamily: FI, letterSpacing: '.04em', textTransform: 'uppercase' }}>{origBrand?.logo || selOrig.brandName?.slice(0,2)}</span>
                        }
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <a href={`/marka/${selOrig.brandSlug}`} onClick={(e) => { if (e.button !== 0 || e.ctrlKey || e.metaKey || e.shiftKey) return; e.preventDefault(); navigate(`/marka/${selOrig.brandSlug}`); }} style={{ fontFamily: FI, fontWeight: 700, fontSize: '13px', color: C.text, textDecoration: 'none', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: '2px' }} onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'} onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}>{selOrig.brandName}</a>
                        <div style={{ fontFamily: FI, fontWeight: 300, fontSize: '12px', color: C.textMid, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: '5px' }}>{selOrig.name}</div>
                        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                          <div style={badgeStyle}><p style={{ margin: 0, padding: 0, width: 'max-content' }}>Orijinal</p></div>
                          {selOrig.gender && <div style={badgeStyle}><p style={{ margin: 0, padding: 0, width: 'max-content' }}>{selOrig.gender}</p></div>}
                          {selOrig.year && <div style={badgeStyle}><p style={{ margin: 0, padding: 0, width: 'max-content' }}>{selOrig.year}</p></div>}
                        </div>
                      </div>
                      <div style={{ position: 'relative', flexShrink: 0 }} onMouseEnter={e => { const t = e.currentTarget.querySelector('[data-tip]'); if (t) t.style.opacity = '1'; }} onMouseLeave={e => { const t = e.currentTarget.querySelector('[data-tip]'); if (t) t.style.opacity = '0'; }}>
                        <button onClick={() => navigate(`/${selOrig.brandSlug}/${selOrig.slug}`)} style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#fff', border: '1px solid #DDD8CE', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 1px 4px rgba(0,0,0,.08)', transition: 'box-shadow .15s' }} onMouseEnter={e => e.currentTarget.style.boxShadow = '0 3px 10px rgba(0,0,0,.14)'} onMouseLeave={e => e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,.08)'}>
                          <FontAwesomeIcon icon={faChevronRight} style={{ fontSize: '12px', color: C.textMid }} />
                        </button>
                        <div data-tip="" style={{ position: 'absolute', bottom: 'calc(100% + 8px)', right: 0, background: '#1a1a1a', color: '#fff', fontSize: '11px', fontFamily: FI, fontWeight: 500, padding: '5px 10px', borderRadius: '8px', whiteSpace: 'nowrap', opacity: 0, transition: 'opacity .15s', pointerEvents: 'none', zIndex: 10 }}>Parfüm profiline git</div>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* ── Muadil Parfüm Kartı ── */}
              {(() => {
                const FI = "'Inter', 'DM Sans', sans-serif";
                const badgeStyle = { display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '3px 9px', borderRadius: '20px', fontSize: '10px', fontWeight: 600, fontFamily: FI, letterSpacing: '.08em', textTransform: 'uppercase', background: '#EDE9E0', color: C.textMid, border: '1px solid #DDD8CE' };
                return (
                  <div style={{ borderRadius: '18px', overflow: 'hidden', background: '#F5F2EC', border: '1px solid #E8E3D8', boxShadow: '0 2px 16px rgba(0,0,0,.07)', display: 'flex', flexDirection: 'column' }}>
                    {/* Görsel + favori butonu */}
                    <div style={{ position: 'relative', width: '100%', overflow: 'hidden' }}>
                      <img src={selMuadil.image || noImage} alt={selMuadil.name} onError={(e) => { e.currentTarget.src = noImage; }} style={{ width: '100%', display: 'block' }} />
                      <button onClick={() => { if (user?.uid) toggleMuadilFavorite(user.uid, selMuadil.id); }} style={{ position: 'absolute', top: '10px', right: '10px', background: 'rgba(255,255,255,.85)', border: '1px solid rgba(0,0,0,.08)', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', backdropFilter: 'blur(4px)', transition: 'all .15s' }}>
                        <FontAwesomeIcon icon={faHeart} style={{ fontSize: '13px', color: isMuadilFavorite(user?.uid, selMuadil.id) ? '#f87171' : '#ccc' }} />
                      </button>
                    </div>
                    {/* İçerik */}
                    <div style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '50px', height: '50px', borderRadius: '10px', background: '#EDE9E0', border: '1px solid #DDD8CE', overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {muadilBrand?.logoImage
                          ? <img src={muadilBrand.logoImage} alt={muadilBrand.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          : <span style={{ fontSize: '10px', fontWeight: 700, color: C.textMid, fontFamily: FI, letterSpacing: '.04em', textTransform: 'uppercase' }}>{muadilBrand?.logo || selMuadil.brandName?.slice(0,2)}</span>
                        }
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <a href={`/marka/${selMuadil.brandSlug}`} onClick={(e) => { if (e.button !== 0 || e.ctrlKey || e.metaKey || e.shiftKey) return; e.preventDefault(); navigate(`/marka/${selMuadil.brandSlug}`); }} style={{ fontFamily: FI, fontWeight: 700, fontSize: '13px', color: C.text, textDecoration: 'none', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: '2px' }} onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'} onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}>{selMuadil.brandName}</a>
                        <div style={{ fontFamily: FI, fontWeight: 300, fontSize: '12px', color: C.textMid, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: '5px' }}>{selMuadil.name}</div>
                        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                          <div style={badgeStyle}><p style={{ margin: 0, padding: 0, width: 'max-content' }}>Muadil</p></div>
                          {(selMuadil.gender || selOrig.gender) && <div style={badgeStyle}><p style={{ margin: 0, padding: 0, width: 'max-content' }}>{selMuadil.gender || selOrig.gender}</p></div>}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}
              <Card style={{ padding: sm ? '14px' : '24px', position: 'relative', gridColumn: sm ? '1 / -1' : md ? '1 / -1' : 'auto' }}>
                <button onClick={() => { if (selOrig && selMuadil) toggleCompFavorite(user?.uid, selOrig.id, selMuadil.id); }}
                  style={{ position: 'absolute', top: '14px', right: '14px', background: isCompFavorite(user?.uid, selOrig?.id, selMuadil?.id) ? C.redBg : '#f5f5f5', border: `1px solid ${isCompFavorite(user?.uid, selOrig?.id, selMuadil?.id) ? C.redBorder : C.border}`, borderRadius: '10px', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '18px' }}>
                  {isCompFavorite(user?.uid, selOrig?.id, selMuadil?.id) ? '❤️' : '🤍'}
                </button>
                <div style={{ fontSize: sm ? '12px' : '13px', fontWeight: 700, color: C.textMid, marginBottom: '8px', paddingRight: '40px', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                  <span>{selOrig.brandName} <span style={{ color: C.textLight, fontWeight: 400 }}>-</span> {selOrig.name}</span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '22px', height: '22px', borderRadius: '50%', background: `linear-gradient(135deg,${C.gold},${C.goldLight})`, color: '#fff', fontSize: '9px', fontWeight: 900, flexShrink: 0, boxShadow: `0 2px 6px rgba(184,150,90,.4)` }}>VS</span>
                  <span>{selMuadil.brandName} <span style={{ color: C.textLight, fontWeight: 400 }}>-</span> {selMuadil.name}</span>
                </div>
                <div style={{ marginBottom: '3px' }}><span style={{ fontSize: sm ? '12px' : '13px', color: C.textLight }}>Muadil markası: </span><span style={{ fontWeight: 700, color: C.text, fontSize: sm ? '12px' : '13px' }}>{selMuadil.brandName}</span></div>
                <div style={{ marginBottom: sm ? '8px' : '14px' }}><span style={{ fontSize: sm ? '12px' : '13px', color: C.textLight }}>Muadil Parfüm: </span><span style={{ fontWeight: 700, color: C.text, fontSize: sm ? '12px' : '13px' }}>{selMuadil.name}</span></div>
                <div style={{ height: '1px', background: C.border, marginBottom: '14px' }} />
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '8px', position: 'relative' }}>
                  <button
                    onMouseEnter={() => setShowScoreInfo(true)}
                    onMouseLeave={() => setShowScoreInfo(false)}
                    style={{ width: '20px', height: '20px', borderRadius: '50%', border: `1px solid ${C.border}`, background: '#f4f4f6', color: C.textLight, fontSize: '12px', fontWeight: 700, cursor: 'default', fontFamily: F, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
                  >?</button>
                  {showScoreInfo && (
                    <div style={{ position: 'absolute', top: '26px', right: 0, width: '240px', background: C.card, border: `1px solid ${C.border}`, borderRadius: '12px', padding: '14px', boxShadow: '0 8px 24px rgba(0,0,0,.1)', zIndex: 10, fontSize: '12px', color: C.text, lineHeight: 1.6 }}>
                      <div style={{ fontWeight: 700, color: C.navy, marginBottom: '8px', fontSize: '13px' }}>Puanlar Nasıl Hesaplanır?</div>
                      <div style={{ marginBottom: '6px' }}><span style={{ fontWeight: 600, color: C.textMid }}>Koku Yakınlığı:</span> Kullanıcıların orijinal kokuya benzerlik oylarının ortalaması.</div>
                      <div style={{ marginBottom: '6px' }}><span style={{ fontWeight: 600, color: C.textMid }}>Yayılım:</span> Parfümün çevreye ne kadar yayıldığına verilen oyların ortalaması.</div>
                      <div style={{ marginBottom: '8px' }}><span style={{ fontWeight: 600, color: C.textMid }}>Kalıcılık:</span> Kokunun üstte ne kadar süre kaldığına verilen oyların ortalaması.</div>
                      <div style={{ paddingTop: '8px', borderTop: `1px solid ${C.borderLight}` }}><span style={{ fontWeight: 600, color: C.gold }}>Genel Puan:</span> Koku yakınlığı, yayılım ve kalıcılığın eşit ağırlıklı ortalamasıdır (0–10).</div>
                    </div>
                  )}
                </div>
                <ScoreBar label="Koku Yakınlığı" value={scores.scent} empty={scores.scent === null} />
                <ScoreBar label="Yayılım" value={scores.projection} empty={scores.projection === null} />
                <ScoreBar label="Kalıcılık" value={scores.longevity} empty={scores.longevity === null} />
                {scores.count === 0 && <div style={{ fontSize: '12px', color: C.textLight, fontStyle: 'italic', textAlign: 'center', marginBottom: '8px' }}>Henüz onaylanmış yorum yok</div>}
                <div style={{ marginTop: sm ? '8px' : '14px', padding: sm ? '10px 12px' : '14px', background: C.goldBg, borderRadius: '10px', border: `1px solid ${C.goldBorder}` }}>
                  {/* Genel Puan başlık + pill badge */}
                  {(() => {
                    const s = scores.overall;
                    const grad = s === null ? '#ccc, #ccc'
                      : s <= 3  ? '#e53e3e, #f87171'
                      : s <= 5  ? '#e53e3e, #f6ad55'
                      : s <= 7  ? '#f6ad55, #68d391'
                      :           '#48bb78, #38a169';
                    const textColor = s === null ? C.textLight : s <= 4 ? C.red : s < 7 ? '#f6ad55' : C.green;
                    return (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                        <div>
                          <div style={{ fontSize: '12px', color: C.textLight, fontWeight: 600, marginBottom: '2px' }}>Genel Puan</div>
                          {scores.count > 0 && <div style={{ fontSize: '11px', color: C.textLight }}>{scores.count} yorumun ortalaması</div>}
                        </div>
                        {/* Gradient border pill */}
                        <div style={{ background: `linear-gradient(135deg, ${grad})`, padding: '2px', borderRadius: '999px', flexShrink: 0 }}>
                          <div style={{ background: '#fff', borderRadius: '999px', padding: '5px 14px', display: 'flex', alignItems: 'baseline', gap: '1px' }}>
                            <span style={{ fontSize: '18px', fontWeight: 900, color: textColor, lineHeight: 1 }}>{s !== null ? s : '—'}</span>
                            {s !== null && <span style={{ fontSize: '11px', fontWeight: 600, color: C.textLight }}>/10</span>}
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                  {/* Progress bar */}
                  <div style={{ position: 'relative', height: sm ? '6px' : '8px', background: 'linear-gradient(90deg, #e53e3e 0%, #f6ad55 50%, #38a169 100%)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', top: 0, right: 0, height: '100%', width: scores.overall !== null ? `${100 - (scores.overall / 10) * 100}%` : '100%', background: C.borderLight, transition: 'width .4s' }} />
                  </div>
                </div>
              </Card>
            </div>

            {/* Notes + Other muadils */}
            <div style={{ display: 'grid', gridTemplateColumns: sm ? '1fr' : '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
              <Card style={{ padding: '22px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                <div style={{ fontWeight: 700, fontSize: '15px', color: C.navy, marginBottom: '14px', paddingBottom: '12px', borderBottom: `1px solid ${C.border}`, width: '100%', textAlign: 'center' }}>{selOrig.name}</div>
                <div style={{ fontSize: '12px', color: C.textLight, marginBottom: '10px' }}>Koku Notaları</div>
                {[['Üst', faArrowUp, selOrig.notes?.top || []], ['Kalp', faHeart, selOrig.notes?.heart || []], ['Alt', faArrowDown, selOrig.notes?.base || []]].map(([l, icon, n]) => (
                  <div key={l} style={{ marginBottom: '8px', width: '100%' }}>
                    <div style={{ fontSize: '12px', fontWeight: 600, color: C.textMid, marginBottom: '3px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}><FontAwesomeIcon icon={icon} style={{ fontSize: '10px' }} />{l}</div>
                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', justifyContent: 'center' }}>
                      {n.map((note) => <span key={note} style={{ background: C.goldBg, border: `1px solid ${C.goldBorder}`, borderRadius: '6px', padding: '2px 8px', fontSize: '12px', color: C.gold }}>{note}</span>)}
                    </div>
                  </div>
                ))}
              </Card>

              <Card style={{ padding: '22px' }}>
                <div style={{ fontWeight: 700, fontSize: '15px', color: C.green, marginBottom: '14px', paddingBottom: '12px', borderBottom: `1px solid ${C.border}` }}>{selMuadil.name}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: C.textLight }}>DİĞER MUADİLLER</span>
                  <button onClick={() => setMuadilSortDir((d) => d === 'desc' ? 'asc' : 'desc')}
                    style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 600, color: C.textMid, background: '#f4f4f6', border: `1px solid ${C.border}`, borderRadius: '6px', padding: '3px 8px', cursor: 'pointer', fontFamily: F }}>
                    Puan {muadilSortDir === 'desc' ? '↓' : '↑'}
                  </button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '250px', overflowY: 'auto', paddingRight: '2px' }}>
                  {[...matching]
                    .map((m) => ({ m, ms: calcScores(m.id, comments) }))
                    .sort((a, b) => {
                      const av = a.ms.overall ?? -1;
                      const bv = b.ms.overall ?? -1;
                      return muadilSortDir === 'desc' ? bv - av : av - bv;
                    })
                    .map(({ m, ms }) => {
                      const isSel = m.id === selMuadil.id;
                      return (
                        <button key={m.id} onClick={() => {
                              const newId = String(m.id);
                              setSelMuadilId(newId);
                              setSelMuadilBrand(m.brandName);
                              window.history.replaceState(null, '', `/karsilastir?orijinal=${selOrigId}&muadil=${newId}`);
                            }}
                          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', border: `1px solid ${isSel ? C.goldBorder : C.border}`, borderRadius: '10px', background: isSel ? C.goldBg : 'transparent', cursor: 'pointer', textAlign: 'left', fontFamily: F, transition: 'all .15s' }}
                          onMouseEnter={(e) => { if (!isSel) e.currentTarget.style.background = C.borderLight; }}
                          onMouseLeave={(e) => { if (!isSel) e.currentTarget.style.background = 'transparent'; }}>
                          <div style={{ fontSize: '13px', fontWeight: 600, color: isSel ? C.gold : C.text }}>{m.brandName} — {m.name}</div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                            <span style={{ fontSize: '12px', fontWeight: 700, color: ms.overall !== null ? C.gold : C.textLight }}>
                              {ms.overall !== null ? `${ms.overall}/10` : '—'}
                            </span>
                            {isSel && <span style={{ fontSize: '11px', color: C.gold, fontWeight: 400 }}>seçilen</span>}
                          </div>
                        </button>
                      );
                    })}
                </div>
              </Card>
            </div>

            {/* Stats panel */}
            <Card style={{ padding: sm ? '16px' : '22px', marginBottom: '14px' }}>
              <div style={{ fontWeight: 700, fontSize: '15px', color: C.navy, marginBottom: '14px', paddingBottom: '10px', borderBottom: `1px solid ${C.border}` }}>
                Muadil İstatistikleri
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: xs ? '1fr 1fr' : 'repeat(4,1fr)', gap: sm ? '10px' : '14px' }}>
                {[
                  { icon: faMagnifyingGlass, value: approvedMuadilComments.length, label: 'kullanıcı karşılaştırdı', bg: C.blueBg, border: '#bfdbfe', iconBg: '#dbeafe', color: C.blue },
                  { icon: faHeart,           value: selMuadil.likes ?? 0,           label: 'favoriye ekledi',       bg: C.goldBg, border: C.goldBorder, iconBg: 'rgba(184,150,90,.15)', color: C.gold },
                  { icon: faThumbsUp,        value: recCount,                        label: 'tavsiye ediyor',        bg: C.greenBg, border: C.greenBorder, iconBg: '#dcfce7', color: C.green },
                  { icon: faThumbsDown,      value: notRecCount,                     label: 'tavsiye etmiyor',       bg: C.redBg, border: C.redBorder, iconBg: '#fee2e2', color: C.red },
                ].map(({ icon, value, label, bg, border, iconBg, color }) => (
                  <div key={label} style={{ background: bg, border: `1px solid ${border}`, borderRadius: '12px', padding: sm ? '12px' : '14px 16px', display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <FontAwesomeIcon icon={icon} style={{ fontSize: '17px', color }} />
                    </div>
                    <div>
                      <div style={{ fontSize: sm ? '20px' : '22px', fontWeight: 900, color, lineHeight: 1.1 }}>{value.toLocaleString('tr-TR')}</div>
                      <div style={{ fontSize: '11px', color: C.textMid, fontWeight: 600, marginTop: '2px' }}>{label}</div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Comments */}
            <Card style={{ padding: '22px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', paddingBottom: '14px', borderBottom: `1px solid ${C.border}` }}>
                <span style={{ fontWeight: 700, fontSize: '16px', color: C.navy }}>Yorumlar ({muadilComments.length})</span>
                {user && !showCForm && !userReview && <Btn size="sm" variant="ghost" onClick={() => setShowCForm(true)}>+ Yorum Ekle</Btn>}
                {user && !showCForm && userReview && <Btn size="sm" variant="ghost" onClick={openEditForm}>Yorumunu Düzenle</Btn>}
              </div>

              {showCForm && (
                <CommentForm
                  key={isEditMode ? 'edit' : 'new'}
                  initialValues={editInitials}
                  isEditMode={isEditMode}
                  isMod={isMod}
                  sm={sm}
                  submitError={submitError}
                  onSubmit={submitC}
                  onCancel={() => { setShowCForm(false); setIsEditMode(false); setEditInitials(null); }}
                />
              )}

              {!user && (
                <div style={{ textAlign: 'center', padding: '14px', background: '#f9f9fb', borderRadius: '10px', marginBottom: '16px' }}>
                  <div style={{ fontSize: '13px', color: C.textMid, marginBottom: '8px' }}>Yorum yapmak için giriş yapın</div>
                  <Btn size="sm" onClick={() => navigate('/giris')}>Giriş Yap</Btn>
                </div>
              )}

              {muadilComments.length === 0 && <div style={{ textAlign: 'center', color: C.textLight, fontSize: '14px', padding: '32px' }}>Henüz yorum yok.</div>}
              <div style={{ display: 'grid', gridTemplateColumns: sm ? '1fr' : 'repeat(auto-fill,minmax(340px,1fr))', gap: '12px' }}>
                {muadilComments.map((c) => {
                  const isDeleted = c.userId === 'deleted';
                  const commentUser = isDeleted ? null : users.find((u) => u.uid === c.userId);
                  const liveRole = commentUser?.role || c.userRole;
                  const isAdmin = liveRole === 'admin';
                  const isModerator = liveRole === 'moderator';
                  const liveName = isDeleted
                    ? 'Silinmiş Kullanıcı'
                    : isModerator
                      ? '@moderatör'
                      : commentUser
                        ? (commentUser.username ? `@${commentUser.username}` : commentUser.name)
                        : c.userName;
                  const livePhoto = isDeleted ? null : (commentUser?.photoURL || c.userPhotoURL || null);
                  const liveAvatar = isDeleted ? '×' : (commentUser?.avatar || c.userAvatar);
                  const avatarBg = isDeleted
                    ? '#e2e8f0'
                    : isAdmin
                    ? 'linear-gradient(135deg,#1a1205,#3d2b0e)'
                    : isModerator
                    ? 'linear-gradient(135deg,#3730a3,#6d28d9)'
                    : `linear-gradient(135deg,${C.gold},${C.goldLight})`;
                  return (
                    <div key={c.id} style={{
                      border: `1px solid ${isAdmin ? C.goldBorder : isModerator ? '#c4b5fd' : c.status === 'pending' ? C.goldBorder : C.border}`,
                      borderRadius: '12px', padding: '14px 16px',
                      background: isAdmin ? '#fffdf5' : isModerator ? '#faf5ff' : c.status === 'pending' ? C.goldBg : C.card,
                      position: 'relative', overflow: 'hidden',
                    }}>
                      {/* Admin şerit */}
                      {isAdmin && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: `linear-gradient(90deg,${C.gold},${C.goldLight},${C.gold})` }} />}
                      {isModerator && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: 'linear-gradient(90deg,#6d28d9,#a78bfa,#6d28d9)' }} />}
                      <div style={{ display: 'flex', gap: '10px', marginBottom: '8px' }}>
                        <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: avatarBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', color: '#fff', fontWeight: 700, flexShrink: 0, boxShadow: isAdmin ? `0 0 0 2px ${C.gold}` : isModerator ? '0 0 0 2px #a78bfa' : 'none', overflow: 'hidden' }}>
                          {livePhoto
                            ? <img src={livePhoto} alt={liveName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                            : isAdmin ? <FontAwesomeIcon icon={faCrown} style={{ fontSize: '14px' }} /> : liveAvatar
                          }
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '4px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                              {isAdmin ? (
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', background: 'linear-gradient(135deg,#1a1205,#3d2b0e)', border: `1px solid ${C.gold}`, borderRadius: '6px', padding: '2px 9px', fontSize: '12px', fontWeight: 800, color: C.goldLight }}>
                                  <FontAwesomeIcon icon={faCrown} style={{ fontSize: '10px' }} />{liveName}
                                </span>
                              ) : isModerator ? (
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', background: '#ede9fe', border: '1px solid #a78bfa', borderRadius: '6px', padding: '2px 9px', fontSize: '12px', fontWeight: 700, color: '#5b21b6' }}>
                                  <FontAwesomeIcon icon={faShield} style={{ fontSize: '10px' }} />{liveName}
                                </span>
                              ) : isDeleted ? (
                                <span style={{ fontSize: '13px', color: C.textLight, fontStyle: 'italic' }}>{liveName}</span>
                              ) : commentUser?.username ? (
                                <a href={`/@${commentUser.username}`}
                                  onClick={(e) => { e.preventDefault(); navigate(`/@${commentUser.username}`); }}
                                  style={{ fontWeight: 700, fontSize: '13px', color: C.text, textDecoration: 'none', cursor: 'pointer', transition: 'color 0.15s' }}
                                  onMouseEnter={e => e.currentTarget.style.color = C.gold}
                                  onMouseLeave={e => e.currentTarget.style.color = C.text}
                                >{liveName}</a>
                              ) : (
                                <span style={{ fontWeight: 700, fontSize: '13px', color: C.text }}>{liveName}</span>
                              )}
                            </div>
                            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                              {c.status === 'pending' && <Badge color="orange">Bekliyor</Badge>}
                              {c.status === 'pending_update' && <Badge color="orange">Güncelleme Bekliyor</Badge>}
                              <span style={{ fontSize: '11px', color: C.textLight }}>{c.createdAt?.toDate?.()?.toLocaleDateString('tr-TR') || c.date || ''}</span>
                              {!isDeleted && user?.uid === c.userId && (
                                confirmDeleteId === c.id
                                  ? <span style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                                      <button onClick={async () => { await deleteComment(c.id); setConfirmDeleteId(null); }}
                                        style={{ fontSize: '11px', fontWeight: 700, color: '#fff', background: '#e53e3e', border: 'none', borderRadius: '5px', padding: '2px 8px', cursor: 'pointer', fontFamily: F }}>Sil</button>
                                      <button onClick={() => setConfirmDeleteId(null)}
                                        style={{ fontSize: '11px', color: C.textMid, background: '#f0f0f0', border: 'none', borderRadius: '5px', padding: '2px 8px', cursor: 'pointer', fontFamily: F }}>Vazgeç</button>
                                    </span>
                                  : <button onClick={() => setConfirmDeleteId(c.id)}
                                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', color: C.textLight, display: 'flex', alignItems: 'center', opacity: 0.6 }}
                                      title="Yorumu sil">
                                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                                    </button>
                              )}
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: '10px', marginTop: '3px', fontSize: '12px', color: C.textMid, flexWrap: 'wrap', alignItems: 'center' }}>
                            <span>Benzerlik <strong style={{ color: C.gold }}>{c.similarity}/10</strong></span>
                            <span>Yayılım <strong style={{ color: C.gold }}>{c.projection}/10</strong></span>
                            <span>Kalıcılık <strong style={{ color: C.gold }}>{c.longevity}/10</strong></span>
                            <span style={{ color: C.border }}>|</span>
                            <span>Puan <strong style={{ color: C.gold }}>{((c.similarity + c.projection + c.longevity) / 3).toFixed(1)}/10</strong></span>
                            {c.recommend === true && (
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: C.greenBg, border: `1px solid ${C.greenBorder}`, borderRadius: '20px', padding: '2px 8px', color: C.green, fontWeight: 700 }}>
                                <FontAwesomeIcon icon={faThumbsUp} style={{ fontSize: '10px' }} /> Tavsiye ediyor
                              </span>
                            )}
                            {c.recommend === false && (
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: C.redBg, border: `1px solid ${C.redBorder}`, borderRadius: '20px', padding: '2px 8px', color: C.red, fontWeight: 700 }}>
                                <FontAwesomeIcon icon={faThumbsDown} style={{ fontSize: '10px' }} /> Tavsiye etmiyor
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <p style={{ fontSize: '13px', color: C.text, lineHeight: 1.6 }}>{c.status === 'pending_update' ? (c.text || c.pendingUpdate?.text) : c.text}</p>
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>
        ) : (
          <Card style={{ padding: sm ? '40px 20px' : '60px', textAlign: 'center' }}>
            <div style={{ fontSize: '48px', marginBottom: '14px', color: C.textLight }}>
              <FontAwesomeIcon icon={faMagnifyingGlass} />
            </div>
            <div style={{ fontSize: sm ? '16px' : '20px', fontWeight: 700, color: C.navy, marginBottom: '8px' }}>Karşılaştırmak istediğiniz parfümü seçin</div>
            <div style={{ color: C.textLight, fontSize: '14px' }}>Orijinal parfümü ve muadilini seçin.</div>
          </Card>
        )}
      </div>
    </div>
  );
}
