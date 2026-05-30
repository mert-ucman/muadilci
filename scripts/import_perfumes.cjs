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

const norm = s => (s || '').toLowerCase().replace(/[^a-z0-9]/g, '');

const GENDER_MAP = { men: 'Erkek', women: 'Kadın', female: 'Kadın', male: 'Erkek', unisex: 'Unisex' };

async function main() {
  // 1. Markaları çek
  const brandsSnap = await db.collection('brands').get();
  const brands = brandsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
  console.log(`Firestore'da ${brands.length} marka var.`);

  // Normalize marka index
  const brandByNorm = {};
  brands.forEach(b => { brandByNorm[norm(b.name)] = b; });

  // 2. Parfümleri yükle
  const perfumes = JSON.parse(fs.readFileSync('C:/Users/MERT/Desktop/parfum_import.json', 'utf8'));
  console.log(`Import edilecek parfüm: ${perfumes.length}`);

  // 3. Mevcut parfüm slug'larını çek (duplicate önleme)
  const existingSnap = await db.collection('perfumes').get();
  const existingSlugs = new Set(existingSnap.docs.map(d => d.data().slug).filter(Boolean));
  console.log(`Mevcut parfüm: ${existingSlugs.size}`);

  // 4. Eşleştir ve Firestore belgesi hazırla
  let matched = 0, noMatch = 0, duplicate = 0;
  const docs = [];

  perfumes.forEach(p => {
    const nb = norm(p.brand);
    const brand = brandByNorm[nb];
    if (!brand) { noMatch++; return; }

    const slug = slugify(p.name);
    if (existingSlugs.has(slug)) { duplicate++; return; }

    docs.push({
      name: p.name,
      slug,
      brandId: brand.id,
      brandName: brand.name,
      brandSlug: brand.slug || slugify(brand.name),
      gender: GENDER_MAP[p.gender] || '',
      year: Number(p.year) || 0,
      description: '',
      notes: {
        top:   (p.topNotes   || '').split(',').map(s => s.trim()).filter(Boolean),
        heart: (p.heartNotes || '').split(',').map(s => s.trim()).filter(Boolean),
        base:  (p.baseNotes  || '').split(',').map(s => s.trim()).filter(Boolean),
      },
      image: '',
      images: [],
      active: true,
      likes: 0,
      commentCount: 0,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    matched++;
  });

  console.log(`Yazılacak: ${matched} | Marka bulunamadı: ${noMatch} | Zaten var: ${duplicate}`);

  // 5. Batch write (max 490'lık parçalar)
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
    console.log(`  ${written}/${docs.length} yüklendi...`);
  }

  console.log(`\nTamamlandı. ${written} parfüm Firestore'a eklendi.`);
  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
