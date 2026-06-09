#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

// Load input files
const perfumesPath = path.join(__dirname, 'agent_chunk_1.json');
const noteDictPath = path.join(__dirname, 'note_dict.json');
const outputPath = path.join(__dirname, 'agent_result_1.json');

const perfumes = JSON.parse(fs.readFileSync(perfumesPath, 'utf8'));
const noteDict = JSON.parse(fs.readFileSync(noteDictPath, 'utf8'));

function translateNotes(notes, noteDict) {
  return notes
    .map(note => noteDict[note] || note)
    .join(', ');
}

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    const options = {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeout: 10000
    };

    protocol.get(url, options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        resolve(data);
      });
    }).on('error', reject);
  });
}

function parseNotes(html) {
  const topNotes = [];
  const midNotes = [];
  const baseNotes = [];

  // Match sections with notes
  const topMatch = html.match(/<div[^>]*class="[^"]*section[^"]*"[^>]*>[\s\S]*?Top Notes[\s\S]*?<\/div>/i);
  const midMatch = html.match(/<div[^>]*class="[^"]*section[^"]*"[^>]*>[\s\S]*?Heart[\s\S]*?<\/div>/i) ||
                   html.match(/<div[^>]*class="[^"]*section[^"]*"[^>]*>[\s\S]*?Middle[\s\S]*?<\/div>/i);
  const baseMatch = html.match(/<div[^>]*class="[^"]*section[^"]*"[^>]*>[\s\S]*?Base Notes[\s\S]*?<\/div>/i);

  // Extract note names using regex
  const cellPattern = /<p[^>]*class="[^"]*cell-name[^"]*"[^>]*>([^<]+)<\/p>/g;

  if (topMatch) {
    let match;
    while ((match = cellPattern.exec(topMatch[0])) !== null) {
      topNotes.push(match[1].trim());
    }
    cellPattern.lastIndex = 0;
  }

  if (midMatch) {
    let match;
    while ((match = cellPattern.exec(midMatch[0])) !== null) {
      midNotes.push(match[1].trim());
    }
    cellPattern.lastIndex = 0;
  }

  if (baseMatch) {
    let match;
    while ((match = cellPattern.exec(baseMatch[0])) !== null) {
      baseNotes.push(match[1].trim());
    }
    cellPattern.lastIndex = 0;
  }

  return {
    top: topNotes,
    mid: midNotes,
    base: baseNotes,
    found: topNotes.length > 0 || midNotes.length > 0 || baseNotes.length > 0
  };
}

async function fetchPerfumeNotes(urlPath, brand, name) {
  try {
    const url = `https://www.fragrantica.com${urlPath}`;
    console.log(`Processing: ${brand} - ${name}`);

    const html = await fetchUrl(url);
    const notes = parseNotes(html);

    return {
      top: translateNotes(notes.top, noteDict),
      mid: translateNotes(notes.mid, noteDict),
      base: translateNotes(notes.base, noteDict),
      found: notes.found
    };
  } catch (error) {
    console.error(`Error fetching ${brand} - ${name}:`, error.message);
    return {
      top: '',
      mid: '',
      base: '',
      found: false
    };
  }
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  const results = [];

  for (const perfume of perfumes) {
    const notes = await fetchPerfumeNotes(perfume.url, perfume.brand, perfume.name);

    results.push({
      idx: perfume.idx,
      brand: perfume.brand,
      name: perfume.name,
      top: notes.top,
      mid: notes.mid,
      base: notes.base,
      found: notes.found
    });

    // Wait between requests to be respectful
    await sleep(1500);
  }

  // Save results
  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2), 'utf8');
  console.log(`\nResults saved to ${outputPath}`);
  console.log(`Processed ${results.length} perfumes`);
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
