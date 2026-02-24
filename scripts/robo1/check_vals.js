const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    console.log("--- Checking Prestadores and Solicitacoes ---");
    const { data: prestadores, error } = await supabase
        .from('prestadores')
        .select(`
            id, nome, empresa,
            solicitacoes:solicitacao_id ( departamento )
        `)
        .order('id', { ascending: false })
        .limit(10);

    if (error) {
        console.error("Error:", error);
    } else {
        prestadores.forEach(p => {
            console.log(`- Prestador: ${p.nome}`);
            console.log(`  Empresa: [${p.empresa}]`);
            console.log(`  Depto: [${p.solicitacoes?.departamento}]`);
            console.log('---');
        });
    }
}

check();
