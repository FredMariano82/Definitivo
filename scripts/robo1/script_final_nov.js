const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

// Caminhos locais para evitar problemas de rede ou caminhos com espaços duplos
const MASTER_FILE = "C:\\Users\\central_seguranca\\Documents\\Mariano\\todo o resto de Projetos\\Pessoas_202631_2025.xlsx";
const SOURCE_FILE = path.join(__dirname, "nov_final.xlsx");

function normalize(str) {
    if (!str) return "";
    return String(str)
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]/g, "")
        .trim();
}

async function run() {
    console.log("🚀 INICIANDO PROCESSAMENTO DE NOVEMBRO (DADOS LOCAIS)...");

    if (!fs.existsSync(SOURCE_FILE)) {
        console.error("❌ Erro: Arquivo fonte não encontrado:", SOURCE_FILE);
        return;
    }

    // 1. Carregar Fonte
    const wbSource = XLSX.readFile(SOURCE_FILE);
    const sheetSource = wbSource.Sheets['Geral'] || wbSource.Sheets[wbSource.SheetNames[0]];
    const dataSource = XLSX.utils.sheet_to_json(sheetSource);
    
    const checkMap = new Map();
    dataSource.forEach(row => {
        const nome = row['PRESTADOR/SOLICITANTE'];
        const empresa = row['EMPRESA/EVENTO'];
        if (nome) {
            checkMap.set(normalize(nome), {
                empresa: empresa || "",
                validade: "31/05/2026"
            });
        }
    });
    console.log(`📡 Mapeados ${checkMap.size} nomes da lista de Novembro.`);

    // 2. Atualizar o mestre
    const wbMaster = XLSX.readFile(MASTER_FILE);
    const sheetName = wbMaster.SheetNames[0];
    const sheetMaster = wbMaster.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(sheetMaster, { header: 1 });
    const headers = rows[0];

    const idxNome = headers.indexOf('nome');
    const idxEmpresa = headers.indexOf('EMPRESA '); 
    const idxValidade = headers.indexOf('checagem válida até');

    let updates = 0;
    for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        if (row[idxNome]) {
            const info = checkMap.get(normalize(row[idxNome]));
            if (info) {
                row[idxEmpresa] = info.empresa;
                row[idxValidade] = info.validade;
                updates++;
            }
        }
    }

    console.log(`📊 Registros atualizados no mestre: ${updates}`);

    // 3. Salvar
    const newSheet = XLSX.utils.aoa_to_sheet(rows);
    if (sheetMaster['!cols']) newSheet['!cols'] = sheetMaster['!cols'];
    wbMaster.Sheets[sheetName] = newSheet;
    XLSX.writeFile(wbMaster, MASTER_FILE);

    console.log(`\n✨ SUCESSO! Cruzamento de Novembro concluído.`);
}

run().catch(console.error);
