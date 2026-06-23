export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function slugify(s) {
  return s
    .toLowerCase()
    // Türkçe harfleri koru/çevir (NFD bunları ayrıştırmaz, önce ele al)
    .replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's')
    .replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ç/g, 'c')
    // Diğer aksanlı Latin harfleri tabanına indir: é→e, ô→o, è→e, ñ→n …
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}
