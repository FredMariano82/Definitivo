const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const DIR = "C:\\Users\\central_seguranca\\Documents\\Mariano\\todo o resto de Projetos";
const SOURCE_FILE = path.join(DIR, "checagens FEV 2026.xlsx");
const MASTER_FILE = path.join(DIR, "Pessoas_202631_2025.xlsx");

function normalize(str) {
    if (!str) return "";
    return String(str)
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]/g, "")
        .trim();
}

async function mergeFebruary() {
    console.log("🚀 Iniciando cruzamento de checagem (FEVEREIRO)...");

    if (!fs.existsSync(SOURCE_FILE) || !fs.existsSync(MASTER_FILE)) {
        console.error("❌ Arquivos necessários não encontrados.");
        return;
    }

    // 1. Carregar Fonte e criar mapa
    console.log("📡 Lendo base de checagens de Fevereiro...");
    const wbSource = XLSX.readFile(SOURCE_FILE);
    const sheetSource = wbSource.Sheets['Geral'] || wbSource.Sheets[wbSource.SheetNames[0]];
    const dataSource = XLSX.utils.sheet_to_json(sheetSource);
    
    const checkMap = new Map();
    dataSource.forEach(row => {
        // Colunas identificadas: NOME, EMPRESA/EVENTO
        const nome = row['NOME'];
        const empresa = row['EMPRESA/EVENTO'];
        if (nome) {
            checkMap.set(normalize(nome), {
                empresa: empresa || "",
                validade: "28/08/2026"
            });
        }
    });
    console.log(`   🔸 Mapa de checagens criado com ${checkMap.size} registros.`);

    // 2. Carregar arquivo mestre
    console.log("📖 Lendo arquivo mestre de Pessoas...");
    const wbMaster = XLSX.readFile(MASTER_FILE);
    const sheetName = wbMaster.SheetNames[0];
    const sheetMaster = wbMaster.Sheets[sheetName];
    
    const rows = XLSX.utils.sheet_to_json(sheetMaster, { header: 1 });
    const headers = rows[0];

    // Colunas: [0] nome, [6] EMPRESA, [7] checagem válida até
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
    console.log(`   🔹 Registros atualizados no mestre com dados de Fevereiro: ${updates}`);
    
    const newSheet = XLSX.utils.aoa_to_sheet(rows);
    if (sheetMaster['!cols']) newSheet['!cols'] = sheetMaster['!cols'];
    wbMaster.Sheets[sheetName] = newSheet;
    
    try {
        XLSX.writeFile(wbMaster, MASTER_FILE);
        console.log(`\n✨ SUCESSO! Arquivo mestre atualizado com dados de Fevereiro.`);
    } catch (e) {
        if (e.code === 'EBUSY') {
            console.error("❌ ERRO: O arquivo está aberto no Excel.");
        } else {
            console.error("❌ Erro fatal:", e.message);
        }
    }
}

mergeFebruary().catch(e => console.error("❌ Erro fatal:", e));
