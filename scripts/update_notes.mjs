/**
 * update_notes.mjs
 * Firebase'deki mevcut parfüm belgelerini TR CODEX Excel ile eşleştirip
 * notes / year / source / sourceUrl alanlarını günceller.
 * Yeni belge OLUŞTURMAZ — sadece mevcut belgeleri günceller.
 * Kullanım: node scripts/update_notes.mjs
 */
import { readFileSync, writeFileSync } from 'fs';
import { read, utils } from 'xlsx';

const REFRESH_TOKEN = '1//03DbR_wGaKi3dCgYIARAAGAMSNwF-L9Irzkf47Ni2hpv9bHpZTgquMcx1V8ZxA_ZhH-8Wlj3t4dGEHatPJ4LZSH5DdjP7C10DOyU';
const CLIENT_ID     = '563584335869-fgrhgmd47bqnekij5i8b5pr03ho849e6.apps.googleusercontent.com';
const CLIENT_SECRET = 'j9iVZfS8kkCEFUPaAeJV0sAi';
const PROJECT_ID    = 'muadilci-890e4';
const BASE_URL      = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

let _token = null, _expiry = 0;
async function getToken() {
  if (_token && Date.now() < _expiry - 60_000) return _token;
  const r = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ client_id: CLIENT_ID, client_secret: CLIENT_SECRET, refresh_token: REFRESH_TOKEN, grant_type: 'refresh_token' }).toString(),
  });
  const d = await r.json();
  _token = d.access_token; _expiry = Date.now() + d.expires_in * 1000;
  console.log('OAuth2 token alındı.');
  return _token;
}

// ── Firestore değer serileştirici ────────────────────────────────────────────
function fsVal(val) {
  if (val === null || val === undefined) return { nullValue: null };
  if (typeof val === 'boolean')          return { booleanValue: val };
  if (typeof val === 'number')           return Number.isInteger(val) ? { integerValue: String(val) } : { doubleValue: val };
  if (typeof val === 'string')           return { stringValue: val };
  if (Array.isArray(val))                return { arrayValue: { values: val.map(fsVal) } };
  if (typeof val === 'object')           return { mapValue: { fields: Object.fromEntries(Object.entries(val).map(([k, v]) => [k, fsVal(v)])) } };
  return { nullValue: null };
}

// ── Firestore'daki tüm perfumes belgelerini çek ───────────────────────────────
async function fetchAllPerfumes() {
  const docs = [];
  let pageToken = '';
  do {
    let url = `${BASE_URL}/perfumes?pageSize=300&mask.fieldPaths=name&mask.fieldPaths=brandName`;
    if (pageToken) url += `&pageToken=${pageToken}`;
    const r = await fetch(url, { headers: { Authorization: `Bearer ${await getToken()}` } });
    if (!r.ok) throw new Error(`LIST ${r.status}: ${await r.text()}`);
    const data = await r.json();
    for (const doc of (data.documents || [])) {
      const docId = doc.name.split('/').pop();
      const name      = doc.fields?.name?.stringValue      || '';
      const brandName = doc.fields?.brandName?.stringValue || '';
      docs.push({ docId, name, brandName });
    }
    pageToken = data.nextPageToken || '';
    process.stdout.write(`\r  Firestore'dan çekildi: ${docs.length} parfüm...`);
  } while (pageToken);
  console.log();
  return docs;
}

// ── Yardımcı ─────────────────────────────────────────────────────────────────
const norm  = (s) => String(s || '').toLowerCase().replace(/[''′]/g, "'").trim();
const clean = (s) => { const v = String(s ?? '').trim(); return v === '' || v.toLowerCase() === 'nan' || v === 'NA' ? '' : v; };
const toArr = (s) => { const v = clean(s); if (!v) return []; return v.split(',').map(x => x.trim()).filter(Boolean); };

// ── Excel'i oku ───────────────────────────────────────────────────────────────
const FILE = 'C:\\Users\\win10\\OneDrive\\Desktop\\TR CODEX VER_GUNCELLENDI.xlsx';
const wb   = read(readFileSync(FILE));
const rows = utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { defval: '' });
console.log(`Excel okundu: ${rows.length} satır`);

// Excel'den arama haritası: "marka|||isim" → row
const excelMap = new Map();
for (const row of rows) {
  const key = norm(row['Marka']) + '|||' + norm(row['Parfüm Adı']);
  excelMap.set(key, row);
}
// İkinci harita: sadece isim (fallback)
const nameMap = new Map();
for (const row of rows) {
  const key = norm(row['Parfüm Adı']);
  if (!nameMap.has(key)) nameMap.set(key, row);
}

// ── Firestore parfümlerini çek ────────────────────────────────────────────────
console.log('Firestore\'dan mevcut parfümler çekiliyor...');
const fsDocs = await fetchAllPerfumes();
console.log(`Firestore'da ${fsDocs.length} parfüm bulundu.`);

// ── Eşleştir ─────────────────────────────────────────────────────────────────
const updates   = [];   // { docName, fields }
const unmatched = [];   // eşleşmeyen Firestore parfümleri

for (const doc of fsDocs) {
  const key1 = norm(doc.brandName) + '|||' + norm(doc.name);
  const key2 = norm(doc.name);

  const row = excelMap.get(key1) || nameMap.get(key2);
  if (!row) { unmatched.push({ id: doc.docId, name: doc.name, brand: doc.brandName }); continue; }

  const top   = toArr(row['Üst Notalar']);
  const heart = toArr(row['Orta Notalar']);
  const base  = toArr(row['Alt Notalar']);
  // En az bir nota varsa güncelle
  if (!top.length && !heart.length && !base.length) continue;

  const updateFields = {
    notes: { top, heart, base },
    source:    clean(row['Kaynak Site Adı']),
    sourceUrl: clean(row['Kaynak URL']),
  };

  const yearStr = String(row['Çıkış Yılı'] ?? '').trim();
  if (yearStr !== '' && yearStr.toLowerCase() !== 'nan' && !isNaN(Number(yearStr))) {
    updateFields.year = Number(yearStr);
  }

  updates.push({
    docName: `projects/${PROJECT_ID}/databases/(default)/documents/perfumes/${doc.docId}`,
    fields:  updateFields,
  });
}

console.log(`Eşleşen ve güncellenecek: ${updates.length} | Eşleşmeyen: ${unmatched.length}`);
writeFileSync('scripts/notes_unmatched.json', JSON.stringify(unmatched, null, 2));
console.log(`Eşleşmeyen belgeler scripts/notes_unmatched.json'a yazıldı.`);

if (updates.length === 0) { console.log('Güncellenecek belge yok.'); process.exit(0); }

// ── Batch update (updateMask ile sadece belirtilen alanları yazar) ────────────
const CHUNK = 400;
let done = 0;
for (let i = 0; i < updates.length; i += CHUNK) {
  const chunk  = updates.slice(i, i + CHUNK);
  const writes = chunk.map(({ docName, fields }) => ({
    update: {
      name:   docName,
      fields: Object.fromEntries(Object.entries(fields).map(([k, v]) => [k, fsVal(v)])),
    },
    updateMask: { fieldPaths: Object.keys(fields) },
  }));

  const r = await fetch(`${BASE_URL}:batchWrite`, {
    method:  'POST',
    headers: { Authorization: `Bearer ${await getToken()}`, 'Content-Type': 'application/json' },
    body:    JSON.stringify({ writes }),
  });
  if (!r.ok) throw new Error(`batchWrite ${r.status}: ${await r.text()}`);
  done += chunk.length;
  console.log(`✓ ${done}/${updates.length} güncellendi`);
}

console.log(`\nTamamlandı — ${done} parfüm notaları Firestore'a güncellendi.`);
