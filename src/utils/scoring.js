// ── Sabit parametreler ────────────────────────────────────────────────────────
// C_PRODUCT: Bu kadar oydan önce ürün puanı global ortalamaya çekilir.
//            5 → 5 oyda %50 kendi puanı / %50 global ortalama
const C_PRODUCT = 10;

// C_BRAND: Bir markanın bu kadar puanlı ürünü olana kadar marka puanı global
//          marka ortalamasına çekilir. 5 → 5 puanlı üründe %50/%50
const C_BRAND = 5;

// ── Yardımcı ─────────────────────────────────────────────────────────────────

function bayesianAvg(itemAvg, itemCount, globalMean, C) {
  if (itemCount === 0 || globalMean === null) return null;
  return parseFloat(((C * globalMean + itemCount * itemAvg) / (C + itemCount)).toFixed(2));
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
//   - bayesianScore: sıralama için kullanılan güvenilir puan (2 ondalık)
//
// Kullanım: const scoreMap = calcAllMuadilScores(muadilPerfumes, comments);
export function calcAllMuadilScores(muadils, allComments) {
  // 1. Ham ortalama ve sayı
  const rawScores = new Map();

  for (const m of muadils) {
    const ok = allComments.filter(
      (c) => c.muadilPerfumeId === m.id && c.status === 'approved'
    );
    if (!ok.length) continue;
    const overall = ok.reduce((s, c) => s + (c.similarity + c.projection + c.longevity) / 3, 0) / ok.length;
    rawScores.set(m.id, {
      avgScore: parseFloat(overall.toFixed(1)),
      reviewCount: ok.length,
    });
  }

  if (!rawScores.size) return new Map();

  // 2. Global ağırlıklı ortalama (çok oylu ürünler daha fazla ağırlık taşır)
  const globalMean = weightedMean(
    [...rawScores.values()].map(({ avgScore, reviewCount }) => ({
      score: avgScore,
      weight: reviewCount,
    }))
  );

  // 3. Bayesian skor
  const result = new Map();
  for (const [id, { avgScore, reviewCount }] of rawScores.entries()) {
    result.set(id, {
      avgScore,
      reviewCount,
      bayesianScore: bayesianAvg(avgScore, reviewCount, globalMean, C_PRODUCT),
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
    // Marka ortalaması: ürünlerin Bayesian puanlarının yorum sayısıyla ağırlıklı ortalaması
    const brandAvgScore = parseFloat(
      (weightedMean(scored.map(({ bayesianScore, reviewCount }) => ({
        score: bayesianScore,
        weight: reviewCount,
      }))) ?? 0
    ).toFixed(2));

    brandRows.push({ brand, brandAvgScore, ratedProductCount });
  }

  if (!brandRows.length) return [];

  // 2. Global marka ortalaması (ürün sayısıyla ağırlıklı)
  const globalBrandMean = weightedMean(
    brandRows.map(({ brandAvgScore, ratedProductCount }) => ({
      score: brandAvgScore,
      weight: ratedProductCount,
    }))
  );

  // 3. Marka Bayesian skoru + sırala
  return brandRows
    .map((row) => ({
      ...row,
      brandBayesianScore: bayesianAvg(row.brandAvgScore, row.ratedProductCount, globalBrandMean, C_BRAND),
    }))
    .sort((a, b) => b.brandBayesianScore - a.brandBayesianScore);
}
