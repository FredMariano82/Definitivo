const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAldo() {
    const { data, error } = await supabase
        .from('op_equipe')
        .select('*')
        .ilike('nome_completo', '%Aldo%');

    if (error) {
        fs.writeFileSync('aldo_debug.json', JSON.stringify({ error }, null, 2));
        return;
    }

    fs.writeFileSync('aldo_debug.json', JSON.stringify(data, null, 2));
    console.log('Aldo Records saved to aldo_debug.json');
}

checkAldo();
