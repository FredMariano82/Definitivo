require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function reset() {
    console.log("Resetting Pedro...");
    const { data: pData } = await supabase.from('prestadores')
        .select('*')
        .order('id', { ascending: false })
        .limit(1);

    const p = pData[0];

    if (p && p.nome.includes('Pedro')) {
        const { error } = await supabase.from('prestadores').update({
            liberacao: 'pendente',
            checagem: 'pendente',
            integrado_id_control: false,
            id_control_id: null,
            observacoes: null
        }).eq('id', p.id);
        if (error) console.error("Error resetting:", error);
        else console.log(`Reset ${p.nome} to pending!`);
    } else {
        console.log("Last user is not Pedro:", p?.nome);
    }
}
reset();
