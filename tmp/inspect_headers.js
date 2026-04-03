const XLSX = require('xlsx');
const path = require('path');

const baseDir = 'C:\\Users\\fredm\\OneDrive\\Documentos\\GitHub\\passo final';
const admPath = path.join(baseDir, 'CRUZAR ADM.xlsx');
const idPath = path.join(baseDir, 'CRUZAR ID CONTROL.xlsx');

try {
    const wbADM = XLSX.readFile(admPath);
    const wbID = XLSX.readFile(idPath);

    console.log("--- COLUNAS ADM ---");
    const sheetADM = wbADM.Sheets[wbADM.SheetNames[0]];
    const headersADM = XLSX.utils.sheet_to_json(sheetADM, { header: 1 })[0];
    console.log(headersADM);

    console.log("\n--- COLUNAS ID CONTROL ---");
    const sheetID = wbID.Sheets[wbID.SheetNames[0]];
    const headersID = XLSX.utils.sheet_to_json(sheetID, { header: 1 })[0];
    console.log(headersID);

    console.log("\n--- AMOSTRA DE DADOS (1 linha) ---");
    console.log("ADM:", XLSX.utils.sheet_to_json(sheetADM)[0]);
    console.log("ID:", XLSX.utils.sheet_to_json(sheetID)[0]);

} catch (e) {
    console.error(e.message);
}
