// ── Sabit parametreler ────────────────────────────────────────────────────────
// C_PRODUCT: Bu kadar oydan önce ürün puanı global ortalamaya çekilir.
//            5 → 5 oyda %50 kendi puanı / %50 global ortalama.
//            Tek bir şanslı (9.3) ya da troll (1.0) yorumun ürünü uçurmasını/batırmasını engeller.
const C_PRODUCT = 5;

// C_BRAND: Bir markanın toplam yorumu bu sayıya ulaşana kadar marka puanı global
//          marka ortalamasına çekilir (kanıt = toplam yorum, ürün sayısı değil).
//          8 → 8 yorumda marka %50 kendi puanına güvenilir.
const C_BRAND = 8;

// MIN_REVIEWS: Bir ürünün puanlanabilmesi (ortalama + Bayesian) için gereken minimum
//              onaylı yorum sayısı. Gürültüyü Bayesian yumuşattığı için sert baraja
//              gerek yok; 1 → yorumu olan her ürün puanlanır, güveni C_PRODUCT ayarlar.
//              Bu yalnızca KATALOG puanını (Markalar listesi/profil) besler.
const MIN_REVIEWS = 1;

// LEADERBOARD_MIN_REVIEWS: "En İyiler" top-10 VİTRİNİNE girmek için gereken minimum yorum.
//   Puanlamadan ayrı bir editoryal bar — puan yine düşük eşikle hesaplanır (katalogla aynı),
//   ama top-10'a yalnızca yeterince değerlendirilmiş ürün/marka çıkar. Gerçek veri birikene
//   kadar liste rahatça boş/az kalabilir. Ürün: kendi yorumu; marka: toplam yorumu bu sayıyı geçmeli.
export const LEADERBOARD_MIN_REVIEWS = 10;

// ── Yardımcı ─────────────────────────────────────────────────────────────────

function bayesianAvg(itemAvg, itemCount, globalMean, C) {
  if (itemCount === 0 || globalMean === null) return null;
  // Tam hassasiyet döndürülür — yuvarlama yalnızca gösterim katmanında yapılır.
  // Aksi halde ~8000 ürünün skoru 2 ondalıkta beraberlik yapar ve ilk 10 belirsizleşir.
  return (C * globalMean + itemCount * itemAvg) / (C + itemCount);
}

function weightedMean(entries) {
  // entries: [{ score, weight }]
  const totalWeight = entries.reduce((s, e) => s + e.weight, 0);
  if (!totalWeight) return null;
  return entries.reduce((s, e) => s + e.score * e.weight, 0) / totalWeight;
}

// ── Tekil muadil skoru (UI'da gösterim için — değişmedi) ──────────────────────
// Döndürdüğü overall = kullanıcıya gösterilen dürüst ortalama.
export function calcScores(muadilId, allComments) {
  const ok = allComments.filter(
    (c) => c.muadilPerfumeId === muadilId && c.status === 'approved'
  );
  if (!ok.length) return { scent: null, projection: null, longevity: null, overall: null, count: 0 };

  const avg = (arr) => parseFloat((arr.reduce((s, v) => s + v, 0) / arr.length).toFixed(1));
  const scent      = avg(ok.map((c) => c.similarity));
  const projection = avg(ok.map((c) => c.projection));
  const longevity  = avg(ok.map((c) => c.longevity));
  const overall    = parseFloat(((scent + projection + longevity) / 3).toFixed(1));

  return { scent, projection, longevity, overall, count: ok.length };
}

// ── Tüm muadiller için skor hesabı (sıralama için) ───────────────────────────
//
// Döndürür: Map<muadilId, { avgScore, reviewCount, bayesianScore }>
//   - avgScore:     kullanıcıya gösterilen dürüst ortalama (1 ondalık)
//   - reviewCount:  onaylı yorum sayısı
//   - bayesianScore: sıralama için kullanılan güvenilir puan (tam hassasiyet; gösterimde 4 ondalık)
//
// Kullanım: const scoreMap = calcAllMuadilScores(muadilPerfumes, comments);
export function calcAllMuadilScores(muadils, allComments) {
  // 1. Ham ortalama ve sayı
  const rawScores = new Map();

  for (const m of muadils) {
    const ok = allComments.filter(
      (c) => c.muadilPerfumeId === m.id && c.status === 'approved'
    );
    if (ok.length < MIN_REVIEWS) continue;
    const overall = ok.reduce((s, c) => s + (c.similarity + c.projection + c.longevity) / 3, 0) / ok.length;
    rawScores.set(m.id, {
      avgScore: parseFloat(overall.toFixed(1)), // kullanıcıya dürüst gösterim (1 ondalık)
      rawAvg: overall,                          // sıralama/Bayesian için tam hassasiyet
      reviewCount: ok.length,
    });
  }

  if (!rawScores.size) return new Map();

  // 2. Global ağırlıklı ortalama (çok oylu ürünler daha fazla ağırlık taşır) — tam hassasiyet
  const globalMean = weightedMean(
    [...rawScores.values()].map(({ rawAvg, reviewCount }) => ({
      score: rawAvg,
      weight: reviewCount,
    }))
  );

  // 3. Bayesian skor — ham (yuvarlanmamış) ortalama üzerinden, beraberlikleri en aza indirir
  const result = new Map();
  for (const [id, { avgScore, rawAvg, reviewCount }] of rawScores.entries()) {
    result.set(id, {
      avgScore,
      reviewCount,
      bayesianScore: bayesianAvg(rawAvg, reviewCount, globalMean, C_PRODUCT),
    });
  }

  return result;
}

// ── Tüm markalar için skor hesabı (sıralama için) ────────────────────────────
//
// muadilScoreMap: calcAllMuadilScores() çıktısı
// Döndürür (sıralanmış dizi):
//   { brand, brandAvgScore, ratedProductCount, brandBayesianScore }
//
//   - brandAvgScore:       markanın onaylı ürünlerinin Bayesian puan ortalaması
//   - ratedProductCount:   en az 1 yorumu olan ürün sayısı
//   - brandBayesianScore:  sıralama için Bayesian düzeltmeli marka puanı
export function calcAllBrandScores(muadilBrands, muadilPerfumes, muadilScoreMap) {
  // 1. Her marka için ham değerler
  const brandRows = [];

  for (const brand of muadilBrands) {
    const brandMuadils = muadilPerfumes.filter((m) => m.brandId === brand.id && m.active !== false);
    const scored = brandMuadils.map((m) => muadilScoreMap.get(m.id)).filter(Boolean);
    if (!scored.length) continue;

    const ratedProductCount = scored.length;
    const totalReviews = scored.reduce((s, { reviewCount }) => s + reviewCount, 0);
    // Marka ortalaması: ürünlerin Bayesian puanlarının yorum sayısıyla ağırlıklı ortalaması
    // — tam hassasiyet; yuvarlama yalnızca gösterimde yapılır
    const brandAvgScore = weightedMean(scored.map(({ bayesianScore, reviewCount }) => ({
      score: bayesianScore,
      weight: reviewCount,
    }))) ?? 0;

    brandRows.push({ brand, brandAvgScore, ratedProductCount, totalReviews });
  }

  if (!brandRows.length) return [];

  // 2. Global marka ortalaması (toplam yorum sayısıyla ağırlıklı — hacimli marka daha çok söz sahibi)
  const globalBrandMean = weightedMean(
    brandRows.map(({ brandAvgScore, totalReviews }) => ({
      score: brandAvgScore,
      weight: totalReviews,
    }))
  );

  // 3. Marka Bayesian skoru + sırala
  // Kanıt = toplam yorum: 1 üründen 50 yorum alan marka, 1 üründen 1 yorum alandan çok daha güvenilir.
  // Eşitlik-bozucu: aynı skorda → daha çok yorum (daha güvenilir) → daha çok puanlı ürün → ada göre
  return brandRows
    .map((row) => ({
      ...row,
      brandBayesianScore: bayesianAvg(row.brandAvgScore, row.totalReviews, globalBrandMean, C_BRAND),
    }))
    .sort((a, b) =>
      b.brandBayesianScore - a.brandBayesianScore ||
      b.totalReviews - a.totalReviews ||
      b.ratedProductCount - a.ratedProductCount ||
      a.brand.name.localeCompare(b.brand.name, 'tr')
    );
}

// ── Katalog için marka puanı haritası (BrandsPage / BrandPage) ────────────────
//
// "En İyiler" listesiyle BİREBİR aynı Bayesian formülü kullanılır — böylece aynı
// marka her iki yerde de aynı puanı gösterir. Düz aritmetik ortalamanın yerini alır:
// tek şanslı ürün marka puanını uçuramaz, çok yorumlu tutarlı markalar öne çıkar.
//
// Döndürür: Map<brandId, number>  (gösterim için 1 ondalık; puanı olmayan marka haritada yer almaz)
export function calcBrandScoreMap(brands, muadilPerfumes, comments) {
  const activeMuadils = muadilPerfumes.filter((m) => m.active !== false);
  const muadilScoreMap = calcAllMuadilScores(activeMuadils, comments);
  const muadilBrands = brands.filter((b) => b.type === 'muadil' && b.active !== false);
  const rows = calcAllBrandScores(muadilBrands, muadilPerfumes, muadilScoreMap);

  const map = new Map();
  for (const row of rows) {
    map.set(row.brand.id, parseFloat(row.brandBayesianScore.toFixed(1)));
  }
  return map;
}
