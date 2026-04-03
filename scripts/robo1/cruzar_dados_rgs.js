const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const DIR = "C:\\Users\\central_seguranca\\Documents\\Mariano\\todo o resto de Projetos";
const SOURCE_FILE = path.join(DIR, "Relacao_ID_CONTROL_Completa.xlsx");
const TARGET_FILE = path.join(DIR, "Pessoas_202631_2025.xlsx");

function normalize(str) {
    if (!str) return "";
    return String(str)
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]/g, "") // Remove tudo que não for letra ou número para match agressivo
        .trim();
}

async function mergeRGs() {
    console.log("🚀 Iniciando cruzamento de RGs...");

    if (!fs.existsSync(SOURCE_FILE) || !fs.existsSync(TARGET_FILE)) {
        console.error("❌ Arquivos necessários não encontrados.");
        return;
    }

    // 1. Carregar ID CONTROL e criar mapa
    console.log("📡 Lendo base de RGs do ID CONTROL...");
    const wbSource = XLSX.readFile(SOURCE_FILE);
    const sheetSource = wbSource.Sheets[wbSource.SheetNames[0]];
    const dataSource = XLSX.utils.sheet_to_json(sheetSource);
    
    const rgMap = new Map();
    dataSource.forEach(row => {
        // Assume colunas: Nome, RG/Documento
        const nome = row['Nome'];
        const rg = row['RG/Documento'];
        if (nome && rg) {
            rgMap.set(normalize(nome), rg);
        }
    });
    console.log(`   🔸 Mapa criado com ${rgMap.size} registros.`);

    // 2. Carregar arquivo alvo
    console.log("📖 Lendo arquivo principal de Pessoas...");
    const wbTarget = XLSX.readFile(TARGET_FILE);
    const sheetName = wbTarget.SheetNames[0];
    const sheetTarget = wbTarget.Sheets[sheetName];
    
    // Vamos converter para matriz para manter a estrutura exata (incluindo cabeçalhos)
    const rows = XLSX.utils.sheet_to_json(sheetTarget, { header: 1 });
    
    let matches = 0;
    let total = 0;

    // Pula o cabeçalho se existir (linha 0)
    for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        if (!row || row.length === 0) continue;

        const nomeOriginal = row[0]; // Coluna A
        if (nomeOriginal) {
            total++;
            const nomeNorm = normalize(nomeOriginal);
            const rgEncontrado = rgMap.get(nomeNorm);

            if (rgEncontrado) {
                // Atualiza a Coluna B (RG)
                row[1] = rgEncontrado;
                matches++;
            }
        }
    }

    // 3. Salvar de volta
    console.log(`\n📊 Resultado do Cruzamento:`);
    console.log(`   🔹 Total de pessoas no arquivo: ${total}`);
    console.log(`   🔹 RGs localizados e preenchidos: ${matches}`);
    
    const newSheet = XLSX.utils.aoa_to_sheet(rows);
    
    // Copiar larguras de colunas se existirem
    if (sheetTarget['!cols']) newSheet['!cols'] = sheetTarget['!cols'];
    
    wbTarget.Sheets[sheetName] = newSheet;
    XLSX.writeFile(wbTarget, TARGET_FILE);

    console.log(`\n✨ SUCESSO! Arquivo atualizado: ${TARGET_FILE}`);
}

mergeRGs().catch(e => console.error("❌ Erro fatal:", e));
