const xlsx = require('xlsx');
const path = require('path');

const file = 'C:\\Users\\central_seguranca\\.gemini\\antigravity\\scratch\\recuperar\\afetados_FINAL_REVISADO_ATUALIZADO.xlsx';

try {
    const workbook = xlsx.readFile(file);
    const data = xlsx.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
    console.log('--- AMOSTRA DE RESULTADOS ---');
    console.log(JSON.stringify(data.slice(0, 5), null, 2));
    
    const comDados = data.filter(r => r['EMPRESA'] || r['DEPARTAMENTO']).length;
    console.log(`\nTotal de linhas no arquivo: ${data.length}`);
    console.log(`Linhas com dados preenchidos: ${comDados}`);
} catch (e) {
    console.error(e.message);
}
