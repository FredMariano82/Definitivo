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
  console.log('--- INICIANDO ATUALIZAÇÃO ---')
  console.log('Buscando item para "11:30" e "Retorno do Almoço"...')
  
  const { data, error } = await supabase
    .from('op_guia_turno')
    .update({ horario_alvo: '12:00' })
    .ilike('titulo', '%Retorno do Almoço (11h)%')
    .eq('horario_alvo', '11:30')
    .eq('turno', 'Dia')
    .select()

  if (error) {
    console.error('Erro ao atualizar banco:', error.message)
  } else if (data && data.length > 0) {
    console.log('Sucesso! Horário atualizado para 12:00.')
    console.log('Alterado:', data[0].titulo, '(', data[0].horario_alvo, ')')
  } else {
    console.log('Aviso: Nenhum item correspondente encontrado para atualizar.')
    // Tenta uma busca mais genérica se a anterior falhar
    const { data: todos } = await supabase.from('op_guia_turno').select('titulo, horario_alvo').eq('turno', 'Dia')
    console.log('Itens atuais no banco (Dia):', todos)
  }
}

updateShiftGuide()
