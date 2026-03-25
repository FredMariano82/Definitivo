const XLSX = require('xlsx');
const path = require('path');

const baseDir = 'C:\\Users\\fredm\\OneDrive\\Documentos\\GitHub\\passo final';
const resultPath = path.join(baseDir, 'RESULTADO FINAL CRUZADO.xlsx');

try {
    const wb = XLSX.readFile(resultPath);
    const sheet = wb.Sheets[wb.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });

    console.log("=== CABEÇALHO DO RESULTADO ===");
    console.log(data[0]);

    console.log("\n=== AMOSTRA SELECIONADA (Linhas 2-6) ===");
    console.log(data.slice(1, 6));

} catch (e) {
    console.error(e.message);
}
