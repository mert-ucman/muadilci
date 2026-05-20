/**
 * Türkçe küfür / hakaret filtresi
 *
 * Yakalanan bypass teknikleri:
 *  1. Büyük/küçük harf karışımı       → "SiK", "YaRrAk"
 *  2. Türkçe karakter varyantları      → ş→s, ç→c, ı→i, ö→o, ü→u, ğ→g
 *  3. Leet-speak / sembol ikamesi      → @→a, 0→o, 3→e, 1→i, 4→a, 5→s, $→s
 *  4. Harf arası ayraçlar              → "s.i.k", "s*i*k", "y-a-r-r-a-k"
 *  5. Sesli harf çıkarma               → "yrrak", "yrrk", "sktir", "rspu"
 *  6. Tekrarlanan harfler              → "siiik", "yaarrrak"
 */

// ─── Substring olarak taranan kelimeler ────────────────────────────────────
const BANNED_SUBSTR = [
  'amina', 'amcik', 'amcuk', 'amkafa', 'orospu', 'orospucocugu',
  'pic',
  'sik', 'sikerim', 'sikeyim', 'sikim', 'siktir',
  'yarrak', 'yarak',
  'got', 'gotlek', 'gotveren',
  'ibne',
  'anani', 'ananin',
  'bacini', 'bacinin',
  'pust',
  'gavat',
  'kahpe',
  'pezevenk',
  'lavuk',
  'eben', 'ebenin',
  'serefsiz',
  'haysiyetsiz',
  'gerizekali',
  'dangalak',
];

// ─── Yalnızca TAM KELİME olarak taranan kelimeler ───────────────────────────
const BANNED_WHOLE = [
  'amk', 'aq', 'amq', 'mk',
  'oc',
  'salak', 'aptal', 'mal', 'mallik',
  'it', 'kopek',
  'piçler', 'picler',
];

// ─── Sesli harfler ──────────────────────────────────────────────────────────
// Normalize sonrası Türkçe sesli harfler zaten ASCII'ye çevrilmiş olur
const VOWELS = /[aeiou]/g;

// ─── Normalleştirici ────────────────────────────────────────────────────────
function normalize(str) {
  return (str || '')
    .toLowerCase()
    // Türkçe → ASCII
    .replace(/[ıİ]/g, 'i')
    .replace(/[ğĞ]/g, 'g')
    .replace(/[üÜ]/g, 'u')
    .replace(/[şŞ]/g, 's')
    .replace(/[öÖ]/g, 'o')
    .replace(/[çÇ]/g, 'c')
    // Leet-speak / sembol
    .replace(/@/g, 'a')
    .replace(/0/g, 'o')
    .replace(/3/g, 'e')
    .replace(/1/g, 'i')
    .replace(/4/g, 'a')
    .replace(/5/g, 's')
    .replace(/\$/g, 's')
    .replace(/!/g, 'i')
    .replace(/\+/g, 't')
    .replace(/\|/g, 'l');
}

// Harf arası ayraçları kaldır: "s.i.k" → "sik"
function stripSeparators(norm) {
  return norm.replace(/[\s.\-_*+|,^~`'"\\/%]+/g, '');
}

// Tekrar eden harfleri tek hale getir: "siiik" → "sik", "yaarrrak" → "yarak"
function collapseRepeats(str) {
  return str.replace(/(.)\1+/g, '$1');
}

// Sesli harfleri çıkar: "yarrak" → "yrrk"
function removeVowels(str) {
  return str.replace(VOWELS, '');
}

// ─── Ana kontrol fonksiyonu ─────────────────────────────────────────────────
/**
 * @param {string} text  Kontrol edilecek metin
 * @returns {boolean}    true → hakaret içeriyor
 */
export function containsProfanity(text) {
  if (!text || !text.trim()) return false;

  const norm     = normalize(text);
  const compact  = stripSeparators(norm);           // ayraçsız
  const collapsed = collapseRepeats(compact);        // tekrarsız + ayraçsız
  const noVowels  = removeVowels(collapsed);         // sesli harfsiz + tekrarsız + ayraçsız

  // Banned word'ün dönüşümlerini önbelleğe al
  function check(word) {
    const nw         = normalize(word);
    const nwCollapsed = collapseRepeats(nw);         // tekrar harf normalize
    const nwNoVowels  = removeVowels(nwCollapsed);   // sesli harfsiz versiyonu

    // — Substring kontrolleri —
    if (norm.includes(nw))         return true;  // doğrudan eşleşme
    if (compact.includes(nw))      return true;  // ayraç bypass
    if (collapsed.includes(nwCollapsed)) return true; // tekrar harf bypass

    // — Sesli harf çıkarma bypass —
    // Yanlış pozitifi önlemek için en az 3 ünsüz gerektirir
    if (nwNoVowels.length >= 3) {
      if (noVowels.includes(nwNoVowels)) return true;
    }

    return false;
  }

  // 1) Substring taraması
  for (const word of BANNED_SUBSTR) {
    if (check(word)) return true;
  }

  // 2) Tam kelime taraması (kısa / muğlak kelimeler)
  for (const word of BANNED_WHOLE) {
    const nw          = normalize(word);
    const nwCollapsed  = collapseRepeats(nw);
    const nwNoVowels   = removeVowels(nwCollapsed);

    const re          = new RegExp(`(^|[^a-z0-9])${nwCollapsed}([^a-z0-9]|$)`);
    if (re.test(norm) || re.test(compact) || re.test(collapsed)) return true;

    if (nwNoVowels.length >= 3) {
      const reNV = new RegExp(`(^|[^a-z0-9])${nwNoVowels}([^a-z0-9]|$)`);
      if (reNV.test(noVowels)) return true;
    }
  }

  return false;
}
