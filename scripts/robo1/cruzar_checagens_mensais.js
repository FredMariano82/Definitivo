const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const PROJECTS_DIR = "C:\\Users\\central_seguranca\\Documents\\Mariano\\todo o resto de Projetos";
const CHECAGENS_DIR = path.join(PROJECTS_DIR, "checagens");
const MASTER_FILE = path.join(PROJECTS_DIR, "Pessoas_202631_2025.xlsx");

// Definição dos arquivos e suas respectivas datas de validade (6 meses depois)
const MONTH_FILES = [
    { file: "Checagem Outubro  2025.xlsx", validity: "30/04/2026" },
    { file: "Checagem Novembro  2025.xlsx", validity: "31/05/2026" },
    { file: "Checagem Dezembro 2025.xlsx", validity: "30/06/2026" },
    { file: "Checagem Janeiro  2026.xlsx", validity: "31/07/2026" },
    { file: "Checagem Fevereiro 2026.xlsx", validity: "31/08/2026" },
    { file: "Checagem Março 2026.xlsx", validity: "30/09/2026" }
];

function normalize(str) {
    if (!str) return "";
    return String(str)
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]/g, "")
        .trim();
}

async function mergeMonthlyChecks() {
    console.log("🚀 Iniciando cruzamento de checagens mensais...");

    const checkDataMap = new Map();

    // 1. Carregar dados de todos os meses (seguindo a ordem cronológica)
    for (const item of MONTH_FILES) {
        const filePath = path.join(CHECAGENS_DIR, item.file);
        if (!fs.existsSync(filePath)) {
            console.warn(`   ⚠️ Arquivo não encontrado: ${item.file}`);
            continue;
        }

        console.log(`   📡 Processando: ${item.file}...`);
        const wb = XLSX.readFile(filePath);
        const sheet = wb.Sheets['Geral'] || wb.Sheets[wb.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(sheet);

        let count = 0;
        data.forEach(row => {
            const nome = row['PRESTADOR/SOLICITANTE'];
            const empresa = row['EMPRESA/EVENTO'];
            if (nome) {
                const normName = normalize(nome);
                checkDataMap.set(normName, {
                    empresa: empresa || "",
                    validade: item.validity
                });
                count++;
            }
        });
        console.log(`      🔸 ${count} registros lidos.`);
    }

    // 2. Aplicar ao arquivo mestre
    console.log(`\n📖 Lendo arquivo mestre: ${path.basename(MASTER_FILE)}...`);
    const wbMaster = XLSX.readFile(MASTER_FILE);
    const sheetName = wbMaster.SheetNames[0];
    const sheetMaster = wbMaster.Sheets[sheetName];
    
    // Ler como matriz para manter cabeçalhos exatos
    const rows = XLSX.utils.sheet_to_json(sheetMaster, { header: 1 });
    const headers = rows[0];

    // Identificar colunas (usando índices baseados no dump anterior)
    // [ 'nome', 'RG', 'liberação DATA INICIAL', 'liberação DATA FINAL', 'MOTIVO', 'ÁREA/POSTO', 'EMPRESA ', 'checagem válida até' ]
    const idxNome = headers.indexOf('nome');
    const idxEmpresa = headers.indexOf('EMPRESA ');
    const idxValidade = headers.indexOf('checagem válida até');

    if (idxNome === -1 || idxEmpresa === -1 || idxValidade === -1) {
        console.error("❌ Colunas necessárias não identificadas no arquivo mestre.");
        console.log("Headers encontrados:", headers);
        return;
    }

    let updates = 0;
    for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        const nomeOriginal = row[idxNome];
        if (nomeOriginal) {
            const normName = normalize(nomeOriginal);
            const info = checkDataMap.get(normName);
            if (info) {
                row[idxEmpresa] = info.empresa;
                row[idxValidade] = info.validade;
                updates++;
            }
        }
    }

    // 3. Salvar o arquivo
    console.log(`\n📊 Resumo da Atualização:`);
    console.log(`   🔹 Total de registros atualizados no mestre: ${updates}`);

    const newSheet = XLSX.utils.aoa_to_sheet(rows);
    if (sheetMaster['!cols']) newSheet['!cols'] = sheetMaster['!cols'];
    wbMaster.Sheets[sheetName] = newSheet;
    
    try {
        XLSX.writeFile(wbMaster, MASTER_FILE);
        console.log(`\n✨ SUCESSO! Arquivo mestre atualizado e salvo.`);
    } catch (e) {
        if (e.code === 'EBUSY') {
            console.error("❌ ERRO: O arquivo está aberto no Excel. Por favor, feche-o e tente novamente.");
        } else {
            console.error("❌ Erro ao salvar:", e.message);
        }
    }
}

mergeMonthlyChecks().catch(e => console.error("❌ Erro fatal:", e));
