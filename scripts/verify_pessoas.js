const XLSX = require('xlsx');
const filePath = 'C:\\Users\\central_seguranca\\Documents\\Mariano\\todo o resto de Projetos\\Pessoas_202631_2025.xlsx';

try {
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

    console.log('--- VERIFICAÇÃO FINAL ---');
    console.log('Total de linhas após filtro:', data.length - 1);
    
    console.log('\nPrimeiras 20 linhas de dados:');
    for (let i = 1; i < Math.min(data.length, 21); i++) {
        console.log(`L${i}: ${data[i][0]} | Data Final: ${data[i][3]}`);
    }
} catch (error) {
    console.error('Erro:', error);
}
