
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function testEmptyDate() {
    console.log("Testando se o banco aceita string vazia ('') em coluna DATE...");
    
    const { data: colabs } = await supabase.from('op_equipe').select('id').limit(1);
    if (!colabs || colabs.length === 0) return;

    const id = colabs[0].id;

    // Tentativa 1: String vazia
    console.log("Tentativa 1: Enviando '' para data_reciclagem...");
    const { error: err1 } = await supabase.from('op_equipe').update({
        data_reciclagem: ""
    }).eq('id', id);

    if (err1) {
        console.log("ERRO (Como esperado):", err1.message);
    } else {
        console.log("SUCESSO (Inesperado): O banco aceitou string vazia.");
    }

    // Tentativa 2: NULL
    console.log("Tentativa 2: Enviando null para data_reciclagem...");
    const { error: err2 } = await supabase.from('op_equipe').update({
        data_reciclagem: null
    }).eq('id', id);

    if (err2) {
        console.log("ERRO:", err2.message);
    } else {
        console.log("SUCESSO: O banco aceitou null.");
    }
}

testEmptyDate();
