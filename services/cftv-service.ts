import { supabase } from "@/lib/supabase"
import { KanbanService } from "./kanban-service"

export interface DVR {
  id: string
  nome: string
  localizacao?: string
  canais: number
  mosaico_url?: string
}

export interface RondaRegistro {
  id?: string
  data_ronda: string
  operador_nome: string
  dados_ronda: Record<string, Record<number, string>> // { [dvrId]: { [canal]: cor } }
  observacoes?: string
  relatorio_html_snapshot?: string
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
    const { relatorio_html_snapshot, ...dbRegistro } = registro;
    
    const { data, error } = await supabase
      .from('cftv_rondas_historico')
      .insert(dbRegistro)
      .select()
    
    if (error) throw error

    // Se solicitado, cadastrar no Kanban como tarefa finalizada
    if (criarCardKanban && data?.[0]) {
      await KanbanService.criarTarefa({
        titulo: `RONDA CFTV: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`,
        status: 'finalizado',
        categoria: 'ronda_dvr',
        descricao: registro.observacoes || 'Ronda de rotina realizada pelo sistema.',
        created_by_name: registro.operador_nome || 'Operador',
        dados_especificos: {
          ronda_id: data[0].id,
          tipo_ronda: 'DVR_CONSOLIDADO',
          total_canais: registro.dados_ronda ? Object.keys(registro.dados_ronda).length : 0,
          saude_sistema: registro.observacoes?.match(/Saúde: ([\d.]+)%/)?.[1] || 'N/A',
          relatorio_html_snapshot: registro.relatorio_html_snapshot
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

  /**
   * Faz o upload do mosaico gabarito para o DVR usando Supabase Storage e salva na tabela
   */
  static async uploadMosaicoOficial(dvrId: string, file: File): Promise<string> {
    // 1. Fazer upload para o Bucket "mosaicos_cftv"
    const fileExt = file.name.split('.').pop();
    const fileName = `${dvrId}-${Date.now()}.${fileExt}`;
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('mosaicos_cftv')
      .upload(fileName, file, { upsert: true });

    if (uploadError) throw new Error("Falha no upload da imagem: " + uploadError.message);

    // 2. Obter a URL pública da imagem
    const { data: publicUrlData } = supabase.storage
      .from('mosaicos_cftv')
      .getPublicUrl(fileName);

    const publicUrl = publicUrlData.publicUrl;

    // 3. Salvar a URL na tabela cftv_dvrs
    const { error: dbError } = await supabase
      .from('cftv_dvrs')
      .update({ mosaico_url: publicUrl })
      .eq('id', dvrId);

    if (dbError) throw new Error("Imagem enviada, mas falha ao vincular com o DVR: " + dbError.message);

    return publicUrl;
  }

  /**
   * Busca todas as tarefas de manutenção de CFTV abertas hoje (00:00 até 23:59)
   */
  static async getManutencoesDoDia(): Promise<any[]> {
    const hoje = new Date()
    hoje.setHours(0, 0, 0, 0)
    const amanha = new Date(hoje)
    amanha.setDate(amanha.getDate() + 1)

    const { data, error } = await supabase
      .from('kanban_tarefas')
      .select('*')
      .eq('categoria', 'manutencao_cftv')
      .gte('created_at', hoje.toISOString())
      .lt('created_at', amanha.toISOString())
      .order('created_at', { ascending: true })

    if (error) throw error
    return data || []
  }
}

import { format } from "date-fns"

// Aliases para compatibilidade com as melhorias de 03/04
export const CftvService = CFTVService
export type RondaDVR = RondaRegistro
