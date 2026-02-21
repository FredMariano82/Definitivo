"use client"

import { useState, useEffect } from "react"
import {
  Edit,
  Filter,
  Search,
  X,
  CheckCircle,
  XCircle,
  Clock,
  ShieldAlert,
  Columns,
  Save,
  Download,
  Calendar,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import type { Solicitacao, PrestadorAvaliacao } from "../../types"
import { StatusCadastroBadge, StatusCadastroIcon, getChecagemStatus, getCadastroStatus } from "../ui/status-badges"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getAllSolicitacoes } from "../../services/solicitacoes-service"
import { supabase } from "@/lib/supabase"
import { formatarDataParaBR } from "../../utils/date-helpers"
import { Badge } from "../ui/badge"
// import * as XLSX from "xlsx"

type StatusCadastro = "pendente" | "ok" | "urgente" | "vencida"

// Definir todas as colunas disponíveis
const COLUNAS_DISPONIVEIS = [
  { key: "dataSolicitacao", label: "Data Solicitação" },
  { key: "prestador", label: "Prestador" },
  { key: "documento", label: "Documento" },
  { key: "dataInicial", label: "Data Inicial" },
  { key: "dataFinal", label: "Data Final" },
  { key: "liberacao", label: "Liberação" },
  { key: "checagem", label: "Checagem" },
  { key: "validaAte", label: "Válida até" },
  { key: "acoes", label: "Ações" },
  { key: "justificativa", label: "Justificativa" },
]

export default function ConsultarSolicitacoes() {
  const [solicitacoes, setSolicitacoes] = useState<Solicitacao[]>([])
  const [carregando, setCarregando] = useState(true)
  const [filtroStatus, setFiltroStatus] = useState<string>("todos")
  const [filtroCadastro, setFiltroCadastro] = useState<string>("todos")
  const [filtroDepartamento, setFiltroDepartamento] = useState<string>("todos")
  const [buscaGeral, setBuscaGeral] = useState("")
  const [detalhesSolicitacao, setDetalhesSolicitacao] = useState<Solicitacao | null>(null)
  const [modalColunasAberto, setModalColunasAberto] = useState(false)
  const [paginaAtual, setPaginaAtual] = useState(1)
  const [itensPorPagina] = useState(100)

  // Estados para edição
  const [prestadorEditando, setPrestadorEditando] = useState<string | null>(null)
  const [dadosEdicao, setDadosEdicao] = useState<any>({})
  const [salvandoEdicao, setSalvandoEdicao] = useState(false)
  const [mensagemSucesso, setMensagemSucesso] = useState<string | null>(null)

  // Estado para controlar colunas visíveis
  const [colunasVisiveis, setColunasVisiveis] = useState<Record<string, boolean>>(() => {
    // Tentar carregar do localStorage
    if (typeof window !== "undefined") {
      const salvas = localStorage.getItem("suporte-colunas-visiveis")
      if (salvas) {
        console.log("📂 CARREGADO DO LOCALSTORAGE:", JSON.parse(salvas))
        return JSON.parse(salvas)
      }
    }
    // Estado inicial: todas as colunas visíveis
    const estadoInicial = COLUNAS_DISPONIVEIS.reduce(
      (acc, coluna) => {
        acc[coluna.key] = true
        return acc
      },
      {} as Record<string, boolean>,
    )
    console.log("🆕 ESTADO INICIAL:", estadoInicial)
    return estadoInicial
  })

  // Estados para download
  const [modalDownloadAberto, setModalDownloadAberto] = useState(false)
  const [opcoesFiltro, setOpcoesFiltro] = useState<"todos" | "periodo">("todos")
  const [dataInicioDownload, setDataInicioDownload] = useState("")
  const [dataFimDownload, setDataFimDownload] = useState("")
  const [incluirGraficos, setIncluirGraficos] = useState(true)
  const [baixandoArquivo, setBaixandoArquivo] = useState(false)

  // Carregar solicitações do banco
  useEffect(() => {
    buscarSolicitacoes()
  }, [])

  // Salvar preferências no localStorage sempre que mudar
  useEffect(() => {
    console.log("💾 SALVANDO NO LOCALSTORAGE:", colunasVisiveis)
    if (typeof window !== "undefined") {
      localStorage.setItem("suporte-colunas-visiveis", JSON.stringify(colunasVisiveis))
    }
  }, [colunasVisiveis])

  const buscarSolicitacoes = async () => {
    try {
      setCarregando(true)
      console.log("🔍 SUPORTE: Buscando solicitações...")
      const dados = await getAllSolicitacoes()
      console.log("📊 SUPORTE: Dados carregados:", dados.length, "solicitações")

      // DEBUG: Verificar se justificativa está sendo carregada
      dados.forEach((sol, i) => {
        sol.prestadores?.forEach((prest, j) => {
          if (prest.justificativa) {
            console.log(`✅ SUPORTE: Justificativa encontrada - Sol ${i}, Prest ${j}:`, prest.justificativa)
          }
        })
      })

      setSolicitacoes(dados)
    } catch (error) {
      console.error("❌ SUPORTE: Erro:", error)
    } finally {
      setCarregando(false)
    }
  }

  const departamentos = Array.from(new Set(solicitacoes.map((s) => s.departamento)))

  const normalizarTexto = (texto: string) => {
    return texto
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // Remove acentos
      .replace(/[^\w\s]/g, "") // Remove pontuação
      .replace(/\s+/g, " ") // Normaliza espaços
      .trim()
  }

  // Função para normalizar documento (remove pontos, traços, espaços)
  const normalizarDocumento = (documento: string) => {
    return documento.replace(/[.\-\s]/g, "").toLowerCase()
  }

  const getPrioridade = (prestador: PrestadorAvaliacao) => {
    if (prestador.status === "pendente" && prestador.cadastro === "urgente") {
      return 1 // 🔴 Prioridade 1: STATUS = "pendente" + CADASTRO = "urgente"
    }
    if (prestador.status === "pendente" && prestador.cadastro === "pendente") {
      return 2 // 🟡 Prioridade 2: STATUS = "pendente" + CADASTRO = "pendente"
    }
    return 3 // ⚪ Demais casos: Outros status
  }

  // Filtrar solicitações e prestadores baseado nos filtros
  const dadosIniciais = solicitacoes
    .map((solicitacao) => {
      // Filtro de departamento
      const deptMatch = filtroDepartamento === "todos" || solicitacao.departamento === filtroDepartamento

      if (!deptMatch) return null

      // Filtrar prestadores dentro da solicitação
      const prestadoresFiltrados = solicitacao.prestadores
        ? solicitacao.prestadores.filter((prestador) => {
          // Calcular status real para filtros
          const checagemStatusReal = getChecagemStatus(prestador)
          const cadastroStatusReal = getCadastroStatus(prestador, solicitacao.dataFinal)

          // Filtro de status checagem (incluindo status calculados)
          let statusMatch = filtroStatus === "todos"
          if (filtroStatus === "vencida") {
            statusMatch = checagemStatusReal === "vencida"
          } else if (filtroStatus !== "todos") {
            // CORREÇÃO: Mapear filtro para status do banco
            const statusParaFiltro =
              filtroStatus === "aprovado" ? "aprovado" : filtroStatus === "reprovado" ? "reprovado" : filtroStatus
            statusMatch = prestador.status === statusParaFiltro
          }

          // Filtro de cadastro (incluindo status calculados)
          let cadastroMatch = filtroCadastro === "todos"
          if (filtroCadastro === "vencida") {
            cadastroMatch = cadastroStatusReal === "vencida"
          } else if (filtroCadastro !== "todos") {
            cadastroMatch = prestador.cadastro === filtroCadastro
          }

          // Filtro de busca geral
          let buscaMatch = true
          if (buscaGeral.trim()) {
            const termoBusca = buscaGeral.trim()
            const nomeNormalizado = normalizarTexto(prestador.nome)
            const documentoNormalizado = normalizarDocumento(prestador.documento)
            const termoBuscaNormalizado = normalizarTexto(termoBusca)
            const termoBuscaDocumento = normalizarDocumento(termoBusca)

            buscaMatch =
              nomeNormalizado.includes(termoBuscaNormalizado) || documentoNormalizado.includes(termoBuscaDocumento)
          }

          return statusMatch && cadastroMatch && buscaMatch
        })
        : []

      // Retornar solicitação apenas se tiver prestadores que passaram no filtro
      if (prestadoresFiltrados.length > 0) {
        return {
          ...solicitacao,
          prestadores: prestadoresFiltrados,
        }
      }

      return null
    })
    .filter((solicitacao) => solicitacao !== null) as Solicitacao[]

  // Ordenar por prioridade: 1 (mais alta) -> 2 -> 3 (mais baixa)
  const dadosFiltrados = dadosIniciais
    .flatMap((solicitacao) =>
      solicitacao.prestadores
        ? solicitacao.prestadores.map((prestador) => ({
          solicitacao,
          prestador,
          prioridade: getPrioridade(prestador),
        }))
        : [],
    )
    .sort((a, b) => {
      // Ordenar por prioridade (menor número = maior prioridade)
      if (a.prioridade !== b.prioridade) {
        return a.prioridade - b.prioridade
      }

      // Se mesma prioridade, ordenar por data de solicitação (mais recente primeiro)
      const dataA = new Date(a.solicitacao.dataSolicitacao.split("/").reverse().join("-"))
      const dataB = new Date(b.solicitacao.dataSolicitacao.split("/").reverse().join("-"))
      return dataB.getTime() - dataA.getTime()
    })

  // Aplicar paginação
  const totalItens = dadosFiltrados.length
  const totalPaginas = Math.ceil(totalItens / itensPorPagina)
  const indiceInicio = (paginaAtual - 1) * itensPorPagina
  const indiceFim = indiceInicio + itensPorPagina
  const dadosPaginados = dadosFiltrados.slice(indiceInicio, indiceFim)

  // Função para mudar página
  const irParaPagina = (pagina: number) => {
    setPaginaAtual(pagina)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  // Funções de edição
  const iniciarEdicao = (solicitacao: Solicitacao, prestador: PrestadorAvaliacao) => {
    console.log("✏️ INICIANDO EDIÇÃO:", prestador.nome)
    setPrestadorEditando(prestador.id)

    // Converter datas para formato YYYY-MM-DD para inputs
    const dataInicialFormatada = solicitacao.dataInicial.split("/").reverse().join("-")
    const dataFinalFormatada = solicitacao.dataFinal.split("/").reverse().join("-")
    const dataSolicitacaoFormatada = solicitacao.dataSolicitacao.split("/").reverse().join("-")
    const validaAteFormatada = prestador.checagemValidaAte
      ? prestador.checagemValidaAte.split("/").reverse().join("-")
      : ""

    setDadosEdicao({
      // Dados do prestador
      nome: prestador.nome,
      documento: prestador.documento,
      documento2: prestador.documento2 || "",
      empresa: prestador.empresa || "",
      status: prestador.status,
      cadastro: prestador.cadastro,
      checagemValidaAte: validaAteFormatada,
      justificativa: prestador.justificativa || "",

      // Dados da solicitação
      dataSolicitacao: dataSolicitacaoFormatada,
      dataInicial: dataInicialFormatada,
      dataFinal: dataFinalFormatada,
      local: solicitacao.local,
      empresaGeral: solicitacao.empresa,
      departamento: solicitacao.departamento,
      solicitante: solicitacao.solicitante,
    })
  }

  const cancelarEdicao = () => {
    setPrestadorEditando(null)
    setDadosEdicao({})
  }

  const salvarEdicao = async (solicitacao: Solicitacao, prestador: PrestadorAvaliacao) => {
    try {
      setSalvandoEdicao(true)
      console.log("💾 SALVANDO EDIÇÃO:", dadosEdicao)

      if (!supabase) {
        alert("Erro: Problema de conexão com banco de dados")
        return
      }

      // Converter datas de volta para formato ISO
      const dataInicialISO = dadosEdicao.dataInicial
      const dataFinalISO = dadosEdicao.dataFinal
      const dataSolicitacaoISO = dadosEdicao.dataSolicitacao
      const validaAteISO = dadosEdicao.checagemValidaAte || null

      const { error: errorPrestador } = await supabase
        .from("prestadores")
        .update({
          nome: dadosEdicao.nome,
          documento: dadosEdicao.documento,
          documento2: dadosEdicao.documento2 || null,
          empresa: dadosEdicao.empresa || null,
          status: dadosEdicao.status,
          cadastro: dadosEdicao.cadastro,
          checagem_valida_ate: validaAteISO,
          justificativa: dadosEdicao.justificativa || null,
        })
        .eq("id", prestador.id)

      if (errorPrestador) {
        console.error("❌ Erro ao atualizar prestador:", errorPrestador)
        alert(`Erro ao atualizar prestador: ${errorPrestador.message}`)
        return
      }

      // Atualizar solicitação
      const { error: errorSolicitacao } = await supabase
        .from("solicitacoes")
        .update({
          data_solicitacao: dataSolicitacaoISO,
          data_inicial: dataInicialISO,
          data_final: dataFinalISO,
          local: dadosEdicao.local,
          empresa: dadosEdicao.empresaGeral,
          departamento: dadosEdicao.departamento,
          solicitante: dadosEdicao.solicitante,
        })
        .eq("id", solicitacao.id)

      if (errorSolicitacao) {
        console.error("❌ Erro ao atualizar solicitação:", errorSolicitacao)
        alert(`Erro ao atualizar solicitação: ${errorSolicitacao.message}`)
        return
      }

      console.log("✅ EDIÇÃO SALVA COM SUCESSO!")

      // Atualizar estado local
      setSolicitacoes((prevSolicitacoes) =>
        prevSolicitacoes.map((s) =>
          s.id === solicitacao.id
            ? {
              ...s,
              dataSolicitacao: dadosEdicao.dataSolicitacao.split("-").reverse().join("/"),
              dataInicial: dadosEdicao.dataInicial.split("-").reverse().join("/"),
              dataFinal: dadosEdicao.dataFinal.split("-").reverse().join("/"),
              local: dadosEdicao.local,
              empresa: dadosEdicao.empresaGeral,
              departamento: dadosEdicao.departamento,
              solicitante: dadosEdicao.solicitante,
              prestadores: s.prestadores
                ? s.prestadores.map((p) =>
                  p.id === prestador.id
                    ? {
                      ...p,
                      nome: dadosEdicao.nome,
                      documento: dadosEdicao.documento,
                      documento2: dadosEdicao.documento2 || undefined,
                      empresa: dadosEdicao.empresa || undefined,
                      status: dadosEdicao.status as any,
                      cadastro: dadosEdicao.cadastro as StatusCadastro,
                      checagemValidaAte: dadosEdicao.checagemValidaAte
                        ? dadosEdicao.checagemValidaAte.split("-").reverse().join("/")
                        : undefined,
                      justificativa: dadosEdicao.justificativa || undefined,
                    }
                    : p,
                )
                : [],
            }
            : s,
        ),
      )

      setPrestadorEditando(null)
      setDadosEdicao({})
      setMensagemSucesso(prestador.id)

      // Remover mensagem de sucesso após 3 segundos
      setTimeout(() => {
        setMensagemSucesso(null)
      }, 3000)
    } catch (error: any) {
      console.error("💥 Erro ao salvar edição:", error)
      alert(`Erro inesperado: ${error.message}`)
    } finally {
      setSalvandoEdicao(false)
    }
  }

  // Função para alternar visibilidade da coluna
  const toggleColuna = (chaveColuna: string) => {
    console.log("🔧 TOGGLE COLUNA:", chaveColuna, "Estado atual:", colunasVisiveis[chaveColuna])
    setColunasVisiveis((prev) => {
      const novoEstado = {
        ...prev,
        [chaveColuna]: !prev[chaveColuna],
      }
      console.log("🔧 NOVO ESTADO:", novoEstado)
      return novoEstado
    })
  }

  // Função para mostrar/esconder todas as colunas
  const toggleTodasColunas = (mostrar: boolean) => {
    const novoEstado = COLUNAS_DISPONIVEIS.reduce(
      (acc, coluna) => {
        acc[coluna.key] = mostrar
        return acc
      },
      {} as Record<string, boolean>,
    )
    setColunasVisiveis(novoEstado)
  }

  const totalPrestadoresFiltrados = dadosFiltrados.length

  // Resetar página quando filtros mudarem
  useEffect(() => {
    setPaginaAtual(1)
  }, [filtroStatus, filtroCadastro, filtroDepartamento, buscaGeral])

  const gerarDownloadExcel = async () => {
    try {
      setBaixandoArquivo(true)
      console.log("📥 INICIANDO DOWNLOAD EXCEL...")

      // Determinar dados para download
      let dadosParaDownload = solicitacoes

      if (opcoesFiltro === "periodo" && dataInicioDownload && dataFimDownload) {
        console.log(`🗓️ Filtrando por período: ${dataInicioDownload} até ${dataFimDownload}`)
        dadosParaDownload = solicitacoes.filter((sol) => {
          try {
            const dataSol = new Date(sol.dataSolicitacao.split("/").reverse().join("-"))
            const dataInicio = new Date(dataInicioDownload)
            const dataFim = new Date(dataFimDownload)
            return dataSol >= dataInicio && dataSol <= dataFim
          } catch (error) {
            console.warn("⚠️ Erro ao filtrar data:", sol.dataSolicitacao)
            return false
          }
        })
      }

      console.log(`📊 Processando ${dadosParaDownload.length} solicitações`)

      // Preparar dados para Excel (uma linha por prestador)
      const dadosExcel: any[] = []

      dadosParaDownload.forEach((sol) => {
        if (!sol.prestadores || sol.prestadores.length === 0) {
          console.warn("⚠️ Solicitação sem prestadores:", sol.numero)
          return
        }

        sol.prestadores.forEach((prest) => {
          try {
            dadosExcel.push({
              "Data Solicitação": sol.dataSolicitacao || "-",
              Número: sol.numero || "-",
              Solicitante: sol.solicitante || "-",
              Departamento: sol.departamento || "-",
              Local: sol.local || "-",
              "Empresa Geral": sol.empresa || "-",
              Prestador: prest.nome || "-",
              Documento: prest.documento || "-",
              "Documento 2": prest.documento2 || "-",
              "Empresa Prestador": prest.empresa || "-",
              "Data Inicial": sol.dataInicial || "-",
              "Data Final": sol.dataFinal || "-",
              "Status Checagem": prest.status || "-",
              "Status Liberação": prest.cadastro || "-",
              "Válida Até": prest.checagemValidaAte || "-",
              Justificativa: prest.justificativa || "-",
            })
          } catch (error) {
            console.error("❌ Erro ao processar prestador:", prest.nome, error)
          }
        })
      })

      console.log(`✅ ${dadosExcel.length} registros preparados para Excel`)

      if (dadosExcel.length === 0) {
        alert("⚠️ Nenhum dado encontrado para exportar!")
        return
      }

      // Gerar CSV como alternativa mais compatível
      const gerarCSV = () => {
        const headers = Object.keys(dadosExcel[0])

        // Usar ponto e vírgula como separador para Excel brasileiro
        const csvContent = [
          headers.join(";"),
          ...dadosExcel.map((row) =>
            headers
              .map((header) => {
                const value = row[header] || ""
                // Escapar aspas e ponto e vírgula
                return `"${String(value).replace(/"/g, '""')}"`
              })
              .join(";"),
          ),
        ].join("\n")

        // Adicionar BOM para UTF-8
        const BOM = "\uFEFF"
        const blob = new Blob([BOM + csvContent], { type: "text/csv;charset=utf-8;" })

        const link = document.createElement("a")
        const url = URL.createObjectURL(blob)
        link.setAttribute("href", url)

        const agora = new Date()
        const dataFormatada = agora.toISOString().split("T")[0]
        const horaFormatada = agora.toTimeString().split(" ")[0].replace(/:/g, "-")
        const nomeArquivo = `solicitacoes_suporte_${dataFormatada}_${horaFormatada}.csv`

        link.setAttribute("download", nomeArquivo)
        link.style.visibility = "hidden"
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)

        return nomeArquivo
      }

      // Tentar XLSX primeiro, se falhar usar CSV
      try {
        // Importar XLSX com configuração específica para browser
        const XLSX = await import("xlsx")

        // Forçar ambiente browser
        if (typeof window !== "undefined") {
          // Configurar XLSX para usar APIs do browser
          XLSX.set_fs(undefined)
        }

        console.log("✅ XLSX importado com sucesso")

        // Criar workbook
        const wb = XLSX.utils.book_new()
        console.log("📝 Workbook criado")

        // Aba principal com dados
        const ws = XLSX.utils.json_to_sheet(dadosExcel)
        console.log("📋 Worksheet principal criado")

        // Ajustar largura das colunas
        const colWidths = [
          { wch: 12 },
          { wch: 15 },
          { wch: 20 },
          { wch: 15 },
          { wch: 20 },
          { wch: 20 },
          { wch: 25 },
          { wch: 15 },
          { wch: 15 },
          { wch: 20 },
          { wch: 12 },
          { wch: 12 },
          { wch: 15 },
          { wch: 15 },
          { wch: 12 },
          { wch: 30 },
        ]

        ws["!cols"] = colWidths
        XLSX.utils.book_append_sheet(wb, ws, "Dados")
        console.log("📊 Aba 'Dados' adicionada")

        // Aba de estatísticas se solicitado
        if (incluirGraficos) {
          try {
            const stats = {
              "Total de Solicitações": dadosParaDownload.length,
              "Total de Prestadores": dadosExcel.length,
              "Pendentes Checagem": dadosExcel.filter((d) => d["Status Checagem"] === "pendente").length,
              "Aprovados Checagem": dadosExcel.filter((d) => d["Status Checagem"] === "aprovado").length,
              "Reprovados Checagem": dadosExcel.filter((d) => d["Status Checagem"] === "reprovado").length,
              "Exceções Checagem": dadosExcel.filter((d) => d["Status Checagem"] === "excecao").length,
              "Pendentes Liberação": dadosExcel.filter((d) => d["Status Liberação"] === "pendente").length,
              Liberados: dadosExcel.filter((d) => d["Status Liberação"] === "ok").length,
              Urgentes: dadosExcel.filter((d) => d["Status Liberação"] === "urgente").length,
            }

            const statsData = Object.entries(stats).map(([key, value]) => ({
              Métrica: key,
              Valor: value,
            }))

            const wsStats = XLSX.utils.json_to_sheet(statsData)
            wsStats["!cols"] = [{ wch: 25 }, { wch: 10 }]
            XLSX.utils.book_append_sheet(wb, wsStats, "Estatísticas")
            console.log("📈 Aba 'Estatísticas' adicionada")
          } catch (error) {
            console.warn("⚠️ Erro ao criar estatísticas, continuando sem elas:", error)
          }
        }

        // Gerar nome do arquivo
        const agora = new Date()
        const dataFormatada = agora.toISOString().split("T")[0]
        const horaFormatada = agora.toTimeString().split(" ")[0].replace(/:/g, "-")
        const nomeArquivo = `solicitacoes_suporte_${dataFormatada}_${horaFormatada}.xlsx`

        console.log(`💾 Gerando arquivo Excel: ${nomeArquivo}`)

        // Download do arquivo Excel usando writeFile com configuração browser
        XLSX.writeFile(wb, nomeArquivo, {
          bookType: "xlsx",
          type: "binary",
        })

        console.log("✅ Download Excel concluído!")

        // Fechar modal e mostrar sucesso
        setModalDownloadAberto(false)

        const mensagemSucesso = [
          "✅ Download Excel concluído com sucesso!",
          `📁 Arquivo: ${nomeArquivo}`,
          `📊 ${dadosExcel.length} registros exportados`,
          `📋 ${dadosParaDownload.length} solicitações processadas`,
          incluirGraficos ? "📈 Estatísticas incluídas" : "",
        ]
          .filter(Boolean)
          .join("\n")

        alert(mensagemSucesso)
      } catch (xlsxError) {
        console.warn("⚠️ XLSX falhou, usando CSV como alternativa:", xlsxError)

        // Fallback para CSV
        const nomeArquivo = gerarCSV()

        setModalDownloadAberto(false)

        const mensagemSucesso = [
          "✅ Download CSV concluído com sucesso!",
          `📁 Arquivo: ${nomeArquivo}`,
          `📊 ${dadosExcel.length} registros exportados`,
          `📋 ${dadosParaDownload.length} solicitações processadas`,
          "ℹ️ Formato CSV (compatível com Excel)",
        ].join("\n")

        alert(mensagemSucesso)
      }
    } catch (error: any) {
      console.error("💥 ERRO DETALHADO NO DOWNLOAD:", error)

      // Mensagem de erro mais específica
      let mensagemErro = "❌ Erro ao gerar arquivo.\n\n"

      if (error.message?.includes("Deno")) {
        mensagemErro += "Problema: Conflito de ambiente detectado.\n"
        mensagemErro += "Solução: Recarregue a página e tente novamente."
      } else if (error.message?.includes("writeFile")) {
        mensagemErro += "Problema: Erro ao salvar o arquivo.\n"
        mensagemErro += "Solução: Verifique se o navegador permite downloads."
      } else {
        mensagemErro += `Detalhes técnicos: ${error.message}\n`
        mensagemErro += "Solução: Tente novamente ou contate o suporte."
      }

      alert(mensagemErro)
    } finally {
      setBaixandoArquivo(false)
      console.log("🏁 Processo de download finalizado")
    }
  }

  if (carregando) {
    return (
      <div className="flex justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-purple-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-purple-100 p-4">
      <div className="max-w-7xl mx-auto">
        <Card className="shadow-lg border-0">
          <CardHeader className="pb-6">
            <CardTitle className="text-2xl font-bold text-purple-800 text-center">
              🔍 SUPORTE - Consultar Solicitações
            </CardTitle>
            <div className="w-24 h-1 bg-purple-600 mx-auto rounded-full"></div>
          </CardHeader>

          <CardContent>
            {/* Filtros */}
            <div className="mb-6 p-4 bg-purple-50 rounded-lg">
              <div className="flex items-center gap-2 mb-4">
                <Filter className="h-5 w-5 text-purple-600" />
                <Label className="text-lg font-medium text-purple-700">Filtros</Label>
                <Button
                  onClick={buscarSolicitacoes}
                  variant="outline"
                  size="sm"
                  className="ml-auto border-purple-600 text-purple-600 hover:bg-purple-50"
                >
                  🔄 Atualizar
                </Button>
                {/* Botão Download */}
                <Button
                  onClick={() => setModalDownloadAberto(true)}
                  variant="outline"
                  size="sm"
                  className="ml-2 border-green-600 text-green-600 hover:bg-green-50"
                >
                  <Download className="h-4 w-4 mr-1" />
                  Download
                </Button>

                {/* Botão Modal de Colunas */}
                <Button
                  onClick={() => {
                    console.log("🔧 BOTÃO COLUNAS CLICADO!")
                    setModalColunasAberto(true)
                  }}
                  variant="outline"
                  size="sm"
                  className="ml-2 border-blue-600 text-blue-600 hover:bg-blue-50"
                >
                  <Columns className="h-4 w-4 mr-1" />
                  Colunas
                </Button>

                {/* Modal Customizado */}
                {modalColunasAberto && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center">
                    {/* Overlay */}
                    <div
                      className="fixed inset-0 bg-black bg-opacity-50"
                      onClick={() => setModalColunasAberto(false)}
                    ></div>

                    {/* Modal Content */}
                    <div className="relative bg-white rounded-lg shadow-lg p-6 max-w-md w-full mx-4 max-h-[80vh] overflow-y-auto">
                      <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-purple-800">🔧 Configurar Colunas</h2>
                        <Button
                          onClick={() => setModalColunasAberto(false)}
                          variant="outline"
                          size="sm"
                          className="h-8 w-8 p-0"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="space-y-4">
                        {/* Botões para selecionar/deselecionar todas */}
                        <div className="flex gap-2 pb-2 border-b border-purple-200">
                          <Button
                            onClick={() => {
                              console.log("🟢 MOSTRAR TODAS CLICADO!")
                              toggleTodasColunas(true)
                            }}
                            variant="outline"
                            size="sm"
                            className="flex-1 border-green-600 text-green-600 hover:bg-green-50"
                          >
                            ✅ Mostrar Todas
                          </Button>
                          <Button
                            onClick={() => {
                              console.log("🔴 ESCONDER TODAS CLICADO!")
                              toggleTodasColunas(false)
                            }}
                            variant="outline"
                            size="sm"
                            className="flex-1 border-red-600 text-red-600 hover:bg-red-50"
                          >
                            ❌ Esconder Todas
                          </Button>
                        </div>

                        {/* Lista de checkboxes para cada coluna */}
                        <div className="space-y-3 max-h-80 overflow-y-auto">
                          {COLUNAS_DISPONIVEIS.map((coluna) => (
                            <div key={coluna.key} className="flex items-center space-x-3">
                              <input
                                type="checkbox"
                                id={coluna.key}
                                checked={colunasVisiveis[coluna.key] || false}
                                onChange={() => {
                                  console.log("☑️ CHECKBOX CLICADO:", coluna.key)
                                  toggleColuna(coluna.key)
                                }}
                                className="h-4 w-4 text-purple-600 border-purple-300 rounded focus:ring-purple-500"
                              />
                              <label
                                htmlFor={coluna.key}
                                className="text-sm font-medium text-purple-700 cursor-pointer"
                              >
                                {coluna.label}
                              </label>
                            </div>
                          ))}
                        </div>

                        {/* Resumo */}
                        <div className="pt-2 border-t border-purple-200 text-center">
                          <p className="text-xs text-purple-600">
                            {Object.values(colunasVisiveis).filter(Boolean).length} de {COLUNAS_DISPONIVEIS.length}{" "}
                            colunas visíveis
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Modal de Download */}
                {modalDownloadAberto && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center">
                    {/* Overlay */}
                    <div
                      className="fixed inset-0 bg-black bg-opacity-50"
                      onClick={() => setModalDownloadAberto(false)}
                    ></div>

                    {/* Modal Content */}
                    <div className="relative bg-white rounded-lg shadow-lg p-6 max-w-lg w-full mx-4">
                      <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-purple-800">📥 Download das Solicitações</h2>
                        <Button
                          onClick={() => setModalDownloadAberto(false)}
                          variant="outline"
                          size="sm"
                          className="h-8 w-8 p-0"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="space-y-6">
                        {/* Opções de Filtro */}
                        <div>
                          <Label className="text-sm font-medium text-purple-700 mb-3 block">
                            📊 Dados para Download
                          </Label>
                          <div className="space-y-3">
                            <div className="flex items-center space-x-2">
                              <input
                                type="radio"
                                id="todos"
                                name="filtro"
                                checked={opcoesFiltro === "todos"}
                                onChange={() => setOpcoesFiltro("todos")}
                                className="text-purple-600"
                              />
                              <label htmlFor="todos" className="text-sm text-purple-700">
                                Baixar todos os dados (ignorar filtros atuais)
                              </label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <input
                                type="radio"
                                id="periodo"
                                name="filtro"
                                checked={opcoesFiltro === "periodo"}
                                onChange={() => setOpcoesFiltro("periodo")}
                                className="text-purple-600"
                              />
                              <label htmlFor="periodo" className="text-sm text-purple-700">
                                Período personalizado
                              </label>
                            </div>
                          </div>
                        </div>

                        {/* Seletor de Período */}
                        {opcoesFiltro === "periodo" && (
                          <div className="bg-purple-50 p-4 rounded-lg">
                            <Label className="text-sm font-medium text-purple-700 mb-2 block">
                              <Calendar className="h-4 w-4 inline mr-1" />
                              Selecionar Período
                            </Label>
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <Label className="text-xs text-purple-600">Data Início</Label>
                                <Input
                                  type="date"
                                  value={dataInicioDownload}
                                  onChange={(e) => setDataInicioDownload(e.target.value)}
                                  className="text-sm"
                                />
                              </div>
                              <div>
                                <Label className="text-xs text-purple-600">Data Fim</Label>
                                <Input
                                  type="date"
                                  value={dataFimDownload}
                                  onChange={(e) => setDataFimDownload(e.target.value)}
                                  className="text-sm"
                                />
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Opções Extras */}
                        <div>
                          <Label className="text-sm font-medium text-purple-700 mb-3 block">⚙️ Opções Extras</Label>
                          <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                id="graficos"
                                checked={incluirGraficos}
                                onChange={(e) => setIncluirGraficos(e.target.checked)}
                                className="text-purple-600"
                              />
                              <label htmlFor="graficos" className="text-sm text-purple-700">
                                Incluir aba de estatísticas e gráficos
                              </label>
                            </div>
                          </div>
                        </div>

                        {/* Resumo */}
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <Label className="text-sm font-medium text-gray-700">Resumo:</Label>
                          <div className="text-xs text-gray-600 mt-1 space-y-1">
                            <p>
                              • Formato: <strong>Excel (.xlsx)</strong> formatado
                            </p>
                            <p>
                              • Layout: <strong>Uma linha por prestador</strong>
                            </p>
                            <p>
                              • Dados:{" "}
                              <strong>
                                {opcoesFiltro === "todos" ? "Todos os registros" : "Período personalizado"}
                              </strong>
                            </p>
                            <p>
                              • Estatísticas: <strong>{incluirGraficos ? "Incluídas" : "Não incluídas"}</strong>
                            </p>
                          </div>
                        </div>

                        {/* Botões */}
                        <div className="flex gap-3 pt-4">
                          <Button
                            variant="outline"
                            onClick={() => setModalDownloadAberto(false)}
                            className="flex-1"
                            disabled={baixandoArquivo}
                          >
                            Cancelar
                          </Button>
                          <Button
                            onClick={gerarDownloadExcel}
                            className="flex-1 bg-green-600 hover:bg-green-700"
                            disabled={
                              baixandoArquivo ||
                              (opcoesFiltro === "periodo" && (!dataInicioDownload || !dataFimDownload))
                            }
                          >
                            {baixandoArquivo ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-white mr-2"></div>
                                Gerando...
                              </>
                            ) : (
                              <>
                                <Download className="h-4 w-4 mr-2" />
                                Download Excel
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Departamento */}
                <div>
                  <Label className="text-sm font-medium text-purple-700 mb-2 block">Departamento</Label>
                  <select
                    value={filtroDepartamento}
                    onChange={(e) => setFiltroDepartamento(e.target.value)}
                    className="w-full p-2 border border-purple-300 rounded-md"
                  >
                    <option value="todos">Todos</option>
                    {departamentos.map((dept) => (
                      <option key={dept} value={dept}>
                        {dept}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Status Checagem */}
                <div>
                  <Label className="text-sm font-medium text-purple-700 mb-2 block">Status Checagem</Label>
                  <Select value={filtroStatus} onValueChange={setFiltroStatus}>
                    <SelectTrigger className="border-purple-300">
                      <SelectValue placeholder="Selecione o status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos</SelectItem>
                      <SelectItem value="pendente">Pendente</SelectItem>
                      <SelectItem value="aprovado">Aprovado</SelectItem>
                      <SelectItem value="reprovado">Reprovado</SelectItem>
                      <SelectItem value="vencida">Vencida</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Status Liberação */}
                <div>
                  <Label className="text-sm font-medium text-purple-700 mb-2 block">Status Liberação</Label>
                  <Select value={filtroCadastro} onValueChange={setFiltroCadastro}>
                    <SelectTrigger className="border-purple-300">
                      <SelectValue placeholder="Selecione o cadastro" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos</SelectItem>
                      <SelectItem value="pendente">Pendente</SelectItem>
                      <SelectItem value="ok">Ok</SelectItem>
                      <SelectItem value="urgente">Urgente</SelectItem>
                      <SelectItem value="vencida">Vencida</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Busca Geral */}
                <div>
                  <Label className="text-sm font-medium text-purple-700 mb-2 block">Busca Geral</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-purple-400" />
                    <Input
                      type="text"
                      placeholder="Nome ou documento..."
                      value={buscaGeral}
                      onChange={(e) => setBuscaGeral(e.target.value)}
                      className="pl-10 border-purple-300 focus:border-purple-600 focus:ring-purple-600"
                    />
                  </div>
                  {buscaGeral && <p className="text-xs text-purple-500 mt-1">{dadosFiltrados.length} resultado(s)</p>}
                </div>
              </div>
            </div>

            {/* Tabela */}
            <div className="rounded-lg border border-purple-200 overflow-x-auto">
              <Table className="min-w-full">
                <TableHeader>
                  <TableRow className="bg-purple-50">
                    {colunasVisiveis.dataSolicitacao && (
                      <TableHead className="font-semibold text-purple-800 text-center min-w-[110px] whitespace-nowrap">
                        Data Solicitação
                      </TableHead>
                    )}
                    {colunasVisiveis.prestador && (
                      <TableHead className="font-semibold text-purple-800 text-center min-w-[160px]">
                        Prestador
                      </TableHead>
                    )}
                    {colunasVisiveis.documento && (
                      <TableHead className="font-semibold text-purple-800 text-center min-w-[130px]">
                        Documento
                      </TableHead>
                    )}
                    {colunasVisiveis.dataInicial && (
                      <TableHead className="font-semibold text-purple-800 text-center min-w-[100px] whitespace-nowrap">
                        Data Inicial
                      </TableHead>
                    )}
                    {colunasVisiveis.dataFinal && (
                      <TableHead className="font-semibold text-purple-800 text-center min-w-[100px] whitespace-nowrap">
                        Data Final
                      </TableHead>
                    )}
                    {colunasVisiveis.liberacao && (
                      <TableHead className="font-semibold text-purple-800 text-center min-w-[90px]">
                        Liberação
                      </TableHead>
                    )}
                    {colunasVisiveis.checagem && (
                      <TableHead className="font-semibold text-purple-800 text-center min-w-[100px]">
                        Checagem
                      </TableHead>
                    )}
                    {colunasVisiveis.validaAte && (
                      <TableHead className="font-semibold text-purple-800 text-center min-w-[130px] whitespace-nowrap">
                        Válida até
                      </TableHead>
                    )}
                    {colunasVisiveis.acoes && (
                      <TableHead className="font-semibold text-purple-800 text-center min-w-[120px]">Ações</TableHead>
                    )}
                    {colunasVisiveis.justificativa && (
                      <TableHead className="font-semibold text-purple-800 text-center min-w-[200px]">
                        Justificativa
                      </TableHead>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dadosPaginados.map(({ solicitacao, prestador, prioridade }, index) => {
                    const prestadorIndex = solicitacao.prestadores
                      ? solicitacao.prestadores.findIndex((p) => p.id === prestador.id)
                      : -1
                    const isFirstPrestadorOfSolicitacao =
                      index === 0 || dadosPaginados[index - 1].solicitacao.id !== solicitacao.id

                    return (
                      <TableRow key={`${solicitacao.id}-${prestador.id}`} className="hover:bg-purple-50">
                        {colunasVisiveis.dataSolicitacao && (
                          <TableCell className="text-sm whitespace-nowrap text-center">
                            {solicitacao.dataSolicitacao}
                          </TableCell>
                        )}
                        {colunasVisiveis.prestador && (
                          <TableCell className="text-sm text-center">
                            <div className="whitespace-nowrap font-medium">{prestador.nome}</div>
                          </TableCell>
                        )}
                        {colunasVisiveis.documento && (
                          <TableCell className="text-sm text-center">
                            <div className="text-xs font-mono whitespace-nowrap">{prestador.documento}</div>
                          </TableCell>
                        )}
                        {colunasVisiveis.dataInicial && (
                          <TableCell className="text-sm whitespace-nowrap text-center">
                            {prestador.status === "reprovado" ? (
                              <span className="text-purple-400">-</span>
                            ) : (
                              solicitacao.dataInicial
                            )}
                          </TableCell>
                        )}
                        {colunasVisiveis.dataFinal && (
                          <TableCell className="text-sm whitespace-nowrap text-center">
                            {prestador.status === "reprovado" ? (
                              <span className="text-purple-400">-</span>
                            ) : (
                              solicitacao.dataFinal
                            )}
                          </TableCell>
                        )}
                        {colunasVisiveis.liberacao && (
                          <TableCell className="whitespace-nowrap text-center">
                            <div className="flex items-center justify-center gap-2">
                              <StatusCadastroIcon status={getCadastroStatus(prestador, solicitacao.dataFinal)} />
                              <StatusCadastroBadge status={getCadastroStatus(prestador, solicitacao.dataFinal)} />
                            </div>
                          </TableCell>
                        )}
                        {colunasVisiveis.checagem && (
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center gap-2 whitespace-nowrap">
                              {/* SUPORTE: Mapear TODOS os status do banco para componente */}
                              {prestador.status === "aprovado" && (
                                <>
                                  <CheckCircle className="h-4 w-4 text-green-600" />
                                  <Badge className="bg-green-100 text-green-800 border-green-200">Aprovada</Badge>
                                </>
                              )}
                              {prestador.status === "reprovado" && (
                                <>
                                  <XCircle className="h-4 w-4 text-red-600" />
                                  <Badge className="bg-red-100 text-red-800 border-red-200">Reprovada</Badge>
                                </>
                              )}
                              {prestador.status === "pendente" && (
                                <>
                                  <Clock className="h-4 w-4 text-yellow-600" />
                                  <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Pendente</Badge>
                                </>
                              )}
                              {prestador.status === "excecao" && (
                                <>
                                  <ShieldAlert className="h-4 w-4 text-purple-600" />
                                  <Badge className="bg-purple-100 text-purple-800 border-purple-200">Exceção</Badge>
                                </>
                              )}
                            </div>
                          </TableCell>
                        )}
                        {colunasVisiveis.validaAte && (
                          <TableCell className="text-sm whitespace-nowrap text-center">
                            {prestador.checagemValidaAte ? (
                              <span>{formatarDataParaBR(prestador.checagemValidaAte)}</span>
                            ) : (
                              <span className="text-purple-400">-</span>
                            )}
                          </TableCell>
                        )}
                        {colunasVisiveis.acoes && (
                          <TableCell>
                            <div className="flex items-center justify-center gap-1 relative">
                              <div className="relative">
                                <Button
                                  onClick={() => iniciarEdicao(solicitacao, prestador)}
                                  variant="outline"
                                  size="sm"
                                  className="border-purple-600 text-purple-600 hover:bg-purple-50 h-7 w-7 p-0"
                                >
                                  <Edit className="h-3 w-3" />
                                </Button>

                                {/* Modal de Edição */}
                                {prestadorEditando === prestador.id && (
                                  <div className="fixed inset-0 z-50 flex items-center justify-center">
                                    {/* Overlay */}
                                    <div
                                      className="fixed inset-0 bg-black bg-opacity-50"
                                      onClick={cancelarEdicao}
                                    ></div>

                                    {/* Modal Content */}
                                    <div className="relative bg-white rounded-lg shadow-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                                      <div className="flex items-center justify-between mb-4">
                                        <h2 className="text-lg font-semibold text-purple-800">
                                          ✏️ Editar Prestador: {prestador.nome}
                                        </h2>
                                        <Button
                                          onClick={cancelarEdicao}
                                          variant="outline"
                                          size="sm"
                                          className="h-8 w-8 p-0"
                                        >
                                          <X className="h-4 w-4" />
                                        </Button>
                                      </div>

                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {/* Dados do Prestador */}
                                        <div className="space-y-3">
                                          <h3 className="font-medium text-purple-700 border-b pb-1">
                                            👤 Dados do Prestador
                                          </h3>

                                          <div>
                                            <Label className="text-xs text-purple-600">Nome</Label>
                                            <Input
                                              value={dadosEdicao.nome || ""}
                                              onChange={(e) =>
                                                setDadosEdicao((prev) => ({ ...prev, nome: e.target.value }))
                                              }
                                              className="text-sm"
                                            />
                                          </div>

                                          <div>
                                            <Label className="text-xs text-purple-600">Documento</Label>
                                            <Input
                                              value={dadosEdicao.documento || ""}
                                              onChange={(e) =>
                                                setDadosEdicao((prev) => ({ ...prev, documento: e.target.value }))
                                              }
                                              className="text-sm"
                                            />
                                          </div>

                                          <div>
                                            <Label className="text-xs text-purple-600">Documento 2</Label>
                                            <Input
                                              value={dadosEdicao.documento2 || ""}
                                              onChange={(e) =>
                                                setDadosEdicao((prev) => ({ ...prev, documento2: e.target.value }))
                                              }
                                              className="text-sm"
                                            />
                                          </div>

                                          <div>
                                            <Label className="text-xs text-purple-600">Empresa</Label>
                                            <Input
                                              value={dadosEdicao.empresa || ""}
                                              onChange={(e) =>
                                                setDadosEdicao((prev) => ({ ...prev, empresa: e.target.value }))
                                              }
                                              className="text-sm"
                                            />
                                          </div>

                                          <div>
                                            <Label className="text-xs text-purple-600">Status Checagem</Label>
                                            <select
                                              value={dadosEdicao.status || ""}
                                              onChange={(e) =>
                                                setDadosEdicao((prev) => ({ ...prev, status: e.target.value }))
                                              }
                                              className="w-full p-2 border border-purple-300 rounded-md text-sm"
                                            >
                                              <option value="pendente">Pendente</option>
                                              <option value="aprovado">Aprovado</option>
                                              <option value="reprovado">Reprovado</option>
                                              <option value="excecao">Exceção</option>
                                            </select>
                                          </div>

                                          <div>
                                            <Label className="text-xs text-purple-600">Status Liberação</Label>
                                            <select
                                              value={dadosEdicao.cadastro || ""}
                                              onChange={(e) =>
                                                setDadosEdicao((prev) => ({ ...prev, cadastro: e.target.value }))
                                              }
                                              className="w-full p-2 border border-purple-300 rounded-md text-sm"
                                            >
                                              <option value="pendente">Pendente</option>
                                              <option value="ok">Ok</option>
                                              <option value="urgente">Urgente</option>
                                            </select>
                                          </div>

                                          <div>
                                            <Label className="text-xs text-purple-600">Checagem Válida Até</Label>
                                            <Input
                                              type="date"
                                              value={dadosEdicao.checagemValidaAte || ""}
                                              onChange={(e) =>
                                                setDadosEdicao((prev) => ({
                                                  ...prev,
                                                  checagemValidaAte: e.target.value,
                                                }))
                                              }
                                              className="text-sm"
                                            />
                                          </div>
                                        </div>

                                        {/* Dados da Solicitação */}
                                        <div className="space-y-3">
                                          <h3 className="font-medium text-purple-700 border-b pb-1">
                                            📋 Dados da Solicitação
                                          </h3>

                                          <div>
                                            <Label className="text-xs text-purple-600">Data Solicitação</Label>
                                            <Input
                                              type="date"
                                              value={dadosEdicao.dataSolicitacao || ""}
                                              onChange={(e) =>
                                                setDadosEdicao((prev) => ({ ...prev, dataSolicitacao: e.target.value }))
                                              }
                                              className="text-sm"
                                            />
                                          </div>

                                          <div>
                                            <Label className="text-xs text-purple-600">Solicitante</Label>
                                            <Input
                                              value={dadosEdicao.solicitante || ""}
                                              onChange={(e) =>
                                                setDadosEdicao((prev) => ({ ...prev, solicitante: e.target.value }))
                                              }
                                              className="text-sm"
                                            />
                                          </div>

                                          <div>
                                            <Label className="text-xs text-purple-600">Departamento</Label>
                                            <Input
                                              value={dadosEdicao.departamento || ""}
                                              onChange={(e) =>
                                                setDadosEdicao((prev) => ({ ...prev, departamento: e.target.value }))
                                              }
                                              className="text-sm"
                                            />
                                          </div>

                                          <div>
                                            <Label className="text-xs text-purple-600">Local</Label>
                                            <Input
                                              value={dadosEdicao.local || ""}
                                              onChange={(e) =>
                                                setDadosEdicao((prev) => ({ ...prev, local: e.target.value }))
                                              }
                                              className="text-sm"
                                            />
                                          </div>

                                          <div>
                                            <Label className="text-xs text-purple-600">Empresa Geral</Label>
                                            <Input
                                              value={dadosEdicao.empresaGeral || ""}
                                              onChange={(e) =>
                                                setDadosEdicao((prev) => ({ ...prev, empresaGeral: e.target.value }))
                                              }
                                              className="text-sm"
                                            />
                                          </div>

                                          <div>
                                            <Label className="text-xs text-purple-600">Data Inicial</Label>
                                            <Input
                                              type="date"
                                              value={dadosEdicao.dataInicial || ""}
                                              onChange={(e) =>
                                                setDadosEdicao((prev) => ({ ...prev, dataInicial: e.target.value }))
                                              }
                                              className="text-sm"
                                            />
                                          </div>

                                          <div>
                                            <Label className="text-xs text-purple-600">Data Final</Label>
                                            <Input
                                              type="date"
                                              value={dadosEdicao.dataFinal || ""}
                                              onChange={(e) =>
                                                setDadosEdicao((prev) => ({ ...prev, dataFinal: e.target.value }))
                                              }
                                              className="text-sm"
                                            />
                                          </div>
                                        </div>

                                        {/* Justificativa - Largura completa */}
                                        <div className="md:col-span-2">
                                          <Label className="text-xs text-purple-600">Justificativa</Label>
                                          <Textarea
                                            value={dadosEdicao.justificativa || ""}
                                            onChange={(e) =>
                                              setDadosEdicao((prev) => ({ ...prev, justificativa: e.target.value }))
                                            }
                                            className="text-sm"
                                            rows={3}
                                            placeholder="Observações, justificativas..."
                                          />
                                        </div>
                                      </div>

                                      {/* Botões */}
                                      <div className="flex justify-end gap-2 mt-6 pt-4 border-t">
                                        <Button
                                          onClick={cancelarEdicao}
                                          variant="outline"
                                          size="sm"
                                          className="border-gray-300 text-gray-600"
                                        >
                                          <X className="h-3 w-3 mr-1" />
                                          Cancelar
                                        </Button>
                                        <Button
                                          onClick={() => salvarEdicao(solicitacao, prestador)}
                                          disabled={salvandoEdicao}
                                          size="sm"
                                          className="bg-green-600 hover:bg-green-700 text-white"
                                        >
                                          {salvandoEdicao ? (
                                            <>
                                              <div className="animate-spin rounded-full h-3 w-3 border-t-2 border-white mr-1"></div>
                                              Salvando...
                                            </>
                                          ) : (
                                            <>
                                              <Save className="h-3 w-3 mr-1" />
                                              Salvar
                                            </>
                                          )}
                                        </Button>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>

                              {/* Mensagem de sucesso */}
                              {mensagemSucesso === prestador.id && (
                                <div className="absolute top-8 right-0 z-40 bg-green-100 border border-green-200 rounded-lg p-2 text-xs text-green-700">
                                  ✅ Dados atualizados!
                                </div>
                              )}
                            </div>
                          </TableCell>
                        )}
                        {colunasVisiveis.justificativa && (
                          <TableCell className="text-sm text-center">
                            {prestador.justificativa ? (
                              <div className="max-w-xs truncate" title={prestador.justificativa}>
                                {prestador.justificativa}
                              </div>
                            ) : null}
                          </TableCell>
                        )}
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>

            {/* Controles de Paginação */}
            <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-sm text-purple-600">
                <strong>
                  Página {paginaAtual} de {totalPaginas}
                </strong>{" "}
                | Mostrando {indiceInicio + 1}-{Math.min(indiceFim, totalItens)} de {totalItens} prestadores
              </div>

              <div className="flex items-center gap-2">
                <Button
                  onClick={() => irParaPagina(1)}
                  disabled={paginaAtual === 1}
                  variant="outline"
                  size="sm"
                  className="border-purple-600 text-purple-600 disabled:opacity-50"
                >
                  ⏮️ Primeira
                </Button>
                <Button
                  onClick={() => irParaPagina(paginaAtual - 1)}
                  disabled={paginaAtual === 1}
                  variant="outline"
                  size="sm"
                  className="border-purple-600 text-purple-600 disabled:opacity-50"
                >
                  ⬅️ Anterior
                </Button>

                <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded text-sm font-medium">
                  {paginaAtual}
                </span>

                <Button
                  onClick={() => irParaPagina(paginaAtual + 1)}
                  disabled={paginaAtual === totalPaginas}
                  variant="outline"
                  size="sm"
                  className="border-purple-600 text-purple-600 disabled:opacity-50"
                >
                  Próxima ➡️
                </Button>
                <Button
                  onClick={() => irParaPagina(totalPaginas)}
                  disabled={paginaAtual === totalPaginas}
                  variant="outline"
                  size="sm"
                  className="border-purple-600 text-purple-600 disabled:opacity-50"
                >
                  Última ⏭️
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
