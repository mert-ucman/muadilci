import { useState, useEffect } from 'react';
import { Modal, Btn } from '@/components/ui';
import { C, F } from '@/constants/theme';

const MAX_ITEMS = 10;

function newRow() {
  return {
    _id: Math.random().toString(36).slice(2),
    isCustom: false,
    brandName: '', perfumeId: '', perfumeName: '',
    customBrand: '', customPerfume: '',
  };
}

function rowDisplayName(row) {
  if (row.isCustom) {
    const b = row.customBrand?.trim();
    const p = row.customPerfume?.trim();
    if (b && p) return `${b} — ${p}`;
    return b || p || '';
  }
  if (row.brandName && row.perfumeName) return `${row.brandName} — ${row.perfumeName}`;
  return '';
}

function InlineSelect({ value, onChange, options, placeholder, disabled }) {
  return (
    <select value={value} onChange={onChange} disabled={disabled} style={{
      flex: 1, border: `1px solid ${C.border}`, borderRadius: '8px',
      padding: '7px 10px', fontSize: '13px',
      color: value ? C.text : C.textLight, background: disabled ? C.bg : C.card,
      outline: 'none', cursor: disabled ? 'not-allowed' : 'pointer', minWidth: 0,
    }}>
      <option value="">{placeholder}</option>
      {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

function CustomInputs({ row, idx, updateRow }) {
  return (
    <>
      <input
        value={row.customBrand}
        onChange={(e) => updateRow(idx, { customBrand: e.target.value })}
        placeholder="Marka"
        style={{
          flex: '0 0 38%', border: `1px solid ${C.border}`, borderRadius: '8px',
          padding: '7px 10px', fontSize: '13px', color: C.text,
          background: C.card, outline: 'none', fontFamily: F, minWidth: 0,
        }}
      />
      <input
        value={row.customPerfume}
        onChange={(e) => updateRow(idx, { customPerfume: e.target.value })}
        placeholder="Ürün"
        style={{
          flex: 1, border: `1px solid ${C.border}`, borderRadius: '8px',
          padding: '7px 10px', fontSize: '13px', color: C.text,
          background: C.card, outline: 'none', fontFamily: F, minWidth: 0,
        }}
      />
    </>
  );
}

export function CreateListModal({ open, onClose, onSave, initialTitle = '', initialItems = null, editMode = false, perfumes = [], muadilPerfumes = [] }) {
  const [title, setTitle] = useState(initialTitle);
  const [category, setCategory] = useState('original');
  const [rows, setRows] = useState(() => initialItems ? initialItems.map((it) => ({ ...newRow(), ...it })) : [newRow()]);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  const [titleFoc, setTitleFoc] = useState(false);
  const [infoDismissed, setInfoDismissed] = useState(false);

  useEffect(() => {
    if (open) {
      setTitle(initialTitle);
      setCategory('original');
      setRows(initialItems ? initialItems.map((it) => ({ ...newRow(), ...it })) : [newRow()]);
      setErr('');
      setInfoDismissed(false);
    }
  }, [open]);

  const sourceList = category === 'original' ? perfumes : muadilPerfumes;

  const brandOptions = [...new Set(sourceList.map((p) => p.brandName))]
    .sort()
    .map((b) => ({ value: b, label: b }));

  const perfumesForBrand = (brandName) =>
    sourceList
      .filter((p) => p.brandName === brandName)
      .map((p) => ({ value: String(p.id), label: p.name, name: p.name }));

  const hasCustom = rows.some((r) => r.isCustom);

  const updateRow = (idx, patch) =>
    setRows((prev) => prev.map((r, i) => i === idx ? { ...r, ...patch } : r));

  const addRow = () => {
    if (rows.length >= MAX_ITEMS) return;
    setRows((prev) => [...prev, newRow()]);
  };

  const removeRow = (idx) => setRows((prev) => prev.filter((_, i) => i !== idx));

  const handleBrandChange = (idx, brandName) =>
    updateRow(idx, { brandName, perfumeId: '', perfumeName: '' });

  const handlePerfumeChange = (idx, perfumeId, brandName) => {
    const opts = perfumesForBrand(brandName);
    const found = opts.find((o) => o.value === perfumeId);
    updateRow(idx, { perfumeId, perfumeName: found?.name || '' });
  };

  const handleCategoryChange = (cat) => {
    setCategory(cat);
    setRows([newRow()]);
  };

  const handleSave = async () => {
    if (!title.trim()) { setErr('Liste başlığı zorunludur.'); return; }
    const filledRows = rows.filter((r) => rowDisplayName(r));
    if (!filledRows.length) { setErr('En az bir parfüm ekleyin.'); return; }
    setSaving(true);
    setErr('');
    try {
      await onSave({
        title: title.trim(),
        category,
        items: filledRows.map((row) => ({
          isCustom: row.isCustom,
          brandName: row.isCustom ? row.customBrand?.trim() : row.brandName,
          perfumeId: row.isCustom ? '' : row.perfumeId,
          perfumeName: row.isCustom ? row.customPerfume?.trim() : row.perfumeName,
          displayName: rowDisplayName(row),
        })),
      });
      onClose();
    } catch {
      setErr('Kaydedilemedi. Tekrar deneyin.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={editMode ? 'Listeyi Düzenle' : 'Yeni Liste Oluştur'} width="600px">

      {/* Bilgi uyarısı */}
      {!infoDismissed && (
        <div className="flex items-center gap-[10px] bg-[#eff6ff] border border-[#bfdbfe] rounded-lg p-[9px_12px] mb-4">
          <svg width="15" height="15" fill="none" stroke="#3b82f6" strokeWidth="2" viewBox="0 0 24 24" className="shrink-0">
            <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span className="flex-1 text-[12px] text-[#1d4ed8]" style={{ fontFamily: F }}>
            Sadece muadilleri olan parfümler listelenir.
          </span>
          <button onClick={() => setInfoDismissed(true)} className="bg-transparent border-0 cursor-pointer text-[#93c5fd] text-base leading-none shrink-0 p-[0_2px]">×</button>
        </div>
      )}

      {/* Başlık */}
      <div className="mb-[18px]">
        <label className="block text-[12px] font-semibold text-(--color-text-mid) mb-[6px] tracking-[.03em]">LİSTE BAŞLIĞI</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onFocus={() => setTitleFoc(true)}
          onBlur={() => setTitleFoc(false)}
          placeholder="Örn: En İyi 5 Yaz Parfümü"
          style={{
            width: '100%', boxSizing: 'border-box',
            border: `1px solid ${titleFoc ? C.gold : C.border}`,
            borderRadius: '10px', padding: '10px 14px',
            fontSize: '15px', fontWeight: 600, color: C.text,
            outline: 'none', fontFamily: F, transition: 'border-color 0.2s',
          }}
        />
      </div>

      {/* Kategori seçimi */}
      <div className="mb-[18px]">
        <label className="block text-[12px] font-semibold text-(--color-text-mid) mb-2 tracking-[.03em]">KATEGORİ</label>
        <div className="flex gap-[10px]">
          {[{ v: 'original', l: 'Orijinal Parfümler' }, { v: 'muadil', l: 'Muadil Parfümler' }].map(({ v, l }) => (
            <label key={v} style={{
              display: 'flex', alignItems: 'center', gap: '7px', cursor: 'pointer',
              padding: '8px 14px', borderRadius: '8px',
              border: `1px solid ${category === v ? C.gold : C.border}`,
              background: category === v ? C.goldBg : 'transparent',
              transition: 'all 0.15s',
            }}>
              <input
                type="radio"
                name="list-category"
                value={v}
                checked={category === v}
                onChange={() => handleCategoryChange(v)}
                style={{ accentColor: C.gold, cursor: 'pointer' }}
              />
              <span style={{ fontSize: '13px', fontWeight: category === v ? 700 : 500, color: category === v ? C.gold : C.textMid, fontFamily: F }}>
                {l}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Parfümler başlık */}
      <div className="flex justify-between items-center mb-[10px]">
        <label className="text-[12px] font-semibold text-(--color-text-mid) tracking-[.03em]">
          PARFÜMLER ({rows.length}/{MAX_ITEMS})
        </label>
        {hasCustom && (
          <div className="inline-flex items-center justify-center text-[11px] font-semibold px-2 rounded-[6px] bg-[#fffbeb] text-[#b45309] border border-[#fcd34d]" style={{ height: '22px' }}>
            <p className="m-0 p-0 w-max cap-center" style={{ lineHeight: '20px' }}>Listede olmayan parfüm var</p>
          </div>
        )}
      </div>

      {/* Satırlar */}
      <div className="flex flex-col gap-2 mb-[10px]">
        {rows.map((row, idx) => (
          <div key={row._id} className="flex gap-[6px] items-center">
            <span className="text-[12px] text-(--color-text-light) font-bold min-w-[20px] text-right shrink-0">{idx + 1}</span>

            {row.isCustom ? (
              <CustomInputs row={row} idx={idx} updateRow={updateRow} />
            ) : (
              <>
                <InlineSelect
                  value={row.brandName}
                  onChange={(e) => handleBrandChange(idx, e.target.value)}
                  options={brandOptions}
                  placeholder="Marka seçin..."
                />
                <InlineSelect
                  value={row.perfumeId}
                  onChange={(e) => handlePerfumeChange(idx, e.target.value, row.brandName)}
                  options={perfumesForBrand(row.brandName)}
                  placeholder="Parfüm seçin..."
                  disabled={!row.brandName}
                />
              </>
            )}

            <label className="flex items-center gap-1 text-[11px] text-(--color-text-light) cursor-pointer whitespace-nowrap shrink-0">
              <input
                type="checkbox"
                checked={row.isCustom}
                onChange={(e) => updateRow(idx, { isCustom: e.target.checked, brandName: '', perfumeId: '', perfumeName: '', customBrand: '', customPerfume: '' })}
                style={{ accentColor: C.gold, cursor: 'pointer' }}
              />
              Listede yok
            </label>

            {rows.length > 1 && (
              <button onClick={() => removeRow(idx)}
                className="bg-transparent border-0 cursor-pointer text-(--color-text-light) text-base leading-none p-[2px_4px] shrink-0 transition-colors duration-150 hover:text-(--color-red)"
              >×</button>
            )}
          </div>
        ))}
      </div>

      {rows.length < MAX_ITEMS && (
        <button onClick={addRow}
          className="flex items-center gap-[6px] w-full p-2 rounded-lg border border-dashed border-(--color-border) bg-transparent text-(--color-text-mid) text-[13px] cursor-pointer justify-center mb-4 transition-colors duration-150 hover:border-(--color-gold) hover:text-(--color-gold)"
          style={{ fontFamily: F }}
        >
          <span className="text-base font-bold">+</span> Parfüm Ekle
        </button>
      )}

      {err && (
        <div className="bg-(--color-red-bg) border border-(--color-red-border) rounded-lg p-[9px_13px] text-(--color-red) text-[13px] mb-3">
          {err}
        </div>
      )}

      <div className="flex gap-2 justify-end">
        <Btn variant="secondary" onClick={onClose} disabled={saving}>İptal</Btn>
        <Btn onClick={handleSave} disabled={saving}>
          {saving ? 'Kaydediliyor...' : editMode ? 'Güncelle' : 'Listeyi Kaydet'}
        </Btn>
      </div>
    </Modal>
  );
}
