const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

const baseDir = 'C:\\Users\\fredm\\OneDrive\\Documentos\\GitHub\\passo final';
const downloadDir = 'C:\\Users\\fredm\\Downloads';
const admPath = path.join(baseDir, 'CRUZAR ADM.xlsx');
const idPath = path.join(baseDir, 'CRUZAR ID CONTROL.xlsx');
const outputPath = path.join(downloadDir, 'RESULTADO FINAL CRUZADO.xlsx');

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
    console.log("🚀 Iniciando Motor de Cruzamento V3.1 (Salvando em Downloads)...");
    if (!fs.existsSync(admPath)) throw new Error(`Arquivo não encontrado: ${admPath}`);
    if (!fs.existsSync(idPath)) throw new Error(`Arquivo não encontrado: ${idPath}`);

    const wbADM = XLSX.readFile(admPath);
    const wbID = XLSX.readFile(idPath);

    const sheetID = wbID.Sheets[wbID.SheetNames[0]];
    const rawID = XLSX.utils.sheet_to_json(sheetID, { header: 1 });
    
    let colNomeID = 0, colIniID = -1, colFinID = -1;
    const headerRowID = rawID[0] || [];
    headerRowID.forEach((h, idx) => {
        const hn = normalizar(h);
        if (hn.includes("nome") || hn.includes("usuario") || hn.includes("prestador")) colNomeID = idx;
        if (hn.includes("inicial") || (hn.includes("data") && hn.includes("ini"))) colIniID = idx;
        if (hn.includes("final") || (hn.includes("data") && hn.includes("fin"))) colFinID = idx;
    });

    const mapaID = new Map();
    rawID.slice(1).forEach(row => {
        const nome = row[colNomeID];
        if (nome) {
            mapaID.set(normalizar(nome), {
                dIni: colIniID !== -1 ? row[colIniID] : "",
                dFin: colFinID !== -1 ? row[colFinID] : ""
            });
        }
    });

    const sheetADM = wbADM.Sheets[wbADM.SheetNames[0]];
    const rawADM = XLSX.utils.sheet_to_json(sheetADM, { header: 1 });
    const headerRowADM = rawADM[0];

    let colNomeADM = 0;
    headerRowADM.forEach((h, idx) => {
        const hn = normalizar(h);
        if (hn.includes("nome") || hn.includes("prestador")) colNomeADM = idx;
    });

    const finalHeader = [...headerRowADM];
    if (!finalHeader.includes("DATA INICIAL")) finalHeader.push("DATA INICIAL");
    if (!finalHeader.includes("DATA FINAL")) finalHeader.push("DATA FINAL");
    
    const idxIni = finalHeader.indexOf("DATA INICIAL");
    const idxFin = finalHeader.indexOf("DATA FINAL");

    const finalRows = [finalHeader];
    let encontrados = 0;

    rawADM.slice(1).forEach(row => {
        const newRow = new Array(finalHeader.length).fill("");
        row.forEach((val, i) => { newRow[i] = val; });
        const nomeADM = row[colNomeADM];
        if (nomeADM) {
            const match = mapaID.get(normalizar(nomeADM));
            if (match) {
                encontrados++;
                newRow[idxIni] = match.dIni;
                newRow[idxFin] = match.dFin;
            }
        }
        finalRows.push(newRow);
    });

    const newWs = XLSX.utils.aoa_to_sheet(finalRows);
    const newWb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(newWb, newWs, "PlanilhaSincronizada");
    XLSX.writeFile(newWb, outputPath);
    
    console.log(`\n✅ SUCESSO TOTAL V3.1!`);
    console.log(`📊 Cruzados: ${encontrados} de ${finalRows.length - 1} registros.`);
    console.log(`💾 SALVO EM: ${outputPath}`);

} catch (error) {
    console.error("❌ ERRO V3.1:", error.message);
}
