const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const WORKING_DIR = "C:\\Users\\central_seguranca\\.gemini\\antigravity\\scratch\\Definitivo";
const PROJECTS_DIR = "C:\\Users\\central_seguranca\\Documents\\Mariano\\todo o resto de Projetos";
const SOURCE_FILE = path.join(WORKING_DIR, "temp_nov.xlsx");
const MASTER_FILE = path.join(PROJECTS_DIR, "Pessoas_202631_2025.xlsx");

function normalize(str) {
    if (!str) return "";
    return String(str)
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]/g, "")
        .trim();
}

async function mergeNovember() {
    console.log("🚀 Iniciando cruzamento de checagem (NOVEMBRO)...");

    if (!fs.existsSync(SOURCE_FILE)) {
        console.error("❌ Arquivo temporário de Novembro não encontrado!");
        return;
    }

    if (!fs.existsSync(MASTER_FILE)) {
        console.error("❌ Arquivo mestre não encontrado em:", MASTER_FILE);
        return;
    }

    // 1. Carregar Fonte
    console.log(`📡 Lendo base de checagens: temp_nov.xlsx...`);
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
    console.log(`   🔸 Mapa de checagens criado com ${checkMap.size} registros.`);

    // 2. Carregar mestre
    console.log("📖 Lendo arquivo mestre de Pessoas...");
    const wbMaster = XLSX.readFile(MASTER_FILE);
    const sheetName = wbMaster.SheetNames[0];
    const sheetMaster = wbMaster.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(sheetMaster, { header: 1 });
    const headers = rows[0];

    const idxNome = headers.indexOf('nome');
    const idxEmpresa = headers.indexOf('EMPRESA '); 
    const idxValidade = headers.indexOf('checagem válida até');

    if (idxNome === -1 || idxEmpresa === -1 || idxValidade === -1) {
        console.error("❌ Colunas necessárias não identificadas no mestre.");
        return;
    }

    let updates = 0;
    for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        const nomeOriginal = row[idxNome];
        if (nomeOriginal) {
            const normName = normalize(nomeOriginal);
            const info = checkMap.get(normName);
            if (info) {
                row[idxEmpresa] = info.empresa;
                row[idxValidade] = info.validade;
                updates++;
            }
        }
    }

    // 3. Salvar
    console.log(`\n📊 Resultado:`);
    console.log(`   🔹 Registros atualizados no mestre com dados de Novembro: ${updates}`);
    
    const newSheet = XLSX.utils.aoa_to_sheet(rows);
    if (sheetMaster['!cols']) newSheet['!cols'] = sheetMaster['!cols'];
    wbMaster.Sheets[sheetName] = newSheet;
    
    try {
        XLSX.writeFile(wbMaster, MASTER_FILE);
        console.log(`\n✨ SUCESSO! Arquivo mestre atualizado.`);
    } catch (e) {
        if (e.code === 'EBUSY') {
            console.error("❌ ERRO: O arquivo está aberto no Excel.");
        } else {
            console.error("❌ Erro fatal:", e.message);
        }
    }
}

mergeNovember().catch(e => console.error("❌ Erro fatal:", e));
