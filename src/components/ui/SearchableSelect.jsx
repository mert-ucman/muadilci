import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { C } from '@/constants/theme';

/* ─── Searchable Select ─────────────────────────────────────────────────── */
export function SearchableSelect({ label, options, value, onChange, onCommit, placeholder = 'Ara veya seçin…', disabled = false, autoOpen = false }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [dropPos, setDropPos] = useState({ top: 0, left: 0, width: 0 });
  const triggerRef = useRef(null);
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);
  const listRef = useRef(null);
  const [highlighted, setHighlighted] = useState(0);
  const wheelAccumRef = useRef(0);

  useEffect(() => { if (autoOpen && !disabled) setOpen(true); }, [autoOpen, disabled]);

  const filtered = query.trim()
    ? options.filter((o) => o.label.toLowerCase().includes(query.toLowerCase()))
    : options;

  const selected = options.find((o) => o.value === value);

  const calcPos = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const top = spaceBelow < 260 ? rect.top - 270 : rect.bottom + 4;
    setDropPos({ top: Math.max(8, top), left: rect.left, width: rect.width });
  }, []);

  useEffect(() => { setHighlighted(0); }, [query]);

  useEffect(() => {
    if (!open) { setQuery(''); return; }
    calcPos();
    setTimeout(() => inputRef.current?.focus(), 0);
    const idx = filtered.findIndex((o) => o.value === value);
    setHighlighted(idx >= 0 ? idx : 0);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onOutside = (e) => {
      if (!triggerRef.current?.contains(e.target) && !dropdownRef.current?.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onOutside);
    window.addEventListener('scroll', calcPos, true);
    window.addEventListener('resize', calcPos);
    return () => {
      document.removeEventListener('mousedown', onOutside);
      window.removeEventListener('scroll', calcPos, true);
      window.removeEventListener('resize', calcPos);
    };
  }, [open, calcPos]);

  useEffect(() => {
    if (!listRef.current || !open) return;
    listRef.current.children[highlighted]?.scrollIntoView({ block: 'nearest' });
  }, [highlighted, open]);

  const handleWheel = (e) => {
    e.preventDefault();
    wheelAccumRef.current += e.deltaMode === 0 ? e.deltaY : e.deltaY * 20;
    const steps = Math.trunc(wheelAccumRef.current / 80);
    if (steps !== 0) {
      wheelAccumRef.current -= steps * 80;
      setHighlighted(prev => Math.max(0, Math.min(filtered.length - 1, prev + steps)));
    }
  };

  const handleKey = (e) => {
    if (!open) { if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') { e.preventDefault(); setOpen(true); } return; }
    if (e.key === 'ArrowDown') { e.preventDefault(); setHighlighted((p) => Math.min(p + 1, filtered.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setHighlighted((p) => Math.max(p - 1, 0)); }
    else if (e.key === 'Enter') { e.preventDefault(); if (filtered[highlighted]) { onChange(filtered[highlighted].value); setOpen(false); onCommit?.(filtered[highlighted].value); } }
    else if (e.key === 'Escape') { setOpen(false); }
  };

  const select = (val) => { onChange(val); setOpen(false); onCommit?.(val); };
  const hasValue = !!value;

  const dropdown = open && createPortal(
    <div
      ref={dropdownRef}
      style={{ position: 'fixed', top: dropPos.top, left: dropPos.left, width: dropPos.width, zIndex: 9999, borderRadius: '10px', overflow: 'hidden', border: `1.5px solid ${C.navy}`, background: '#fff', boxShadow: '0 8px 28px rgba(0,0,0,.16)' }}
    >
      <div style={{ padding: '7px 7px 5px', borderBottom: `1px solid ${C.border}` }}>
        <div style={{ position: 'relative' }}>
          <svg style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} width="13" height="13" fill="none" stroke={C.textLight} strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => { handleKey(e); e.stopPropagation(); }}
            placeholder="Ara…"
            style={{ width: '100%', height: 30, border: `1px solid ${C.border}`, borderRadius: 6, fontSize: 12, outline: 'none', paddingLeft: 28, paddingRight: 8, color: C.text, boxSizing: 'border-box', fontFamily: 'var(--font-body)' }}
          />
        </div>
      </div>
      <div ref={listRef} onWheel={handleWheel} style={{ overflowY: 'auto', maxHeight: 220 }}>
        {filtered.length === 0
          ? <div style={{ padding: '10px 12px', textAlign: 'center', fontSize: 12, color: C.textLight }}>Sonuç bulunamadı</div>
          : filtered.map((o, i) => (
            <div
              key={o.value}
              onMouseDown={() => select(o.value)}
              onMouseEnter={() => setHighlighted(i)}
              style={{ padding: '7px 12px', fontSize: 13, cursor: 'pointer', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', background: i === highlighted ? C.goldBg : o.value === value ? '#f0f4ff' : 'transparent', color: i === highlighted ? C.navy : o.value === value ? C.navy : C.text, fontWeight: o.value === value ? 700 : 400 }}
            >
              {o.label}
            </div>
          ))
        }
      </div>
      {filtered.length > 0 && (
        <div style={{ padding: '3px 12px', fontSize: 10, textAlign: 'right', color: C.textLight, borderTop: `1px solid ${C.border}` }}>
          {filtered.length} sonuç · ↑↓ veya tekerlek
        </div>
      )}
    </div>,
    document.body
  );

  return (
    <div className="w-full">
      {label && (
        <label className="block text-[13px] font-semibold mb-[6px]" style={{ color: disabled ? C.textLight : C.textMid }}>{label}</label>
      )}
      <div className="relative w-full" onKeyDown={handleKey} tabIndex={disabled ? -1 : 0}>
        <button
          ref={triggerRef}
          type="button"
          disabled={disabled}
          onClick={() => !disabled && setOpen((o) => !o)}
          className="w-full h-[36px] rounded-[8px] px-[10px] text-[13px] text-left flex items-center justify-between gap-2 outline-none transition-all font-[family-name:var(--font-body)]"
          style={{ border: `1.5px solid ${open ? C.navy : hasValue ? C.navy : C.border}`, background: disabled ? '#f5f5f5' : '#fff', color: hasValue ? C.text : C.textLight, cursor: disabled ? 'not-allowed' : 'pointer' }}
        >
          <span className="truncate">{selected ? selected.label : placeholder}</span>
          <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" style={{ flexShrink: 0, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .15s', color: C.textLight }}>
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </button>
        {dropdown}
      </div>
    </div>
  );
}
