import { C } from '@/constants/theme';

export function Select({ label, value, onChange, options, disabled }) {
  return (
    <div className="mb-4">
      {label && (
        <label
          className="block text-[13px] font-semibold mb-[6px]"
          style={{ color: disabled ? C.textLight : C.textMid }}
        >
          {label}
        </label>
      )}
      <select
        value={value}
        onChange={onChange}
        disabled={disabled}
        className="w-full rounded-[10px] px-[14px] py-[10px] text-[14px] outline-none"
        style={{
          border: `1px solid ${disabled ? C.borderLight : C.border}`,
          color: disabled ? C.textLight : C.text,
          background: disabled ? C.bg : C.card,
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
