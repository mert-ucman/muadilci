import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from '@/contexts/RouterContext';
import { useData } from '@/contexts/DataContext';
import { useW } from '@/hooks/useW';
import { Card, Badge, Btn, Input, Textarea, Modal } from '@/components/ui';
import { C, F } from '@/constants/theme';

const ROLE_LABEL = { admin: 'Admin', moderator: 'Moderatör', user: 'Üye' };
const ROLE_COLOR = { admin: 'red', moderator: 'blue', user: 'gold' };

export function ProfilePage({ queryParams }) {
  const { user, logout, deleteAccount } = useAuth();
  const { navigate } = useRouter();
  const { w, sm, xs } = useW();
  const { comments, perfumes, muadilPerfumes, brands, getUserFavoriteBrands, toggleBrandFavorite, getUserFavoritePerfumes, togglePerfumeFavorite, getUserFavoriteMuadils, toggleMuadilFavorite, getUserFavoriteComps, toggleCompFavorite } = useData();

  const tabInit = queryParams?.tab === 'favorites' ? 'favorites' : queryParams?.tab === 'reviews' ? 'reviews' : 'info';
  const [tab, setTab] = useState(tabInit);
  const [edit, setEdit] = useState(false);
  const [form, setForm] = useState({ name: user?.name || '', email: user?.email || '', bio: 'Koku meraklısı.' });
  const [saved, setSaved] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteErr, setDeleteErr] = useState('');

  if (!user) return (
    <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
      <div style={{ fontSize: '48px' }}>🔒</div>
      <h2 style={{ fontSize: '22px', fontWeight: 900, color: C.navy }}>Giriş Gerekli</h2>
      <Btn onClick={() => navigate('/giris')}>Giriş Yap</Btn>
    </div>
  );

  const myComments = comments.filter((c) => c.userId === user.uid || c.userId === user.id);
  const save = () => { setSaved(true); setEdit(false); setTimeout(() => setSaved(false), 3000); };

  const handleDeleteAccount = async () => {
    setDeleteLoading(true);
    setDeleteErr('');
    try {
      await deleteAccount();
      navigate('/');
    } catch (e) {
      if (e.code === 'auth/requires-recent-login') {
        setDeleteErr('Güvenlik nedeniyle hesabı silmeden önce çıkış yapıp tekrar giriş yapmanız gerekiyor.');
      } else {
        setDeleteErr('Hesap silinemedi. Tekrar deneyin.');
      }
      setDeleteLoading(false);
    }
  };

  const px = xs ? '16px' : sm ? '20px' : w >= 1280 ? '48px' : '32px';

  return (
    <div style={{ minHeight: '100vh', background: C.bg }}>
      {/* Hesap silme onay modalı */}
      <Modal open={showDeleteModal} onClose={() => { setShowDeleteModal(false); setDeleteErr(''); }} title="Hesabı Kalıcı Olarak Sil" width="440px">
        <div style={{ textAlign: 'center', padding: '8px 0 16px' }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#fff5f5', border: '2px solid #fc8181', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: '24px' }}>⚠</div>
          <p style={{ fontSize: '15px', fontWeight: 700, color: C.navy, marginBottom: '8px' }}>Emin misiniz?</p>
          <p style={{ fontSize: '13px', color: C.textLight, lineHeight: 1.7, marginBottom: '8px' }}>
            <strong style={{ color: C.text }}>{user.email}</strong> hesabı kalıcı olarak silinecek.<br />
            Bu işlem geri alınamaz. Yorumlarınız anonim olarak kalabilir.
          </p>
          {deleteErr && (
            <div style={{ background: '#fff5f5', border: '1px solid #fc8181', borderRadius: '10px', padding: '10px 14px', color: '#c53030', fontSize: '13px', marginBottom: '14px', textAlign: 'left' }}>
              ⚠ {deleteErr}
            </div>
          )}
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginTop: '6px' }}>
            <Btn variant="secondary" onClick={() => { setShowDeleteModal(false); setDeleteErr(''); }}>Vazgeç</Btn>
            <Btn variant="danger" onClick={handleDeleteAccount} disabled={deleteLoading}>
              {deleteLoading ? 'Siliniyor...' : 'Evet, Hesabımı Sil'}
            </Btn>
          </div>
        </div>
      </Modal>

      {/* Profile header */}
      <div style={{ background: `linear-gradient(135deg,${C.navy},${C.navyLight})`, padding: sm ? '28px 16px' : '40px 32px' }}>
        <div style={{ maxWidth: '960px', margin: '0 auto', display: 'flex', gap: sm ? '16px' : '22px', alignItems: sm ? 'flex-start' : 'center', flexWrap: 'wrap' }}>
          <div style={{ width: sm ? '56px' : '70px', height: sm ? '56px' : '70px', borderRadius: '50%', background: `linear-gradient(135deg,${C.gold},${C.goldLight})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: sm ? '20px' : '24px', color: '#fff', fontWeight: 900, flexShrink: 0 }}>
            {user.name?.[0]?.toUpperCase()}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: sm ? '20px' : '26px', fontWeight: 900, color: '#fff', marginBottom: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.name}</div>
            <div style={{ color: 'rgba(255,255,255,.6)', fontSize: '13px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.email}</div>
            <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}><Badge color={ROLE_COLOR[user.role]}>{ROLE_LABEL[user.role]}</Badge></div>
          </div>
          <Btn variant="danger" size={sm ? 'sm' : 'md'} onClick={() => { logout(); navigate('/'); }}>Çıkış Yap</Btn>
        </div>
      </div>

      <div style={{ maxWidth: '960px', margin: '0 auto', padding: sm ? '20px 16px' : `28px ${px}` }}>
        {/* Tabs — scrollable on mobile */}
        <div className="tabs-scroll" style={{ borderBottom: `1px solid ${C.border}`, marginBottom: '28px' }}>
          {[{ k: 'info', l: 'Bilgilerim' }, { k: 'favorites', l: 'Favorilerim' }, { k: 'reviews', l: 'Yorumlarım' }].map(({ k, l }) => (
            <button key={k} onClick={() => setTab(k)}
              style={{ background: 'none', border: 'none', borderBottom: `2px solid ${tab === k ? C.gold : 'transparent'}`, padding: '10px 16px', color: tab === k ? C.gold : C.textMid, fontSize: '14px', fontWeight: tab === k ? 700 : 500, cursor: 'pointer', fontFamily: F, marginBottom: '-1px', whiteSpace: 'nowrap', flexShrink: 0 }}>
              {l}
            </button>
          ))}
        </div>

        {tab === 'info' && (
          <div style={{ maxWidth: '480px' }}>
            {saved && <div style={{ background: C.greenBg, border: `1px solid ${C.greenBorder}`, borderRadius: '10px', padding: '11px 16px', color: C.green, marginBottom: '14px', fontSize: '13px' }}>✓ Bilgileriniz kaydedildi.</div>}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <h3 style={{ fontSize: '20px', fontWeight: 800, color: C.navy }}>Kişisel Bilgiler</h3>
              <Btn variant={edit ? 'primary' : 'ghost'} size="sm" onClick={() => edit ? save() : setEdit(true)}>{edit ? 'Kaydet' : 'Düzenle'}</Btn>
            </div>
            <Input label="Ad Soyad" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} disabled={!edit} />
            <Input label="E-posta" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} disabled={!edit} />
            <Textarea label="Hakkımda" value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} rows={3} />
            {edit && <Btn variant="secondary" size="sm" onClick={() => setEdit(false)}>İptal</Btn>}
            <div style={{ marginTop: '40px', paddingTop: '22px', borderTop: `1px solid ${C.border}` }}>
              <h3 style={{ fontSize: '18px', fontWeight: 700, color: C.navy, marginBottom: '12px' }}>Şifre Değiştir</h3>
              <Btn variant="ghost" onClick={() => navigate('/sifre-sifirla')}>Sıfırlama E-postası Gönder</Btn>
            </div>
            <div style={{ marginTop: '32px', paddingTop: '22px', borderTop: `1px solid ${C.border}` }}>
              <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#c53030', marginBottom: '6px' }}>Tehlikeli Bölge</h3>
              <p style={{ fontSize: '13px', color: C.textLight, marginBottom: '14px', lineHeight: 1.6 }}>
                Hesabınızı kalıcı olarak silmek istiyorsanız aşağıdaki butona tıklayın. Bu işlem geri alınamaz.
              </p>
              <Btn variant="danger" onClick={() => setShowDeleteModal(true)}>Hesabımı Kalıcı Olarak Sil</Btn>
            </div>
          </div>
        )}

        {tab === 'favorites' && (() => {
          const favBrandIds = getUserFavoriteBrands(user.uid || user.id);
          const favBrands = brands.filter((b) => favBrandIds.includes(b.id));
          const origFavBrands = favBrands.filter((b) => b.type === 'original');
          const muadilFavBrands = favBrands.filter((b) => b.type === 'muadil');
          const favPerfumeIds = getUserFavoritePerfumes(user.uid || user.id);
          const favPerfumes = perfumes.filter((p) => favPerfumeIds.includes(p.id));
          const favMuadilIds = getUserFavoriteMuadils(user.uid || user.id);
          const favMuadils = muadilPerfumes.filter((m) => favMuadilIds.includes(m.id));
          const favComps = getUserFavoriteComps(user.uid || user.id);
          const hasAny = favBrands.length || favPerfumes.length || favMuadils.length || favComps.length;

          if (!hasAny) return (
            <div style={{ textAlign: 'center', padding: sm ? '40px 20px' : '60px', color: C.textLight }}>
              <div style={{ fontSize: '40px', marginBottom: '12px' }}>🤍</div>
              <div style={{ fontSize: '16px', fontWeight: 600, color: C.navy, marginBottom: '8px' }}>Henüz favori eklenmedi</div>
              <Btn onClick={() => navigate('/markalar')}>Keşfetmeye Başla</Btn>
            </div>
          );

          const grid = { display: 'grid', gridTemplateColumns: xs ? '1fr' : 'repeat(auto-fill,minmax(200px,1fr))', gap: '12px' };
          const FavBtn = ({ onClick }) => (
            <button onClick={onClick} style={{ position: 'absolute', top: '10px', right: '10px', width: '26px', height: '26px', borderRadius: '50%', border: `1px solid ${C.redBorder}`, background: C.redBg, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '13px' }}>❤️</button>
          );

          const SectionTitle = ({ title, color, count }) => (
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: C.navy, marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ display: 'inline-block', width: '10px', height: '10px', borderRadius: '50%', background: color }} />
              {title} ({count})
            </h3>
          );

          return (
            <div>
              {origFavBrands.length > 0 && (
                <div style={{ marginBottom: '28px' }}>
                  <SectionTitle title="Orijinal Markalar" color={C.gold} count={origFavBrands.length} />
                  <div style={grid}>
                    {origFavBrands.map((b) => (
                      <Card key={b.id} hover style={{ padding: '16px', cursor: 'pointer', position: 'relative' }} onClick={() => navigate(`/marka/${b.slug}`)}>
                        <FavBtn onClick={(e) => { e.stopPropagation(); toggleBrandFavorite(user.uid || user.id, b.id); }} />
                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                          <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: C.goldBg, border: `1px solid ${C.goldBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 800, color: C.gold, flexShrink: 0 }}>{b.logo}</div>
                          <div style={{ paddingRight: '24px', minWidth: 0 }}>
                            <div style={{ fontWeight: 700, fontSize: '14px', color: C.navy, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.name}</div>
                            <div style={{ fontSize: '12px', color: C.textMid }}>{b.origin} · {b.founded}</div>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {muadilFavBrands.length > 0 && (
                <div style={{ marginBottom: '28px' }}>
                  <SectionTitle title="Muadil Markalar" color={C.green} count={muadilFavBrands.length} />
                  <div style={grid}>
                    {muadilFavBrands.map((b) => (
                      <Card key={b.id} hover style={{ padding: '16px', cursor: 'pointer', position: 'relative' }} onClick={() => navigate(`/marka/${b.slug}`)}>
                        <FavBtn onClick={(e) => { e.stopPropagation(); toggleBrandFavorite(user.uid || user.id, b.id); }} />
                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                          <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: C.greenBg, border: `1px solid ${C.greenBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 800, color: C.green, flexShrink: 0 }}>{b.logo}</div>
                          <div style={{ paddingRight: '24px', minWidth: 0 }}>
                            <div style={{ fontWeight: 700, fontSize: '14px', color: C.navy, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.name}</div>
                            <div style={{ fontSize: '12px', color: C.textMid }}>{b.origin} · {b.founded}</div>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {favPerfumes.length > 0 && (
                <div style={{ marginBottom: '28px' }}>
                  <SectionTitle title="Orijinal Parfümler" color={C.gold} count={favPerfumes.length} />
                  <div style={grid}>
                    {favPerfumes.map((p) => (
                      <Card key={p.id} hover style={{ padding: '16px', cursor: 'pointer', position: 'relative' }} onClick={() => navigate(`/${p.brandSlug}/${p.slug}`)}>
                        <FavBtn onClick={(e) => { e.stopPropagation(); togglePerfumeFavorite(user.uid || user.id, p.id); }} />
                        <div style={{ fontWeight: 700, fontSize: '14px', color: C.navy, paddingRight: '28px', marginBottom: '3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
                        <div style={{ fontSize: '12px', color: C.textMid }}>{p.brandName} · {p.year}</div>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {favMuadils.length > 0 && (
                <div style={{ marginBottom: '28px' }}>
                  <SectionTitle title="Muadil Parfümler" color={C.green} count={favMuadils.length} />
                  <div style={grid}>
                    {favMuadils.map((m) => (
                      <Card key={m.id} hover style={{ padding: '16px', cursor: 'pointer', position: 'relative' }} onClick={() => navigate(`/karsilastir?orijinal=${m.targetPerfumeId}&muadil=${m.id}`)}>
                        <FavBtn onClick={(e) => { e.stopPropagation(); toggleMuadilFavorite(user.uid || user.id, m.id); }} />
                        <div style={{ fontWeight: 700, fontSize: '14px', color: C.navy, paddingRight: '28px', marginBottom: '3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.name}</div>
                        <div style={{ fontSize: '12px', color: C.green, fontWeight: 600, marginBottom: '2px' }}>{m.brandName}</div>
                        <div style={{ fontSize: '12px', color: C.textLight }}>→ {m.targetBrandName} {m.targetPerfumeName}</div>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {favComps.length > 0 && (
                <div style={{ marginBottom: '28px' }}>
                  <SectionTitle title="Karşılaştırmalar" color={C.navy} count={favComps.length} />
                  <div style={{ display: 'grid', gridTemplateColumns: xs ? '1fr' : 'repeat(auto-fill,minmax(240px,1fr))', gap: '12px' }}>
                    {favComps.map(({ origId, muadilId }) => {
                      const orig = perfumes.find((p) => String(p.id) === String(origId));
                      const muadil = muadilPerfumes.find((m) => String(m.id) === String(muadilId));
                      if (!orig || !muadil) return null;
                      return (
                        <Card key={`${origId}_${muadilId}`} hover style={{ padding: '16px', cursor: 'pointer', position: 'relative' }} onClick={() => navigate(`/karsilastir?orijinal=${origId}&muadil=${muadilId}`)}>
                          <FavBtn onClick={(e) => { e.stopPropagation(); toggleCompFavorite(user.uid || user.id, origId, muadilId); }} />
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', paddingRight: '28px' }}>
                            <div>
                              <div style={{ fontSize: '11px', color: C.textLight, fontWeight: 600, marginBottom: '2px' }}>ORİJİNAL</div>
                              <div style={{ fontWeight: 700, fontSize: '13px', color: C.navy, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{orig.brandName} — {orig.name}</div>
                            </div>
                            <div style={{ height: '1px', background: C.borderLight }} />
                            <div>
                              <div style={{ fontSize: '11px', color: C.textLight, fontWeight: 600, marginBottom: '2px' }}>MUADİL</div>
                              <div style={{ fontWeight: 700, fontSize: '13px', color: C.green, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{muadil.brandName} — {muadil.name}</div>
                            </div>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })()}

        {tab === 'reviews' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {!myComments.length && <div style={{ textAlign: 'center', padding: sm ? '40px 20px' : '60px', color: C.textLight }}>Henüz yorum yapmadınız.</div>}
            {myComments.map((c) => {
              const mp = muadilPerfumes.find((m) => m.id === c.muadilPerfumeId || m.id === c.muadilId);
              return (
                <Card key={c.id} style={{ padding: sm ? '14px 16px' : '18px 22px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px', gap: '8px', flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 700, color: C.navy, fontSize: '15px', flex: 1, minWidth: 0 }}>{mp ? `${mp.brandName} — ${mp.name}` : 'Parfüm'}</span>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexShrink: 0 }}>
                      <Badge color={c.status === 'approved' ? 'green' : 'orange'}>{c.status === 'approved' ? 'Yayında' : 'Onay Bekliyor'}</Badge>
                      <span style={{ fontSize: '12px', color: C.textLight }}>{c.date}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '10px', fontSize: '12px', color: C.textMid, marginBottom: '8px', flexWrap: 'wrap' }}>
                    <span>Benzerlik <strong style={{ color: C.gold }}>{c.similarity}/10</strong></span>
                    <span>Yayılım <strong style={{ color: C.gold }}>{c.projection}/10</strong></span>
                    <span>Kalıcılık <strong style={{ color: C.gold }}>{c.longevity}/10</strong></span>
                  </div>
                  <p style={{ fontSize: '14px', color: C.text, lineHeight: 1.6 }}>{c.text}</p>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
