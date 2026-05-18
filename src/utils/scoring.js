export function calcScores(muadilId, allComments) {
  const ok = allComments.filter(
    (c) => c.muadilPerfumeId === muadilId && c.status === 'approved'
  );
  if (!ok.length) return { scent: null, projection: null, longevity: null, overall: null, count: 0 };

  const avg = (arr) => parseFloat((arr.reduce((s, v) => s + v, 0) / arr.length).toFixed(1));
  const scent = avg(ok.map((c) => c.similarity));
  const projection = avg(ok.map((c) => c.projection));
  const longevity = avg(ok.map((c) => c.longevity));
  const overall = parseFloat(((scent + projection + longevity) / 3).toFixed(1));

  return { scent, projection, longevity, overall, count: ok.length };
}
