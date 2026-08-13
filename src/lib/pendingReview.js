// Anonim kullanıcı değerlendirme gönderdiğinde taslağı burada saklarız; giriş /
// üyelik tamamlanınca otomatik gönderilir (bkz. Comparison resume effect +
// PendingReviewResumer). Böylece "üye olurken yorumum kayboldu" yaşanmaz.
const KEY = 'muadilci_pending_review';
const TTL_MS = 2 * 60 * 60 * 1000; // 2 saat sonra bayat kabul edilir

// draft: { muadilId, returnUrl, payload }
export function savePendingReview(draft) {
  const record = { ...draft, ts: Date.now() };
  try {
    localStorage.setItem(KEY, JSON.stringify(record));
    return true;
  } catch {
    // Kota aşımı (büyük dataURL fotoğraflar) → fotoğrafsız tekrar dene
    try {
      const slimPayload = { ...draft.payload, originalImage: null, muadilImage: null, imageConsent: false };
      localStorage.setItem(KEY, JSON.stringify({ ...record, payload: slimPayload, photosDropped: true }));
      return true;
    } catch {
      return false;
    }
  }
}

export function readPendingReview() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const d = JSON.parse(raw);
    if (!d?.ts || Date.now() - d.ts > TTL_MS) { localStorage.removeItem(KEY); return null; }
    return d;
  } catch {
    return null;
  }
}

export function clearPendingReview() {
  try { localStorage.removeItem(KEY); } catch { /* noop */ }
}
