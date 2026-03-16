const XLSX = require('xlsx');
const fs = require('fs');

const filePath = 'C:\\Users\\central_seguranca\\Documents\\Mariano\\todo o resto de Projetos\\Pessoas_202631_2025.xlsx';
const outputPath = 'c:\\Users\\central_seguranca\\.gemini\\antigravity\\scratch\\Definitivo\\inspect_results.json';

try {
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

    const results = data.slice(0, 51).map((row, i) => {
        return {
            linha: i,
            values: row
        };
    });

    fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
    console.log('Resultados salvos em:', outputPath);
} catch (error) {
    console.error('Erro:', error);
}
