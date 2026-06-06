import { useState } from 'react';
import { C } from '@/constants/theme';

export function Input({ label, value, onChange, placeholder, type = 'text', disabled }) {
  const [foc, setFoc] = useState(false);
  return (
    <div className="mb-4">
      {label && (
        <label className="block text-[13px] font-semibold text-[#4A4A4A] mb-[6px]">
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
        className="w-full rounded-[10px] px-[14px] py-[10px] text-[14px] outline-none transition-[border-color] duration-200"
        style={{
          border: `1px solid ${foc ? C.gold : C.border}`,
          color: C.text,
          background: disabled ? '#f9f9f9' : C.card,
        }}
      />
    </div>
  );
}
