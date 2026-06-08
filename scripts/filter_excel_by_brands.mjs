import { readFileSync } from 'fs';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import { read, utils, writeFile } from 'xlsx';

const firebaseConfig = {
  apiKey: 'AIzaSyBK4k9sADwogv7UjXtwDrf6hDcNn0MZBHg',
  authDomain: 'muadilci-890e4.firebaseapp.com',
  projectId: 'muadilci-890e4',
  storageBucket: 'muadilci-890e4.firebasestorage.app',
  messagingSenderId: '937526538108',
  appId: '1:937526538108:web:5b9423c9b3995bf174bef9',
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// 1. Firebase'den tüm markaları çek
console.log('Firebase\'den markalar çekiliyor...');
const brandsSnap = await getDocs(collection(db, 'brands'));
const dbBrands = new Set();
brandsSnap.forEach(doc => {
  const data = doc.data();
  if (data.name) dbBrands.add(data.name.trim().toLowerCase());
});
console.log(`Veritabanında ${dbBrands.size} marka bulundu.`);

// 2. Excel dosyasını oku
const INPUT  = 'C:\\Users\\win10\\OneDrive\\Desktop\\02_Parfumo_Perfumes.xls';
const OUTPUT = 'C:\\Users\\win10\\OneDrive\\Desktop\\02_Parfumo_Perfumes_filtered.xlsx';

const workbook = read(readFileSync(INPUT));
const sheetName = workbook.SheetNames[0];
const sheet = workbook.Sheets[sheetName];
const rows = utils.sheet_to_json(sheet, { defval: '' });

console.log(`Excel'de toplam ${rows.length} satır var.`);
console.log('Kolonlar:', Object.keys(rows[0]));

// 3. Brand kolonunu bul (büyük/küçük harf bağımsız)
const brandCol = Object.keys(rows[0]).find(k => k.toLowerCase().includes('brand'));
if (!brandCol) {
  console.error('Brand kolonu bulunamadı!');
  process.exit(1);
}
console.log(`Brand kolonu: "${brandCol}"`);

// 4. Filtrele — veritabanında olan markalar
const filtered = rows.filter(row => {
  const brand = String(row[brandCol] || '').trim().toLowerCase();
  return dbBrands.has(brand);
});

console.log(`Filtreleme sonrası: ${filtered.length} satır (${rows.length - filtered.length} satır çıkarıldı).`);

// 5. Kaydet
const newWb = utils.book_new();
const newWs = utils.json_to_sheet(filtered);
utils.book_append_sheet(newWb, newWs, sheetName);
writeFile(newWb, OUTPUT);

console.log(`Dosya kaydedildi: ${OUTPUT}`);
process.exit(0);
