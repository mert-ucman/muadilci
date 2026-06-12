/**
 * strip_muadil_brand.mjs
 * Muadil parfüm isimlerinin başından hedef MARKA adını siler.
 *   "Abdul Samad Al Qurashi Safari Benzeri"  ->  "Safari Benzeri"
 *   "Acqua di Parma Blu Mediterraneo ... Benzeri" -> "Blu Mediterraneo ... Benzeri"
 *
 * Kural: name alanı (targetBrandName + ' ') ile BAŞLIYORSA o önek silinir.
 *        Başlamıyorsa belgeye dokunulmaz, rapora "atlanan" olarak yazılır.
 *
 * Kullanım:
 *   node scripts/strip_muadil_brand.mjs           -> DRY RUN (yazmaz, önizleme üretir)
 *   node scripts/strip_muadil_brand.mjs --apply   -> Firestore'a uygular
 */
import { writeFileSync } from 'fs';

const APPLY = process.argv.includes('--apply');

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

// ── Tüm muadils belgelerini çek ───────────────────────────────────────────────
async function fetchAllMuadils() {
  const docs = [];
  let pageToken = '';
  do {
    let url = `${BASE_URL}/muadils?pageSize=300&mask.fieldPaths=name&mask.fieldPaths=targetBrandName&mask.fieldPaths=targetPerfumeName`;
    if (pageToken) url += `&pageToken=${pageToken}`;
    const r = await fetch(url, { headers: { Authorization: `Bearer ${await getToken()}` } });
    if (!r.ok) throw new Error(`LIST ${r.status}: ${await r.text()}`);
    const data = await r.json();
    for (const doc of (data.documents || [])) {
      const docId = doc.name.split('/').pop();
      docs.push({
        docId,
        name:             doc.fields?.name?.stringValue             || '',
        targetBrandName:  doc.fields?.targetBrandName?.stringValue  || '',
        targetPerfumeName: doc.fields?.targetPerfumeName?.stringValue || '',
      });
    }
    pageToken = data.nextPageToken || '';
    process.stdout.write(`\r  Firestore'dan çekildi: ${docs.length} muadil...`);
  } while (pageToken);
  console.log();
  return docs;
}

// Türkçe-duyarlı normalize: küçült + boşlukları sadeleştir
const norm = (s) => String(s || '').toLocaleLowerCase('tr-TR').replace(/\s+/g, ' ').trim();

// ── Çek + hesapla ─────────────────────────────────────────────────────────────
console.log(`Mod: ${APPLY ? 'APPLY (Firestore\'a yazılacak)' : 'DRY RUN (önizleme — yazılmaz)'}`);
console.log('Firestore\'dan muadiller çekiliyor...');
const all = await fetchAllMuadils();
console.log(`Toplam ${all.length} muadil bulundu.`);

const updates = [];   // gerçekten değişecekler
const skipped = [];   // dokunulmayanlar (sebebiyle)

for (const m of all) {
  const tb = m.targetBrandName.trim();
  if (!tb) { skipped.push({ ...m, reason: 'targetBrandName boş' }); continue; }

  const prefix = tb + ' ';
  // name, marka + boşluk ile başlıyor mu? (büyük/küçük harf duyarsız)
  if (norm(m.name).startsWith(norm(prefix))) {
    // Orijinal name üzerinden kes ki kalan kısmın orijinal yazımı korunsun
    const newName = m.name.slice(prefix.length).replace(/^\s+/, '');
    if (!newName || norm(newName) === 'benzeri') {
      skipped.push({ ...m, reason: 'kesince geriye anlamlı isim kalmıyor' });
      continue;
    }
    if (newName === m.name) { skipped.push({ ...m, reason: 'değişiklik yok' }); continue; }
    updates.push({ docId: m.docId, oldName: m.name, newName, targetBrandName: tb });
  } else {
    skipped.push({ ...m, reason: 'name, marka adıyla başlamıyor' });
  }
}

console.log(`\nDeğişecek: ${updates.length} | Atlanan: ${skipped.length}`);

writeFileSync('scripts/strip_muadil_preview.json', JSON.stringify({ updates, skipped }, null, 2), 'utf8');
console.log('Önizleme yazıldı: scripts/strip_muadil_preview.json');

// İlk 15 değişiklik örneği
console.log('\n── Örnek değişiklikler (ilk 15) ──');
for (const u of updates.slice(0, 15)) {
  console.log(`  "${u.oldName}"  ->  "${u.newName}"`);
}
// Atlananlardan name-başlamıyor olanları ayrıca göster (gözden geçirme için)
const notStarting = skipped.filter((s) => s.reason === 'name, marka adıyla başlamıyor');
if (notStarting.length) {
  console.log(`\n── Marka adıyla BAŞLAMAYAN muadiller (${notStarting.length}) — dokunulmadı, ilk 15 ──`);
  for (const s of notStarting.slice(0, 15)) {
    console.log(`  name="${s.name}"  | marka="${s.targetBrandName}"`);
  }
}

if (!APPLY) {
  console.log('\nDRY RUN bitti. Hiçbir şey yazılmadı. Uygulamak için: node scripts/strip_muadil_brand.mjs --apply');
  process.exit(0);
}

if (updates.length === 0) { console.log('Güncellenecek belge yok.'); process.exit(0); }

// ── Firestore serileştirici + batchWrite ──────────────────────────────────────
const CHUNK = 400;
let done = 0;
for (let i = 0; i < updates.length; i += CHUNK) {
  const chunk  = updates.slice(i, i + CHUNK);
  const writes = chunk.map(({ docId, newName }) => ({
    update: {
      name:   `projects/${PROJECT_ID}/databases/(default)/documents/muadils/${docId}`,
      fields: { name: { stringValue: newName } },
    },
    updateMask: { fieldPaths: ['name'] },
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

console.log(`\nTamamlandı — ${done} muadil isminden marka adı silindi.`);
