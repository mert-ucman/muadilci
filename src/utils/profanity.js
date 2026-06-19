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
  // Hakaret / küfür
  'amina', 'amcik', 'amcuk', 'amkafa', 'orospu', 'orospucocugu',
  // NOT: 'sik', 'sikis', 'got', 'pic' gibi kısa kökler BANNED_SUBSTR'de TUTULMAZ.
  // Türkçe ı→i normalizasyonu yüzünden masum kelimelerle çakışıyorlar:
  // "sıktım/sıkıntı/sık", "sıkış(ık)", "götür", "kapıcı/yapıcı", "siklamen" (parfüm notası).
  // Gerçek küfürler bileşik formlar + tam-kelime (BANNED_WHOLE) ile yakalanır.
  'sikerim', 'sikeyim', 'sikim', 'siktir',
  'yarrak', 'yarak',
  'gotlek', 'gotveren',
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
  // Cinsel içerik
  'sex', 'seks',
  'penis', 'peniz',
  'vajina', 'vagina',
  'vujna',
  'porno', 'porn',
  'erotik',
  'orgazm', 'orgasm',
  'masturbas', 'masturbat',
  'fetis',
  'meme',
  'kalca',
  'amcig', 'amcık',
];

// ─── Yalnızca TAM KELİME olarak taranan kelimeler ───────────────────────────
const BANNED_WHOLE = [
  'amk', 'aq', 'amq', 'mk',
  'oc',
  'salak', 'aptal', 'mal', 'mallik',
  'it', 'kopek',
  'piçler', 'picler', 'pic',
  // Tek başına kullanıldığında cinsel anlam taşıyan kısa kelimeler
  'am', 'got',
];

// ─── Sesli harfler ──────────────────────────────────────────────────────────
// Normalize sonrası Türkçe sesli harfler zaten ASCII'ye çevrilmiş olur
const VOWELS = /[aeiou]/g;

// Sesli-harf-çıkarma bypass'ı, günlük kelimelerle çakışan kısa köklerde yanlış
// pozitife yol açar. Örn: "kalça" → "klc" ⊂ "kalıcılığı" (parfüm domaininin temel
// kelimesi). Bu kelimeler YALNIZCA doğrudan / tam-kelime eşleşmeyle taranır.
const VOWEL_STRIP_EXEMPT = new Set(['kalca']);

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
function _scan(text) {
  if (!text || !text.trim()) return [];

  const norm      = normalize(text);
  const compact   = stripSeparators(norm);
  const collapsed = collapseRepeats(compact);

  // Token'ı hem sesli-harfsiz formu hem de sesli harf sayısıyla sakla.
  // Sesli harf sayısı ≤1 olan token bypass girişimi sayılır; normal Türkçe
  // kelimeler çok sesli harf içerdiğinden yanlış pozitif üretmez.
  const tokens = norm.split(/[^a-z0-9]+/).filter(Boolean).map((tok) => ({
    bare: removeVowels(collapseRepeats(tok)),
    vowels: (tok.match(/[aeiou]/g) || []).length,
  }));

  function check(word) {
    const nw          = normalize(word);
    const nwCollapsed = collapseRepeats(nw);
    const nwNoVowels  = removeVowels(nwCollapsed);

    if (norm.includes(nw))               return true;
    if (compact.includes(nw))            return true;
    if (collapsed.includes(nwCollapsed)) return true;

    if (nwNoVowels.length >= 3 && !VOWEL_STRIP_EXEMPT.has(nw)) {
      if (tokens.some((t) => t.bare === nwNoVowels && t.vowels <= 1)) return true;
    }
    return false;
  }

  const matched = [];

  for (const word of BANNED_SUBSTR) {
    if (check(word)) matched.push(word);
  }

  for (const word of BANNED_WHOLE) {
    const nw          = normalize(word);
    const nwCollapsed = collapseRepeats(nw);
    const nwNoVowels  = removeVowels(nwCollapsed);

    const re = new RegExp(`(^|[^a-z0-9])${nwCollapsed}([^a-z0-9]|$)`);
    if (re.test(norm) || re.test(compact) || re.test(collapsed)) {
      matched.push(word);
      continue;
    }
    if (nwNoVowels.length >= 3 && !VOWEL_STRIP_EXEMPT.has(nw)) {
      if (tokens.some((t) => t.bare === nwNoVowels && t.vowels <= 1)) matched.push(word);
    }
  }

  return matched;
}

/**
 * @param {string} text
 * @returns {boolean} true → hakaret içeriyor
 */
export function containsProfanity(text) {
  return _scan(text).length > 0;
}

/**
 * @param {string} text
 * @returns {string[]} eşleşen yasaklı kelimeler
 */
export function findProfanityMatches(text) {
  return _scan(text);
}
