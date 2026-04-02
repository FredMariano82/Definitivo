const xlsx = require('xlsx');
const path = require('path');

const filePath = 'C:/Users/fredm/.gemini/antigravity/scratch/Teste_Excel.xlsx';

try {
    const workbook = xlsx.readFile(filePath);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rawRows = xlsx.utils.sheet_to_json(sheet, { header: 1 });
    
    // Transformar cada linha: 'Nome, Doc, Grupo' -> [Nome, Doc, Grupo]
    const columnData = rawRows.map(row => {
        if (!row || !row[0]) return ["", "", ""];
        const parts = String(row[0]).split(',').map(p => p.trim());
        return [parts[0] || "", parts[1] || "", parts[2] || ""];
    });

    const newSheet = xlsx.utils.aoa_to_sheet(columnData);
    const newWorkbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(newWorkbook, newSheet, "Sheet1");
    
    xlsx.writeFile(newWorkbook, filePath);
    console.log("✅ Planilha organizada em 3 colunas com sucesso!");
} catch (e) {
    console.error("Erro:", e.message);
}
