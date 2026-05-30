const admin = require('firebase-admin');
const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');
const key = require('C:/Users/MERT/Downloads/muadilci-890e4-firebase-adminsdk-fbsvc-71442fa541.json');

admin.initializeApp({ credential: admin.credential.cert(key) });
const db = admin.firestore();

// ── helpers ──────────────────────────────────────────────────────────────────

function slugify(s) {
  return (s || '')
    .toLowerCase()
    .replace(/ğ/g,'g').replace(/ü/g,'u').replace(/ş/g,'s')
    .replace(/ı/g,'i').replace(/ö/g,'o').replace(/ç/g,'c')
    .replace(/é/g,'e').replace(/è/g,'e').replace(/ê/g,'e')
    .replace(/â/g,'a').replace(/à/g,'a').replace(/ô/g,'o')
    .replace(/û/g,'u').replace(/î/g,'i').replace(/ï/g,'i')
    .replace(/ñ/g,'n').replace(/ß/g,'ss').replace(/æ/g,'ae')
    .replace(/\s+/g,'-').replace(/[^a-z0-9-]/g,'').replace(/-+/g,'-');
}

const norm = s => (s || '')
  .toLowerCase()
  .replace(/ğ/g,'g').replace(/ü/g,'u').replace(/ş/g,'s')
  .replace(/ı/g,'i').replace(/ö/g,'o').replace(/ç/g,'c')
  .replace(/é/g,'e').replace(/è/g,'e').replace(/ê/g,'e')
  .replace(/â/g,'a').replace(/à/g,'a').replace(/ô/g,'o')
  .replace(/û/g,'u').replace(/î/g,'i').replace(/ï/g,'i')
  .replace(/ñ/g,'n').replace(/[^a-z0-9]/g,'');

/**
 * Given "Tam Normalize Ad" = "Brand – Name" or "Brand - Name",
 * split into { brand, name }.
 */
function parseTamNorm(s) {
  if (!s) return null;
  // em-dash first, then regular hyphen with spaces
  const sep = s.includes(' – ') ? ' – ' : s.includes(' – ') ? ' – ' : s.includes(' - ') ? ' - ' : null;
  if (sep) {
    const idx = s.indexOf(sep);
    return { brand: s.slice(0, idx).trim(), name: s.slice(idx + sep.length).trim() };
  }
  // no separator – return whole string as both (will likely fail perfume lookup, which is fine)
  return { brand: '', name: s.trim() };
}

// ── main ─────────────────────────────────────────────────────────────────────

async function main() {
  const DIR = 'C:/Users/MERT/Desktop/normalize_edilmis_dosyalar';

  // 1. Load muadil brands from Firestore
  const brandsSnap = await db.collection('brands').where('type', '==', 'muadil').get();
  const muadilBrands = brandsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
  console.log(`Muadil marka sayısı: ${muadilBrands.length}`);

  // slug → brand
  const brandBySlug = {};
  muadilBrands.forEach(b => { brandBySlug[b.slug] = b; });
  // norm(name) → brand  (fallback)
  const brandByNorm = {};
  muadilBrands.forEach(b => { brandByNorm[norm(b.name)] = b; });

  // 2. Load all perfumes from Firestore
  const perfSnap = await db.collection('perfumes').get();
  console.log(`Parfüm sayısı: ${perfSnap.size}`);
  // norm(brand)+norm(name) → perfume doc
  const perfByKey = {};
  perfSnap.docs.forEach(d => {
    const p = d.data();
    const k = norm(p.brandName || '') + '|' + norm(p.name || '');
    perfByKey[k] = { id: d.id, ...p };
  });

  // 3. Load existing muadils to avoid duplicates
  const existingSnap = await db.collection('muadils').get();
  const existingKeys = new Set(
    existingSnap.docs.map(d => {
      const m = d.data();
      return (m.brandId || '') + '|' + (m.targetPerfumeId || '');
    })
  );
  console.log(`Mevcut muadil sayısı: ${existingSnap.size}`);

  // 4. Process each xlsx file
  const xlsxFiles = fs.readdirSync(DIR).filter(f => f.endsWith('_normalize.xlsx'));
  console.log(`\nİşlenecek dosya: ${xlsxFiles.length}\n`);

  const failures = [];
  const allDocs = [];
  let totalRows = 0, skippedNoBrand = 0, skippedNoPerf = 0, skippedDup = 0;

  for (const file of xlsxFiles) {
    // brand name from filename: strip _normalize.xlsx, replace hyphens/spaces
    const rawSlug = file.replace('_normalize.xlsx', '').replace(/ /g, '-').toLowerCase();

    // try slug first, then try norm of file stem, then try prefix/contains
    let muadilBrand = brandBySlug[rawSlug];
    if (!muadilBrand) {
      const fileNorm = norm(rawSlug);
      muadilBrand = brandByNorm[fileNorm];
      if (!muadilBrand) {
        // prefix: file slug starts with brand slug (e.g. "gloria-perfume" → "gloria")
        muadilBrand = muadilBrands.find(b => rawSlug.startsWith(b.slug + '-') || rawSlug === b.slug);
      }
      if (!muadilBrand) {
        // contains: norm(brandName) is contained in fileNorm
        muadilBrand = muadilBrands.find(b => fileNorm.startsWith(norm(b.name)));
      }
    }
    if (!muadilBrand) {
      console.log(`[SKIP] ${file} → Firestore'da marka bulunamadı (slug: ${rawSlug})`);
      skippedNoBrand++;
      continue;
    }

    const wb = XLSX.readFile(path.join(DIR, file));
    const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { defval: '' });
    totalRows += rows.length;

    let added = 0, skipped = 0;

    for (const row of rows) {
      const normMarka = (row['Normalize Marka'] || '').trim();
      const normAd    = (row['Normalize Parfüm Adı'] || '').trim();
      const tamNorm   = (row['Tam Normalize Ad'] || '').trim();
      const kod       = (row['Kod'] || '').toString().trim();

      let targetBrand = '', targetName = '';

      if (normMarka && normAd) {
        targetBrand = normMarka;
        targetName  = normAd;
      } else {
        // parse Tam Normalize Ad
        const parsed = parseTamNorm(tamNorm);
        if (!parsed || !parsed.name) {
          failures.push({ marka: muadilBrand.name, satir: row['Kaynak Satır'] || '', kaynak: row['Kaynak Parfüm Adı'] || tamNorm, neden: 'Tam Normalize Ad ayrıştırılamadı' });
          skipped++;
          continue;
        }
        targetBrand = parsed.brand;
        targetName  = parsed.name;
      }

      // lookup target perfume
      const perfKey = norm(targetBrand) + '|' + norm(targetName);
      const targetPerf = perfByKey[perfKey];

      if (!targetPerf) {
        failures.push({ marka: muadilBrand.name, satir: row['Kaynak Satır'] || '', kaynak: `${targetBrand} – ${targetName}`, neden: 'Hedef parfüm bulunamadı' });
        skipped++;
        skippedNoPerf++;
        continue;
      }

      // duplicate check
      const dupKey = muadilBrand.id + '|' + targetPerf.id;
      if (existingKeys.has(dupKey)) {
        skippedDup++;
        skipped++;
        continue;
      }
      existingKeys.add(dupKey);

      // build muadil name
      const muadilName = kod || `${targetPerf.brandName} ${targetPerf.name}`;
      const muadilSlug = slugify(muadilBrand.slug + '-' + muadilName);

      allDocs.push({
        name:              muadilName,
        slug:              muadilSlug,
        brandId:           muadilBrand.id,
        brandSlug:         muadilBrand.slug,
        brandName:         muadilBrand.name,
        targetPerfumeId:   targetPerf.id,
        targetPerfumeName: targetPerf.name,
        targetBrandName:   targetPerf.brandName,
        gender:            '',
        description:       '',
        image:             '',
        images:            [],
        active:            true,
        avgSimilarity:     0,
        avgProjection:     0,
        avgLongevity:      0,
        reviewCount:       0,
        compareCount:      0,
        createdAt:         admin.firestore.FieldValue.serverTimestamp(),
      });
      added++;
    }

    console.log(`${muadilBrand.name}: ${rows.length} satır → ${added} eklenecek, ${skipped} atlandı`);
  }

  console.log(`\nToplam: ${totalRows} satır | Eklenecek: ${allDocs.length} | Marka yok: ${skippedNoBrand} | Parfüm yok: ${skippedNoPerf} | Duplikat: ${skippedDup}`);

  // 5. Save failure log
  if (failures.length > 0) {
    const lines = ['Muadil Firma;Kaynak Satır;Kaynak Parfüm;Neden'];
    failures.forEach(f => lines.push(`${f.marka};${f.satir};${f.kaynak};${f.neden}`));
    fs.writeFileSync('C:/Users/MERT/Desktop/muadil_import_log.csv', '﻿' + lines.join('\n'), 'utf8');
    console.log(`\n${failures.length} başarısız kayıt → C:/Users/MERT/Desktop/muadil_import_log.csv`);
  }

  if (allDocs.length === 0) {
    console.log('\nYüklenecek muadil yok.');
    process.exit(0);
  }

  // 6. Batch write
  console.log(`\n${allDocs.length} muadil Firestore'a yükleniyor...`);
  const CHUNK = 490;
  let written = 0;
  for (let i = 0; i < allDocs.length; i += CHUNK) {
    const chunk = allDocs.slice(i, i + CHUNK);
    const batch = db.batch();
    chunk.forEach(d => {
      const ref = db.collection('muadils').doc();
      batch.set(ref, { ...d, id: ref.id });
    });
    await batch.commit();
    written += chunk.length;
    console.log(`  ${written}/${allDocs.length} yüklendi.`);
  }

  console.log(`\nTamamlandı. ${written} muadil eklendi.`);
  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
