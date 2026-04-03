const fs = require('fs');
const Papa = require('papaparse');
const xlsx = require('xlsx');

const inputPath = 'C:\\Users\\central_seguranca\\Downloads\\Pessoas_202631_2025.csv';
const outputPath = 'C:\\Users\\central_seguranca\\Downloads\\Pessoas_202631_2025.xlsx';

try {
    const fileContent = fs.readFileSync(inputPath, 'utf8');
    // Auto-detect delimiter and parse
    const parsed = Papa.parse(fileContent, { header: true, skipEmptyLines: true });

    if (parsed.errors.length) {
        console.warn("Parse warnings:", parsed.errors);
    }

    // Set column widths for better "arrumando" formatting
    const worksheet = xlsx.utils.json_to_sheet(parsed.data);
    const maxWidths = [
        { wch: 10 }, // ID
        { wch: 15 }, // Matrícula
        { wch: 40 }, // Usuário
        { wch: 20 }, // CPF
        { wch: 15 }, // Celular
        { wch: 20 }, // Genero
    ];
    worksheet['!cols'] = maxWidths;

    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, 'Pessoas');

    xlsx.writeFile(workbook, outputPath);
    console.log('Success! Excel file generated at: ' + outputPath);
} catch (error) {
    console.error("Error generating Excel file:", error);
}
