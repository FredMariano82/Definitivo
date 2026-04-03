import { supabase } from "@/lib/supabase"

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
   * Salva um novo registro de ronda
   */
  static async salvarRonda(registro: RondaRegistro) {
    const { data, error } = await supabase
      .from('cftv_rondas_historico')
      .insert(registro)
      .select()
    
    if (error) throw error
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

// Aliases para compatibilidade com as melhorias de 03/04
export const CftvService = CFTVService
export type RondaDVR = RondaRegistro
