const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function checkColType() {
    const { data, error } = await supabase.rpc('get_table_columns_info', { t_name: 'op_eventos' });
    if (error) {
        // Direct query to information_schema if rpc doesn't exist
        const { data: info, error: err } = await supabase.from('op_eventos').select('equipe_escalada').limit(1);
        console.log("Exemplo de dado em equipe_escalada:", info);
    } else {
        console.log("Info colunas:", data);
    }
}

checkColType();
