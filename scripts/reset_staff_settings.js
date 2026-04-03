
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function resetStaffSettings() {
  console.log('Resetando configurações de equipe...');

  const { error } = await supabase
    .from('op_equipe')
    .update({
      data_inicio_ferias: null,
      data_fim_ferias: null,
      referencia_escala: null,
      tipo_escala: 'A DEFINIR' // Usando valor padrão para satisfazer NOT NULL
    })
    .neq('id', '00000000-0000-0000-0000-000000000000');

  if (error) {
    console.error('Erro ao resetar equipe:', error.message);
  } else {
    console.log('Equipe resetada com sucesso.');
  }
}

resetStaffSettings();
