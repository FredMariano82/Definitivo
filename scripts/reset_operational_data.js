
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Erro: NEXT_PUBLIC_SUPABASE_URL ou NEXT_PUBLIC_SUPABASE_ANON_KEY não encontrados em .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function resetOperationalData() {
  console.log('Iniciando limpeza de dados operacionais (SEM DELETAR EQUIPE)...');

  const tablesToClear = [
    'op_escala_diaria',
    'op_eventos_equipe',
    'op_financeiro_eventos',
    'op_pausas',
    'op_alocacoes',
    'op_eventos',
    'kanban_tarefas'
  ];

  for (const table of tablesToClear) {
    console.log(`Limpando tabela: ${table}...`);
    const { error } = await supabase
      .from(table)
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete everything (hack for Supabase delete all)

    if (error) {
      console.error(`Erro ao limpar ${table}:`, error.message);
    } else {
      console.log(`Tabela ${table} limpa com sucesso.`);
    }
  }

  console.log('\n--- LIMPEZA CONCLUÍDA ---');
  console.log('Equipe e Postos foram preservados.');
}

resetOperationalData();
