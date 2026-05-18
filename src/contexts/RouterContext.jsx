import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const RouterCtx = createContext(null);

export function useRouter() {
  return useContext(RouterCtx);
}

export function RouterProvider({ children }) {
  const getHash = () => window.location.hash.slice(1) || '/';
  const [path, setPath] = useState(getHash);

  useEffect(() => {
    const handler = () => { setPath(getHash()); window.scrollTo(0, 0); };
    window.addEventListener('hashchange', handler);
    return () => window.removeEventListener('hashchange', handler);
  }, []);

  const navigate = useCallback((to) => {
    window.location.hash = to;
    setPath(to);
  }, []);

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
