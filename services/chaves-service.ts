import { supabase } from "@/lib/supabase"

export type ChaveModelo = 'amarela' | 'prata'
export type ChaveStatus = 'disponivel' | 'emprestada' | 'manutencao' | 'extraviada' | 'nao_devolvida'

export interface ChaveInventario {
  id: string
  numero: string
  modelo: ChaveModelo
  local: string
  status: ChaveStatus
  responsavel_nome?: string
  responsavel_setor?: string
  operador_nome?: string
  data_emprestimo?: string
  devolvido_por?: string
  data_devolucao?: string
  obs?: string
  created_at: string
  updated_at: string
}

export const ChavesService = {
  async getTodas() {
    const { data, error } = await supabase
      .from('chaves_inventario')
      .select('*')
      .order('numero', { ascending: true })

    if (error) {
      if (error.code === '42P01') {
        throw new Error("A tabela 'chaves_inventario' não existe. Por favor, execute o script SQL de criação.")
      }
      throw error
    }
    return data as ChaveInventario[]
  },

  async emprestar(id: string, dados: { responsavel_nome: string, responsavel_setor: string, operador_nome: string }) {
    // 1. Buscar dados atuais da chave para o log
    const { data: chave } = await supabase.from('chaves_inventario').select('*').eq('id', id).single()
    
    // 2. Atualizar inventário
    const { error } = await supabase
      .from('chaves_inventario')
      .update({
        status: 'emprestada' as ChaveStatus,
        responsavel_nome: dados.responsavel_nome,
        responsavel_setor: dados.responsavel_setor,
        operador_nome: dados.operador_nome,
        data_emprestimo: new Date().toISOString(),
        devolvido_por: null,
        data_devolucao: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)

    if (error) throw error

    // 3. Registrar no histórico (Sempre registra como SAIDA ao emprestar)
    if (chave) {
      await supabase.from('chaves_movimentacoes').insert({
        chave_id: id,
        numero: chave.numero,
        modelo: chave.modelo,
        local: chave.local,
        tipo: 'SAIDA',
        responsavel_nome: dados.responsavel_nome,
        responsavel_setor: dados.responsavel_setor,
        operador_nome: dados.operador_nome,
        data_evento: new Date().toISOString()
      })
    }
  },

  async devolver(id: string, devolvido_por: string, operador_nome: string = "Operador") {
    // 1. Buscar dados atuais antes de limpar
    const { data: chave } = await supabase.from('chaves_inventario').select('*').eq('id', id).single()

    // 2. Atualizar inventário
    const { error } = await supabase
      .from('chaves_inventario')
      .update({
        status: 'disponivel' as ChaveStatus,
        devolvido_por: devolvido_por,
        data_devolucao: new Date().toISOString(),
        responsavel_nome: null,
        responsavel_setor: null,
        operador_nome: null,
        data_emprestimo: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)

    if (error) throw error

    // 3. Registrar no histórico
    if (chave) {
        await supabase.from('chaves_movimentacoes').insert({
          chave_id: id,
          numero: chave.numero,
          modelo: chave.modelo,
          local: chave.local,
          tipo: 'ENTRADA',
          responsavel_nome: chave.responsavel_nome,
          responsavel_setor: chave.responsavel_setor,
          operador_nome: operador_nome, // O operador que deu a baixa
          data_evento: new Date().toISOString()
        })
    }
  },

  async marcarNaoDevolvida(id: string, operador_nome: string = "Operador") {
    // 1. Buscar dados atuais para saber quem estava com ela
    const { data: chave } = await supabase.from('chaves_inventario').select('*').eq('id', id).single()

    // 2. Atualizar inventário para o status de alerta
    const { error } = await supabase
      .from('chaves_inventario')
      .update({
        status: 'nao_devolvida' as ChaveStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)

    if (error) throw error

    // 3. Registrar no histórico como uma ação especial
    if (chave) {
        await supabase.from('chaves_movimentacoes').insert({
          chave_id: id,
          numero: chave.numero,
          modelo: chave.modelo,
          local: chave.local,
          tipo: 'NÃO DEVOLVIDA',
          responsavel_nome: chave.responsavel_nome,
          responsavel_setor: chave.responsavel_setor,
          operador_nome: operador_nome,
          data_evento: new Date().toISOString()
        })
    }
  },

  async getSugestoes() {
    // 1. Buscar do inventário atual (quem está com chaves agora)
    const { data: inv } = await supabase
      .from('chaves_inventario')
      .select('responsavel_nome, responsavel_setor')
      .not('responsavel_nome', 'is', null)

    // 2. Buscar do histórico (quem já pegou chaves antes)
    const { data: hist } = await supabase
      .from('chaves_movimentacoes')
      .select('responsavel_nome, responsavel_setor')
      .order('data_evento', { ascending: false })
      .limit(500)

    const sugestoes: { nome: string, setor: string }[] = []
    const processed = new Set<string>()

    // Função auxiliar para processar resultados
    const process = (items: any[] | null) => {
        if (!items) return
        items.forEach(item => {
            const key = `${item.responsavel_nome}|${item.responsavel_setor}`
            if (item.responsavel_nome && !processed.has(key)) {
                processed.add(key)
                sugestoes.push({ nome: item.responsavel_nome, setor: item.responsavel_setor || '' })
            }
        })
    }

    process(inv)
    process(hist)

    return sugestoes
  },

  async getHistorico() {
    const { data, error } = await supabase
      .from('chaves_movimentacoes')
      .select('*')
      .order('data_evento', { ascending: false })
      .limit(200)

    if (error) {
        if (error.code === '42P01') return [] // Tabela ainda não criada
        throw error
    }
    return data
  }
}
