import { useState, useEffect, useMemo } from 'react';
import { useRouter } from '@/contexts/RouterContext';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { useW } from '@/hooks/useW';
import { calcScores } from '@/utils/scoring';
import { containsProfanity, findProfanityMatches } from '@/utils/profanity';
import { validateReviewText, REVIEW_MIN_LENGTH } from '@/utils/reviewValidation';
import { Card, Select, Btn, ScoreBar } from '@/components/ui';
import { GenderBadge } from '@/components/shared';
import { PhotoSlot } from '@/components/shared/PhotoSlot';
import { PerfumeGallery } from '@/components/shared/PerfumeGallery';
import { uploadDataURL } from '@/lib/storage';
import { Badge } from '@/components/ui/Badge';
import { C, F, FH, FE } from '@/constants/theme';
import { useSeo } from '@/lib/seo';
import { faArrowUp, faHeart, faArrowDown, faCrown, faShield, faThumbsUp, faThumbsDown, faMagnifyingGlass, faChevronRight, faEye, faBottleDroplet, faSun, faSnowflake, faSeedling, faLeaf, faCalendarDays, faBriefcase, faShirt, faMoon, faUmbrellaBeach, faList } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

// Mevsim ve kullanım ortamı seçenekleri (çoklu seçim). Form, istatistikler ve
// yorum kartları aynı listeyi kullanır; key değerleri Firestore'da saklanır.
const SEASON_OPTS = [
  { key: 'yaz',        label: 'Yaz',       icon: faSun },
  { key: 'kis',        label: 'Kış',       icon: faSnowflake },
  { key: 'ilkbahar',   label: 'İlkbahar',  icon: faSeedling },
  { key: 'sonbahar',   label: 'Sonbahar',  icon: faLeaf },
  { key: 'dortMevsim', label: '4 Mevsim',  icon: faCalendarDays },
];
const OCCASION_OPTS = [
  { key: 'ofis',   label: 'Ofis',   icon: faBriefcase },
  { key: 'date',   label: 'Date',   icon: faHeart },
  { key: 'gunluk', label: 'Günlük', icon: faShirt },
  { key: 'gunduz', label: 'Gündüz', icon: faSun },
  { key: 'gece',   label: 'Gece',   icon: faMoon },
  { key: 'deniz',  label: 'Deniz',  icon: faUmbrellaBeach },
  { key: 'tumu',   label: 'Tümü',   icon: faList },
];
const SEASON_KEYS = SEASON_OPTS.map((o) => o.key);
const INDIVIDUAL_SEASONS = ['yaz', 'kis', 'ilkbahar', 'sonbahar'];
const OCCASION_KEYS = OCCASION_OPTS.map((o) => o.key);
const INDIVIDUAL_OCCASIONS = ['ofis', 'date', 'gunluk', 'gunduz', 'gece', 'deniz'];

// Evet / Hayır seçim ikilisi (üçüncü tıkta seçim kalkar → "belirtilmemiş")
function YesNo({ value, onChange }) {
  const opt = (val, label, color, bg, border) => (
    <button type="button" onClick={() => onChange(value === val ? null : val)}
      className="inline-flex items-center justify-center rounded-[20px] px-[14px] py-[5px] text-[12px] font-semibold cursor-pointer transition-all duration-150"
      style={{ border: `1px solid ${value === val ? border : C.border}`, background: value === val ? bg : '#fff', color: value === val ? color : C.textLight }}>
      <p className="m-0 p-0 w-max cap-center">{label}</p>
    </button>
  );
  return (
    <div className="flex items-center gap-2">
      {opt(true, 'Evet', C.green, C.greenBg, C.greenBorder)}
      {opt(false, 'Hayır', C.red, C.redBg, C.redBorder)}
    </div>
  );
}

// Çoklu seçilebilir ikon+etiket pill grubu (mevsim / kullanım ortamı)
function MultiChips({ options, value, onChange, disabled = [] }) {
  const toggle = (key) => {
    if (disabled.includes(key)) return;
    onChange(value.includes(key) ? value.filter((k) => k !== key) : [...value, key]);
  };
  return (
    <div className="flex gap-2 flex-wrap">
      {options.map((o) => {
        const on = value.includes(o.key);
        const off = disabled.includes(o.key);
        return (
          <button type="button" key={o.key} onClick={() => toggle(o.key)}
            disabled={off}
            className="inline-flex items-center justify-center gap-[6px] rounded-[20px] px-[12px] py-[6px] text-[12px] font-semibold transition-all duration-150"
            style={{
              border: `1px solid ${on ? C.gold : C.border}`,
              background: on ? C.goldBg : '#fff',
              color: on ? C.goldDeep : C.textLight,
              opacity: off ? 0.38 : 1,
              cursor: off ? 'not-allowed' : 'pointer',
            }}>
            <FontAwesomeIcon icon={o.icon} style={{ width: '12px', height: '12px' }} />
            <p className="m-0 p-0 w-max cap-center">{o.label}</p>
          </button>
        );
      })}
    </div>
  );
}

const REVIEW_PREVIEW_LENGTH = 300;

function ReviewText({ text }) {
  const [expanded, setExpanded] = useState(false);
  if (!text) return null;
  if (text.length <= REVIEW_PREVIEW_LENGTH) {
    return <p className="text-[13px] leading-relaxed" style={{ color: C.text }}>{text}</p>;
  }
  return (
    <p className="text-[13px] leading-relaxed" style={{ color: C.text }}>
      {expanded ? text : <>{text.slice(0, REVIEW_PREVIEW_LENGTH)}…</>}
      {' '}
      <button
        onClick={() => setExpanded(v => !v)}
        className="font-semibold cursor-pointer"
        style={{ color: C.gold, background: 'none', border: 'none', padding: 0 }}
      >
        {expanded ? 'Daha az göster' : 'Devamını oku'}
      </button>
    </p>
  );
}

function CommentForm({ initialValues, isEditMode, isMod, isAdmin, sm, ownsOriginalDefault, onSubmit, onCancel, submitError, submitLoading }) {
  const [cSim, setCSim] = useState(initialValues?.sim ?? 5);
  const [cProj, setCProj] = useState(initialValues?.proj ?? 5);
  const [cLon, setCLon] = useState(initialValues?.lon ?? 5);
  const [cText, setCText] = useState(initialValues?.text ?? '');
  const [cRecommend, setCRecommend] = useState(initialValues?.recommend ?? null);
  const [cBlindBuy, setCBlindBuy] = useState(initialValues?.blindBuy ?? null);
  // Orijinale sahiplik: düzenlemede kayıtlı değer, yeni yorumda kullanıcının
  // bu orijinali daha önce sahiplendiği bilgisinden otomatik dolar.
  const [cOwnsOriginal, setCOwnsOriginal] = useState(initialValues?.ownsOriginal ?? (ownsOriginalDefault ? true : null));
  const [cSeasons, setCSeasons] = useState(initialValues?.seasons ?? []);
  const [cOccasions, setCOccasions] = useState(initialValues?.occasions ?? []);

  const handleSeasonChange = (next) => {
    if (next.includes('dortMevsim') && !cSeasons.includes('dortMevsim')) {
      setCSeasons(['dortMevsim']);
      return;
    }
    if (INDIVIDUAL_SEASONS.every((k) => next.includes(k))) {
      setCSeasons(['dortMevsim']);
      return;
    }
    setCSeasons(next);
  };

  const handleOccasionChange = (next) => {
    if (next.includes('tumu') && !cOccasions.includes('tumu')) {
      setCOccasions(['tumu']);
      return;
    }
    if (INDIVIDUAL_OCCASIONS.every((k) => next.includes(k))) {
      setCOccasions(['tumu']);
      return;
    }
    setCOccasions(next);
  };
  const [profanityError, setProfanityError] = useState(false);
  const [profanityMatches, setProfanityMatches] = useState([]);
  const [textError, setTextError] = useState('');
  const [cOrigImg, setCOrigImg] = useState(initialValues?.origImg ?? null);
  const [cMuadilImg, setCMuadilImg] = useState(initialValues?.muadilImg ?? null);
  const [cConsent, setCConsent] = useState(false);
  const [consentError, setConsentError] = useState(false);

  const hasPhoto = !!(cOrigImg || cMuadilImg);

  const textCheck = validateReviewText(cText);

  const submit = () => {
    if (!cText.trim()) return;
    const matches = findProfanityMatches(cText);
    if (matches.length > 0) { setProfanityError(true); setProfanityMatches(matches); return; }
    if (!textCheck.ok) { setTextError(textCheck.reason); return; }
    if (hasPhoto && !cConsent) { setConsentError(true); return; }
    onSubmit({
      similarity: cSim, projection: cProj, longevity: cLon, text: cText, recommend: cRecommend,
      blindBuy: cBlindBuy, ownsOriginal: cOwnsOriginal,
      seasons: cSeasons, occasions: cOccasions,
      originalImage: cOrigImg, muadilImage: cMuadilImg, imageConsent: hasPhoto,
    });
  };

  return (
    <div className="fade-in rounded-xl p-4 mb-[18px] relative" style={{ background: C.goldBg, border: `1px solid ${C.goldBorder}` }}>
      {isEditMode && <div className="text-[13px] font-bold mb-3" style={{ color: C.gold }}>Yorumunu Düzenle</div>}
      <div className="mb-3" style={{ display: 'grid', gridTemplateColumns: sm ? '1fr' : '1fr 1fr 1fr', gap: '12px' }}>
        {[['Benzerlik', cSim, setCSim], ['Yayılım', cProj, setCProj], ['Kalıcılık', cLon, setCLon]].map(([l, v, sv]) => (
          <div key={l}>
            <div className="flex justify-between mb-1">
              <span className="text-[13px] text-(--color-text-mid)">{l}</span>
              <span className="text-[13px] font-bold" style={{ color: C.gold }}>{v}/10</span>
            </div>
            <input type="range" min="1" max="10" value={v} onChange={(e) => sv(Number(e.target.value))} className="w-full" style={{ accentColor: C.gold }} />
          </div>
        ))}
      </div>
      <textarea
        value={cText}
        onChange={(e) => { setCText(e.target.value); if (profanityError) { const m = findProfanityMatches(e.target.value); setProfanityError(m.length > 0); setProfanityMatches(m); } if (textError) setTextError(''); }}
        placeholder="Deneyiminizi en az 40 karakterle paylaşın..."
        rows={3}
        className="w-full rounded-lg px-3 py-[10px] text-[14px] outline-none resize-none box-border transition-[border-color] duration-200"
        style={{ border: `1px solid ${(profanityError || textError) ? C.red : C.border}`, color: C.text, background: C.card, marginBottom: (profanityError || textError) ? '6px' : '6px' }}
      />
      <div className="flex justify-end mb-3 text-[11px]" style={{ color: cText.trim().length < REVIEW_MIN_LENGTH ? C.textLight : C.green }}>
        {cText.trim().length}/{REVIEW_MIN_LENGTH} karakter
      </div>
      {profanityError && (
        <div className="flex items-start gap-2 rounded-lg px-3 py-2 mb-3 text-[13px] font-semibold" style={{ background: '#fef2f2', border: '1px solid #fecaca', color: C.red }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-[1px]"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          <span>
            Hakaret veya uygunsuz ifade içeren yorumlar yapılamaz.
            {profanityMatches.length > 0 && (
              <span className="block mt-[3px] font-normal text-[12px]">
                Tespit edilen ifade{profanityMatches.length > 1 ? 'ler' : ''}: {profanityMatches.map((w, i) => (
                  <span key={w}><b>"{w}"</b>{i < profanityMatches.length - 1 ? ', ' : ''}</span>
                ))}
              </span>
            )}
          </span>
        </div>
      )}
      {textError && !profanityError && (
        <div className="flex items-center gap-2 rounded-lg px-3 py-2 mb-3 text-[13px] font-semibold" style={{ background: '#fef2f2', border: '1px solid #fecaca', color: C.red }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          {textError}
        </div>
      )}
      <div className="flex items-center gap-3 mb-[10px]">
        <span className="text-[13px] text-(--color-text-mid) font-semibold">Bu muadili tavsiye eder misiniz?</span>
        <button onClick={() => setCRecommend(cRecommend === true ? null : true)}
          className="w-[38px] h-[38px] rounded-full flex items-center justify-center cursor-pointer transition-all duration-150 shrink-0"
          style={{ border: `2px solid ${cRecommend === true ? C.green : C.border}`, background: cRecommend === true ? C.greenBg : '#fff', color: cRecommend === true ? C.green : C.textLight }}>
          {/* Çift tam sayı boyut: kesirli em genişliğin sub-pixel kaymasını önler */}
          <FontAwesomeIcon icon={faThumbsUp} style={{ width: '16px', height: '16px' }} />
        </button>
        <button onClick={() => setCRecommend(cRecommend === false ? null : false)}
          className="w-[38px] h-[38px] rounded-full flex items-center justify-center cursor-pointer transition-all duration-150 shrink-0"
          style={{ border: `2px solid ${cRecommend === false ? C.red : C.border}`, background: cRecommend === false ? C.redBg : '#fff', color: cRecommend === false ? C.red : C.textLight }}>
          {/* Çift tam sayı boyut: kesirli em genişliğin sub-pixel kaymasını önler */}
          <FontAwesomeIcon icon={faThumbsDown} style={{ width: '16px', height: '16px' }} />
        </button>
      </div>
      <div className="flex items-center gap-3 mb-[10px] flex-wrap">
        <span className="text-[13px] text-(--color-text-mid) font-semibold">Bu parfüm kör alışa uygun mu?</span>
        <YesNo value={cBlindBuy} onChange={setCBlindBuy} />
      </div>
      <div className="flex items-center gap-3 mb-[12px] flex-wrap">
        <span className="text-[13px] text-(--color-text-mid) font-semibold">Bu parfümün orijinaline sahip misiniz?</span>
        <YesNo value={cOwnsOriginal} onChange={setCOwnsOriginal} />
      </div>
      <div className="mb-[12px]">
        <div className="text-[13px] text-(--color-text-mid) font-semibold mb-2">Bu parfüm hangi mevsim için daha uygun?</div>
        <MultiChips options={SEASON_OPTS} value={cSeasons} onChange={handleSeasonChange} disabled={cSeasons.includes('dortMevsim') ? INDIVIDUAL_SEASONS : []} />
      </div>
      <div className="mb-[12px]">
        <div className="text-[13px] text-(--color-text-mid) font-semibold mb-2">Bu parfüm hangi ortam için daha uygun?</div>
        <MultiChips options={OCCASION_OPTS} value={cOccasions} onChange={handleOccasionChange} disabled={cOccasions.includes('tumu') ? INDIVIDUAL_OCCASIONS : []} />
      </div>
      <div className="mb-[12px]">
        <div className="text-[13px] font-semibold mb-2" style={{ color: C.textMid }}>
          Fotoğraf ekle <span style={{ color: C.textLight, fontWeight: 400 }}>(opsiyonel)</span>
        </div>
        <div className="grid grid-cols-2 gap-3" style={{ maxWidth: sm ? '100%' : 420 }}>
          <PhotoSlot label="Orijinal şişesi" value={cOrigImg} onChange={(v) => { setCOrigImg(v); if (!v && !cMuadilImg) setConsentError(false); }} />
          <PhotoSlot label="Muadil şişesi" value={cMuadilImg} onChange={(v) => { setCMuadilImg(v); if (!v && !cOrigImg) setConsentError(false); }} />
        </div>
        {hasPhoto && (
          <label className="flex items-start gap-2 mt-2 cursor-pointer">
            <input type="checkbox" checked={cConsent} onChange={(e) => { setCConsent(e.target.checked); if (consentError) setConsentError(false); }} className="mt-[2px] shrink-0" style={{ accentColor: C.gold }} />
            <span className="text-[12px]" style={{ color: consentError ? C.red : C.textMid }}>
              Eklediğim görsellerin Muadilci'de yayınlanmasına ve kullanılmasına izin veriyorum.
            </span>
          </label>
        )}
      </div>
      <div className="text-[12px] text-(--color-text-mid) rounded-lg px-3 py-2 mb-2" style={{ background: C.blueBg, border: '1px solid #bfdbfe' }}>
        Verdiğiniz puanlar parfümün genel puan ortalamasına etki edecektir.
      </div>
      {!isMod && !isAdmin && <div className="text-[12px] mb-2" style={{ color: C.orange }}>Bu yorum moderatör onayından sonra yayınlanacak.</div>}
      {!isMod && !isAdmin && <div className="text-[12px] mb-2" style={{ color: C.textMid }}>Yorumu düzenlemeniz için 5dk süreniz vardır.</div>}
      {submitError && <div className="text-[13px] rounded-lg px-3 py-2 mb-2" style={{ color: C.red, background: '#fff5f5', border: '1px solid #fecaca' }}>{submitError}</div>}
      <div className="flex gap-2 justify-end">
        <Btn variant="secondary" size="sm" onClick={onCancel} disabled={submitLoading}>İptal</Btn>
        <Btn size="sm" onClick={submit} disabled={!cText.trim() || profanityError || !textCheck.ok || submitLoading}>
          {submitLoading
            ? <span className="flex items-center gap-2"><span className="w-[14px] h-[14px] rounded-full border-2 border-white/40 border-t-white animate-spin inline-block" />Gönderiliyor…</span>
            : (isEditMode ? 'Güncelle' : 'Gönder')}
        </Btn>
      </div>
      {submitLoading && (
        <div className="absolute inset-0 rounded-xl bg-white/60 flex flex-col items-center justify-center gap-3 z-10">
          <div className="w-8 h-8 rounded-full border-[3px] border-(--color-gold-border) border-t-(--color-gold) animate-spin" />
          <span className="text-[14px] font-semibold" style={{ color: C.gold }}>Yorum gönderiliyor…</span>
        </div>
      )}
    </div>
  );
}

export function ComparisonPage({ queryParams }) {
  useSeo({
    title: 'Karşılaştır',
    description: 'Orijinal parfüm ile muadilini yan yana karşılaştır; koku benzerliği, kalıcılık ve yayılım puanlarını topluluk yorumlarıyla incele.',
  });
  const { navigate } = useRouter();
  const { perfumes, muadilPerfumes, brands, comments, users, addComment, updateComment, deleteComment, toggleCompFavorite, isCompFavorite, toggleMuadilFavorite, isMuadilFavorite, incrementCompareCount, toggleMuadilRecommend, getMuadilRecommendStatus, ownsOriginalPerfume } = useData();
  const { user, isMod, isAdmin } = useAuth();
  const { w, sm, md, lg, xl, xs } = useW();

  // Onaylı yorumlardan parfüm/muadil fotoğraf haritası (yeni → eski)
  const photoMap = useMemo(() => {
    const orig = {}, mu = {};
    for (const c of comments) {
      if (c.status !== 'approved') continue;
      if (c.originalImage && c.targetPerfumeId != null) (orig[c.targetPerfumeId] ||= []).push(c.originalImage);
      if (c.muadilImage && c.muadilId != null) (mu[c.muadilId] ||= []).push(c.muadilImage);
    }
    return { orig, mu };
  }, [comments]);

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
  const [submitLoading, setSubmitLoading] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [showScoreInfo, setShowScoreInfo] = useState(false);
  const [, setEditTick] = useState(0); // 5dk düzenleme penceresi dolunca yeniden render


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

  // Kullanıcı yorumunu yalnızca gönderimden sonraki 5 dakika içinde düzenleyebilir.
  // (mod/admin bu sınırdan muaftır — kurallar tarafında da aynı şekilde)
  const EDIT_WINDOW_MS = 5 * 60 * 1000;
  const reviewCreatedMs = userReview?.createdAt?.toMillis?.()
    ?? (userReview?.createdAt?.seconds ? userReview.createdAt.seconds * 1000 : null);
  const canEditReview = !!userReview && (isMod || isAdmin
    || (reviewCreatedMs != null && Date.now() - reviewCreatedMs < EDIT_WINDOW_MS));

  // Pencere tam dolduğunda butonu gizlemek için tek seferlik timeout
  useEffect(() => {
    if (!userReview || isMod || isAdmin || reviewCreatedMs == null) return;
    const remaining = reviewCreatedMs + EDIT_WINDOW_MS - Date.now();
    if (remaining <= 0) return;
    const t = setTimeout(() => setEditTick((x) => x + 1), remaining + 100);
    return () => clearTimeout(t);
  }, [userReview?.id, reviewCreatedMs, isMod, isAdmin]);

  // Düzenleme formu açıkken yorum silinirse (aşağıdan), formu da kapat — boş/geçersiz
  // bir düzenleme ekranının açık kalmasını önler.
  useEffect(() => {
    if (showCForm && isEditMode && !userReview) {
      setShowCForm(false); setIsEditMode(false); setEditInitials(null);
    }
  }, [showCForm, isEditMode, userReview]);
  const scores = selMuadil ? calcScores(selMuadil.id, comments) : { scent: null, projection: null, longevity: null, overall: null, count: 0 };

  // Tavsiye sayıları: onaylanmış yorumlardan hesapla
  const approvedMuadilComments = selMuadil
    ? comments.filter((c) => c.muadilPerfumeId === selMuadil.id && c.status === 'approved')
    : [];
  const recCount = approvedMuadilComments.filter((c) => c.recommend === true).length;
  const notRecCount = approvedMuadilComments.filter((c) => c.recommend === false).length;

  // Kör alışa uygunluk oyları (yalnızca cevap verenler arasında)
  const blindYes = approvedMuadilComments.filter((c) => c.blindBuy === true).length;
  const blindNo = approvedMuadilComments.filter((c) => c.blindBuy === false).length;
  const blindTotal = blindYes + blindNo;
  const blindYesPct = blindTotal ? Math.round((blindYes / blindTotal) * 100) : null;

  // Orijinale sahiplik oranı (cevap verenler arasında "sahibim" diyenler)
  const ownsYes = approvedMuadilComments.filter((c) => c.ownsOriginal === true).length;
  const ownsTotal = ownsYes + approvedMuadilComments.filter((c) => c.ownsOriginal === false).length;
  const ownsPct = ownsTotal ? Math.round((ownsYes / ownsTotal) * 100) : null;

  // Mevsim / kullanım ortamı dağılımı: her seçenek için yanıtlayanlar arasındaki yüzde.
  // Çoklu seçim olduğu için yüzdeler toplamı 100 olmayabilir. En yüksek solda.
  const buildDist = (opts, field) => {
    const respondents = approvedMuadilComments.filter((c) => Array.isArray(c[field]) && c[field].length > 0).length;
    return {
      respondents,
      items: opts
        .map((o) => {
          const count = approvedMuadilComments.filter((c) => Array.isArray(c[field]) && c[field].includes(o.key)).length;
          return { ...o, count, pct: respondents ? Math.round((count / respondents) * 100) : 0 };
        })
        .sort((a, b) => b.count - a.count),
    };
  };
  const seasonDist = buildDist(SEASON_OPTS, 'seasons');
  const occasionDist = buildDist(OCCASION_OPTS, 'occasions');

  const submitC = async (data) => {
    if (!user || !selMuadil) return;
    setSubmitError('');
    setSubmitLoading(true);
    try {
      // Yeni eklenen data URL'leri Storage'a yükle (zaten http URL ise olduğu gibi bırakılır)
      let originalImage = data.originalImage ?? null;
      let muadilImage = data.muadilImage ?? null;
      if (originalImage?.startsWith('data:')) originalImage = await uploadDataURL(originalImage, `reviews/${user.uid}`);
      if (muadilImage?.startsWith('data:')) muadilImage = await uploadDataURL(muadilImage, `reviews/${user.uid}`);

      const payload = {
        similarity: data.similarity, projection: data.projection, longevity: data.longevity,
        text: data.text, recommend: data.recommend,
        blindBuy: data.blindBuy ?? null, ownsOriginal: data.ownsOriginal ?? null,
        seasons: data.seasons ?? [], occasions: data.occasions ?? [],
        originalImage, muadilImage,
        imageConsent: !!data.imageConsent,
        targetPerfumeId: selMuadil.targetPerfumeId ?? selOrigId ?? null,
      };

      if (isEditMode && userReview) {
        await updateComment(userReview.id, payload);
      } else {
        await addComment({ muadilPerfumeId: selMuadil.id, ...payload, status: isMod ? 'approved' : 'pending' });
      }
      setShowCForm(false); setIsEditMode(false); setEditInitials(null);
    } catch (e) {
      if (e.code === 'rate-limited' || e.code === 'review-rejected') setSubmitError(e.message);
      else setSubmitError('Gönderilemedi. Lütfen tekrar deneyin.');
    } finally {
      setSubmitLoading(false);
    }
  };

  const openEditForm = () => {
    if (!userReview || !canEditReview) return;
    setEditInitials({
      sim: userReview.similarity ?? 5,
      proj: userReview.projection ?? 5,
      lon: userReview.longevity ?? 5,
      text: userReview.pendingUpdate?.text ?? userReview.text ?? '',
      recommend: userReview.recommend ?? null,
      blindBuy: userReview.pendingUpdate?.blindBuy ?? userReview.blindBuy ?? null,
      ownsOriginal: userReview.pendingUpdate?.ownsOriginal ?? userReview.ownsOriginal ?? null,
      seasons: userReview.pendingUpdate?.seasons ?? userReview.seasons ?? [],
      occasions: userReview.pendingUpdate?.occasions ?? userReview.occasions ?? [],
      origImg: userReview.originalImage ?? null,
      muadilImg: userReview.muadilImage ?? null,
    });
    setIsEditMode(true);
    setShowCForm(true);
  };

  const origBrandOpts = [{ value: '', label: 'Orijinal Marka Seçin' }, ...origBrands.map((b) => ({ value: b, label: b }))];
  const origPerfOpts = [{ value: '', label: 'Orijinal Parfüm Seçin' }, ...origFiltered.map((p) => ({ value: String(p.id), label: p.name }))];
  const mBrandOpts = [{ value: '', label: 'Muadil Marka Seçin' }, ...mBrands.map((b) => ({ value: b, label: b }))];
  const mPerfOpts = [{ value: '', label: 'Muadil Parfüm Seçin' }, ...mFiltered.map((m) => ({ value: String(m.id), label: m.name }))];

  return (
    <div className="min-h-screen bg-(--color-bg)" style={{ padding: xs ? '16px' : sm ? '20px 16px' : '32px' }}>
      <div className="max-w-[1320px] mx-auto">
        <h1 className="font-black text-(--color-navy) mb-[6px]" style={{ fontSize: sm ? '22px' : '26px' }}>Parfüm Karşılaştır</h1>
        <p className="text-(--color-text-light) text-[14px] mb-6">Orijinal parfümü ve muadilini seçerek karşılaştırın</p>

        {/* Selectors */}
        <div className="flex justify-end mb-2 min-h-[30px]">
          {(selOrigBrand || selOrigId || selMuadilBrand || selMuadilId) && (
            <button
              onClick={() => { setSelOrigBrand(''); setSelOrigId(''); setSelMuadilBrand(''); setSelMuadilId(''); }}
              className="inline-flex items-center gap-[6px] px-[14px] py-[7px] rounded-lg text-[13px] font-semibold cursor-pointer transition-all duration-150 whitespace-nowrap"
              style={{ border: `1px solid ${C.border}`, background: C.card, color: C.textMid, fontFamily: F }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = C.red; e.currentTarget.style.color = C.red; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.textMid; }}>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="1" y1="1" x2="11" y2="11"/><line x1="11" y1="1" x2="1" y2="11"/></svg>
              Temizle
            </button>
          )}
        </div>
        <div className="mb-[22px]" style={{ display: 'grid', gridTemplateColumns: sm ? '1fr' : '1fr 1fr', gap: '14px' }}>
          <Card style={{ padding: '20px' }}>
            <div className="text-[12px] font-bold text-(--color-text-light) tracking-[.08em] uppercase mb-3">Orijinal Parfüm</div>
            <div className="flex gap-[10px]" style={{ flexDirection: sm ? 'column' : 'row' }}>
              <div className="flex-1"><Select label="Marka" value={selOrigBrand} onChange={(e) => { setSelOrigBrand(e.target.value); setSelOrigId(''); setSelMuadilBrand(''); setSelMuadilId(''); }} options={origBrandOpts} /></div>
              <div className="flex-1"><Select label="Ürün" value={selOrigId} onChange={(e) => { const id = e.target.value; setSelOrigId(id); if (id) { const p = perfumes.find((p) => String(p.id) === String(id)); if (p) setSelOrigBrand(p.brandName); } setSelMuadilBrand(''); setSelMuadilId(''); }} options={origPerfOpts} /></div>
            </div>
          </Card>
          <Card style={{ padding: '20px' }}>
            <div className="text-[12px] font-bold text-(--color-text-light) tracking-[.08em] uppercase mb-3">Muadil Parfüm</div>
            <div className="flex gap-[10px]" style={{ flexDirection: sm ? 'column' : 'row' }}>
              <div className="flex-1"><Select label="Marka" value={selMuadilBrand} onChange={(e) => { setSelMuadilBrand(e.target.value); setSelMuadilId(''); }} options={mBrandOpts} /></div>
              <div className="flex-1"><Select label="Ürün" value={selMuadilId} onChange={(e) => { const id = e.target.value; setSelMuadilId(id); if (id) { const m = muadilPerfumes.find((m) => String(m.id) === String(id)); if (m) setSelMuadilBrand(m.brandName); if (selOrigId && id) window.history.replaceState(null, '', `/karsilastir?orijinal=${selOrigId}&muadil=${id}`); } }} options={mPerfOpts} disabled={!selMuadilBrand} /></div>
            </div>
          </Card>
        </div>

        {selOrig && selMuadil ? (
          <div className="fade-in">
            {/* Top cards */}
            <div className="mb-[14px]" style={{ display: 'grid', gridTemplateColumns: sm ? '1fr' : xl ? '1fr 1fr' : '1fr 1fr 1.4fr', gap: sm ? '8px' : '14px' }}>
              {/* ── Orijinal Parfüm Kartı ── */}
              {(() => {
                const FI = "'Inter', 'DM Sans', sans-serif";
                return (
                  <div className="rounded-[18px] overflow-hidden flex flex-col self-start" style={{ background: '#F5F2EC', border: '1px solid #E8E3D8', boxShadow: '0 2px 16px rgba(0,0,0,.07)' }}>
                    {/* Görsel galerisi (topluluk fotoğrafları) */}
                    <div className="w-full overflow-hidden">
                      <PerfumeGallery photos={[selOrig.image, ...(photoMap.orig[selOrig.id] || [])].filter(Boolean)} />
                    </div>
                    {/* İçerik */}
                    <div className="p-[12px_14px] flex items-center gap-[10px]">
                      <div className="w-[50px] h-[50px] rounded-[10px] overflow-hidden shrink-0 flex items-center justify-center" style={{ background: '#EDE9E0', border: '1px solid #DDD8CE' }}>
                        {origBrand?.logoImage
                          ? <img src={origBrand.logoImage} alt={origBrand.name} className="w-full h-full object-cover" />
                          : <span className="text-[10px] font-bold uppercase tracking-[.04em]" style={{ color: C.textMid, fontFamily: FI }}>{origBrand?.logo || selOrig.brandName?.slice(0,2)}</span>
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <a href={`/marka/${selOrig.brandSlug}`} onClick={(e) => { if (e.button !== 0 || e.ctrlKey || e.metaKey || e.shiftKey) return; e.preventDefault(); navigate(`/marka/${selOrig.brandSlug}`); }}
                          className="block overflow-hidden text-ellipsis whitespace-nowrap mb-[2px] no-underline"
                          style={{ fontFamily: FI, fontWeight: 700, fontSize: '13px', color: C.text }}
                          onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'} onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}>{selOrig.brandName}</a>
                        <div className="overflow-hidden text-ellipsis whitespace-nowrap mb-[5px]" style={{ fontFamily: FI, fontWeight: 300, fontSize: '12px', color: C.textMid }}>{selOrig.name}</div>
                        <div className="flex gap-1 flex-wrap">
                          <div className="inline-flex items-center justify-center px-[9px] rounded-[20px] text-[10px] font-semibold uppercase tracking-[.08em]" style={{ fontFamily: FI, background: '#EDE9E0', color: C.textMid, border: '1px solid #DDD8CE', height: '20px' }}><p className="m-0 p-0 w-max cap-center" style={{ lineHeight: '18px' }}>Orijinal</p></div>
                          {selOrig.gender && <div className="inline-flex items-center justify-center px-[9px] rounded-[20px] text-[10px] font-semibold uppercase tracking-[.08em]" style={{ fontFamily: FI, background: '#EDE9E0', color: C.textMid, border: '1px solid #DDD8CE', height: '20px' }}><p className="m-0 p-0 w-max cap-center" style={{ lineHeight: '18px' }}>{selOrig.gender}</p></div>}
                          {Number(selOrig.year) > 0 && <div className="inline-flex items-center justify-center px-[9px] rounded-[20px] text-[10px] font-semibold uppercase tracking-[.08em]" style={{ fontFamily: FI, background: '#EDE9E0', color: C.textMid, border: '1px solid #DDD8CE', height: '20px' }}><p className="m-0 p-0 w-max cap-center" style={{ lineHeight: '18px' }}>{selOrig.year}</p></div>}
                        </div>
                      </div>
                      <div className="relative shrink-0"
                        onMouseEnter={e => { const t = e.currentTarget.querySelector('[data-tip]'); if (t) t.style.opacity = '1'; }}
                        onMouseLeave={e => { const t = e.currentTarget.querySelector('[data-tip]'); if (t) t.style.opacity = '0'; }}>
                        <button onClick={() => navigate(`/${selOrig.brandSlug}/${selOrig.slug}`)}
                          className="w-[36px] h-[36px] rounded-full bg-white flex items-center justify-center cursor-pointer transition-[box-shadow] duration-150"
                          style={{ border: '1px solid #DDD8CE', boxShadow: '0 1px 4px rgba(0,0,0,.08)' }}
                          onMouseEnter={e => e.currentTarget.style.boxShadow = '0 3px 10px rgba(0,0,0,.14)'} onMouseLeave={e => e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,.08)'}>
                          <FontAwesomeIcon icon={faChevronRight} style={{ fontSize: '12px', color: C.textMid }} />
                        </button>
                        <div data-tip="" className="absolute bottom-[calc(100%+8px)] right-0 text-[11px] font-medium px-[10px] py-[5px] rounded-lg whitespace-nowrap pointer-events-none z-10 transition-opacity duration-150"
                          style={{ background: '#1a1a1a', color: '#fff', fontFamily: FI, opacity: 0 }}>Parfüm profiline git</div>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* ── Muadil Parfüm Kartı ── */}
              {(() => {
                const FI = "'Inter', 'DM Sans', sans-serif";
                return (
                  <div className="rounded-[18px] overflow-hidden flex flex-col self-start" style={{ background: '#F5F2EC', border: '1px solid #E8E3D8', boxShadow: '0 2px 16px rgba(0,0,0,.07)' }}>
                    {/* Görsel galerisi + favori butonu */}
                    <div className="relative w-full overflow-hidden">
                      <PerfumeGallery photos={[selMuadil.image, ...(photoMap.mu[selMuadil.id] || [])].filter(Boolean)} />
                      <button onClick={() => { if (user?.uid) toggleMuadilFavorite(user.uid, selMuadil.id); }}
                        className="absolute top-[10px] right-[10px] w-[32px] h-[32px] rounded-full flex items-center justify-center cursor-pointer transition-all duration-150"
                        style={{ background: 'rgba(255,255,255,.85)', border: '1px solid rgba(0,0,0,.08)', backdropFilter: 'blur(4px)' }}>
                        {/* Çift tam sayı boyut: 1.25em kesirli genişliğin sub-pixel kaymasını önler */}
                        <FontAwesomeIcon icon={faHeart} style={{ width: '14px', height: '14px', color: isMuadilFavorite(user?.uid, selMuadil.id) ? '#f87171' : '#ccc' }} />
                      </button>
                    </div>
                    {/* İçerik */}
                    <div className="p-[12px_14px] flex items-center gap-[10px]">
                      <div className="w-[50px] h-[50px] rounded-[10px] overflow-hidden shrink-0 flex items-center justify-center" style={{ background: '#EDE9E0', border: '1px solid #DDD8CE' }}>
                        {muadilBrand?.logoImage
                          ? <img src={muadilBrand.logoImage} alt={muadilBrand.name} className="w-full h-full object-cover" />
                          : <span className="text-[10px] font-bold uppercase tracking-[.04em]" style={{ color: C.textMid, fontFamily: FI }}>{muadilBrand?.logo || selMuadil.brandName?.slice(0,2)}</span>
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <a href={`/marka/${selMuadil.brandSlug}`} onClick={(e) => { if (e.button !== 0 || e.ctrlKey || e.metaKey || e.shiftKey) return; e.preventDefault(); navigate(`/marka/${selMuadil.brandSlug}`); }}
                          className="block overflow-hidden text-ellipsis whitespace-nowrap mb-[2px] no-underline"
                          style={{ fontFamily: FI, fontWeight: 700, fontSize: '13px', color: C.text }}
                          onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'} onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}>{selMuadil.brandName}</a>
                        <div className="overflow-hidden text-ellipsis whitespace-nowrap mb-[5px]" style={{ fontFamily: FI, fontWeight: 300, fontSize: '12px', color: C.textMid }}>{selMuadil.name}</div>
                        <div className="flex gap-1 flex-wrap">
                          <div className="inline-flex items-center justify-center px-[9px] rounded-[20px] text-[10px] font-semibold uppercase tracking-[.08em]" style={{ fontFamily: FI, background: '#EDE9E0', color: C.textMid, border: '1px solid #DDD8CE', height: '20px' }}><p className="m-0 p-0 w-max cap-center" style={{ lineHeight: '18px' }}>Muadil</p></div>
                          {(selMuadil.gender || selOrig.gender) && <div className="inline-flex items-center justify-center px-[9px] rounded-[20px] text-[10px] font-semibold uppercase tracking-[.08em]" style={{ fontFamily: FI, background: '#EDE9E0', color: C.textMid, border: '1px solid #DDD8CE', height: '20px' }}><p className="m-0 p-0 w-max cap-center" style={{ lineHeight: '18px' }}>{selMuadil.gender || selOrig.gender}</p></div>}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}

              <Card style={{ padding: sm ? '14px' : '24px', position: 'relative', gridColumn: (!sm && xl) ? '1 / -1' : 'auto' }}>
                <button onClick={() => { if (selOrig && selMuadil) toggleCompFavorite(user?.uid, selOrig.id, selMuadil.id); }}
                  className="absolute top-[14px] right-[14px] w-[36px] h-[36px] rounded-[10px] flex items-center justify-center cursor-pointer text-[18px]"
                  style={{ background: isCompFavorite(user?.uid, selOrig?.id, selMuadil?.id) ? C.redBg : '#f5f5f5', border: `1px solid ${isCompFavorite(user?.uid, selOrig?.id, selMuadil?.id) ? C.redBorder : C.border}` }}>
                  <FontAwesomeIcon icon={faHeart} style={{ fontSize: '16px', color: isCompFavorite(user?.uid, selOrig?.id, selMuadil?.id) ? C.red : C.textLight }} />
                </button>
                <div className="font-bold text-(--color-text-mid) mb-2 pr-10 flex items-center gap-[6px] flex-wrap" style={{ fontSize: sm ? '12px' : '13px' }}>
                  <span>{selOrig.brandName} <span className="text-(--color-text-light) font-normal">-</span> {selOrig.name}</span>
                  <div className="inline-flex items-center justify-center w-[22px] h-[22px] rounded-full text-white text-[9px] font-black shrink-0 flex-shrink-0"
                    style={{ background: `linear-gradient(135deg,${C.gold},${C.goldLight})`, boxShadow: `0 2px 6px rgba(184,150,90,.4)` }}><p className="m-0 p-0 w-max cap-center" style={{ lineHeight: '22px' }}>VS</p></div>
                  <span>{selMuadil.brandName} <span className="text-(--color-text-light) font-normal">-</span> {selMuadil.name}</span>
                </div>
                <div className="mb-[3px]">
                  <span className="text-(--color-text-light)" style={{ fontSize: sm ? '12px' : '13px' }}>Muadil markası: </span>
                  <span className="font-bold text-(--color-text)" style={{ fontSize: sm ? '12px' : '13px' }}>{selMuadil.brandName}</span>
                </div>
                <div style={{ marginBottom: sm ? '8px' : '14px' }}>
                  <span className="text-(--color-text-light)" style={{ fontSize: sm ? '12px' : '13px' }}>Muadil Parfüm: </span>
                  <span className="font-bold text-(--color-text)" style={{ fontSize: sm ? '12px' : '13px' }}>{selMuadil.name}</span>
                </div>
                <div className="h-px mb-[14px]" style={{ background: C.border }} />
                <div className="flex justify-end mb-2 relative">
                  <button
                    onMouseEnter={() => setShowScoreInfo(true)}
                    onMouseLeave={() => setShowScoreInfo(false)}
                    className="w-[20px] h-[20px] rounded-full text-[12px] font-bold cursor-default flex items-center justify-center shrink-0"
                    style={{ border: `1px solid ${C.border}`, background: '#f4f4f6', color: C.textLight, fontFamily: F }}
                  >?</button>
                  {showScoreInfo && (
                    <div className="absolute top-[26px] right-0 w-[240px] rounded-xl p-[14px] z-10 text-[12px] leading-relaxed"
                      style={{ background: C.card, border: `1px solid ${C.border}`, boxShadow: '0 8px 24px rgba(0,0,0,.1)', color: C.text }}>
                      <div className="font-bold mb-2 text-[13px]" style={{ color: C.navy }}>Puanlar Nasıl Hesaplanır?</div>
                      <div className="mb-[6px]"><span className="font-semibold" style={{ color: C.textMid }}>Koku Yakınlığı:</span> Kullanıcıların orijinal kokuya benzerlik oylarının ortalaması.</div>
                      <div className="mb-[6px]"><span className="font-semibold" style={{ color: C.textMid }}>Yayılım:</span> Parfümün çevreye ne kadar yayıldığına verilen oyların ortalaması.</div>
                      <div className="mb-2"><span className="font-semibold" style={{ color: C.textMid }}>Kalıcılık:</span> Kokunun üstte ne kadar süre kaldığına verilen oyların ortalaması.</div>
                      <div className="pt-2" style={{ borderTop: `1px solid ${C.borderLight}` }}><span className="font-semibold" style={{ color: C.gold }}>Genel Puan:</span> Koku yakınlığı, yayılım ve kalıcılığın eşit ağırlıklı ortalamasıdır (0–10).</div>
                    </div>
                  )}
                </div>
                <ScoreBar label="Koku Yakınlığı" value={scores.scent} empty={scores.scent === null} />
                <ScoreBar label="Yayılım" value={scores.projection} empty={scores.projection === null} />
                <ScoreBar label="Kalıcılık" value={scores.longevity} empty={scores.longevity === null} />
                {scores.count === 0 && <div className="text-[12px] text-(--color-text-light) italic text-center mb-2">Henüz onaylanmış yorum yok</div>}
                <div className="rounded-[10px]" style={{ marginTop: sm ? '8px' : '14px', padding: sm ? '10px 12px' : '14px', background: C.goldBg, border: `1px solid ${C.goldBorder}` }}>
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
                      <div className="flex items-center justify-between mb-[10px]">
                        <div>
                          <div className="text-[12px] text-(--color-text-light) font-semibold mb-[2px]">Genel Puan</div>
                          {scores.count > 0 && <div className="text-[11px] text-(--color-text-light)">{scores.count} yorumun ortalaması</div>}
                        </div>
                        {/* Gradient border pill */}
                        <div className="p-[2px] rounded-[999px] shrink-0" style={{ background: `linear-gradient(135deg, ${grad})` }}>
                          <div className="bg-white rounded-[999px] px-[14px] py-[5px] flex items-baseline gap-[1px]">
                            <span className="text-[18px] font-black leading-none" style={{ color: textColor }}>{s !== null ? s : '—'}</span>
                            {s !== null && <span className="text-[11px] font-semibold text-(--color-text-light)">/10</span>}
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                  {/* Progress bar */}
                  <div className="relative rounded-sm overflow-hidden" style={{ height: sm ? '6px' : '8px', background: 'linear-gradient(90deg, #e53e3e 0%, #f6ad55 50%, #38a169 100%)' }}>
                    <div className="absolute top-0 right-0 h-full transition-[width] duration-400" style={{ width: scores.overall !== null ? `${100 - (scores.overall / 10) * 100}%` : '100%', background: C.borderLight }} />
                  </div>
                </div>
              </Card>
            </div>

            {/* Notes + Other muadils */}
            <div className="mb-[14px]" style={{ display: 'grid', gridTemplateColumns: sm ? '1fr' : '1fr 1fr', gap: '14px' }}>
              <Card style={{ padding: '22px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                <div className="font-bold text-[15px] text-(--color-navy) mb-[14px] pb-3 w-full text-center" style={{ borderBottom: `1px solid ${C.border}` }}>{selOrig.name}</div>
                <div className="text-[12px] text-(--color-text-light) mb-[10px]">Koku Notaları</div>
                {(() => {
                  const clean = (arr) => (arr || []).filter((x) => typeof x === 'string' && x.trim() && !/^(nan|null|undefined)$/i.test(x.trim()));
                  const top = clean(selOrig.notes?.top), heart = clean(selOrig.notes?.heart), base = clean(selOrig.notes?.base);
                  const cats = [['Üst', faArrowUp, top], ['Kalp', faHeart, heart], ['Alt', faArrowDown, base]].filter(([, , n]) => n.length > 0);
                  const chip = (note) => <span key={note} className="rounded-md px-2 py-[2px] text-[12px]" style={{ background: C.goldBg, border: `1px solid ${C.goldBorder}`, color: C.gold }}>{note}</span>;
                  // Hiç geçerli nota yok
                  if (cats.length === 0) {
                    return <div className="text-[12px] italic text-(--color-text-light)">Nota bilgisi bulunmamıştır.</div>;
                  }
                  // Tek kategori → etiketsiz düz liste
                  if (cats.length === 1) {
                    return <div className="flex gap-1 flex-wrap justify-center">{cats[0][2].map(chip)}</div>;
                  }
                  // Birden çok kategori → etiketli
                  return cats.map(([l, icon, n]) => (
                    <div key={l} className="mb-2 w-full">
                      <div className="text-[12px] font-semibold text-(--color-text-mid) mb-[3px] flex items-center justify-center gap-1">
                        <FontAwesomeIcon icon={icon} style={{ fontSize: '10px' }} />{l}
                      </div>
                      <div className="flex gap-1 flex-wrap justify-center">{n.map(chip)}</div>
                    </div>
                  ));
                })()}
              </Card>

              <Card style={{ padding: '22px' }}>
                <div className="font-bold text-[15px] mb-[14px] pb-3" style={{ color: C.green, borderBottom: `1px solid ${C.border}` }}>{selMuadil.name}</div>
                <div className="flex justify-between items-center mb-[10px]">
                  <span className="text-[12px] font-semibold text-(--color-text-light)">DİĞER MUADİLLER</span>
                  <button onClick={() => setMuadilSortDir((d) => d === 'desc' ? 'asc' : 'desc')}
                    className="flex items-center gap-1 text-[11px] font-semibold text-(--color-text-mid) rounded-md px-2 py-[3px] cursor-pointer"
                    style={{ background: '#f4f4f6', border: `1px solid ${C.border}`, fontFamily: F }}>
                    Puan {muadilSortDir === 'desc' ? '↓' : '↑'}
                  </button>
                </div>
                <div className="flex flex-col gap-[6px] max-h-[250px] overflow-y-auto pr-[2px]">
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
                          className="flex justify-between items-center px-3 py-[10px] rounded-[10px] cursor-pointer text-left transition-all duration-150"
                          style={{ border: `1px solid ${isSel ? C.goldBorder : C.border}`, background: isSel ? C.goldBg : 'transparent', fontFamily: F }}
                          onMouseEnter={(e) => { if (!isSel) e.currentTarget.style.background = C.borderLight; }}
                          onMouseLeave={(e) => { if (!isSel) e.currentTarget.style.background = 'transparent'; }}>
                          <div className="text-[13px] font-semibold" style={{ color: isSel ? C.gold : C.text }}>{m.brandName} — {m.name}</div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-[12px] font-bold" style={{ color: ms.overall !== null ? C.gold : C.textLight }}>
                              {ms.overall !== null ? `${ms.overall}/10` : '—'}
                            </span>
                            {isSel && <span className="text-[11px] font-normal" style={{ color: C.gold }}>seçilen</span>}
                          </div>
                        </button>
                      );
                    })}
                </div>
              </Card>
            </div>

            {/* Stats panel */}
            <Card style={{ padding: sm ? '16px' : '22px', marginBottom: '14px' }}>
              <div className="font-bold text-[15px] text-(--color-navy) mb-[14px] pb-[10px]" style={{ borderBottom: `1px solid ${C.border}` }}>
                Muadil İstatistikleri
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: md ? '1fr 1fr' : 'repeat(4,1fr)', gap: sm ? '10px' : '14px' }}>
                {[
                  { icon: faMagnifyingGlass, value: approvedMuadilComments.length, label: 'kullanıcı karşılaştırdı', bg: C.blueBg, border: '#bfdbfe', iconBg: '#dbeafe', color: C.blue },
                  { icon: faHeart,           value: selMuadil.likes ?? 0,           label: 'favoriye ekledi',       bg: C.goldBg, border: C.goldBorder, iconBg: 'rgba(184,150,90,.15)', color: C.gold },
                  { icon: faThumbsUp,        value: recCount,                        label: 'tavsiye ediyor',        bg: C.greenBg, border: C.greenBorder, iconBg: '#dcfce7', color: C.green },
                  { icon: faThumbsDown,      value: notRecCount,                     label: 'tavsiye etmiyor',       bg: C.redBg, border: C.redBorder, iconBg: '#fee2e2', color: C.red },
                ].map(({ icon, value, label, bg, border, iconBg, color }) => (
                  <div key={label} className="rounded-xl flex items-center gap-[14px]"
                    style={{ background: bg, border: `1px solid ${border}`, padding: sm ? '12px' : '14px 16px' }}>
                    <div className="w-[40px] h-[40px] rounded-full flex items-center justify-center shrink-0" style={{ background: iconBg }}>
                      <FontAwesomeIcon icon={icon} style={{ fontSize: '17px', color }} />
                    </div>
                    <div>
                      <div className="font-black leading-[1.1]" style={{ fontSize: sm ? '20px' : '22px', color }}>{value.toLocaleString('tr-TR')}</div>
                      <div className="text-[11px] text-(--color-text-mid) font-semibold mt-[2px]">{label}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Kör alış + orijinale sahiplik oranları */}
              <div style={{ display: 'grid', gridTemplateColumns: sm ? '1fr' : '1fr 1fr', gap: sm ? '10px' : '14px', marginTop: sm ? '10px' : '14px' }}>
                {/* Kör alışa uygunluk */}
                <div className="rounded-xl" style={{ background: C.card, border: `1px solid ${C.border}`, padding: sm ? '12px' : '14px 16px' }}>
                  <div className="flex items-center gap-[10px] mb-[10px]">
                    <div className="w-[36px] h-[36px] rounded-full flex items-center justify-center shrink-0" style={{ background: C.blueBg }}>
                      <FontAwesomeIcon icon={faEye} style={{ fontSize: '15px', color: C.blue }} />
                    </div>
                    <div className="text-[13px] font-bold text-(--color-text)">Kör alışa uygun mu?</div>
                  </div>
                  {blindYesPct !== null ? (
                    <>
                      <div className="flex w-full h-[10px] rounded-full overflow-hidden mb-[8px]" style={{ background: C.redBg }}>
                        <div style={{ width: `${blindYesPct}%`, background: C.green }} />
                        <div style={{ width: `${100 - blindYesPct}%`, background: C.red }} />
                      </div>
                      <div className="flex justify-between items-center">
                        <div className="text-[12px] font-bold" style={{ color: C.green }}>%{blindYesPct} Evet</div>
                        <div className="text-[12px] font-bold" style={{ color: C.red }}>%{100 - blindYesPct} Hayır</div>
                      </div>
                      <div className="text-[11px] text-(--color-text-light) mt-[6px]">{blindTotal} kişi yanıtladı</div>
                    </>
                  ) : (
                    <div className="text-[12px] italic text-(--color-text-light)">Henüz yeterli veri yok.</div>
                  )}
                </div>

                {/* Orijinale sahiplik — turuncu */}
                <div className="rounded-xl" style={{ background: C.card, border: `1px solid ${C.border}`, padding: sm ? '12px' : '14px 16px' }}>
                  <div className="flex items-center gap-[10px] mb-[10px]">
                    <div className="w-[36px] h-[36px] rounded-full flex items-center justify-center shrink-0" style={{ background: C.orangeBg }}>
                      <FontAwesomeIcon icon={faBottleDroplet} style={{ fontSize: '15px', color: C.orange }} />
                    </div>
                    <div className="text-[13px] font-bold text-(--color-text)">Orijinale sahiplik</div>
                  </div>
                  {ownsPct !== null ? (
                    <>
                      <div className="text-[13px] text-(--color-text-mid) mb-[8px]">
                        Kullanıcıların <strong style={{ color: C.orange }}>%{ownsPct}</strong>'i bu parfümün orijinaline sahip
                      </div>
                      <div className="w-full h-[10px] rounded-full overflow-hidden" style={{ background: C.orangeBg }}>
                        <div style={{ width: `${ownsPct}%`, height: '100%', background: `linear-gradient(90deg, ${C.orange}, #e8a85a)` }} />
                      </div>
                      <div className="text-[11px] text-(--color-text-light) mt-[6px]">{ownsTotal} kişi yanıtladı</div>
                    </>
                  ) : (
                    <div className="text-[12px] italic text-(--color-text-light)">Henüz yeterli veri yok.</div>
                  )}
                </div>
              </div>

              {/* Mevsim + kullanım ortamı dağılımı (en yüksek solda) */}
              <div style={{ display: 'grid', gridTemplateColumns: sm ? '1fr' : '1fr 1fr', gap: sm ? '10px' : '14px', marginTop: sm ? '10px' : '14px' }}>
                {[
                  { title: 'Hangi mevsim için uygun?', headIcon: faSun, dist: seasonDist, clr: { main: C.green, deep: '#1f6e3c', bg: C.greenBg, light: '#68d391' } },
                  { title: 'Hangi ortam için uygun?', headIcon: faBriefcase, dist: occasionDist, clr: { main: '#7c3aed', deep: '#6d28d9', bg: '#f3effe', light: '#a78bfa' } },
                ].map(({ title, headIcon, dist, clr }) => (
                  <div key={title} className="rounded-xl" style={{ background: C.card, border: `1px solid ${C.border}`, padding: sm ? '12px' : '14px 16px' }}>
                    <div className="flex items-center gap-[10px] mb-[12px]">
                      <div className="w-[36px] h-[36px] rounded-full flex items-center justify-center shrink-0" style={{ background: clr.bg }}>
                        <FontAwesomeIcon icon={headIcon} style={{ fontSize: '15px', color: clr.main }} />
                      </div>
                      <div className="text-[13px] font-bold text-(--color-text)">{title}</div>
                    </div>
                    {dist.respondents > 0 ? (
                      <div className="flex flex-col gap-[8px]">
                        {dist.items.map((it) => (
                          <div key={it.key} className="flex items-center gap-[8px]">
                            <div className="flex items-center gap-[6px] shrink-0" style={{ width: '92px' }}>
                              <FontAwesomeIcon icon={it.icon} style={{ width: '13px', height: '13px', color: it.count > 0 ? clr.main : C.textMuted }} />
                              <span className="text-[12px] font-semibold" style={{ color: it.count > 0 ? C.text : C.textLight }}>{it.label}</span>
                            </div>
                            <div className="flex-1 h-[8px] rounded-full overflow-hidden" style={{ background: clr.bg }}>
                              <div style={{ width: `${it.pct}%`, height: '100%', background: `linear-gradient(90deg, ${clr.main}, ${clr.light})` }} />
                            </div>
                            <div className="text-[12px] font-bold shrink-0 text-right" style={{ width: '40px', color: it.count > 0 ? clr.deep : C.textLight }}>%{it.pct}</div>
                          </div>
                        ))}
                        <div className="text-[11px] text-(--color-text-light) mt-[2px]">{dist.respondents} kişi yanıtladı</div>
                      </div>
                    ) : (
                      <div className="text-[12px] italic text-(--color-text-light)">Henüz yeterli veri yok.</div>
                    )}
                  </div>
                ))}
              </div>
            </Card>

            {/* Comments */}
            <Card style={{ padding: '22px' }}>
              <div className="flex justify-between items-center mb-[18px] pb-[14px]" style={{ borderBottom: `1px solid ${C.border}` }}>
                <span className="font-bold text-[16px] text-(--color-navy)">Yorumlar ({muadilComments.length})</span>
                {user && !showCForm && !userReview && <Btn size="sm" variant="ghost" onClick={() => setShowCForm(true)}>+ Yorum Ekle</Btn>}
                {user && !showCForm && userReview && canEditReview && <Btn size="sm" variant="ghost" onClick={openEditForm}>Yorumunu Düzenle</Btn>}
                {user && !showCForm && userReview && !canEditReview && <span className="text-[12px] text-(--color-text-light)">Düzenleme süresi doldu</span>}
              </div>

              {showCForm && (
                <CommentForm
                  key={isEditMode ? 'edit' : 'new'}
                  initialValues={editInitials}
                  isEditMode={isEditMode}
                  isMod={isMod}
                  isAdmin={isAdmin}
                  sm={sm}
                  ownsOriginalDefault={!!(user && selOrig && ownsOriginalPerfume(user.uid, selOrig.id))}
                  submitError={submitError}
                  submitLoading={submitLoading}
                  onSubmit={submitC}
                  onCancel={() => { setShowCForm(false); setIsEditMode(false); setEditInitials(null); }}
                />
              )}

              {!user && (
                <div className="text-center p-[14px] rounded-[10px] mb-4" style={{ background: '#f9f9fb' }}>
                  <div className="text-[13px] text-(--color-text-mid) mb-2">Yorum yapmak için giriş yapın</div>
                  <Btn size="sm" onClick={() => navigate('/giris')}>Giriş Yap</Btn>
                </div>
              )}

              {muadilComments.length === 0 && <div className="text-center text-(--color-text-light) text-[14px] py-8">Henüz yorum yok.</div>}
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
                    <div key={c.id} className="rounded-xl px-4 py-[14px] relative overflow-hidden"
                      style={{
                        border: `1px solid ${isAdmin ? C.goldBorder : isModerator ? '#c4b5fd' : c.status === 'pending' ? C.goldBorder : C.border}`,
                        background: isAdmin ? '#fffdf5' : isModerator ? '#faf5ff' : c.status === 'pending' ? C.goldBg : C.card,
                      }}>
                      {/* Admin şerit */}
                      {isAdmin && <div className="absolute top-0 left-0 right-0 h-[3px]" style={{ background: `linear-gradient(90deg,${C.gold},${C.goldLight},${C.gold})` }} />}
                      {isModerator && <div className="absolute top-0 left-0 right-0 h-[3px]" style={{ background: 'linear-gradient(90deg,#6d28d9,#a78bfa,#6d28d9)' }} />}
                      <div className="flex gap-[10px] mb-2">
                        <div className="w-[36px] h-[36px] rounded-full flex items-center justify-center text-[13px] text-white font-bold shrink-0 overflow-hidden"
                          style={{ background: avatarBg, boxShadow: isAdmin ? `0 0 0 2px ${C.gold}` : isModerator ? '0 0 0 2px #a78bfa' : 'none' }}>
                          {livePhoto
                            ? <img src={livePhoto} alt={liveName} className="w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                            : isAdmin ? <FontAwesomeIcon icon={faCrown} style={{ fontSize: '14px' }} /> : liveAvatar
                          }
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-center flex-wrap gap-1">
                            <div className="flex items-center gap-[6px] flex-wrap">
                              {isAdmin ? (
                                <div className="inline-flex items-center gap-[5px] rounded-md px-[9px] py-[2px] text-[12px] font-extrabold"
                                  style={{ background: 'linear-gradient(135deg,#1a1205,#3d2b0e)', border: `1px solid ${C.gold}`, color: C.goldLight }}>
                                  <FontAwesomeIcon icon={faCrown} style={{ fontSize: '10px' }} /><p className="m-0 p-0 w-max cap-center">{liveName}</p>
                                </div>
                              ) : isModerator ? (
                                <div className="inline-flex items-center gap-[5px] rounded-md px-[9px] py-[2px] text-[12px] font-bold" style={{ background: '#ede9fe', border: '1px solid #a78bfa', color: '#5b21b6' }}>
                                  <FontAwesomeIcon icon={faShield} style={{ fontSize: '10px' }} /><p className="m-0 p-0 w-max cap-center">{liveName}</p>
                                </div>
                              ) : isDeleted ? (
                                <span className="text-[13px] text-(--color-text-light) italic">{liveName}</span>
                              ) : commentUser?.username ? (
                                <a href={`/@${commentUser.username}`}
                                  onClick={(e) => { e.preventDefault(); navigate(`/@${commentUser.username}`); }}
                                  className="font-bold text-[13px] no-underline cursor-pointer transition-colors duration-150"
                                  style={{ color: C.text }}
                                  onMouseEnter={e => e.currentTarget.style.color = C.gold}
                                  onMouseLeave={e => e.currentTarget.style.color = C.text}
                                >{liveName}</a>
                              ) : (
                                <span className="font-bold text-[13px]" style={{ color: C.text }}>{liveName}</span>
                              )}
                            </div>
                            <div className="flex gap-[6px] items-center">
                              {c.status === 'pending' && <Badge color="orange">Bekliyor</Badge>}
                              {c.status === 'pending_update' && <Badge color="orange">Güncelleme Bekliyor</Badge>}
                              <span className="text-[11px] text-(--color-text-light)">{c.createdAt?.toDate?.()?.toLocaleDateString('tr-TR') || c.date || ''}</span>
                              {!isDeleted && user?.uid === c.userId && (
                                confirmDeleteId === c.id
                                  ? <span className="flex gap-1 items-center">
                                      <button onClick={async () => { await deleteComment(c.id); setConfirmDeleteId(null); setShowCForm(false); setIsEditMode(false); setEditInitials(null); }}
                                        className="text-[11px] font-bold text-white bg-[#e53e3e] border-none rounded-[5px] px-2 py-[2px] cursor-pointer"
                                        style={{ fontFamily: F }}>Sil</button>
                                      <button onClick={() => setConfirmDeleteId(null)}
                                        className="text-[11px] text-(--color-text-mid) bg-[#f0f0f0] border-none rounded-[5px] px-2 py-[2px] cursor-pointer"
                                        style={{ fontFamily: F }}>Vazgeç</button>
                                    </span>
                                  : <button onClick={() => setConfirmDeleteId(c.id)}
                                      className="bg-transparent border-none cursor-pointer p-[2px] flex items-center opacity-60"
                                      style={{ color: C.textLight }}
                                      title="Yorumu sil">
                                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                                    </button>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-[10px] mt-[3px] text-[12px] text-(--color-text-mid) flex-wrap items-center">
                            <span>Benzerlik <strong style={{ color: C.gold }}>{c.similarity}/10</strong></span>
                            <span>Yayılım <strong style={{ color: C.gold }}>{c.projection}/10</strong></span>
                            <span>Kalıcılık <strong style={{ color: C.gold }}>{c.longevity}/10</strong></span>
                            <span style={{ color: C.border }}>|</span>
                            <span>Puan <strong style={{ color: C.gold }}>{((c.similarity + c.projection + c.longevity) / 3).toFixed(1)}/10</strong></span>
                            {c.recommend === true && (
                              <div className="inline-flex items-center justify-center gap-1 rounded-[20px] px-2 py-[2px] font-bold"
                                style={{ background: C.greenBg, border: `1px solid ${C.greenBorder}`, color: C.green }}>
                                <p className="m-0 p-0 w-max flex items-center gap-1">
                                  <FontAwesomeIcon icon={faThumbsUp} style={{ fontSize: '10px' }} /> Tavsiye ediyor
                                </p>
                              </div>
                            )}
                            {c.recommend === false && (
                              <div className="inline-flex items-center justify-center gap-1 rounded-[20px] px-2 py-[2px] font-bold"
                                style={{ background: C.redBg, border: `1px solid ${C.redBorder}`, color: C.red }}>
                                <p className="m-0 p-0 w-max flex items-center gap-1">
                                  <FontAwesomeIcon icon={faThumbsDown} style={{ fontSize: '10px' }} /> Tavsiye etmiyor
                                </p>
                              </div>
                            )}
                            {(c.blindBuy === true || c.blindBuy === false) && (
                              <div className="inline-flex items-center justify-center gap-1 rounded-[20px] px-2 py-[2px] font-bold"
                                style={{ background: C.blueBg, border: '1px solid #bfdbfe', color: C.blue }}>
                                <p className="m-0 p-0 w-max flex items-center gap-1">
                                  <FontAwesomeIcon icon={faEye} style={{ fontSize: '10px' }} /> Kör alış: {c.blindBuy ? 'Evet' : 'Hayır'}
                                </p>
                              </div>
                            )}
                            {c.ownsOriginal === true && (
                              <div className="inline-flex items-center justify-center gap-1 rounded-[20px] px-2 py-[2px] font-bold"
                                style={{ background: C.goldBg, border: `1px solid ${C.goldBorder}`, color: C.gold }}>
                                <p className="m-0 p-0 w-max flex items-center gap-1">
                                  <FontAwesomeIcon icon={faBottleDroplet} style={{ fontSize: '10px' }} /> Orijinale sahip
                                </p>
                              </div>
                            )}
                            {[...SEASON_OPTS, ...OCCASION_OPTS]
                              .filter((o) => (c.seasons || []).includes(o.key) || (c.occasions || []).includes(o.key))
                              .map((o) => (
                                <div key={o.key} className="inline-flex items-center justify-center gap-1 rounded-[20px] px-2 py-[2px] font-semibold"
                                  style={{ background: C.surface, border: `1px solid ${C.border}`, color: C.textMid }}>
                                  <p className="m-0 p-0 w-max flex items-center gap-1">
                                    <FontAwesomeIcon icon={o.icon} style={{ fontSize: '10px' }} /> {o.label}
                                  </p>
                                </div>
                              ))}
                          </div>
                        </div>
                      </div>
                      <ReviewText text={c.status === 'pending_update' ? (c.text || c.pendingUpdate?.text) : c.text} />
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>
        ) : (
          <Card style={{ padding: sm ? '40px 20px' : '60px', textAlign: 'center' }}>
            <div className="text-[48px] mb-[14px] text-(--color-text-light)">
              <FontAwesomeIcon icon={faMagnifyingGlass} />
            </div>
            <div className="font-bold text-(--color-navy) mb-2" style={{ fontSize: sm ? '16px' : '20px' }}>Karşılaştırmak istediğiniz parfümü seçin</div>
            <div className="text-(--color-text-light) text-[14px]">Orijinal parfümü ve muadilini seçin.</div>
          </Card>
        )}
      </div>
    </div>
  );
}
