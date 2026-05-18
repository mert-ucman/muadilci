import { C } from '@/constants/theme';

export function Select({ label, value, onChange, options }) {
  return (
    <div style={{ marginBottom: '16px' }}>
      {label && (
        <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: C.textMid, marginBottom: '6px' }}>
          {label}
        </label>
      )}
      <select
        value={value}
        onChange={onChange}
        style={{
          width: '100%',
          border: `1px solid ${C.border}`,
          borderRadius: '10px',
          padding: '10px 14px',
          fontSize: '14px',
          color: C.text,
          background: C.card,
          outline: 'none',
        }}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}
