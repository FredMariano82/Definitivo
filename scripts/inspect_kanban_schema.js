const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function inspectSchema() {
    console.log('Inspecionando colunas de kanban_tarefas...');
    // No Supabase-js não há um comando direto para listar colunas, 
    // mas podemos tentar buscar uma linha e ver as chaves ou usar uma query RPC se houver.
    // Outra forma é tentar inserir um objeto vazio e ver o erro de validação ou buscar o primeiro registro.
    
    const { data, error } = await supabase
        .from('kanban_tarefas')
        .select('*')
        .limit(1);
    
    if (error) {
        console.error('Erro ao inspecionar:', error);
        return;
    }

    if (data && data.length > 0) {
        console.log('Colunas detectadas:', Object.keys(data[0]));
        console.log('Exemplo de dados_especificos:', JSON.stringify(data[0].dados_especificos, null, 2));
    } else {
        console.log('Tabela vazia ou sem registros para inspecionar colunas.');
    }
}

inspectSchema();
