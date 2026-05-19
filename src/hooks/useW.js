import { useState, useEffect } from 'react';

export function useW() {
  const [w, setW] = useState(() => window.innerWidth);
  useEffect(() => {
    const h = () => setW(window.innerWidth);
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);
  return {
    w,
    xs: w < 480,   // küçük mobil
    sm: w < 640,   // mobil
    md: w < 768,   // tablet portrait
    lg: w < 1024,  // tablet landscape / küçük laptop
    xl: w < 1280,  // normal laptop
    wide: w >= 1280, // geniş ekran
  };
}

// Responsive container max-width
export const container = (w) => ({
  width: '100%',
  maxWidth: w >= 1280 ? '1320px' : w >= 1024 ? '1024px' : '100%',
  margin: '0 auto',
  padding: w < 640 ? '0 16px' : w < 1024 ? '0 24px' : '0 40px',
  boxSizing: 'border-box',
});
