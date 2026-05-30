const XLSX = require("../node_modules/xlsx");
const fs = require("fs");

const buf = fs.readFileSync("C:/Users/MERT/Desktop/FİNAL.xlsx");
const wb = XLSX.read(buf, { type: "buffer" });
const ws = wb.Sheets["Sayfa1"];
const rawData = XLSX.utils.sheet_to_json(ws, { header: 1 });
const rows = rawData.slice(1).filter(function(r) { return r.length >= 3 && r[1] && r[2]; });

let entries = rows.map(function(r) {
  return {
    brand: r[1].toString().trim(),
    model: r[2].toString().trim()
  };
});

// Normalize curly apostrophes to straight for key matching
function norm(s) {
  return s.replace(/[‘’‚‛]/g, "'");
}
function normKey(brand, model) {
  return norm(brand) + "|" + norm(model);
}

// Strip Unicode accents for brand matching in remove-set
function normBrand(brand) {
  return brand.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[‘’‚‛]/g, "'");
}
function normKeySimple(brand, model) {
  return normBrand(brand) + "|" + norm(model);
}

// ── STEP 1: Model name corrections ────────────────────────────────────────
const modelFixes = new Map([
  // Yazim hatalari
  ["Lacoste|Challange",                               "Challenge"],
  ["Lacoste|Essantial",                               "Essential"],
  // Model icinde marka adi varsa kaldir
  ["Chanel|Coco Chanel",                              "Coco"],
  ["Burberry|Burberry Classic",                       "Classic"],
  ["Burberry|Burberry Men",                           "Men"],
  ["Burberry|Burberry Women",                         "Women"],
  ["Bvlgari|Bvlgari Black",                           "Black"],
  ["Bvlgari|Bvlgari Blue",                            "Blue"],
  ["Gucci|Gucci Guilty",                              "Guilty"],
  ["Gucci|Gucci Guilty Parfum",                       "Guilty Parfum"],
  ["Gucci|Gucci Guilty Intense",                      "Guilty Intense"],
  ["Gucci|Gucci Guilty Men",                          "Guilty Men"],
  ["Gucci|Gucci Guilty Women",                        "Guilty Women"],
  ["Gucci|Gucci Guilty Platinum",                     "Guilty Platinum"],
  ["Gucci|Gucci Guilty Studs",                        "Guilty Studs"],
  ["Gucci|Gucci Oud Intense",                         "Oud Intense"],
  // Koleksiyon prefiksleri
  ["Sospiro|Perfumes Cadenza",                        "Cadenza"],
  ["Xerjoff|Casamorati 1888 Lira",                    "1888 Lira"],
  ["Xerjoff|Casamorati 1888 Mefisto",                 "1888 Mefisto"],
  // Standart isimler
  ["Rosendo Mateu|No. 5 Floral, Amber, Sensual Musk", "No. 5"],
  ["Rosendo Mateu|Mateu No. 5",                       "No. 5"],
  // Penhaligon'un modeli (apostrophe normalization handles the brand key)
  ["Penhaligon's|Blazing Mister Sam",                 "Blazing Mr Sam"],
  ["Penhaligon's|The Blazing Mr Sam",                 "Blazing Mr Sam"],
  // Lacoste standardize
  ["Lacoste|Eau De Lacoste L.12.12 Rouge Energetic",  "L.12.12 Rouge Energetic"],
]);

// ── STEP 2: Gecersiz kayitlari sil ────────────────────────────────────────
const removeSet = new Set([
  "Coty|Aventus",
  "Creed|Exclamation",
  "Frederic Malle|Acne Studios",
  "Frederic Malle|Night",
  "Dunlop|Green",
  "Slazenger|Blue",
  "Slazenger|Green",
  "Eclat|d'Arpege",
  "Kenzo|Classic",
  "Oriflame|Divine",
  "Xerjoff|Erba Gold",
  "Xerjoff|Erba Pura",
]);

// ── STEP 3: Duzeltmeleri uygula ───────────────────────────────────────────
entries = entries
  .map(function(e) {
    var key = normKey(e.brand, e.model);
    if (modelFixes.has(key)) return { brand: e.brand, model: modelFixes.get(key) };
    return e;
  })
  .filter(function(e) {
    return !removeSet.has(normKeySimple(e.brand, e.model));
  });

// Hermes Hermessence prefix → normalize via brand NFD
entries = entries.map(function(e) {
  if (normBrand(e.brand) === "Hermes" && e.model.startsWith("Hermessence ")) {
    return { brand: e.brand, model: e.model.replace("Hermessence ", "") };
  }
  return e;
});

// ── STEP 4: Tekrarlari kaldir (marka + model bazinda) ─────────────────────
const seenBM = new Set();
entries = entries.filter(function(e) {
  var key = e.brand.toLowerCase() + "|" + e.model.toLowerCase();
  if (seenBM.has(key)) return false;
  seenBM.add(key);
  return true;
});

console.log("Orijinal satir  : " + rows.length);
console.log("Temizlenmis     : " + entries.length);

// ── STEP 5: Excel olustur (#, Marka, Model) ───────────────────────────────
const outWb = XLSX.utils.book_new();
const outData = [["#", "Marka", "Model"]];
entries.forEach(function(e, i) {
  outData.push([i + 1, e.brand, e.model]);
});
const outWs = XLSX.utils.aoa_to_sheet(outData);
outWs["!cols"] = [{ wch: 6 }, { wch: 30 }, { wch: 55 }];
XLSX.utils.book_append_sheet(outWb, outWs, "Temizlenmis Liste");

const outPath = "C:/Users/MERT/Desktop/TEMİZ_LİSTE.xlsx";
XLSX.writeFile(outWb, outPath);
console.log("Kaydedildi: " + outPath);

console.log("\n--- Ilk 30 kayit ---");
entries.slice(0, 30).forEach(function(e, i) {
  console.log((i + 1) + ". " + e.brand + " - " + e.model);
});
