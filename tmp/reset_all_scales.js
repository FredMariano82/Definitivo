
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Erro: NEXT_PUBLIC_SUPABASE_URL ou NEXT_PUBLIC_SUPABASE_ANON_KEY não encontrados em .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function resetAllScales() {
  console.log('--- INICIANDO RESET DE ESCALAS TEÓRICAS (LIMPEZA DOS AZUIS) ---');

  const { data, error } = await supabase
    .from('op_equipe')
    .update({
      tipo_escala: 'A DEFINIR',
      // referencia_escala: '2026-03-31', // Mantemos a data como hoje para não violar NOT NULL
      data_inicio_ferias: null,
      data_fim_ferias: null
    })
    .neq('id', '00000000-0000-0000-0000-000000000000');

  if (error) {
    console.error('Erro ao resetar escalas:', error.message);
  } else {
    console.log('Sucesso! Todas as escalas teóricas foram resetadas para "A DEFINIR".');
    console.log('O calendário agora deve aparecer totalmente limpo.');
  }

  console.log('\n--- OPERAÇÃO CONCLUÍDA ---');
}

resetAllScales();
