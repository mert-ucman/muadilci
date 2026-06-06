import { useState } from 'react';
import { C } from '@/constants/theme';

export function Card({ children, style: s, onClick, hover }) {
  const [hov, setHov] = useState(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => hover && setHov(true)}
      onMouseLeave={() => hover && setHov(false)}
      className="bg-card border border-border rounded-[16px] transition-all duration-200"
      style={{
        boxShadow: hov ? C.shadowMd : C.shadow,
        cursor: onClick ? 'pointer' : 'default',
        ...s,
      }}
    >
      {children}
    </div>
  );
}
