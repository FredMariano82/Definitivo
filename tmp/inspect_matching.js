const XLSX = require('xlsx');
const path = require('path');

const baseDir = 'C:\\Users\\fredm\\OneDrive\\Documentos\\GitHub\\passo final';
const admPath = path.join(baseDir, 'CRUZAR ADM.xlsx');
const idPath = path.join(baseDir, 'CRUZAR ID CONTROL.xlsx');

function normalizar(str) {
  return String(str || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .replace(/[^a-z0-9 ]/g, "")
    .trim();
}

try {
    const wbADM = XLSX.readFile(admPath);
    const wbID = XLSX.readFile(idPath);

    const dataADM = XLSX.utils.sheet_to_json(wbADM.Sheets[wbADM.SheetNames[0]]);
    const dataID = XLSX.utils.sheet_to_json(wbID.Sheets[wbID.SheetNames[0]]);

    console.log("=== COLUNAS ADM ===");
    console.log(Object.keys(dataADM[0] || {}));

    console.log("\n=== COLUNAS ID CONTROL ===");
    console.log(Object.keys(dataID[0] || {}));

    console.log("\n=== AMOSTRA DE NOMES (ADM -> NORMALIZADO) ===");
    dataADM.slice(0, 5).forEach(r => {
        let n = r['NOME'] || r['Nome'] || r['Prestador'];
        console.log(`Original: [${n}] -> Normalizado: [${normalizar(n)}]`);
    });

    console.log("\n=== AMOSTRA DE NOMES (ID CONTROL -> NORMALIZADO) ===");
    dataID.slice(0, 5).forEach(r => {
        let n = r['NOME'] || r['Nome'] || r['Prestador'] || r['USUARIO'] || r['Usuario'];
        console.log(`Original: [${n}] -> Normalizado: [${normalizar(n)}]`);
    });

} catch (e) {
    console.error(e.message);
}
