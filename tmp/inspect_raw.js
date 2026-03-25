const XLSX = require('xlsx');
const path = require('path');

const baseDir = 'C:\\Users\\fredm\\OneDrive\\Documentos\\GitHub\\passo final';
const admPath = path.join(baseDir, 'CRUZAR ADM.xlsx');
const idPath = path.join(baseDir, 'CRUZAR ID CONTROL.xlsx');

try {
    const wbADM = XLSX.readFile(admPath);
    const wbID = XLSX.readFile(idPath);

    const sheetADM = wbADM.Sheets[wbADM.SheetNames[0]];
    const sheetID = wbID.Sheets[wbID.SheetNames[0]];

    const rawADM = XLSX.utils.sheet_to_json(sheetADM, { header: 1 });
    const rawID = XLSX.utils.sheet_to_json(sheetID, { header: 1 });

    console.log("=== PRIMEIRAS 3 LINHAS ADM (RAW) ===");
    console.log(rawADM.slice(0, 3));

    console.log("\n=== PRIMEIRAS 3 LINHAS ID CONTROL (RAW) ===");
    console.log(rawID.slice(0, 3));

} catch (e) {
    console.error(e.message);
}
