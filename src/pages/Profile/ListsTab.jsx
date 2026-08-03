import { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { Btn } from '@/components/ui';
import { C, F, FH } from '@/constants/theme';
import { useRouter } from '@/contexts/RouterContext';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { useW } from '@/hooks/useW';
import { TemplatePickerModal } from './TemplatePickerModal';
import { CreateListModal } from './CreateListModal';

function splitItem(item) {
  const brand = item.brandName?.trim();
  const name = item.perfumeName?.trim();
  if (brand || name) return { name: name || item.displayName || 'Parfüm', brand: brand || '' };
  const parts = (item.displayName || '').split(/\s+—\s+/);
  if (parts.length === 2) return { brand: parts[0], name: parts[1] };
  return { name: item.displayName || 'Parfüm', brand: '' };
}

function ShareCard({ list, username, logoUrl, onDismiss }) {
  const [visible, setVisible] = useState(false);
  const [copied, setCopied] = useState(false);
  const handle = username || 'kullanici';
  const shareUrl = `${window.location.origin}/@${handle}?list=${list.id}`;
  const items = list.items || [];

  const twoCols = items.length > 6;
  const half = Math.ceil(items.length / 2);

  const listWrapRef = useRef(null);
  const contentRef = useRef(null);

  useEffect(() => { requestAnimationFrame(() => setVisible(true)); }, []);

  // Normal font hedefle; yalnızca aşırı uzun listelerde (güvenlik ağı) hafifçe küçült
  useLayoutEffect(() => {
    const wrap = listWrapRef.current;
    const content = contentRef.current;
    if (!wrap || !content) return;
    const BASE = 15, MIN = 11;
    const fit = () => {
      let f = BASE;
      content.style.fontSize = f + 'px';
      let guard = 0;
      while (content.scrollHeight > wrap.clientHeight && f > MIN && guard++ < 40) {
        f -= 0.5;
        content.style.fontSize = f + 'px';
      }
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(wrap);
    return () => ro.disconnect();
  }, [items.length]);

  const renderItem = (item, idx, isLast) => {
    const { name, brand } = splitItem(item);
    return (
      <li key={idx} className="flex items-baseline"
        style={{ gap: '0.7em', padding: '0.6em 2px', borderBottom: isLast ? 'none' : `1px solid ${C.borderLight}` }}>
        <span style={{ fontFamily: FH, fontSize: '1em', fontWeight: 700, color: C.gold, minWidth: '1.7em', lineHeight: 1 }}>
          {String(idx + 1).padStart(2, '0')}
        </span>
        <div className="flex-1 min-w-0">
          <div style={{ fontSize: '0.95em', fontWeight: 600, color: C.text, lineHeight: 1.25, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {name}
          </div>
          {brand && <div style={{ fontSize: '0.75em', color: C.textLight, marginTop: '0.1em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{brand}</div>}
        </div>
      </li>
    );
  };

  const handleClose = () => {
    setVisible(false);
    setTimeout(onDismiss, 320);
  };

  const copyLink = async () => {
    try { await navigator.clipboard.writeText(shareUrl); } catch {}
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  const nativeShare = async () => {
    try { await navigator.share({ title: list.title, text: `${list.title} — muadilci`, url: shareUrl }); }
    catch {}
  };

  return (
    <>
      <style>{`
        @keyframes shareIn  { from { opacity:0; transform:scale(.9) translateY(16px); } to { opacity:1; transform:scale(1) translateY(0); } }
        @keyframes shareOut { from { opacity:1; transform:scale(1); } to { opacity:0; transform:scale(.94); } }
      `}</style>

      <div className="fixed inset-0 z-[2000] flex flex-col items-center justify-center gap-4 bg-black/60 backdrop-blur-md px-4 py-6 overflow-y-auto"
        onClick={handleClose}>

        {/* Close */}
        <button onClick={handleClose} aria-label="Kapat"
          className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/15 hover:bg-white/25 text-white flex items-center justify-center border-0 cursor-pointer transition-colors">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        {/* === Shareable 9:16 card === */}
        <div onClick={(e) => e.stopPropagation()}
          className="relative shrink-0 flex flex-col overflow-hidden"
          style={{
            aspectRatio: '9 / 16', height: 'min(78svh, 720px)', maxWidth: '92vw',
            borderRadius: '26px',
            background: 'linear-gradient(165deg,#FFFDFA 0%,#FBF7F1 52%,#F4ECDD 100%)',
            boxShadow: '0 40px 90px rgba(0,0,0,.45), 0 0 0 1px rgba(184,147,90,.18)',
            animation: `${visible ? 'shareIn' : 'shareOut'} .4s cubic-bezier(.22,1,.36,1) forwards`,
            fontFamily: F,
          }}>

          {/* gold glow + inner frame */}
          <div className="pointer-events-none absolute inset-0"
            style={{ background: 'radial-gradient(120% 55% at 50% -8%, rgba(184,147,90,.20), transparent 60%)' }} />
          <div className="pointer-events-none absolute"
            style={{ inset: '14px', border: `1px solid ${C.goldBorder}`, borderRadius: '16px' }} />

          <div className="relative flex flex-col h-full" style={{ padding: '34px 30px 26px' }}>

            {/* Header */}
            <div className="shrink-0 text-center">
              {logoUrl
                ? <img src={logoUrl} alt="muadilci" className="h-8 mx-auto mb-4 object-contain" style={{ maxWidth: '150px' }} />
                : <div className="mb-4" style={{ fontFamily: FH, fontSize: '26px', fontWeight: 700, color: C.text, letterSpacing: '.02em' }}>muadilci</div>}
              <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '.32em', color: C.gold }}>PARFÜM LİSTESİ</div>
            </div>

            {/* Title */}
            <div className="shrink-0 text-center" style={{ marginTop: '18px' }}>
              <h2 style={{ fontFamily: FH, fontWeight: 700, color: C.text, lineHeight: 1.12, fontSize: 'clamp(26px,3.6vh,38px)', margin: 0 }}>
                {list.title}
              </h2>
              <div style={{ fontSize: '12px', color: C.textLight, marginTop: '8px' }}>{items.length} parfüm</div>
              <div className="flex items-center justify-center gap-2" style={{ marginTop: '14px' }}>
                <span style={{ width: '34px', height: '1px', background: `linear-gradient(90deg,transparent,${C.gold})` }} />
                <span style={{ width: '5px', height: '5px', background: C.gold, transform: 'rotate(45deg)' }} />
                <span style={{ width: '34px', height: '1px', background: `linear-gradient(90deg,${C.gold},transparent)` }} />
              </div>
            </div>

            {/* Perfume list — 6'dan fazlaysa 2 sütun, normal font; kaydırmasız tek karede */}
            <div ref={listWrapRef} className="flex-1 min-h-0 overflow-hidden flex flex-col justify-center" style={{ marginTop: '18px' }}>
              {items.length === 0 ? (
                <div className="text-center" style={{ fontSize: '13px', color: C.textLight, fontStyle: 'italic' }}>
                  Bu listede henüz parfüm yok.
                </div>
              ) : (
                <div ref={contentRef} style={{ fontSize: '15px' }}>
                  {twoCols ? (
                    <div className="flex items-start" style={{ gap: '1.4em' }}>
                      <ol style={{ listStyle: 'none', margin: 0, padding: 0, flex: '1 1 0', minWidth: 0 }}>
                        {items.slice(0, half).map((item, i) => renderItem(item, i, i === half - 1))}
                      </ol>
                      <ol style={{ listStyle: 'none', margin: 0, padding: 0, flex: '1 1 0', minWidth: 0 }}>
                        {items.slice(half).map((item, i) => renderItem(item, half + i, half + i === items.length - 1))}
                      </ol>
                    </div>
                  ) : (
                    <ol style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                      {items.map((item, i) => renderItem(item, i, i === items.length - 1))}
                    </ol>
                  )}
                </div>
              )}
            </div>

            {/* Footer handle */}
            <div className="shrink-0 text-center" style={{ marginTop: '18px', paddingTop: '16px', borderTop: `1px solid ${C.goldBorder}` }}>
              <div style={{ fontSize: '14px', fontWeight: 700, letterSpacing: '.01em' }}>
                <span style={{ color: C.textMid }}>muadilci/</span>
                <span style={{ color: C.gold }}>@{handle}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Actions (outside card, not part of screenshot) */}
        <div onClick={(e) => e.stopPropagation()} className="shrink-0 flex items-center gap-2">
          <button onClick={copyLink} style={{
            display: 'flex', alignItems: 'center', gap: '7px',
            background: copied ? C.green : `linear-gradient(135deg,${C.gold},${C.goldDeep})`,
            color: '#fff', border: 0, borderRadius: '999px',
            padding: '11px 22px', fontSize: '13px', fontWeight: 700, fontFamily: F,
            cursor: 'pointer', boxShadow: '0 8px 24px rgba(184,147,90,.4)', transition: 'background .2s',
          }}>
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.4" viewBox="0 0 24 24">
              {copied
                ? <polyline points="20 6 9 17 4 12" strokeLinecap="round" strokeLinejoin="round" />
                : <><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" strokeLinecap="round" strokeLinejoin="round" /></>}
            </svg>
            {copied ? 'Link kopyalandı!' : 'Linki kopyala'}
          </button>
          {typeof navigator !== 'undefined' && navigator.share && (
            <button onClick={nativeShare} style={{
              display: 'flex', alignItems: 'center', gap: '7px',
              background: 'rgba(255,255,255,.12)', color: '#fff',
              border: '1px solid rgba(255,255,255,.3)', borderRadius: '999px',
              padding: '11px 20px', fontSize: '13px', fontWeight: 600, fontFamily: F, cursor: 'pointer',
            }}>
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
                <line x1="8.6" y1="13.5" x2="15.4" y2="17.5" /><line x1="15.4" y1="6.5" x2="8.6" y2="10.5" />
              </svg>
              Paylaş
            </button>
          )}
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
  const { sm } = useW();
  const isConfirming = confirmDeleteId === list.id;

  const actionButtons = isConfirming ? (
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
  );

  return (
    <div className="border border-(--color-border) rounded-xl overflow-hidden bg-(--color-card)">
      {/* Header */}
      <div
        className="p-[14px_18px] cursor-pointer transition-colors duration-200"
        style={{ background: open ? C.goldBg : C.card }}
        onClick={() => setOpen((s) => !s)}
      >
        <div className="flex items-center gap-3">
          {/* Chevron */}
          <svg width="14" height="14" fill="none" stroke={C.textLight} strokeWidth="2.5" viewBox="0 0 24 24"
            style={{ flexShrink: 0, transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
            <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>

          <div className="flex-1 min-w-0">
            <div className={`font-bold text-sm text-(--color-navy) ${sm ? 'break-words' : 'overflow-hidden text-ellipsis whitespace-nowrap'}`} style={{ fontFamily: F }}>
              {list.title}
            </div>
            <div className="text-[11px] text-(--color-text-light) mt-[2px]">
              {list.items?.length || 0} parfüm
            </div>
          </div>

          {/* Actions — masaüstünde başlığın yanında */}
          {!sm && (
            <div className="flex gap-[6px] items-center shrink-0" onClick={(e) => e.stopPropagation()}>
              {actionButtons}
            </div>
          )}
        </div>

        {/* Actions — mobilde başlığın altında, sağa hizalı */}
        {sm && (
          <div className="flex gap-[6px] items-center justify-end mt-3" onClick={(e) => e.stopPropagation()}>
            {actionButtons}
          </div>
        )}
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
    setShareCard(list);
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
          list={shareCard}
          username={user?.username || user?.uid}
          logoUrl={logoUrl}
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
        initialCategory={editingList?.category ?? 'original'}
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
