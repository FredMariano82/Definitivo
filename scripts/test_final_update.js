
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function testUpdate() {
    console.log("Testando atualização de colaborador...");
    
    const { data: colabs } = await supabase.from('op_equipe').select('id, nome_completo').limit(1);
    if (!colabs || colabs.length === 0) {
        console.log("Nenhum colaborador para testar.");
        return;
    }
    
    const id = colabs[0].id;
    console.log(`Atualizando colaborador: ${colabs[0].nome_completo} (${id})`);

    const updateData = {
        referencia_escala: '1982-05-18', // Uma data qualquer para teste
        data_reciclagem: '2026-12-31'
    };

    const { data, error } = await supabase
        .from('op_equipe')
        .update(updateData)
        .eq('id', id)
        .select();

    if (error) {
        console.error("ERRO NO UPDATE:", error.message);
    } else {
        console.log("SUCESSO NO UPDATE:", data);
    }
}

testUpdate();
