// Route tanımları App.jsx içinde lazy import ile kullanılır.
// matchRoute yardımcısı da burada tanımlanır.

export function matchRoute(pattern, base) {
  const pp = pattern.split('/');
  const bp = base.split('/');
  if (pp.length !== bp.length) return null;
  const params = {};
  for (let i = 0; i < pp.length; i++) {
    if (pp[i].startsWith('@:')) {
      // @:username → path segment must start with @
      if (!bp[i].startsWith('@')) return null;
      params[pp[i].slice(2)] = bp[i].slice(1);
    } else if (pp[i].startsWith(':')) {
      params[pp[i].slice(1)] = bp[i];
    } else if (pp[i] !== bp[i]) return null;
  }
  return params;
}

export const NO_LAYOUT_PATHS = ['/giris', '/kayit', '/sifre-sifirla', '/sifre-yenile'];
