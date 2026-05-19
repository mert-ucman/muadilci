import { useState } from 'react';
import { useRouter } from '@/contexts/RouterContext';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { useW } from '@/hooks/useW';
import { slugify } from '@/utils/strings';
import { Card, Badge, Btn, Modal, Input, Select, Textarea } from '@/components/ui';
import { GenderBadge } from '@/components/shared';
import { C, F } from '@/constants/theme';
import noImage from '@/img/no-image.jpg';

export function PerfumesPage() {
  const { navigate } = useRouter();
  const { perfumes, muadilPerfumes, updatePerfume, deletePerfume, updateMuadil, deleteMuadil, togglePerfumeFavorite, isPerfumeFavorite, toggleMuadilFavorite, isMuadilFavorite } = useData();
  const { isMod, user } = useAuth();
  const { w, sm, xs } = useW();
  const [pTab, setPTab] = useState('original');
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [editModal, setEditModal] = useState(null);
  const [ef, setEf] = useState({});

  const openEdit = (type, item) => {
    if (type === 'perfume') {
      setEf({ name: item.name, slug: item.slug, gender: item.gender, year: String(item.year), description: item.description || '', topNotes: (item.notes?.top || []).join(', '), heartNotes: (item.notes?.heart || []).join(', '), baseNotes: (item.notes?.base || []).join(', ') });
    } else {
      setEf({ name: item.name, slug: item.slug, description: item.description || '' });
    }
    setEditModal({ type, item });
  };

  const saveEdit = () => {
    if (!editModal) return;
    if (editModal.type === 'perfume') {
      updatePerfume(editModal.item.id, { name: ef.name, slug: ef.slug || slugify(ef.name), gender: ef.gender, year: Number(ef.year) || editModal.item.year, description: ef.description, notes: { top: (ef.topNotes || '').split(',').map((s) => s.trim()).filter(Boolean), heart: (ef.heartNotes || '').split(',').map((s) => s.trim()).filter(Boolean), base: (ef.baseNotes || '').split(',').map((s) => s.trim()).filter(Boolean) } });
    } else {
      updateMuadil(editModal.item.id, { name: ef.name, slug: ef.slug || slugify(ef.name), description: ef.description });
    }
    setEditModal(null);
  };

  const filtO = perfumes.filter((p) => (filter === 'all' || p.gender === filter) && (p.name.toLowerCase().includes(search.toLowerCase()) || p.brandName.toLowerCase().includes(search.toLowerCase())));
  const filtM = muadilPerfumes.filter((m) => m.name.toLowerCase().includes(search.toLowerCase()) || m.brandName.toLowerCase().includes(search.toLowerCase()) || m.targetPerfumeName.toLowerCase().includes(search.toLowerCase()));

  return (
    <div style={{ minHeight: '100vh', background: C.bg, padding: xs ? '16px' : sm ? '20px 16px' : '32px' }}>
      <div style={{ maxWidth: '1320px', margin: '0 auto' }}>
        <h1 style={{ fontSize: sm ? '22px' : '26px', fontWeight: 900, color: C.navy, marginBottom: '4px' }}>Parfümler</h1>
        <p style={{ color: C.textLight, fontSize: '14px', marginBottom: '22px' }}>Orijinal parfümler ve muadilleri</p>

        <div style={{ display: 'flex', gap: '4px', marginBottom: '18px', background: C.card, border: `1px solid ${C.border}`, borderRadius: '12px', padding: '4px', width: 'fit-content' }}>
          {[['original', 'Orijinal'], ['muadil', 'Muadil']].map(([v, l]) => (
            <button key={v} onClick={() => { setPTab(v); setFilter('all'); setSearch(''); }}
              style={{ padding: sm ? '8px 16px' : '8px 20px', borderRadius: '9px', border: 'none', background: pTab === v ? C.navy : 'transparent', color: pTab === v ? '#fff' : C.textMid, fontSize: '14px', fontWeight: 600, cursor: 'pointer', fontFamily: F, transition: 'all .2s' }}>
              {l}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '10px', marginBottom: '22px', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '160px', position: 'relative' }}>
            <svg style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: C.textLight }} width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /></svg>
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Ara..." style={{ width: '100%', border: `1px solid ${C.border}`, borderRadius: '10px', padding: '10px 14px 10px 38px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
          </div>
          {pTab === 'original' && (
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {['all', 'Erkek', 'Kadın', 'Unisex'].map((g) => (
                <button key={g} onClick={() => setFilter(g)}
                  style={{ padding: '9px 12px', border: `1px solid ${filter === g ? C.gold : C.border}`, borderRadius: '10px', background: filter === g ? C.goldBg : 'transparent', color: filter === g ? C.gold : C.textMid, fontSize: '13px', fontWeight: filter === g ? 700 : 400, cursor: 'pointer', fontFamily: F }}>
                  {g === 'all' ? 'Tümü' : g}
                </button>
              ))}
            </div>
          )}
        </div>

        {pTab === 'original' && (
          <div style={{ display: 'grid', gridTemplateColumns: xs ? '1fr' : sm ? '1fr 1fr' : 'repeat(auto-fill,minmax(290px,1fr))', gap: '16px' }}>
            {filtO.map((p) => {
              const mc = muadilPerfumes.filter((m) => m.targetPerfumeId === p.id).length;
              return (
                <Card key={p.id} hover style={{ padding: '0', cursor: 'pointer', position: 'relative', overflow: 'hidden' }} onClick={() => navigate(`/${p.brandSlug}/${p.slug}`)}>
                  {isMod && <button onClick={(e) => { e.stopPropagation(); openEdit('perfume', p); }} style={{ position: 'absolute', top: '10px', right: '10px', zIndex: 1, background: C.goldBg, border: `1px solid ${C.goldBorder}`, borderRadius: '8px', padding: '4px 10px', fontSize: '12px', fontWeight: 600, color: C.gold, cursor: 'pointer', fontFamily: F }}>Düzenle</button>}
                  {!isMod && <button onClick={(e) => { e.stopPropagation(); togglePerfumeFavorite(user?.id, p.id); }} style={{ position: 'absolute', top: '10px', right: '10px', zIndex: 1, width: '30px', height: '30px', borderRadius: '50%', border: `1px solid ${isPerfumeFavorite(user?.id, p.id) ? C.redBorder : C.border}`, background: isPerfumeFavorite(user?.id, p.id) ? C.redBg : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '14px' }}>{isPerfumeFavorite(user?.id, p.id) ? '❤️' : '🤍'}</button>}
                  <div style={{ width: '100%', aspectRatio: '4/3', overflow: 'hidden', background: '#f0f0f0' }}>
                    <img src={p.image || noImage} alt={p.name} onError={(e) => { e.currentTarget.src = noImage; }} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                  <div style={{ padding: '12px 14px' }}>
                    <div style={{ fontSize: sm ? '13px' : '15px', fontWeight: 800, color: C.navy, marginBottom: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</div>
                    <div style={{ fontSize: '12px', color: C.textMid, marginBottom: '8px' }}>{p.brandName} · {p.year}</div>
                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginBottom: '10px' }}>
                      <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: '20px', fontSize: '11px', fontWeight: 600, background: '#f0f0f5', color: C.textMid, border: `1px solid ${C.border}` }}>{p.gender}</span>
                      {mc > 0 && <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: '20px', fontSize: '11px', fontWeight: 600, background: '#f0f0f5', color: C.textMid, border: `1px solid ${C.border}` }}>{mc} muadil</span>}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', paddingTop: '8px', borderTop: `1px solid ${C.borderLight}`, gap: '6px' }}>
                      <span style={{ fontSize: '11px', color: C.textLight }}>♥ {p.likes.toLocaleString()}</span>
                      {mc > 0 && !sm && <Btn size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); navigate(`/karsilastir?orijinal=${p.id}`); }}>Karşılaştır</Btn>}
                    </div>
                  </div>
                </Card>
              );
            })}
            {!filtO.length && <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '60px', color: C.textLight }}>Sonuç bulunamadı.</div>}
          </div>
        )}

        {pTab === 'muadil' && (
          <div style={{ display: 'grid', gridTemplateColumns: xs ? '1fr' : sm ? '1fr 1fr' : 'repeat(auto-fill,minmax(290px,1fr))', gap: '16px' }}>
            {filtM.map((m) => (
              <Card key={m.id} hover style={{ padding: '0', cursor: 'pointer', position: 'relative', overflow: 'hidden' }} onClick={() => navigate(`/karsilastir?orijinal=${m.targetPerfumeId}&muadil=${m.id}`)}>
                {isMod && <button onClick={(e) => { e.stopPropagation(); openEdit('muadil', m); }} style={{ position: 'absolute', top: '10px', right: '10px', zIndex: 1, background: C.goldBg, border: `1px solid ${C.goldBorder}`, borderRadius: '8px', padding: '4px 10px', fontSize: '12px', fontWeight: 600, color: C.gold, cursor: 'pointer', fontFamily: F }}>Düzenle</button>}
                {!isMod && <button onClick={(e) => { e.stopPropagation(); toggleMuadilFavorite(user?.id, m.id); }} style={{ position: 'absolute', top: '10px', right: '10px', zIndex: 1, width: '30px', height: '30px', borderRadius: '50%', border: `1px solid ${isMuadilFavorite(user?.id, m.id) ? C.redBorder : C.border}`, background: isMuadilFavorite(user?.id, m.id) ? C.redBg : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '14px' }}>{isMuadilFavorite(user?.id, m.id) ? '❤️' : '🤍'}</button>}
                <div style={{ width: '100%', aspectRatio: '4/3', overflow: 'hidden', background: '#f0f0f0' }}>
                  <img src={m.image || noImage} alt={m.name} onError={(e) => { e.currentTarget.src = noImage; }} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <div style={{ padding: '12px 14px' }}>
                  <div style={{ fontSize: sm ? '13px' : '15px', fontWeight: 800, color: C.navy, marginBottom: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.name}</div>
                  <div style={{ fontSize: '13px', color: C.green, fontWeight: 600, marginBottom: '2px' }}>{m.brandName}</div>
                  <div style={{ fontSize: '12px', color: C.textLight, marginBottom: '10px' }}>→ {m.targetBrandName} {m.targetPerfumeName}</div>
                  <div style={{ paddingTop: '8px', borderTop: `1px solid ${C.borderLight}`, textAlign: 'right' }}>
                    <Btn size="sm" variant="ghost">Karşılaştır →</Btn>
                  </div>
                </div>
              </Card>
            ))}
            {!filtM.length && <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '60px', color: C.textLight }}>Sonuç bulunamadı.</div>}
          </div>
        )}
      </div>

      <Modal open={!!editModal} onClose={() => setEditModal(null)}
        title={editModal?.type === 'perfume' ? `Düzenle: ${editModal?.item?.name}` : `Muadil Düzenle: ${editModal?.item?.name}`}>
        {editModal?.type === 'perfume' && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: sm ? '1fr' : '1fr 1fr', gap: '12px' }}>
              <Input label="Parfüm Adı" value={ef.name || ''} onChange={(e) => setEf({ ...ef, name: e.target.value })} />
              <Select label="Cinsiyet" value={ef.gender || 'Erkek'} onChange={(e) => setEf({ ...ef, gender: e.target.value })} options={['Erkek', 'Kadın', 'Unisex'].map((g) => ({ value: g, label: g }))} />
              <Input label="Yıl" value={ef.year || ''} onChange={(e) => setEf({ ...ef, year: e.target.value })} />
            </div>
            <Input label="Üst Notalar (virgülle)" value={ef.topNotes || ''} onChange={(e) => setEf({ ...ef, topNotes: e.target.value })} />
            <Input label="Kalp Notaları (virgülle)" value={ef.heartNotes || ''} onChange={(e) => setEf({ ...ef, heartNotes: e.target.value })} />
            <Input label="Dip Notalar (virgülle)" value={ef.baseNotes || ''} onChange={(e) => setEf({ ...ef, baseNotes: e.target.value })} />
            <Textarea label="Açıklama" value={ef.description || ''} onChange={(e) => setEf({ ...ef, description: e.target.value })} rows={2} />
          </>
        )}
        {editModal?.type === 'muadil' && (
          <>
            <Input label="Muadil Adı" value={ef.name || ''} onChange={(e) => setEf({ ...ef, name: e.target.value })} />
            <Textarea label="Açıklama" value={ef.description || ''} onChange={(e) => setEf({ ...ef, description: e.target.value })} rows={3} />
          </>
        )}
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'space-between', marginTop: '8px' }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            {isMod && editModal?.type === 'perfume' && <Btn variant="danger" size="sm" onClick={() => { deletePerfume(editModal.item.id); setEditModal(null); }}>Sil</Btn>}
            {isMod && editModal?.type === 'muadil' && <Btn variant="danger" size="sm" onClick={() => { deleteMuadil(editModal.item.id); setEditModal(null); }}>Sil</Btn>}
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <Btn variant="secondary" onClick={() => setEditModal(null)}>İptal</Btn>
            <Btn onClick={saveEdit} disabled={!ef.name}>Kaydet</Btn>
          </div>
        </div>
      </Modal>
    </div>
  );
}
