
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function runConstraint() {
    console.log("Adicionando restrição UNIQUE na tabela op_escala_diaria...");
    
    // Como não podemos rodar SQL direto por aqui sem RPC, vamos instruir o usuário.
    // Mas vamos tentar verificar se já existe ou se podemos simular.
    
    console.log("SQL NECESSÁRIO:");
    console.log(`
        -- Garante que um colaborador só tenha um status/escala por dia
        ALTER TABLE op_escala_diaria DROP CONSTRAINT IF EXISTS unique_colab_date;
        ALTER TABLE op_escala_diaria ADD CONSTRAINT unique_colab_date UNIQUE (colaborador_id, data_plantao);
    `);
}

runConstraint();
