import { useState, useEffect } from 'react';
import { Btn } from '@/components/ui';
import { C, F, FH } from '@/constants/theme';
import { useRouter } from '@/contexts/RouterContext';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
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
      <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/45 backdrop-blur-sm"
        onClick={handleClose}>
        <div onClick={(e) => e.stopPropagation()} style={{
          background: '#fff', borderRadius: '20px', padding: '32px 36px',
          maxWidth: '380px', width: '90%', textAlign: 'center',
          boxShadow: '0 32px 80px rgba(0,0,0,.22)',
          animation: `${visible ? 'shareCardIn' : 'shareCardOut'} 0.35s cubic-bezier(.22,1,.36,1) forwards`,
        }}>
          <div className="flex justify-end mb-2">
            <button onClick={handleClose} className="bg-transparent border-0 cursor-pointer text-(--color-text-light) text-[22px] leading-none p-[0_2px]">×</button>
          </div>
          {logoUrl && <img src={logoUrl} alt="muadilci" className="h-10 mb-5 mx-auto" />}

          <div className="text-[11px] font-bold text-(--color-gold) tracking-[.15em] uppercase mb-2">
            Liste Paylaşımı
          </div>
          <h2 className="text-[20px] font-extrabold text-(--color-navy) leading-[1.3] mb-2">
            {listTitle}
          </h2>
          <p className="text-[13px] text-(--color-text-light) mb-5">
            Listeme Göz At
          </p>

          <div className="bg-(--color-gold-bg) border border-(--color-gold-border) rounded-[10px] p-[10px_16px] mb-5 flex items-center gap-2 justify-center">
            <svg width="14" height="14" fill="none" stroke={C.green} strokeWidth="2.5" viewBox="0 0 24 24">
              <polyline points="20 6 9 17 4 12" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="text-[12px] font-bold text-(--color-text)">Link kopyalandı!</span>
          </div>

          <div className="text-[11px] text-(--color-text-light) break-all">{shareUrl}</div>
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
    <div className="border border-(--color-border) rounded-xl overflow-hidden bg-(--color-card)">
      {/* Header */}
      <div
        className="flex items-center gap-3 p-[14px_18px] cursor-pointer transition-colors duration-200"
        style={{ background: open ? C.goldBg : C.card }}
        onClick={() => setOpen((s) => !s)}
      >
        {/* Chevron */}
        <svg width="14" height="14" fill="none" stroke={C.textLight} strokeWidth="2.5" viewBox="0 0 24 24"
          style={{ flexShrink: 0, transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
          <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>

        <div className="flex-1 min-w-0">
          <div className="font-bold text-sm text-(--color-navy) overflow-hidden text-ellipsis whitespace-nowrap" style={{ fontFamily: F }}>
            {list.title}
          </div>
          <div className="text-[11px] text-(--color-text-light) mt-[2px]">
            {list.items?.length || 0} parfüm
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-[6px] items-center shrink-0" onClick={(e) => e.stopPropagation()}>
          {isConfirming ? (
            <>
              <span className="text-[11px] text-(--color-red)">Silinecek!</span>
              <button onClick={() => onDelete(list.id)}
                className="text-[11px] font-bold text-white bg-(--color-red) border-0 rounded-[5px] px-2 py-[3px] cursor-pointer"
                style={{ fontFamily: F }}>Evet</button>
              <button onClick={() => setConfirmDeleteId(null)}
                className="text-[11px] text-(--color-text-mid) bg-(--color-surface) border border-(--color-border) rounded-[5px] px-2 py-[3px] cursor-pointer"
                style={{ fontFamily: F }}>İptal</button>
            </>
          ) : (
            <>
              <button onClick={() => onShare(list)}
                className="bg-transparent border border-(--color-border) rounded-[6px] px-[10px] py-1 text-[11px] text-(--color-text-mid) cursor-pointer font-semibold flex items-center gap-1 transition-colors duration-150 hover:border-(--color-gold) hover:text-(--color-gold)"
                style={{ fontFamily: F }}
              >
                <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" strokeLinecap="round" strokeLinejoin="round" />
                  <polyline points="16 6 12 2 8 6" strokeLinecap="round" strokeLinejoin="round" />
                  <line x1="12" y1="2" x2="12" y2="15" strokeLinecap="round" />
                </svg>
                Paylaş
              </button>
              <button onClick={() => onEdit(list)}
                className="bg-transparent border border-(--color-border) rounded-[6px] px-[10px] py-1 text-[11px] text-(--color-text-mid) cursor-pointer font-semibold transition-colors duration-150 hover:border-(--color-gold) hover:text-(--color-gold)"
                style={{ fontFamily: F }}
              >Düzenle</button>
              <button onClick={() => setConfirmDeleteId(list.id)}
                className="bg-transparent border-0 cursor-pointer text-(--color-text-light) flex items-center p-1 transition-colors duration-150 hover:text-(--color-red)"
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
        <div className="border-t border-(--color-border-light) p-[14px_18px]">
          {(!list.items || list.items.length === 0) ? (
            <div className="text-[13px] text-(--color-text-light) italic">Bu listede henüz parfüm yok.</div>
          ) : (
            <ol className="m-0 pl-5 flex flex-col gap-2">
              {list.items.map((item, i) => {
                const url = getItemUrl(list, item, perfumes, muadilPerfumes);
                return (
                  <li key={i} className="text-sm text-(--color-text) leading-[1.5]">
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
                      <span className="font-semibold">{item.displayName}</span>
                    )}
                    {item.isCustom && (
                      <div className="inline-flex items-center justify-center text-[10px] text-[#b45309] bg-[#fffbeb] border border-[#fcd34d] rounded px-[5px] ml-[6px] font-semibold" style={{ height: '16px' }}>
                        <p className="m-0 p-0 w-max cap-center" style={{ lineHeight: '14px' }}>özel giriş</p>
                      </div>
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
  const { logActivity, logoUrl } = useData();

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
      const ref = await createList(data);
      logActivity('list_created', {
        listId: ref.id,
        listTitle: data.title,
        listUrl: user?.username ? `/@${user.username}?list=${ref.id}` : null,
      });
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

      <div className="flex justify-between items-center mb-5">
        <div>
          <h3 className="text-[18px] font-extrabold text-(--color-navy) mb-[2px]">Listelerim</h3>
          {lists.length > 0 && <div className="text-[13px] text-(--color-text-light)">{lists.length} liste</div>}
        </div>
        <Btn onClick={() => setShowTemplatePicker(true)} size="sm">+ Yeni Liste</Btn>
      </div>

      {loading ? (
        <div className="p-10 text-center text-(--color-text-light)">Yükleniyor...</div>
      ) : lists.length === 0 ? (
        <div className="text-center p-[60px_20px]">
          <div className="text-[36px] mb-3">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke={C.textLight} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mx-auto"><rect x="9" y="2" width="6" height="4" rx="1"/><path d="M4 5h16a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z"/><line x1="9" y1="10" x2="15" y2="10"/><line x1="9" y1="14" x2="15" y2="14"/></svg>
          </div>
          <div className="text-[15px] font-semibold text-(--color-navy) mb-[6px]">Henüz liste oluşturmadınız</div>
          <div className="text-[13px] text-(--color-text-light) mb-5">Kış parfümleri, yaz favorileri, ömür boyu beğendikleriniz…</div>
          <Btn onClick={() => setShowTemplatePicker(true)}>İlk Listemi Oluştur</Btn>
        </div>
      ) : (
        <div className="flex flex-col gap-[10px]">
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
