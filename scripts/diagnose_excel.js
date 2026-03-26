const XLSX = require('xlsx');
const path = require('path');

const filePath = 'C:\\Users\\central_seguranca\\.gemini\\antigravity\\scratch\\recuperar\\Afetados pelo Robo4.xlsx';

try {
  const wb = XLSX.readFile(filePath);
  console.log(`📊 Planilha: Afetados pelo Robo4.xlsx`);
  console.log(`📑 Abas encontradas: ${wb.SheetNames.join(', ')}`);

  wb.SheetNames.forEach(name => {
    const sheet = wb.Sheets[name];
    const range = XLSX.utils.decode_range(sheet['!ref']);
    const rowCount = range.e.r - range.s.r + 1;
    const data = XLSX.utils.sheet_to_json(sheet);
    console.log(`   - Aba [${name}]: ${rowCount} linhas (incluindo cabeçalho), ${data.length} objetos JSON.`);
    if (data.length > 0) {
      console.log(`   - Amostra (Primeiro Nome): ${data[0].Nome || data[0].Usuario || Object.values(data[0])[0]}`);
    }
  });

} catch (err) {
  console.error("❌ Erro ao ler planilha:", err.message);
}
