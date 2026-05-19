import { useState, useRef, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from '@/contexts/RouterContext';
import { useData } from '@/contexts/DataContext';
import { useW } from '@/hooks/useW';
import { Card, Badge, Btn, Input, Textarea, Modal } from '@/components/ui';
import { C, F } from '@/constants/theme';

function getCroppedImg(src, pixelCrop, outputSize = 240) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = outputSize;
        canvas.height = outputSize;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(
          img,
          Math.round(pixelCrop.x), Math.round(pixelCrop.y),
          Math.round(pixelCrop.width), Math.round(pixelCrop.height),
          0, 0, outputSize, outputSize
        );
        resolve(canvas.toDataURL('image/jpeg', 0.88));
      } catch (e) {
        reject(e);
      }
    };
    img.onerror = reject;
    img.src = src;
  });
}

const ROLE_LABEL = { admin: 'Admin', moderator: 'Moderatör', user: 'Üye' };
const ROLE_COLOR = { admin: 'red', moderator: 'blue', user: 'gold' };

export function ProfilePage({ queryParams }) {
  const { user, logout, deleteAccount, updateProfilePhoto, deleteProfilePhoto } = useAuth();

  const { navigate } = useRouter();
  const { w, sm, xs } = useW();
  const { comments, perfumes, muadilPerfumes, brands, getUserFavoriteBrands, toggleBrandFavorite, getUserFavoritePerfumes, togglePerfumeFavorite, getUserFavoriteMuadils, toggleMuadilFavorite, getUserFavoriteComps, toggleCompFavorite, deleteComment } = useData();

  const tabInit = queryParams?.tab === 'favorites' ? 'favorites' : queryParams?.tab === 'reviews' ? 'reviews' : 'info';
  const [tab, setTab] = useState(tabInit);
  const [edit, setEdit] = useState(false);
  const [form, setForm] = useState({ name: user?.name || '', email: user?.email || '', bio: 'Koku meraklısı.' });
  const [saved, setSaved] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [confirmDeleteCommentId, setConfirmDeleteCommentId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteErr, setDeleteErr] = useState('');
  const [photoLoading, setPhotoLoading] = useState(false);
  const [photoErr, setPhotoErr] = useState('');
  const [avatarHover, setAvatarHover] = useState(false);
  const fileInputRef = useRef(null);
  const [cropSrc, setCropSrc] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [cropLoading, setCropLoading] = useState(false);
  const [cropErr, setCropErr] = useState('');

  if (!user) return (
    <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
      <div style={{ fontSize: '48px' }}>🔒</div>
      <h2 style={{ fontSize: '22px', fontWeight: 900, color: C.navy }}>Giriş Gerekli</h2>
      <Btn onClick={() => navigate('/giris')}>Giriş Yap</Btn>
    </div>
  );

  const myComments = comments.filter((c) => c.userId === user.uid || c.userId === user.id);
  const save = () => { setSaved(true); setEdit(false); setTimeout(() => setSaved(false), 3000); };

  const onCropComplete = useCallback((_, pixels) => { setCroppedAreaPixels(pixels); }, []);

  const MAX_MB = 2;

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    const mb = file.size / 1024 / 1024;
    if (mb > MAX_MB) { setPhotoErr(`Dosya boyutu ${mb.toFixed(1)} MB — maksimum ${MAX_MB} MB olabilir.`); return; }
    if (!file.type.startsWith('image/')) { setPhotoErr('Lütfen geçerli bir görsel dosyası seçin (JPG, PNG, WEBP).'); return; }
    setPhotoErr('');
    setCropErr('');
    const reader = new FileReader();
    reader.onload = (ev) => {
      setCropSrc(ev.target.result);
      setCrop({ x: 0, y: 0 });
      setZoom(1);
    };
    reader.readAsDataURL(file);
  };

  const handleCropSave = async () => {
    if (!cropSrc || !croppedAreaPixels) return;
    setCropLoading(true);
    setCropErr('');
    try {
      const dataUrl = await getCroppedImg(cropSrc, croppedAreaPixels);
      await updateProfilePhoto(dataUrl);
      setCropSrc(null);
    } catch (err) {
      setCropErr('Fotoğraf kaydedilemedi. Lütfen tekrar deneyin.');
    } finally {
      setCropLoading(false);
    }
  };

  const handleCropCancel = () => {
    setCropSrc(null);
    setCropErr('');
  };

  const handleDeletePhoto = async () => {
    setPhotoErr('');
    setPhotoLoading(true);
    try { await deleteProfilePhoto(); } catch (_) { setPhotoErr('Fotoğraf silinemedi.'); }
    finally { setPhotoLoading(false); }
  };

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
      {/* Fotoğraf kırpma modalı */}
      {cropSrc && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.75)', zIndex: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ background: '#fff', borderRadius: '20px', width: '100%', maxWidth: '420px', overflow: 'hidden', boxShadow: '0 24px 60px rgba(0,0,0,.4)' }}>
            <div style={{ padding: '14px 18px', borderBottom: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 800, fontSize: '15px', color: C.navy }}>Profil Fotoğrafı</span>
              <button onClick={handleCropCancel} style={{ background: 'none', border: 'none', fontSize: '22px', cursor: 'pointer', color: C.textLight, lineHeight: 1, padding: '0 4px' }}>×</button>
            </div>
            <div style={{ position: 'relative', height: '300px', background: '#1a1a1a' }}>
              <Cropper
                image={cropSrc}
                crop={crop}
                zoom={zoom}
                aspect={1}
                cropShape="round"
                showGrid={false}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
              />
            </div>
            <div style={{ padding: '14px 18px' }}>
              {/* Zoom slider */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.textLight} strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                <input type="range" min={1} max={3} step={0.05} value={zoom} onChange={(e) => setZoom(Number(e.target.value))} style={{ flex: 1, accentColor: C.gold, cursor: 'pointer' }} />
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={C.textLight} strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
              </div>
              {/* Gereksinimler */}
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '12px' }}>
                {[`Maks. ${MAX_MB} MB`, 'JPG · PNG · WEBP', 'Kare kırpılır'].map((t) => (
                  <span key={t} style={{ fontSize: '11px', color: C.textLight, background: C.bg, borderRadius: '6px', padding: '3px 8px', border: `1px solid ${C.border}` }}>{t}</span>
                ))}
              </div>
              {/* Hata */}
              {cropErr && (
                <div style={{ background: '#fff5f5', border: '1px solid #fc8181', borderRadius: '8px', padding: '8px 12px', color: '#c53030', fontSize: '12px', marginBottom: '10px' }}>
                  ⚠ {cropErr}
                </div>
              )}
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                <Btn variant="secondary" size="sm" onClick={handleCropCancel} disabled={cropLoading}>İptal</Btn>
                <Btn size="sm" onClick={handleCropSave} disabled={cropLoading}>
                  {cropLoading ? 'Kaydediliyor...' : 'Kırp ve Kaydet'}
                </Btn>
              </div>
            </div>
          </div>
        </div>
      )}

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
          {/* Avatar */}
          <div style={{ position: 'relative', flexShrink: 0 }}
            onMouseEnter={() => setAvatarHover(true)}
            onMouseLeave={() => setAvatarHover(false)}
          >
            <div
              onClick={() => !photoLoading && fileInputRef.current?.click()}
              style={{ width: sm ? '64px' : '80px', height: sm ? '64px' : '80px', borderRadius: '50%', background: `linear-gradient(135deg,${C.gold},${C.goldLight})`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', overflow: 'hidden', position: 'relative', border: '3px solid rgba(255,255,255,.25)' }}
            >
              {user.photoURL
                ? <img src={user.photoURL} alt={user.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                : <svg width={sm ? 22 : 28} height={sm ? 22 : 28} viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.85)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
              }
              {(avatarHover || photoLoading) && (
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.45)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '3px' }}>
                  {photoLoading
                    ? <div style={{ width: '18px', height: '18px', border: '2px solid rgba(255,255,255,.4)', borderTop: '2px solid #fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                    : <>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
                        {!sm && <span style={{ fontSize: '9px', color: 'rgba(255,255,255,.9)', fontWeight: 700, letterSpacing: '.02em' }}>{user.photoURL ? 'Değiştir' : 'Ekle'}</span>}
                      </>
                  }
                </div>
              )}
            </div>
            {user.photoURL && !photoLoading && (
              <button
                onClick={(e) => { e.stopPropagation(); handleDeletePhoto(); }}
                style={{ position: 'absolute', top: '0px', right: '0px', width: '20px', height: '20px', borderRadius: '50%', background: '#e53e3e', border: '2px solid rgba(255,255,255,.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '12px', color: '#fff', fontFamily: F, lineHeight: 1, padding: 0 }}
              >×</button>
            )}
            <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePhotoChange} />
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
        {photoErr && (
          <div style={{ background: '#fff5f5', border: '1px solid #fc8181', borderRadius: '10px', padding: '10px 14px', color: '#c53030', fontSize: '13px', marginBottom: '16px' }}>
            ⚠ {photoErr}
          </div>
        )}
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
                      {confirmDeleteCommentId === c.id
                        ? <span style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                            <button onClick={async () => { await deleteComment(c.id); setConfirmDeleteCommentId(null); }}
                              style={{ fontSize: '11px', fontWeight: 700, color: '#fff', background: '#e53e3e', border: 'none', borderRadius: '5px', padding: '2px 8px', cursor: 'pointer', fontFamily: F }}>Sil</button>
                            <button onClick={() => setConfirmDeleteCommentId(null)}
                              style={{ fontSize: '11px', color: C.textMid, background: '#f0f0f0', border: 'none', borderRadius: '5px', padding: '2px 8px', cursor: 'pointer', fontFamily: F }}>Vazgeç</button>
                          </span>
                        : <button onClick={() => setConfirmDeleteCommentId(c.id)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', color: C.textLight, display: 'flex', alignItems: 'center', opacity: 0.6 }}
                            title="Yorumu sil">
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                          </button>
                      }
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
