const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function limparTabelas() {
    console.log("🧹 Iniciando limpeza das tabelas...");

    // 1. Limpar Prestadores (pode dar erro se houver FK, mas vamos tentar)
    // No Supabase, se não houver CASCADE, temos que deletar na ordem certa

    try {
        const { error: err1 } = await supabase.from('prestadores').delete().neq('id', 0);
        if (err1) throw err1;
        console.log("✅ Tabela 'prestadores' limpa.");

        const { error: err2 } = await supabase.from('solicitacoes').delete().neq('id', 0);
        if (err2) throw err2;
        console.log("✅ Tabela 'solicitacoes' limpa.");

        console.log("\n🚀 Limpeza concluída com sucesso via API!");
        console.log("Nota: A API do Supabase não reseta os IDs automaticamente. Se precisar que comece do 1, use o comando TRUNCATE no SQL Editor.");
    } catch (error) {
        console.error("❌ Erro ao limpar:", error.message);
    }
}

limparTabelas();
