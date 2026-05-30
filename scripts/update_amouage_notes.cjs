const admin = require('firebase-admin');
const key = require('C:/Users/MERT/Downloads/muadilci-890e4-firebase-adminsdk-fbsvc-71442fa541.json');
const fs = require('fs');

admin.initializeApp({ credential: admin.credential.cert(key) });
const db = admin.firestore();

// --------------- Note translation map ---------------
const TR = {
  'African Orange Flower':'Afrika Portakal Çiçeği','Agarwood (Oud)':'Ud Ağacı (Oud)','Akigalawood':'Akigalawood','Aldehydes':'Aldehitler','Almond':'Badem','Amalfi Lemon':'Amalfi Limonu','Amber':'Kehribar','Ambergris':'Ambergris','Amberwood':'Kehribar Ağacı','Ambrette':'Ambrette','Ambroxan':'Ambroxan','Angelica':'Melek Otu','Animal Notes':'Hayvani Notalar','Anise':'Anason','Apple':'Elma','Aquozone':'Aquozone','Atlas Cedar':'Atlas Sediri','Bandages':'Sargı Bezi','Basil':'Fesleğen','Benzoin':'Benzoin','Bergamot':'Bergamot','Birch':'Huş Ağacı','Bitter Orange':'Acı Portakal','Black Currant':'Siyah Frenk Üzümü','Black Lacquer Accord':'Siyah Lake Akoru','Black Pepper':'Karabiber','Black Plum':'Kara Erik','Black Tea':'Siyah Çay','Blackberry':'Böğürtlen','Blood Accord':'Kan Akoru','Blue Notes':'Mavi Notalar','Bourbon Vanilla':'Bourbon Vanilyası','Brazilian Orange':'Brezilya Portakalı','Brazilian Rosewood':'Brezilya Gül Ağacı','Broom':'Katır Tırnağı','Buchu':'Buchu','Bulgarian Rose':'Bulgar Gülü','Cacao':'Kakao','Cade Oil':'Cade Yağı','Cake Accord':'Pasta Akoru','Calamus':'Calamus','Calypsone':'Calypsone','Candle Wax':'Mum Balmumu','Cannabis Accord':'Kenevir Akoru','Caramel':'Karamel','Caraway':'Frenk Kimyonu','Cardamom':'Kakule','Cashmeran':'Kaşmeran','Cashmere Wood':'Kaşmir Ağacı','Castoreum':'Kastoryum','Cedar':'Sedir','Cedarwood':'Sedir Ağacı','Cetalox':'Cetalox','Chamomile':'Papatya','Champagne':'Şampanya','Cherry':'Kiraz','Cherry Blossom':'Kiraz Çiçeği','Chestnut':'Kestane','Chili Pepper':'Acı Biber','Chrysanthemum':'Krizantem','Cinnamon':'Tarçın','Citruses':'Narenciye','Civet':'Civet','Clary Sage':'Muscatel Adaçayı','Clementine':'Klementin','Coconut Milk':'Hindistan Cevizi Sütü','Coconut Water':'Hindistan Cevizi Suyu','Coffee':'Kahve','Coriander':'Kişniş','Cranberry':'Kızılcık','Cucumber':'Salatalık','Cumin':'Kimyon','Cypress':'Selvi','Cypriol':'Cypriol','Cypriol Oil Or Nagarmotha':'Cypriol Yağı (Nagarmotha)','Damask Rose':'Şam Gülü','Davana':'Davana','Dry Wood':'Kuru Odun','Driftwood':'Sürüklenmüş Odun','Dust':'Toz','Earthy Notes':'Toprak Notaları','Ebony Wood':'Abanoz Ağacı','Egyptian Jasmine':'Mısır Yasemini','Elemi':'Elemi','Fenugreek':'Çemen Otu','Fern':'Eğreltiotu','Fig':'İncir','Fig Wood':'İncir Ağacı','Floral Notes':'Çiçeksi Notalar','Floral Petals':'Çiçek Yaprakları','Frankincense':'Tütsü','Freesia':'Frezya','Fruity Notes':'Meyvemsi Notalar','Galbanum':'Galbanum','Gardenia':'Gardenya','Geranium':'Sardunya','Ginger':'Zencefil','Gingerbread':'Zencefilli Kurabiye','Grapefruit':'Greyfurt','Grapefruit Tea':'Greyfurt Çayı','Grapes':'Üzüm','Grapevine':'Asma','Gray Musk':'Gri Misk','Green Mandarin':'Yeşil Mandalina','Green Leaves':'Yeşil Yapraklar','Green Notes':'Yeşil Notalar','Guaiac Wood':'Guaiac Ağacı','Gunpowder':'Barut','Haitian Vetiver':'Haiti Vetiveri','Heliotrope':'Heliotrope','Herbs':'Bitkisel Notalar','Honey':'Bal','Honeysuckle':'Hanımeli','Hyacinth':'Sümbül','Immortelle':'Ölümsüzlük Çiçeği','Incense':'Tütsü','Ink Accord':'Mürekkep Akoru','Iodine':'İyot','Iris':'Süsen (İris)','Jackfruit':'Jackfruit','Jasmine':'Yasemin','Jasmine Sambac':'Yasemin Sambac','Juniper':'Ardıç','Juniper Berries':'Ardıç Meyvesi','Labdanum':'Labdanum','Lavender':'Lavanta','Leather':'Deri','Lemon':'Limon','Lemongrass':'Limonotu','Lentisque':'Mastik','Licorice':'Meyankökü','Lilac':'Leylak','Lily':'Zambak','Lily Of The Valley':'Vadi Zambağı','Lily-Of-The-Valley':'Vadi Zambağı','Lime':'Misket Limonu','Linden Blossom':'Ihlamur Çiçeği','Litchi':'Liçi','Madagascar Vanilla':'Madagaskar Vanilyası','Magnolia':'Manolya','Maltol':'Maltol','Mandarin':'Mandalina','Mandarin Leaf':'Mandalina Yaprağı','Mandarin Orange':'Mandalina','Marigold':'Kadife Çiçeği','Mate':'Maté Çayı','May Rose':'Mayıs Gülü','Melon':'Kavun','Metallic Notes':'Metalik Notalar','Milk':'Süt','Mimosa':'Mimoza','Mineral Notes':'Mineral Notalar','Mint':'Nane','Moss':'Yosun','Musk':'Misk','Musks':'Misk','Myrrh':'Mür','Mystikal':'Mystikal','Narcissus':'Nergis','Neroli':'Neroli','Nutmeg':'Muskat','Oak':'Meşe','Oakmoss':'Meşe Yosunu','Oakwood':'Meşe Ağacı','Olibanum':'Olibanum','Opoponax':'Opoponax','Orange':'Portakal','Orange Blossom':'Portakal Çiçeği','Orchid':'Orkide','Oriental Notes':'Oryantal Notalar','Orris':'Süsen (Orris)','Orris Root':'Süsen Kökü','Osmanthus':'Osmantus','Oud':'Ud Ağacı','Palo Santo':'Palo Santo','Paprika':'Paprika','Papyrus':'Papirüs','Paradisone':'Paradisone','Passionfruit':'Çarkıfelek Meyvesi','Patchouli':'Paçuli','Peach':'Şeftali','Pear':'Armut','Peony':'Şakayık','Pepper':'Biber','Peru Balsam':'Peru Balsamı','Petalia':'Petalia','Petitgrain':'Petitgrain','Petitgrain Paraguay':'Petitgrain Paraguay','Pine':'Çam Ağacı','Pineapple':'Ananas','Pink Lily':'Pembe Zambak','Pink Pepper':'Pembe Biber','Pimento':'Yenibahar','Pistachio':'Antep Fıstığı','Plum':'Erik','Powdery Notes':'Tozsu Notalar','Praline':'Pralin','Rain':'Yağmur','Raspberry':'Ahududu','Raspberry Accord':'Ahududu Akoru','Red Tea':'Kırmızı Çay','Red Rose':'Kırmızı Gül','Red Thyme':'Kırmızı Kekik','Resins':'Reçineler','Rhubarb':'Ravent','Rice':'Pirinç','Rose':'Gül','Rose Geranium':'Gül Sardunya','Rose Hip':'Kuşburnu','Rosemary':'Biberiye','Rum':'Rom','Saffron':'Safran','Sage':'Adaçayı','Salt':'Tuz','Sandalwood':'Sandal Ağacı','Sea Notes':'Deniz Notaları','Sea Salt':'Deniz Tuzu','Sea Water':'Deniz Suyu','Seaweed':'Deniz Yosunu','Sesame':'Susam','Sichuan Pepper':'Sichuan Biberi','Sicilian Lemon':'Sicilya Limonu','Sicilian Orange':'Sicilya Portakalı','Smoke':'Duman','Smoky Notes':'Dumansı Notalar','Soft Cashmere':'Yumuşak Kaşmir','Solar Notes':'Güneş Notaları','Sour Cherry':'Vişne','Spanish Labdanum':'İspanyol Labdanumu','Spearmint':'Nane','Spices':'Baharatlar','Star Anise':'Yıldız Anason','Strawberry':'Çilek','Styrax':'Styrax','Suede':'Süet','Sugar':'Şeker','Tea':'Çay','Tequila':'Tekila','Thai Basil':'Tayland Fesleğeni','Thyme':'Kekik','Timut Pepper':'Timut Biberi','Tobacco':'Tütün','Tobacco Leaf':'Tütün Yaprağı','Tolu Balsam':'Tolu Balsamı','Tonka Bean':'Tonka Fasulyesi','Tuberose':'Sümbülteber','Turkish Rose':'Türk Gülü','Turmeric':'Zerdeçal','Tutti Frutti':'Tutti Frutti','Vanilla':'Vanilya','Vanilla Bourbon':'Bourbon Vanilyası','Varnish Accord':'Vernik Akoru','Velvet Woods':'Kadife Odunlar','Vetiver':'Vetiver','Vinyl':'Vinil','Violet':'Menekşe','Violet Leaf':'Menekşe Yaprağı','Virginia Cedar':'Virginia Sediri','Water Lily':'Nilüfer','Water Violet':'Su Menekşesi','Wheat Absolute':'Buğday Absolüsü','Whipped Vanilla':'Krem Vanilya','Whiskey':'Viski','White Honey':'Beyaz Bal','White Musk':'Beyaz Misk','White Suede':'Beyaz Süet','White Tobacco':'Beyaz Tütün','Wild Berries':'Yabani Meyveler','Wild Lavender':'Yabani Lavanta','Woods':'Odunsu Notalar','Woodsy Notes':'Odunsu Notalar','Woody Notes':'Odunsu Notalar','Wormwood':'Pelin Otu','Ylang-Ylang':'Ylang-Ylang','Yuzu':'Yuzu',
};

// Extra mappings for Amouage-specific entries
const TR_EXTRA = {
  'Ambrarome': 'Ambrarome',
  'Cascalone': 'Cascalone',
  'Laotian Oud': 'Laos Oudu',
  'Birch Tar': 'Huş Ağacı Katranı',
  'Cashmeran': 'Kaşmeran',
  'Black': 'Siyah',
  'Cassis': 'Siyah Frenk Üzümü',
  'Iris Absolute': 'Süsen (İris) Absolüsü',
};

function toTitleCase(s) {
  return s.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
}

function translateNote(raw) {
  const note = toTitleCase(raw.trim());
  return TR[note] || TR_EXTRA[note] || note;
}

function parseNotes(str) {
  if (!str || str.trim() === '') return [];
  return str.split(',').map(n => n.trim()).filter(Boolean).map(translateNote);
}

const GENDER_MAP = { men: 'Erkek', women: 'Kadın', unisex: 'Unisex' };

// norm: strip all non-alphanumeric, lowercase
const norm = s => (s || '').toLowerCase().replace(/[^a-z0-9]/g, '');

// --------------- Manual slug → Firestore name mappings ---------------
const MANUAL_MAP = {
  // Opus series: Library Collection slugs → plain Opus names in DB
  'the-library-collection-opus-i':    'Opus I',
  'the-library-collection-opus-ii':   'Opus II',
  'the-library-collection-opus-iii':  'Opus III',
  'the-library-collection-opus-v':    'Opus V',
  'the-library-collection-opus-vi':   'Opus VI',
  'the-library-collection-opus-viii': 'Opus VIII',
  'the-library-collection-opus-ix':   'Opus IX',
  'the-library-collection-opus-x':    'Opus X',
  'the-library-collection-opus-xi':   'Opus XI',
  'the-library-collection-rose-incense': 'Rose Incense',
  // Opus with subtitle slugs → plain Opus names
  'opus-vii-reckless-leather':  'Opus VII',
  'opus-xii-rose-incense':      'Rose Incense',
  'opus-xiii-silver-oud':       'Opus XIII',
  'opus-xiv-royal-tobacco':     'Royal Tobacco',
  // Renamed perfumes
  'gold-man':          'Gold Pour Homme',
  'gold-woman':        'Gold Pour Femme',
  'fate-man':          'Fate For Men',
  'imitation-man':     'Imitation For Man',
  'imitation-woman':   'Imitation For Woman',
  'portrayal-man':     'Portrayal Men',
  'portrayal-woman':   'Portrayal Women',
  'love-delight':      'Love Deligh',
};

// --------------- Read CSV ---------------
const csvPath = 'C:/Users/MERT/Desktop/Yeni klasör/fra_cleaned.csv';
const lines = fs.readFileSync(csvPath, 'utf-8').split('\n').slice(1); // skip header

const amouageRows = [];
for (const line of lines) {
  if (!line.trim()) continue;
  const cols = line.split(';');
  const brand = (cols[2] || '').trim().toLowerCase();
  if (brand !== 'amouage') continue;

  amouageRows.push({
    slug:   (cols[1] || '').trim(),
    gender: (cols[4] || '').trim().toLowerCase(),
    year:   parseInt(cols[7]) || 0,
    top:    parseNotes(cols[8] || ''),
    heart:  parseNotes(cols[9] || ''),
    base:   parseNotes(cols[10] || ''),
  });
}

console.log(`CSV'den ${amouageRows.length} Amouage parfümü okundu.`);

async function main() {
  // Load all Amouage perfumes from Firestore
  const bSnap = await db.collection('brands').get();
  let amouageBrand = null;
  bSnap.docs.forEach(d => {
    if ((d.data().name || '').toLowerCase().includes('amouage')) amouageBrand = { id: d.id, ...d.data() };
  });
  if (!amouageBrand) { console.error('Amouage markası bulunamadı!'); process.exit(1); }
  console.log('Amouage brand:', amouageBrand.id);

  const pSnap = await db.collection('perfumes')
    .where('brandId', '==', amouageBrand.id).get();

  // Build lookup: by exact slug, by norm(slug), by norm(name)
  const bySlug    = {};
  const byNormSlug = {};
  const byNormName = {};
  pSnap.docs.forEach(d => {
    const p = d.data();
    const data = { id: d.id, ref: d.ref, ...p };
    if (p.slug) bySlug[p.slug] = data;
    if (p.slug) byNormSlug[norm(p.slug)] = data;
    if (p.name) byNormName[norm(p.name)] = data;
  });

  console.log(`Firestore'da ${pSnap.size} Amouage parfümü bulundu.`);

  let matched = 0, unmatched = 0;
  const unmatchedList = [];
  const updates = [];

  for (const row of amouageRows) {
    // Try manual map first
    const manualName = MANUAL_MAP[row.slug];
    let perf = (manualName ? byNormName[norm(manualName)] : null)
      || bySlug[row.slug]
      || byNormSlug[norm(row.slug)]
      || byNormName[norm(row.slug.replace(/-/g, ' '))];

    if (!perf) {
      // Try stripping trailing -man/-woman/-pour-homme/-pour-femme etc.
      const stripped = row.slug
        .replace(/-man$/, '')
        .replace(/-woman$/, '')
        .replace(/-pour-homme$/, '')
        .replace(/-pour-femme$/, '');
      perf = byNormSlug[norm(stripped)] || byNormName[norm(stripped.replace(/-/g, ' '))];
    }

    if (!perf) {
      unmatchedList.push(row.slug);
      unmatched++;
      continue;
    }

    const update = {};

    // Gender
    const newGender = GENDER_MAP[row.gender] || '';
    if (newGender && !perf.gender) update.gender = newGender;
    else if (newGender) update.gender = newGender; // always update gender from authoritative source

    // Notes
    if (row.top.length || row.heart.length || row.base.length) {
      update['notes.top']   = row.top;
      update['notes.heart'] = row.heart;
      update['notes.base']  = row.base;
    }

    // Year
    if (row.year && !perf.year) update.year = row.year;

    if (Object.keys(update).length > 0) {
      updates.push({ ref: perf.ref, name: perf.name, update });
    }
    matched++;
    console.log(`  Eslesti: "${row.slug}" → "${perf.name}"  [${row.gender}]`);
  }

  console.log(`\nEslesen: ${matched}, Eslesmeyen: ${unmatched}`);
  if (unmatchedList.length) {
    console.log('\nEslesmeyenler:');
    unmatchedList.forEach(s => console.log(' ', s));
  }

  // Write updates in batches of 490
  const CHUNK = 490;
  for (let i = 0; i < updates.length; i += CHUNK) {
    const chunk = updates.slice(i, i + CHUNK);
    const batch = db.batch();
    chunk.forEach(({ ref, update }) => batch.update(ref, update));
    await batch.commit();
    console.log(`  Batch ${Math.floor(i/CHUNK)+1}: ${chunk.length} parfüm güncellendi`);
  }

  console.log('\nTamamlandı.');
  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
