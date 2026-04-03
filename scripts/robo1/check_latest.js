
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function checkLatest() {
    const { data, error } = await supabase
        .from('prestadores')
        .select('*')
        .order('id', { ascending: false })
        .limit(5);

    if (error) {
        console.error("❌ Erro:", error.message);
        return;
    }

    console.log(`📦 Últimos 5 registros:`);
    data.forEach(p => {
        console.log(`- ID: ${p.id} | Nome: ${p.nome} | Liberação: ${p.liberacao} | Integrado: ${p.integrado_id_control}`);
    });
}

checkLatest();
