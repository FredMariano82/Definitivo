const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

const HISTORY_FILE = 'c:\\Users\\fredm\\OneDrive\\Documentos\\GitHub\\Definitivo\\robo4_history.json';
const OUTPUT_FILE_XLSX = 'c:\\Users\\fredm\\OneDrive\\Documentos\\GitHub\\Definitivo\\scratch\\afetados_identificados.xlsx';

function gerarExcel() {
    try {
        console.log("🚀 Lendo histórico de logs locais...");
        const rawData = fs.readFileSync(HISTORY_FILE, 'utf-8');
        const logs = JSON.parse(rawData);

        console.log(`✅ Processando ${logs.length} registros para Excel...`);

        // Preparar dados para o XLSX
        const data = logs.map(log => ({
            "Data/Hora": log.timestamp || "",
            "Nome": log.nome || "",
            "Documento": log.doc || "",
            "ID_ID_Control": log.id_control || "N/A",
            "Resultado": log.mensagem || ""
        }));

        // Criar Workbook e Worksheet
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(data);

        // Ajustar larguras das colunas
        ws['!cols'] = [
            { wch: 25 }, // Data/Hora
            { wch: 40 }, // Nome
            { wch: 15 }, // Documento
            { wch: 15 }, // ID_Control
            { wch: 50 }, // Resultado
        ];

        XLSX.utils.book_append_sheet(wb, ws, "Afetados_Robo4");

        // Escrever arquivo
        XLSX.writeFile(wb, OUTPUT_FILE_XLSX);

        console.log(`\n🎉 Relatório EXCEL gerado com sucesso em:`);
        console.log(`👉 ${OUTPUT_FILE_XLSX}`);

    } catch (e) {
        console.error("❌ ERRO ao gerar Excel:", e.message);
    }
}

gerarExcel();
