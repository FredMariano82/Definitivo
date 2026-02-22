const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function main() {
    const { data, error } = await supabase
        .from('prestadores')
        .select('liberacao, checagem');

    if (error) {
        console.error("Error:", error.message);
        return;
    }

    const distLiberacao = [...new Set(data.map(d => d.liberacao))];
    const distChecagem = [...new Set(data.map(d => d.checagem))];

    console.log("Distinct liberacao:", distLiberacao);
    console.log("Distinct checagem:", distChecagem);
}

main();
