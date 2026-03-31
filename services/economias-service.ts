import { supabase } from "@/lib/supabase"

export interface EconomiaDetectada {
  id?: string
  solicitante: string
  prestadorNome: string
  prestadorDocumento: string
  tipoEconomia: "maxima" | "operacional" | "evitado"
  valorEconomizado: number
  dataDeteccao?: string
  detalhes: string
  solicitacaoOrigem?: string
}

export interface EconomiaMetricas {
  totalEconomizado: number
  totalCasos: number
  economiaMaxima: number
  economiaOperacional: number
  desperdicioEvitado: number
  porSolicitante: Array<{
    solicitante: string
    maxima: number
    operacional: number
    evitado: number
    totalEconomia: number
    totalCasos: number
  }>
}

export class EconomiasService {
  // Contabilizar economia detectada IMEDIATAMENTE
  static async contabilizarEconomia(economia: EconomiaDetectada): Promise<{ sucesso: boolean; erro?: string }> {
    try {
      console.log("💰 CONTABILIZANDO ECONOMIA IMEDIATAMENTE:", economia)

      if (!supabase) {
        console.error("❌ Supabase não inicializado")
        return { sucesso: false, erro: "Erro de configuração do banco" }
      }

      // Verificar se já existe economia para este prestador/solicitante (evitar duplicatas)
      const { data: economiaExistente } = await supabase
        .from("economias_sistema")
        .select("id")
        .eq("solicitante", economia.solicitante)
        .eq("prestador_documento", economia.prestadorDocumento)
        .eq("tipo_economia", economia.tipoEconomia)
        .gte("data_deteccao", new Date(Date.now() - 5 * 60 * 1000).toISOString()) // Últimos 5 minutos
        .single()

      if (economiaExistente) {
        console.log("⚠️ Economia já contabilizada recentemente, ignorando duplicata")
        return { sucesso: true }
      }

      const { error } = await supabase.from("economias_sistema").insert([
        {
          solicitante: economia.solicitante,
          prestador_nome: economia.prestadorNome,
          prestador_documento: economia.prestadorDocumento,
          tipo_economia: economia.tipoEconomia,
          valor_economizado: economia.valorEconomizado,
          detalhes: economia.detalhes,
          solicitacao_origem: economia.solicitacaoOrigem || null,
        },
      ])

      if (error) {
        console.error("❌ Erro ao contabilizar economia:", error)
        return { sucesso: false, erro: error.message }
      }

      console.log("✅ Economia contabilizada com sucesso!")
      return { sucesso: true }
    } catch (error: any) {
      console.error("💥 Erro ao contabilizar economia:", error)
      return { sucesso: false, erro: error.message }
    }
  }

  // Buscar métricas de economia para dashboard
  static async buscarMetricasEconomia(filtros?: {
    solicitante?: string
    dataInicial?: string
    dataFinal?: string
  }): Promise<EconomiaMetricas> {
    try {
      console.log("📊 Buscando métricas de economia...")

      if (!supabase) {
        console.error("❌ Supabase não inicializado")
        return this.getMetricasVazias()
      }

      let query = supabase.from("economias_sistema").select("*")

      if (filtros?.solicitante) {
        query = query.eq("solicitante", filtros.solicitante)
      }

      if (filtros?.dataInicial) {
        query = query.gte("data_deteccao", filtros.dataInicial)
      }

      if (filtros?.dataFinal) {
        // Garantir que o último dia seja incluído até o final (23:59:59)
        query = query.lte("data_deteccao", `${filtros.dataFinal} 23:59:59`)
      }

      const { data: economias, error } = await query.order("data_deteccao", { ascending: false })

      if (error) {
        console.error("❌ Erro ao buscar economias:", error)
        return this.getMetricasVazias()
      }

      if (!economias || economias.length === 0) {
        console.log("📊 Nenhuma economia encontrada")
        return this.getMetricasVazias()
      }

      // Calcular métricas
      const totalEconomizado = economias.reduce((acc, e) => acc + Number(e.valor_economizado), 0)
      const totalCasos = economias.length

      const economiaMaxima = economias.filter((e) => e.tipo_economia === "maxima").length
      const economiaOperacional = economias.filter((e) => e.tipo_economia === "operacional").length
      const desperdicioEvitado = economias.filter((e) => e.tipo_economia === "evitado").length

      // Agrupar por solicitante
      const porSolicitanteMap = economias.reduce(
        (acc, economia) => {
          if (!acc[economia.solicitante]) {
            acc[economia.solicitante] = {
              solicitante: economia.solicitante,
              maxima: 0,
              operacional: 0,
              evitado: 0,
              totalEconomia: 0,
              totalCasos: 0,
            }
          }

          const item = acc[economia.solicitante]
          item.totalEconomia += Number(economia.valor_economizado)
          item.totalCasos += 1

          if (economia.tipo_economia === "maxima") item.maxima += 1
          if (economia.tipo_economia === "operacional") item.operacional += 1
          if (economia.tipo_economia === "evitado") item.evitado += 1

          return acc
        },
        {} as Record<string, any>,
      )

      const porSolicitante = Object.values(porSolicitanteMap).sort(
        (a: any, b: any) => b.totalEconomia - a.totalEconomia,
      )

      console.log(`✅ Métricas calculadas: R$ ${totalEconomizado} em ${totalCasos} casos`)

      return {
        totalEconomizado,
        totalCasos,
        economiaMaxima,
        economiaOperacional,
        desperdicioEvitado,
        porSolicitante: porSolicitante as any,
      }
    } catch (error: any) {
      console.error("💥 Erro ao buscar métricas:", error)
      return this.getMetricasVazias()
    }
  }

  // Buscar histórico detalhado de economias
  static async buscarHistoricoEconomias(filtros?: {
    solicitante?: string
    tipoEconomia?: string
    limite?: number
  }): Promise<EconomiaDetectada[]> {
    try {
      if (!supabase) return []

      let query = supabase.from("economias_sistema").select("*").order("data_deteccao", { ascending: false })

      if (filtros?.solicitante) {
        query = query.eq("solicitante", filtros.solicitante)
      }

      if (filtros?.tipoEconomia) {
        query = query.eq("tipo_economia", filtros.tipoEconomia)
      }

      if (filtros?.limite) {
        query = query.limit(filtros.limite)
      }

      const { data: economias, error } = await query

      if (error) {
        console.error("❌ Erro ao buscar histórico:", error)
        return []
      }

      return (economias || []).map((e) => ({
        id: e.id,
        solicitante: e.solicitante,
        prestadorNome: e.prestador_nome,
        prestadorDocumento: e.prestador_documento,
        tipoEconomia: e.tipo_economia,
        valorEconomizado: Number(e.valor_economizado),
        dataDeteccao: e.data_deteccao,
        detalhes: e.detalhes,
        solicitacaoOrigem: e.solicitacao_origem,
      }))
    } catch (error: any) {
      console.error("💥 Erro ao buscar histórico:", error)
      return []
    }
  }

  // Sincronizar dados antigos (Retroativo)
  static async sincronizarDadosAntigos(): Promise<{ processados: number; erros: number }> {
    try {
      console.log("🔄 Iniciando sincronização retroativa de economias...")
      
      // 1. Buscar todas as solicitações de renovação
      const { data: solicitacoes, error: sError } = await supabase
        .from("solicitacoes")
        .select("id, solicitante, tipo_solicitacao, numero")
        .eq("tipo_solicitacao", "somente_liberacao")

      if (sError) throw sError
      if (!solicitacoes || solicitacoes.length === 0) return { processados: 0, erros: 0 }

      let processados = 0
      let erros = 0

      // 2. Para cada solicitação, buscar os prestadores e contabilizar
      for (const s of solicitacoes) {
        const { data: prestadores, error: pError } = await supabase
          .from("prestadores")
          .select("nome, doc1")
          .eq("solicitacao_id", s.id)

        if (pError) {
          erros++
          continue
        }

        for (const p of prestadores || []) {
          const res = await this.contabilizarEconomia({
            solicitante: s.solicitante,
            prestadorNome: p.nome,
            prestadorDocumento: p.doc1,
            tipoEconomia: "operacional",
            valorEconomizado: 20,
            detalhes: `Sincronização Retroativa (Solicitação ${s.numero})`,
            solicitacaoOrigem: s.id
          })
          
          if (res.sucesso) processados++
          else erros++
        }
      }

      console.log(`✅ Sincronização concluída: ${processados} sucessos, ${erros} erros.`)
      return { processados, erros }
    } catch (error) {
      console.error("💥 Erro na sincronização:", error)
      return { processados: 0, erros: 0 }
    }
  }

  private static getMetricasVazias(): EconomiaMetricas {
    return {
      totalEconomizado: 0,
      totalCasos: 0,
      economiaMaxima: 0,
      economiaOperacional: 0,
      desperdicioEvitado: 0,
      porSolicitante: [],
    }
  }
}
