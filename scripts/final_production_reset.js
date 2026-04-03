
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Erro: NEXT_PUBLIC_SUPABASE_URL ou NEXT_PUBLIC_SUPABASE_ANON_KEY não encontrados em .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function productionReset() {
  console.log('--- INICIANDO RESET DE PRODUÇÃO (Go-Live 01/04/2026) ---');

  // 1. Limpar Tabelas de Histórico/Operação
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
    console.log(`Limpando histórico: ${table}...`);
    const { error } = await supabase
      .from(table)
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (error) {
      console.error(`Erro ao limpar ${table}:`, error.message);
    } else {
      console.log(`Historico de ${table} limpo.`);
    }
  }

  // 2. Resetar Configurações da Equipe (Preservando as Pessoas)
  console.log('Limpando escalas e configurações individuais da Equipe...');
  const { error: staffError } = await supabase
    .from('op_equipe')
    .update({
      data_inicio_ferias: null,
      data_fim_ferias: null,
      referencia_escala: null,
      tipo_escala: 'A DEFINIR'
    })
    .neq('id', '00000000-0000-0000-0000-000000000000');

  if (staffError) {
    console.error('Erro ao resetar dados da equipe:', staffError.message);
  } else {
    console.log('Escalas e Férias da Equipe limpas com sucesso.');
  }

  console.log('\n--- RESET DE PRODUÇÃO CONCLUÍDO COM SUCESSO ---');
  console.log('Prestadores, Solicitações e Usuários foram preservados.');
}

productionReset();
