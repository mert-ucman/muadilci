// Yorum kalite doğrulaması — Cloud Functions (sunucu) tarafı.
// src/utils/reviewValidation.js ile AYNI mantığın CommonJS kopyasıdır;
// ikisi senkron kalmalıdır.

const REVIEW_MIN_LENGTH = 40;

const LOW_EFFORT_PHRASES = [
  'cok iyi', 'cok guzel', 'cok kotu', 'fena degil', 'idare eder', 'eh iste',
  'tavsiye ederim', 'tavsiye etmem', 'begendim', 'begenmedim',
  'berbat', 'harika', 'mukemmel', 'rezalet', 'super', 'guzel', 'kotu',
  'iyi', 'fena', 'vasat', 'ortalama', 'idare',
].sort((a, b) => b.length - a.length);

function normalizeTr(s) {
  return s
    .toLocaleLowerCase('tr')
    .replace(/ı/g, 'i').replace(/ş/g, 's').replace(/ğ/g, 'g')
    .replace(/ü/g, 'u').replace(/ö/g, 'o').replace(/ç/g, 'c')
    .normalize('NFKD').replace(/[̀-ͯ]/g, '');
}

function lettersOnly(s) {
  return s
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function validateReviewText(text) {
  const raw = (text || '').trim();

  if (raw.length < REVIEW_MIN_LENGTH) {
    return { ok: false, code: 'too_short', reason: `Yorum en az ${REVIEW_MIN_LENGTH} karakter olmalıdır.` };
  }

  const letterCount = (raw.match(/\p{L}/gu) || []).length;
  if (letterCount < 20) {
    return { ok: false, code: 'no_content', reason: 'Yorum yeterli metin içermiyor; lütfen deneyiminizi kendi cümlelerinizle anlatın.' };
  }

  const cleaned = lettersOnly(raw);
  const normalized = normalizeTr(cleaned);

  const compact = normalized.replace(/\s+/g, '');
  if (new Set(compact).size < 8) {
    return { ok: false, code: 'repeated', reason: 'Yorum anlamlı içerik içermeli; tekrar eden karakterlerden oluşamaz.' };
  }

  const words = normalized.split(' ').filter(Boolean);
  if (words.length >= 4 && new Set(words).size <= 2) {
    return { ok: false, code: 'repeated_words', reason: 'Yorum aynı kelimelerin tekrarından oluşamaz.' };
  }

  let residue = ` ${words.join(' ')} `;
  for (const phrase of LOW_EFFORT_PHRASES) {
    residue = residue.split(` ${phrase} `).join(' ');
  }
  if (residue.replace(/\s+/g, '').length < 10) {
    return { ok: false, code: 'low_effort', reason: 'Lütfen “çok iyi”, “berbat” gibi kısa ifadeler yerine deneyiminizi açıklayın.' };
  }

  return { ok: true };
}

module.exports = { validateReviewText, REVIEW_MIN_LENGTH };
