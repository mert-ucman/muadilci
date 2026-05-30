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
  "Referer": "https://www.parfumo.com/search?q=Colonia"
};

function extractImages(html) {
  var results = [];
  // Match img tags with both src and alt
  var m;
  var re = new RegExp('<img\\s[^>]*src="(https://media\\.parfumo\\.com/perfumes/[^"]+)"[^>]*alt="([^"]+)"', "g");
  while ((m = re.exec(html)) !== null) {
    results.push({ img: m[1].split("?")[0], alt: m[2] });
  }
  // Also try alt before src
  var re2 = new RegExp('<img\\s[^>]*alt="([^"]+)"[^>]*src="(https://media\\.parfumo\\.com/perfumes/[^"]+)"', "g");
  while ((m = re2.exec(html)) !== null) {
    results.push({ alt: m[1], img: m[2].split("?")[0] });
  }
  return results;
}

async function main() {
  var queries = [
    "filter=Colonia+Acqua+di+Parma&v=grid&in=1",
    "filter=Fierce+Abercrombie&v=grid&in=1",
    "filter=Colonia&v=grid&in=1"
  ];

  for (var i = 0; i < queries.length; i++) {
    var q = queries[i];
    var res = await post("https://www.parfumo.com/s_perfumes_x.php", q, HEADERS);
    var html = res.body.toString("utf8");
    var imgs = extractImages(html);
    console.log("\nQuery: " + q.split("&")[0]);
    console.log("Status:", res.status, "Length:", html.length, "Images:", imgs.length);
    imgs.slice(0, 8).forEach(function(e) {
      console.log("  " + e.alt + " -> " + e.img.split("/").pop());
    });
    await new Promise(function(r) { setTimeout(r, 2000); });
  }
}

main().catch(console.error);
