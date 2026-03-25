const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });
const { createClient } = require('@supabase/supabase-js');

// Configuração Supabase (Extraída de scripts/final_cleanup.js)
const supabaseUrl = "https://fghskpxtqdfqomozfckk.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZnaHNrcHh0cWRmcW9tb3pmY2trIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczODAxNzM4NywiZXhwIjoyMDUzNTkzMzg3fQ.Zue8NlG78l2k6N-kQo7h2E83A8V7_W9yM_e-vL_r0_A";

const supabase = createClient(supabaseUrl, supabaseKey);

async function extrairAfetados() {
    console.log("🚀 Iniciando extração de prestadores integrados pelo Robô 4...");
    
    // Buscar prestadores com id_control_id preenchido
    const { data, error } = await supabase
        .from('prestadores')
        .select('nome, doc1, doc2, id_control_id, data_integracao')
        .not('id_control_id', 'is', null);

    if (error) {
        console.error("❌ ERRO ao buscar dados:", error.message);
        return;
    }

    if (!data || data.length === 0) {
        console.log("ℹ️ Nenhum prestador encontrado com id_control_id preenchido.");
        return;
    }

    console.log(`✅ Encontrados ${data.length} prestadores integrados.`);

    // Gerar CSV
    const header = "Nome;RG;CPF;ID_Control;Data_Integracao\n";
    const content = data.map(p => {
        return `"${p.nome}";"${p.doc1 || ''}";"${p.doc2 || ''}";"${p.id_control_id}";"${p.data_integracao || ''}"`;
    }).join("\n");

    const outputPath = path.resolve(__dirname, 'prestadores_afetados_robo4.csv');
    fs.writeFileSync(outputPath, header + content, 'utf-8');

    console.log(`\n🎉 Relatório gerado com sucesso em:`);
    console.log(`👉 ${outputPath}`);
    console.log(`\nVocê pode abrir este arquivo no Excel.`);
}

extrairAfetados();
