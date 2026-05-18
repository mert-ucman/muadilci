import { useState } from 'react';
import { useRouter } from '@/contexts/RouterContext';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { useW } from '@/hooks/useW';
import { calcScores } from '@/utils/scoring';
import { Card, Select, Btn, ScoreBar } from '@/components/ui';
import { GenderBadge } from '@/components/shared';
import { Badge } from '@/components/ui/Badge';
import { C, F } from '@/constants/theme';
import noImage from '@/img/no-image.jpg';

export function ComparisonPage({ queryParams }) {
  const { navigate } = useRouter();
  const { perfumes, muadilPerfumes, comments, addComment, toggleCompFavorite, isCompFavorite } = useData();
  const { user, isMod } = useAuth();
  const { sm, md } = useW();

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
  const [showScoreInfo, setShowScoreInfo] = useState(false);
  const [cSim, setCSim] = useState(5);
  const [cProj, setCProj] = useState(5);
  const [cLon, setCLon] = useState(5);
  const [cText, setCText] = useState('');

  const origBrands = [...new Set(perfumes.map((p) => p.brandName))];
  const origFiltered = selOrigBrand ? perfumes.filter((p) => p.brandName === selOrigBrand) : perfumes;
  const selOrig = perfumes.find((p) => String(p.id) === String(selOrigId));

  const matching = selOrig ? muadilPerfumes.filter((m) => m.targetPerfumeId === selOrig.id) : muadilPerfumes;
  const mBrands = [...new Set(matching.map((m) => m.brandName))];
  const mFiltered = selMuadilBrand ? matching.filter((m) => m.brandName === selMuadilBrand) : matching;
  const selMuadil = muadilPerfumes.find((m) => String(m.id) === String(selMuadilId));

  const muadilComments = selMuadil
    ? comments.filter((c) => c.muadilPerfumeId === selMuadil.id && (isMod || c.status === 'approved'))
    : [];
  const scores = selMuadil ? calcScores(selMuadil.id, comments) : { scent: null, projection: null, longevity: null, overall: null, count: 0 };

  const submitC = () => {
    if (!cText.trim() || !user || !selMuadil) return;
    addComment({ muadilPerfumeId: selMuadil.id, userId: user.id, userName: user.name, userAvatar: user.name[0], similarity: cSim, projection: cProj, longevity: cLon, text: cText, status: isMod ? 'approved' : 'pending' });
    setCText(''); setCSim(5); setCProj(5); setCLon(5); setShowCForm(false);
  };

  const origBrandOpts = [{ value: '', label: 'Parfüm Evi Seçin' }, ...origBrands.map((b) => ({ value: b, label: b }))];
  const origPerfOpts = [{ value: '', label: 'Parfüm Seçin' }, ...origFiltered.map((p) => ({ value: String(p.id), label: p.name }))];
  const mBrandOpts = [{ value: '', label: 'Muadil Marka Seçin' }, ...(selOrig ? mBrands : origBrands).map((b) => ({ value: b, label: b }))];
  const mPerfOpts = [{ value: '', label: 'Muadil Parfüm Seçin' }, ...mFiltered.map((m) => ({ value: String(m.id), label: m.name }))];

  return (
    <div style={{ minHeight: '100vh', background: C.bg, padding: sm ? '20px 16px' : '32px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <h1 style={{ fontSize: sm ? '22px' : '26px', fontWeight: 900, color: C.navy, marginBottom: '6px' }}>Parfüm Karşılaştır</h1>
        <p style={{ color: C.textLight, fontSize: '14px', marginBottom: '24px' }}>Orijinal parfümü ve muadilini seçerek karşılaştırın</p>

        {/* Selectors */}
        <div style={{ display: 'grid', gridTemplateColumns: sm ? '1fr' : '1fr 1fr', gap: '14px', marginBottom: '22px' }}>
          <Card style={{ padding: '20px' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: C.textLight, letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: '12px' }}>Orijinal Parfüm</div>
            <div style={{ display: 'flex', gap: '10px', flexDirection: sm ? 'column' : 'row' }}>
              <div style={{ flex: 1 }}><Select label="Parfüm Evi" value={selOrigBrand} onChange={(e) => { setSelOrigBrand(e.target.value); setSelOrigId(''); }} options={origBrandOpts} /></div>
              <div style={{ flex: 1 }}><Select label="Model" value={selOrigId} onChange={(e) => setSelOrigId(e.target.value)} options={origPerfOpts} /></div>
            </div>
          </Card>
          <Card style={{ padding: '20px' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: C.textLight, letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: '12px' }}>Muadil Parfüm</div>
            <div style={{ display: 'flex', gap: '10px', flexDirection: sm ? 'column' : 'row' }}>
              <div style={{ flex: 1 }}><Select label="Muadil Marka" value={selMuadilBrand} onChange={(e) => { setSelMuadilBrand(e.target.value); setSelMuadilId(''); }} options={mBrandOpts} /></div>
              <div style={{ flex: 1 }}><Select label="Muadil Model" value={selMuadilId} onChange={(e) => setSelMuadilId(e.target.value)} options={mPerfOpts} /></div>
            </div>
          </Card>
        </div>

        {selOrig && selMuadil ? (
          <div className="fade-in">
            {/* Top cards */}
            <div style={{ display: 'grid', gridTemplateColumns: sm ? '1fr' : md ? '1fr 1fr' : '1fr 1fr 1.4fr', gap: '14px', marginBottom: '14px' }}>
              <Card style={{ padding: '0', overflow: 'hidden' }}>
                <div style={{ width: '100%', aspectRatio: '4/3', background: '#f0f0f0', overflow: 'hidden' }}>
                  <img src={selOrig.image || noImage} alt={selOrig.name} onError={(e) => { e.currentTarget.src = noImage; }} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <div style={{ padding: '14px 16px' }}>
                  <div style={{ fontSize: '16px', fontWeight: 900, color: C.navy, marginBottom: '2px' }}>{selOrig.name}</div>
                  <div style={{ fontSize: '13px', color: C.textMid, marginBottom: '8px' }}>{selOrig.brandName}</div>
                  <GenderBadge gender={selOrig.gender} />
                </div>
              </Card>
              <Card style={{ padding: '0', overflow: 'hidden' }}>
                <div style={{ width: '100%', aspectRatio: '4/3', background: '#f0f0f0', overflow: 'hidden' }}>
                  <img src={selMuadil.image || noImage} alt={selMuadil.name} onError={(e) => { e.currentTarget.src = noImage; }} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <div style={{ padding: '14px 16px' }}>
                  <div style={{ fontSize: '16px', fontWeight: 900, color: C.navy, marginBottom: '2px' }}>{selMuadil.name}</div>
                  <div style={{ fontSize: '13px', color: C.textMid, marginBottom: '8px' }}>{selMuadil.brandName}</div>
                  <Badge color="green">Muadil</Badge>
                </div>
              </Card>
              <Card style={{ padding: '24px', position: 'relative', gridColumn: sm ? '1' : md ? '1 / -1' : 'auto' }}>
                <button onClick={() => { if (selOrig && selMuadil) toggleCompFavorite(user?.id, selOrig.id, selMuadil.id); }}
                  style={{ position: 'absolute', top: '14px', right: '14px', background: isCompFavorite(user?.id, selOrig?.id, selMuadil?.id) ? C.redBg : '#f5f5f5', border: `1px solid ${isCompFavorite(user?.id, selOrig?.id, selMuadil?.id) ? C.redBorder : C.border}`, borderRadius: '10px', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '18px' }}>
                  {isCompFavorite(user?.id, selOrig?.id, selMuadil?.id) ? '❤️' : '🤍'}
                </button>
                <div style={{ fontSize: '13px', fontWeight: 700, color: C.textMid, marginBottom: '10px', paddingRight: '40px' }}>{selOrig.brandName} {selOrig.name} vs {selMuadil.brandName} {selMuadil.name}</div>
                <div style={{ marginBottom: '4px' }}><span style={{ fontSize: '13px', color: C.textLight }}>Muadil markası : </span><span style={{ fontWeight: 700, color: C.text }}>{selMuadil.brandName}</span></div>
                <div style={{ marginBottom: '14px' }}><span style={{ fontSize: '13px', color: C.textLight }}>Muadil Parfüm : </span><span style={{ fontWeight: 700, color: C.text }}>{selMuadil.name}</span></div>
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
                <ScoreBar label="koku yakınlığı" value={scores.scent} empty={scores.scent === null} />
                <ScoreBar label="yayılım" value={scores.projection} empty={scores.projection === null} />
                <ScoreBar label="kalıcılık" value={scores.longevity} empty={scores.longevity === null} />
                {scores.count === 0 && <div style={{ fontSize: '12px', color: C.textLight, fontStyle: 'italic', textAlign: 'center', marginBottom: '8px' }}>Henüz onaylanmış yorum yok</div>}
                <div style={{ marginTop: '14px', padding: '14px', background: C.goldBg, borderRadius: '10px', border: `1px solid ${C.goldBorder}` }}>
                  <div style={{ fontSize: '12px', color: C.textLight, marginBottom: '8px', fontWeight: 600 }}>Genel Puan</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ flex: 1, height: '8px', background: C.borderLight, borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: scores.overall !== null ? `${(scores.overall / 10) * 100}%` : '0%', background: `linear-gradient(90deg,${C.gold},${C.goldLight})`, borderRadius: '4px' }} />
                    </div>
                    <span style={{ fontWeight: 900, color: scores.overall !== null ? C.gold : C.textLight, fontSize: '18px', minWidth: '48px', textAlign: 'right' }}>{scores.overall !== null ? `${scores.overall}/10` : '—'}</span>
                  </div>
                  {scores.count > 0 && <div style={{ fontSize: '11px', color: C.textLight, marginTop: '5px' }}>{scores.count} yorumun ortalaması</div>}
                </div>
              </Card>
            </div>

            {/* Notes + Other muadils */}
            <div style={{ display: 'grid', gridTemplateColumns: sm ? '1fr' : '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
              <Card style={{ padding: '22px' }}>
                <div style={{ fontWeight: 700, fontSize: '15px', color: C.navy, marginBottom: '14px', paddingBottom: '12px', borderBottom: `1px solid ${C.border}` }}>{selOrig.name}</div>
                <div style={{ fontSize: '12px', color: C.textLight, marginBottom: '10px' }}>Koku Notaları</div>
                {[['Üst', '🌿', selOrig.notes?.top || []], ['Kalp', '🩷', selOrig.notes?.heart || []], ['Dip', '🪵', selOrig.notes?.base || []]].map(([l, icon, n]) => (
                  <div key={l} style={{ marginBottom: '8px' }}>
                    <div style={{ fontSize: '12px', fontWeight: 600, color: C.textMid, marginBottom: '3px', display: 'flex', alignItems: 'center', gap: '4px' }}><span>{icon}</span>{l}</div>
                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                      {n.map((note) => <span key={note} style={{ background: C.goldBg, border: `1px solid ${C.goldBorder}`, borderRadius: '6px', padding: '2px 8px', fontSize: '12px', color: C.gold }}>{note}</span>)}
                    </div>
                  </div>
                ))}
                <div style={{ marginTop: '12px', fontSize: '13px', color: C.textMid, lineHeight: 1.6, fontStyle: 'italic' }}>"{selOrig.description}"</div>
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
                  <textarea value={cText} onChange={(e) => setCText(e.target.value)} placeholder="Deneyiminizi paylaşın..." rows={3}
                    style={{ width: '100%', border: `1px solid ${C.border}`, borderRadius: '8px', padding: '10px 12px', fontSize: '14px', color: C.text, background: C.card, outline: 'none', resize: 'none', marginBottom: '10px', boxSizing: 'border-box' }} />
                  {!isMod && <div style={{ fontSize: '12px', color: C.orange, marginBottom: '8px' }}>⚠ Yorumunuz moderatör onayından sonra yayınlanacak.</div>}
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                    <Btn variant="secondary" size="sm" onClick={() => setShowCForm(false)}>İptal</Btn>
                    <Btn size="sm" onClick={submitC} disabled={!cText.trim()}>Gönder</Btn>
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
                {muadilComments.map((c) => (
                  <div key={c.id} style={{ border: `1px solid ${c.status === 'pending' ? C.goldBorder : C.border}`, borderRadius: '12px', padding: '14px 16px', background: c.status === 'pending' ? C.goldBg : C.card }}>
                    <div style={{ display: 'flex', gap: '10px', marginBottom: '8px' }}>
                      <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: `linear-gradient(135deg,${C.gold},${C.goldLight})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', color: '#fff', fontWeight: 700, flexShrink: 0 }}>{c.userAvatar}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '4px' }}>
                          <span style={{ fontWeight: 700, fontSize: '13px', color: C.text }}>{c.userName}</span>
                          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                            {c.status === 'pending' && <Badge color="orange">Bekliyor</Badge>}
                            <span style={{ fontSize: '11px', color: C.textLight }}>{c.date}</span>
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '10px', marginTop: '3px', fontSize: '12px', color: C.textMid, flexWrap: 'wrap' }}>
                          <span>Ben. <strong style={{ color: C.gold }}>{c.similarity}/10</strong></span>
                          <span>Yay. <strong style={{ color: C.gold }}>{c.projection}/10</strong></span>
                          <span>Kal. <strong style={{ color: C.gold }}>{c.longevity}/10</strong></span>
                        </div>
                      </div>
                    </div>
                    <p style={{ fontSize: '13px', color: C.text, lineHeight: 1.6 }}>{c.text}</p>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        ) : (
          <Card style={{ padding: sm ? '40px 20px' : '60px', textAlign: 'center' }}>
            <div style={{ fontSize: '48px', marginBottom: '14px' }}>🔍</div>
            <div style={{ fontSize: sm ? '16px' : '20px', fontWeight: 700, color: C.navy, marginBottom: '8px' }}>Karşılaştırmak istediğiniz parfümü seçin</div>
            <div style={{ color: C.textLight, fontSize: '14px' }}>Orijinal parfümü ve muadilini seçin.</div>
          </Card>
        )}
      </div>
    </div>
  );
}
