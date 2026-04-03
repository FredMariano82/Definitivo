
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function checkSolicitacoes() {
    const { data, error } = await supabase
        .from('solicitacoes')
        .select('*')
        .order('criado_em', { ascending: false })
        .limit(5);

    if (error) {
        console.error("❌ Erro:", error.message);
        return;
    }

    console.log(`📦 Últimas 5 solicitações:`);
    data.forEach(s => {
        console.log(`- ID: ${s.id} | Status: ${s.status} | Departamento: ${s.departamento} | Empresa: ${s.empresa}`);
    });
}

checkSolicitacoes();
