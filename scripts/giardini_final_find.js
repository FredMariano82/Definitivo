const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

const files = [
    'C:\\Users\\central_seguranca\\Desktop\\arquivos checagem\\Checagem Janeiro  2026.xlsx',
    'C:\\Users\\central_seguranca\\Desktop\\arquivos checagem\\Checagem Fevereiro 2026.xlsx',
    'C:\\Users\\central_seguranca\\Desktop\\arquivos checagem\\Checagem Março 2026.xlsx'
];

const target = 'GIARDINI';
let output = '';

files.forEach(filePath => {
    output += `\nFILE: ${path.basename(filePath)}\n`;
    try {
        const workbook = XLSX.readFile(filePath);
        workbook.SheetNames.forEach(sheetName => {
            const worksheet = workbook.Sheets[sheetName];
            const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
            data.forEach((row, rowIndex) => {
                if (!row || !Array.isArray(row)) return;
                row.forEach((cell, cellIndex) => {
                    if (cell && String(cell).toUpperCase().includes(target)) {
                        output += `  MATCH in Sheet "${sheetName}", Row ${rowIndex}, Cell ${cellIndex}: ${cell}\n`;
                        output += `    Full Row: ${JSON.stringify(row)}\n`;
                    }
                });
            });
        });
    } catch (error) {
        output += `  Error: ${error.message}\n`;
    }
});

fs.writeFileSync('giardini_final_find.txt', output);
console.log('Search complete. Results in giardini_final_find.txt');
