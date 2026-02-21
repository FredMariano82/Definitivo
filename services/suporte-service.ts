import { supabase } from "@/lib/supabase"
import type { DadosMigracao } from "@/types"

export class SuporteService {
  // 📥 DOWNLOAD MODELO EXCEL - FORMATO BRASILEIRO
  static async downloadModeloExcel(): Promise<void> {
    try {
      // Importar XLSX dinamicamente
      const XLSX = await import("xlsx")

      // Criar workbook
      const wb = XLSX.utils.book_new()

      // Dados do modelo (cabeçalhos + linha de exemplo) - FORMATO BRASILEIRO
      const dadosModelo = [
        // Cabeçalhos
        [
          "Departamento",
          "Data Solicitação",
          "Nome",
          "Documento",
          "Documento2",
          "Empresa",
          "Data Inicial",
          "Data Final",
        ],
        // Linha de exemplo - DATAS EM FORMATO BRASILEIRO
        [
          "TI",
          "15/01/2025",
          "João Silva",
          "12.345.678-9",
          "123.456.789-00",
          "Empresa ABC Ltda",
          "01/01/2025",
          "31/12/2025",
        ],
        // Linha vazia para preenchimento
        ["", "", "", "", "", "", "", ""],
      ]

      // Criar worksheet
      const ws = XLSX.utils.aoa_to_sheet(dadosModelo)

      // Definir larguras das colunas
      ws["!cols"] = [
        { wch: 15 }, // Departamento
        { wch: 15 }, // Data Solicitação
        { wch: 25 }, // Nome
        { wch: 15 }, // Documento
        { wch: 18 }, // Documento2
        { wch: 25 }, // Empresa
        { wch: 15 }, // Data Inicial
        { wch: 15 }, // Data Final
      ]

      // Adicionar worksheet ao workbook
      XLSX.utils.book_append_sheet(wb, ws, "Modelo Migração")

      // Gerar arquivo como buffer
      const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" })

      // Criar blob e fazer download
      const blob = new Blob([excelBuffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      })

      // Criar URL temporária e fazer download
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `modelo-migracao-suporte-${new Date().toLocaleDateString("pt-BR").replace(/\//g, "-")}.xlsx`

      // Adicionar ao DOM, clicar e remover
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      // Limpar URL temporária
      window.URL.revokeObjectURL(url)

      console.log("✅ Modelo Excel baixado com sucesso!")
    } catch (error) {
      console.error("❌ Erro ao gerar modelo Excel:", error)
      throw new Error("Erro ao gerar modelo Excel")
    }
  }

  // 🔄 MIGRAR DADOS EM LOTE
  static async migrarDadosLote(dados: DadosMigracao[]): Promise<{
    sucesso: boolean
    erro: string
    totalProcessados: number
    totalSucesso: number
    totalErros: number
    detalhesErros: string[]
  }> {
    try {
      console.log(`🔄 SUPORTE - Iniciando migração de ${dados.length} registros...`)

      if (!supabase) {
        return {
          sucesso: false,
          erro: "Erro de configuração do banco de dados",
          totalProcessados: 0,
          totalSucesso: 0,
          totalErros: dados.length,
          detalhesErros: ["Supabase não inicializado"],
        }
      }

      let totalSucesso = 0
      let totalErros = 0
      const detalhesErros: string[] = []

      // Processar em lotes de 50 para evitar timeout
      const batchSize = 50

      for (let i = 0; i < dados.length; i += batchSize) {
        const lote = dados.slice(i, i + batchSize)
        console.log(
          `📦 SUPORTE - Processando lote ${Math.floor(i / batchSize) + 1}/${Math.ceil(dados.length / batchSize)}`,
        )

        for (const item of lote) {
          try {
            const resultado = await this.migrarItemIndividual(item)
            if (resultado.sucesso) {
              totalSucesso++
            } else {
              totalErros++
              detalhesErros.push(`Linha ${i + lote.indexOf(item) + 1}: ${resultado.erro}`)
            }
          } catch (error: any) {
            totalErros++
            detalhesErros.push(`Linha ${i + lote.indexOf(item) + 1}: ${error.message}`)
          }
        }
      }

      console.log(`✅ SUPORTE - Migração concluída: ${totalSucesso} sucessos, ${totalErros} erros`)

      return {
        sucesso: totalSucesso > 0,
        erro: totalErros > 0 ? `${totalErros} registros falharam` : "",
        totalProcessados: dados.length,
        totalSucesso,
        totalErros,
        detalhesErros,
      }
    } catch (error: any) {
      console.error("💥 SUPORTE - Erro na migração em lote:", error)
      return {
        sucesso: false,
        erro: `Erro interno: ${error.message}`,
        totalProcessados: dados.length,
        totalSucesso: 0,
        totalErros: dados.length,
        detalhesErros: [error.message],
      }
    }
  }

  // 🔄 MIGRAR ITEM INDIVIDUAL - FORMATO BRASILEIRO
  private static async migrarItemIndividual(item: DadosMigracao): Promise<{
    sucesso: boolean
    erro: string
  }> {
    try {
      // 1️⃣ VALIDAR APENAS SE TEM DADOS MÍNIMOS
      if (!item.nome && !item.documento) {
        return {
          sucesso: false,
          erro: "Nome ou documento são obrigatórios",
        }
      }

      const duplicata = await this.verificarDuplicata(item.documento, item.documento2)
      if (duplicata) {
        return {
          sucesso: false,
          erro: `Documento já existe: ${duplicata}`,
        }
      }

      // 2️⃣ GERAR NÚMERO DA SOLICITAÇÃO
      const numeroSolicitacao = await this.gerarNumeroSolicitacao()

      // 3️⃣ CALCULAR CAMPOS AUTOMÁTICOS - FORMATO BRASILEIRO
      const checagemValidaAte = this.calcularValidadeChecagemBR(item.dataSolicitacao)
      const cadastro = item.dataFinal ? "ok" : null

      // 4️⃣ CONVERTER DATAS PARA ISO APENAS PARA O BANCO
      const dataSolicitacaoISO = this.converterBRParaISO(item.dataSolicitacao)
      const dataInicialISO = this.converterBRParaISO(item.dataInicial)
      const dataFinalISO = this.converterBRParaISO(item.dataFinal)
      const checagemValidaAteISO = this.converterBRParaISO(checagemValidaAte)

      // 5️⃣ CRIAR SOLICITAÇÃO
      const { data: solicitacao, error: solicitacaoError } = await supabase
        .from("solicitacoes")
        .insert([
          {
            numero: numeroSolicitacao,
            solicitante: item.solicitante || "Suporte Sistema",
            departamento: item.departamento || "Migração",
            data_solicitacao: dataSolicitacaoISO || new Date().toISOString().split("T")[0],
            hora_solicitacao: "00:00:00",
            tipo_solicitacao: "checagem_liberacao",
            finalidade: "obra",
            local: "Migração Histórica",
            empresa: item.empresa || "Não informado",
            data_inicial: dataInicialISO || dataSolicitacaoISO || new Date().toISOString().split("T")[0],
            data_final: dataFinalISO || dataInicialISO || dataSolicitacaoISO || new Date().toISOString().split("T")[0],
            status_geral: "aprovado",
            custo_checagem: 0,
            economia_gerada: 0,
            usuario_id: null,
          },
        ])
        .select()
        .single()

      if (solicitacaoError) {
        console.error("❌ SUPORTE - Erro ao criar solicitação:", solicitacaoError)
        return {
          sucesso: false,
          erro: `Erro na solicitação: ${solicitacaoError.message}`,
        }
      }

      // 6️⃣ CRIAR PRESTADOR
      const { error: prestadorError } = await supabase.from("prestadores").insert([
        {
          solicitacao_id: solicitacao.id,
          nome: item.nome,
          documento: item.documento,
          documento2: item.documento2 || null,
          empresa: item.empresa,
          status: "aprovado",
          cadastro: cadastro,
          checagem_valida_ate: checagemValidaAteISO,
          aprovado_por: "Migração Suporte",
          data_avaliacao: new Date().toISOString(),
          justificativa: "Dados migrados pelo suporte",
        },
      ])

      if (prestadorError) {
        console.error("❌ SUPORTE - Erro ao criar prestador:", prestadorError)
        // Reverter solicitação criada
        await supabase.from("solicitacoes").delete().eq("id", solicitacao.id)
        return {
          sucesso: false,
          erro: `Erro no prestador: ${prestadorError.message}`,
        }
      }

      console.log(`✅ SUPORTE - Item migrado: ${item.nome} (${numeroSolicitacao})`)
      return { sucesso: true, erro: "" }
    } catch (error: any) {
      console.error("💥 SUPORTE - Erro ao migrar item:", error)
      return {
        sucesso: false,
        erro: `Erro interno: ${error.message}`,
      }
    }
  }

  // 🔍 VERIFICAR DUPLICATAS
  private static async verificarDuplicata(documento: string, documento2?: string): Promise<string | null> {
    try {
      if (!documento) return null

      // Verificar documento principal
      const { data: prestador1 } = await supabase
        .from("prestadores")
        .select("documento")
        .or(`documento.eq.${documento},documento2.eq.${documento}`)
        .limit(1)

      if (prestador1 && prestador1.length > 0) {
        return documento
      }

      // Verificar documento2 se existir
      if (documento2) {
        const { data: prestador2 } = await supabase
          .from("prestadores")
          .select("documento2")
          .or(`documento.eq.${documento2},documento2.eq.${documento2}`)
          .limit(1)

        if (prestador2 && prestador2.length > 0) {
          return documento2
        }
      }

      return null
    } catch (error) {
      console.error("❌ SUPORTE - Erro ao verificar duplicata:", error)
      return null
    }
  }

  // 🔢 GERAR NÚMERO DA SOLICITAÇÃO
  private static async gerarNumeroSolicitacao(): Promise<string> {
    try {
      const ano = new Date().getFullYear()

      // Buscar último número do ano atual
      const { data: ultimaSolicitacao } = await supabase
        .from("solicitacoes")
        .select("numero")
        .like("numero", `${ano}-%`)
        .order("numero", { ascending: false })
        .limit(1)

      let proximoNumero = 1
      if (ultimaSolicitacao && ultimaSolicitacao.length > 0) {
        try {
          const ultimoNumero = ultimaSolicitacao[0].numero
          const numeroAtual = Number.parseInt(ultimoNumero.split("-")[1])
          proximoNumero = numeroAtual + 1
        } catch {
          proximoNumero = 1
        }
      }

      return `${ano}-${proximoNumero.toString().padStart(6, "0")}`
    } catch (error) {
      console.error("❌ SUPORTE - Erro ao gerar número:", error)
      const ano = new Date().getFullYear()
      const random = Math.floor(Math.random() * 1000)
      return `${ano}-${random.toString().padStart(6, "0")}`
    }
  }

  // 📅 CALCULAR VALIDADE DA CHECAGEM (+ 6 MESES) - FORMATO BRASILEIRO
  private static calcularValidadeChecagemBR(dataSolicitacao: string): string {
    try {
      if (!dataSolicitacao) {
        // Se não tem data, usar hoje + 6 meses
        const hoje = new Date()
        hoje.setMonth(hoje.getMonth() + 6)
        return hoje.toLocaleDateString("pt-BR")
      }

      // Converter data brasileira para Date
      const data = this.converterBRParaDate(dataSolicitacao)
      if (data) {
        data.setMonth(data.getMonth() + 6)
        return data.toLocaleDateString("pt-BR")
      }

      // Fallback
      const hoje = new Date()
      hoje.setMonth(hoje.getMonth() + 6)
      return hoje.toLocaleDateString("pt-BR")
    } catch (error) {
      console.error("❌ SUPORTE - Erro ao calcular validade:", error)
      const hoje = new Date()
      hoje.setMonth(hoje.getMonth() + 6)
      return hoje.toLocaleDateString("pt-BR")
    }
  }

  // 📊 PROCESSAR EXCEL PARA MIGRAÇÃO - MANTÉM FORMATO BRASILEIRO
  static async processarExcelMigracao(
    arquivo: File,
    solicitante: string,
  ): Promise<{
    sucesso: boolean
    erro: string
    dados: DadosMigracao[]
    totalProcessados: number
  }> {
    try {
      console.log("📊 SUPORTE - Processando Excel para migração...")

      const XLSX = await import("xlsx")
      const buffer = await arquivo.arrayBuffer()
      const workbook = XLSX.read(buffer, { type: "array", cellDates: true })
      const sheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[sheetName]

      // Converter para JSON mantendo as datas
      const dadosRaw = XLSX.utils.sheet_to_json(worksheet, {
        header: 1,
        raw: false,
        dateNF: "dd/mm/yyyy",
      }) as any[][]

      if (dadosRaw.length < 2) {
        return {
          sucesso: false,
          erro: "Arquivo deve ter pelo menos 2 linhas (cabeçalho + dados)",
          dados: [],
          totalProcessados: 0,
        }
      }

      const cabecalho = dadosRaw[0].map((col: any) => String(col).toLowerCase().trim())
      console.log("📋 SUPORTE - Cabeçalho encontrado:", cabecalho)

      // Mapear colunas
      const colunas = {
        departamento: this.encontrarColuna(cabecalho, ["departamento", "dept", "department", "setor"]),
        dataSolicitacao: this.encontrarColuna(cabecalho, [
          "data solicitacao",
          "data_solicitacao",
          "data solicitação",
          "data",
          "data solic",
          "solicitacao",
          "solicitação",
        ]),
        nome: this.encontrarColuna(cabecalho, ["nome", "name", "prestador"]),
        documento: this.encontrarColuna(cabecalho, ["documento", "doc1", "rg", "doc"]),
        documento2: this.encontrarColuna(cabecalho, ["documento2", "doc2", "cpf", "cnh"]),
        empresa: this.encontrarColuna(cabecalho, ["empresa", "company", "emp"]),
        dataInicial: this.encontrarColuna(cabecalho, ["data inicial", "data_inicial", "inicio", "data inicio"]),
        dataFinal: this.encontrarColuna(cabecalho, ["data final", "data_final", "fim", "data fim"]),
      }

      console.log("🔍 SUPORTE - Índices das colunas:", colunas)

      const dados: DadosMigracao[] = []

      // Processar dados - MANTÉM FORMATO BRASILEIRO
      for (let i = 1; i < dadosRaw.length; i++) {
        const linha = dadosRaw[i]
        if (!linha || linha.length === 0) continue

        try {
          const valorDataSolicitacao = this.extrairValor(linha, colunas.dataSolicitacao)
          const dataFormatadaBR = this.manterFormatoBrasileiro(valorDataSolicitacao)

          console.log(`🔍 SUPORTE - Linha ${i + 1}: "${valorDataSolicitacao}" -> "${dataFormatadaBR}"`)

          const item: DadosMigracao = {
            solicitante,
            departamento: this.extrairValor(linha, colunas.departamento) || "",
            dataSolicitacao: dataFormatadaBR || "",
            nome: this.extrairValor(linha, colunas.nome) || "",
            documento: this.extrairValor(linha, colunas.documento) || "",
            documento2: this.extrairValor(linha, colunas.documento2) || undefined,
            empresa: this.extrairValor(linha, colunas.empresa) || "",
            dataInicial: this.manterFormatoBrasileiro(this.extrairValor(linha, colunas.dataInicial)) || "",
            dataFinal: this.manterFormatoBrasileiro(this.extrairValor(linha, colunas.dataFinal)) || undefined,
            status: "aprovado",
            checagemValidaAte: "",
          }

          // VALIDAÇÃO MÍNIMA
          const temAlgumDado = item.nome || item.documento || item.empresa || item.departamento

          if (temAlgumDado) {
            dados.push(item)
            console.log(`✅ SUPORTE - Linha ${i + 1} processada:`, {
              nome: item.nome,
              dataSolicitacao: item.dataSolicitacao,
              departamento: item.departamento,
            })
          } else {
            console.warn(`⚠️ SUPORTE - Linha ${i + 1} ignorada - completamente vazia`)
          }
        } catch (error) {
          console.error(`❌ SUPORTE - Erro na linha ${i + 1}:`, error)
        }
      }

      console.log(`✅ SUPORTE - Processamento concluído: ${dados.length} registros válidos`)

      return {
        sucesso: true,
        erro: "",
        dados,
        totalProcessados: dados.length,
      }
    } catch (error: any) {
      console.error("💥 SUPORTE - Erro ao processar Excel:", error)
      return {
        sucesso: false,
        erro: `Erro ao processar arquivo: ${error.message}`,
        dados: [],
        totalProcessados: 0,
      }
    }
  }

  // 🔧 FUNÇÕES AUXILIARES
  private static encontrarColuna(cabecalho: string[], possiveisNomes: string[]): number {
    for (const nome of possiveisNomes) {
      const index = cabecalho.findIndex((col) => col.includes(nome))
      if (index !== -1) {
        console.log(`✅ SUPORTE - Coluna "${nome}" encontrada no índice ${index}`)
        return index
      }
    }
    console.warn(`⚠️ SUPORTE - Nenhuma coluna encontrada para: ${possiveisNomes.join(", ")}`)
    return -1
  }

  private static extrairValor(linha: any[], indice: number): string {
    if (indice === -1 || linha[indice] === undefined || linha[indice] === null) return ""
    return String(linha[indice]).trim()
  }

  // 🇧🇷 MANTER FORMATO BRASILEIRO
  private static manterFormatoBrasileiro(valor: string): string {
    if (!valor || valor.trim() === "") return ""

    try {
      console.log(`🇧🇷 SUPORTE - Mantendo formato brasileiro: "${valor}"`)

      // Se já está no formato DD/MM/YYYY, manter
      if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(valor)) {
        console.log(`✅ SUPORTE - Data já em formato brasileiro: ${valor}`)
        return valor
      }

      // Se está no formato ISO (YYYY-MM-DD), converter para brasileiro
      if (/^\d{4}-\d{2}-\d{2}$/.test(valor)) {
        const [ano, mes, dia] = valor.split("-")
        const dataBR = `${dia}/${mes}/${ano}`
        console.log(`✅ SUPORTE - Data ISO convertida para BR: ${valor} -> ${dataBR}`)
        return dataBR
      }

      // Tentar como data JavaScript e converter para brasileiro
      const data = new Date(valor)
      if (!isNaN(data.getTime())) {
        const dataBR = data.toLocaleDateString("pt-BR")
        console.log(`✅ SUPORTE - Data JS convertida para BR: ${valor} -> ${dataBR}`)
        return dataBR
      }

      console.warn(`⚠️ SUPORTE - Não foi possível formatar a data: "${valor}"`)
      return valor
    } catch (error) {
      console.error(`❌ SUPORTE - Erro ao formatar data "${valor}":`, error)
      return valor
    }
  }

  // 🔄 CONVERTER BR PARA ISO (APENAS PARA O BANCO)
  private static converterBRParaISO(dataBR: string): string {
    if (!dataBR) return ""

    try {
      // Se já está no formato ISO
      if (/^\d{4}-\d{2}-\d{2}$/.test(dataBR)) {
        return dataBR
      }

      // Formato brasileiro DD/MM/YYYY
      if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(dataBR)) {
        const [dia, mes, ano] = dataBR.split("/")
        return `${ano}-${mes.padStart(2, "0")}-${dia.padStart(2, "0")}`
      }

      return ""
    } catch (error) {
      console.error(`❌ SUPORTE - Erro ao converter BR para ISO: "${dataBR}"`, error)
      return ""
    }
  }

  // 🔄 CONVERTER BR PARA DATE
  private static converterBRParaDate(dataBR: string): Date | null {
    if (!dataBR) return null

    try {
      // Formato brasileiro DD/MM/YYYY
      if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(dataBR)) {
        const [dia, mes, ano] = dataBR.split("/")
        return new Date(Number(ano), Number(mes) - 1, Number(dia))
      }

      return null
    } catch (error) {
      console.error(`❌ SUPORTE - Erro ao converter BR para Date: "${dataBR}"`, error)
      return null
    }
  }
}
