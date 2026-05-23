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
import { C, F } from '@/constants/theme';
import { useSeo } from '@/lib/seo';
import { faArrowUp, faHeart, faArrowDown, faCrown, faShield, faThumbsUp, faThumbsDown, faMagnifyingGlass } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import noImage from '@/img/no-image.jpg';

export function ComparisonPage({ queryParams }) {
  useSeo({
    title: 'Karşılaştır',
    description: 'Orijinal parfüm ile muadilini yan yana karşılaştır; koku benzerliği, kalıcılık ve yayılım puanlarını topluluk yorumlarıyla incele.',
  });
  const { navigate } = useRouter();
  const { perfumes, muadilPerfumes, comments, users, addComment, deleteComment, toggleCompFavorite, isCompFavorite, toggleMuadilFavorite, isMuadilFavorite, incrementCompareCount, toggleMuadilRecommend, getMuadilRecommendStatus } = useData();
  const { user, isMod } = useAuth();
  const { w, sm, md, xs } = useW();

  const initOrigId = queryParams?.orijinal || '';
  const initOrigBrand = initOrigId ? (perfumes.find((p) => String(p.id) === String(initOrigId))?.brandName || '') : '';
  const [selOrigBrand, setSelOrigBrand] = useState(initOrigBrand);
  const [selOrigId, setSelOrigId] = useState(initOrigId);
  const initMuadilId = queryParams?.muadil || '';
  const initMuadilBrand = initMuadilId ? (muadilPerfumes.find((m) => String(m.id) === String(initMuadilId))?.brandName || '') : '';
  const [selMuadilBrand, setSelMuadilBrand] = useState(initMuadilBrand);
  const [selMuadilId, setSelMuadilId] = useState(initMuadilId);
  const [muadilSortDir, setMuadilSortDir] = useState('desc');
  const [showCForm, setShowCForm] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [showScoreInfo, setShowScoreInfo] = useState(false);
  const [cSim, setCSim] = useState(5);
  const [cProj, setCProj] = useState(5);
  const [cLon, setCLon] = useState(5);
  const [cText, setCText] = useState('');
  const [cRecommend, setCRecommend] = useState(null);
  const [profanityError, setProfanityError] = useState(false);


  const origBrands = [...new Set(perfumes.map((p) => p.brandName))];
  const origFiltered = selOrigBrand ? perfumes.filter((p) => p.brandName === selOrigBrand) : perfumes;
  const selOrig = perfumes.find((p) => String(p.id) === String(selOrigId));

  const matching = selOrig ? muadilPerfumes.filter((m) => String(m.targetPerfumeId) === String(selOrig.id)) : [];
  const mBrands = [...new Set(matching.map((m) => m.brandName))];
  const mFiltered = selMuadilBrand ? matching.filter((m) => m.brandName === selMuadilBrand) : matching;
  // selMuadil yalnızca seçili orijinale ait muadiller arasında aranır
  const selMuadil = selMuadilId ? matching.find((m) => String(m.id) === String(selMuadilId)) : undefined;

  const muadilComments = selMuadil
    ? comments.filter((c) => c.muadilPerfumeId === selMuadil.id && (isMod || c.status === 'approved'))
    : [];
  const scores = selMuadil ? calcScores(selMuadil.id, comments) : { scent: null, projection: null, longevity: null, overall: null, count: 0 };

  // Tavsiye sayıları: onaylanmış yorumlardan hesapla
  const approvedMuadilComments = selMuadil
    ? comments.filter((c) => c.muadilPerfumeId === selMuadil.id && c.status === 'approved')
    : [];
  const recCount = approvedMuadilComments.filter((c) => c.recommend === true).length;
  const notRecCount = approvedMuadilComments.filter((c) => c.recommend === false).length;

  const submitC = () => {
    if (!cText.trim() || !user || !selMuadil) return;
    if (containsProfanity(cText)) {
      setProfanityError(true);
      return;
    }
    setProfanityError(false);
    addComment({ muadilPerfumeId: selMuadil.id, similarity: cSim, projection: cProj, longevity: cLon, text: cText, recommend: cRecommend, status: isMod ? 'approved' : 'pending' });
    setCText(''); setCSim(5); setCProj(5); setCLon(5); setCRecommend(null); setShowCForm(false);
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
        <div style={{ display: 'grid', gridTemplateColumns: sm ? '1fr' : '1fr 1fr', gap: '14px', marginBottom: '22px' }}>
          <Card style={{ padding: '20px' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: C.textLight, letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: '12px' }}>Orijinal Parfüm</div>
            <div style={{ display: 'flex', gap: '10px', flexDirection: sm ? 'column' : 'row' }}>
              <div style={{ flex: 1 }}><Select label="Marka" value={selOrigBrand} onChange={(e) => { setSelOrigBrand(e.target.value); setSelOrigId(''); setSelMuadilBrand(''); setSelMuadilId(''); }} options={origBrandOpts} /></div>
              <div style={{ flex: 1 }}><Select label="Ürün" value={selOrigId} onChange={(e) => { setSelOrigId(e.target.value); setSelMuadilBrand(''); setSelMuadilId(''); }} options={origPerfOpts} /></div>
            </div>
          </Card>
          <Card style={{ padding: '20px' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: C.textLight, letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: '12px' }}>Muadil Parfüm</div>
            <div style={{ display: 'flex', gap: '10px', flexDirection: sm ? 'column' : 'row' }}>
              <div style={{ flex: 1 }}><Select label="Marka" value={selMuadilBrand} onChange={(e) => { setSelMuadilBrand(e.target.value); setSelMuadilId(''); }} options={mBrandOpts} /></div>
              <div style={{ flex: 1 }}><Select label="Ürün" value={selMuadilId} onChange={(e) => setSelMuadilId(e.target.value)} options={mPerfOpts} /></div>
            </div>
          </Card>
        </div>

        {selOrig && selMuadil ? (
          <div className="fade-in">
            {/* Top cards */}
            <div style={{ display: 'grid', gridTemplateColumns: sm ? '1fr 1fr' : md ? '1fr 1fr' : '1fr 1fr 1.4fr', gap: sm ? '8px' : '14px', marginBottom: '14px' }}>
              <Card style={{ padding: '0', overflow: 'hidden' }}>
                <div style={{ width: '100%', aspectRatio: sm ? '1/1' : '4/3', background: '#f0f0f0', overflow: 'hidden' }}>
                  <img src={selOrig.image || noImage} alt={selOrig.name} onError={(e) => { e.currentTarget.src = noImage; }} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <div style={{ padding: sm ? '8px 10px' : '14px 16px' }}>
                  <div style={{ fontSize: sm ? '13px' : '16px', fontWeight: 900, color: C.navy, marginBottom: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{selOrig.name}</div>
                  <div style={{ fontSize: sm ? '11px' : '13px', color: C.textMid, marginBottom: sm ? '4px' : '8px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{selOrig.brandName}</div>
                  <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                    <Badge color="blue">Orijinal</Badge>
                    <GenderBadge gender={selOrig.gender} />
                  </div>
                </div>
              </Card>
              <Card style={{ padding: '0', overflow: 'hidden', position: 'relative' }}>
                <div style={{ width: '100%', aspectRatio: sm ? '1/1' : '4/3', background: '#f0f0f0', overflow: 'hidden', position: 'relative' }}>
                  <img src={selMuadil.image || noImage} alt={selMuadil.name} onError={(e) => { e.currentTarget.src = noImage; }} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <button
                    onClick={() => { if (user?.uid) toggleMuadilFavorite(user.uid, selMuadil.id); }}
                    style={{ position: 'absolute', top: '10px', right: '10px', background: isMuadilFavorite(user?.uid, selMuadil.id) ? C.redBg : 'rgba(255,255,255,.9)', border: `1px solid ${isMuadilFavorite(user?.uid, selMuadil.id) ? C.redBorder : 'rgba(255,255,255,.6)'}`, borderRadius: '10px', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '18px', boxShadow: '0 2px 8px rgba(0,0,0,.15)', backdropFilter: 'blur(4px)' }}>
                    {isMuadilFavorite(user?.uid, selMuadil.id) ? '❤️' : '🤍'}
                  </button>
                </div>
                <div style={{ padding: sm ? '8px 10px' : '14px 16px' }}>
                  <div style={{ fontSize: sm ? '13px' : '16px', fontWeight: 900, color: C.navy, marginBottom: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{selMuadil.name}</div>
                  <div style={{ fontSize: sm ? '11px' : '13px', color: C.textMid, marginBottom: sm ? '4px' : '8px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{selMuadil.brandName}</div>
                  <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                    <Badge color="green">Muadil</Badge>
                    <GenderBadge gender={selMuadil.gender || selOrig.gender} />
                  </div>
                </div>
              </Card>
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
                  <div style={{ fontSize: '12px', color: C.textLight, marginBottom: '6px', fontWeight: 600 }}>Genel Puan</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ flex: 1, height: sm ? '6px' : '8px', background: C.borderLight, borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: scores.overall !== null ? `${(scores.overall / 10) * 100}%` : '0%', background: 'linear-gradient(90deg, #e53e3e 0%, #f6ad55 45%, #38a169 100%)', borderRadius: '4px' }} />
                    </div>
                    <span style={{ fontWeight: 900, color: scores.overall !== null ? (scores.overall <= 4 ? C.red : scores.overall < 7 ? C.orange : C.green) : C.textLight, fontSize: sm ? '16px' : '18px', minWidth: '44px', textAlign: 'right' }}>{scores.overall !== null ? `${scores.overall}/10` : '—'}</span>
                  </div>
                  {scores.count > 0 && <div style={{ fontSize: '11px', color: C.textLight, marginTop: '4px' }}>{scores.count} yorumun ortalaması</div>}
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
                <div style={{ marginTop: '12px', fontSize: '13px', color: C.textMid, lineHeight: 1.6, fontStyle: 'italic', textAlign: 'center' }}>"{selOrig.description}"</div>
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
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
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
                        <button key={m.id} onClick={() => setSelMuadilId(String(m.id))}
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
                {user && !showCForm && <Btn size="sm" variant="ghost" onClick={() => setShowCForm(true)}>+ Yorum Ekle</Btn>}
              </div>

              {showCForm && (
                <div className="fade-in" style={{ background: C.goldBg, border: `1px solid ${C.goldBorder}`, borderRadius: '12px', padding: '16px', marginBottom: '18px' }}>
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
                    ℹ️ Verdiğiniz puanlar parfümün genel puan ortalamasına etki edecektir.
                  </div>
                  {!isMod && <div style={{ fontSize: '12px', color: C.orange, marginBottom: '8px' }}>Bu yorum moderatör onayından sonra yayınlanacak.</div>}
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                    <Btn variant="secondary" size="sm" onClick={() => { setShowCForm(false); setProfanityError(false); }}>İptal</Btn>
                    <Btn size="sm" onClick={submitC} disabled={!cText.trim() || profanityError}>Gönder</Btn>
                  </div>
                </div>
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
                              ) : (
                                <span style={{ fontWeight: 700, fontSize: '13px', color: C.text }}>{liveName}</span>
                              )}
                            </div>
                            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                              {c.status === 'pending' && <Badge color="orange">Bekliyor</Badge>}
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
                      <p style={{ fontSize: '13px', color: C.text, lineHeight: 1.6 }}>{c.text}</p>
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
