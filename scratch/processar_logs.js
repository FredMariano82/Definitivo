const fs = require('fs');
const path = require('path');

const HISTORY_FILE = 'c:\\Users\\fredm\\OneDrive\\Documentos\\GitHub\\Definitivo\\robo4_history.json';
const OUTPUT_FILE = 'c:\\Users\\fredm\\OneDrive\\Documentos\\GitHub\\Definitivo\\scratch\\afetados_identificados.csv';

function gerarRelatorio() {
    try {
        console.log("🚀 Lendo histórico de logs locais...");
        const rawData = fs.readFileSync(HISTORY_FILE, 'utf-8');
        const logs = JSON.parse(rawData);

        console.log(`✅ Processando ${logs.length} registros de log...`);

        // Cabeçalho do CSV
        const header = "Data/Hora;Nome;Documento;ID_ID_Control;Resultado\n";
        
        const lines = logs.map(log => {
            const dataHora = log.timestamp || "";
            const nome = log.nome || "";
            const doc = log.doc || "";
            const idControl = log.id_control || "N/A";
            const msg = log.mensagem || "";
            
            return `"${dataHora}";"${nome}";"${doc}";"${idControl}";"${msg}"`;
        });

        fs.writeFileSync(OUTPUT_FILE, header + lines.join("\n"), 'utf-8');

        console.log(`\n🎉 Relatório gerado com sucesso em:`);
        console.log(`👉 ${OUTPUT_FILE}`);
        console.log(`\nEste arquivo contém todos os nomes que o Robô 4 processou recentemente.`);

    } catch (e) {
        console.error("❌ ERRO ao gerar relatório:", e.message);
    }
}

gerarRelatorio();
