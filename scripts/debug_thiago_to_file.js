const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

async function debugThiago() {
    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

    const { data, error } = await supabase
        .from('prestadores')
        .select('id, nome, doc1, checagem, observacoes')
        .eq('nome', 'Thiago Barros');

    if (error) {
        fs.writeFileSync('debug_output.json', JSON.stringify({ error }, null, 2));
        return;
    }

    fs.writeFileSync('debug_output.json', JSON.stringify(data, null, 2));
    console.log(`Saved ${data.length} records to debug_output.json`);
}

debugThiago();
