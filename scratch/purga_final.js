const { createClient } = require('@supabase/supabase-js');

// Configuração Supabase (Extraída de scripts/final_cleanup.js)
const supabaseUrl = "https://fghskpxtqdfqomozfckk.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZnaHNrcHh0cWRmcW9tb3pmY2trIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczODAxNzM4NywiZXhwIjoyMDUzNTkzMzg3fQ.Zue8NlG78l2k6N-kQo7h2E83A8V7_W9yM_e-vL_r0_A";

const supabase = createClient(supabaseUrl, supabaseKey);

async function purgaTotal() {
    console.log("🛑 INICIANDO PURGA TOTAL DO SUPABASE...");

    try {
        // 1. Limpar Solicitações (Foreign Key de Prestadores geralmente)
        console.log("🌪️ Limpando tabela 'solicitacoes'...");
        const { error: errSol } = await supabase.from('solicitacoes').delete().neq('id', '00000000-0000-0000-0000-000000000000'); // Deletar tudo
        if (errSol) console.error("❌ Erro ao limpar solicitacoes:", errSol.message);
        else console.log("✅ Tabela 'solicitacoes' limpa.");

        // 2. Limpar Prestadores
        console.log("🌪️ Limpando tabela 'prestadores'...");
        const { error: errPre } = await supabase.from('prestadores').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        if (errPre) console.error("❌ Erro ao limpar prestadores:", errPre.message);
        else console.log("✅ Tabela 'prestadores' limpa.");

        console.log("\n🎉 PURGA CONCLUÍDA. O banco de dados está resetado.");

    } catch (e) {
        console.error("❌ ERRO CRÍTICO na purga:", e.message);
    }
}

purgaTotal();
