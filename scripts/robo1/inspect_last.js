
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function inspectLastProvider() {
    const { data, error } = await supabase
        .from('prestadores')
        .select('*')
        .order('id', { ascending: false })
        .limit(1);

    if (error) {
        console.error("❌ Erro:", error.message);
        return;
    }

    if (data.length > 0) {
        console.log("DETALHES DO PRESTADOR:");
        console.log(JSON.stringify(data[0], null, 2));
    } else {
        console.log("Nenhum registro encontrado.");
    }
}

inspectLastProvider();
