const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const DIR = "C:\\Users\\central_seguranca\\Documents\\Mariano\\todo o resto de Projetos";
const MASTER_FILE = path.join(DIR, "Pessoas_202631_2025.xlsx");

async function fillRemaining() {
    console.log("🚀 Iniciando preenchimento final de lacunas...");

    if (!fs.existsSync(MASTER_FILE)) {
        console.error("❌ Arquivo mestre não encontrado.");
        return;
    }

    const wb = XLSX.readFile(MASTER_FILE);
    const sheetName = wb.SheetNames[0];
    const sheet = wb.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    const headers = rows[0];

    // Colunas identificadas anteriormente:
    // [0] nome, [3] liberação DATA FINAL, [6] EMPRESA , [7] checagem válida até
    const idxDataFinal = headers.indexOf('liberação DATA FINAL');
    const idxEmpresa = headers.indexOf('EMPRESA ');
    const idxValidade = headers.indexOf('checagem válida até');

    if (idxDataFinal === -1 || idxEmpresa === -1 || idxValidade === -1) {
        console.error("❌ Colunas necessárias não identificadas.");
        console.log("Headers encontrados:", headers);
        return;
    }

    let filledEmpresa = 0;
    let filledValidade = 0;

    for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        
        // Se empresa estiver vazia ou só espaços
        if (!row[idxEmpresa] || String(row[idxEmpresa]).trim() === "") {
            row[idxEmpresa] = "desconhecida";
            filledEmpresa++;
        }

        // Se validade de checagem estiver vazia ou só espaços
        if (!row[idxValidade] || String(row[idxValidade]).trim() === "") {
            // Usa a data final da liberação
            row[idxValidade] = row[idxDataFinal] || "";
            filledValidade++;
        }
    }

    console.log(`📊 Resumo do Preenchimento Final:`);
    console.log(`   🔹 Empresas marcadas como 'desconhecida': ${filledEmpresa}`);
    console.log(`   🔹 Validades preenchidas com 'DATA FINAL': ${filledValidade}`);

    const newSheet = XLSX.utils.aoa_to_sheet(rows);
    if (sheet['!cols']) newSheet['!cols'] = sheet['!cols'];
    wb.Sheets[sheetName] = newSheet;

    try {
        XLSX.writeFile(wb, MASTER_FILE);
        console.log(`\n✨ SUCESSO! Todas as lacunas foram preenchidas.`);
    } catch (e) {
        if (e.code === 'EBUSY') {
            console.error("❌ ERRO: O arquivo está aberto no Excel. Feche-o para salvar.");
        } else {
            console.error("❌ Erro fatal:", e.message);
        }
    }
}

fillRemaining().catch(console.error);
