const XLSX = require('xlsx');
const fs = require('fs');

const filePath = 'C:\\Users\\central_seguranca\\Documents\\Mariano\\todo o resto de Projetos\\Pessoas_202631_2025.xlsx';
const outputPath = 'c:\\Users\\central_seguranca\\.gemini\\antigravity\\scratch\\Definitivo\\inspect_results_deep.json';

try {
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

    const results = [];
    for (let i = 0; i < data.length; i++) {
        const row = data[i];
        if (row[3] && row[3] !== "") {
            results.push({ linha: i, values: row });
        }
        if (results.length >= 20) break;
    }

    fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
    console.log('Resultados com datas salvos em:', outputPath);
} catch (error) {
    console.error('Erro:', error);
}
