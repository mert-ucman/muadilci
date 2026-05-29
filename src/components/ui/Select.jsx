import { C } from '@/constants/theme';

export function Select({ label, value, onChange, options, disabled }) {
  return (
    <div style={{ marginBottom: '16px' }}>
      {label && (
        <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: disabled ? C.textLight : C.textMid, marginBottom: '6px' }}>
          {label}
        </label>
      )}
      <select
        value={value}
        onChange={onChange}
        disabled={disabled}
        style={{
          width: '100%',
          border: `1px solid ${disabled ? C.borderLight : C.border}`,
          borderRadius: '10px',
          padding: '10px 14px',
          fontSize: '14px',
          color: disabled ? C.textLight : C.text,
          background: disabled ? C.bg : C.card,
          outline: 'none',
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.6 : 1,
        }}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}
