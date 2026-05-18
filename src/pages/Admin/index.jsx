import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from '@/contexts/RouterContext';
import { useData } from '@/contexts/DataContext';
import { calcScores } from '@/utils/scoring';
import { slugify } from '@/utils/strings';
import { Card, Badge, Btn, Modal, Input, Select, Textarea } from '@/components/ui';
import { GenderBadge } from '@/components/shared';
import { C, F } from '@/constants/theme';

const RL = { admin: 'Admin', moderator: 'Moderatör', user: 'Üye' };
const RC = { admin: 'red', moderator: 'blue', user: 'gold' };

const thBase = { padding: '11px 14px', textAlign: 'left', fontSize: '12px', fontWeight: 700, color: C.textLight, letterSpacing: '.05em', textTransform: 'uppercase', borderBottom: `1px solid ${C.border}` };

function SortTh({ label, sortKey, sort, onSort }) {
  const active = sort.key === sortKey;
  return (
    <th onClick={() => sortKey && onSort(sortKey)} style={{ ...thBase, cursor: sortKey ? 'pointer' : 'default', userSelect: 'none', whiteSpace: 'nowrap', background: active ? '#f0f0f8' : undefined }}>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
        {label}
        {sortKey && <span style={{ fontSize: '11px', color: active ? C.navy : C.textLight, fontWeight: 700 }}>{active ? (sort.dir === 'asc' ? ' ↑' : ' ↓') : ' ↕'}</span>}
      </span>
    </th>
  );
}

function SearchBar({ value, onChange, placeholder, count, total }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', borderBottom: `1px solid ${C.border}`, background: '#fafafa' }}>
      <div style={{ position: 'relative', flex: 1, maxWidth: '340px' }}>
        <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: C.textLight, fontSize: '14px', pointerEvents: 'none' }}>🔍</span>
        <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} style={{ width: '100%', paddingLeft: '32px', paddingRight: '10px', height: '34px', border: `1px solid ${C.border}`, borderRadius: '8px', fontSize: '13px', color: C.text, background: '#fff', outline: 'none', fontFamily: F, boxSizing: 'border-box' }} />
      </div>
      {value && <button onClick={() => onChange('')} style={{ fontSize: '12px', color: C.textLight, background: 'none', border: 'none', cursor: 'pointer', fontFamily: F }}>Temizle</button>}
      <span style={{ fontSize: '12px', color: C.textLight, marginLeft: 'auto' }}>{count} / {total} kayıt</span>
    </div>
  );
}

const TABS = [
  { k: 'dashboard', l: 'Genel Bakış' },
  { k: 'users', l: 'Kullanıcılar' },
  { k: 'original-brands', l: 'Orijinal Markalar' },
  { k: 'muadil-brands', l: 'Muadil Markalar' },
  { k: 'perfumes', l: 'Orijinal Parfümler' },
  { k: 'muadil', l: 'Muadil Parfümler' },
  { k: 'slider', l: 'Ana Sayfa Slider' },
];

function SliderTab({ sliderImages, addSliderImage, removeSliderImage, reorderSliderImages, MAX_SLIDER, MAX_SIZE_MB }) {
  const [dragOver, setDragOver] = useState(false);
  const [dragIdx, setDragIdx] = useState(null);
  const [error, setError] = useState('');

  const processFiles = (files) => {
    setError('');
    const arr = Array.from(files);
    const remaining = MAX_SLIDER - sliderImages.length;
    if (arr.length > remaining) setError(`En fazla ${MAX_SLIDER} görsel eklenebilir. ${arr.length - remaining} görsel atlandı.`);
    arr.slice(0, remaining).forEach((file) => {
      if (!file.type.startsWith('image/')) { setError('Sadece görsel dosyaları (JPG, PNG, WebP) kabul edilir.'); return; }
      if (file.size > MAX_SIZE_MB * 1024 * 1024) { setError(`"${file.name}" ${MAX_SIZE_MB}MB sınırını aşıyor.`); return; }
      const reader = new FileReader();
      reader.onload = (e) => addSliderImage({ id: Date.now() + Math.random(), src: e.target.result, name: file.name });
      reader.readAsDataURL(file);
    });
  };

  const onDrop = (e) => { e.preventDefault(); setDragOver(false); processFiles(e.dataTransfer.files); };
  const onDragStartItem = (i) => setDragIdx(i);
  const onDragOverItem = (e, i) => {
    e.preventDefault();
    if (dragIdx === null || dragIdx === i) return;
    const next = [...sliderImages];
    const [moved] = next.splice(dragIdx, 1);
    next.splice(i, 0, moved);
    reorderSliderImages(next);
    setDragIdx(i);
  };

  return (
    <div>
      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 800, color: C.navy, marginBottom: '4px' }}>Ana Sayfa Slider Görselleri</h2>
        <p style={{ fontSize: '13px', color: C.textLight }}>En fazla {MAX_SLIDER} görsel · Maks. {MAX_SIZE_MB}MB/görsel · Önerilen: 1920×1080px · Sürükle-bırak ile sıra değiştir</p>
      </div>

      {sliderImages.length < MAX_SLIDER && (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          onClick={() => document.getElementById('slider-file-input').click()}
          style={{ border: `2px dashed ${dragOver ? C.gold : C.border}`, borderRadius: '14px', padding: '40px', textAlign: 'center', cursor: 'pointer', background: dragOver ? C.goldBg : '#fafafa', transition: 'all .2s', marginBottom: '20px' }}>
          <input id="slider-file-input" type="file" accept="image/jpeg,image/png,image/webp" multiple style={{ display: 'none' }} onChange={(e) => processFiles(e.target.files)} />
          <div style={{ fontSize: '36px', marginBottom: '10px' }}>🖼️</div>
          <div style={{ fontSize: '15px', fontWeight: 700, color: C.navy, marginBottom: '6px' }}>Görselleri buraya sürükleyin veya tıklayın</div>
          <div style={{ fontSize: '12px', color: C.textLight }}>{sliderImages.length}/{MAX_SLIDER} görsel · JPG, PNG, WebP · Maks. {MAX_SIZE_MB}MB</div>
        </div>
      )}

      {error && (
        <div style={{ background: '#fff5f5', border: '1px solid #fecaca', borderRadius: '10px', padding: '10px 14px', fontSize: '13px', color: C.red, marginBottom: '16px' }}>{error}</div>
      )}

      {sliderImages.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '14px' }}>
          {sliderImages.map((img, i) => (
            <div key={img.id} draggable
              onDragStart={() => onDragStartItem(i)}
              onDragOver={(e) => onDragOverItem(e, i)}
              onDragEnd={() => setDragIdx(null)}
              style={{ borderRadius: '12px', overflow: 'hidden', border: `2px solid ${dragIdx === i ? C.gold : C.border}`, cursor: 'grab', position: 'relative', boxShadow: dragIdx === i ? `0 6px 24px rgba(184,150,90,.35)` : 'none', transition: 'box-shadow .15s', userSelect: 'none' }}>
              <img src={img.src} alt={img.name} style={{ width: '100%', aspectRatio: '16/9', objectFit: 'cover', display: 'block', opacity: dragIdx === i ? 0.55 : 1, transition: 'opacity .15s' }} />
              <div style={{ position: 'absolute', top: '8px', left: '8px', background: 'rgba(0,0,0,.6)', borderRadius: '6px', padding: '3px 9px', fontSize: '12px', fontWeight: 800, color: '#fff' }}>{i + 1}</div>
              <div style={{ position: 'absolute', top: '8px', right: '8px', background: 'rgba(0,0,0,.4)', borderRadius: '6px', padding: '3px 7px', fontSize: '13px', color: 'rgba(255,255,255,.7)', cursor: 'grab' }}>⠿</div>
              <div style={{ padding: '8px 12px', background: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '12px', color: C.textMid, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{img.name}</span>
                <button onClick={() => removeSliderImage(img.id)} style={{ background: '#fff5f5', border: '1px solid #fecaca', borderRadius: '6px', padding: '3px 9px', fontSize: '11px', color: C.red, cursor: 'pointer', fontFamily: F, fontWeight: 700, flexShrink: 0 }}>Sil</button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '50px', color: C.textLight, fontSize: '14px', background: '#fafafa', borderRadius: '14px', border: `1px dashed ${C.border}` }}>
          Henüz görsel eklenmedi. Görsel eklenene kadar landing page varsayılan görünümünü gösterir.
        </div>
      )}
    </div>
  );
}

export function AdminPanel() {
  const { isAdmin } = useAuth();
  const { navigate } = useRouter();
  const { brands, perfumes, muadilPerfumes, users, comments, addBrand, updateUser, deleteUser, addPerfume, updatePerfume, deletePerfume, addMuadil, updateMuadil, deleteMuadil, updateBrand, deleteBrand, sliderImages, addSliderImage, removeSliderImage, reorderSliderImages, MAX_SLIDER, MAX_SIZE_MB } = useData();

  const [tab, setTabRaw] = useState('dashboard');
  const [sort, setSort] = useState({ key: '', dir: 'asc' });
  const [search, setSearch] = useState('');
  const setTab = (t) => { setTabRaw(t); setSort({ key: '', dir: 'asc' }); setSearch(''); };

  const toggleSort = (key) => setSort((s) => s.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' });

  const applySort = (arr, keyFn) => {
    if (!sort.key) return arr;
    return [...arr].sort((a, b) => {
      const av = keyFn(a, sort.key) ?? '';
      const bv = keyFn(b, sort.key) ?? '';
      const cmp = typeof av === 'number' && typeof bv === 'number' ? av - bv : String(av).localeCompare(String(bv), 'tr');
      return sort.dir === 'asc' ? cmp : -cmp;
    });
  };

  const [showBM, setShowBM] = useState(false);
  const [showPM, setShowPM] = useState(false);
  const [showMM, setShowMM] = useState(false);
  const [selUser, setSelUser] = useState(null);
  const [selPerf, setSelPerf] = useState(null);
  const [selMuadil, setSelMuadil] = useState(null);
  const [delTarget, setDelTarget] = useState(null);
  const [selBrand, setSelBrand] = useState(null);
  const [ebf, setEbf] = useState(null);
  const [bf, setBf] = useState({ name: '', slug: '', type: 'original', origin: '', founded: '', logo: '', category: 'Lüks', bio: '' });
  const [pf, setPf] = useState({ name: '', slug: '', brandId: '', gender: 'Erkek', year: '', description: '', topNotes: '', heartNotes: '', baseNotes: '' });
  const [mf, setMf] = useState({ name: '', slug: '', brandId: '', targetPerfumeId: '', description: '' });
  const [ef, setEf] = useState(null);
  const [emf, setEmf] = useState(null);

  if (!isAdmin) return <div style={{ padding: '60px', textAlign: 'center', color: C.textLight }}>Erişim yetkisi yok.</div>;

  const stats = [
    { label: 'Toplam Kullanıcı', val: users.length, icon: '👥', color: C.blue },
    { label: 'Orijinal Parfüm', val: perfumes.length, icon: '🧴', color: C.gold },
    { label: 'Muadil Parfüm', val: muadilPerfumes.length, icon: '✨', color: C.green },
    { label: 'Bekleyen Yorum', val: comments.filter((c) => c.status === 'pending').length, icon: '💬', color: C.orange },
  ];

  const sbrand = () => {
    if (!bf.name) return;
    addBrand({ ...bf, slug: bf.slug || slugify(bf.name), founded: Number(bf.founded) || 2000 });
    setBf({ name: '', slug: '', type: 'original', origin: '', founded: '', logo: '', category: 'Lüks', bio: '' });
    setShowBM(false);
  };

  const sperf = () => {
    if (!pf.name || !pf.brandId) return;
    const b = brands.find((x) => x.id === Number(pf.brandId));
    addPerfume({ ...pf, brandId: Number(pf.brandId), slug: pf.slug || slugify(pf.name), brandSlug: b?.slug || '', brandName: b?.name || '', year: Number(pf.year) || 2020, notes: { top: (pf.topNotes || '').split(',').map((s) => s.trim()).filter(Boolean), heart: (pf.heartNotes || '').split(',').map((s) => s.trim()).filter(Boolean), base: (pf.baseNotes || '').split(',').map((s) => s.trim()).filter(Boolean) }, image: 'floral' });
    setPf({ name: '', slug: '', brandId: '', gender: 'Erkek', year: '', description: '', topNotes: '', heartNotes: '', baseNotes: '' });
    setShowPM(false);
  };

  const smuadil = () => {
    if (!mf.name || !mf.brandId || !mf.targetPerfumeId) return;
    const b = brands.find((x) => x.id === Number(mf.brandId));
    const t = perfumes.find((x) => x.id === Number(mf.targetPerfumeId));
    addMuadil({ ...mf, brandId: Number(mf.brandId), targetPerfumeId: Number(mf.targetPerfumeId), slug: mf.slug || slugify(mf.name), brandSlug: b?.slug || '', brandName: b?.name || '', targetPerfumeName: t?.name || '', targetBrandName: t?.brandName || '' });
    setMf({ name: '', slug: '', brandId: '', targetPerfumeId: '', description: '' });
    setShowMM(false);
  };

  const openEditBrand = (b) => {
    setSelBrand(b);
    setEbf({ name: b.name, slug: b.slug, type: b.type, origin: b.origin || '', founded: String(b.founded || ''), logo: b.logo || '', category: b.category || 'Lüks', bio: b.bio || '' });
  };

  const saveBrand = () => {
    if (!ebf.name) return;
    updateBrand(selBrand.id, { ...ebf, founded: Number(ebf.founded) || selBrand.founded });
    setSelBrand(null);
    setEbf(null);
  };

  const openEditPerf = (p) => {
    setSelPerf(p);
    setEf({ name: p.name, slug: p.slug, brandId: String(p.brandId), gender: p.gender, year: String(p.year || ''), description: p.description || '', topNotes: (p.notes?.top || []).join(', '), heartNotes: (p.notes?.heart || []).join(', '), baseNotes: (p.notes?.base || []).join(', ') });
  };

  const savePerf = () => {
    if (!ef.name || !ef.brandId) return;
    const b = brands.find((x) => x.id === Number(ef.brandId));
    updatePerfume(selPerf.id, { ...ef, brandId: Number(ef.brandId), brandSlug: b?.slug || selPerf.brandSlug, brandName: b?.name || selPerf.brandName, year: Number(ef.year) || selPerf.year, notes: { top: (ef.topNotes || '').split(',').map((s) => s.trim()).filter(Boolean), heart: (ef.heartNotes || '').split(',').map((s) => s.trim()).filter(Boolean), base: (ef.baseNotes || '').split(',').map((s) => s.trim()).filter(Boolean) } });
    setSelPerf(null);
    setEf(null);
  };

  const openEditMuadil = (m) => {
    setSelMuadil(m);
    setEmf({ name: m.name, slug: m.slug, brandId: String(m.brandId), targetPerfumeId: String(m.targetPerfumeId), description: m.description || '' });
  };

  const saveMuadil = () => {
    if (!emf.name || !emf.brandId || !emf.targetPerfumeId) return;
    const b = brands.find((x) => x.id === Number(emf.brandId));
    const t = perfumes.find((x) => x.id === Number(emf.targetPerfumeId));
    updateMuadil(selMuadil.id, { ...emf, brandId: Number(emf.brandId), targetPerfumeId: Number(emf.targetPerfumeId), brandSlug: b?.slug || selMuadil.brandSlug, brandName: b?.name || selMuadil.brandName, targetPerfumeName: t?.name || selMuadil.targetPerfumeName, targetBrandName: t?.brandName || selMuadil.targetBrandName });
    setSelMuadil(null);
    setEmf(null);
  };

  const thStyle = thBase;
  const tdStyle = { padding: '11px 14px' };

  return (
    <div style={{ minHeight: '100vh', background: C.bg }}>
      <div style={{ background: C.navy, padding: '22px 32px' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: '22px', fontWeight: 900, color: '#fff' }}>Admin Paneli</h1>
            <p style={{ color: 'rgba(255,255,255,.5)', fontSize: '13px' }}>muadilci.com yönetim merkezi</p>
          </div>
          <Btn variant="ghost" style={{ borderColor: 'rgba(255,255,255,.3)', color: '#fff' }} onClick={() => navigate('/')}>← Siteye Dön</Btn>
        </div>
      </div>

      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '26px 32px' }}>
        <div style={{ display: 'flex', gap: '4px', marginBottom: '26px', background: C.card, border: `1px solid ${C.border}`, borderRadius: '12px', padding: '4px', width: 'fit-content' }}>
          {TABS.map(({ k, l }) => (
            <button key={k} onClick={() => setTab(k)} style={{ padding: '8px 16px', borderRadius: '9px', border: 'none', background: tab === k ? C.navy : 'transparent', color: tab === k ? '#fff' : C.textMid, fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: F, whiteSpace: 'nowrap' }}>{l}</button>
          ))}
        </div>

        {/* Dashboard */}
        {tab === 'dashboard' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: '14px', marginBottom: '26px' }}>
              {stats.map((s) => (
                <Card key={s.label} style={{ padding: '18px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}><span style={{ fontSize: '13px', color: C.textLight }}>{s.label}</span><span style={{ fontSize: '22px' }}>{s.icon}</span></div>
                  <div style={{ fontSize: '30px', fontWeight: 900, color: s.color }}>{s.val}</div>
                </Card>
              ))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '18px' }}>
              <Card style={{ padding: '20px' }}>
                <h3 style={{ fontWeight: 700, color: C.navy, marginBottom: '12px' }}>Son Kullanıcılar</h3>
                {users.slice(-4).reverse().map((u) => (
                  <div key={u.id} style={{ display: 'flex', gap: '10px', alignItems: 'center', paddingBottom: '10px', marginBottom: '10px', borderBottom: `1px solid ${C.borderLight}` }}>
                    <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: C.goldBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 700, color: C.gold }}>{u.avatar}</div>
                    <div style={{ flex: 1 }}><div style={{ fontSize: '13px', fontWeight: 600, color: C.text }}>{u.name}</div><div style={{ fontSize: '12px', color: C.textLight }}>{u.email}</div></div>
                    <Badge color={RC[u.role]}>{RL[u.role]}</Badge>
                  </div>
                ))}
              </Card>
              <Card style={{ padding: '20px' }}>
                <h3 style={{ fontWeight: 700, color: C.navy, marginBottom: '12px' }}>Bekleyen Yorumlar</h3>
                {comments.filter((c) => c.status === 'pending').slice(0, 4).map((c) => (
                  <div key={c.id} style={{ paddingBottom: '10px', marginBottom: '10px', borderBottom: `1px solid ${C.borderLight}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                      <span style={{ fontSize: '13px', fontWeight: 600, color: C.text }}>{c.userName}</span>
                      <Badge color="orange">Bekliyor</Badge>
                    </div>
                    <p style={{ fontSize: '12px', color: C.textMid, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.text}</p>
                  </div>
                ))}
                {!comments.filter((c) => c.status === 'pending').length && <div style={{ color: C.textLight, fontSize: '14px', textAlign: 'center', padding: '16px' }}>Bekleyen yorum yok ✓</div>}
              </Card>
            </div>
          </div>
        )}

        {/* Users */}
        {tab === 'users' && (() => {
          const q = search.toLowerCase();
          const filtered = users.filter((u) => !q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || RL[u.role].toLowerCase().includes(q));
          const sorted = applySort(filtered, (u, k) => ({ name: u.name, email: u.email, role: RL[u.role], active: u.active ? 'Aktif' : 'Dondurulmuş' })[k]);
          return (
            <Card style={{ overflow: 'hidden' }}>
              <div style={{ padding: '14px 18px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center' }}><span style={{ fontWeight: 700, color: C.navy }}>Kullanıcılar</span></div>
              <SearchBar value={search} onChange={setSearch} placeholder="İsim, e-posta veya rol ara…" count={sorted.length} total={users.length} />
              <div style={{ overflow: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead><tr style={{ background: '#f9f9fb' }}>
                    <SortTh label="Kullanıcı" sortKey="name" sort={sort} onSort={toggleSort} />
                    <SortTh label="E-posta" sortKey="email" sort={sort} onSort={toggleSort} />
                    <SortTh label="Rol" sortKey="role" sort={sort} onSort={toggleSort} />
                    <SortTh label="Durum" sortKey="active" sort={sort} onSort={toggleSort} />
                    <th style={thStyle}>İşlemler</th>
                  </tr></thead>
                  <tbody>
                    {sorted.map((u) => (
                      <tr key={u.id} style={{ borderBottom: `1px solid ${C.borderLight}` }} onMouseEnter={(e) => (e.currentTarget.style.background = '#fafafa')} onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}>
                        <td style={tdStyle}>
                          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                            <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: `linear-gradient(135deg,${C.gold},${C.goldLight})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', color: '#fff', fontWeight: 700 }}>{u.avatar}</div>
                            <button onClick={() => setSelUser(u)} style={{ fontWeight: 600, fontSize: '14px', color: C.navy, background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', fontFamily: F }}>{u.name}</button>
                          </div>
                        </td>
                        <td style={{ ...tdStyle, fontSize: '13px', color: C.textMid }}>{u.email}</td>
                        <td style={tdStyle}><Badge color={RC[u.role]}>{RL[u.role]}</Badge></td>
                        <td style={tdStyle}><Badge color={u.active ? 'green' : 'red'}>{u.active ? 'Aktif' : 'Dondurulmuş'}</Badge></td>
                        <td style={tdStyle}>
                          {u.role !== 'admin' && (
                            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                              <Btn size="sm" variant={u.role === 'moderator' ? 'orange' : 'navy'} onClick={() => updateUser(u.id, { role: u.role === 'moderator' ? 'user' : 'moderator' })}>{u.role === 'moderator' ? 'Mod. Al' : 'Mod. Ver'}</Btn>
                              <Btn size="sm" variant={u.active ? 'danger' : 'success'} onClick={() => updateUser(u.id, { active: !u.active })}>{u.active ? 'Dondur' : 'Aktif Et'}</Btn>
                              <Btn size="sm" variant="danger" onClick={() => deleteUser(u.id)}>Sil</Btn>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                    {!sorted.length && <tr><td colSpan={5} style={{ ...tdStyle, textAlign: 'center', color: C.textLight, padding: '32px' }}>Sonuç bulunamadı.</td></tr>}
                  </tbody>
                </table>
              </div>
            </Card>
          );
        })()}

        {/* Original / Muadil Brands */}
        {(tab === 'original-brands' || tab === 'muadil-brands') && (() => {
          const isOrig = tab === 'original-brands';
          const baseBrands = brands.filter((b) => b.type === (isOrig ? 'original' : 'muadil')).map((b) => ({
            ...b,
            perfumeCount: isOrig ? perfumes.filter((p) => p.brandId === b.id).length : muadilPerfumes.filter((m) => m.brandId === b.id).length,
          }));
          const q = search.toLowerCase();
          const filtered = baseBrands.filter((b) => !q || b.name.toLowerCase().includes(q) || (b.origin || '').toLowerCase().includes(q));
          const sorted = applySort(filtered, (b, k) => ({ name: b.name, origin: b.origin || '', perfumeCount: b.perfumeCount, active: b.active ? 'Aktif' : 'Pasif' })[k]);
          return (
            <div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '14px' }}><Btn onClick={() => setShowBM(true)}>+ Marka Ekle</Btn></div>
              <Card style={{ overflow: 'hidden' }}>
                <div style={{ padding: '14px 18px', borderBottom: `1px solid ${C.border}` }}><span style={{ fontWeight: 700, color: C.navy }}>{isOrig ? 'Orijinal Markalar' : 'Muadil Markalar'}</span></div>
                <SearchBar value={search} onChange={setSearch} placeholder="Marka adı veya köken ara…" count={sorted.length} total={baseBrands.length} />
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead><tr style={{ background: '#f9f9fb' }}>
                    <SortTh label="Marka" sortKey="name" sort={sort} onSort={toggleSort} />
                    <SortTh label="Köken" sortKey="origin" sort={sort} onSort={toggleSort} />
                    <SortTh label="Parfüm Sayısı" sortKey="perfumeCount" sort={sort} onSort={toggleSort} />
                    <SortTh label="Durum" sortKey="active" sort={sort} onSort={toggleSort} />
                    <th style={thStyle}>İşlem</th>
                  </tr></thead>
                  <tbody>
                    {sorted.map((b) => (
                      <tr key={b.id} style={{ borderBottom: `1px solid ${C.borderLight}` }} onMouseEnter={(e) => (e.currentTarget.style.background = '#fafafa')} onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}>
                        <td style={tdStyle}><div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}><div style={{ width: '30px', height: '30px', borderRadius: '7px', background: C.goldBg, border: `1px solid ${C.goldBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 700, color: C.gold }}>{b.logo}</div><div><div style={{ fontWeight: 600, fontSize: '14px', color: C.text }}>{b.name}</div><div style={{ fontSize: '11px', color: C.textLight }}>/{b.slug}</div></div></div></td>
                        <td style={{ ...tdStyle, fontSize: '13px', color: C.textMid }}>{b.origin}</td>
                        <td style={tdStyle}><span style={{ fontSize: '15px', fontWeight: 700, color: b.perfumeCount > 0 ? C.gold : C.textLight }}>{b.perfumeCount}</span></td>
                        <td style={tdStyle}><Badge color={b.active ? 'green' : 'red'}>{b.active ? 'Aktif' : 'Pasif'}</Badge></td>
                        <td style={tdStyle}>
                          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                            <button onClick={() => updateBrand(b.id, { active: !b.active })} style={{ padding: '5px 10px', borderRadius: '7px', border: `1px solid ${C.border}`, background: '#fff', color: C.textMid, fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: F }}>{b.active ? 'Pasif Et' : 'Aktif Et'}</button>
                            <button onClick={() => openEditBrand(b)} title="Düzenle" style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '5px 10px', borderRadius: '7px', border: `1px solid ${C.border}`, background: '#fff', color: C.navy, fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: F }}>
                              <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4Z"/></svg>
                              Düzenle
                            </button>
                            <button onClick={() => setDelTarget({ id: b.id, name: b.name, type: 'brand' })} title="Sil" style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '5px 10px', borderRadius: '7px', border: '1px solid #fecaca', background: '#fff5f5', color: C.red, fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: F }}>
                              <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                              Sil
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {!sorted.length && <tr><td colSpan={5} style={{ ...tdStyle, textAlign: 'center', color: C.textLight, padding: '32px' }}>Sonuç bulunamadı.</td></tr>}
                  </tbody>
                </table>
              </Card>
            </div>
          );
        })()}

        {/* Perfumes */}
        {tab === 'perfumes' && (() => {
          const basePerfumes = perfumes.map((p) => ({ ...p, muadilCount: muadilPerfumes.filter((m) => m.targetPerfumeId === p.id).length }));
          const q = search.toLowerCase();
          const filtered = basePerfumes.filter((p) => !q || p.name.toLowerCase().includes(q) || p.brandName.toLowerCase().includes(q) || p.gender.toLowerCase().includes(q));
          const sorted = applySort(filtered, (p, k) => ({ name: p.name, brandName: p.brandName, gender: p.gender, muadilCount: p.muadilCount })[k]);
          return (
            <div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '14px' }}><Btn onClick={() => setShowPM(true)}>+ Parfüm Ekle</Btn></div>
              <Card style={{ overflow: 'hidden' }}>
                <div style={{ padding: '14px 18px', borderBottom: `1px solid ${C.border}` }}><span style={{ fontWeight: 700, color: C.navy }}>Orijinal Parfümler</span></div>
                <SearchBar value={search} onChange={setSearch} placeholder="Parfüm adı, marka veya cinsiyet ara…" count={sorted.length} total={perfumes.length} />
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead><tr style={{ background: '#f9f9fb' }}>
                    <SortTh label="Parfüm" sortKey="name" sort={sort} onSort={toggleSort} />
                    <SortTh label="Marka" sortKey="brandName" sort={sort} onSort={toggleSort} />
                    <th style={thStyle}>URL</th>
                    <SortTh label="Cinsiyet" sortKey="gender" sort={sort} onSort={toggleSort} />
                    <SortTh label="Muadil Sayısı" sortKey="muadilCount" sort={sort} onSort={toggleSort} />
                    <th style={thStyle}>İşlem</th>
                  </tr></thead>
                  <tbody>
                    {sorted.map((p) => (
                      <tr key={p.id} style={{ borderBottom: `1px solid ${C.borderLight}` }} onMouseEnter={(e) => (e.currentTarget.style.background = '#fafafa')} onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}>
                        <td style={{ ...tdStyle, fontWeight: 600, fontSize: '14px', color: C.text }}>{p.name}</td>
                        <td style={{ ...tdStyle, fontSize: '13px', color: C.textMid }}>{p.brandName}</td>
                        <td style={{ ...tdStyle, fontSize: '12px', color: C.gold }}>/{p.brandSlug}/{p.slug}</td>
                        <td style={tdStyle}><GenderBadge gender={p.gender} /></td>
                        <td style={{ ...tdStyle, fontSize: '13px', color: C.green, fontWeight: 600 }}>{p.muadilCount}</td>
                        <td style={tdStyle}>
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <button onClick={() => openEditPerf(p)} title="Düzenle" style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '5px 10px', borderRadius: '7px', border: `1px solid ${C.border}`, background: '#fff', color: C.navy, fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: F }}>
                              <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4Z"/></svg>
                              Düzenle
                            </button>
                            <button onClick={() => setDelTarget({ id: p.id, name: p.name, type: 'perfume' })} title="Sil" style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '5px 10px', borderRadius: '7px', border: `1px solid #fecaca`, background: '#fff5f5', color: C.red, fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: F }}>
                              <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                              Sil
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {!sorted.length && <tr><td colSpan={6} style={{ ...tdStyle, textAlign: 'center', color: C.textLight, padding: '32px' }}>Sonuç bulunamadı.</td></tr>}
                  </tbody>
                </table>
              </Card>
            </div>
          );
        })()}

        {/* Muadil */}
        {tab === 'muadil' && (() => {
          const baseMuadil = muadilPerfumes.map((m) => { const ms = calcScores(m.id, comments); return { ...m, overall: ms.overall ?? -1, commentCount: ms.count }; });
          const q = search.toLowerCase();
          const filtered = baseMuadil.filter((m) => !q || m.name.toLowerCase().includes(q) || m.brandName.toLowerCase().includes(q) || m.targetPerfumeName.toLowerCase().includes(q) || m.targetBrandName.toLowerCase().includes(q));
          const sorted = applySort(filtered, (m, k) => ({ name: m.name, brandName: m.brandName, targetPerfumeName: `${m.targetBrandName} ${m.targetPerfumeName}`, overall: m.overall, commentCount: m.commentCount })[k]);
          return (
            <div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '14px' }}><Btn onClick={() => setShowMM(true)}>+ Muadil Parfüm Ekle</Btn></div>
              <Card style={{ overflow: 'hidden' }}>
                <div style={{ padding: '14px 18px', borderBottom: `1px solid ${C.border}` }}><span style={{ fontWeight: 700, color: C.navy }}>Muadil Parfümler</span></div>
                <SearchBar value={search} onChange={setSearch} placeholder="Muadil adı, marka veya hedef parfüm ara…" count={sorted.length} total={muadilPerfumes.length} />
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead><tr style={{ background: '#f9f9fb' }}>
                    <SortTh label="Muadil" sortKey="name" sort={sort} onSort={toggleSort} />
                    <SortTh label="Marka" sortKey="brandName" sort={sort} onSort={toggleSort} />
                    <SortTh label="Hedef Parfüm" sortKey="targetPerfumeName" sort={sort} onSort={toggleSort} />
                    <SortTh label="Genel Puan" sortKey="overall" sort={sort} onSort={toggleSort} />
                    <SortTh label="Yorum" sortKey="commentCount" sort={sort} onSort={toggleSort} />
                    <th style={thStyle}>İşlem</th>
                  </tr></thead>
                  <tbody>
                    {sorted.map((m) => (
                      <tr key={m.id} style={{ borderBottom: `1px solid ${C.borderLight}` }} onMouseEnter={(e) => (e.currentTarget.style.background = '#fafafa')} onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}>
                        <td style={{ ...tdStyle, fontWeight: 600, fontSize: '14px', color: C.text }}>{m.name}</td>
                        <td style={{ ...tdStyle, fontSize: '13px', color: C.textMid }}>{m.brandName}</td>
                        <td style={{ ...tdStyle, fontSize: '13px', color: C.textMid }}>{m.targetBrandName} — {m.targetPerfumeName}</td>
                        <td style={tdStyle}>{m.overall >= 0 ? <Badge color="gold">{m.overall}/10</Badge> : <span style={{ fontSize: '12px', color: C.textLight }}>—</span>}</td>
                        <td style={{ ...tdStyle, fontSize: '13px', color: C.textMid }}>{m.commentCount}</td>
                        <td style={tdStyle}>
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <button onClick={() => openEditMuadil(m)} title="Düzenle" style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '5px 10px', borderRadius: '7px', border: `1px solid ${C.border}`, background: '#fff', color: C.navy, fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: F }}>
                              <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4Z"/></svg>
                              Düzenle
                            </button>
                            <button onClick={() => setDelTarget({ id: m.id, name: m.name, type: 'muadil' })} title="Sil" style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '5px 10px', borderRadius: '7px', border: `1px solid #fecaca`, background: '#fff5f5', color: C.red, fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: F }}>
                              <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                              Sil
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {!sorted.length && <tr><td colSpan={6} style={{ ...tdStyle, textAlign: 'center', color: C.textLight, padding: '32px' }}>Sonuç bulunamadı.</td></tr>}
                  </tbody>
                </table>
              </Card>
            </div>
          );
        })()}

        {/* Slider */}
        {tab === 'slider' && (
          <SliderTab
            sliderImages={sliderImages}
            addSliderImage={addSliderImage}
            removeSliderImage={removeSliderImage}
            reorderSliderImages={reorderSliderImages}
            MAX_SLIDER={MAX_SLIDER}
            MAX_SIZE_MB={MAX_SIZE_MB}
          />
        )}
      </div>

      {/* Kullanıcı Detay Modal */}
      <Modal open={!!selUser} onClose={() => setSelUser(null)} title={`Kullanıcı: ${selUser?.name}`} width="580px">
        {selUser && (() => {
          const uc = comments.filter((c) => c.userId === selUser.id);
          return (
            <>
              <div style={{ display: 'flex', gap: '14px', alignItems: 'center', padding: '14px', background: C.goldBg, borderRadius: '12px', border: `1px solid ${C.goldBorder}`, marginBottom: '18px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: `linear-gradient(135deg,${C.gold},${C.goldLight})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', color: '#fff', fontWeight: 700, flexShrink: 0 }}>{selUser.avatar}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: '16px', color: C.navy }}>{selUser.name}</div>
                  <div style={{ fontSize: '13px', color: C.textMid }}>{selUser.email}</div>
                  <div style={{ display: 'flex', gap: '8px', marginTop: '6px', flexWrap: 'wrap' }}>
                    <Badge color={RC[selUser.role]}>{RL[selUser.role]}</Badge>
                    <Badge color={selUser.active ? 'green' : 'red'}>{selUser.active ? 'Aktif' : 'Dondurulmuş'}</Badge>
                  </div>
                </div>
              </div>
              <div style={{ marginBottom: '18px' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: C.navy, marginBottom: '10px', letterSpacing: '.05em' }}>OTURUM BİLGİLERİ</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  {[['Son Giriş', '13.05.2026 09:42'], ['Son Çıkış', '13.05.2026 11:18'], ['Katılım Tarihi', selUser.joinDate || '—'], ['Toplam Yorum', uc.length]].map(([k, v]) => (
                    <div key={k} style={{ background: '#f9f9fb', borderRadius: '10px', padding: '10px 14px', border: `1px solid ${C.border}` }}>
                      <div style={{ fontSize: '11px', color: C.textLight, marginBottom: '3px', textTransform: 'uppercase', letterSpacing: '.05em' }}>{k}</div>
                      <div style={{ fontSize: '14px', fontWeight: 600, color: C.text }}>{v}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: C.navy, marginBottom: '10px', letterSpacing: '.05em' }}>YORUMLARI ({uc.length})</div>
                {!uc.length && <div style={{ textAlign: 'center', padding: '20px', color: C.textLight, fontSize: '14px', background: '#f9f9fb', borderRadius: '10px' }}>Henüz yorum yapmamış.</div>}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '220px', overflow: 'auto' }}>
                  {uc.map((c) => {
                    const mp = muadilPerfumes.find((m) => m.id === c.muadilPerfumeId);
                    return (
                      <div key={c.id} style={{ border: `1px solid ${c.status === 'pending' ? C.goldBorder : C.border}`, borderRadius: '10px', padding: '12px 14px', background: c.status === 'pending' ? C.goldBg : '#fff' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px', flexWrap: 'wrap', gap: '6px' }}>
                          <span style={{ fontWeight: 600, fontSize: '13px', color: C.navy }}>{mp ? `${mp.brandName} — ${mp.name}` : 'Parfüm'}</span>
                          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                            <Badge color={c.status === 'approved' ? 'green' : 'orange'}>{c.status === 'approved' ? 'Yayında' : 'Bekliyor'}</Badge>
                            <span style={{ fontSize: '11px', color: C.textLight }}>{c.date}</span>
                          </div>
                        </div>
                        <p style={{ fontSize: '13px', color: C.text, lineHeight: 1.5 }}>{c.text}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          );
        })()}
      </Modal>

      {/* Marka Modal */}
      <Modal open={showBM} onClose={() => setShowBM(false)} title="Yeni Marka Ekle" width="540px">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <Input label="Marka Adı *" value={bf.name} onChange={(e) => setBf({ ...bf, name: e.target.value })} placeholder="Örn: Dior" />
          <Input label="Slug" value={bf.slug} onChange={(e) => setBf({ ...bf, slug: e.target.value })} placeholder="oto" />
          <Select label="Tür" value={bf.type} onChange={(e) => setBf({ ...bf, type: e.target.value })} options={[{ value: 'original', label: 'Orijinal' }, { value: 'muadil', label: 'Muadil' }]} />
          <Input label="Logo" value={bf.logo} onChange={(e) => setBf({ ...bf, logo: e.target.value })} placeholder="CH" />
          <Input label="Köken" value={bf.origin} onChange={(e) => setBf({ ...bf, origin: e.target.value })} placeholder="Fransa" />
          <Input label="Kuruluş" type="number" value={bf.founded} onChange={(e) => setBf({ ...bf, founded: e.target.value })} placeholder="1947" />
        </div>
        <Textarea label="Açıklama" value={bf.bio} onChange={(e) => setBf({ ...bf, bio: e.target.value })} rows={3} />
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}><Btn variant="secondary" onClick={() => setShowBM(false)}>İptal</Btn><Btn onClick={sbrand} disabled={!bf.name}>Ekle</Btn></div>
      </Modal>

      {/* Parfüm Modal */}
      <Modal open={showPM} onClose={() => setShowPM(false)} title="Yeni Parfüm Ekle" width="560px">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <Input label="Parfüm Adı *" value={pf.name} onChange={(e) => setPf({ ...pf, name: e.target.value })} placeholder="Sauvage" />
          <Select label="Marka *" value={pf.brandId} onChange={(e) => setPf({ ...pf, brandId: e.target.value })} options={[{ value: '', label: 'Marka seçin' }, ...brands.filter((b) => b.type === 'original').map((b) => ({ value: String(b.id), label: b.name }))]} />
          <Select label="Cinsiyet" value={pf.gender} onChange={(e) => setPf({ ...pf, gender: e.target.value })} options={['Erkek', 'Kadın', 'Unisex'].map((g) => ({ value: g, label: g }))} />
          <Input label="Yıl" type="number" value={pf.year} onChange={(e) => setPf({ ...pf, year: e.target.value })} placeholder="2015" />
        </div>
        <Input label="Üst Notalar (virgülle)" value={pf.topNotes} onChange={(e) => setPf({ ...pf, topNotes: e.target.value })} placeholder="Bergamot, Biber" />
        <Input label="Kalp Notaları" value={pf.heartNotes} onChange={(e) => setPf({ ...pf, heartNotes: e.target.value })} placeholder="Lavanta, Sedir" />
        <Input label="Dip Notalar" value={pf.baseNotes} onChange={(e) => setPf({ ...pf, baseNotes: e.target.value })} placeholder="Amber, Misk" />
        <Textarea label="Açıklama" value={pf.description} onChange={(e) => setPf({ ...pf, description: e.target.value })} rows={2} />
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}><Btn variant="secondary" onClick={() => setShowPM(false)}>İptal</Btn><Btn onClick={sperf} disabled={!pf.name || !pf.brandId}>Ekle</Btn></div>
      </Modal>

      {/* Muadil Modal */}
      <Modal open={showMM} onClose={() => setShowMM(false)} title="Muadil Parfüm Ekle" width="540px">
        <div style={{ background: C.blueBg, border: '1px solid #bdd3f8', borderRadius: '10px', padding: '10px 14px', marginBottom: '14px', fontSize: '13px', color: '#1e40af' }}>💡 Puanlar kullanıcı yorumlarından otomatik hesaplanır.</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <Input label="Muadil Adı *" value={mf.name} onChange={(e) => setMf({ ...mf, name: e.target.value })} placeholder="Sauvage Benzeri" />
          <Select label="Muadil Marka *" value={mf.brandId} onChange={(e) => setMf({ ...mf, brandId: e.target.value })} options={[{ value: '', label: 'Marka seçin' }, ...brands.filter((b) => b.type === 'muadil').map((b) => ({ value: String(b.id), label: b.name }))]} />
          <Select label="Hedef Orijinal *" value={mf.targetPerfumeId} onChange={(e) => setMf({ ...mf, targetPerfumeId: e.target.value })} options={[{ value: '', label: 'Parfüm seçin' }, ...perfumes.map((p) => ({ value: String(p.id), label: `${p.brandName} — ${p.name}` }))]} />
        </div>
        <Textarea label="Açıklama" value={mf.description} onChange={(e) => setMf({ ...mf, description: e.target.value })} rows={3} />
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}><Btn variant="secondary" onClick={() => setShowMM(false)}>İptal</Btn><Btn onClick={smuadil} disabled={!mf.name || !mf.brandId || !mf.targetPerfumeId}>Ekle</Btn></div>
      </Modal>

      {/* Orijinal Parfüm Düzenle Modal */}
      <Modal open={!!selPerf} onClose={() => { setSelPerf(null); setEf(null); }} title={`Parfüm Düzenle: ${selPerf?.name}`} width="560px">
        {ef && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <Input label="Parfüm Adı *" value={ef.name} onChange={(e) => setEf({ ...ef, name: e.target.value })} />
              <Input label="Slug" value={ef.slug} onChange={(e) => setEf({ ...ef, slug: e.target.value })} />
              <Select label="Marka *" value={ef.brandId} onChange={(e) => setEf({ ...ef, brandId: e.target.value })} options={[{ value: '', label: 'Marka seçin' }, ...brands.filter((b) => b.type === 'original').map((b) => ({ value: String(b.id), label: b.name }))]} />
              <Select label="Cinsiyet" value={ef.gender} onChange={(e) => setEf({ ...ef, gender: e.target.value })} options={['Erkek', 'Kadın', 'Unisex'].map((g) => ({ value: g, label: g }))} />
              <Input label="Yıl" type="number" value={ef.year} onChange={(e) => setEf({ ...ef, year: e.target.value })} />
            </div>
            <Input label="Üst Notalar (virgülle)" value={ef.topNotes} onChange={(e) => setEf({ ...ef, topNotes: e.target.value })} />
            <Input label="Kalp Notaları" value={ef.heartNotes} onChange={(e) => setEf({ ...ef, heartNotes: e.target.value })} />
            <Input label="Dip Notalar" value={ef.baseNotes} onChange={(e) => setEf({ ...ef, baseNotes: e.target.value })} />
            <Textarea label="Açıklama" value={ef.description} onChange={(e) => setEf({ ...ef, description: e.target.value })} rows={2} />
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'space-between' }}>
              <Btn variant="danger" onClick={() => { setDelTarget({ id: selPerf.id, name: selPerf.name, type: 'perfume' }); setSelPerf(null); setEf(null); }}>Sil</Btn>
              <div style={{ display: 'flex', gap: '8px' }}>
                <Btn variant="secondary" onClick={() => { setSelPerf(null); setEf(null); }}>İptal</Btn>
                <Btn onClick={savePerf} disabled={!ef.name || !ef.brandId}>Kaydet</Btn>
              </div>
            </div>
          </>
        )}
      </Modal>

      {/* Muadil Parfüm Düzenle Modal */}
      <Modal open={!!selMuadil} onClose={() => { setSelMuadil(null); setEmf(null); }} title={`Muadil Düzenle: ${selMuadil?.name}`} width="540px">
        {emf && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <Input label="Muadil Adı *" value={emf.name} onChange={(e) => setEmf({ ...emf, name: e.target.value })} />
              <Input label="Slug" value={emf.slug} onChange={(e) => setEmf({ ...emf, slug: e.target.value })} />
              <Select label="Muadil Marka *" value={emf.brandId} onChange={(e) => setEmf({ ...emf, brandId: e.target.value })} options={[{ value: '', label: 'Marka seçin' }, ...brands.filter((b) => b.type === 'muadil').map((b) => ({ value: String(b.id), label: b.name }))]} />
              <Select label="Hedef Orijinal *" value={emf.targetPerfumeId} onChange={(e) => setEmf({ ...emf, targetPerfumeId: e.target.value })} options={[{ value: '', label: 'Parfüm seçin' }, ...perfumes.map((p) => ({ value: String(p.id), label: `${p.brandName} — ${p.name}` }))]} />
            </div>
            <Textarea label="Açıklama" value={emf.description} onChange={(e) => setEmf({ ...emf, description: e.target.value })} rows={3} />
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'space-between' }}>
              <Btn variant="danger" onClick={() => { setDelTarget({ id: selMuadil.id, name: selMuadil.name, type: 'muadil' }); setSelMuadil(null); setEmf(null); }}>Sil</Btn>
              <div style={{ display: 'flex', gap: '8px' }}>
                <Btn variant="secondary" onClick={() => { setSelMuadil(null); setEmf(null); }}>İptal</Btn>
                <Btn onClick={saveMuadil} disabled={!emf.name || !emf.brandId || !emf.targetPerfumeId}>Kaydet</Btn>
              </div>
            </div>
          </>
        )}
      </Modal>
      {/* Marka Düzenle Modal */}
      <Modal open={!!selBrand} onClose={() => { setSelBrand(null); setEbf(null); }} title={`Marka Düzenle: ${selBrand?.name}`} width="540px">
        {ebf && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <Input label="Marka Adı *" value={ebf.name} onChange={(e) => setEbf({ ...ebf, name: e.target.value })} />
              <Input label="Slug" value={ebf.slug} onChange={(e) => setEbf({ ...ebf, slug: e.target.value })} />
              <Select label="Tür" value={ebf.type} onChange={(e) => setEbf({ ...ebf, type: e.target.value })} options={[{ value: 'original', label: 'Orijinal' }, { value: 'muadil', label: 'Muadil' }]} />
              <Input label="Logo" value={ebf.logo} onChange={(e) => setEbf({ ...ebf, logo: e.target.value })} />
              <Input label="Köken" value={ebf.origin} onChange={(e) => setEbf({ ...ebf, origin: e.target.value })} />
              <Input label="Kuruluş" type="number" value={ebf.founded} onChange={(e) => setEbf({ ...ebf, founded: e.target.value })} />
            </div>
            <Textarea label="Açıklama" value={ebf.bio} onChange={(e) => setEbf({ ...ebf, bio: e.target.value })} rows={3} />
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'space-between' }}>
              <Btn variant="danger" onClick={() => { setDelTarget({ id: selBrand.id, name: selBrand.name, type: 'brand' }); setSelBrand(null); setEbf(null); }}>Sil</Btn>
              <div style={{ display: 'flex', gap: '8px' }}>
                <Btn variant="secondary" onClick={() => { setSelBrand(null); setEbf(null); }}>İptal</Btn>
                <Btn onClick={saveBrand} disabled={!ebf.name}>Kaydet</Btn>
              </div>
            </div>
          </>
        )}
      </Modal>

      {/* Silme Onay Modal */}
      <Modal open={!!delTarget} onClose={() => setDelTarget(null)} title="Silme Onayı" width="400px">
        {delTarget && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: '52px', height: '52px', borderRadius: '50%', background: '#fff5f5', border: '1px solid #fecaca', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <svg width="24" height="24" fill="none" stroke={C.red} strokeWidth="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
            </div>
            <div style={{ fontSize: '16px', fontWeight: 700, color: C.navy, marginBottom: '8px' }}>Emin misiniz?</div>
            <div style={{ fontSize: '14px', color: C.textMid, marginBottom: '24px' }}>
              <span style={{ fontWeight: 600, color: C.text }}>"{delTarget.name}"</span> kalıcı olarak silinecek. Bu işlem geri alınamaz.
            </div>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <Btn variant="secondary" onClick={() => setDelTarget(null)}>Vazgeç</Btn>
              <Btn variant="danger" onClick={() => { if (delTarget.type === 'perfume') deletePerfume(delTarget.id); else if (delTarget.type === 'muadil') deleteMuadil(delTarget.id); else deleteBrand(delTarget.id); setDelTarget(null); }}>Evet, Sil</Btn>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
