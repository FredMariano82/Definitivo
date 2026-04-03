
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function checkRejectionReason() {
    const { data, error } = await supabase
        .from('prestadores')
        .select('id, nome, doc1, liberacao, checagem, observacoes')
        .order('id', { ascending: false })
        .limit(1);

    if (error) {
        console.error("❌ Erro:", error.message);
        return;
    }

    if (data.length > 0) {
        const p = data[0];
        console.log(`🔍 Resultado para: ${p.nome}`);
        console.log(`- Status: ${p.liberacao}`);
        console.log(`- Checagem: ${p.checagem}`);
        console.log(`- Observações: ${p.observacoes}`);
    } else {
        console.log("Nenhum registro encontrado.");
    }
}

checkRejectionReason();
