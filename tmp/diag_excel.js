const xlsx = require('xlsx');
const path = require('path');

const filePath = 'C:/Users/fredm/.gemini/antigravity/scratch/Teste_Excel.xlsx';

try {
    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(sheet, { header: 1 });

    console.log("==================================================");
    console.log("🔍 DIAGNÓSTICO DO ARQUIVO EXCEL");
    console.log("==================================================");

    if (data.length > 0 && data[0].length > 0) {
        const rawContent = data[0][0];
        console.log("CONTEÚDO DA CÉLULA [A1]:");
        console.log("-----------------------------------------");
        console.log(rawContent);
        console.log("-----------------------------------------");
        console.log(`Tamanho: ${rawContent.length} caracteres.`);
    } else {
        console.log("🟡 O arquivo parece estar vazio ou sem dados na célula A1.");
        console.log("Estrutura lida:", JSON.stringify(data, null, 2));
    }
} catch (error) {
    console.error("❌ ERRO ao ler o arquivo:", error.message);
}
