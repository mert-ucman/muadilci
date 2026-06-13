// Yorum kalite doğrulaması — hem client (anlık UX) hem Cloud Functions (güvenlik)
// tarafında AYNI kuralların uygulanması için ortak mantık.
// Not: Bu dosyanın bir kopyası functions/reviewValidation.js içinde CommonJS
// olarak tutulur; ikisi senkron kalmalıdır.

export const REVIEW_MIN_LENGTH = 40;

// Tek başına yorum sayılmayacak, düşük eforlu kalıplar (normalize edilmiş hali)
const LOW_EFFORT_PHRASES = [
  'cok iyi', 'cok guzel', 'cok kotu', 'fena degil', 'idare eder', 'eh iste',
  'tavsiye ederim', 'tavsiye etmem', 'begendim', 'begenmedim',
  'berbat', 'harika', 'mukemmel', 'rezalet', 'super', 'guzel', 'kotu',
  'iyi', 'fena', 'vasat', 'ortalama', 'idare',
].sort((a, b) => b.length - a.length); // uzun kalıplar önce çıkarılsın

// Türkçe karakterleri sadeleştir + aksanları at
function normalizeTr(s) {
  return s
    .toLocaleLowerCase('tr')
    .replace(/ı/g, 'i').replace(/ş/g, 's').replace(/ğ/g, 'g')
    .replace(/ü/g, 'u').replace(/ö/g, 'o').replace(/ç/g, 'c')
    .normalize('NFKD').replace(/[̀-ͯ]/g, '');
}

// Emoji/sembol/noktalama at — yalnızca harf, rakam ve tek boşluk bırak
function lettersOnly(s) {
  return s
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * @param {string} text
 * @returns {{ ok: true } | { ok: false, code: string, reason: string }}
 */
export function validateReviewText(text) {
  const raw = (text || '').trim();

  // 1) Minimum uzunluk
  if (raw.length < REVIEW_MIN_LENGTH) {
    return { ok: false, code: 'too_short', reason: `Yorum en az ${REVIEW_MIN_LENGTH} karakter olmalıdır.` };
  }

  // 2) Sadece emoji/noktalama/boşluk — yeterli harf yok
  const letterCount = (raw.match(/\p{L}/gu) || []).length;
  if (letterCount < 20) {
    return { ok: false, code: 'no_content', reason: 'Yorum yeterli metin içermiyor; lütfen deneyiminizi kendi cümlelerinizle anlatın.' };
  }

  const cleaned = lettersOnly(raw);
  const normalized = normalizeTr(cleaned);

  // 3) Tekrar eden karakterler / düşük karakter çeşitliliği (ör. "aaaaaaa", "!!!??")
  const compact = normalized.replace(/\s+/g, '');
  if (new Set(compact).size < 8) {
    return { ok: false, code: 'repeated', reason: 'Yorum anlamlı içerik içermeli; tekrar eden karakterlerden oluşamaz.' };
  }

  // 4) Aynı kelimenin tekrarı (ör. "iyi iyi iyi iyi iyi")
  const words = normalized.split(' ').filter(Boolean);
  if (words.length >= 4 && new Set(words).size <= 2) {
    return { ok: false, code: 'repeated_words', reason: 'Yorum aynı kelimelerin tekrarından oluşamaz.' };
  }

  // 5) Düşük eforlu kalıplar — bunları çıkarınca anlamlı içerik kalmıyorsa reddet
  let residue = ` ${words.join(' ')} `;
  for (const phrase of LOW_EFFORT_PHRASES) {
    residue = residue.split(` ${phrase} `).join(' ');
  }
  if (residue.replace(/\s+/g, '').length < 10) {
    return { ok: false, code: 'low_effort', reason: 'Lütfen “çok iyi”, “berbat” gibi kısa ifadeler yerine deneyiminizi açıklayın.' };
  }

  return { ok: true };
}
