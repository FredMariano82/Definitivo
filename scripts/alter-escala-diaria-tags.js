const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase URL or Key')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function alterEscalaDiaria() {
    console.log("Adicionando colunas de integração na op_escala_diaria...")
    // In Supabase, we can use the SQL editor or logic, but via JS client without direct SQL access, 
    // it's safer to use the REST API if we can, or just instruct the user.
    // However, since we have service role, we might not have direct DDL access via `.from()`.
    // Let's create a SQL string that the user can run in the Supabase SQL Editor, 
    // OR we can try to use rpc if a function exists. Since it likely doesn't,
    // we'll instruct him or create a new table and migrate data if it was empty.
    // Let's just create the SQL log for him.

    console.log(`
    Atenção Marcus! Como não posso rodar comandos de alteração de estrutura (DDL) diretamente por segurança da API REST, 
    por favor rode este comando no SQL Editor do seu Supabase para prepararmos a Escala Diária para os Eventos e FTs:

    ALTER TABLE op_escala_diaria
    ADD COLUMN tipo_plantao TEXT DEFAULT 'Normal',
    ADD COLUMN evento_id UUID;
    `);

}

alterEscalaDiaria()
