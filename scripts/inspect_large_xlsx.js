const XLSX = require('xlsx');

const filePath = 'C:\\Users\\central_seguranca\\Downloads\\Pessoas_2026315_1839.xlsx';

try {
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

    console.log('Total de linhas:', data.length);
    console.log('Headers:', JSON.stringify(data[0]));

    // Procurar por nomes com acento
    let count = 0;
    for (let i = 1; i < data.length; i++) {
        const nome = String(data[i][0] || '');
        if (nome.includes('é') || nome.includes('á') || nome.includes('í') || nome.includes('ó') || nome.includes('ú') || nome.includes('ç')) {
            console.log(`L${i}: ${nome}`);
            count++;
        }
        if (count >= 10) break;
    }
} catch (error) {
    console.error('Erro:', error);
}
