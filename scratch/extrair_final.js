const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

const SYNC_LOG = 'c:\\Users\\fredm\\OneDrive\\Documentos\\GitHub\\Definitivo\\sync_full.log';
const OUTPUT_XLSX = 'c:\\Users\\fredm\\OneDrive\\Documentos\\GitHub\\Definitivo\\afetados_identificados_completo.xlsx';

function extrairTudo() {
    try {
        console.log("🚀 Lendo LOG MESTRE (sync_full.log) em UTF-16LE...");
        const content = fs.readFileSync(SYNC_LOG, 'utf16le');
        const lines = content.split('\n');
        
        console.log(`🔍 Analisando ${lines.length} linhas de histórico...`);
        
        const afetados = new Map();

        lines.forEach(line => {
            // Padrão 1: "Sucesso: Nome (Doc)"
            // Padrão 2: "Atualizado (Vigência/Campos): Nome (Doc)"
            // Padrão 3: "Sincronizando: Nome (Doc)"
            
            const match = line.match(/(?:Sucesso|Atualizado|Sincronizando).*?:\s+(.*?)\s+\((.*?)\)/i);
            
            if (match) {
                const nome = match[1].trim();
                const doc = match[2].trim();
                if (nome && doc && doc.length > 5) {
                    afetados.set(doc, { 
                        "Nome Completo": nome, 
                        "Documento (RG/CPF)": doc,
                        "Status no Log": line.includes("Sucesso") || line.includes("Atualizado") ? "CONCLUÍDO" : "TENTATIVA"
                    });
                }
            }
        });

        const listaFinal = Array.from(afetados.values());
        console.log(`✅ EXTRAÇÃO CONCLUÍDA: ${listaFinal.length} prestadores únicos identificados.`);

        if (listaFinal.length > 0) {
            const wb = XLSX.utils.book_new();
            const ws = XLSX.utils.json_to_sheet(listaFinal);
            
            ws['!cols'] = [
                { wch: 45 }, // Nome
                { wch: 20 }, // Documento
                { wch: 20 }  // Status
            ];

            XLSX.utils.book_append_sheet(wb, ws, "ListaCompleta");
            XLSX.writeFile(wb, OUTPUT_XLSX);
            console.log(`\n🎉 Arquivo gerado na RAIZ: ${OUTPUT_XLSX}`);
        } else {
            console.log("❌ NENHUM nome foi extraído. Verifique o formato do log.");
        }

    } catch (e) {
        console.error("❌ ERRO CRÍTICO:", e.message);
    }
}

extrairTudo();
