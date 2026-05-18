import { useState } from 'react';
import { C } from '@/constants/theme';

export function Card({ children, style: s, onClick, hover }) {
  const [hov, setHov] = useState(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => hover && setHov(true)}
      onMouseLeave={() => hover && setHov(false)}
      style={{
        background: C.card,
        border: `1px solid ${C.border}`,
        borderRadius: '16px',
        boxShadow: hov ? C.shadowMd : C.shadow,
        transition: 'all .2s',
        cursor: onClick ? 'pointer' : 'default',
        ...s,
      }}
    >
      {children}
    </div>
  );
}
