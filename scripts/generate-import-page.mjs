/**
 * Muadil marka logolarını 300×300 JPEG'e dönüştürür ve
 * public/import-brands.html dosyası üretir.
 *
 * Kullanım:
 *   node scripts/generate-import-page.mjs
 *
 * Ardından: http://localhost:5173/import-brands.html adresini
 * admin kullanıcı olarak giriş yapmış bir tarayıcıda açın.
 */

import { createRequire } from 'module';
import { readdir } from 'fs/promises';
import { existsSync, writeFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

const BRANDS_DIR  = 'C:\\Users\\MERT\\Desktop\\brands\\dupe-brands';
const OUTPUT_HTML = path.join(ROOT, 'public', 'import-brands.html');

const IMAGE_EXTS = ['.jpg', '.jpeg', '.png', '.webp', '.avif', '.gif', '.bmp', '.tiff'];

// ── Brand metadata ──────────────────────────────────────────────────────────
const BRAND_META = {
  '1926-france':        { name: '1926 France',          origin: 'Fransa',  founded: 2010 },
  'adens':              { name: 'Adens',                 origin: 'Türkiye', founded: 2015 },
  'alberto-sego':       { name: 'Alberto Sego',          origin: 'Türkiye', founded: 2012 },
  'anymo-paris':        { name: 'Anymo Paris',           origin: 'Fransa',  founded: 2018 },
  'bargello':           { name: 'Bargello',              origin: 'Türkiye', founded: 2002 },
  'be-parfüm':          { name: 'Be Parfüm',             origin: 'Türkiye', founded: 2016 },
  'beliga':             { name: 'Beliga',                origin: 'Türkiye', founded: 2014 },
  'caps-lock':          { name: 'Caps Lock',             origin: 'Türkiye', founded: 2019 },
  'dadya':              { name: 'Dadya',                 origin: 'Türkiye', founded: 2017 },
  'davil-walker':       { name: 'Davil Walker',          origin: 'Türkiye', founded: 2018 },
  'delamore':           { name: 'Delamore',              origin: 'Türkiye', founded: 2020 },
  'doftkonst':          { name: 'Doftkonst',             origin: 'İsveç',   founded: 2015 },
  'dose':               { name: 'Dose',                  origin: 'Türkiye', founded: 2020 },
  'dp':                 { name: 'DP',                    origin: 'Türkiye', founded: 2018 },
  'emre boslu':         { name: 'Emre Boslu',            origin: 'Türkiye', founded: 2019 },
  'emre-geldi':         { name: 'Emre Geldi',            origin: 'Türkiye', founded: 2020 },
  'essencia':           { name: 'Essencia',              origin: 'Türkiye', founded: 2016 },
  'eyfel':              { name: 'Eyfel',                 origin: 'Türkiye', founded: 2015 },
  'famak-de-fragancia': { name: 'Famak de Fragancia',    origin: 'Türkiye', founded: 2018 },
  'ferne':              { name: 'Ferne',                 origin: 'Türkiye', founded: 2021 },
  'frederic-patric':    { name: 'Frederic Patric',       origin: 'Türkiye', founded: 2017 },
  'gadban':             { name: 'Gadban',                origin: 'Türkiye', founded: 2019 },
  'gesd-parfumes':      { name: 'GESD Parfumes',         origin: 'Türkiye', founded: 2018 },
  'granada':            { name: 'Granada',               origin: 'Türkiye', founded: 2016 },
  'kimyager-ahmet':     { name: 'Kimyager Ahmet',        origin: 'Türkiye', founded: 2018 },
  'kokuhub-doros':      { name: 'Kokuhub Doros',         origin: 'Türkiye', founded: 2020 },
  'ladosi':             { name: 'Ladosi',                origin: 'Türkiye', founded: 2017 },
  'lelas':              { name: 'Lelas',                 origin: 'Türkiye', founded: 2008 },
  'loris':              { name: 'Loris',                 origin: 'Türkiye', founded: 2010 },
  'louis-francois':     { name: 'Louis François',        origin: 'Fransa',  founded: 2015 },
  'luxury-extrait':     { name: 'Luxury Extrait',        origin: 'Türkiye', founded: 2020 },
  'mad':                { name: 'MAD',                   origin: 'Türkiye', founded: 2019 },
  'magnaroma':          { name: 'Magnaroma',             origin: 'Türkiye', founded: 2018 },
  'malikhan':           { name: 'Malikhan',              origin: 'Türkiye', founded: 2019 },
  'mfy':                { name: 'MFY',                   origin: 'Türkiye', founded: 2020 },
  'muscent':            { name: 'Muscent',               origin: 'Türkiye', founded: 2018 },
  'noble-nose':         { name: 'Noble Nose',            origin: 'Türkiye', founded: 2021 },
  'parfüm-mutfağı':     { name: 'Parfüm Mutfağı',        origin: 'Türkiye', founded: 2017 },
  'parfümevi':          { name: 'Parfümevi',             origin: 'Türkiye', founded: 2015 },
  'patronus':           { name: 'Patronus',              origin: 'Türkiye', founded: 2020 },
  'phoenix-perfume':    { name: 'Phoenix Perfume',       origin: 'Türkiye', founded: 2019 },
  'prs':                { name: 'PRS',                   origin: 'Türkiye', founded: 2018 },
  'rg-fragrance':       { name: 'RG Fragrance',          origin: 'Türkiye', founded: 2019 },
  'sansiro':            { name: 'Sansiro',               origin: 'Türkiye', founded: 2001 },
  'tutaste':            { name: 'Tutaste',               origin: 'Türkiye', founded: 2020 },
};

const SKIP = ['null'];

// ── Helpers ─────────────────────────────────────────────────────────────────
function slugify(str) {
  return str
    .toLowerCase()
    .replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's')
    .replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ç/g, 'c')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function nameToLogo(name) {
  const words = name.replace(/[^\w\sÀ-ÿ]/g, '').split(/\s+/).filter(Boolean);
  if (!words.length) return '??';
  if (words.length === 1) return words[0].substring(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

async function findLogo(brandDir) {
  try {
    const files = await readdir(brandDir);
    const img = files.find(f => IMAGE_EXTS.includes(path.extname(f).toLowerCase()));
    return img ? path.join(brandDir, img) : null;
  } catch { return null; }
}

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  const sharp = (await import('../node_modules/sharp/lib/index.js')).default;

  const entries = await readdir(BRANDS_DIR, { withFileTypes: true });
  const folders = entries
    .filter(d => d.isDirectory() && !SKIP.includes(d.name))
    .map(d => d.name);

  console.log(`${folders.length} klasör bulundu. Logolar işleniyor...\n`);

  const brands = [];

  for (const folder of folders) {
    const meta = BRAND_META[folder];
    if (!meta) {
      console.log(`  ⚠  Atlanan: ${folder} (meta yok)`);
      continue;
    }

    const brandSlug = slugify(meta.name);
    const logoAbbr  = nameToLogo(meta.name);
    const logoPath  = await findLogo(path.join(BRANDS_DIR, folder));

    let logoBase64 = '';
    if (logoPath) {
      try {
        const buf = await sharp(logoPath)
          .flatten({ background: '#ffffff' })
          .resize(300, 300, { fit: 'contain', background: '#ffffff' })
          .jpeg({ quality: 88 })
          .toBuffer();
        logoBase64 = buf.toString('base64');
        console.log(`  ✓  ${meta.name} — logo hazırlandı (${buf.length} B)`);
      } catch (err) {
        console.log(`  ✗  ${meta.name} — logo işlenemedi: ${err.message}`);
      }
    } else {
      console.log(`  —  ${meta.name} — logo yok`);
    }

    brands.push({
      name:      meta.name,
      slug:      brandSlug,
      origin:    meta.origin,
      founded:   meta.founded,
      logo:      logoAbbr,
      logoBase64,
    });
  }

  console.log(`\nHTML sayfası oluşturuluyor...`);

  const brandsJson = JSON.stringify(brands);

  const html = `<!DOCTYPE html>
<html lang="tr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Muadil Marka İçe Aktarma</title>
<style>
  body { font-family: system-ui, sans-serif; max-width: 860px; margin: 40px auto; padding: 0 20px; background: #f8f9fb; color: #1a1a2e; }
  h1 { font-size: 22px; font-weight: 900; margin-bottom: 4px; }
  .sub { color: #888; font-size: 13px; margin-bottom: 28px; }
  button { padding: 12px 28px; border: none; border-radius: 10px; font-size: 15px; font-weight: 700; cursor: pointer; }
  .btn-primary { background: #1a1a2e; color: #fff; }
  .btn-primary:disabled { background: #999; cursor: default; }
  .log { background: #111; color: #0f0; font-family: monospace; font-size: 12px; padding: 16px; border-radius: 10px; height: 340px; overflow-y: auto; margin-top: 20px; white-space: pre-wrap; }
  .progress { background: #e0e0e0; border-radius: 8px; height: 12px; margin-top: 16px; overflow: hidden; }
  .progress-bar { height: 100%; background: #1a1a2e; border-radius: 8px; transition: width .3s; }
  .summary { margin-top: 16px; font-size: 14px; font-weight: 600; }
  .ok { color: #16a34a; } .err { color: #dc2626; }
  table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 13px; }
  th { text-align: left; padding: 8px 12px; background: #e8e8f0; font-weight: 700; font-size: 11px; text-transform: uppercase; letter-spacing: .05em; }
  td { padding: 8px 12px; border-bottom: 1px solid #eee; vertical-align: middle; }
  .logo-thumb { width: 32px; height: 32px; border-radius: 6px; object-fit: cover; }
  .badge { display: inline-block; padding: 2px 8px; border-radius: 20px; font-size: 11px; font-weight: 700; }
  .wait  { background: #f0f0f8; color: #555; }
  .done  { background: #dcfce7; color: #166534; }
  .error { background: #fee2e2; color: #991b1b; }
  .logo-placeholder { width: 32px; height: 32px; border-radius: 6px; background: #e8e8f0; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 700; color: #555; }
</style>
</head>
<body>
<h1>Muadil Marka İçe Aktarma</h1>
<p class="sub">Bu sayfa yalnızca admin kullanıcıları içindir. Firebase oturumunuz otomatik olarak kullanılacaktır.</p>

<button class="btn-primary" id="startBtn" onclick="startImport()">İçe Aktarmayı Başlat (${brands.length} marka)</button>

<div class="progress" style="display:none" id="progressWrap">
  <div class="progress-bar" id="progressBar" style="width:0%"></div>
</div>
<div class="summary" id="summary"></div>
<div class="log" id="log" style="display:none"></div>

<table id="table">
  <thead><tr><th></th><th>Marka</th><th>Slug</th><th>Köken</th><th>Durum</th></tr></thead>
  <tbody id="tbody"></tbody>
</table>

<script type="module">
import { initializeApp, getApps } from 'https://www.gstatic.com/firebasejs/11.7.0/firebase-app.js';
import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/11.7.0/firebase-auth.js';
import { getFirestore, collection, doc, setDoc, serverTimestamp, getDocs, query, where } from 'https://www.gstatic.com/firebasejs/11.7.0/firebase-firestore.js';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'https://www.gstatic.com/firebasejs/11.7.0/firebase-storage.js';

const FIREBASE_CONFIG = {
  apiKey:            "AIzaSyBK4k9sADwogv7UjXtwDrf6hDcNn0MZBHg",
  authDomain:        "muadilci-890e4.firebaseapp.com",
  projectId:         "muadilci-890e4",
  storageBucket:     "muadilci-890e4.firebasestorage.app",
  messagingSenderId: "937526538108",
  appId:             "1:937526538108:web:5b9423c9b3995bf174bef9",
};

const app     = getApps().length ? getApps()[0] : initializeApp(FIREBASE_CONFIG);
const auth    = getAuth(app);
const db      = getFirestore(app);
const storage = getStorage(app);

const BRANDS = ${brandsJson};

// ── UI helpers ────────────────────────────────────────────────────────────
const log     = document.getElementById('log');
const tbody   = document.getElementById('tbody');
const progBar = document.getElementById('progressBar');
const summary = document.getElementById('summary');

function appendLog(msg) {
  log.style.display = 'block';
  log.textContent += msg + '\\n';
  log.scrollTop = log.scrollHeight;
}

function setRowStatus(idx, status, text) {
  const badge = document.getElementById('badge-' + idx);
  if (!badge) return;
  badge.textContent = text;
  badge.className = 'badge ' + status;
}

function buildTable() {
  tbody.innerHTML = '';
  BRANDS.forEach((b, i) => {
    const tr = document.createElement('tr');
    const logoCell = b.logoBase64
      ? \`<img class="logo-thumb" src="data:image/jpeg;base64,\${b.logoBase64}" alt="\${b.logo}">\`
      : \`<div class="logo-placeholder">\${b.logo}</div>\`;
    tr.innerHTML = \`
      <td>\${logoCell}</td>
      <td><strong>\${b.name}</strong></td>
      <td style="color:#888;font-size:12px">\${b.slug}</td>
      <td style="color:#888">\${b.origin}</td>
      <td><span class="badge wait" id="badge-\${i}">Bekliyor</span></td>
    \`;
    tbody.appendChild(tr);
  });
}

// ── base64 → Blob ─────────────────────────────────────────────────────────
function base64ToBlob(b64, mime = 'image/jpeg') {
  const bytes = atob(b64);
  const arr   = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
  return new Blob([arr], { type: mime });
}

// ── Main import ───────────────────────────────────────────────────────────
window.startImport = async function () {
  const btn = document.getElementById('startBtn');
  btn.disabled = true;
  btn.textContent = 'Aktarılıyor…';

  document.getElementById('progressWrap').style.display = 'block';

  const user = auth.currentUser;
  if (!user) {
    appendLog('HATA: Firebase oturumu bulunamadı. Lütfen önce admin paneline giriş yapın (localhost:5173/yonetim).');
    btn.disabled = false;
    btn.textContent = 'Yeniden Dene';
    return;
  }
  appendLog('Oturum: ' + user.email);

  let ok = 0, fail = 0;

  for (let i = 0; i < BRANDS.length; i++) {
    const b = BRANDS[i];
    appendLog('\\n[' + (i+1) + '/' + BRANDS.length + '] ' + b.name + ' işleniyor…');
    setRowStatus(i, 'wait', 'Yükleniyor…');

    try {
      // 0. Check if brand already exists in Firestore
      const existing = await getDocs(query(collection(db, 'brands'), where('slug', '==', b.slug)));

      if (!existing.empty) {
        const existingData = existing.docs[0].data();
        if (!existingData.logoImage && b.logoBase64) {
          // Brand exists but has no logo → try to upload and update
          appendLog('  Mevcut kayıt, logo yükleniyor…');
          try {
            const blob       = base64ToBlob(b.logoBase64);
            const storageRef = ref(storage, 'brands/' + b.slug + '.jpg');
            await uploadBytes(storageRef, blob, { contentType: 'image/jpeg' });
            const logoImageUrl = await getDownloadURL(storageRef);
            await setDoc(existing.docs[0].ref, { logoImage: logoImageUrl }, { merge: true });
            appendLog('  Logo güncellendi: ' + logoImageUrl.substring(0, 60) + '…');
            setRowStatus(i, 'done', 'Logo Güncellendi');
          } catch (logoErr) {
            appendLog('  Logo yüklenemedi: ' + logoErr.message);
            setRowStatus(i, 'error', 'Logo Hatası');
            fail++;
            continue;
          }
        } else {
          appendLog('  Zaten mevcut, atlandı.');
          setRowStatus(i, 'done', 'Mevcut');
        }
        ok++;
        continue;
      }

      // 1. Upload logo if exists
      let logoImageUrl = '';
      if (b.logoBase64) {
        try {
          const blob       = base64ToBlob(b.logoBase64);
          const storageRef = ref(storage, 'brands/' + b.slug + '.jpg');
          await uploadBytes(storageRef, blob, { contentType: 'image/jpeg' });
          logoImageUrl = await getDownloadURL(storageRef);
          appendLog('  Logo yüklendi: ' + logoImageUrl.substring(0, 60) + '…');
        } catch (logoErr) {
          appendLog('  Logo yüklenemedi (Storage izni?): ' + logoErr.message);
        }
      } else {
        appendLog('  Logo yok, atlandı.');
      }

      // 2. Create Firestore document
      const brandRef = doc(collection(db, 'brands'));
      await setDoc(brandRef, {
        id:         brandRef.id,
        name:       b.name,
        slug:       b.slug,
        type:       'muadil',
        origin:     b.origin,
        founded:    b.founded,
        logo:       b.logo,
        logoImage:  logoImageUrl,
        category:   '',
        bio:        '',
        instagram:  '',
        website:    '',
        active:     true,
        likes:      0,
        createdAt:  serverTimestamp(),
      });
      appendLog('  Firestore: ' + brandRef.id);
      setRowStatus(i, 'done', 'Tamamlandı');
      ok++;
    } catch (err) {
      appendLog('  HATA: ' + err.message);
      setRowStatus(i, 'error', 'Hata');
      fail++;
    }

    progBar.style.width = ((i+1) / BRANDS.length * 100) + '%';
  }

  summary.innerHTML = \`
    <span class="ok">✓ \${ok} marka başarıyla eklendi.</span>
    \${fail ? \` <span class="err">✗ \${fail} hata.</span>\` : ''}
  \`;
  btn.textContent = 'Tamamlandı';
  appendLog('\\n─── Bitti: ' + ok + ' başarılı, ' + fail + ' hata ───');
};

// ── Init ──────────────────────────────────────────────────────────────────
onAuthStateChanged(auth, (user) => {
  const btn = document.getElementById('startBtn');
  if (user) {
    btn.textContent = btn.textContent.replace('İçe Aktarmayı', 'İçe Aktarmayı');
    appendLog('');  // noop, keep hidden
  } else {
    btn.textContent = 'Önce Admin Paneline Giriş Yapın';
    btn.style.background = '#dc2626';
  }
});

buildTable();
</script>
</body>
</html>`;

  writeFileSync(OUTPUT_HTML, html, 'utf-8');
  console.log(`\nTamamlandı! ${brands.length} marka işlendi.`);
  console.log(`HTML oluşturuldu: ${OUTPUT_HTML}`);
  console.log('\nAdım 2:');
  console.log('  1. Admin paneline giriş yapın: http://localhost:5173/yonetim');
  console.log('  2. Şu adresi aynı tarayıcıda açın: http://localhost:5173/import-brands.html');
  console.log('  3. "İçe Aktarmayı Başlat" butonuna tıklayın.');
}

main().catch(err => {
  console.error('Hata:', err);
  process.exit(1);
});
