import { useState, useEffect } from 'react';
import { Btn } from '@/components/ui';
import { C, F, FH } from '@/constants/theme';
import { useRouter } from '@/contexts/RouterContext';
import { useAuth } from '@/contexts/AuthContext';
import logoDark from '@/img/logos/logo-dark-minified.png';
import { TemplatePickerModal } from './TemplatePickerModal';
import { CreateListModal } from './CreateListModal';

function ShareCard({ listTitle, username, listId, onDismiss }) {
  const [visible, setVisible] = useState(false);
  const shareUrl = `${window.location.origin}/@${username}?list=${listId}`;

  useEffect(() => {
    navigator.clipboard.writeText(shareUrl).catch(() => {});
    requestAnimationFrame(() => setVisible(true));
  }, []);

  const handleClose = () => {
    setVisible(false);
    setTimeout(onDismiss, 350);
  };

  return (
    <>
      <style>{`
        @keyframes shareCardIn { from { opacity:0; transform:scale(.88) translateY(12px); } to { opacity:1; transform:scale(1) translateY(0); } }
        @keyframes shareCardOut { from { opacity:1; transform:scale(1); } to { opacity:0; transform:scale(.92); } }
      `}</style>
      <div style={{ position: 'fixed', inset: 0, zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,.45)', backdropFilter: 'blur(4px)' }}
        onClick={handleClose}>
        <div onClick={(e) => e.stopPropagation()} style={{
          background: '#fff', borderRadius: '20px', padding: '32px 36px',
          maxWidth: '380px', width: '90%', textAlign: 'center',
          boxShadow: '0 32px 80px rgba(0,0,0,.22)',
          animation: `${visible ? 'shareCardIn' : 'shareCardOut'} 0.35s cubic-bezier(.22,1,.36,1) forwards`,
        }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '8px' }}>
            <button onClick={handleClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.textLight, fontSize: '22px', lineHeight: 1, padding: '0 2px' }}>×</button>
          </div>
          <img src={logoDark} alt="muadilci" style={{ height: '40px', marginBottom: '20px' }} />

          <div style={{ fontSize: '11px', fontWeight: 700, color: C.gold, letterSpacing: '.15em', textTransform: 'uppercase', marginBottom: '8px' }}>
            Liste Paylaşımı
          </div>
          <h2 style={{ fontSize: '20px', fontWeight: 800, color: C.navy, lineHeight: 1.3, marginBottom: '8px' }}>
            {listTitle}
          </h2>
          <p style={{ fontSize: '13px', color: C.textLight, marginBottom: '20px' }}>
            Listeme Göz At
          </p>

          <div style={{ background: C.goldBg, border: `1px solid ${C.goldBorder}`, borderRadius: '10px', padding: '10px 16px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
            <svg width="14" height="14" fill="none" stroke={C.green} strokeWidth="2.5" viewBox="0 0 24 24">
              <polyline points="20 6 9 17 4 12" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span style={{ fontSize: '12px', fontWeight: 700, color: C.text }}>Link kopyalandı!</span>
          </div>

          <div style={{ fontSize: '11px', color: C.textLight, wordBreak: 'break-all' }}>{shareUrl}</div>
        </div>
      </div>
    </>
  );
}

function getItemUrl(list, item, perfumes, muadilPerfumes) {
  if (item.isCustom || !item.perfumeId) return null;
  if (list.category === 'muadil') {
    const m = muadilPerfumes.find((m) => String(m.id) === String(item.perfumeId));
    if (!m) return null;
    return `/karsilastir?orijinal=${m.targetPerfumeId}&muadil=${m.id}`;
  }
  const p = perfumes.find((p) => String(p.id) === String(item.perfumeId));
  if (!p) return null;
  return `/${p.brandSlug}/${p.slug}`;
}

function AccordionList({ list, onEdit, onDelete, onShare, confirmDeleteId, setConfirmDeleteId, perfumes, muadilPerfumes }) {
  const [open, setOpen] = useState(false);
  const { navigate } = useRouter();
  const isConfirming = confirmDeleteId === list.id;

  return (
    <div style={{
      border: `1px solid ${C.border}`, borderRadius: '12px',
      overflow: 'hidden', background: C.card,
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '12px',
        padding: '14px 18px', cursor: 'pointer',
        background: open ? C.goldBg : C.card,
        transition: 'background 0.2s',
      }} onClick={() => setOpen((s) => !s)}>
        {/* Chevron */}
        <svg width="14" height="14" fill="none" stroke={C.textLight} strokeWidth="2.5" viewBox="0 0 24 24"
          style={{ flexShrink: 0, transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
          <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: '14px', color: C.navy, fontFamily: F, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {list.title}
          </div>
          <div style={{ fontSize: '11px', color: C.textLight, marginTop: '2px' }}>
            {list.items?.length || 0} parfüm
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexShrink: 0 }} onClick={(e) => e.stopPropagation()}>
          {isConfirming ? (
            <>
              <span style={{ fontSize: '11px', color: C.red }}>Silinecek!</span>
              <button onClick={() => onDelete(list.id)} style={{ fontSize: '11px', fontWeight: 700, color: '#fff', background: C.red, border: 'none', borderRadius: '5px', padding: '3px 8px', cursor: 'pointer', fontFamily: F }}>Evet</button>
              <button onClick={() => setConfirmDeleteId(null)} style={{ fontSize: '11px', color: C.textMid, background: C.surface, border: `1px solid ${C.border}`, borderRadius: '5px', padding: '3px 8px', cursor: 'pointer', fontFamily: F }}>İptal</button>
            </>
          ) : (
            <>
              <button onClick={() => onShare(list)} style={{
                background: 'none', border: `1px solid ${C.border}`, borderRadius: '6px',
                padding: '4px 10px', fontSize: '11px', color: C.textMid,
                cursor: 'pointer', fontFamily: F, fontWeight: 600,
                display: 'flex', alignItems: 'center', gap: '4px',
                transition: 'border-color 0.15s, color 0.15s',
              }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = C.gold; e.currentTarget.style.color = C.gold; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.textMid; }}
              >
                <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" strokeLinecap="round" strokeLinejoin="round" />
                  <polyline points="16 6 12 2 8 6" strokeLinecap="round" strokeLinejoin="round" />
                  <line x1="12" y1="2" x2="12" y2="15" strokeLinecap="round" />
                </svg>
                Paylaş
              </button>
              <button onClick={() => onEdit(list)} style={{
                background: 'none', border: `1px solid ${C.border}`, borderRadius: '6px',
                padding: '4px 10px', fontSize: '11px', color: C.textMid,
                cursor: 'pointer', fontFamily: F, fontWeight: 600,
                transition: 'border-color 0.15s, color 0.15s',
              }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = C.gold; e.currentTarget.style.color = C.gold; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.textMid; }}
              >Düzenle</button>
              <button onClick={() => setConfirmDeleteId(list.id)} style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: C.textLight, display: 'flex', alignItems: 'center', padding: '4px',
                transition: 'color 0.15s',
              }}
                onMouseEnter={e => e.currentTarget.style.color = C.red}
                onMouseLeave={e => e.currentTarget.style.color = C.textLight}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                  <path d="M10 11v6" /><path d="M14 11v6" /><path d="M9 6V4h6v2" />
                </svg>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Items */}
      {open && (
        <div style={{ borderTop: `1px solid ${C.borderLight}`, padding: '14px 18px' }}>
          {(!list.items || list.items.length === 0) ? (
            <div style={{ fontSize: '13px', color: C.textLight, fontStyle: 'italic' }}>Bu listede henüz parfüm yok.</div>
          ) : (
            <ol style={{ margin: 0, padding: '0 0 0 20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {list.items.map((item, i) => {
                const url = getItemUrl(list, item, perfumes, muadilPerfumes);
                return (
                  <li key={i} style={{ fontSize: '14px', color: C.text, lineHeight: 1.5 }}>
                    {url ? (
                      <a
                        href={`/#${url}`}
                        onClick={(e) => { e.preventDefault(); navigate(url); }}
                        style={{
                          fontWeight: 600, color: C.text, textDecoration: 'none',
                          borderBottom: `1px solid transparent`,
                          transition: 'color 0.15s, border-color 0.15s',
                          cursor: 'pointer',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.color = C.gold; e.currentTarget.style.borderBottomColor = C.gold; }}
                        onMouseLeave={e => { e.currentTarget.style.color = C.text; e.currentTarget.style.borderBottomColor = 'transparent'; }}
                      >
                        {item.displayName}
                      </a>
                    ) : (
                      <span style={{ fontWeight: 600 }}>{item.displayName}</span>
                    )}
                    {item.isCustom && (
                      <span style={{ fontSize: '10px', color: '#b45309', background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: '4px', padding: '1px 5px', marginLeft: '6px', fontWeight: 600 }}>
                        özel giriş
                      </span>
                    )}
                  </li>
                );
              })}
            </ol>
          )}
        </div>
      )}
    </div>
  );
}

export function ListsTab({ userId, lists, loading, createList, updateList, deleteList, perfumes, muadilPerfumes }) {
  const [showTemplatePicker, setShowTemplatePicker] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [prefilledTitle, setPrefilledTitle] = useState('');
  const [editingList, setEditingList] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [shareCard, setShareCard] = useState(null); // { listTitle, listId }
  const { user } = useAuth();

  const handleTemplateSelect = (title) => {
    setPrefilledTitle(title);
    setEditingList(null);
    setShowCreateModal(true);
  };

  const handleEdit = (list) => {
    setEditingList(list);
    setPrefilledTitle(list.title);
    setShowCreateModal(true);
  };

  const handleDelete = async (listId) => {
    await deleteList(listId);
    setConfirmDeleteId(null);
  };

  const handleShare = (list) => {
    setShareCard({ listTitle: list.title, listId: list.id });
  };

  const handleSave = async (data) => {
    if (editingList) {
      await updateList(editingList.id, data);
    } else {
      await createList(data);
    }
  };

  return (
    <>
      {shareCard && (
        <ShareCard
          listTitle={shareCard.listTitle}
          listId={shareCard.listId}
          username={user?.username || user?.uid}
          onDismiss={() => setShareCard(null)}
        />
      )}

      <TemplatePickerModal
        open={showTemplatePicker}
        onClose={() => setShowTemplatePicker(false)}
        onSelect={handleTemplateSelect}
      />

      <CreateListModal
        open={showCreateModal}
        onClose={() => { setShowCreateModal(false); setEditingList(null); }}
        onSave={handleSave}
        initialTitle={prefilledTitle}
        initialItems={editingList?.items?.map((it) => ({ ...it, _id: Math.random().toString(36).slice(2) })) ?? null}
        editMode={!!editingList}
        perfumes={perfumes}
        muadilPerfumes={muadilPerfumes}
      />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h3 style={{ fontSize: '18px', fontWeight: 800, color: C.navy, marginBottom: '2px' }}>Listelerim</h3>
          {lists.length > 0 && <div style={{ fontSize: '13px', color: C.textLight }}>{lists.length} liste</div>}
        </div>
        <Btn onClick={() => setShowTemplatePicker(true)} size="sm">+ Yeni Liste</Btn>
      </div>

      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: C.textLight }}>Yükleniyor...</div>
      ) : lists.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div style={{ fontSize: '36px', marginBottom: '12px' }}>📋</div>
          <div style={{ fontSize: '15px', fontWeight: 600, color: C.navy, marginBottom: '6px' }}>Henüz liste oluşturmadınız</div>
          <div style={{ fontSize: '13px', color: C.textLight, marginBottom: '20px' }}>Kış parfümleri, yaz favorileri, ömür boyu beğendikleriniz…</div>
          <Btn onClick={() => setShowTemplatePicker(true)}>İlk Listemi Oluştur</Btn>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {lists.map((list) => (
            <AccordionList
              key={list.id}
              list={list}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onShare={handleShare}
              confirmDeleteId={confirmDeleteId}
              setConfirmDeleteId={setConfirmDeleteId}
              perfumes={perfumes}
              muadilPerfumes={muadilPerfumes}
            />
          ))}
        </div>
      )}
    </>
  );
}
