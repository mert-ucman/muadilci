import pandas as pd, json

df_orig = pd.read_excel('C:/Users/MERT/Desktop/Veritabanı Parfümleri_Notalar.xlsx')
df_tr   = pd.read_excel('C:/Users/MERT/Desktop/TR CODEX VER.xlsx')

frag_mask = df_orig.iloc[:,5].str.strip().str.lower() == 'fragrantica'
orig_frag = df_orig[frag_mask]
tr_frag   = df_tr[frag_mask]

d = {}
for col in ['Üst Notalar', 'Orta Notalar', 'Alt Notalar']:
    for eng, tur in zip(orig_frag[col], tr_frag[col]):
        if not isinstance(eng, str) or not isinstance(tur, str): continue
        for e, t in zip([x.strip() for x in eng.split(',')], [x.strip() for x in tur.split(',')]):
            if e and t and e not in d:
                d[e] = t

# Kapsamlı statik sözlük eklentisi
static = {
    "Agarwood (Oud)":"Agarwood (Oud)","Aldehyde":"Aldehit","Aldehydes":"Aldehitler",
    "Almond":"Badem","Ambergris":"Amber","Ambrette (Musk Mallow)":"Ambrette",
    "Amyris":"Amyris","Animalic Notes":"Hayvansal Notalar","Anise":"Anason",
    "Apple":"Elma","Apricot":"Kayısı","Aromatic Notes":"Aromatik Notalar",
    "Atlas Cedar":"Atlas Sediri","Balsam Fir":"Balzam Göknar","Balsamic Notes":"Balzamik Notalar",
    "Basil":"Fesleğen","Benzoin":"Benzoin","Black Currant":"Siyah Frenk Üzümü",
    "Black Pepper":"Karabiber","Blackberry":"Böğürtlen","Blackcurrant":"Siyah Frenk Üzümü",
    "Blonde Wood":"Sarı Ahşap","Blood Orange":"Kan Portakalı","Bluebell":"Sümbül",
    "Brazilian Rosewood":"Brezilya Gül Ağacı","Broom":"Yabani Süpürge Çiçeği",
    "Bulgarian Rose":"Bulgar Gülü","Burnt Wood":"Yanmış Ahşap",
    "Caramel":"Karamel","Cardamom":"Kakule","Carnation":"Karanfil",
    "Cashmere Wood":"Kaşmir Ahşabı","Cassis":"Siyah Frenk Üzümü",
    "Cedar":"Sedir","Cedarwood":"Sedir Ağacı","Chamomile":"Papatya",
    "Cherry":"Kiraz","Cherry Blossom":"Kiraz Çiçeği","Chestnut":"Kestane",
    "Cinnamon":"Tarçın","Cistus":"Labdanum","Citron":"Turunç",
    "Civet":"Misk Kedisi","Clary Sage":"Adaçayı","Clementine":"Klementine",
    "Clove":"Karanfil","Coconut":"Hindistancevizi","Coffee":"Kahve",
    "Coumarin":"Kumarin","Cyclamen":"Siklamen","Cypress":"Servi",
    "Davana":"Davana","Driftwood":"Sürüklenen Ahşap","Dry Wood":"Kuru Ahşap",
    "Elemi":"Elemi","Eucalyptus":"Okaliptüs","Fern":"Eğreltiotu",
    "Fig":"İncir","Fir":"Göknar","Fir Resin":"Göknar Reçinesi",
    "Floral Notes":"Çiçeksi Notalar","Frankincense":"Günnük","Freesia":"Frezya",
    "Fruity Notes":"Meyveli Notalar","Fudge":"Şeker Şurubu",
    "Galbanum":"Galbanum","Gardenia":"Gardenya","Geranium":"Sardunya",
    "Ginger":"Zencefil","Grapefruit":"Greyfurt","Green Notes":"Yeşil Notalar",
    "Guaiac Wood":"Guayak Ağacı","Guava":"Guava","Heliotrope":"Heliotrope",
    "Honey":"Bal","Hyacinth":"Sümbül","Incense":"Tütsü",
    "Iris":"İris","Iris Root":"İris Kökü","Iso E Super":"Iso E Super",
    "Juniper":"Ardıç","Juniper Berries":"Ardıç Meyveleri","Labdanum":"Labdanum",
    "Laurel":"Defne","Lavender":"Lavanta","Leather":"Deri",
    "Lemon":"Limon","Lemon Verbena":"Limon Verbena","Lemongrass":"Limon Otu",
    "Lilac":"Leylak","Lily":"Zambak","Lily of the Valley":"Müge",
    "Lily-of-the-Valley":"Müge","Lime":"Misket Limonu","Linden Blossom":"Ihlamur Çiçeği",
    "Litchi":"Lychee","Lychee":"Lychee","Magnolia":"Manolya",
    "Mandarin":"Mandalina","Marine Notes":"Deniz Notaları","Mate":"Mate",
    "Melon":"Kavun","Mint":"Nane","Muguet":"Müge",
    "Musk":"Misk","Muscat":"Muskat","Myrrh":"Mür",
    "Narcissus":"Nergis","Neroli":"Neroli","Nutmeg":"Muskat",
    "Oak":"Meşe","Oak Moss":"Meşe Yosunu","Oakmoss":"Meşe Yosunu",
    "Olibanum":"Olibanum","Orange":"Portakal","Orange Blossom":"Portakal Çiçeği",
    "Orange Flower":"Portakal Çiçeği","Orris":"İris","Orris Root":"İris Kökü",
    "Osmanthus":"Osmanthus","Patchouli":"Paçuli","Peach":"Şeftali",
    "Pear":"Armut","Pepper":"Biber","Peony":"Şakayık",
    "Peru Balsam":"Peru Balzamı","Petitgrain":"Petitgrain","Pine":"Çam",
    "Pineapple":"Ananas","Plum":"Erik","Pomegranate":"Nar",
    "Praline":"Pralin","Raspberry":"Ahududu","Red Berries":"Kırmızı Meyveler",
    "Rhubarb":"Ravent","Rose":"Gül","Rosemary":"Biberiye",
    "Rosewood":"Gül Ağacı","Rum":"Rom","Saffron":"Safran",
    "Sage":"Adaçayı","Sandalwood":"Sandal Ağacı","Seaweed":"Deniz Yosunu",
    "Sichuan Pepper":"Sichuan Biberi","Smoke":"Duman","Solar Notes":"Güneşsi Notalar",
    "Spearmint":"Nane","Spicy Notes":"Baharatlı Notalar","Strawberry":"Çilek",
    "Suede":"Süet","Sugared Almond":"Şekerli Badem",
    "Sweet Notes":"Tatlı Notalar","Tangerine":"Mandalina","Tea":"Çay",
    "Thyme":"Kekik","Tobacco":"Tütün","Tolu Balsam":"Tolu Balzamı",
    "Tonka Bean":"Tonka Fasulyesi","Tuberose":"Sümbülteber","Turmeric":"Zerdeçal",
    "Vanilla":"Vanilya","Vetiver":"Vetiver","Violet":"Menekşe",
    "Violet Leaf":"Menekşe Yaprağı","Virginia Cedar":"Virginia Sediri",
    "Warm Spicy Notes":"Sıcak Baharatlı Notalar","Watermelon":"Karpuz",
    "White Flowers":"Beyaz Çiçekler","White Musk":"Beyaz Misk",
    "White Tea":"Beyaz Çay","Wisteria":"Salkım Çiçeği","Wood":"Ahşap",
    "Woody Notes":"Odunsu Notalar","Ylang-Ylang":"Ylang-ylang",
    "Yuzu":"Yuzu","Zinc":"Çinko","Ambroxan":"Ambroxan",
    "Sea Notes":"Deniz Notaları","Aquatic Notes":"Sulu Notalar",
    "Metallic Notes":"Metalik Notalar","Powdery Notes":"Pudralı Notalar",
    "Ozonic Notes":"Ozon Notaları","Earthy Notes":"Toprak Notaları",
    "Herbal Notes":"Bitkisel Notalar","Musky Notes":"Misk Notaları",
    "Peach Blossom":"Şeftali Çiçeği","Bamboo":"Bambu","Calone":"Kalone",
    "Vetiver":"Vetiver","Birch":"Huş Ağacı","Elemi Resin":"Elemi Reçinesi",
    "Genet":"Katır Tırnağı","Green Tea":"Yeşil Çay","Black Tea":"Siyah Çay",
    "Ambrette Seeds":"Ambrette Tohumu","Cashmeran":"Kaşmiranr",
    "Iso E Super":"Iso E Super","Hedione":"Hedion",
    "Coriander":"Kişniş","Cardamom":"Kakule","Chrysanthemum":"Krizantem",
    "Jonquil":"Sarı Nergis","Mimosa":"Mimoza","Wormwood":"Pelin",
    "Cypress":"Servi","Styrax":"Storaks","Benzyl Salicylate":"Benzil Salisilat",
    "Musk Mallow":"Misk Ebegümeci","Ambrette":"Ambrette",
    "Orris Concrete":"İris Konkret","Birch Tar":"Huş Katranı",
    "Cumin":"Kimyon","Fenugreek":"Çemen","Dill":"Dereotu",
    "Tarragon":"Tarhun","Marjoram":"Mercanköşk","Oregano":"Kekik",
    "Thyme":"Kekik","Savory":"Satureja","Angelica":"Melek Otu",
    "Caraway":"Kimyon","Celery":"Kereviz","Chives":"Frenk Soğanı",
    "Horseradish":"Yaban Turpu","Nutmeg":"Muskat","Clove":"Karanfil",
    "Cassia":"Tarçın","Star Anise":"Yıldız Anason","Bay Leaf":"Defne Yaprağı",
    "Galbanum":"Galbanum","Artemisia":"Artemisia","Immortelle":"Ölmez Çiçek",
    "Davana":"Davana","Helichrysum":"Altın Otu",
    "Beeswax":"Balmumu","Civet":"Misk Kedisi","Castoreum":"Kunduz Misk",
    "Ambergris":"Amber","Musk Deer":"Misk Geyiği",
    "Iso E Super":"Iso E Super","Polysantol":"Polisantol",
    "Hawthorn":"Alıç","Jasmine Sambac":"Yasemin Sambac",
    "Tiare":"Tiare","Frangipani":"Frangipani","Lotus":"Lotus",
    "Water Lily":"Su Zambağı","Peony":"Şakayık","Dahlia":"Yıldız Çiçeği",
    "Iris":"İris","Orris":"İris","Violet":"Menekşe",
    "Carnation":"Karanfil","Jasmine":"Yasemin",
    "Lime Blossom":"Ihlamur Çiçeği","Linden":"Ihlamur",
    "Water":"Su","Cotton":"Pamuk","Silk":"İpek",
    "Canvas":"Tuval","Ink":"Mürekkep","Paper":"Kağıt",
    "Stone":"Taş","Mineral":"Mineral","Volcanic Rock":"Volkanik Kaya",
    "Oakwood":"Meşe Ağacı","Birchwood":"Huş Ağacı",
    "Driftwood":"Sürüklenen Ahşap","Mahogany":"Maun",
    "Teak":"Tik Ağacı","Ebony":"Abanoz","Balsa":"Balsa",
    "Oud":"Oud","Agarwood":"Agarwood",
    "Amber":"Amber","Ambergris":"Amber",
}

# Statik sözlüğü ekle (mevcut veri öncelikli)
for k, v in static.items():
    if k not in d:
        d[k] = v

with open('scripts/note_dict.json', 'w', encoding='utf-8') as f:
    json.dump(d, f, ensure_ascii=False, indent=2)
print(f'Sözlük kaydedildi: {len(d)} giriş')
