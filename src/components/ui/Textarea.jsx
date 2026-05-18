import { useState } from 'react';
import { C } from '@/constants/theme';

export function Textarea({ label, value, onChange, placeholder, rows = 4 }) {
  const [foc, setFoc] = useState(false);
  return (
    <div style={{ marginBottom: '16px' }}>
      {label && (
        <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: C.textMid, marginBottom: '6px' }}>
          {label}
        </label>
      )}
      <textarea
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        rows={rows}
        onFocus={() => setFoc(true)}
        onBlur={() => setFoc(false)}
        style={{
          width: '100%',
          border: `1px solid ${foc ? C.gold : C.border}`,
          borderRadius: '10px',
          padding: '10px 14px',
          fontSize: '14px',
          color: C.text,
          background: C.card,
          outline: 'none',
          resize: 'vertical',
          transition: 'border-color .2s',
        }}
      />
    </div>
  );
}
