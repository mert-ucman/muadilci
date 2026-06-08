/**
 * fill_notes.mjs
 * Reads notesCache.json + Parfumo data, writes final Excel.
 * Usage: node scripts/fill_notes.mjs
 */
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { read, utils, writeFile } from 'xlsx';

const INPUT  = 'C:\\Users\\win10\\OneDrive\\Desktop\\Veritabanı Parfümleri.xlsx';
const OUTPUT = 'C:\\Users\\win10\\OneDrive\\Desktop\\Veritabanı Parfümleri_Notalar.xlsx';
const CACHE  = 'scripts/notesCache.json';
const PARFUMO_FILE = 'C:\\Users\\win10\\OneDrive\\Desktop\\02_Parfumo_Perfumes_filtered.xlsx';

const norm = s => String(s||'').toLowerCase().replace(/[^a-z0-9 ]/g,' ').replace(/\s+/g,' ').trim();
const clean = s => (s && s !== 'NA') ? s : '';

// --- Load Parfumo data ---
const wb2 = read(readFileSync(PARFUMO_FILE));
const parfumo = utils.sheet_to_json(wb2.Sheets[wb2.SheetNames[0]], {defval:''});
const map1 = new Map(); // brand|name -> row
const map2 = new Map(); // name -> row (fallback)

for (const row of parfumo) {
  const top=clean(row['Üst Notalar']), mid=clean(row['Orta Notalar']),
        bot=clean(row['Alt Notalar']), ana=clean(row['Ana Notalar']);
  if (!top && !mid && !bot && !ana) continue;
  const k1 = norm(row.Brand)+'|'+norm(row.Name);
  map1.set(k1, row);
  const k2 = norm(row.Name);
  if (!map2.has(k2)) map2.set(k2, row);
}

// --- Load web search cache ---
const cache = existsSync(CACHE) ? JSON.parse(readFileSync(CACHE,'utf8')) : {};

// --- Load perfumes ---
const wb1 = read(readFileSync(INPUT));
const perfumes = utils.sheet_to_json(wb1.Sheets[wb1.SheetNames[0]], {defval:''});

let fromParfumo=0, fromCache=0, empty=0;

const result = perfumes.map(p => {
  const marka = p['Marka'];
  const isim  = p['Parfüm Adı'];
  const k1 = norm(marka)+'|'+norm(isim);
  const k2 = norm(isim);
  const words = k2.split(' ');

  // Already filled?
  if (p['Üst Notalar'] || p['Orta Notalar'] || p['Alt Notalar']) {
    return p;
  }

  // 1. Parfumo brand+name match
  let parfRow = map1.get(k1);

  // 2. Parfumo name-only match
  if (!parfRow) parfRow = map2.get(k2);

  // 3. Parfumo suffix match
  if (!parfRow) {
    for (let i=1; i<words.length; i++) {
      const sub = words.slice(i).join(' ');
      if (sub.length > 3 && map2.has(sub)) { parfRow = map2.get(sub); break; }
    }
  }

  if (parfRow) {
    fromParfumo++;
    const top = clean(parfRow['Üst Notalar']) || clean(parfRow['Ana Notalar']);
    const mid = clean(parfRow['Orta Notalar']);
    const bot = clean(parfRow['Alt Notalar']);
    return { ...p, 'Üst Notalar': top, 'Orta Notalar': mid, 'Alt Notalar': bot,
             'Kaynak Site Adı': 'Parfumo', 'Kaynak URL': parfRow['URL'] || '' };
  }

  // 4. Web cache
  const cacheKey = (marka+'|||'+isim).toLowerCase().replace(/[‘’′]/g, "'");
  if (cache[cacheKey]) {
    fromCache++;
    const c = cache[cacheKey];
    return { ...p, 'Üst Notalar': c.top||'', 'Orta Notalar': c.mid||'', 'Alt Notalar': c.bot||'',
             'Kaynak Site Adı': c.source||'', 'Kaynak URL': c.url||'' };
  }

  empty++;
  return p;
});

console.log(`Parfumo: ${fromParfumo} | Cache: ${fromCache} | Boş: ${empty}`);

// Write Excel
const wb = utils.book_new();
const ws = utils.json_to_sheet(result);
utils.book_append_sheet(wb, ws, 'Parfümler');
writeFile(wb, OUTPUT);
console.log(`Kaydedildi: ${OUTPUT}`);

// Print unmatched for reference
const unmatched = result.filter(r => !r['Üst Notalar'] && !r['Orta Notalar'] && !r['Alt Notalar']);
writeFileSync('scripts/unmatched.json', JSON.stringify(unmatched.map(r=>({brand:r['Marka'],name:r['Parfüm Adı']})),null,2));
console.log(`Hala boş: ${unmatched.length} (scripts/unmatched.json'a yazıldı)`);
