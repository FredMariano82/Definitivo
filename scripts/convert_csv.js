const fs = require('fs');
const Papa = require('papaparse');
const xlsx = require('xlsx');

const inputPath = 'C:\\Users\\central_seguranca\\Downloads\\Visitantes_202631_1947.csv';
const outputPath = 'C:\\Users\\central_seguranca\\Downloads\\Visitantes_202631_1947.xlsx';

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
        { wch: 15 }, // ID
        { wch: 40 }, // Visitante
        { wch: 20 }, // RG
        { wch: 20 }, // CPF
        { wch: 25 }, // Data de Expiração
    ];
    worksheet['!cols'] = maxWidths;

    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, 'Visitantes');

    xlsx.writeFile(workbook, outputPath);
    console.log('Success! Excel file generated at: ' + outputPath);
} catch (error) {
    console.error("Error generating Excel file:", error);
}
