const xlsx = require('xlsx');
const path = require('path');
const fs = require('fs');

const dir = 'C:\\Users\\central_seguranca\\.gemini\\antigravity\\scratch\\recuperar';
const sourceFiles = [
    'Checagem Outubro  2025.xlsx',
    'Checagem Novembro  2025.xlsx',
    'Checagem Dezembro 2025.xlsx',
    'Checagem Janeiro  2026.xlsx',
    'Checagem Fevereiro 2026.xlsx',
    'Checagem Março 2026.xlsx'
];
const targetFile = path.join(dir, 'afetados_FINAL_REVISADO.xlsx');
const outputFile = path.join(dir, 'afetados_FINAL_COMPLETO_REVISADO.xlsx');

// Função para normalizar nomes (remover acentos, espaços extras e deixar em CAIXA ALTA)
function normalizeName(name) {
    if (!name) return '';
    return name.toString()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim()
        .toUpperCase()
        .replace(/\s+/g, ' ');
}

// Mapeamento de colunas de origem para destino
const COLUMN_MAP = {
    depto: ['DEPTO', 'DEPARTAMENTO', 'SETOR'],
    empresa: ['EMPRESA/EVENTO', 'EMPRESA', 'EVENTO']
};

async function processData() {
    const masterData = new Map();

    console.log('🚀 Iniciando varredura em todas as abas dos 6 arquivos...');

    for (const fileName of sourceFiles) {
        const filePath = path.join(dir, fileName);
        if (!fs.existsSync(filePath)) {
            console.warn(`⚠️ Arquivo não encontrado: ${fileName}`);
            continue;
        }

        console.log(`\n📂 Lendo arquiv: ${fileName}`);
        const workbook = xlsx.readFile(filePath);

        workbook.SheetNames.forEach(sheetName => {
            const worksheet = workbook.Sheets[sheetName];
            const data = xlsx.utils.sheet_to_json(worksheet);
            
            if (data.length === 0) return;

            // Identificar cabeçalhos reais (as vezes a primeira linha não é o header esperado)
            const firstRow = data[0];
            const keys = Object.keys(firstRow);

            const nomeKey = keys.find(k => k.toUpperCase().includes('NOME'));
            const deptoKey = keys.find(k => COLUMN_MAP.depto.includes(k.toUpperCase()));
            const empresaKey = keys.find(k => COLUMN_MAP.empresa.includes(k.toUpperCase()));

            if (nomeKey) {
                let countSub = 0;
                data.forEach(row => {
                    const originalNome = row[nomeKey];
                    const normNome = normalizeName(originalNome);

                    if (normNome) {
                        // Só salva se houver dados úteis
                        const depto = row[deptoKey] || '';
                        const empresa = row[empresaKey] || '';

                        if (depto || empresa) {
                            // Se já existir, podemos decidir se sobrescrevemos ou mantemos. 
                            // Vou manter o mais recente (Março > Outubro) ou só preencher se estiver vazio.
                            masterData.set(normNome, { depto, empresa });
                            countSub++;
                        }
                    }
                });
                console.log(`  📊 Aba [${sheetName}]: Mapeados ${countSub} nomes.`);
            }
        });
    }

    console.log(`\n✅ Varredura concluída. Total de nomes exclusivos na base: ${masterData.size}`);

    // --- PARTE 2: ATUALIZAR O ARQUIVO DE DESTINO ---
    console.log(`\n📝 Lendo arquivo de destino: afetados_FINAL_REVISADO.xlsx`);
    const wbTarget = xlsx.readFile(targetFile);
    const wsTarget = wbTarget.Sheets[wbTarget.SheetNames[0]];
    const dataTarget = xlsx.utils.sheet_to_json(wsTarget);

    let updatedCount = 0;
    const finalData = dataTarget.map(row => {
        // Encontrar a chave de nome no arquivo de destino
        const keys = Object.keys(row);
        const targetNomeKey = keys.find(k => k.toUpperCase().includes('NOME'));
        
        if (!targetNomeKey) return row;

        const normNome = normalizeName(row[targetNomeKey]);
        const matched = masterData.get(normNome);

        if (matched) {
            updatedCount++;
            return {
                ...row,
                'DEPARTAMENTO': matched.depto,
                'EMPRESA': matched.empresa
            };
        }
        return row;
    });

    console.log(`\n🎯 Resultado do Cruzamento:`);
    console.log(`   - Registros no destino: ${dataTarget.length}`);
    console.log(`   - Registros atualizados: ${updatedCount}`);

    // Criar e salvar novo arquivo
    const newWs = xlsx.utils.json_to_sheet(finalData);
    const newWb = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(newWb, newWs, 'Afetados_Final');
    xlsx.writeFile(newWb, outputFile);

    console.log(`\n✨ Missão cumprida! Arquivo salvo em: ${outputFile}`);
}

processData().catch(err => {
    console.error('💥 ERRO FATAL:', err);
});
