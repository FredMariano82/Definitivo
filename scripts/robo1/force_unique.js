const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function forceUnique() {
    const uniqueName = "Robot Test " + Math.floor(Math.random() * 1000000);
    const uniqueRG = '' + Math.floor(Math.random() * 900000000000 + 100000000000);

    console.log(`Forcing [${uniqueName}] with RG [${uniqueRG}]...`);

    const { data: updated, error } = await supabase
        .from('prestadores')
        .update({
            nome: uniqueName,
            doc1: uniqueRG,
            liberacao: 'ok',
            integrado_id_control: false,
            observacoes: 'Teste Mapeamento Campos'
        })
        .ilike('nome', '%Marcus%')
        .select();

    if (error) {
        console.error("Error:", error.message);
    } else {
        console.log("Forced successfully!", updated?.[0]?.nome, updated?.[0]?.liberacao);
    }
}

forceUnique();
