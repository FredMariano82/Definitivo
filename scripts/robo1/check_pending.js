
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function checkPending() {
    const { data: pendentes, error } = await supabase
        .from('prestadores')
        .select(`
            id, nome, doc1, liberacao, empresa, integrado_id_control,
            solicitacao_id, 
            solicitacoes:solicitacao_id ( data_inicial, data_final, departamento )
        `)
        .eq('liberacao', 'ok')
        .is('integrado_id_control', false)
        .order('id', { ascending: false });

    if (error) {
        console.error("❌ Erro:", error.message);
        return;
    }

    console.log(`📦 Encontrados ${pendentes.length} pendentes.`);
    pendentes.forEach(p => {
        console.log(`- ${p.nome} (${p.doc1}) | Empresa: ${p.empresa} | Depto: ${p.solicitacoes?.departamento}`);
    });
}

checkPending();
