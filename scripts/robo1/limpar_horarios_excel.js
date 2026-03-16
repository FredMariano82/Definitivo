const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const DIR = "C:\\Users\\central_seguranca\\Documents\\Mariano\\todo o resto de Projetos";
const TARGET_FILE = path.join(DIR, "Pessoas_202631_2025.xlsx");

async function cleanDates() {
    console.log("🚀 Iniciando limpeza de horários nas datas...");

    if (!fs.existsSync(TARGET_FILE)) {
        console.error("❌ Arquivo não encontrado.");
        return;
    }

    const wb = XLSX.readFile(TARGET_FILE);
    const sheetName = wb.SheetNames[0];
    const sheet = wb.Sheets[sheetName];
    
    // Converter para array de arrays para manipulação fácil
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    
    let count = 0;

    // Cabeçalho está na linha 0
    // Colunas prováveis: A: Nome, B: RG, C: ?, D: DATA FINAL
    for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        if (!row) continue;

        // Itera por todas as células da linha procurando por padrões de data com hora
        for (let j = 0; j < row.length; j++) {
            let cellValue = row[j];
            if (cellValue && typeof cellValue === 'string') {
                // Tenta identificar se tem algo como "DD/MM/YYYY HH:mm:ss" ou similar
                // Formatos comuns: "DD/MM/YYYY HH:mm:ss" ou "YYYY-MM-DD HH:mm:ss"
                const dateParts = cellValue.split(' ');
                if (dateParts.length > 1) {
                    // Se a primeira parte parece uma data (contém / ou -)
                    if (dateParts[0].includes('/') || dateParts[0].includes('-')) {
                        row[j] = dateParts[0]; // Mantém apenas a parte da data
                        count++;
                    }
                }
            } else if (cellValue instanceof Date) {
                // Se for um objeto Date do Excel, formatamos manualmente para string DD/MM/YYYY
                const d = cellValue;
                const dateStr = [
                    String(d.getDate()).padStart(2, '0'),
                    String(d.getMonth() + 1).padStart(2, '0'),
                    d.getFullYear()
                ].join('/');
                row[j] = dateStr;
                count++;
            }
        }
    }

    console.log(`\n📊 Resultado:`);
    console.log(`   🔸 Total de células de data ajustadas: ${count}`);
    
    const newSheet = XLSX.utils.aoa_to_sheet(rows);
    
    // Preservar larguras de colunas
    if (sheet['!cols']) newSheet['!cols'] = sheet['!cols'];
    
    wb.Sheets[sheetName] = newSheet;
    XLSX.writeFile(wb, TARGET_FILE);

    console.log(`\n✨ SUCESSO! Arquivo limpo: ${TARGET_FILE}`);
}

cleanDates().catch(e => {
    if (e.code === 'EBUSY') {
        console.error("❌ ERRO: O arquivo está aberto no Excel. Por favor, feche-o e tente novamente.");
    } else {
        console.error("❌ Erro fatal:", e);
    }
});
