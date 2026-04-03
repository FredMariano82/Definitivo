import fs from 'fs';
import * as xlsx from 'xlsx';

function convertCsvToExcel() {
    const csvFilePath = 'C:\\Users\\fredm\\Downloads\\Pessoas_202569_0842.csv';
    const excelFilePath = 'C:\\Users\\fredm\\Downloads\\Pessoas_Organizadas.xlsx';

    try {
        console.log(`Lendo o arquivo CSV de: ${csvFilePath}`);

        // Ler o arquivo considerando a vírgula como delimitador (formato visto no Get-Content)
        // Ler o texto primeiro para inspecionar/limpar se necessitar
        const csvText = fs.readFileSync(csvFilePath, 'utf8');

        // Criar workbook e worksheet do CSV lido
        const workbook = xlsx.read(csvText, { type: 'string', raw: true });

        console.log(`Gerando arquivo Excel em: ${excelFilePath}`);
        xlsx.writeFile(workbook, excelFilePath);

        console.log('Conversão concluída com sucesso!');
    } catch (error) {
        console.error('Erro ao converter o arquivo:', error);
    }
}

convertCsvToExcel();
