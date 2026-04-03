import { supabase } from "@/lib/supabase"

export interface KanbanTarefa {
  id?: string
  titulo: string
  descricao: string
  status: 'entrada' | 'andamento' | 'aguardando' | 'revisao' | 'finalizado'
  categoria: 'imagem' | 'os' | 'ocorrencia' | 'autorizacao_chaves' | 'achados_perdidos' | 'eventos' | 'uniforme'
  foto_url?: string
  dados_especificos: Record<string, any>
  created_by_name?: string
  updated_by_name?: string
}

export class KanbanService {
  /**
   * Cria uma nova tarefa no Kanban
   */
  static async criarTarefa(tarefa: Partial<KanbanTarefa>) {
    const { data, error } = await supabase
      .from('kanban_tarefas')
      .insert({
        ...tarefa,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
    
    if (error) throw error
    return data?.[0]
  }

  /**
   * Busca tarefas por categoria
   */
  static async getTarefasPorCategoria(categoria: string) {
    const { data, error } = await supabase
      .from('kanban_tarefas')
      .select('*')
      .eq('categoria', categoria)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data || []
  }
}
