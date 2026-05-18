import { useState } from 'react';
import { C } from '@/constants/theme';

export function Input({ label, value, onChange, placeholder, type = 'text', disabled }) {
  const [foc, setFoc] = useState(false);
  return (
    <div style={{ marginBottom: '16px' }}>
      {label && (
        <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: C.textMid, marginBottom: '6px' }}>
          {label}
        </label>
      )}
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        onFocus={() => setFoc(true)}
        onBlur={() => setFoc(false)}
        style={{
          width: '100%',
          border: `1px solid ${foc ? C.gold : C.border}`,
          borderRadius: '10px',
          padding: '10px 14px',
          fontSize: '14px',
          color: C.text,
          background: disabled ? '#f9f9f9' : C.card,
          outline: 'none',
          transition: 'border-color .2s',
        }}
      />
    </div>
  );
}
