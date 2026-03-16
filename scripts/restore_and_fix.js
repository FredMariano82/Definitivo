const fs = require('fs');
const XLSX = require('xlsx');

const csvPath = 'C:\\Users\\central_seguranca\\Downloads\\Pessoas_202631_2025.csv';
const xlsxTargetPath = 'C:\\Users\\central_seguranca\\Documents\\Mariano\\todo o resto de Projetos\\Pessoas_202631_2025.xlsx';

const targetDate = new Date(2026, 2, 15); // 15/03/2026

function toTitleCase(str) {
    if (!str || typeof str !== 'string') return str;
    const particles = ['de', 'da', 'do', 'das', 'dos', 'e'];
    return str.toLowerCase().split(' ').map((word, index) => {
        if (word.length === 0) return word;
        if (index > 0 && particles.includes(word)) return word;
        return word.charAt(0).toUpperCase() + word.slice(1);
    }).join(' ');
}

function parseDate(dateStr) {
    if (!dateStr || typeof dateStr !== 'string') return null;
    const parts = dateStr.trim().split('/');
    if (parts.length !== 3) return null;
    return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
}

// Custom CSV parser to handle quotes and multiple columns safely
function parseCSVLine(line) {
    const result = [];
    let cur = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            result.push(cur);
            cur = '';
        } else {
            cur += char;
        }
    }
    result.push(cur);
    return result;
}

(async () => {
    try {
        console.log('Restaurando dados do CSV (Latin1)...');
        const buffer = fs.readFileSync(csvPath);
        const text = buffer.toString('latin1');
        const lines = text.split('\r\n'); // CSV uses CRLF often

        if (lines.length <= 1) {
            console.log('CSV vazio ou mal formatado.');
            return;
        }

        const xlsxData = [["nome", "CPF", "liberação DATA INICIAL", "liberação DATA FINAL"]];
        
        let kept = 0;
        let removed = 0;

        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;

            const cols = parseCSVLine(line);
            if (cols.length < 26) continue;

            const nomeOriginal = cols[2]; // Usuário
            const cpf = cols[3]; // CPF
            const dataInicial = cols[24]; // Início da Liberação
            const dataFinalStr = cols[25]; // Data de Expiração

            const dataFinal = parseDate(dataFinalStr);

            if (dataFinal && dataFinal >= targetDate) {
                xlsxData.push([
                    toTitleCase(nomeOriginal),
                    cpf.replace(/"/g, ''), // Remove quotes if any
                    dataInicial,
                    dataFinalStr
                ]);
                kept++;
            } else {
                removed++;
            }
        }

        console.log(`Filtro concluído: ${kept} mantidos, ${removed} removidos.`);

        const newWorksheet = XLSX.utils.aoa_to_sheet(xlsxData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, newWorksheet, "Sheet1");
        XLSX.writeFile(workbook, xlsxTargetPath);

        console.log(`Arquivo XLSX restaurado e corrigido em: ${xlsxTargetPath}`);

    } catch (e) {
        console.error('Erro fatal:', e);
    }
})();
