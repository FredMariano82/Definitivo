
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function forceReset() {
  console.log('Tentando reset forçado com filtro is.not...');
  
  const { data, error } = await supabase
    .from('op_equipe')
    .update({
      data_inicio_ferias: null,
      data_fim_ferias: null,
      referencia_escala: null,
      tipo_escala: 'A DEFINIR'
    })
    .not('id', 'is', 'null'); // This should catch everyone

  if (error) {
    console.error('Erro no reset forçado:', error.message);
  } else {
    console.log('Reset forçado concluído.');
  }

  // Verificação imediata
  const { data: check } = await supabase.from('op_equipe').select('nome_completo, tipo_escala').limit(3);
  console.log('Estado atual (amostra):', JSON.stringify(check, null, 2));
}

forceReset();
