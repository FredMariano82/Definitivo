const XLSX = require('xlsx');
const path = require('path');

const filePath = 'C:\\Users\\central_seguranca\\Documents\\Mariano\\todo o resto de Projetos\\Pessoas_202631_2025.xlsx';

function toTitleCase(str) {
    if (!str || typeof str !== 'string') return str;
    const particles = ['de', 'da', 'do', 'das', 'dos', 'e'];
    return str.toLowerCase().split(' ').map((word, index) => {
        if (word.length === 0) return word;
        if (index > 0 && particles.includes(word)) return word;
        return word.charAt(0).toUpperCase() + word.slice(1);
    }).join(' ');
}

function removeAccents(str) {
    if (typeof str !== 'string') return str;
    // Normalize and remove accents
    let result = str.normalize('NFD')
              .replace(/[\u0300-\u036f]/g, "")
              .replace(/\uFFFD/g, " "); // Replace unknown with space
    
    // Apply Title Case
    return toTitleCase(result);
}

function parseDate(dateStr) {
    if (!dateStr || typeof dateStr !== 'string') return null;
    const parts = dateStr.split('/');
    if (parts.length !== 3) return null;
    // parts[0] = day, parts[1] = month, parts[2] = year
    return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
}

const targetDate = new Date(2026, 2, 15); // 15/03/2026 (Month is 0-indexed)

(async () => {
    try {
        console.log('Lendo arquivo:', filePath);
        const workbook = XLSX.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        if (data.length === 0) {
            console.log('Arquivo vazio.');
            return;
        }

        const headers = data[0];
        const filteredData = [headers];

        let processedCount = 0;
        let filteredOutCount = 0;

        for (let i = 1; i < data.length; i++) {
            const row = data[i];
            const nome = row[0];
            const dataFinalStr = row[3];

            // 1. Ajeitar nomes (remover acentos)
            if (nome) {
                row[0] = removeAccents(nome);
            }

            // 2. Analisar coluna D (DATA FINAL)
            const dataFinal = parseDate(dataFinalStr);

            if (dataFinal && dataFinal >= targetDate) {
                filteredData.push(row);
                processedCount++;
            } else {
                filteredOutCount++;
            }
        }

        console.log(`Processamento concluído:`);
        console.log(`- Total original: ${data.length - 1}`);
        console.log(`- Mantidos (>= 15/03/2026): ${processedCount}`);
        console.log(`- Removidos: ${filteredOutCount}`);

        if (processedCount === 0 && data.length > 1) {
            console.log('AVISO: Nenhuma linha sobrou após o filtro. Verifique se o formato da data está correto.');
        }

        // Salvar alterações
        const newWorksheet = XLSX.utils.aoa_to_sheet(filteredData);
        workbook.Sheets[sheetName] = newWorksheet;
        XLSX.writeFile(workbook, filePath);

        console.log(`Arquivo salvo com sucesso em: ${filePath}`);

    } catch (error) {
        console.error('Erro ao processar o arquivo:', error);
    }
})();
