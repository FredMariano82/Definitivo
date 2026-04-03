const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function checkMarcus() {
    const { data, error } = await supabase
        .from('prestadores')
        .select('*')
        .ilike('nome', '%Marcus%')
        .limit(1)
        .single();

    if (error) {
        console.error("Error:", error.message);
    } else {
        console.log("Marcus Status:", {
            id: data.id,
            nome: data.nome,
            liberacao: data.liberacao,
            checagem: data.checagem,
            integrado_id_control: data.integrado_id_control,
            observacoes: data.observacoes
        });
    }
}

checkMarcus();
