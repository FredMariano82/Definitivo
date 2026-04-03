const xlsx = require('xlsx');
const path = require('path');
const fs = require('fs');

try {
  const filePath = path.resolve(__dirname, '../../teste.xlsx');
  const workbook = xlsx.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  
  const data = xlsx.utils.sheet_to_json(worksheet, { header: 1 });
  
  fs.writeFileSync('tmp_headers.json', JSON.stringify({
    headers: data[0] || [],
    primeira_linha: data[1] || []
  }, null, 2));
} catch (error) {
  fs.writeFileSync('tmp_headers.json', JSON.stringify({ error: error.message }));
}
