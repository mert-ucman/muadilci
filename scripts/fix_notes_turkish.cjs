const admin = require('firebase-admin');
const key = require('C:/Users/MERT/Downloads/muadilci-890e4-firebase-adminsdk-fbsvc-71442fa541.json');

admin.initializeApp({ credential: admin.credential.cert(key) });
const db = admin.firestore();

const TR = {
  'African Orange Flower':'Afrika Portakal Çiçeği','Agarwood (Oud)':'Ud Ağacı (Oud)','Akigalawood':'Akigalawood','Aldehydes':'Aldehitler','Almond':'Badem','Amalfi Lemon':'Amalfi Limonu','Amber':'Kehribar','Ambergris':'Ambergris','Amberwood':'Kehribar Ağacı','Ambrette':'Ambrette','Ambroxan':'Ambroxan','Angelica':'Melek Otu','Animal Notes':'Hayvani Notalar','Anise':'Anason','Apple':'Elma','Aquozone':'Aquozone','Atlas Cedar':'Atlas Sediri','Bandages':'Sargı Bezi','Basil':'Fesleğen','Benzoin':'Benzoin','Bergamot':'Bergamot','Birch':'Huş Ağacı','Bitter Orange':'Acı Portakal','Black Currant':'Siyah Frenk Üzümü','Black Lacquer Accord':'Siyah Lake Akoru','Black Pepper':'Karabiber','Black Plum':'Kara Erik','Black Tea':'Siyah Çay','Blackberry':'Böğürtlen','Blood Accord':'Kan Akoru','Blue Notes':'Mavi Notalar','Bourbon Vanilla':'Bourbon Vanilyası','Brazilian Orange':'Brezilya Portakalı','Brazilian Rosewood':'Brezilya Gül Ağacı','Broom':'Katır Tırnağı','Buchu':'Buchu','Bulgarian Rose':'Bulgar Gülü','Cacao':'Kakao','Cade Oil':'Cade Yağı','Cake Accord':'Pasta Akoru','Calamus':'Calamus','Calypsone':'Calypsone','Candle Wax':'Mum Balmumu','Cannabis Accord':'Kenevir Akoru','Caramel':'Karamel','Caraway':'Frenk Kimyonu','Cardamom':'Kakule','Cashmeran':'Kaşmeran','Cashmere Wood':'Kaşmir Ağacı','Castoreum':'Kastoryum','Cedar':'Sedir','Cedarwood':'Sedir Ağacı','Cetalox':'Cetalox','Chamomile':'Papatya','Champagne':'Şampanya','Cherry':'Kiraz','Chestnut':'Kestane','Chili Pepper':'Acı Biber','Cinnamon':'Tarçın','Citruses':'Narenciye','Civet':'Civet','Clary Sage':'Muscatel Adaçayı','Clementine':'Klementin','Coconut Milk':'Hindistan Cevizi Sütü','Coconut Water':'Hindistan Cevizi Suyu','Coffee':'Kahve','Coriander':'Kişniş','Cranberry':'Kızılcık','Cucumber':'Salatalık','Cumin':'Kimyon','Cypress':'Selvi','Cypriol':'Cypriol','Damask Rose':'Şam Gülü','Davana':'Davana','Dry Wood':'Kuru Odun','Dust':'Toz','Ebony Wood':'Abanoz Ağacı','Elemi':'Elemi','Fig':'İncir','Fig Wood':'İncir Ağacı','Floral Notes':'Çiçeksi Notalar','Floral Petals':'Çiçek Yaprakları','Frankincense':'Tütsü','Freesia':'Frezya','Fruity Notes':'Meyvemsi Notalar','Galbanum':'Galbanum','Gardenia':'Gardenya','Geranium':'Sardunya','Ginger':'Zencefil','Gingerbread':'Zencefilli Kurabiye','Grapefruit':'Greyfurt','Grapefruit Tea':'Greyfurt Çayı','Grapes':'Üzüm','Grapevine':'Asma','Gray Musk':'Gri Misk','Green Mandarin':'Yeşil Mandalina','Green Notes':'Yeşil Notalar','Guaiac Wood':'Guaiac Ağacı','Gunpowder':'Barut','Haitian Vetiver':'Haiti Vetiveri','Heliotrope':'Heliotrope','Herbs':'Bitkisel Notalar','Honey':'Bal','Honeysuckle':'Hanımeli','Hyacinth':'Sümbül','Immortelle':'Ölümsüzlük Çiçeği','Incense':'Tütsü','Ink Accord':'Mürekkep Akoru','Iodine':'İyot','Iris':'Süsen (İris)','Jackfruit':'Jackfruit','Jasmine':'Yasemin','Jasmine Sambac':'Yasemin Sambac','Juniper':'Ardıç','Juniper Berries':'Ardıç Meyvesi','Labdanum':'Labdanum','Lavender':'Lavanta','Leather':'Deri','Lemon':'Limon','Lemongrass':'Limonotu','Lentisque':'Mastik','Licorice':'Meyankökü','Lilac':'Leylak','Lily':'Zambak','Lily of the Valley':'Vadi Zambağı','Lily-of-the-Valley':'Vadi Zambağı','Lime':'Misket Limonu','Linden Blossom':'Ihlamur Çiçeği','Litchi':'Liçi','Madagascar Vanilla':'Madagaskar Vanilyası','Magnolia':'Manolya','Maltol':'Maltol','Mandarin':'Mandalina','Mandarin Leaf':'Mandalina Yaprağı','Mandarin Orange':'Mandalina','Marigold':'Kadife Çiçeği','Mate':'Maté Çayı','May Rose':'Mayıs Gülü','Melon':'Kavun','Milk':'Süt','Mimosa':'Mimoza','Mineral Notes':'Mineral Notalar','Mint':'Nane','Moss':'Yosun','Musk':'Misk','Musks':'Misk','Myrrh':'Mür','Mystikal':'Mystikal','Narcissus':'Nergis','Neroli':'Neroli','Nutmeg':'Muskat','Oak':'Meşe','Oakmoss':'Meşe Yosunu','Oakwood':'Meşe Ağacı','Olibanum':'Olibanum','Opoponax':'Opoponax','Orange':'Portakal','Orange Blossom':'Portakal Çiçeği','Orchid':'Orkide','Oriental Notes':'Oryantal Notalar','Orris':'Süsen (Orris)','Osmanthus':'Osmantus','Oud':'Ud Ağacı','Palo Santo':'Palo Santo','Paprika':'Paprika','Papyrus':'Papirüs','Passionfruit':'Çarkıfelek Meyvesi','Patchouli':'Paçuli','Peach':'Şeftali','Pear':'Armut','Peony':'Şakayık','Pepper':'Biber','Peru Balsam':'Peru Balsamı','Petalia':'Petalia','Petitgrain':'Petitgrain','Petitgrain Paraguay':'Petitgrain Paraguay','Pine':'Çam Ağacı','Pineapple':'Ananas','Pink Lily':'Pembe Zambak','Pink Pepper':'Pembe Biber','Pistachio':'Antep Fıstığı','Plum':'Erik','Powdery Notes':'Tozsu Notalar','Praline':'Pralin','Rain':'Yağmur','Raspberry':'Ahududu','Raspberry Accord':'Ahududu Akoru','Red Tea':'Kırmızı Çay','Red Thyme':'Kırmızı Kekik','Resins':'Reçineler','Rhubarb':'Ravent','Rice':'Pirinç','Rose':'Gül','Rose Geranium':'Gül Sardunya','Rosemary':'Biberiye','Rum':'Rom','Saffron':'Safran','Sage':'Adaçayı','Salt':'Tuz','Sandalwood':'Sandal Ağacı','Sea Notes':'Deniz Notaları','Sea Salt':'Deniz Tuzu','Sea Water':'Deniz Suyu','Seaweed':'Deniz Yosunu','Sesame':'Susam','Sichuan Pepper':'Sichuan Biberi','Sicilian Lemon':'Sicilya Limonu','Sicilian Orange':'Sicilya Portakalı','Smoke':'Duman','Smoky Notes':'Dumansı Notalar','Soft Cashmere':'Yumuşak Kaşmir','Solar Notes':'Güneş Notaları','Sour Cherry':'Vişne','Spanish Labdanum':'İspanyol Labdanumu','Spearmint':'Nane','Spices':'Baharatlar','Star Anise':'Yıldız Anason','Strawberry':'Çilek','Styrax':'Styrax','Suede':'Süet','Sugar':'Şeker','Tea':'Çay','Tequila':'Tekila','Thai Basil':'Tayland Fesleğeni','Thyme':'Kekik','Timut Pepper':'Timut Biberi','Tobacco':'Tütün','Tobacco Leaf':'Tütün Yaprağı','Tolu Balsam':'Tolu Balsamı','Tonka Bean':'Tonka Fasulyesi','Tuberose':'Sümbülteber','Turkish Rose':'Türk Gülü','Turmeric':'Zerdeçal','Tutti Frutti':'Tutti Frutti','Vanilla':'Vanilya','Vanilla Bourbon':'Bourbon Vanilyası','Velvet Woods':'Kadife Odunlar','Vetiver':'Vetiver','Vinyl':'Vinil','Violet':'Menekşe','Violet Leaf':'Menekşe Yaprağı','Virginia Cedar':'Virginia Sediri','Water Lily':'Nilüfer','Wheat Absolute':'Buğday Absolüsü','Whipped Vanilla':'Krem Vanilya','Whiskey':'Viski','White Honey':'Beyaz Bal','White Musk':'Beyaz Misk','White Suede':'Beyaz Süet','White Tobacco':'Beyaz Tütün','Wild Lavender':'Yabani Lavanta','Woods':'Odunsu Notalar','Woodsy Notes':'Odunsu Notalar','Woody Notes':'Odunsu Notalar','Wormwood':'Pelin Otu','Ylang-Ylang':'Ylang-Ylang','Yuzu':'Yuzu',
};

function translateNote(note) {
  return TR[note] || note;
}

function translateArray(arr) {
  if (!Array.isArray(arr)) return [];
  return arr.map(translateNote);
}

async function main() {
  const snap = await db.collection('perfumes').get();
  console.log(`Toplam parfüm: ${snap.size}`);

  let needsUpdate = 0;
  const CHUNK = 490;
  let processed = 0;

  for (let i = 0; i < snap.docs.length; i += CHUNK) {
    const chunk = snap.docs.slice(i, i + CHUNK);
    const batch = db.batch();
    let batchCount = 0;

    chunk.forEach(d => {
      const p = d.data();
      const top   = p.notes?.top   || [];
      const heart = p.notes?.heart || [];
      const base  = p.notes?.base  || [];

      const newTop   = translateArray(top);
      const newHeart = translateArray(heart);
      const newBase  = translateArray(base);

      // Check if anything changed
      const changed =
        JSON.stringify(top)   !== JSON.stringify(newTop)   ||
        JSON.stringify(heart) !== JSON.stringify(newHeart) ||
        JSON.stringify(base)  !== JSON.stringify(newBase);

      if (changed) {
        batch.update(d.ref, {
          'notes.top':   newTop,
          'notes.heart': newHeart,
          'notes.base':  newBase,
        });
        needsUpdate++;
        batchCount++;
      }
    });

    if (batchCount > 0) await batch.commit();
    processed += chunk.length;
    process.stdout.write(`\r  ${processed}/${snap.docs.length} işlendi, ${needsUpdate} güncellendi...`);
  }

  console.log(`\n\nTamamlandı. ${needsUpdate} parfümün notaları Türkçeye çevrildi.`);
  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
