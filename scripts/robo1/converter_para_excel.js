const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const CSV_FILE = "C:\\Users\\central_seguranca\\Documents\\Mariano\\todo o resto de Projetos\\Relacao_ID_CONTROL_Completa.csv";
const XLSX_FILE = "C:\\Users\\central_seguranca\\Documents\\Mariano\\todo o resto de Projetos\\Relacao_ID_CONTROL_Completa.xlsx";

async function convertToExcel() {
    console.log("🚀 Iniciando conversão para Excel...");

    if (!fs.existsSync(CSV_FILE)) {
        console.error("❌ Arquivo CSV não encontrado:", CSV_FILE);
        return;
    }

    // 1. Ler o CSV
    const csvContent = fs.readFileSync(CSV_FILE, 'utf8');
    
    // 2. Criar o Workbook a partir do CSV
    // Usamos o XLSX.read com type: string e definindo o separador se necessário
    const workbook = XLSX.read(csvContent, { type: 'string' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];

    // 3. Ajustar larguras das colunas
    // Estimativa baseada no conteúdo ou valores fixos generosos
    const wscols = [
        { wch: 40 }, // Nome
        { wch: 20 }, // RG/Documento
        { wch: 20 }, // CPF
        { wch: 15 }, // Matricula
        { wch: 10 }  // Status
    ];
    sheet['!cols'] = wscols;

    // 4. Salvar o arquivo XLSX
    XLSX.writeFile(workbook, XLSX_FILE);

    console.log(`\n✨ CONVERSÃO CONCLUÍDA! ✨`);
    console.log(`📂 Arquivo Excel salvo em: ${XLSX_FILE}`);
}

convertToExcel().catch(e => console.error("❌ Erro fatal na conversão:", e));
