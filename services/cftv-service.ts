import { supabase } from "@/lib/supabase"
import { KanbanService } from "./kanban-service"

export interface DVR {
  id: string
  nome: string
  localizacao?: string
  canais: number
}

export interface RondaRegistro {
  id?: string
  data_ronda: string
  operador_nome: string
  dados_ronda: Record<string, Record<number, string>> // { [dvrId]: { [canal]: cor } }
  observacoes?: string
}

export class CFTVService {
  /**
   * Busca a lista de todos os DVRs configurados
   */
  static async getDVRs(): Promise<DVR[]> {
    const { data, error } = await supabase
      .from('cftv_dvrs')
      .select('*')
      .order('nome')
    
    if (error) throw error
    return data || []
  }

  /**
   * Busca a última ronda registrada para persistência visual
   */
  static async getUltimaRonda(): Promise<RondaRegistro | null> {
    const { data, error } = await supabase
      .from('cftv_rondas_historico')
      .select('*')
      .order('data_ronda', { ascending: false })
      .limit(1)
      .maybeSingle()
    
    if (error) {
      console.error("Erro ao buscar última ronda:", error)
      return null
    }
    return data as RondaRegistro
  }

  /**
   * Salva um novo registro de ronda e opcionalmente cria um card no Kanban
   */
  static async salvarRonda(registro: RondaRegistro, criarCardKanban = false) {
    const { data, error } = await supabase
      .from('cftv_rondas_historico')
      .insert(registro)
      .select()
    
    if (error) throw error

    // Se solicitado, cadastrar no Kanban como tarefa finalizada
    if (criarCardKanban && data?.[0]) {
      await KanbanService.criarTarefa({
        titulo: `RONDA CFTV: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`,
        status: 'finalizado',
        categoria: 'imagem',
        descricao: registro.observacoes || 'Ronda de rotina realizada pelo sistema.',
        created_by_name: registro.operador_nome || 'Operador',
        dados_especificos: {
          ronda_id: data[0].id,
          tipo_ronda: 'DVR_CONSOLIDADO',
          total_canais: registro.dados_ronda ? Object.keys(registro.dados_ronda).length : 0,
          saude_sistema: registro.observacoes?.match(/Saúde: ([\d.]+)%/)?.[1] || 'N/A'
        }
      })
    }

    return data?.[0]
  }

  /**
   * Busca o histórico de rondas
   */
  static async getHistoricoRondas(limit = 10) {
    const { data, error } = await supabase
      .from('cftv_rondas_historico')
      .select('*')
      .order('data_ronda', { ascending: false })
      .limit(limit)
    
    if (error) throw error
    return data || []
  }
}

import { format } from "date-fns"

// Aliases para compatibilidade com as melhorias de 03/04
export const CftvService = CFTVService
export type RondaDVR = RondaRegistro
