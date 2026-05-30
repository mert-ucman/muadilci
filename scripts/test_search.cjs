const https = require("https");

function post(url, data, hdrs) {
  return new Promise(function(resolve, reject) {
    var u = new URL(url);
    var opts = {
      hostname: u.hostname,
      path: u.pathname,
      method: "POST",
      headers: Object.assign({}, hdrs, {
        "Content-Type": "application/x-www-form-urlencoded",
        "Content-Length": Buffer.byteLength(data)
      })
    };
    var req = https.request(opts, function(res) {
      var chunks = [];
      res.on("data", function(c) { chunks.push(c); });
      res.on("end", function() { resolve({ status: res.statusCode, body: Buffer.concat(chunks) }); });
    });
    req.on("error", reject);
    req.write(data);
    req.end();
  });
}

var HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  "Accept": "*/*",
  "X-Requested-With": "XMLHttpRequest",
  "Referer": "https://www.parfumo.com/search"
};

function parseResults(html) {
  var entries = [];
  var imgRe = /src="(https:\/\/media\.parfumo\.com\/perfumes\/[^"]+)"/g;
  var altRe = /alt="([^"]+)"/g;
  var combined = /<div class="image">[\s\S]*?alt="([^"]+)"[\s\S]*?src="(https:\/\/media\.parfumo\.com\/perfumes\/[^"]+)"/g;
  var m;
  while ((m = combined.exec(html)) !== null) {
    var alt = m[1];
    var img = m[2].split("?")[0];
    var parts = alt.split(" by ");
    var perfumeName = parts[0].trim();
    var brandName = parts.length > 1 ? parts[1].trim() : "";
    entries.push({ perfumeName: perfumeName, brandName: brandName, img: img });
  }
  return entries;
}

async function main() {
  var tests = [
    ["Acqua Di Parma", "Colonia", "Colonia+Acqua+di+Parma"],
    ["Abercrombie & Fitch", "Fierce", "Fierce+Abercrombie"],
    ["Adidas", "Action", "Action+Adidas"],
  ];

  for (var i = 0; i < tests.length; i++) {
    var brand = tests[i][0];
    var model = tests[i][1];
    var query = tests[i][2];
    var res = await post("https://www.parfumo.com/s_perfumes_x.php", "search=" + query, HEADERS);
    var html = res.body.toString("utf8");
    var entries = parseResults(html);
    console.log("\n=== " + brand + " / " + model + " (query: " + query + ") ===");
    console.log("Total results:", entries.length);
    entries.slice(0, 5).forEach(function(e) {
      console.log("  - " + e.perfumeName + " by " + e.brandName + " -> " + e.img.split("/").pop());
    });
    await new Promise(function(r) { setTimeout(r, 2000); });
  }
}

main().catch(console.error);
