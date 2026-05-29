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
    .replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

const norm = s => (s || '').toLowerCase()
  .replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's')
  .replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ç/g, 'c')
  .replace(/é/g, 'e').replace(/è/g, 'e').replace(/ê/g, 'e')
  .replace(/â/g, 'a').replace(/à/g, 'a').replace(/ô/g, 'o')
  .replace(/û/g, 'u').replace(/î/g, 'i')
  .replace(/[^a-z0-9]/g, '');

function parseCsv(content) {
  const lines = content.trim().split('\n');
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const parts = lines[i].split(';');
    if (parts.length < 8) continue;
    rows.push({
      brandName: parts[1].trim(),
      name:      parts[2].trim(),
      gender:    parts[3].trim(),
      year:      parts[4].trim(),
      topNotes:  parts[5].trim(),
      heartNotes:parts[6].trim(),
      baseNotes: parts[7].trim(),
    });
  }
  return rows;
}

function findBrand(rawName, brandByNorm) {
  const n = norm(rawName);
  // Pass 1: exact
  if (brandByNorm[n]) return brandByNorm[n];
  // Pass 2: slug prefix (first 6 chars)
  const prefix = n.slice(0, 6);
  const hit = Object.keys(brandByNorm).find(k => k.startsWith(prefix) && (k.length - n.length) <= 4 && (n.length - k.length) <= 4);
  if (hit) return brandByNorm[hit];
  // Pass 3: contains
  const hit2 = Object.keys(brandByNorm).find(k => k.includes(n) || n.includes(k));
  if (hit2) return brandByNorm[hit2];
  return null;
}

async function main() {
  const brandsSnap = await db.collection('brands').get();
  const brands = brandsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
  console.log(`Firestore'da ${brands.length} marka var.`);

  const brandByNorm = {};
  brands.forEach(b => { brandByNorm[norm(b.name)] = b; });

  const csv = fs.readFileSync('C:/Users/MERT/Desktop/Yeni Microsoft Excel Çalışma Sayfası.csv', 'utf8');
  const perfumes = parseCsv(csv);
  console.log(`CSV'de ${perfumes.length} parfüm var.`);

  const existingSnap = await db.collection('perfumes').get();
  const existingSlugs = new Set(existingSnap.docs.map(d => d.data().slug).filter(Boolean));
  console.log(`Firestore'da mevcut parfüm: ${existingSnap.size}`);

  let matched = 0, noMatch = 0, duplicate = 0;
  const docs = [];
  const unmatched = [];

  perfumes.forEach(p => {
    const brand = findBrand(p.brandName, brandByNorm);
    if (!brand) {
      noMatch++;
      unmatched.push({ brandName: p.brandName, name: p.name });
      return;
    }

    const slug = slugify(p.name);
    if (existingSlugs.has(slug)) { duplicate++; return; }

    docs.push({
      name: p.name,
      slug,
      brandId: brand.id,
      brandName: brand.name,
      brandSlug: brand.slug || slugify(brand.name),
      gender: p.gender,
      year: Number(p.year) || 0,
      description: '',
      notes: {
        top:   p.topNotes.split(',').map(s => s.trim()).filter(Boolean),
        heart: p.heartNotes.split(',').map(s => s.trim()).filter(Boolean),
        base:  p.baseNotes.split(',').map(s => s.trim()).filter(Boolean),
      },
      image: '',
      images: [],
      active: true,
      likes: 0,
      commentCount: 0,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    matched++;
    existingSlugs.add(slug);
  });

  console.log(`\nEşleşti: ${matched} | Marka yok: ${noMatch} | Zaten var: ${duplicate}`);

  // Eşleşmeyenleri CSV'ye yaz
  if (unmatched.length > 0) {
    const lines = ['Marka;Parfüm Adı', ...unmatched.map(u => `${u.brandName};${u.name}`)];
    fs.writeFileSync('C:/Users/MERT/Desktop/eslesmeyen_parfumler.csv', lines.join('\n'), 'utf8');
    console.log(`Eşleşmeyen ${unmatched.length} parfüm → C:/Users/MERT/Desktop/eslesmeyen_parfumler.csv`);
  }

  if (docs.length === 0) {
    console.log('Yüklenecek yeni parfüm yok, çıkılıyor.');
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
