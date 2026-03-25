const XLSX = require('xlsx');
const path = require('path');

const baseDir = 'C:\\Users\\fredm\\OneDrive\\Documentos\\GitHub\\passo final';
const resultPath = path.join(baseDir, 'RESULTADO FINAL CRUZADO.xlsx');

try {
    const wb = XLSX.readFile(resultPath);
    const sheet = wb.Sheets[wb.SheetNames[0]];
    const raw = XLSX.utils.sheet_to_json(sheet, { header: 1 });

    console.log("--- CABEÇALHO REAL NO ARQUIVO ---");
    console.log(raw[0]);

    console.log("\n--- AMOSTRA DE DADOS (1 linha) ---");
    console.log(raw[1]);

} catch (e) {
    console.error("ERRO AO LER:", e.message);
}
