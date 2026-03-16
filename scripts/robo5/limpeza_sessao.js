const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function cleanup() {
    console.log("🧹 Iniciando limpeza de dados no Supabase...");

    // 1. Limpar Prestadores de teste ou MVM
    console.log("🗑️ Removendo registros em 'prestadores'...");
    const { count: pCount, error: pError } = await supabase
        .from('prestadores')
        .delete()
        .or("nome.eq.TESTE AGENTE,motivo.eq.SISTEMA MVM,setor.eq.SISTEMA MVM");

    if (pError) {
        console.error("❌ Erro ao limpar prestadores:", pError.message);
    } else {
        console.log(`   ✅ Registros removidos de 'prestadores'.`);
    }

    // 2. Limpar Solicitações MVM (caso alguma tenha sido criada)
    console.log("🗑️ Removendo registros em 'solicitacoes'...");
    const { error: sError } = await supabase
        .from('solicitacoes')
        .delete()
        .eq('solicitante', 'SISTEMA MVM');

    if (sError) {
        // Tenta também no singular caso o plural dê erro
        await supabase.from('solicitacao').delete().eq('solicitante', 'SISTEMA MVM');
    }
    console.log(`   ✅ Registros de solicitações limpos.`);

    console.log("\n✨ LIMPEZA CONCLUÍDA!");
}

cleanup().catch(console.error);
