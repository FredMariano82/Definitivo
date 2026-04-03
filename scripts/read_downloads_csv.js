const fs = require('fs');
const path = require('path');

const filePath = 'C:\\Users\\fredm\\Downloads\\Pessoas_202569_0842.csv';
const outputPath = path.join(__dirname, 'temp_csv_read.txt');

try {
    const content = fs.readFileSync(filePath, 'utf8');
    fs.writeFileSync(outputPath, content.substring(0, 5000)); // Pega só o começo pra analisar
    console.log('Sucesso ao ler o arquivo e salvar previa em temp_csv_read.txt');
} catch (err) {
    console.error('Erro ao ler o arquivo:', err.message);
}
