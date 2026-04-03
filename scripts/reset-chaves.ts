import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function resetInventory() {
  console.log("Iniciando o Reset do Controle de Chaves...")

  // 1. Zerar todos os empréstimos ativos no Inventário
  const { error: errorInv } = await supabase
    .from('chaves_inventario')
    .update({
      status: 'disponivel',
      responsavel_nome: null,
      responsavel_setor: null,
      operador_nome: null,
      data_emprestimo: null,
      devolvido_por: null,
      data_devolucao: null
    })
    .neq('numero', 'RESERVADO_NAO_EXISTE') // Dummy condition to target all rows

  if (errorInv) {
    console.error("Erro ao zerar inventário:", errorInv)
  } else {
    console.log("Inventário zerado com sucesso! (Todas as chaves agora estão Verdes/Disponíveis)")
  }

  // 2. Limpar a tabela de Histórico (Movimentações)
  // Tentamos deletar tudo (se a tabela existir)
  const { error: errorHist } = await supabase
    .from('chaves_movimentacoes')
    .delete()
    .neq('numero', 'RESERVADO_NAO_EXISTE') // Target all rows

  if (errorHist) {
    if (errorHist.code === '42P01') {
        console.log("Tabela de Histórico ainda não existe, nada para limpar.")
    } else {
        console.error("Erro ao limpar histórico:", errorHist)
    }
  } else {
    console.log("Histórico de movimentações limpo com sucesso!")
  }

  console.log("\n--- RESET CONCLUÍDO ---")
  console.log("O sistema está com a memória fresca para novos registros internos.")
}

resetInventory()
