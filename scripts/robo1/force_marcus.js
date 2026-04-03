const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function forceMarcus() {
    console.log("Forcing Marcus to 'ok'...");

    const { error } = await supabase
        .from('prestadores')
        .update({
            nome: 'Marcus Marcus Marcus',
            doc1: '123456',
            liberacao: 'ok',
            integrado_id_control: false,
            observacoes: 'Teste Busca Exaustiva'
        })
        .ilike('nome', '%Marcus%');

    if (error) {
        console.error("Error:", error.message);
    } else {
        console.log("Marcus forced successfully!");
    }
}

forceMarcus();
