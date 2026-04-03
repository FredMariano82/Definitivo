const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

const SYNC_LOG = 'c:\\Users\\fredm\\OneDrive\\Documentos\\GitHub\\Definitivo\\sync_full.log';
const OUTPUT_XLSX = 'c:\\Users\\fredm\\OneDrive\\Documentos\\GitHub\\Definitivo\\afetados_identificados_completo_v2.xlsx';

function extrairTudo() {
    try {
        console.log("🚀 Lendo LOG MESTRE (sync_full.log) em UTF-16LE...");
        // Lendo com o encoding correto
        const content = fs.readFileSync(SYNC_LOG, 'utf16le');
        const lines = content.split('\n');
        
        console.log(`🔍 Escaneando ${lines.length} linhas de log...`);
        
        const afetados = new Map();

        lines.forEach(line => {
            // Tentar capturar Nomes e CPFs
            // O padrão costuma ser: Sincronizando: NOME (DOC)
            const match = line.match(/Sincronizando:\s+(.*?)\s+\((.*?)\)/i);
            if (match) {
                const nome = match[1].trim();
                const doc = match[2].trim();
                if (nome && doc) {
                   afetados.set(doc, { Nome: nome, Documento: doc, Status: "Detectado no Log" });
                }
            }
            
            // Outro padrão possível: [Data] NOME (DOC) - Sucesso
            const match2 = line.match(/\]\s+(.*?)\s+\((.*?)\)\s+-/i);
            if (match2) {
                const nome = match2[1].trim();
                const doc = match2[2].trim();
                if (nome && doc && doc.length > 3) {
                   afetados.set(doc, { Nome: nome, Documento: doc, Status: "Sincronizado" });
                }
            }
        });

        const listaFinal = Array.from(afetados.values());
        console.log(`✅ Extraídos ${listaFinal.length} prestadores únicos.`);

        if (listaFinal.length === 0) {
            console.log("⚠️ Nenhum padrão foi encontrado no log. Salvando as primeiras 10 linhas para debug:");
            console.log(lines.slice(0, 10).join("\n"));
            return;
        }

        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(listaFinal);
        XLSX.utils.book_append_sheet(wb, ws, "Resultado");
        XLSX.writeFile(wb, OUTPUT_XLSX);

        console.log(`\n🎉 Arquivo COMPLETO gerado: ${OUTPUT_XLSX}`);

    } catch (e) {
        console.error("❌ ERRO:", e.message);
    }
}

extrairTudo();
