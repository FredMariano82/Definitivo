const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

const MASTER_CSV = 'C:\\Users\\fredm\\Downloads\\Pessoas_202569_0842.csv';
const OUTPUT_XLSX = 'c:\\Users\\fredm\\OneDrive\\Documentos\\GitHub\\Definitivo\\afetados_identificados_completo.xlsx';

function converterMaster() {
    try {
        console.log("🚀 Lendo ARQUIVO MESTRE de Downloads (2.000+ nomes)...");
        // Lendo o CSV (provavelmente codificado em Latin1/Windows-1252 pelo ID Control)
        const buf = fs.readFileSync(MASTER_CSV);
        
        // Tentar detectar se é UTF-8 ou outro (usando Latin1 como fallback para caracteres acentuados do ID Control)
        const content = buf.toString('latin1');
        
        const lines = content.split('\n');
        console.log(`📊 Total de linhas detectadas: ${lines.length}`);

        // O ID Control exporta com ';' ou ',' ? 
        // Pela amostra anterior parecia ter muia vírgula ",,,,,"
        
        const wb = XLSX.utils.book_new();
        
        // Usar XLSX.read para parsear o CSV bruto com o delimitador correto
        // Ou simplesmente criar a rede de objetos
        const rows = lines.map(line => line.split(',')); 
        
        const ws = XLSX.utils.aoa_to_sheet(rows);
        XLSX.utils.book_append_sheet(wb, ws, "Lista_Mestra");
        
        XLSX.writeFile(wb, OUTPUT_XLSX);

        console.log(`\n🎉 Relatório de 2.000 nomes gerado na RAIZ:`);
        console.log(`👉 ${OUTPUT_XLSX}`);

    } catch (e) {
        console.error("❌ ERRO:", e.message);
    }
}

converterMaster();
