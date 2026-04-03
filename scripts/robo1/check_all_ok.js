
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function checkAllOk() {
    const { data, error } = await supabase
        .from('prestadores')
        .select('id, nome, doc1, liberacao, integrado_id_control')
        .eq('liberacao', 'ok')
        .order('id', { ascending: false })
        .limit(10);

    if (error) {
        console.error("❌ Erro:", error.message);
        return;
    }

    console.log(`📦 Encontrados ${data.length} registros com liberacao='ok'.`);
    data.forEach(p => {
        console.log(`- ID: ${p.id} | ${p.nome} | Integrado: ${p.integrado_id_control}`);
    });
}

checkAllOk();
