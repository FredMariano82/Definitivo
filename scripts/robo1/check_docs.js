const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function main() {
    const { data, error } = await supabase
        .from('prestadores')
        .select('nome, doc1, doc2, liberacao, checagem')
        .limit(10);

    if (error) {
        console.error("Error:", error.message);
        return;
    }

    console.table(data);
}

main();
