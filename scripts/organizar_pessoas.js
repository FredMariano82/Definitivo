const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');
const Papa = require('papaparse');

const inputPath = 'C:\\Users\\fredm\\Downloads\\Pessoas_202569_0842.csv';
const outputPath = 'C:\\Users\\fredm\\Downloads\\Pessoas_Organizado_Final.xlsx';

console.log('🚀 Iniciando conversão de CSV para Excel...');
console.log(`📂 Arquivo de entrada: ${inputPath}`);

try {
    // 1. Ler o arquivo com codificação Latin-1 (para corrigir acentos)
    const rawContent = fs.readFileSync(inputPath, 'binary');
    // Converter de latin1 para utf8 (buffer para string)
    const decodedContent = Buffer.from(rawContent, 'binary').toString('latin1');

    console.log('✅ Arquivo lido e codificação corrigida (Latin-1/ISO-8859-1).');

    // 2. Parsear CSV com PapaParse
    const results = Papa.parse(decodedContent, {
        header: true,
        skipEmptyLines: true,
        delimiter: ","
    });

    if (results.errors.length > 0) {
        console.warn('⚠️ Avisos durante o parse do CSV:', results.errors);
    }

    const data = results.data;
    console.log(`📊 Total de registros encontrados: ${data.length}`);

    // 3. Criar Workbook do Excel
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Pessoas');

    // Ajustar largura das colunas (opcional, mas melhora o visual)
    const colWidths = Object.keys(data[0] || {}).map(key => ({ wch: Math.max(key.length, 15) }));
    worksheet['!cols'] = colWidths;

    // 4. Salvar o arquivo
    XLSX.writeFile(workbook, outputPath);

    console.log(`\n✨ SUCESSO! Arquivo organizado gerado em:`);
    console.log(`👉 ${outputPath}`);

} catch (err) {
    console.error('❌ ERRO CRÍTICO:', err.message);
    process.exit(1);
}
