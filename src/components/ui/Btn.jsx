import { useState } from 'react';
import { C, F } from '@/constants/theme';

const SIZES = {
  sm: { padding: '6px 14px',  fontSize: '13px' },
  md: { padding: '10px 20px', fontSize: '14px' },
  lg: { padding: '14px 30px', fontSize: '15px' },
};

const VARIANTS = {
  primary:   { background: `linear-gradient(135deg,${C.gold},${C.goldLight})`, color: '#fff', border: 'none', boxShadow: '0 2px 8px rgba(184,150,90,.3)' },
  secondary: { background: C.card,      color: C.text,   border: `1px solid ${C.border}` },
  ghost:     { background: 'transparent', color: C.gold, border: `1px solid ${C.goldBorder}` },
  danger:    { background: C.redBg,     color: C.red,    border: `1px solid ${C.redBorder}` },
  success:   { background: C.greenBg,   color: C.green,  border: `1px solid ${C.greenBorder}` },
  navy:      { background: C.navy,      color: '#fff',   border: 'none' },
  orange:    { background: C.orangeBg,  color: C.orange, border: '1px solid #f0c878' },
};

export function Btn({ children, onClick, variant = 'primary', size = 'md', style: s, disabled }) {
  const [hov, setHov] = useState(false);
  return (
    <button
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: '6px',
        borderRadius: '10px',
        cursor: disabled ? 'not-allowed' : 'pointer',
        fontFamily: F, fontWeight: 600,
        transition: 'all .18s',
        opacity: disabled ? 0.6 : 1,
        transform: hov && !disabled ? 'translateY(-1px)' : 'none',
        ...SIZES[size],
        ...VARIANTS[variant],
        ...s,
      }}
    >
      {children}
    </button>
  );
}
