/**
 * rollback_upload.mjs
 * Yanlışlıkla eklenen parfümleri sil.
 * `brand` string alanına sahip belgeler = yanlış eklenenler (orijinaller brandId kullanır)
 * Kullanım: node scripts/rollback_upload.mjs
 */
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
  return _token;
}

// Tüm perfumes belgelerini listele (sayfalama ile)
async function listAllDocs() {
  const names = [];
  let pageToken = '';
  do {
    let url = `${BASE_URL}/perfumes?pageSize=300&mask.fieldPaths=brand`;
    if (pageToken) url += `&pageToken=${pageToken}`;
    const r = await fetch(url, { headers: { Authorization: `Bearer ${await getToken()}` } });
    if (!r.ok) throw new Error(`LIST ${r.status}: ${await r.text()}`);
    const data = await r.json();
    for (const doc of (data.documents || [])) {
      // Yanlış eklenenler: `brand` string alanı var
      if (doc.fields?.brand?.stringValue !== undefined) {
        names.push(doc.name);
      }
    }
    pageToken = data.nextPageToken || '';
    process.stdout.write(`\r  Taranan: ${names.length} yanlış belge bulundu...`);
  } while (pageToken);
  console.log();
  return names;
}

console.log('Silinecek belgeler taranıyor...');
const docNames = await listAllDocs();
console.log(`${docNames.length} yanlış belge bulundu, siliniyor...`);

const CHUNK = 400;
let deleted = 0;
for (let i = 0; i < docNames.length; i += CHUNK) {
  const writes = docNames.slice(i, i + CHUNK).map(name => ({ delete: name }));
  const r = await fetch(`${BASE_URL}:batchWrite`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${await getToken()}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ writes }),
  });
  if (!r.ok) throw new Error(`batchWrite DEL ${r.status}: ${await r.text()}`);
  deleted += writes.length;
  console.log(`✓ ${deleted}/${docNames.length} silindi`);
}

console.log(`\nTamamlandı — ${deleted} yanlış belge silindi.`);
