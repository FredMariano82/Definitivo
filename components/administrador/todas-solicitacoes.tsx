"use client"

import { useState, useEffect } from "react"
import * as XLSX from "xlsx"
import {
  Filter,
  Search,
  X,
  CheckCircle,
  XCircle,
  Clock,
  ShieldAlert,
  Columns,
  ChevronLeft,
  ChevronRight,
  Check,
  User,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronDown,
  Edit,
  Calendar,
  LayoutDashboard,
  List,
  FileSpreadsheet,
  Download,
  RefreshCw,
  Plus
} from "lucide-react"
import Link from "next/link"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import DashboardAdmin from "./dashboard-admin"
import RelatorioModal from "./relatorio-modal"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import type { Solicitacao, PrestadorAvaliacao } from "../../types"
import { StatusChecagemBadge, StatusChecagemIcon, StatusLiberacaoBadge, StatusLiberacaoIcon, getChecagemStatus, getLiberacaoStatus } from "../ui/status-badges"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getAllSolicitacoes } from "../../services/solicitacoes-service"
import { supabase } from "@/lib/supabase"
import { formatarDataParaBR } from "../../utils/date-helpers"
import { Badge } from "../ui/badge"
import { DataInicialIndicator } from "../../utils/date-indicators"
import PageHeader from "@/components/page-header"
import { useAuth } from "../../contexts/auth-context"
import { SolicitacoesService } from "../../services/solicitacoes-service"

type StatusLiberacao = "pendente" | "ok" | "urgente" | "vencida" | "negada"

// Definir todas as colunas disponíveis
const COLUNAS_DISPONIVEIS = [
  { key: "solicitacao", label: "Solicitação" },
  { key: "prestador", label: "Prestador" },
  { key: "doc1", label: "Doc1" },
  { key: "doc2", label: "Doc2" },
  { key: "empresa", label: "Empresa" },
  { key: "evento", label: "Evento" },
  { key: "checagem", label: "Checagem" },
  { key: "liberacao", label: "Liberação" },
  { key: "validaAte", label: "Válida até" },
  { key: "dataInicial", label: "Data Inicial" },
  { key: "dataFinal", label: "Data Final" },
  { key: "acoes", label: "Ações" },
  { key: "justificativa", label: "Justificativa" },
]

const PRESTADORES_POR_PAGINA = 10

export default function TodasSolicitacoes() {
  const { usuario } = useAuth()
  const [solicitacoes, setSolicitacoes] = useState<Solicitacao[]>([])
  const [carregando, setCarregando] = useState(true)
  const [carregandoDownload, setCarregandoDownload] = useState(false)
  const [filtroStatus, setFiltroStatus] = useState<string>("todos")
  const [filtroCadastro, setFiltroCadastro] = useState<string>("todos")
  const [filtroAcoes, setFiltroAcoes] = useState<string>("todos")
  const [filtroDepartamento, setFiltroDepartamento] = useState<string>("todos")
  const [filtroEvento, setFiltroEvento] = useState<string>("todos")
  const [buscaGeral, setBuscaGeral] = useState("")
  const [detalhesSolicitacao, setDetalhesSolicitacao] = useState<Solicitacao | null>(null)
  const [popoverAberto, setPopoverAberto] = useState<string | null>(null)
  const [mensagemSucesso, setMensagemSucesso] = useState<string | null>(null)
  const [modalColunasAberto, setModalColunasAberto] = useState(false)
  const [paginaAtual, setPaginaAtual] = useState(1)
  const [mostrarFiltros, setMostrarFiltros] = useState(false)
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" }>({
    key: "", // Default sorting by priority
    direction: "asc",
  })

  // 🆕 Estados para Modal de Observações (Negado)
  const [modalObservacoesAberto, setModalObservacoesAberto] = useState(false)
  const [prestadorSelecionado, setPrestadorSelecionado] = useState<{
    solicitacao: Solicitacao
    prestador: PrestadorAvaliacao
  } | null>(null)
  const [observacoes, setObservacoes] = useState("")
  const [carregandoNegacao, setCarregandoNegacao] = useState(false)

  // 🎯 ESTADOS PARA EDIÇÃO DE SOLICITAÇÃO (EXCLUSIVO SUPERADMIN)
  const [modalEditarSolicitacaoAberta, setModalEditarSolicitacaoAberta] = useState(false)
  const [solicitacaoParaEditar, setSolicitacaoParaEditar] = useState<Solicitacao | null>(null)
  const [novaDataSolicitacao, setNovaDataSolicitacao] = useState("")
  const [novaHoraSolicitacao, setNovaHoraSolicitacao] = useState("")
  const [salvandoEdicao, setSalvandoEdicao] = useState(false)
  const [processandoId, setProcessandoId] = useState<string | null>(null)

  // Estado inicial das colunas: todas visíveis por padrão (Sempre reseta ao carregar)
  const [colunasVisiveis, setColunasVisiveis] = useState<Record<string, boolean>>(() => {
    return COLUNAS_DISPONIVEIS.reduce((acc, col) => {
      acc[col.key] = true
      return acc
    }, {} as Record<string, boolean>)
  })

  // Carregar solicitações do banco
  useEffect(() => {
    buscarSolicitacoes()
  }, [])

  // Resetar página quando filtros mudarem
  useEffect(() => {
    setPaginaAtual(1)
  }, [filtroStatus, filtroCadastro, filtroAcoes, filtroDepartamento, filtroEvento, buscaGeral])

  const buscarSolicitacoes = async () => {
    try {
      setCarregando(true)
      console.log("🔍 PRODUÇÃO REAL: Buscando solicitações...")
      const dados = await getAllSolicitacoes()
      console.log("📊 PRODUÇÃO REAL: Dados carregados:", dados.length, "solicitações")

      // DEBUG: Verificar se justificativa está sendo carregada
      dados.forEach((sol, i) => {
        sol.prestadores?.forEach((prest, j) => {
          if (prest.justificativa) {
            console.log(`✅ PRODUÇÃO REAL: Justificativa encontrada - Sol ${i}, Prest ${j}:`, prest.justificativa)
          }
        })
      })

      setSolicitacoes(dados)
    } catch (error) {
      console.error("❌ PRODUÇÃO REAL: Erro:", error)
    } finally {
      setCarregando(false)
    }
  }

  const departamentos = Array.from(new Set(solicitacoes.map((s) => s.departamento)))
  const eventosUnicos = Array.from(new Set(solicitacoes.map((s) => s.local).filter(Boolean)))

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

  // 🆕 NOVA FUNÇÃO DE PRIORIDADE SIMPLIFICADA
  const getPrioridade = (prestador: PrestadorAvaliacao, dataFinal: string) => {
    const statusLiberacao = getLiberacaoStatus(prestador, dataFinal).toLowerCase()
    const statusChecagem = getChecagemStatus(prestador).toLowerCase()

    // 🔴 FINAL DA FILA: Vencidos (Prioridade baixíssima)
    if (statusLiberacao === "vencida" || statusChecagem === "vencida") {
      return 1000
    }

    // 🟢 TOPO DA FILA: Liberação Pendente ou Urgente
    if (statusLiberacao === "pendente" || statusLiberacao === "urgente") {
      return 10
    }

    // 🟡 MEIO DA FILA: Outros casos (Ok, Negada, etc)
    return 500
  }

  // 🆕 FUNÇÃO PARA CALCULAR DIAS ATÉ DATA INICIAL (para critério de desempate)
  const getDiasAteDataInicial = (dataInicial: string): number => {
    try {
      // Converter data DD/MM/YYYY para Date
      const [dia, mes, ano] = dataInicial.split("/").map(Number)
      const dataInicialDate = new Date(ano, mes - 1, dia)
      const hoje = new Date()

      // Zerar horas para comparar apenas datas
      hoje.setHours(0, 0, 0, 0)
      dataInicialDate.setHours(0, 0, 0, 0)

      // Calcular diferença em dias
      const diffTime = dataInicialDate.getTime() - hoje.getTime()
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

      return diffDays
    } catch (error) {
      console.error("Erro ao calcular dias até data inicial:", error)
      return 999 // Valor alto para colocar no final em caso de erro
    }
  }

  // 🆕 FUNÇÃO PARA VERIFICAR SE BOTÕES DEVEM ESTAR HABILITADOS
  const isBotoesHabilitados = (prestador: PrestadorAvaliacao): boolean => {
    // 1. Checagem deve estar concluída
    if (prestador.checagem.toLowerCase() === "pendente") return false

    // 2. Não deve estar processando no momento
    if (processandoId === prestador.id) return false

    // 3. Não deve ter um status conclusivo de liberação (Já processado)
    const statusAtual = prestador.liberacao?.toLowerCase()
    if (statusAtual === "ok" || statusAtual === "negada") return false

    return true
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "aprovado":
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case "reprovado":
      case "reprovada":
        return <XCircle className="h-4 w-4 text-red-600" />
      case "pendente":
        return <Clock className="h-4 w-4 text-yellow-600" />
      case "excecao":
        return <ShieldAlert className="h-4 w-4 text-purple-600" />
      default:
        return null
    }
  }

  const requestSort = (key: string) => {
    let direction: "asc" | "desc" = "asc"
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc"
    }
    setSortConfig({ key, direction })
  }

  const getSortIcon = (columnKey: string) => {
    if (sortConfig.key !== columnKey) return <ArrowUpDown className="h-4 w-4 ml-1 text-slate-400" />
    if (sortConfig.direction === "asc") return <ArrowUp className="h-4 w-4 ml-1 text-blue-600" />
    return <ArrowDown className="h-4 w-4 ml-1 text-blue-600" />
  }

  // Função para alternar visibilidade da coluna
  const toggleColuna = (chaveColuna: string) => {
    setColunasVisiveis((prev) => ({
      ...prev,
      [chaveColuna]: !prev[chaveColuna],
    }))
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

  // Filtrar solicitações e prestadores baseado nos filtros
  const dadosIniciais = solicitacoes
    .map((solicitacao) => {
      // Filtro de departamento
      const deptMatch = filtroDepartamento === "todos" || solicitacao.departamento === filtroDepartamento
      // Filtro de evento
      const eventoMatch = filtroEvento === "todos" || solicitacao.local === filtroEvento

      if (!deptMatch || !eventoMatch) return null

      // Filtrar prestadores dentro da solicitação
      const prestadoresFiltrados = solicitacao.prestadores
        ? solicitacao.prestadores.filter((prestador) => {
          // Calcular status real para filtros
          const checagemStatusReal = getChecagemStatus(prestador)
          const liberacaoStatusReal = getLiberacaoStatus(prestador, solicitacao.dataFinal)

          // Filtro de status checagem (incluindo status calculados)
          let statusMatch = filtroStatus === "todos"
          if (filtroStatus === "vencida") {
            statusMatch = checagemStatusReal === "vencida"
          } else if (filtroStatus !== "todos") {
            // CORREÇÃO: Mapear filtro para status do banco
            const statusParaFiltro =
              filtroStatus === "aprovado" ? "aprovado" : filtroStatus === "reprovado" ? "reprovado" : filtroStatus
            statusMatch = prestador.checagem === statusParaFiltro
          }

          // Filtro de cadastro (incluindo status calculados)
          let cadastroMatch = filtroCadastro === "todos"
          if (filtroCadastro === "vencida") {
            cadastroMatch = liberacaoStatusReal === "vencida"
          } else if (filtroCadastro === "negada") {
            cadastroMatch = liberacaoStatusReal === "negada"
          } else if (filtroCadastro !== "todos") {
            cadastroMatch = prestador.liberacao === filtroCadastro
          }

          // Filtro de busca geral
          let buscaMatch = true
          if (buscaGeral.trim()) {
            const termoBusca = buscaGeral.toLowerCase().trim()
            buscaMatch = !!(
              prestador.nome.toLowerCase().includes(termoBusca) ||
              (prestador.doc1 && prestador.doc1.toLowerCase().includes(termoBusca))
            )
          }

          // Filtro de ações (tratativas)
          let acoesMatch = filtroAcoes === "todos"
          if (filtroAcoes !== "todos") {
            const habilitado = isBotoesHabilitados(prestador)
            acoesMatch = filtroAcoes === "habilitado" ? habilitado : !habilitado
          }

          return statusMatch && cadastroMatch && acoesMatch && buscaMatch
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

  // 🆕 ORDENAÇÃO COM NOVAS REGRAS DE PRIORIDADE
  const todosPrestadoresFiltrados = dadosIniciais
    .flatMap((solicitacao) =>
      solicitacao.prestadores
        ? solicitacao.prestadores.map((prestador) => ({
          solicitacao,
          prestador,
          prioridade: getPrioridade(prestador, solicitacao.dataFinal),
          diasAteDataInicial: getDiasAteDataInicial(solicitacao.dataInicial),
        }))
        : [],
    )
    .sort((a, b) => {
      // 1. Lógica de ordenação dinâmica baseada no sortConfig
      const { key, direction } = sortConfig
      let valorA: any
      let valorB: any

      switch (key) {
        case "prestador":
          valorA = a.prestador.nome
          valorB = b.prestador.nome
          break
        case "doc1":
          valorA = a.prestador.doc1
          valorB = b.prestador.doc1
          break
        case "dataInicial":
          valorA = new Date(a.solicitacao.dataInicial.split("/").reverse().join("-")).getTime()
          valorB = new Date(b.solicitacao.dataInicial.split("/").reverse().join("-")).getTime()
          break
        case "dataFinal":
          valorA = new Date(a.solicitacao.dataFinal.split("/").reverse().join("-")).getTime()
          valorB = new Date(b.solicitacao.dataFinal.split("/").reverse().join("-")).getTime()
          break
        case "prioridade":
        default:
          // Se nenhuma coluna específica foi clicada ou é a prioridade padrão
          if (a.prioridade !== b.prioridade) {
            return a.prioridade - b.prioridade
          }
          if (a.diasAteDataInicial !== b.diasAteDataInicial) {
            return a.diasAteDataInicial - b.diasAteDataInicial
          }
          const dtA = new Date(a.solicitacao.dataSolicitacao.split("/").reverse().join("-"))
          const dtB = new Date(b.solicitacao.dataSolicitacao.split("/").reverse().join("-"))
          return dtB.getTime() - dtA.getTime()
      }

      if (valorA < valorB) {
        return direction === "asc" ? -1 : 1
      }
      if (valorA > valorB) {
        return direction === "asc" ? 1 : -1
      }

      // Critério de desempate se os valores ordenados forem iguais
      if (a.prioridade !== b.prioridade) {
        return a.prioridade - b.prioridade
      }
      return a.diasAteDataInicial - b.diasAteDataInicial
    })

  // Calcular paginação
  const totalPrestadores = todosPrestadoresFiltrados.length
  const totalPaginas = Math.ceil(totalPrestadores / PRESTADORES_POR_PAGINA)
  const indiceInicio = (paginaAtual - 1) * PRESTADORES_POR_PAGINA
  const indiceFim = indiceInicio + PRESTADORES_POR_PAGINA
  const dadosFiltrados = todosPrestadoresFiltrados.slice(indiceInicio, indiceFim)

  const handleEditarClick = (prestadorId: string) => {
    setPopoverAberto(prestadorId)
    setMensagemSucesso(null)
  }

  // 🆕 Função para abrir modal de observações (Negado ou Devolver)
  const handleNegarClick = (solicitacao: Solicitacao, prestador: PrestadorAvaliacao) => {
    setPrestadorSelecionado({ solicitacao, prestador })

    // Se for erro de RG, já preenche a observação para facilitar
    if (prestador.checagem === "erro_rg" || (prestador.checagem === "reprovado" && prestador.observacoes?.includes('[ERRO RG]'))) {
      setObservacoes("Devolvido para correção: doc1 informado não pertence a esta pessoa. Favor verificar.")
    } else {
      setObservacoes("")
    }

    setModalObservacoesAberto(true)
  }

  // 🆕 Função para confirmar negação com observações
  const handleConfirmarNegacao = async () => {
    if (!prestadorSelecionado || !observacoes.trim()) {
      alert("Por favor, preencha as observações antes de confirmar.")
      return
    }

    try {
      setCarregandoNegacao(true)
      setProcessandoId(prestadorSelecionado.prestador.id)
      console.log("🔴 PRODUÇÃO REAL: Negando prestador com observações...")

      const { error } = await supabase
        .from("prestadores")
        .update({
          liberacao: "negada",
          observacoes: observacoes.trim(),
        })
        .eq("id", prestadorSelecionado.prestador.id)

      if (error) {
        console.error("❌ PRODUÇÃO REAL: Erro ao negar prestador:", error)
        alert(`Erro ao negar prestador: ${error.message}`)
        return
      }

      console.log("✅ PRODUÇÃO REAL: Prestador negado com sucesso!")

      // Atualizar estado local
      setSolicitacoes((prevSolicitacoes) =>
        prevSolicitacoes.map((s) =>
          s.id === prestadorSelecionado.solicitacao.id
            ? {
              ...s,
              prestadores: s.prestadores
                ? s.prestadores.map((p) =>
                  p.id === prestadorSelecionado.prestador.id
                    ? { ...p, liberacao: "negada" as StatusLiberacao, observacoes: observacoes.trim() }
                    : p,
                )
                : [],
            }
            : s,
        ),
      )

      // Fechar modal e limpar estados
      setModalObservacoesAberto(false)
      setPrestadorSelecionado(null)
      setObservacoes("")
      setMensagemSucesso(prestadorSelecionado.prestador.id)

      // Remover mensagem de sucesso após 3 segundos
      setTimeout(() => {
        setMensagemSucesso(null)
      }, 3000)
    } catch (error: any) {
      console.error("💥 PRODUÇÃO REAL: Erro na negação:", error)
      alert(`Erro inesperado: ${error.message}`)
    } finally {
      setCarregandoNegacao(false)
      setProcessandoId(null)
    }
  }

  const handleConfirmarCadastro = async (solicitacao: Solicitacao, prestador: PrestadorAvaliacao) => {
    try {
      setProcessandoId(prestador.id)
      console.log("🔧 PRODUÇÃO REAL: INICIANDO DEBUG...")
      console.log("📋 Dados recebidos:", {
        solicitacao: solicitacao.numero,
        prestador: {
          id: prestador.id,
          nome: prestador.nome,
          doc1: prestador.doc1,
          liberacaoAtual: prestador.liberacao,
        },
      })

      // Verificar se prestador.id existe
      if (!prestador.id) {
        console.error("❌ ERRO: prestador.id está vazio!")
        alert("Erro: ID do prestador não encontrado")
        return
      }

      // Verificar conexão com Supabase
      if (!supabase) {
        console.error("❌ ERRO: Supabase não inicializado!")
        alert("Erro: Problema de conexão com banco de dados")
        return
      }

      console.log("🔄 PRODUÇÃO REAL: Executando UPDATE...")

      // Tentar diferentes valores para o campo cadastro
      const { error } = await supabase
        .from("prestadores")
        .update({
          liberacao: "ok", // TESTE: Usar minúsculo primeiro
        })
        .eq("id", prestador.id)

      console.log("📊 Resultado do UPDATE:", { error })

      if (error) {
        console.error("❌ PRODUÇÃO REAL: Erro detalhado:", {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
        })

        alert(`Erro ao atualizar: ${error.message}`)
        return
      }

      console.log("✅ PRODUÇÃO REAL: UPDATE executado com sucesso!")

      // Atualizar o estado local
      setSolicitacoes((prevSolicitacoes) =>
        prevSolicitacoes.map((s) =>
          s.id === solicitacao.id
            ? {
              ...s,
              prestadores: s.prestadores
                ? s.prestadores.map((p) => (p.id === prestador.id ? { ...p, liberacao: "ok" as StatusLiberacao } : p))
                : [],
            }
            : s,
        ),
      )

      setPopoverAberto(null)
      setMensagemSucesso(prestador.id)

      console.log("✅ PRODUÇÃO REAL: Estado local atualizado com sucesso")

      // Remover mensagem de sucesso após 3 segundos
      setTimeout(() => {
        setMensagemSucesso(null)
      }, 3000)
    } catch (error: any) {
      console.error("💥 PRODUÇÃO REAL: Erro na função:", error)
      alert(`Erro inesperado: ${error.message}`)
    } finally {
      setProcessandoId(null)
    }
  }

  // 🎯 FUNÇÕES PARA EDIÇÃO DE SOLICITAÇÃO
  const handleAbrirEdicaoSolicitacao = (sol: Solicitacao) => {
    setSolicitacaoParaEditar(sol)
    setNovaDataSolicitacao(sol.dataSolicitacaoRaw || "")
    setNovaHoraSolicitacao(sol.horaSolicitacaoRaw?.substring(0, 5) || "")
    setModalEditarSolicitacaoAberta(true)
  }

  const handleSalvarEdicaoSolicitacao = async () => {
    if (!solicitacaoParaEditar || !novaDataSolicitacao || !novaHoraSolicitacao) return

    try {
      setSalvandoEdicao(true)
      const { sucesso, erro } = await SolicitacoesService.atualizarDadosGeraisSolicitacao(
        solicitacaoParaEditar.id,
        {
          dataSolicitacao: novaDataSolicitacao,
          horaSolicitacao: `${novaHoraSolicitacao}:00`
        }
      )

      if (sucesso) {
        // Atualizar localmente
        setSolicitacoes(prev => prev.map(s =>
          s.id === solicitacaoParaEditar.id
            ? {
              ...s,
              dataSolicitacao: new Date(novaDataSolicitacao + "T00:00:00").toLocaleDateString("pt-BR"),
              dataSolicitacaoRaw: novaDataSolicitacao,
              horaSolicitacao: `${novaHoraSolicitacao}:00`,
              horaSolicitacaoRaw: `${novaHoraSolicitacao}:00`
            }
            : s
        ))
        setModalEditarSolicitacaoAberta(false)
      } else {
        alert("Erro ao atualizar: " + erro)
      }
    } catch (error: any) {
      alert("Erro inesperado: " + error.message)
    } finally {
      setSalvandoEdicao(false)
    }
  }

  const handleCancelar = () => {
    setPopoverAberto(null)
  }

  const handlePaginaAnterior = () => {
    if (paginaAtual > 1) {
      setPaginaAtual(paginaAtual - 1)
    }
  }

  const handleProximaPagina = () => {
    if (paginaAtual < totalPaginas) {
      setPaginaAtual(paginaAtual + 1)
    }
  }

  // 📥 Função para Download DIRETO (sem modal) - Exclusivo para a Aba Lista
  const handleDownloadExcel = async () => {
    try {
      setCarregandoDownload(true)
      console.log("📊 Iniciando download Excel Direto - Lista")

      const agora = new Date()
      const dataFormatada = agora.toLocaleDateString("pt-BR").replace(/\//g, "-")
      const nomeArquivo = `Solicitacoes_Lista_${dataFormatada}.xlsx`

      const dadosParaExportar = todosPrestadoresFiltrados.map(({ solicitacao, prestador }, index) => ({
        "Nº Solicitação": solicitacao.numero || "-",
        "Data Sol.": solicitacao.dataSolicitacao || "-",
        "Departamento": solicitacao.departamento || "-",
        "Local": solicitacao.local || "-",
        "Evento": solicitacao.local || "-",
        "Empresa": prestador.empresa || solicitacao.empresa || "-",
        "Prestador": prestador.nome || "-",
        "Doc1": prestador.doc1 || "-",
        "Doc2": prestador.doc2 || "-",
        "Checagem": (prestador.checagem || "pendente").toUpperCase(),
        "Válida até": prestador.checagemValidaAte ? formatarDataParaBR(prestador.checagemValidaAte) : "-",
        "Data Inicial": ((prestador.checagem as string) === "reprovado" || prestador.checagem === "reprovada") ? "-" : solicitacao.dataInicial,
        "Data Final": ((prestador.checagem as string) === "reprovado" || prestador.checagem === "reprovada") ? "-" : solicitacao.dataFinal,
        "Liberação": getLiberacaoStatus(prestador, solicitacao.dataFinal),
        "Justificativa": prestador.justificativa || "-",
        "Observações": prestador.observacoes || "-"
      }))

      const wb = XLSX.utils.book_new()
      const ws = XLSX.utils.json_to_sheet(dadosParaExportar)

      const wscols = [{ wch: 15 }, { wch: 12 }, { wch: 20 }, { wch: 20 }, { wch: 20 }, { wch: 25 }, { wch: 30 }, { wch: 18 }, { wch: 18 }, { wch: 15 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 20 }, { wch: 30 }, { wch: 30 }]
      ws["!cols"] = wscols

      XLSX.utils.book_append_sheet(wb, ws, "Lista de Solicitações")

      // Criar um resumo simplificado por departamento
      const resumo: Record<string, any> = {}
      todosPrestadoresFiltrados.forEach(({ solicitacao: s, prestador: p }) => {
        if (!resumo[s.departamento]) resumo[s.departamento] = { qtd: 0, custo: 0 }
        const jaProcessado = p.liberacao !== "pendente"
        const custo = (s.tipoSolicitacao === "checagem_liberacao" && jaProcessado) ? 20 : 0
        resumo[s.departamento].qtd += jaProcessado ? 1 : 0
        resumo[s.departamento].custo += custo
      })

      const wsResumo = XLSX.utils.json_to_sheet(Object.entries(resumo).map(([dept, vals]) => ({
        "Departamento": dept,
        "Qtd Prestadores": vals.qtd,
        "Custo Total (R$)": vals.custo
      })))
      XLSX.utils.book_append_sheet(wb, wsResumo, "Resumo Financeiro")

      XLSX.writeFile(wb, nomeArquivo)
      console.log("✅ Download Excel Direto concluído")
    } catch (error) {
      console.error("❌ Erro no download Excel Direto:", error)
      alert("Erro ao baixar arquivo. Tente novamente.")
    } finally {
      setCarregandoDownload(false)
    }
  }

  if (carregando) {
    return (
      <div className="flex justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-slate-600"></div>
      </div>
    )
  }

  return (
    <Tabs defaultValue="lista" className="w-full">
      <TabsContent value="lista" className="mt-0 p-8 space-y-6">
        <div className="min-h-screen bg-transparent p-4">
          <Card className="glass shadow-2xl border-white/20 overflow-hidden rounded-3xl">
            <CardContent className="pt-6">
              {/* Filtros */}
              <div className="mb-6 p-4 bg-slate-50 rounded-lg">
                <div className="flex items-center justify-between w-full mb-4">
                  <div className="flex items-center gap-2">
                    <Filter className="h-5 w-5 text-slate-600" />
                    <Label className="text-lg font-medium text-slate-700">Filtros & Busca</Label>
                  </div>

                  <TabsList className="bg-slate-100 p-1">
                    <TabsTrigger value="lista" className="data-[state=active]:bg-white data-[state=active]:text-blue-600 px-4 h-8 font-semibold">
                      <List className="h-4 w-4 mr-2" />
                      Lista
                    </TabsTrigger>
                    <TabsTrigger value="dashboard" className="data-[state=active]:bg-white data-[state=active]:text-blue-600 px-4 h-8 font-semibold">
                      <LayoutDashboard className="h-4 w-4 mr-2" />
                      Dashboard
                    </TabsTrigger>
                  </TabsList>
                </div>

                <div className="space-y-4">
                  {/* Linha Principal: Busca Geral (Sempre Visível) */}
                  <div className="flex items-center gap-4">
                    <div className="flex-1 max-w-md">
                      <Label className="text-sm font-medium text-slate-700 mb-2 block">Busca Geral</Label>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                          type="text"
                          placeholder="Nome ou doc1..."
                          value={buscaGeral}
                          onChange={(e) => setBuscaGeral(e.target.value)}
                          className="pl-10 border-slate-300 focus:border-slate-400 focus:ring-slate-400 transition-all text-sm h-10 rounded-xl"
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-6 ml-auto">
                      <Link href="/admin/nova-solicitacao">
                        <Button className="bg-blue-600 hover:bg-blue-700 text-white h-10 rounded-xl shadow-lg shadow-blue-500/20">
                          <Plus className="h-4 w-4 mr-2" />
                          Nova Solicitação
                        </Button>
                      </Link>

                      <div className="h-6 w-[1px] bg-slate-300 mx-2"></div>
                      <Button
                        onClick={() => setMostrarFiltros(!mostrarFiltros)}
                        variant="outline"
                        size="sm"
                        className={`border-slate-300 ${mostrarFiltros ? "bg-slate-200 text-slate-800" : "text-slate-600"} hover:bg-slate-100 h-10 rounded-xl`}
                      >
                        Filtros Avançados
                        <ChevronDown className={`h-4 w-4 ml-1 transition-transform ${mostrarFiltros ? "rotate-180" : ""}`} />
                      </Button>

                      <Button
                        onClick={buscarSolicitacoes}
                        variant="outline"
                        size="sm"
                        className="border-slate-300 text-slate-600 hover:bg-slate-50 h-10 rounded-xl"
                      >
                        🔄 Atualizar
                      </Button>

                      <Button
                        onClick={handleDownloadExcel}
                        disabled={carregandoDownload}
                        variant="outline"
                        size="sm"
                        className="border-slate-300 text-slate-600 hover:bg-slate-50 h-10 rounded-xl"
                      >
                        {carregandoDownload ? (
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Download className="h-4 w-4 mr-2" />
                        )}
                        Download
                      </Button>

                      <div className="relative inline-block text-left">
                        <Button
                          onClick={() => setModalColunasAberto(!modalColunasAberto)}
                          variant="outline"
                          size="sm"
                          className="border-slate-600 text-slate-600 hover:bg-slate-50 h-10 rounded-xl"
                        >
                          <Columns className="h-4 w-4 mr-1" />
                          Colunas
                          <ChevronDown className="h-3 w-3 ml-1" />
                        </Button>

                        {modalColunasAberto && (
                          <>
                            <div className="fixed inset-0 z-40" onClick={() => setModalColunasAberto(false)}></div>
                            <div className="absolute right-0 mt-2 w-64 bg-white rounded-md shadow-lg z-[110] border border-slate-200 p-4">
                              <div className="flex items-center justify-between mb-3 border-b pb-2">
                                <span className="font-semibold text-sm text-slate-700">Exibir Colunas</span>
                                <span className="text-xs text-slate-400">
                                  {Object.values(colunasVisiveis).filter(Boolean).length}/{COLUNAS_DISPONIVEIS.length}
                                </span>
                              </div>
                              <div className="flex gap-2 mb-3">
                                <Button onClick={() => toggleTodasColunas(true)} variant="ghost" size="sm" className="flex-1 h-7 text-xs text-blue-600 hover:bg-blue-50 border border-blue-100">Todas</Button>
                                <Button onClick={() => toggleTodasColunas(false)} variant="ghost" size="sm" className="flex-1 h-7 text-xs text-slate-600 hover:bg-slate-50 border border-slate-100">Nenhuma</Button>
                              </div>
                              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                                {COLUNAS_DISPONIVEIS.map((coluna) => (
                                  <label key={coluna.key} className="flex items-center space-x-2 cursor-pointer hover:bg-slate-50 p-1 rounded transition-colors">
                                    <input type="checkbox" checked={colunasVisiveis[coluna.key] || false} onChange={() => toggleColuna(coluna.key)} className="h-4 w-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500" />
                                    <span className="text-sm text-slate-600">{coluna.label}</span>
                                  </label>
                                ))}
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Filtros Avançados (Collapsible) */}
                  {mostrarFiltros && (
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 pt-4 border-t border-slate-200 animate-in fade-in slide-in-from-top-2">
                      <div>
                        <Label className="text-sm font-medium text-slate-700 mb-2 block">Departamento</Label>
                        <select value={filtroDepartamento} onChange={(e) => setFiltroDepartamento(e.target.value)} className="w-full p-2 border border-slate-300 rounded-md h-10 text-sm">
                          <option value="todos">Todos</option>
                          {departamentos.map((dept) => (
                            <option key={dept} value={dept}>{dept}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-slate-700 mb-2 block">Status Checagem</Label>
                        <Select value={filtroStatus} onValueChange={setFiltroStatus}>
                          <SelectTrigger className="border-slate-300">
                            <SelectValue placeholder="Selecione o status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="todos">Todos</SelectItem>
                            <SelectItem value="pendente">Pendente</SelectItem>
                            <SelectItem value="aprovado">Aprovado</SelectItem>
                            <SelectItem value="reprovado">Reprovado</SelectItem>
                            <SelectItem value="revisar">Revisar</SelectItem>
                            <SelectItem value="excecao">Exceção</SelectItem>
                            <SelectItem value="vencida">Vencida</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-slate-700 mb-2 block">Status Liberação</Label>
                        <Select value={filtroCadastro} onValueChange={setFiltroCadastro}>
                          <SelectTrigger className="border-slate-300">
                            <SelectValue placeholder="Selecione o cadastro" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="todos">Todos</SelectItem>
                            <SelectItem value="pendente">Pendente</SelectItem>
                            <SelectItem value="ok">Ok</SelectItem>
                            <SelectItem value="urgente">Urgente</SelectItem>
                            <SelectItem value="vencida">Vencida</SelectItem>
                            <SelectItem value="negada">Negada</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-slate-700 mb-2 block">Ações (Tratativa)</Label>
                        <Select value={filtroAcoes} onValueChange={setFiltroAcoes}>
                          <SelectTrigger className="border-slate-300">
                            <SelectValue placeholder="Filtrar por ação" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="todos">Todas</SelectItem>
                            <SelectItem value="habilitado">Liberados para Tratativa</SelectItem>
                            <SelectItem value="desabilitado">Aguardando Checagem</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-slate-700 mb-2 block">Evento</Label>
                        <Select value={filtroEvento} onValueChange={setFiltroEvento}>
                          <SelectTrigger className="border-slate-300 h-10">
                            <SelectValue placeholder="Selecione o evento" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="todos">Todos os Eventos</SelectItem>
                            {eventosUnicos.map((evt) => (
                              <SelectItem key={evt} value={evt}>{evt}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Informações de Paginação */}
              <div className="mb-4 flex items-center justify-between text-sm text-slate-600">
                <div><strong>Mostrando {indiceInicio + 1} - {Math.min(indiceFim, totalPrestadores)} de {totalPrestadores} prestadores</strong></div>
                <div><strong>Página {paginaAtual} de {totalPaginas}</strong></div>
              </div>

              {/* Tabela com scroll e sticky header */}
              <div className="rounded-lg border border-slate-200 shadow-inner relative max-h-[70vh] overflow-auto">
                <table className="w-full caption-bottom text-sm min-w-[1200px] text-left" style={{ borderCollapse: 'separate', borderSpacing: 0 }}>
                  <thead className="bg-slate-50 sticky top-0 z-50 shadow-sm">
                    <tr className="border-b bg-slate-50 hover:bg-slate-50">
                      {COLUNAS_DISPONIVEIS.map(col => colunasVisiveis[col.key] && (
                        <th key={col.key} className="h-12 px-4 text-center align-middle font-semibold text-slate-800 cursor-pointer hover:bg-slate-100 transition-colors" style={{ position: 'sticky', top: 0, zIndex: 40, backgroundColor: '#f8fafc' }} onClick={() => ["prestador", "doc1", "doc2", "empresa", "dataInicial", "dataFinal"].includes(col.key) ? requestSort(col.key) : null}>
                          <div className="flex items-center justify-center">
                            {col.label} {["prestador", "doc1", "doc2", "empresa", "dataInicial", "dataFinal"].includes(col.key) ? getSortIcon(col.key) : null}
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="[&_tr:last-child]:border-0">
                    {dadosFiltrados.map(({ solicitacao, prestador, prioridade }) => (
                      <tr key={`${solicitacao.id}-${prestador.id}`} className="border-b transition-colors hover:bg-slate-50">
                        {colunasVisiveis.solicitacao && (
                          <td className="p-4 align-middle text-sm text-center">
                            <div className="flex flex-col items-center">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-slate-700">{solicitacao.numero}</span>
                                {usuario?.perfil === "superadmin" && (
                                  <Button onClick={() => handleAbrirEdicaoSolicitacao(solicitacao)} variant="ghost" size="sm" className="h-6 w-6 p-0 text-slate-400 hover:text-blue-600 hover:bg-blue-50" title="Editar data/hora da solicitação">
                                    <Edit className="h-3.5 w-3.5" />
                                  </Button>
                                )}
                              </div>
                              <div className="text-[10px] text-slate-500 mt-0.5 flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {solicitacao.dataSolicitacao} {solicitacao.horaSolicitacao?.substring(0, 5)}
                              </div>
                            </div>
                          </td>
                        )}
                        {colunasVisiveis.prestador && <td className="p-4 align-middle text-sm text-center"><div className="whitespace-nowrap font-medium text-slate-700">{prestador.nome}</div></td>}
                        {colunasVisiveis.doc1 && <td className="p-4 align-middle text-sm text-center"><div className="px-3 py-1 bg-slate-100 rounded text-slate-700 whitespace-nowrap">{prestador.doc1 || "-"}</div></td>}
                        {colunasVisiveis.doc2 && <td className="p-4 align-middle text-sm text-center"><div className="px-3 py-1 bg-slate-100 rounded text-slate-700 whitespace-nowrap">{prestador.doc2 || "-"}</div></td>}
                        {colunasVisiveis.empresa && <td className="p-4 align-middle text-sm text-center"><div className="px-3 py-1 bg-slate-50 rounded text-slate-600 whitespace-nowrap border border-slate-100">{prestador.empresa || solicitacao.empresa || "-"}</div></td>}
                        {colunasVisiveis.evento && (
                          <td className="p-4 align-middle text-sm text-center border-x border-slate-50">
                            <div className="max-w-[150px] truncate mx-auto text-slate-600 font-medium" title={solicitacao.local || ""}>
                              {solicitacao.local || "-"}
                            </div>
                          </td>
                        )}
                        {colunasVisiveis.checagem && (
                          <td className="p-4 align-middle text-center">
                            <div className="flex items-center justify-center gap-2 whitespace-nowrap">
                              <StatusChecagemIcon status={getChecagemStatus(prestador) as any} />
                              <StatusChecagemBadge status={getChecagemStatus(prestador) as any} />
                            </div>
                          </td>
                        )}
                        {colunasVisiveis.liberacao && (
                          <td className="p-4 align-middle text-center">
                            <div className="flex items-center justify-center gap-2 whitespace-nowrap">
                              <StatusLiberacaoIcon status={getLiberacaoStatus(prestador, solicitacao.dataFinal) as any} />
                              <StatusLiberacaoBadge status={getLiberacaoStatus(prestador, solicitacao.dataFinal) as any} />
                            </div>
                          </td>
                        )}
                        {colunasVisiveis.validaAte && <td className="p-4 align-middle text-sm whitespace-nowrap text-center text-slate-600">{prestador.checagemValidaAte ? formatarDataParaBR(prestador.checagemValidaAte) : "-"}</td>}
                        {colunasVisiveis.dataInicial && <td className="p-4 align-middle text-sm whitespace-nowrap text-center"><DataInicialIndicator dataInicial={solicitacao.dataInicial} isReprovado={false} mostrarUrgencia={getLiberacaoStatus(prestador, solicitacao.dataFinal) === "pendente" || getLiberacaoStatus(prestador, solicitacao.dataFinal) === "urgente"} /></td>}
                        {colunasVisiveis.dataFinal && <td className="p-4 align-middle text-sm whitespace-nowrap text-center text-slate-600">{((prestador.checagem as string) === "reprovado" || prestador.checagem === "reprovada") ? "-" : solicitacao.dataFinal}</td>}
                        {colunasVisiveis.acoes && (
                          <td className="p-4 align-middle relative">
                            <div className="flex items-center justify-center gap-2">
                              <Button
                                onClick={() => handleConfirmarCadastro(solicitacao, prestador)}
                                size="sm"
                                disabled={!isBotoesHabilitados(prestador)}
                                className={`h-8 w-8 p-0 ${prestador.liberacao === 'ok' ? 'bg-slate-100 text-emerald-600 border-emerald-200' : 'bg-green-600 hover:bg-green-700 text-white'}`}
                              >
                                {processandoId === prestador.id ? <RefreshCw className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                              </Button>
                              <Button
                                onClick={() => handleNegarClick(solicitacao, prestador)}
                                variant="outline"
                                size="sm"
                                disabled={!isBotoesHabilitados(prestador)}
                                className={`h-8 w-8 p-0 ${prestador.liberacao === 'negada' ? 'bg-rose-50 text-rose-600 border-rose-200' : 'border-red-600 text-red-600 hover:bg-red-50'}`}
                              >
                                <XCircle className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        )}
                        {colunasVisiveis.justificativa && <td className="p-4 align-middle text-sm text-center">{prestador.justificativa ? <div className="max-w-xs truncate text-slate-600 mx-auto" title={prestador.justificativa}>{prestador.justificativa}</div> : "-"}</td>}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Controles de Paginação Inferior */}
              <div className="mt-4 flex items-center justify-between">
                <div className="text-sm text-slate-600"><strong>Total:</strong> {totalPrestadores} prestadores</div>
                <div className="flex items-center gap-2">
                  <Button onClick={handlePaginaAnterior} disabled={paginaAtual === 1} variant="outline" size="sm" className="border-slate-300 text-slate-600 disabled:opacity-50"><ChevronLeft className="h-4 w-4 mr-1" /> Anterior</Button>
                  <span className="text-sm text-slate-600 px-3">{paginaAtual} / {totalPaginas}</span>
                  <Button onClick={handleProximaPagina} disabled={paginaAtual === totalPaginas} variant="outline" size="sm" className="border-slate-300 text-slate-600 disabled:opacity-50">Próxima <ChevronRight className="h-4 w-4 ml-1" /></Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Modais */}
          <Dialog open={modalObservacoesAberto} onOpenChange={setModalObservacoesAberto}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader><DialogTitle className="text-lg font-semibold text-slate-800 flex items-center gap-2">Motivo da Negação</DialogTitle></DialogHeader>
              <div className="space-y-4 py-4">
                <Textarea placeholder="Descreva o motivo..." value={observacoes} onChange={(e) => setObservacoes(e.target.value)} className="min-h-[100px]" />
              </div>
              <DialogFooter><Button onClick={handleConfirmarNegacao} disabled={carregandoNegacao || !observacoes.trim()} className="bg-red-600 hover:bg-red-700 text-white">Confirmar Negação</Button></DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={modalEditarSolicitacaoAberta} onOpenChange={setModalEditarSolicitacaoAberta}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader><DialogTitle className="text-lg font-semibold text-slate-800 flex items-center gap-2">Editar Dados</DialogTitle></DialogHeader>
              <div className="grid grid-cols-2 gap-4 py-4">
                <div><Label>Data</Label><Input type="date" value={novaDataSolicitacao} onChange={(e) => setNovaDataSolicitacao(e.target.value)} /></div>
                <div><Label>Hora</Label><Input type="time" value={novaHoraSolicitacao} onChange={(e) => setNovaHoraSolicitacao(e.target.value)} /></div>
              </div>
              <DialogFooter><Button onClick={handleSalvarEdicaoSolicitacao} disabled={salvandoEdicao} className="bg-blue-600 hover:bg-blue-700 text-white">Salvar</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </TabsContent>

      <TabsContent value="dashboard" className="mt-0 p-8 space-y-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <RelatorioModal
              filtroSolicitante="todos"
              filtroDepartamento={filtroDepartamento}
              filtroTipo="todos"
              filtroStatus={filtroStatus}
              filtroCadastro={filtroCadastro}
              filtroAcoes={filtroAcoes}
              filtroEvento={filtroEvento}
              solicitacoesReais={solicitacoes}
            />
            <Button
              onClick={buscarSolicitacoes}
              variant="outline"
              size="sm"
              className="border-slate-300 text-slate-600 hover:bg-slate-50 h-10 rounded-xl"
            >
              🔄 Atualizar
            </Button>
          </div>

          <TabsList className="bg-slate-100 p-1">
            <TabsTrigger value="lista" className="data-[state=active]:bg-white data-[state=active]:text-blue-600 px-4 h-8 font-semibold">
              <List className="h-4 w-4 mr-2" />
              Lista
            </TabsTrigger>
            <TabsTrigger value="dashboard" className="data-[state=active]:bg-white data-[state=active]:text-blue-600 px-4 h-8 font-semibold">
              <LayoutDashboard className="h-4 w-4 mr-2" />
              Dashboard
            </TabsTrigger>
          </TabsList>
        </div>
        <DashboardAdmin hideHeader={true} />
      </TabsContent>
    </Tabs>
  )
}
