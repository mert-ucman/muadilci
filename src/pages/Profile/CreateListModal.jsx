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
        <div style={{
          display: 'flex', alignItems: 'center', gap: '10px',
          background: '#eff6ff', border: '1px solid #bfdbfe',
          borderRadius: '8px', padding: '9px 12px', marginBottom: '16px',
        }}>
          <svg width="15" height="15" fill="none" stroke="#3b82f6" strokeWidth="2" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
            <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span style={{ flex: 1, fontSize: '12px', color: '#1d4ed8', fontFamily: F }}>
            Sadece muadilleri olan parfümler listelenir.
          </span>
          <button onClick={() => setInfoDismissed(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#93c5fd', fontSize: '16px', lineHeight: 1, padding: '0 2px', flexShrink: 0 }}>×</button>
        </div>
      )}

      {/* Başlık */}
      <div style={{ marginBottom: '18px' }}>
        <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: C.textMid, marginBottom: '6px', letterSpacing: '.03em' }}>LİSTE BAŞLIĞI</label>
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
      <div style={{ marginBottom: '18px' }}>
        <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: C.textMid, marginBottom: '8px', letterSpacing: '.03em' }}>KATEGORİ</label>
        <div style={{ display: 'flex', gap: '10px' }}>
          {[{ v: 'original', l: 'Orijinal Parfümler' }, { v: 'muadil', l: 'Muadil Parfümler' }].map(({ v, l }) => (
            <label key={v} style={{ display: 'flex', alignItems: 'center', gap: '7px', cursor: 'pointer', padding: '8px 14px', borderRadius: '8px', border: `1px solid ${category === v ? C.gold : C.border}`, background: category === v ? C.goldBg : 'transparent', transition: 'all 0.15s' }}>
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <label style={{ fontSize: '12px', fontWeight: 600, color: C.textMid, letterSpacing: '.03em' }}>
          PARFÜMLER ({rows.length}/{MAX_ITEMS})
        </label>
        {hasCustom && (
          <span style={{ fontSize: '11px', fontWeight: 600, padding: '3px 8px', borderRadius: '6px', background: '#fffbeb', color: '#b45309', border: '1px solid #fcd34d' }}>
            ⚠ Listede olmayan parfüm var
          </span>
        )}
      </div>

      {/* Satırlar */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '10px' }}>
        {rows.map((row, idx) => (
          <div key={row._id} style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', color: C.textLight, fontWeight: 700, minWidth: '20px', textAlign: 'right', flexShrink: 0 }}>{idx + 1}</span>

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

            <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: C.textLight, cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}>
              <input
                type="checkbox"
                checked={row.isCustom}
                onChange={(e) => updateRow(idx, { isCustom: e.target.checked, brandName: '', perfumeId: '', perfumeName: '', customBrand: '', customPerfume: '' })}
                style={{ accentColor: C.gold, cursor: 'pointer' }}
              />
              Listede yok
            </label>

            {rows.length > 1 && (
              <button onClick={() => removeRow(idx)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.textLight, fontSize: '16px', lineHeight: 1, padding: '2px 4px', flexShrink: 0, transition: 'color 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.color = C.red}
                onMouseLeave={e => e.currentTarget.style.color = C.textLight}
              >×</button>
            )}
          </div>
        ))}
      </div>

      {rows.length < MAX_ITEMS && (
        <button onClick={addRow} style={{ display: 'flex', alignItems: 'center', gap: '6px', width: '100%', padding: '8px', borderRadius: '8px', border: `1px dashed ${C.border}`, background: 'transparent', color: C.textMid, fontSize: '13px', fontFamily: F, cursor: 'pointer', justifyContent: 'center', marginBottom: '16px', transition: 'border-color 0.15s, color 0.15s' }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = C.gold; e.currentTarget.style.color = C.gold; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.textMid; }}
        >
          <span style={{ fontSize: '16px', fontWeight: 700 }}>+</span> Parfüm Ekle
        </button>
      )}

      {err && (
        <div style={{ background: C.redBg, border: `1px solid ${C.redBorder}`, borderRadius: '8px', padding: '9px 13px', color: C.red, fontSize: '13px', marginBottom: '12px' }}>
          ⚠ {err}
        </div>
      )}

      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
        <Btn variant="secondary" onClick={onClose} disabled={saving}>İptal</Btn>
        <Btn onClick={handleSave} disabled={saving}>
          {saving ? 'Kaydediliyor...' : editMode ? 'Güncelle' : 'Listeyi Kaydet'}
        </Btn>
      </div>
    </Modal>
  );
}
