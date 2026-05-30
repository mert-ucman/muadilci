/**
 * Parfüm görsellerini Parfumo.com'dan indirir.
 * brands/original-brands/MARKA/perfumes/MODEL.jpg olarak kaydeder.
 */
const XLSX  = require("../node_modules/xlsx");
const fs    = require("fs");
const path  = require("path");
const https = require("https");
const http  = require("http");

const EXCEL_PATH  = "C:/Users/MERT/Desktop/TEMİZ_LİSTE.xlsx";
const BRANDS_ROOT = "C:/Users/MERT/Desktop/brands/original-brands";
const DELAY_MS    = 3000;
const MAX_RETRIES = 1;

// ── Brand → folder mapping ────────────────────────────────────────────────
const BRAND_FOLDER = {
  "Abdul Samad Al Qurashi":"abdul-samad-al-qurashi","Abercrombie & Fitch":"abercrombie-fitch",
  "Acqua Di Parma":"acqua-di-parma","Adidas":"adidas","Adolfo Dominquez":"adolfo-dominquez",
  "Aedes De Venustas":"aedes-de-venustas","Ajmal":"ajmal","Alexander McQueen":"alexander-mcqueen",
  "Alexandre J.":"alexandre-j","Alfred Dunhill":"alfred-dunhill","Amouage":"amouage",
  "Antonio Banderas":"antonio-banderas","Atelier Des Ors":"atelier-des-ors","Atkinsons":"atkinsons",
  "Avon":"avon","Azzaro":"azzaro","Balenciaga":"balenciaga","Balmain":"balmain",
  "BDK Parfums":"bdk-parfumes","Bentley":"bentley","Boadicea The Victorious":"boadicea-the-victorious",
  "Bond No. 9":"bond-no9","Bottega Veneta":"bottega-veneta","Boucheron":"boucheron",
  "Bourjois":"bourjois","Burberry":"burberry","Bvlgari":"bvlgari","By Kilian":"by-kilian",
  "Byredo":"byredo","Cacharel":"cacharel","Caldion":"caldion","Calvin Klein":"calvin-klein",
  "Carolina Herrera":"carolina-herrera","Celine":"celine","Chanel":"chanel","Chopard":"chopard",
  "Clinique":"clinique","Clive Christian":"clive-christian","Costume National":"costume-national",
  "Creed":"creed","Davidoff":"davidoff","Diesel":"diesel","Dior":"dior","Diptyque":"diptyque",
  "Dolce & Gabbana":"dolce-gabbana","Escentric Molecules":"escentric-molecules",
  "Essential Parfums":"essential-parfums","Ex Nihilo":"ex-nihilo","Faberge":"faberge",
  "Frédéric Malle":"frederic-malle","Giorgio Armani":"giorgio-armani","Gisada":"gisada",
  "Givenchy":"givenchy","Goldfield & Banks":"goldfield-banks","Gucci":"gucci","Guerlain":"guerlain",
  "Hermès":"hermes","Hugo Boss":"hugo-boss","Initio Parfums Privés":"initio",
  "Issey Miyake":"issey-miyake","Jean Paul Gaultier":"jean-paul-gaultier","Jil Sander":"jil-sander",
  "Jimmy Choo":"jimmy-choo","Jo Malone London":"jo-malone","Joop":"joop",
  "Juliette Has A Gun":"juliette-has-a-gun","Kayali":"kayali","Kenzo":"kenzo","Lacoste":"lacoste",
  "Lalique":"lalique","Lancôme":"lancome","L'Artisan Parfumeur":"lartisan-parfumeur",
  "Le Labo":"le-labo","Loewe":"loewe","Lorenzo Pazzaglia":"lorenzo-pazzaglia",
  "Louis Vuitton":"louis-vuitton","Maison Crivelli":"maison-crivelli",
  "Maison Francis Kurkdjian":"maison-francis-kurkdjian","Maison Margiela":"maison-margiela",
  "Mancera":"mancera","Marc-Antoine Barrois":"marc-antoine-barrois",
  "Matière Première":"matiere-premiere","Memo Paris":"memo-paris","Michael Kors":"michael-kors",
  "Montblanc":"montblanc","Moschino":"moschino","Naomi Campbell":"naomi-campbell",
  "Narciso Rodriguez":"narciso-rodriguez","Nasomatto":"nasomatto","Nautica":"nautica",
  "Nikos":"nikos","Nishane":"nishane","Ormonde Jayne":"ormonde-jayne","Orto Parisi":"orto-parisi",
  "Paco Rabanne":"paco-rabanne","Parfums De Marly":"parfums-de-marly",
  "Penhaligon's":"penhaligon's","Prada":"prada","Puma":"puma","Ralph Lauren":"ralph-lauren",
  "Roberto Cavalli":"roberto-cavalli","Roja Parfums":"roja-dove","Rosendo Mateu":"rosendo-mateu",
  "Sisley":"sisley","Sospiro":"sospiro","Stéphane Humbert Lucas 777":"stephane-humbert-lucas-777",
  "Swiss Arabian":"swiss-arabian","Tauer Perfumes":"tauer-perfumes","Thameen":"thameen",
  "The Merchant Of Venice":"the-merchant-of-venice","Thierry Mugler":"mugler",
  "Tiziana Terenzi":"tiziana-terenzi","Tom Ford":"tom-ford","Tommy Hilfiger":"tommy-hilfiger",
  "Toskovat":"toskovat","Unique'e Luxury":"uniquee-luxury","Vakko":"vakko",
  "Valentino":"valentino","Versace":"versace","Victoria's Secret":"victorias-secret",
  "Viktor & Rolf":"viktor-rolf","Xerjoff":"xerjoff","Yves Rocher":"yves-rocher",
  "Yves Saint Laurent":"ysl","Zadig & Voltaire":"zadig-voltaire","Zara":"zara",
  "Zarkoperfume":"zarkoperfume","Zoologist":"zoologist-perfumes",
};

// ── Helpers ───────────────────────────────────────────────────────────────
function normASCII(s) {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/['']/g, "");
}
function toBrand(b) {
  return normASCII(b).replace(/[&]/g, "and").replace(/[^a-zA-Z0-9 ]/g, " ").trim().replace(/\s+/g, "_");
}
function toSlug(m, sep) {
  return normASCII(m).replace(/[^a-zA-Z0-9 ]/g, " ").trim().replace(/\s+/g, sep || "_");
}
function sanitize(name) {
  return normASCII(name).replace(/[/\\:*?"<>|]/g, "-").replace(/\s+/g, "-").replace(/-+/g, "-").trim();
}
function sleep(ms) { return new Promise(function(r) { setTimeout(r, ms); }); }

// ── HTTP GET with redirect follow ─────────────────────────────────────────
function get(url, opts, _base) {
  return new Promise(function(resolve, reject) {
    var lib = url.startsWith("https") ? https : http;
    var req = lib.get(url, opts || {}, function(res) {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        var loc = res.headers.location;
        if (!loc.startsWith("http")) {
          var base = (_base || url).match(/^(https?:\/\/[^/]+)/)[1];
          loc = loc.startsWith("/") ? base + loc : base + "/" + loc;
        }
        res.resume();
        return get(loc, opts, _base || url).then(resolve).catch(reject);
      }
      var chunks = [];
      res.on("data", function(c) { chunks.push(c); });
      res.on("end", function() {
        resolve({ status: res.statusCode, body: Buffer.concat(chunks) });
      });
    });
    req.on("error", reject);
    req.setTimeout(18000, function() { req.destroy(new Error("timeout")); });
  });
}

var HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9",
  "Accept-Language": "en-US,en;q=0.9",
  "Cache-Control": "no-cache",
};

// Validate that OG image belongs to this perfume
// (not a generic logo/fallback image)
var GENERIC_IMAGES = ["480.png", "logo.png", "default.png", "placeholder"];

function isGenericImage(url) {
  if (!url) return true;
  return GENERIC_IMAGES.some(function(g) { return url.includes(g); });
}

function titleMatchesModel(title, model) {
  if (!title) return false;
  var normTitle = normASCII(title).toLowerCase();
  var normModel = normASCII(model).toLowerCase();
  // Check if any significant word from the model appears in the title
  var words = normModel.split(/\s+/).filter(function(w) { return w.length > 3; });
  if (words.length === 0) return normTitle.includes(normModel);
  var matchCount = words.filter(function(w) { return normTitle.includes(w); }).length;
  return matchCount >= Math.ceil(words.length * 0.6);
}

async function getParfumoImage(brand, model) {
  var bSlug  = toBrand(brand);
  var mSlug  = toSlug(model, "_");
  var mHyphen = toSlug(model, "-");

  var variants = [
    bSlug + "/" + mSlug,
    bSlug + "/" + mHyphen,
    bSlug + "/" + mSlug.toLowerCase(),
    bSlug + "/" + mHyphen.toLowerCase(),
  ];

  for (var i = 0; i < variants.length; i++) {
    var url = "https://www.parfumo.com/Perfumes/" + variants[i];
    try {
      var res = await get(url, { headers: HEADERS });
      if (res.status !== 200) continue;
      var html = res.body.toString("utf8");
      if (html.length < 20000) continue;                     // 404/error pages are ~12k
      var ogMatch = html.match(/property="og:image" content="([^"]+)"/);
      if (!ogMatch) continue;
      var imgUrl = ogMatch[1].split("?")[0];
      if (isGenericImage(imgUrl)) continue;                   // skip default icons
      var titleMatch = html.match(/<title>([^<]+)<\/title>/);
      var title = titleMatch ? titleMatch[1] : "";
      if (title.includes("Access Denied")) continue;
      if (!titleMatchesModel(title, model)) continue;         // wrong page
      return imgUrl;
    } catch (e) { /* try next variant */ }
    await sleep(300);
  }
  return null;
}

async function downloadImage(imgUrl, destPath) {
  var res = await get(imgUrl, { headers: { "User-Agent": HEADERS["User-Agent"] } });
  if (res.status !== 200) throw new Error("HTTP " + res.status);
  fs.writeFileSync(destPath, res.body);
}

// ── Main ──────────────────────────────────────────────────────────────────
async function main() {
  var buf  = fs.readFileSync(EXCEL_PATH);
  var wb   = XLSX.read(buf, { type: "buffer" });
  var ws   = wb.Sheets["Temizlenmis Liste"];
  var data = XLSX.utils.sheet_to_json(ws, { header: 1 }).slice(1);

  var entries = data
    .filter(function(r) { return r[1] && r[2]; })
    .map(function(r) { return { brand: r[1].toString().trim(), model: r[2].toString().trim() }; });

  console.log("Toplam kayit: " + entries.length);
  console.log("Basliyor...\n");

  var done = 0, skipped = 0, failed = 0;
  var failures = [];

  for (var idx = 0; idx < entries.length; idx++) {
    var brand = entries[idx].brand;
    var model = entries[idx].model;

    // Find folder
    var folderName = BRAND_FOLDER[brand];
    if (!folderName) {
      skipped++;
      continue;
    }
    var perfumesDir = path.join(BRANDS_ROOT, folderName, "perfumes");
    if (!fs.existsSync(perfumesDir)) fs.mkdirSync(perfumesDir, { recursive: true });

    var fileName = sanitize(model) + ".jpg";
    var destPath = path.join(perfumesDir, fileName);

    if (fs.existsSync(destPath)) {
      done++;
      continue;
    }

    // Get image URL
    var imgUrl = null;
    for (var attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      imgUrl = await getParfumoImage(brand, model);
      if (imgUrl) break;
      if (attempt < MAX_RETRIES) await sleep(2000);
    }

    if (!imgUrl) {
      failures.push({ brand: brand, model: model });
      failed++;
    } else {
      try {
        await downloadImage(imgUrl, destPath);
        done++;
      } catch (e) {
        failures.push({ brand: brand, model: model, error: e.message });
        failed++;
      }
    }

    // Progress report every 20 items
    if ((idx + 1) % 20 === 0) {
      console.log("[" + (idx + 1) + "/" + entries.length + "] İndirildi: " + done + " | Başarısız: " + failed + " | Atlandı: " + skipped);
    }

    await sleep(DELAY_MS);
  }

  console.log("\n=== TAMAMLANDI ===");
  console.log("İndirildi : " + done);
  console.log("Başarısız  : " + failed);
  console.log("Atlandı   : " + skipped);

  if (failures.length > 0) {
    var logPath = "C:/Users/MERT/Desktop/parfum_failures.json";
    fs.writeFileSync(logPath, JSON.stringify(failures, null, 2));
    console.log("\nBaşarısız kayıtlar → " + logPath);
  }
}

main().catch(function(e) { console.error("KRITIK HATA:", e); process.exit(1); });
