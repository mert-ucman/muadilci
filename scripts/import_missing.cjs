const admin = require('firebase-admin');
const fs = require('fs');
const key = require('C:/Users/MERT/Downloads/muadilci-890e4-firebase-adminsdk-fbsvc-71442fa541.json');

admin.initializeApp({ credential: admin.credential.cert(key) });
const db = admin.firestore();

function slugify(s) {
  return (s || '')
    .toLowerCase()
    .replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's')
    .replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ç/g, 'c')
    .replace(/é/g, 'e').replace(/è/g, 'e').replace(/ê/g, 'e')
    .replace(/â/g, 'a').replace(/à/g, 'a').replace(/ô/g, 'o')
    .replace(/û/g, 'u').replace(/î/g, 'i').replace(/ï/g, 'i')
    .replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

const norm = s => (s || '').toLowerCase()
  .replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's')
  .replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ç/g, 'c')
  .replace(/é/g, 'e').replace(/è/g, 'e').replace(/ê/g, 'e')
  .replace(/â/g, 'a').replace(/à/g, 'a').replace(/ô/g, 'o')
  .replace(/û/g, 'u').replace(/î/g, 'i').replace(/ï/g, 'i')
  .replace(/[^a-z0-9]/g, '');

function findBrand(rawName, brandByNorm) {
  const n = norm(rawName);
  if (brandByNorm[n]) return brandByNorm[n];
  // prefix match (±4 chars tolerance)
  const prefix = n.slice(0, 6);
  const hit = Object.keys(brandByNorm).find(k =>
    k.startsWith(prefix) && Math.abs(k.length - n.length) <= 4
  );
  if (hit) return brandByNorm[hit];
  // contains
  const hit2 = Object.keys(brandByNorm).find(k => k.includes(n) || n.includes(k));
  if (hit2) return brandByNorm[hit2];
  return null;
}

function parseMasterCsv(content) {
  const lines = content.trim().split('\n');
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const parts = lines[i].split(';');
    if (parts.length < 3) continue;
    rows.push({ brandName: parts[1].trim(), name: parts[2].trim() });
  }
  return rows;
}

async function main() {
  // 1. Brands
  const brandsSnap = await db.collection('brands').get();
  const brands = brandsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
  console.log(`Firestore'da ${brands.length} marka.`);
  const brandByNorm = {};
  brands.forEach(b => { brandByNorm[norm(b.name)] = b; });

  // 2. Master list
  const csv = fs.readFileSync('C:/Users/MERT/Desktop/TEMİZ_LİSTE.csv', 'utf8');
  const masterList = parseMasterCsv(csv);
  console.log(`TEMİZ_LİSTE'de ${masterList.length} parfüm.`);

  // 3. Existing perfumes in Firestore
  const existingSnap = await db.collection('perfumes').get();
  const existingSlugs = new Set(existingSnap.docs.map(d => d.data().slug).filter(Boolean));
  // Also index by "normBrand+normName" for fuzzy duplicate check
  const existingKeys = new Set(
    existingSnap.docs.map(d => {
      const data = d.data();
      return norm(data.brandName || '') + '|' + norm(data.name || '');
    })
  );
  console.log(`Firestore'da mevcut ${existingSlugs.size} parfüm.`);

  // 4. Find missing
  let alreadyHave = 0, noBrand = 0, toAdd = 0;
  const docs = [];
  const noBrandList = [];

  masterList.forEach(p => {
    const slug = slugify(p.name);
    const key = norm(p.brandName) + '|' + norm(p.name);

    // Check if already exists (by slug OR by brand+name key)
    if (existingSlugs.has(slug) || existingKeys.has(key)) {
      alreadyHave++;
      return;
    }

    const brand = findBrand(p.brandName, brandByNorm);
    if (!brand) {
      noBrand++;
      noBrandList.push(p);
      return;
    }

    docs.push({
      name: p.name,
      slug,
      brandId: brand.id,
      brandName: brand.name,
      brandSlug: brand.slug || slugify(brand.name),
      gender: '',
      year: 0,
      description: '',
      notes: { top: [], heart: [], base: [] },
      image: '',
      images: [],
      active: true,
      likes: 0,
      commentCount: 0,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    toAdd++;
    existingSlugs.add(slug);
    existingKeys.add(key);
  });

  console.log(`\nZaten var: ${alreadyHave} | Eklenecek: ${toAdd} | Marka yok: ${noBrand}`);

  if (noBrandList.length > 0) {
    const lines = ['Marka;Parfüm Adı', ...noBrandList.map(p => `${p.brandName};${p.name}`)];
    fs.writeFileSync('C:/Users/MERT/Desktop/marka_bulunamayan.csv', lines.join('\n'), 'utf8');
    console.log(`Marka bulunamayan ${noBrandList.length} parfüm → C:/Users/MERT/Desktop/marka_bulunamayan.csv`);
    noBrandList.forEach(p => console.log(`  - ${p.brandName} | ${p.name}`));
  }

  if (docs.length === 0) {
    console.log('\nYüklenecek yeni parfüm yok.');
    process.exit(0);
  }

  console.log(`\n${docs.length} parfüm Firestore'a yükleniyor...`);
  const CHUNK = 490;
  let written = 0;
  for (let i = 0; i < docs.length; i += CHUNK) {
    const chunk = docs.slice(i, i + CHUNK);
    const batch = db.batch();
    chunk.forEach(d => {
      const ref = db.collection('perfumes').doc();
      batch.set(ref, { ...d, id: ref.id });
    });
    await batch.commit();
    written += chunk.length;
    console.log(`  ${written}/${docs.length} yüklendi.`);
  }

  console.log(`\nTamamlandı. ${written} parfüm eklendi.`);
  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
