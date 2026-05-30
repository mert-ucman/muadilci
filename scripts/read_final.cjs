const XLSX = require('../node_modules/xlsx');
const fs = require('fs');

const buf = fs.readFileSync('C:/Users/MERT/Desktop/FİNAL.xlsx');
const wb = XLSX.read(buf, { type: 'buffer' });
console.log('Sheets:', wb.SheetNames);
wb.SheetNames.forEach(name => {
  const ws = wb.Sheets[name];
  const data = XLSX.utils.sheet_to_json(ws, { header: 1 });
  console.log(`\n=== Sheet: ${name} (${data.length} rows) ===`);
  data.slice(0, 80).forEach((row, i) => console.log(i + 1, JSON.stringify(row)));
});
