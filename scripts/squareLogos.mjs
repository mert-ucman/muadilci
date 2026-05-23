import sharp from 'sharp';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { ZipArchive } = require('archiver');
import { readdirSync, statSync, createWriteStream, mkdirSync, existsSync } from 'fs';
import { join, extname, basename } from 'path';

const SIZE = 500; // px - standart kare boyutu
const PADDING = 40; // iç boşluk
const INPUT_ROOT = 'C:/Users/win10/OneDrive/Desktop/brands';
const OUTPUT_DIR = 'C:/Users/win10/OneDrive/Desktop/brands-square';
const ZIP_PATH = 'C:/Users/win10/OneDrive/Desktop/brands-square.zip';

const SUPPORTED = ['.jpg', '.jpeg', '.png', '.webp', '.avif', '.gif', '.tiff'];

// Klasör adını insan okunabilir marka adına çevir
function folderToName(folder) {
  return folder
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase())
    .trim();
}

// Klasör içindeki ilk desteklenen görseli bul
function findImage(dir) {
  const files = readdirSync(dir);
  // webp/png/jpg öncelik sırası
  const sorted = files.sort((a, b) => {
    const order = ['.png', '.jpg', '.jpeg', '.webp', '.avif'];
    return order.indexOf(extname(a).toLowerCase()) - order.indexOf(extname(b).toLowerCase());
  });
  return sorted.find(f => SUPPORTED.includes(extname(f).toLowerCase()));
}

if (!existsSync(OUTPUT_DIR)) mkdirSync(OUTPUT_DIR, { recursive: true });
if (!existsSync(join(OUTPUT_DIR, 'original-brands'))) mkdirSync(join(OUTPUT_DIR, 'original-brands'));
if (!existsSync(join(OUTPUT_DIR, 'dupe-brands'))) mkdirSync(join(OUTPUT_DIR, 'dupe-brands'));

let success = 0;
let skipped = 0;

for (const category of ['original-brands', 'dupe-brands']) {
  const catDir = join(INPUT_ROOT, category);
  const brands = readdirSync(catDir).filter(f => statSync(join(catDir, f)).isDirectory());

  for (const brand of brands) {
    const brandDir = join(catDir, brand);
    const imgFile = findImage(brandDir);

    if (!imgFile) {
      console.log(`⚠ Görsel yok: ${category}/${brand}`);
      skipped++;
      continue;
    }

    const inputPath = join(brandDir, imgFile);
    const brandName = folderToName(brand);
    const outputPath = join(OUTPUT_DIR, category, `${brandName}.png`);

    try {
      const innerSize = SIZE - PADDING * 2;

      await sharp(inputPath)
        .resize(innerSize, innerSize, {
          fit: 'contain',
          background: { r: 255, g: 255, b: 255, alpha: 1 },
        })
        .flatten({ background: { r: 255, g: 255, b: 255 } })
        .extend({
          top: PADDING,
          bottom: PADDING,
          left: PADDING,
          right: PADDING,
          background: { r: 255, g: 255, b: 255 },
        })
        .png({ quality: 90 })
        .toFile(outputPath);

      success++;
      console.log(`✓ [${success}] ${brandName}`);
    } catch (err) {
      console.error(`✗ Hata - ${brandName}: ${err.message}`);
      skipped++;
    }
  }
}

console.log(`\n${success} görsel işlendi, ${skipped} atlandı. ZIP oluşturuluyor...\n`);

// ZIP oluştur
await new Promise((resolve, reject) => {
  const output = createWriteStream(ZIP_PATH);
  const archive = new ZipArchive({ zlib: { level: 6 } });
  output.on('close', resolve);
  archive.on('error', reject);
  archive.pipe(output);
  archive.directory(OUTPUT_DIR, false);
  archive.finalize();
});

console.log(`✓ ZIP hazır: ${ZIP_PATH}`);
process.exit(0);
