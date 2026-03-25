const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

const SYNC_LOG = 'c:\\Users\\fredm\\OneDrive\\Documentos\\GitHub\\Definitivo\\sync_full.log';
const OUTPUT_XLSX = 'c:\\Users\\fredm\\OneDrive\\Documentos\\GitHub\\Definitivo\\afetados_identificados_completo.xlsx';

function extrairTudo() {
    try {
        console.log("🚀 Lendo LOG MESTRE (sync_full.log)...");
        const content = fs.readFileSync(SYNC_LOG, 'utf-8');
        const lines = content.split('\n');
        
        const afetados = new Map(); // Usar Map para evitar duplicidade pelo Documento

        console.log(`🔍 Escaneando ${lines.length} linhas de log...`);

        // Regex para capturar padrões comuns nos logs do Robô 4
        // Exemplo: [2026-03-24...] Sincronizando: NOME (DOC)
        // Exemplo: ✅ Sucesso: NOME atualizado
        
        lines.forEach(line => {
            // Padrão 1: "Sincronizando: Nome (CPF/RG)"
            const matchSinc = line.match(/Sincronizando:\s+(.*?)\s+\((.*?)\)/i);
            if (matchSinc) {
                const nome = matchSinc[1].trim();
                const doc = matchSinc[2].trim();
                if (!afetados.has(doc)) {
                    afetados.set(doc, { Nome: nome, Documento: doc, Status: "Sincronizado/Tentativa" });
                }
            }

            // Padrão 2: Sucesso/Atualizado
            if (line.includes("sucesso") || line.includes("Atualizado")) {
                const matchNome = line.match(/(?:sucesso|Atualizado).*?:\s+(.*)/i);
                // Este padrão depende muito de como o log foi escrito, mas vamos tentar pegar o que der.
            }
        });

        const listaFinal = Array.from(afetados.values());
        console.log(`✅ Extraídos ${listaFinal.length} prestadores únicos.`);

        // Gerar Excel
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(listaFinal);
        ws['!cols'] = [{ wch: 40 }, { wch: 20 }, { wch: 30 }];
        XLSX.utils.book_append_sheet(wb, ws, "Relatorio_Completo");
        XLSX.writeFile(wb, OUTPUT_XLSX);

        console.log(`\n🎉 Arquivo COMPLETO gerado: ${OUTPUT_XLSX}`);

    } catch (e) {
        console.error("❌ ERRO:", e.message);
    }
}

extrairTudo();
