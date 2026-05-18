import { createContext, useContext, useState } from 'react';

const AuthCtx = createContext(null);

export function useAuth() {
  return useContext(AuthCtx);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('mc_u')); } catch { return null; }
  });

  const login = (u) => { setUser(u); localStorage.setItem('mc_u', JSON.stringify(u)); };
  const logout = () => { setUser(null); localStorage.removeItem('mc_u'); };
  const isAdmin = user?.role === 'admin';
  const isMod = user?.role === 'moderator' || user?.role === 'admin';

  return (
    <AuthCtx.Provider value={{ user, login, logout, isAdmin, isMod }}>
      {children}
    </AuthCtx.Provider>
  );
}
