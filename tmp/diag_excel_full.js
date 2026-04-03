const xlsx = require('xlsx');
const path = require('path');

const filePath = 'C:/Users/fredm/.gemini/antigravity/scratch/Teste_Excel.xlsx';

try {
    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    console.log("==================================================");
    console.log("🔍 VARREDURA COMPLETA: " + sheetName);
    console.log("==================================================");

    const range = xlsx.utils.decode_range(sheet['!ref']);
    let hasData = false;

    for (let R = range.s.r; R <= range.e.r; ++R) {
        for (let C = range.s.c; C <= range.e.c; ++C) {
            const cellAddress = xlsx.utils.encode_cell({ r: R, c: C });
            const cell = sheet[cellAddress];
            if (cell && cell.v !== undefined) {
                console.log(`[${cellAddress}]: ${cell.v}`);
                hasData = true;
            }
        }
    }

    if (!hasData) {
        console.log("🟡 Nenhuma célula com valor encontrada.");
    }
} catch (error) {
    console.error("❌ ERRO ao ler o arquivo:", error.message);
}
