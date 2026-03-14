const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function testUpdate() {
    const id = '9a17e489-d243-41c6-9906-e06cdc1b341d'; // Aldo Cleiton
    const dados = {
        referencia_escala: '2026-03-05',
        data_reciclagem: '2027-01-01'
    };

    console.log('Attempting update for Aldo...');
    const { data, error } = await supabase
        .from('op_equipe')
        .update(dados)
        .eq('id', id)
        .select();

    if (error) {
        console.error('Update failed:', error);
    } else {
        console.log('Update successful:', JSON.stringify(data, null, 2));
    }
}

testUpdate();
