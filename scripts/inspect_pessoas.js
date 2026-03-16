const XLSX = require('xlsx');
const path = require('path');

const filePath = 'C:\\Users\\central_seguranca\\Documents\\Mariano\\todo o resto de Projetos\\Pessoas_202631_2025.xlsx';

try {
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

    console.log('--- DETALHES DAS COLUNAS ---');
    if (data.length > 0) {
        const headers = data[0];
        console.log('Headers:', JSON.stringify(headers));
        
        console.log('\n--- AMOSTRA DE DADOS (LINHAS 1-10) ---');
        for (let i = 1; i < Math.min(data.length, 11); i++) {
            const row = data[i];
            console.log(`Linha ${i}: nome=${JSON.stringify(row[0])}, data_final=${JSON.stringify(row[3])} (Tipo: ${typeof row[3]})`);
        }
    }
} catch (error) {
    console.error('Erro ao ler o arquivo:', error);
}
