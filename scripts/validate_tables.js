const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function validateTables() {
    console.log("Validando tabelas...");
    
    const tables = ['op_postos', 'op_alocacoes', 'op_alocacoes_log'];
    
    for (const table of tables) {
        const { data, error } = await supabase
            .from(table)
            .select('*', { count: 'exact', head: true });
        
        if (error) {
            console.error(`ERRO na tabela ${table}:`, error.message);
        } else {
            console.log(`Tabela ${table}: OK`);
        }
    }
}

validateTables();
