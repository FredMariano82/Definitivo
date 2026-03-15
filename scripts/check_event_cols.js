const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function checkColumns() {
    const { data, error } = await supabase.rpc('get_table_columns', { table_name: 'op_eventos' });
    if (error) {
        console.error("Erro ao buscar colunas (RPC falhou, tentando query direta):", error.message);
        // Fallback for some supabase setups
        const { data: cols, error: err } = await supabase.from('op_eventos').select('*').limit(1);
        if (err) console.error(err);
        else console.log("Colunas encontradas:", Object.keys(cols[0] || {}));
    } else {
        console.log("Colunas:", data);
    }
}

checkColumns();
