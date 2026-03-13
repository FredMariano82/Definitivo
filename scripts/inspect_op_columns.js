
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function inspectTable() {
    console.log("Inspecionando colunas da tabela op_equipe...");
    
    // Tentativa de pegar um registro para ver as chaves
    const { data, error } = await supabase.from('op_equipe').select('*').limit(1);
    
    if (error) {
        console.error("Erro ao ler tabela:", error);
    } else if (data && data.length > 0) {
        console.log("Colunas encontradas:", Object.keys(data[0]));
    } else {
        console.log("Tabela vazia ou sem acesso. Tentando inserir registro nulo para ver erro de coluna.");
        const { error: insertError } = await supabase.from('op_equipe').insert([{ 
            nome_completo: 'Teste Inspecao',
            referencia_escala: '2024-01-01'
        }]);
        if (insertError) {
            console.log("Erro ao inserir (pode indicar coluna ausente):", insertError.message);
        }
    }
}

inspectTable();
