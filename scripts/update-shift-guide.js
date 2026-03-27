const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Erro: NEXT_PUBLIC_SUPABASE_URL ou NEXT_PUBLIC_SUPABASE_ANON_KEY não encontrados no .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function updateShiftGuide() {
  console.log('Atualizando horário de Retorno do Almoço (11h) para 12:00...')
  
  const { data, error } = await supabase
    .from('op_guia_turno')
    .update({ horario_alvo: '12:00' })
    .ilike('titulo', '%Retorno do Almoço (11h)%')
    .eq('turno', 'Dia')

  if (error) {
    console.error('Erro ao atualizar:', error)
  } else {
    console.log('Sucesso! Horário atualizado para 12:00.')
    console.log('Resultado:', data)
  }
}

updateShiftGuide()
