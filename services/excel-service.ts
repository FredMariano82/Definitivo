
import * as XLSX from "xlsx"
import Papa from "papaparse"
import { supabase } from "@/lib/supabase"

export interface PrestadorExcelADM {
  id?: string // Matrícula ou ID
  nome: string
  doc1: string
  doc2?: string
  empresa: string
  cargo?: string // Novo campo
  observacoes?: string // Novo campo
  validaAte: string // Data de validade da checagem
  dataInicial: string // Data inicial do último acesso
  dataFinal: string // Data final do último acesso
  checagem: "aprovado" | "reprovado" | "pendente" | "excecao"
  liberacao: "ok" | "vencida" | "pendente" | "urgente"
}

export interface PrestadorExcelSolicitante {
  nome: string
  doc1: string
  doc2?: string
  empresa: string
}

export class ExcelService {
  // 📊 PROCESSAR CSV PARA ADM (Histórico Completo)
  static async processarCsvADM(arquivo: File): Promise<{
    sucesso: boolean
    erro: string
    prestadores: PrestadorExcelADM[]
    totalProcessados: number
    cabecalho?: string[]
  }> {
    return new Promise((resolve) => {
      console.log("📊 ADM - Processando arquivo CSV para histórico...")

      Papa.parse(arquivo, {
        header: true,
        skipEmptyLines: true,
        encoding: "UTF-8", // Tentar UTF-8 primeiro
        transformHeader: (header) => header.toLowerCase().trim(),
        complete: async (results) => {
          if (results.errors.length > 0) {
            console.warn("⚠️ ADM - Erros de parsing CSV:", results.errors)
          }

          const dados = results.data as any[]
          if (dados.length === 0) {
            resolve({
              sucesso: false,
              erro: "Arquivo CSV vazio ou inválido",
              prestadores: [],
              totalProcessados: 0,
              cabecalho: [],
            })
            return
          }

          // Obter cabeçalhos do primeiro objeto
          const cabecalho = Object.keys(dados[0])
          console.log("📋 ADM - Cabeçalho CSV detectado:", cabecalho)

          // Mapear colunas (mesma lógica do Excel)
          const colunas = {
            id: this.encontrarColuna(cabecalho, ["id", "matricula", "matrícula", "código"]),
            nome: this.encontrarColuna(cabecalho, ["nome", "name", "prestador", "usuario", "usuário"]),
            doc1: this.encontrarColuna(cabecalho, ["doc1", "documento", "rg", "document", "cpf", "cpf/cnpj"]),
            doc2: this.encontrarColuna(cabecalho, ["doc2", "documento2", "cnh"]),
            empresa: this.encontrarColuna(cabecalho, ["empresa", "company"]),
            cargo: this.encontrarColuna(cabecalho, ["cargo", "funcao", "função", "role"]),
            observacoes: this.encontrarColuna(cabecalho, ["observacoes", "observações", "obs", "notes", "observacao", "observação"]),
            validaAte: this.encontrarColuna(cabecalho, ["valida ate", "válida até", "validade", "valid until", "expiracao", "expiração"]),
            dataInicial: this.encontrarColuna(cabecalho, ["data inicial", "inicio", "start date", "liberacao", "liberação"]),
            dataFinal: this.encontrarColuna(cabecalho, ["data final", "fim", "end date"]),
            checagem: this.encontrarColuna(cabecalho, ["checagem", "status", "status checagem"]),
            liberacao: this.encontrarColuna(cabecalho, ["liberacao", "liberação", "cadastro", "status liberação"]),
          }

          console.log("🗂️ ADM - Mapeamento de colunas CSV:", colunas)

          // Verificar colunas obrigatórias (REMOVIDO A PEDIDO: Regras relaxadas)
          // const colunasObrigatorias = ["nome", "documento", "empresa", "status", "cadastro"]
          // const colunasPerdidas = colunasObrigatorias.filter(c => colunas[c as keyof typeof colunas] === -1)

          // if (colunasPerdidas.length > 0) {
          //    resolve({
          //     sucesso: false,
          //     erro: `Colunas obrigatórias não encontradas no CSV: ${ colunasPerdidas.join(", ") } `,
          //     prestadores: [],
          //     totalProcessados: 0,
          //   })
          //   return
          // }

          const prestadores: PrestadorExcelADM[] = []

          // Processar linhas
          dados.forEach((linha: any, index) => {
            // Função helper para pegar valor da chave mapeada
            const getVal = (keyMap: number) => {
              if (keyMap === -1) return ""
              const realKey = cabecalho[keyMap]
              return String(linha[realKey] || "").trim()
            }

            try {
              // Tentar obter valores, usando defaults se a coluna não existir
              const nomeRaw = getVal(colunas.nome) || "Sem Nome"
              const docRaw = getVal(colunas.doc1)
              const empresaRaw = getVal(colunas.empresa) || "Não Informada"

              // Se não achou coluna de documento, tentar usar a segunda coluna genericamente se disponível
              // ou simplesmente deixar vazio para preencher manualmente
              const documentoFinal = this.limparDoc1(docRaw)

              const prestador: PrestadorExcelADM = {
                id: getVal(colunas.id) || undefined,
                nome: nomeRaw,
                doc1: documentoFinal,
                doc2: this.limparDoc1(getVal(colunas.doc2)) || undefined,
                empresa: empresaRaw,
                cargo: getVal(colunas.cargo) || undefined,
                observacoes: getVal(colunas.observacoes) || undefined,
                validaAte: this.formatarData(getVal(colunas.validaAte)),
                dataInicial: this.formatarData(getVal(colunas.dataInicial)),
                dataFinal: this.formatarData(getVal(colunas.dataFinal)),
                checagem: this.normalizarStatus(getVal(colunas.checagem)), // Default: pendente
                liberacao: this.normalizarCadastro(getVal(colunas.liberacao)), // Default: pendente
              }

              // Validação mínima relaxada: precisa pelo menos ter algum conteúdo
              // Se nome for "Sem Nome" e documento for vazio, provavelmente é linha vazia ou lixo
              if (prestador.nome !== "Sem Nome" || prestador.doc1) {
                prestadores.push(prestador)
              } else {
                console.warn(`⚠️ ADM - Linha CSV ${index + 1} ignorada - sem dados mínimos: `, prestador)
              }

            } catch (error) {
              console.error(`❌ ADM - Erro ao processar linha CSV ${index + 1}: `, error)
            }
          })

          console.log(`✅ ADM - ${prestadores.length} prestadores processados do CSV`)

          resolve({
            sucesso: true,
            erro: "",
            prestadores,
            totalProcessados: prestadores.length,
            cabecalho, // Retornando para debug
          })
        },
        error: (error) => {
          resolve({
            sucesso: false,
            erro: `Erro fatal ao ler CSV: ${error.message} `,
            prestadores: [],
            totalProcessados: 0,
            cabecalho: [],
          })
        }
      })
    })
  }

  // 📊 PROCESSAR EXCEL PARA ADM (Histórico Completo)
  static async processarExcelADM(arquivo: File): Promise<{
    sucesso: boolean
    erro: string
    prestadores: PrestadorExcelADM[]
    totalProcessados: number
    cabecalho?: string[]
  }> {
    try {
      console.log("📊 ADM - Processando arquivo Excel para histórico...")

      const buffer = await arquivo.arrayBuffer()
      const workbook = XLSX.read(buffer, { type: "array" })
      const sheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[sheetName]

      // Converter para JSON
      const dados = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][]

      if (dados.length < 2) {
        return {
          sucesso: false,
          erro: "Arquivo Excel deve ter pelo menos 2 linhas (cabeçalho + dados)",
          prestadores: [],
          totalProcessados: 0,
        }
      }

      // Primeira linha deve ser o cabeçalho
      const cabecalho = dados[0].map((col: any) => String(col).toLowerCase().trim())
      console.log("📋 ADM - Cabeçalho detectado:", cabecalho)

      // Mapear colunas esperadas
      const colunas = {
        id: this.encontrarColuna(cabecalho, ["id", "matricula", "matrícula", "código"]),
        nome: this.encontrarColuna(cabecalho, ["nome", "name", "prestador", "usuario", "usuário"]),
        doc1: this.encontrarColuna(cabecalho, ["doc1", "documento", "rg", "document", "cpf", "cpf/cnpj"]),
        doc2: this.encontrarColuna(cabecalho, ["doc2", "documento2", "cnh"]),
        empresa: this.encontrarColuna(cabecalho, ["empresa", "company"]),
        cargo: this.encontrarColuna(cabecalho, ["cargo", "funcao", "função", "role"]),
        observacoes: this.encontrarColuna(cabecalho, ["observacoes", "observações", "obs", "notes", "observacao", "observação"]),
        validaAte: this.encontrarColuna(cabecalho, ["valida ate", "válida até", "validade", "valid until", "expiracao", "expiração"]),
        dataInicial: this.encontrarColuna(cabecalho, ["data inicial", "inicio", "start date", "liberacao", "liberação"]),
        dataFinal: this.encontrarColuna(cabecalho, ["data final", "fim", "end date"]),
        checagem: this.encontrarColuna(cabecalho, ["checagem", "status"]),
        liberacao: this.encontrarColuna(cabecalho, ["liberacao", "liberação", "cadastro"]),
      }

      console.log("🗂️ ADM - Mapeamento de colunas:", colunas)

      // Verificar colunas obrigatórias (RELAXADO)
      // const colunasObrigatorias = ["nome", "documento", "empresa", "status", "cadastro"]
      // for (const coluna of colunasObrigatorias) {
      //   if (colunas[coluna as keyof typeof colunas] === -1) {
      //     return {
      //       sucesso: false,
      //       erro: `Coluna obrigatória não encontrada: ${ coluna } `,
      //       prestadores: [],
      //       totalProcessados: 0,
      //     }
      //   }
      // }

      const prestadores: PrestadorExcelADM[] = []

      // Processar dados (pular cabeçalho)
      for (let i = 1; i < dados.length; i++) {
        const linha = dados[i]

        if (!linha || linha.length === 0) continue

        try {
          const prestador: PrestadorExcelADM = {
            id: this.extrairValor(linha, colunas.id) || undefined,
            nome: this.extrairValor(linha, colunas.nome) || "Sem Nome",
            doc1: this.limparDoc1(this.extrairValor(linha, colunas.doc1)),
            doc2: this.limparDoc1(this.extrairValor(linha, colunas.doc2)) || undefined,
            empresa: this.extrairValor(linha, colunas.empresa) || "Não Informada",
            cargo: this.extrairValor(linha, colunas.cargo) || undefined,
            observacoes: this.extrairValor(linha, colunas.observacoes) || undefined,
            validaAte: this.formatarData(this.extrairValor(linha, colunas.validaAte)),
            dataInicial: this.formatarData(this.extrairValor(linha, colunas.dataInicial)),
            dataFinal: this.formatarData(this.extrairValor(linha, colunas.dataFinal)),
            checagem: this.normalizarStatus(this.extrairValor(linha, colunas.checagem)),
            liberacao: this.normalizarCadastro(this.extrairValor(linha, colunas.liberacao)),
          }

          // Validar dados obrigatórios (Relaxado)
          if (prestador.nome !== "Sem Nome" || prestador.doc1) {
            prestadores.push(prestador)
          } else {
            console.warn(`⚠️ ADM - Linha ${i + 1} ignorada - dados incompletos: `, prestador)
          }
        } catch (error) {
          console.error(`❌ ADM - Erro na linha ${i + 1}: `, error)
        }
      }

      console.log(`✅ ADM - ${prestadores.length} prestadores processados do Excel`)

      return {
        sucesso: true,
        erro: "",
        prestadores,
        totalProcessados: prestadores.length,
        cabecalho, // Retornando para debug
      }
    } catch (error: any) {
      console.error("💥 ADM - Erro ao processar Excel:", error)
      return {
        sucesso: false,
        erro: `Erro ao processar arquivo: ${error.message} `,
        prestadores: [],
        totalProcessados: 0,
        cabecalho: [],
      }
    }
  }

  // 📝 PROCESSAR EXCEL PARA SOLICITANTE (Lista Nova)
  static async processarExcelSolicitante(arquivo: File): Promise<{
    sucesso: boolean
    erro: string
    prestadores: PrestadorExcelSolicitante[]
    totalProcessados: number
  }> {
    try {
      console.log("📝 SOLICITANTE - Processando arquivo Excel para nova solicitação...")

      const buffer = await arquivo.arrayBuffer()
      const workbook = XLSX.read(buffer, { type: "array" })
      const sheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[sheetName]

      const dados = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][]

      if (dados.length < 2) {
        return {
          sucesso: false,
          erro: "Arquivo Excel deve ter pelo menos 2 linhas (cabeçalho + dados)",
          prestadores: [],
          totalProcessados: 0,
        }
      }

      if (!dados || dados.length === 0 || !dados[0]) {
        return {
          sucesso: false,
          erro: "Arquivo Excel parece estar vazio ou não pôde ser lido corretamente.",
          prestadores: [],
          totalProcessados: 0,
        }
      }

      const cabecalho = (dados[0] || []).map((col: any) => {
        try {
          return col ? String(col).toLowerCase().trim() : ""
        } catch (e) {
          return ""
        }
      })
      console.log("📋 SOLICITANTE - Cabeçalho detectado:", cabecalho)

      let colunas = {
        nome: this.encontrarColuna(cabecalho, ["nome", "name"]),
        doc1: this.encontrarColuna(cabecalho, ["doc1", "documento", "rg", "document"]),
        doc2: this.encontrarColuna(cabecalho, ["doc2", "documento2", "cpf", "cnh"]),
        empresa: this.encontrarColuna(cabecalho, ["empresa", "company"]),
      }

      let pularPrimeiraLinha = true;

      // NOVO: FALLBACK DE SEQUÊNCIA (Se não achou cabeçalhos claros, assume padrão do Clube: 0=Nome, 1=Empresa, 2=Doc1, 3=Doc2)
      if (colunas.nome === -1 && (colunas.doc1 === -1 || colunas.doc1 === 0)) {
        console.log("⚠️ SOLICITANTE - Cabeçalhos não encontrados. Usando sequência padrão do Clube: NOME(0), EMPRESA(1), RG(2), CPF(3)");
        colunas = {
          nome: 0,
          empresa: 1,
          doc1: 2,
          doc2: 3
        };
        pularPrimeiraLinha = false; // Se não tem cabeçalho, a primeira linha já é dado
      }

      console.log("🗂️ SOLICITANTE - Mapeamento de colunas:", colunas)

      // 🎯 CORREÇÃO CRÍTICA: Verificar se tem pelo menos Nome E (Doc1 OU Doc2)
      const colunasObrigatorias = ["nome"]
      for (const coluna of colunasObrigatorias) {
        if (colunas[coluna as keyof typeof colunas] === -1) {
          return {
            sucesso: false,
            erro: `Coluna obrigatória não encontrada: ${coluna}. Se o arquivo não tiver cabeçalho, certifique-se de que a sequência seja: Nome, Empresa, Documento.`,
            prestadores: [],
            totalProcessados: 0,
          }
        }
      }

      // Verificar se tem pelo menos uma coluna de documento
      if (colunas.doc1 === -1 && colunas.doc2 === -1) {
        return {
          sucesso: false,
          erro: "Deve haver pelo menos uma coluna de documento (Doc1 ou Doc2)",
          prestadores: [],
          totalProcessados: 0,
        }
      }

      const prestadores: PrestadorExcelSolicitante[] = []

      for (let i = pularPrimeiraLinha ? 1 : 0; i < dados.length; i++) {
        const linha = dados[i]

        if (!linha || linha.length === 0) continue

        try {
          const prestador: PrestadorExcelSolicitante = {
            nome: this.extrairValor(linha, colunas.nome),
            doc1: this.limparDoc1(this.extrairValor(linha, colunas.doc1)),
            doc2: this.limparDoc1(this.extrairValor(linha, colunas.doc2)) || undefined,
            empresa: this.extrairValor(linha, colunas.empresa) || "",
          }

          // 🎯 NOVO: Ignorar se a linha for um cabeçalho repetido ou lixo
          const nomeLcase = (prestador.nome || "").toLowerCase().trim()
          if (nomeLcase === "nome" || nomeLcase === "name" || nomeLcase === "prestador" || nomeLcase === "rg" || nomeLcase === "documento") {
              console.log("🚫 SOLICITANTE - Pulando linha que parece ser cabeçalho:", prestador.nome)
              continue
          }

          // 🎯 CORREÇÃO CRÍTICA: Aceitar prestador com Nome E (Doc1 OU Doc2)
          const temNome = prestador.nome ? prestador.nome.trim() : ""
          const temDoc1 = prestador.doc1 ? prestador.doc1.trim() : ""
          const temDoc2 = prestador.doc2 ? prestador.doc2.trim() : ""
          const temAlgumDoc = temDoc1 || temDoc2

          console.log(
            `🔍 SOLICITANTE - Linha ${i + 1}: Nome = "${temNome}" Doc1 = "${temDoc1}" Doc2 = "${temDoc2}" TemAlgumDoc = ${!!temAlgumDoc} `,
          )

          if (temNome && temAlgumDoc) {
            prestadores.push(prestador)
            console.log(`✅ SOLICITANTE - Prestador aceito: ${prestador.nome} `)
          } else {
            console.warn(`⚠️ SOLICITANTE - Linha ${i + 1} ignorada - dados incompletos: `, prestador)
            console.warn(`   Motivo: Nome = "${!!temNome}" AlgumDoc = "${!!temAlgumDoc}"`)
          }
        } catch (error) {
          console.error(`❌ SOLICITANTE - Erro na linha ${i + 1}: `, error)
        }
      }

      console.log(`✅ SOLICITANTE - ${prestadores.length} prestadores processados do Excel`)

      return {
        sucesso: true,
        erro: "",
        prestadores,
        totalProcessados: prestadores.length,
      }
    } catch (error: any) {
      console.error("💥 SOLICITANTE - Erro ao processar Excel:", error)
      return {
        sucesso: false,
        erro: `Erro ao processar arquivo: ${error.message} `,
        prestadores: [],
        totalProcessados: 0,
      }
    }
  }

  // 💾 SALVAR HISTÓRICO NO SUPABASE (ADM)
  static async salvarHistoricoSupabase(prestadores: PrestadorExcelADM[]): Promise<{
    sucesso: boolean
    erro: string
    totalSalvos: number
    totalErros: number
  }> {
    try {
      console.log(`💾 ADM - Salvando ${prestadores.length} prestadores no Supabase...`)

      let totalSalvos = 0
      let totalErros = 0
      const batchSize = 100 // Processar em lotes de 100

      for (let i = 0; i < prestadores.length; i += batchSize) {
        const lote = prestadores.slice(i, i + batchSize)

        const dadosParaInserir = lote.map((p) => ({
          nome: p.nome,
          doc1: p.doc1,
          doc2: p.doc2 || null,
          empresa: p.empresa,
          funcao: p.cargo || null, // Tentativa de salvar cargo em 'funcao'
          observacao: p.observacoes || null, // Tentativa de salvar obs em 'observacao'
          checagem_valida_ate: p.validaAte || null,
          data_inicial: p.dataInicial || null,
          data_final: p.dataFinal || null,
          checagem: p.checagem,
          liberacao: p.liberacao,
          data_avaliacao: new Date().toISOString(),
          aprovado_por: "Upload Excel ADM",
          solicitacao_id: null, // Histórico não tem solicitação específica
        }))

        const { data, error } = await supabase.from("prestadores").insert(dadosParaInserir).select()

        if (error) {
          console.error(`❌ ADM - Erro no lote ${Math.floor(i / batchSize) + 1}: `, error)
          totalErros += lote.length
        } else {
          console.log(`✅ ADM - Lote ${Math.floor(i / batchSize) + 1} salvo com sucesso`)
          totalSalvos += lote.length
        }
      }

      return {
        sucesso: totalSalvos > 0,
        erro: totalErros > 0 ? `${totalErros} prestadores não foram salvos` : "",
        totalSalvos,
        totalErros,
      }
    } catch (error: any) {
      console.error("💥 ADM - Erro ao salvar no Supabase:", error)
      return {
        sucesso: false,
        erro: `Erro ao salvar: ${error.message} `,
        totalSalvos: 0,
        totalErros: prestadores.length,
      }
    }
  }

  // 🔧 FUNÇÕES AUXILIARES
  private static encontrarColuna(cabecalho: string[], possiveisNomes: string[]): number {
    for (const nome of possiveisNomes) {
      const index = cabecalho.findIndex((col) => {
        if (!col) return false;
        const c = String(col).toLowerCase()
        const n = nome.toLowerCase()
        return c === n || c.includes(n)
      })
      if (index !== -1) return index
    }
    return -1
  }

  private static extrairValor(linha: any[], indice: number): string {
    if (indice === -1 || !linha[indice]) return ""
    return String(linha[indice]).trim()
  }

  private static limparDoc1(doc: string): string {
    if (!doc) return ""
    // Remove tudo que não for alfanumérico, mantendo apenas letras e números
    // Isso ajuda a unificar formatos de RG/CPF
    return doc.replace(/[^A-Za-z0-9]/g, "").toUpperCase()
  }

  private static formatarData(valor: string): string {
    if (!valor) return ""

    try {
      // Tentar diferentes formatos de data
      const data = new Date(valor)
      if (!isNaN(data.getTime())) {
        return data.toISOString().split("T")[0]
      }

      // Se for formato DD/MM/YYYY
      if (valor.includes("/")) {
        const [dia, mes, ano] = valor.split("/")
        return `${ano} -${mes.padStart(2, "0")} -${dia.padStart(2, "0")} `
      }

      // Se for formato DD-MM-YYYY
      if (valor.includes("-")) {
        const partes = valor.split("-")
        if (partes[0].length === 4) return valor // Já é YYYY-MM-DD
        return `${partes[2]} -${partes[1]} -${partes[0]} `
      }

      return valor
    } catch {
      return valor
    }
  }

  private static normalizarStatus(valor: string): "aprovado" | "reprovado" | "pendente" | "excecao" {
    const v = valor.toLowerCase()
    if (v.includes("aprovado") || v.includes("ok") || v.includes("válido")) return "aprovado"
    if (v.includes("reprovado") || v.includes("negado") || v.includes("block")) return "reprovado"
    if (v.includes("exceção") || v.includes("excecao")) return "excecao"
    return "pendente"
  }

  private static normalizarCadastro(valor: string): "ok" | "vencida" | "pendente" | "urgente" {
    const v = valor.toLowerCase()
    if (v.includes("ok") || v.includes("liberado")) return "ok"
    if (v.includes("vencida") || v.includes("expirado")) return "vencida"
    if (v.includes("urgente")) return "urgente"
    return "pendente"
  }
}
