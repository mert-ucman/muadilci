const admin = require('firebase-admin');
const key = require('C:/Users/MERT/Downloads/muadilci-890e4-firebase-adminsdk-fbsvc-71442fa541.json');

admin.initializeApp({ credential: admin.credential.cert(key) });
const db = admin.firestore();

function slugify(s) {
  return (s || '').toLowerCase()
    .replace(/\s+/g,'-').replace(/[^a-z0-9-]/g,'').replace(/-+/g,'-');
}

// Opus perfumes to re-create (plain names), each with their Library Collection counterpart
const OPUS_LIST = [
  { name: 'Opus I',    libName: 'The Library Collection Opus I',    slug: 'opus-i'    },
  { name: 'Opus II',   libName: 'The Library Collection Opus II',   slug: 'opus-ii'   },
  { name: 'Opus III',  libName: 'The Library Collection Opus III',  slug: 'opus-iii'  },
  { name: 'Opus V',    libName: 'The Library Collection Opus V',    slug: 'opus-v'    },
  { name: 'Opus VI',   libName: 'The Library Collection Opus VI',   slug: 'opus-vi'   },
  { name: 'Opus VII',  libName: 'The Library Collection Opus VII',  slug: 'opus-vii'  },
  { name: 'Opus VIII', libName: 'The Library Collection Opus VIII', slug: 'opus-viii' },
  { name: 'Opus IX',   libName: 'The Library Collection Opus IX',   slug: 'opus-ix'   },
  { name: 'Opus X',    libName: 'The Library Collection Opus X',    slug: 'opus-x'    },
  { name: 'Opus XI',   libName: 'The Library Collection Opus XI',   slug: 'opus-xi'   },
];

async function main() {
  // Get Amouage brand
  const bSnap = await db.collection('brands').get();
  let amouage = null;
  bSnap.docs.forEach(d => {
    if ((d.data().name||'').toLowerCase().includes('amouage')) amouage = { id: d.id, ...d.data() };
  });
  console.log('Amouage:', amouage.id);

  // Load all perfumes
  const pSnap = await db.collection('perfumes').get();
  const byName = {};
  const existingSlugs = new Set();
  pSnap.docs.forEach(d => {
    byName[d.data().name] = { id: d.id, ref: d.ref, ...d.data() };
    if (d.data().slug) existingSlugs.add(d.data().slug);
  });

  for (const opus of OPUS_LIST) {
    const libPerf = byName[opus.libName];
    if (!libPerf) { console.log(`⚠ Bulunamadı: ${opus.libName}`); continue; }

    // Get muadils pointing to Library Collection version
    const mSnap = await db.collection('muadils')
      .where('targetPerfumeId', '==', libPerf.id).get();
    console.log(`\n${opus.libName} (${mSnap.size}m) → ${opus.name}`);

    // Create new plain Opus perfume
    const sl = existingSlugs.has(opus.slug) ? opus.slug + '-amouage' : opus.slug;
    existingSlugs.add(sl);
    const newRef = db.collection('perfumes').doc();
    const newDoc = {
      id: newRef.id,
      name: opus.name,
      slug: sl,
      brandId: amouage.id,
      brandName: amouage.name,
      brandSlug: amouage.slug || slugify(amouage.name),
      gender: libPerf.gender || '',
      year: libPerf.year || 0,
      description: libPerf.description || '',
      notes: libPerf.notes || { top: [], heart: [], base: [] },
      image: libPerf.image || '',
      images: libPerf.images || [],
      active: true,
      likes: 0,
      commentCount: 0,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };
    await newRef.set(newDoc);
    console.log(`  "${opus.name}" oluşturuldu: ${newRef.id}`);

    // Move muadils to new perfume
    if (mSnap.size > 0) {
      const batch = db.batch();
      mSnap.docs.forEach(d => {
        batch.update(d.ref, {
          targetPerfumeId:   newRef.id,
          targetPerfumeName: opus.name,
          targetBrandName:   amouage.name,
          name: `${amouage.name} ${opus.name} Benzeri`,
        });
      });
      await batch.commit();
      console.log(`  ${mSnap.size} muadil taşındı`);
    }

    // Delete Library Collection version
    await libPerf.ref.delete();
    console.log(`  "${opus.libName}" silindi`);
  }

  console.log('\nTamamlandı.');
  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
