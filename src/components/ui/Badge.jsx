import { C } from '@/constants/theme';

const VARIANTS = {
  gold:   { bg: C.goldBg,  border: C.goldBorder,  text: C.gold },
  green:  { bg: C.greenBg, border: C.greenBorder,  text: C.green },
  red:    { bg: C.redBg,   border: C.redBorder,    text: C.red },
  blue:   { bg: C.blueBg,  border: '#bdd3f8',      text: C.blue },
  gray:   { bg: '#f3f4f6', border: '#d1d5db',      text: '#6b7280' },
  orange: { bg: C.orangeBg,border: '#f0c878',      text: C.orange },
};

export function Badge({ children, color = 'gold' }) {
  const t = VARIANTS[color] || VARIANTS.gold;
  return (
    <span style={{
      display: 'inline-block',
      background: t.bg,
      border: `1px solid ${t.border}`,
      borderRadius: '20px',
      padding: '3px 10px',
      fontSize: '12px',
      fontWeight: 600,
      color: t.text,
    }}>
      {children}
    </span>
  );
}
