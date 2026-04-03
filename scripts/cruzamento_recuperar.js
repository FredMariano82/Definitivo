const xlsx = require('xlsx');
const path = require('path');
const fs = require('fs');

const sourceDir = 'C:\\Users\\central_seguranca\\.gemini\\antigravity\\scratch\\recuperar';
const sourceFile = path.join(sourceDir, 'TODOS.xlsx');
const targetFile = path.join(sourceDir, 'afetados_FINAL_REVISADO.xlsx');
const outputFile = path.join(sourceDir, 'afetados_FINAL_REVISADO_ATUALIZADO.xlsx');

async function processExcel() {
    console.log('🚀 Iniciando cruzamento de dados...');

    // Ler arquivo fonte (TODOS)
    const wbTodos = xlsx.readFile(sourceFile);
    const wsTodos = wbTodos.Sheets[wbTodos.SheetNames[0]];
    const dataTodos = xlsx.utils.sheet_to_json(wsTodos);

    console.log(`✅ Arquivo TODOS carregado: ${dataTodos.length} registros`);

    // Criar mapa de NOME -> { EMPRESA, DEPARTAMENTO }
    const mapa = new Map();
    dataTodos.forEach(row => {
        const nome = (row['NOME'] || '').toString().trim().toUpperCase();
        if (nome) {
            mapa.set(nome, {
                empresa: row['EMPRESA'] || '',
                departamento: row['DEPARTAMENTO'] || ''
            });
        }
    });

    // Ler arquivo destino (afetados)
    const wbAfetados = xlsx.readFile(targetFile);
    const wsAfetados = wbAfetados.Sheets[wbAfetados.SheetNames[0]];
    const dataAfetados = xlsx.utils.sheet_to_json(wsAfetados);

    console.log(`✅ Arquivo afetados_FINAL_REVISADO carregado: ${dataAfetados.length} registros`);

    let matches = 0;
    // Atualizar os registros
    const dataAtualizada = dataAfetados.map(row => {
        const nome = (row['NOME'] || '').toString().trim().toUpperCase();
        const info = mapa.get(nome);
        
        if (info) {
            matches++;
            return {
                ...row,
                'EMPRESA': info.empresa,
                'DEPARTAMENTO': info.departamento
            };
        }
        return row;
    });

    console.log(`📊 Total de matches encontrados: ${matches}`);

    // Salvar novo arquivo
    const newWs = xlsx.utils.json_to_sheet(dataAtualizada);
    const newWb = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(newWb, newWs, 'Afetados Atualizados');
    xlsx.writeFile(newWb, outputFile);

    console.log(`✨ Arquivo salvo com sucesso em: ${outputFile}`);
}

processExcel().catch(err => {
    console.error('💥 Erro no processamento:', err);
});
