const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../../.env.local') });

async function check() {
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
    const { data, error } = await supabase
        .from('prestadores')
        .select('id, nome, doc1, id_control_id, checagem_valida_ate')
        .eq('id_control_id', null)
        .order('id', { ascending: false })
        .limit(1);

    if (error) {
        console.error("ERRO_DB:", error.message);
        process.exit(1);
    }

    if (data && data.length > 0) {
        console.log("ALVO_ENCONTRADO");
        console.log("NOME:" + data[0].nome);
        console.log("RG:" + data[0].doc1);
        console.log("DATA:" + data[0].checagem_valida_ate);
    } else {
        console.log("NENHUM_ALVO_PENDENTE");
    }
}
check();
