import { useEffect, useState } from 'react';
import { C } from '@/constants/theme';

export function PageNavigator({ sections }) {
  const [active, setActive] = useState(sections[0]?.id ?? '');
  const [hovered, setHovered] = useState(false);
  const [dotHover, setDotHover] = useState(null);

  useEffect(() => {
    const els = sections
      .map(s => document.getElementById(s.id))
      .filter(Boolean);

    const getActive = () => {
      const scrollY = window.scrollY + window.innerHeight * 0.35;
      let current = els[0]?.id ?? sections[0]?.id;
      for (const el of els) {
        if (el.offsetTop <= scrollY) current = el.id;
      }
      setActive(current);
    };

    getActive();
    window.addEventListener('scroll', getActive, { passive: true });
    return () => window.removeEventListener('scroll', getActive);
  }, [sections]);

  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setDotHover(null); }}
      style={{
        position: 'fixed',
        left: '24px',
        top: '50%',
        transform: 'translateY(-50%)',
        zIndex: 150,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        gap: '12px',
        opacity: hovered ? 1 : 0.35,
        transition: 'opacity 0.3s ease',
      }}
      className="page-nav"
    >
      {sections.map(s => {
        const isActive = active === s.id;
        const isDotHovered = dotHover === s.id;

        return (
          <div
            key={s.id}
            onClick={() => scrollTo(s.id)}
            onMouseEnter={() => setDotHover(s.id)}
            onMouseLeave={() => setDotHover(null)}
            title={s.label}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              cursor: 'pointer',
            }}
          >
            {/* Label */}
            <span style={{
              fontSize: '10px',
              fontWeight: 600,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: isActive ? C.gold : C.textMid,
              whiteSpace: 'nowrap',
              opacity: hovered ? 1 : isActive ? 1 : 0,
              transform: 'translateX(0)',
              transition: 'opacity 0.25s ease, transform 0.25s ease, color 0.2s',
              fontFamily: 'inherit',
              pointerEvents: 'none',
            }}>
              {s.label}
            </span>

            {/* Dot */}
            <div style={{
              width: isActive ? '10px' : isDotHovered ? '8px' : '6px',
              height: isActive ? '10px' : isDotHovered ? '8px' : '6px',
              borderRadius: '50%',
              background: isActive
                ? C.gold
                : isDotHovered
                  ? C.textMid
                  : 'rgba(0,0,0,0.3)',
              border: isActive ? `2px solid ${C.gold}` : '1.5px solid rgba(0,0,0,0.2)',
              boxShadow: isActive ? `0 0 8px ${C.gold}55` : 'none',
              transition: 'width 0.25s ease, height 0.25s ease, background 0.25s ease, box-shadow 0.25s ease',
              flexShrink: 0,
            }} />
          </div>
        );
      })}
    </div>
  );
}
