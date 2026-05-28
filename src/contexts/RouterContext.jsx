import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';

const RouterCtx = createContext(null);

export function useRouter() {
  return useContext(RouterCtx);
}

export function RouterProvider({ children }) {
  const getPath = () => {
    // Firebase şifre sıfırlama / e-posta action linkleri: ?mode=...&oobCode=...
    const sp = new URLSearchParams(window.location.search);
    const mode = sp.get('mode');
    const oobCode = sp.get('oobCode');
    if (mode === 'resetPassword' && oobCode) {
      const target = `/sifre-yenile?oobCode=${encodeURIComponent(oobCode)}`;
      window.history.replaceState(null, '', target);
      return target;
    }
    // Eski hash tabanlı linkleri (#/parfumler) temiz URL'ye çevir — geriye uyumluluk
    if (window.location.hash.startsWith('#/')) {
      const target = window.location.hash.slice(1);
      window.history.replaceState(null, '', target);
      return target;
    }
    return (window.location.pathname || '/') + window.location.search;
  };

  const [path, setPath] = useState(getPath);
  const scrollPositions = useRef(new Map());
  const currentPathRef = useRef(getPath());

  useEffect(() => {
    const handler = () => {
      // Gitmeden önce mevcut scroll pozisyonunu kaydet
      scrollPositions.current.set(currentPathRef.current, window.scrollY);

      const newPath = getPath();
      currentPathRef.current = newPath;
      setPath(newPath);

      // Kaydedilmiş pozisyona geri dön, yoksa en üste git
      const saved = scrollPositions.current.get(newPath);
      requestAnimationFrame(() => {
        window.scrollTo(0, saved ?? 0);
      });
    };
    // History API: geri/ileri tuşları popstate tetikler
    window.addEventListener('popstate', handler);
    return () => window.removeEventListener('popstate', handler);
  }, []);

  const navigate = useCallback((to) => {
    if (!to) return;
    if (to === path) { window.scrollTo(0, 0); return; }
    // Mevcut sayfanın scroll pozisyonunu kaydet
    scrollPositions.current.set(path, window.scrollY);
    window.history.pushState(null, '', to);
    currentPathRef.current = to;
    setPath(to);
    window.scrollTo(0, 0);
  }, [path]);

  const basePath = path.split('?')[0];
  const query = {};
  if (path.includes('?')) {
    path.split('?')[1].split('&').forEach((p) => {
      const [k, v] = p.split('=');
      if (k) query[k] = decodeURIComponent(v || '');
    });
  }

  return (
    <RouterCtx.Provider value={{ path, basePath, query, navigate }}>
      {children}
    </RouterCtx.Provider>
  );
}
