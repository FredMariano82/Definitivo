const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function main() {
    const { data, error } = await supabase
        .from('prestadores')
        .select('id, nome, doc1, liberacao, integrado_id_control')
        .order('id', { ascending: false })
        .limit(1);

    if (error) {
        console.error("Error:", error.message);
        return;
    }

    console.log("Último prestador cadastrado:");
    console.table(data);
}

main();
