const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function run() {
    console.log('Adicionando coluna vagas_necessarias...');
    const { error } = await supabase.rpc('exec_sql', { 
        sql_query: "ALTER TABLE op_eventos ADD COLUMN IF NOT EXISTS vagas_necessarias INTEGER DEFAULT 0;" 
    });

    if (error) {
        console.error('Erro ao executar via RPC:', error.message);
        console.log('Tentando via query direta (pode falhar dependendo das permissões)...');
        // Se o RPC falhar, informamos o usuário.
    } else {
        console.log('Sucesso!');
    }
}

run();
