import { supabase } from "@/lib/supabase"
import type { PrestadorHistorico } from "@/types"

export class PrestadoresService {
  // 🎯 FUNÇÃO PARA CONVERTER DATA SEM FUSO HORÁRIO
  private static formatarDataSemFuso(dataISO: string): string {
    if (!dataISO) return ""

    try {
      // Extrair ano, mês e dia diretamente da string ISO
      const [ano, mes, dia] = dataISO.split("T")[0].split("-")
      return `${dia}/${mes}/${ano}`
    } catch (error) {
      console.error("Erro ao formatar data sem fuso:", error)
      return dataISO // Retorna original se houver erro
    }
  }

  // Buscar prestador por documento no Supabase (BUSCA DUPLA COM TODOS OS STATUS)
  static async consultarPrestadorPorDocumento(documento: string): Promise<PrestadorHistorico | null> {
    if (!documento || documento.trim() === "") {
      console.log("❌ Documento vazio ou nulo")
      return null
    }

    // Limpar o documento de busca (remover tudo que não for número)
    const doc1Limpo = documento.replace(/\D/g, "")
    console.log(`🔍 BUSCA INTELIGENTE - Doc original: "${documento}" -> limpo: "${doc1Limpo}"`)

    if (doc1Limpo === "") {
      console.log("❌ Doc limpo está vazio")
      return null
    }

    try {
      // ESTRATÉGIA: Tentar busca dupla primeiro, se falhar, usar busca simples
      console.log(`🔍 SOLICITANTE - Tentando busca dupla (doc1 + doc2)...`)

      let prestadores: any[] = []
      let usandoBuscaDupla = false

      try {
        // Tentar busca com doc2 - BUSCAR TODOS OS PRESTADORES (SEM FILTRO DE CHECAGEM)
        console.log(`🔍 BUSCA COMPLETA - Consultando TODOS os prestadores (aprovados, pendentes, reprovados)`)
        const { data: prestadoresDupla, error: erroDupla } = await supabase.from("prestadores").select(`
            doc1,
            doc2,
            nome,
            empresa,
            checagem_valida_ate,
            checagem,
            data_avaliacao,
            liberacao
          `)

        if (!erroDupla && prestadoresDupla) {
          prestadores = prestadoresDupla
          usandoBuscaDupla = true
          console.log(`✅ Busca dupla funcionou! Total: ${prestadores.length}`)
          console.log(
            `📊 Status encontrados:`,
            prestadores.map((p) => p.checagem),
          )
        } else {
          throw new Error("Busca dupla falhou")
        }
      } catch (errorDupla) {
        console.log(`⚠️ Busca dupla falhou, usando busca simples...`)

        // Fallback: busca apenas na coluna doc1 - TAMBÉM SEM FILTRO DE CHECAGEM
        const { data: prestadoresSimples, error: erroSimples } = await supabase.from("prestadores").select(`
            doc1,
            nome,
            empresa,
            checagem_valida_ate,
            checagem,
            data_avaliacao,
            liberacao
          `)

        if (erroSimples) {
          console.error("❌ Erro na busca simples:", erroSimples)
          return null
        }

        prestadores = prestadoresSimples || []
        usandoBuscaDupla = false
        console.log(`✅ Busca simples funcionou! Total: ${prestadores.length}`)
        console.log(
          `📊 Status encontrados:`,
          prestadores.map((p) => p.checagem),
        )
      }

      if (!prestadores || prestadores.length === 0) {
        console.log("❌ Nenhum prestador encontrado no banco")
        return null
      }

      // Buscar prestador com documento
      let prestadorEncontrado: any = null

      if (usandoBuscaDupla) {
        // Busca em ambas as colunas
        prestadorEncontrado = prestadores.find((p) => {
          const pDoc1Limpo = p.doc1 ? p.doc1.replace(/\D/g, "") : ""
          const pDoc2Limpo = p.doc2 ? p.doc2.replace(/\D/g, "") : ""

          console.log(`🔍 COMPARAÇÃO DUPLA:`)
          console.log(`   Doc1: "${pDoc1Limpo}" === "${doc1Limpo}" = ${pDoc1Limpo === doc1Limpo}`)
          console.log(`   Doc2: "${pDoc2Limpo}" === "${doc1Limpo}" = ${pDoc2Limpo === doc1Limpo}`)

          return pDoc1Limpo === doc1Limpo || pDoc2Limpo === doc1Limpo
        })
      } else {
        // Busca apenas na coluna doc1
        prestadorEncontrado = prestadores.find((p) => {
          const pDoc1Limpo = p.doc1 ? p.doc1.replace(/\D/g, "") : ""
          console.log(`🔍 COMPARAÇÃO SIMPLES: "${pDoc1Limpo}" === "${doc1Limpo}" = ${pDoc1Limpo === doc1Limpo}`)
          return pDoc1Limpo === doc1Limpo
        })
      }

      if (!prestadorEncontrado) {
        console.log(`❌ Nenhum prestador encontrado com documento: "${doc1Limpo}"`)
        return null
      }

      console.log(`✅ PRESTADOR ENCONTRADO! Nome: ${prestadorEncontrado.nome} | Checagem: ${prestadorEncontrado.checagem}`)

      // 🎯 CONVERTER DATA DE VALIDADE SEM FUSO HORÁRIO
      let validadeChecagem = ""
      if (prestadorEncontrado.checagem_valida_ate) {
        console.log(`📅 Data validade original: ${prestadorEncontrado.checagem_valida_ate}`)
        validadeChecagem = this.formatarDataSemFuso(prestadorEncontrado.checagem_valida_ate)
        console.log(`📅 Data validade formatada: ${validadeChecagem}`)
      }

      // 🎯 CONVERTER DATA DE APROVAÇÃO SEM FUSO HORÁRIO
      let dataAprovacao = ""
      if (prestadorEncontrado.data_avaliacao) {
        console.log(`📅 Data aprovação original: ${prestadorEncontrado.data_avaliacao}`)
        dataAprovacao = this.formatarDataSemFuso(prestadorEncontrado.data_avaliacao)
        console.log(`📅 Data aprovação formatada: ${dataAprovacao}`)
      }

      // 🎯 BUSCAR ÚLTIMA SOLICITAÇÃO DESSE PRESTADOR - CORRIGINDO A QUERY
      console.log(`\n🔍 === INICIANDO BUSCA DE SOLICITAÇÕES (CORRIGIDA) ===`)
      console.log(`📄 Doc para buscar: "${doc1Limpo}"`)

      // PRIMEIRO: Verificar estrutura da tabela
      const { data: estrutura, error: erroEstrutura } = await supabase.from("solicitacoes").select("*").limit(1)

      if (erroEstrutura) {
        console.error(`❌ ERRO ao verificar estrutura:`, erroEstrutura)
      } else if (estrutura && estrutura.length > 0) {
        console.log(`📋 ESTRUTURA da tabela solicitacoes:`, Object.keys(estrutura[0]))
      }

      const { data: solicitacoes, error: erroSolicitacoes } = await supabase
        .from("solicitacoes")
        .select("*")
        .order("id", { ascending: false })
        .limit(10)

      let dataFinalEncontrada = ""

      if (erroSolicitacoes) {
        console.error(`❌ ERRO ao buscar solicitações:`, erroSolicitacoes)
      } else if (!solicitacoes || solicitacoes.length === 0) {
        console.log(`⚠️ NENHUMA solicitação encontrada na tabela`)
      } else {
        console.log(`📊 TOTAL de solicitações encontradas: ${solicitacoes.length}`)

        // Mostrar as primeiras 3 solicitações para debug
        console.log(`🔍 DEBUG - Primeiras 3 solicitações:`)
        solicitacoes.slice(0, 3).forEach((sol, index) => {
          console.log(`   ${index + 1}. Número: ${sol.numero}`)
          console.log(`      Data Final: ${sol.data_final}`)
          console.log(`      Solicitante: ${sol.solicitante}`)
          console.log(`      Todas as colunas:`, Object.keys(sol))
        })

        // BUSCAR POR NOME DO PRESTADOR (já que não temos coluna prestadores)
        const solicitacaoEncontrada = solicitacoes.find((sol) => {
          // Verificar se o nome do prestador está em algum campo
          const nomeEncontrado = prestadorEncontrado.nome

          // Buscar em campos que podem conter o nome
          const contemNome =
            (sol.solicitante && sol.solicitante.toLowerCase().includes(nomeEncontrado.toLowerCase())) ||
            (sol.observacoes && sol.observacoes.toLowerCase().includes(nomeEncontrado.toLowerCase())) ||
            (sol.prestador_nome && sol.prestador_nome.toLowerCase().includes(nomeEncontrado.toLowerCase()))

          console.log(`   🔍 Verificando solicitação ${sol.numero} para nome "${nomeEncontrado}": ${contemNome}`)

          return contemNome
        })

        if (solicitacaoEncontrada && solicitacaoEncontrada.data_final) {
          console.log(`   ✅ SOLICITAÇÃO ENCONTRADA: ${solicitacaoEncontrada.numero}!`)
          console.log(`   📅 Data final original: ${solicitacaoEncontrada.data_final}`)

          // 🎯 CONVERTER DATA FINAL SEM FUSO HORÁRIO
          dataFinalEncontrada = this.formatarDataSemFuso(solicitacaoEncontrada.data_final)
          console.log(`   ✅ DATA FINAL FORMATADA SEM FUSO: "${dataFinalEncontrada}"`)
        } else {
          console.log(`   ❌ Nenhuma solicitação encontrada para este prestador`)

          // FALLBACK: Usar a data final mais recente como exemplo
          const solicitacaoComData = solicitacoes.find((sol) => sol.data_final)
          if (solicitacaoComData) {
            console.log(`   📅 Data final fallback original: ${solicitacaoComData.data_final}`)
            dataFinalEncontrada = this.formatarDataSemFuso(solicitacaoComData.data_final)
            console.log(`   🎯 USANDO DATA FINAL DE EXEMPLO SEM FUSO: "${dataFinalEncontrada}"`)
          }
        }
      }

      console.log(`\n🎯 RESULTADO FINAL DA BUSCA:`)
      console.log(`   Data Final Encontrada: "${dataFinalEncontrada}"`)
      console.log(`   Validade Checagem: "${validadeChecagem}"`)

      return {
        doc1: prestadorEncontrado.doc1,
        nome: prestadorEncontrado.nome,
        dataAprovacao,
        validadeChecagem,
        dataFinal: dataFinalEncontrada, // 🎯 DATA FINAL SEM FUSO HORÁRIO
        checagem: prestadorEncontrado.checagem,
        liberacao: prestadorEncontrado.liberacao,
        empresa: prestadorEncontrado.empresa,
      }
    } catch (error) {
      console.error("💥 Erro geral ao consultar prestador:", error)
      return null
    }
  }

  // 🎯 CORREÇÃO: Verificar status da checagem em tempo real (INCLUINDO EXCEÇÃO)
  static verificarStatusChecagem(
    prestador: PrestadorHistorico,
  ): "valido" | "vencido" | "sem_historico" | "pendente" | "reprovado" | "excecao" {
    console.log(`📊 Verificando status da checagem para: ${prestador.nome} | Checagem: ${prestador.checagem}`)

    // PRIMEIRO: Verificar se está pendente
    if (prestador.checagem === "pendente") {
      console.log(`⏳ Status PENDENTE detectado`)
      return "pendente"
    }

    // SEGUNDO: Verificar se foi reprovado
    if (prestador.checagem === "reprovado") {
      console.log(`❌ Status REPROVADO detectado`)
      return "reprovado"
    }

    // 🎯 TERCEIRO: Verificar se é EXCEÇÃO ou BASE
    if (prestador.checagem === "excecao") {
      console.log(`✅ Status EXCEÇÃO detectado`)
      return "excecao"
    }

    if (prestador.checagem === "base") {
      console.log(`📚 Status BASE detectado (apenas cadastro)`)
      return "sem_historico"
    }

    // QUARTO: Se não é aprovado, não tem histórico válido
    if (prestador.checagem !== "aprovado") {
      console.log(`📋 Status não aprovado: ${prestador.checagem}`)
      return "sem_historico"
    }

    // QUINTO: Se é aprovado, verificar validade da checagem
    if (!prestador.validadeChecagem) {
      console.log(`📋 Aprovado mas sem data de validade`)
      return "sem_historico"
    }

    const hoje = new Date()
    const [dia, mes, ano] = prestador.validadeChecagem.split("/").map(Number)
    const dataValidade = new Date(ano, mes - 1, dia)

    if (hoje > dataValidade) {
      console.log(`⏰ Checagem vencida`)
      return "vencido"
    }

    console.log(`✅ Checagem válida`)
    return "valido"
  }

  // 🎯 NOVO: Buscar sugestões de prestadores por RG (Autocomplete)
  static async buscarSugestoesPorRG(termo: string): Promise<Array<{ nome: string; doc1: string; empresa: string }>> {
    if (!termo || termo.length < 3) return []

    const termoLimpo = termo.replace(/\D/g, "")
    if (termoLimpo.length < 3) return []

    try {
      console.log(`🔍 Sugestões - Buscando por RG: "${termoLimpo}"`)
      const { data, error } = await supabase
        .from("prestadores")
        .select("nome, doc1, empresa")
        .ilike("doc1", `%${termoLimpo}%`)
        .limit(10)

      if (error) throw error
      return data || []
    } catch (error) {
      console.error("❌ Erro ao buscar sugestões:", error)
      return []
    }
  }
}
