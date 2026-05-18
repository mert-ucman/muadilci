import { useState, useEffect } from 'react';

export function useW() {
  const [w, setW] = useState(() => window.innerWidth);
  useEffect(() => {
    const h = () => setW(window.innerWidth);
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);
  return { w, sm: w < 640, md: w < 768, lg: w < 1024 };
}
