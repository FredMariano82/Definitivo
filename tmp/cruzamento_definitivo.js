const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

const baseDir = 'C:\\Users\\fredm\\OneDrive\\Documentos\\GitHub\\passo final';
const admPath = path.join(baseDir, 'CRUZAR ADM.xlsx');
const idPath = path.join(baseDir, 'CRUZAR ID CONTROL.xlsx');
const outputPath = path.join(baseDir, 'RESULTADO FINAL CRUZADO.xlsx');

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
    console.log("🚀 Iniciando Motor de Cruzamento V4.0 (DIRETÓRIO: PASSO FINAL)...");
    
    const wbADM = XLSX.readFile(admPath);
    const wbID = XLSX.readFile(idPath);

    // 1. MAPEAMENTO ID CONTROL
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
                dIni: colIniID !== -1 ? (row[colIniID] || "") : "",
                dFin: colFinID !== -1 ? (row[colFinID] || "") : ""
            });
        }
    });

    // 2. PROCESSAR ADM
    const sheetADM = wbADM.Sheets[wbADM.SheetNames[0]];
    const rawADM = XLSX.utils.sheet_to_json(sheetADM, { header: 1 });
    const headerRowADM = rawADM[0];

    let colNomeADM = 0;
    headerRowADM.forEach((h, idx) => {
        const hn = normalizar(h);
        if (hn.includes("nome") || hn.includes("prestador")) colNomeADM = idx;
    });

    // NOVO CABEÇALHO GARANTIDO
    const finalHeader = [...headerRowADM, "DATA INICIAL (MVM)", "DATA FINAL (MVM)"];
    const idxIni = finalHeader.indexOf("DATA INICIAL (MVM)");
    const idxFin = finalHeader.indexOf("DATA FINAL (MVM)");

    const finalRows = [finalHeader];
    let encontrados = 0;

    rawADM.slice(1).forEach(row => {
        const newRow = new Array(finalHeader.length).fill("");
        // Copia dados originais
        for(let i=0; i<row.length; i++) newRow[i] = row[i];

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

    // 3. GRAVAR
    const newWs = XLSX.utils.aoa_to_sheet(finalRows);
    const newWb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(newWb, newWs, "Cruzamento_Concluido");
    XLSX.writeFile(newWb, outputPath);
    
    console.log(`\n✅ CONCLUÍDO COM SUCESSO!`);
    console.log(`📊 Linhas no ADM: ${finalRows.length - 1}`);
    console.log(`🔗 Corresp. encontradas: ${encontrados}`);
    console.log(`💾 ARQUIVO SALVO EM: ${outputPath}`);

} catch (error) {
    console.error("❌ ERRO NO MOTOR V4.0:", error.message);
}
