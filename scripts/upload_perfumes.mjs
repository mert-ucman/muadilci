/**
 * upload_perfumes.mjs
 * TR CODEX VER_GUNCELLENDI.xlsx → Firestore `perfumes` koleksiyonu
 * Firestore REST API + Firebase CLI OAuth2 token kullanır (service account gerekmez)
 * Kullanım: node scripts/upload_perfumes.mjs
 */
import { readFileSync } from 'fs';
import { read, utils } from 'xlsx';

// ── OAuth2 token yenileme ────────────────────────────────────────────────────
const REFRESH_TOKEN = '1//03DbR_wGaKi3dCgYIARAAGAMSNwF-L9Irzkf47Ni2hpv9bHpZTgquMcx1V8ZxA_ZhH-8Wlj3t4dGEHatPJ4LZSH5DdjP7C10DOyU';
const CLIENT_ID     = '563584335869-fgrhgmd47bqnekij5i8b5pr03ho849e6.apps.googleusercontent.com';
const CLIENT_SECRET = 'j9iVZfS8kkCEFUPaAeJV0sAi';
const PROJECT_ID    = 'muadilci-890e4';
const BASE_URL      = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

let _accessToken = null;
let _tokenExpiry = 0;

async function getAccessToken() {
  if (_accessToken && Date.now() < _tokenExpiry - 60_000) return _accessToken;
  const resp = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id:     CLIENT_ID,
      client_secret: CLIENT_SECRET,
      refresh_token: REFRESH_TOKEN,
      grant_type:    'refresh_token',
    }).toString(),
  });
  if (!resp.ok) throw new Error(`Token refresh failed: ${resp.status} ${await resp.text()}`);
  const d = await resp.json();
  _accessToken = d.access_token;
  _tokenExpiry = Date.now() + d.expires_in * 1000;
  console.log('OAuth2 token alındı.');
  return _accessToken;
}

// ── Firestore değer tiplerini serileştir ─────────────────────────────────────
function toFirestoreValue(val) {
  if (val === null || val === undefined) return { nullValue: null };
  if (typeof val === 'boolean')          return { booleanValue: val };
  if (typeof val === 'number')           return Number.isInteger(val) ? { integerValue: String(val) } : { doubleValue: val };
  if (typeof val === 'string')           return { stringValue: val };
  if (Array.isArray(val))                return { arrayValue: { values: val.map(toFirestoreValue) } };
  if (val && typeof val === 'object')    return { mapValue: { fields: Object.fromEntries(Object.entries(val).map(([k, v]) => [k, toFirestoreValue(v)])) } };
  return { nullValue: null };
}

function buildFields(data) {
  return Object.fromEntries(Object.entries(data).map(([k, v]) => [k, toFirestoreValue(v)]));
}

// ── Excel oku ─────────────────────────────────────────────────────────────────
const FILE = 'C:\\Users\\win10\\OneDrive\\Desktop\\TR CODEX VER_GUNCELLENDI.xlsx';
const wb   = read(readFileSync(FILE));
const rows = utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { defval: '' });
console.log(`Excel okundu: ${rows.length} satır`);

const clean = (s) => {
  const v = String(s ?? '').trim();
  return v === '' || v.toLowerCase() === 'nan' || v === 'NA' ? '' : v;
};
const toArr = (s) => {
  const v = clean(s);
  if (!v) return [];
  return v.split(',').map((x) => x.trim()).filter(Boolean);
};

// Rastgele 20-char doc ID üret (Firestore formatı)
const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
function randomId() {
  let id = '';
  for (let i = 0; i < 20; i++) id += CHARS[Math.floor(Math.random() * CHARS.length)];
  return id;
}

// ── Batch yükleme (REST batchWrite limiti: 500 yazma / istek) ────────────────
const CHUNK = 400;
let total = 0;

for (let i = 0; i < rows.length; i += CHUNK) {
  const chunk   = rows.slice(i, i + CHUNK);
  const writes  = [];

  for (const row of chunk) {
    const brand = clean(row['Marka']);
    const name  = clean(row['Parfüm Adı']);
    if (!brand && !name) continue;

    const data = {
      brand,
      name,
      notes: {
        top:   toArr(row['Üst Notalar']),
        heart: toArr(row['Orta Notalar']),
        base:  toArr(row['Alt Notalar']),
      },
      source:    clean(row['Kaynak Site Adı']),
      sourceUrl: clean(row['Kaynak URL']),
    };

    const yearStr = String(row['Çıkış Yılı'] ?? '').trim();
    if (yearStr !== '' && yearStr.toLowerCase() !== 'nan' && !isNaN(Number(yearStr))) {
      data.year = Number(yearStr);
    }

    const docId = randomId();
    writes.push({
      update: {
        name:   `projects/${PROJECT_ID}/databases/(default)/documents/perfumes/${docId}`,
        fields: buildFields(data),
      },
    });
    total++;
  }

  const token = await getAccessToken();
  const resp  = await fetch(`${BASE_URL}:batchWrite`, {
    method:  'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body:    JSON.stringify({ writes }),
  });

  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`batchWrite hata (${resp.status}): ${err}`);
  }

  const result = await resp.json();
  // writeResults içinde hata var mı kontrol et
  const errors = (result.writeResults || []).filter((_, idx) => result.status?.[idx]?.code);
  if (errors.length) console.warn(`  ${errors.length} yazma hatası!`);

  console.log(`✓ ${Math.min(i + CHUNK, rows.length)}/${rows.length} yüklendi`);
}

console.log(`\nTamamlandı — ${total} parfüm Firestore "perfumes" koleksiyonuna yüklendi.`);
