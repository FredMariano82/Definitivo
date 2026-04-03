const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function checkPendentes() {
    const { data: pendentes, error } = await supabase
        .from('prestadores')
        .select(`
            id, nome, doc1, liberacao, empresa,
            solicitacoes:solicitacao_id ( departamento )
        `)
        .eq('liberacao', 'ok')
        .is('integrado_id_control', false)
        .limit(5);

    if (error) {
        console.error("Error:", error.message);
    } else {
        console.log(`Found ${pendentes.length} pending users:`);
        pendentes.forEach(p => {
            console.log(`- ${p.nome} (Doc: ${p.doc1})`);
            console.log(`  Empresa: [${p.empresa}]`);
            console.log(`  Depto: [${p.solicitacoes?.departamento}]`);
        });
    }
}

checkPendentes();
