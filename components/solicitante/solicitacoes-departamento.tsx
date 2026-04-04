"use client"

import { useState, useEffect } from "react"
import {
  Filter,
  Search,
  Users,
  AlertTriangle,
  RotateCcw,
  Eye,
  Columns,
  X,
  Download,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronDown,
  CheckCircle,
  XCircle,
  Clock,
  ShieldAlert,
  User,
  ShieldCheck,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useAuth } from "../../contexts/auth-context"
import { DataInicialIndicator } from "../../utils/date-indicators"
import {
  StatusChecagemBadge,
  StatusChecagemIcon,
  StatusLiberacaoBadge,
  StatusLiberacaoIcon,
  getChecagemStatus,
  getLiberacaoStatus,
} from "../ui/status-badges"
import { isDateExpired } from "../../utils/date-helpers"
import { isAccessExpiringSoon } from "../../utils/status-helpers"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getSolicitacoesByDepartamento } from "../../services/solicitacoes-service"
import { formatarDataParaBR } from "../../utils/date-helpers"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { supabase } from "@/lib/supabase"

// Definir todas as colunas disponíveis para o Solicitante
const COLUNAS_DISPONIVEIS = [
  { key: "numero", label: "Número" },
  { key: "dataSolicitacao", label: "Data Solicitação" },
  { key: "empresa", label: "Empresa" },
  { key: "prestador", label: "Prestador" },
  { key: "doc1", label: "Doc1" },
  { key: "doc2", label: "Doc2" },
  { key: "dataInicial", label: "Data Inicial" },
  { key: "dataFinal", label: "Data Final" },
  { key: "liberacao", label: "Liberação" },
  { key: "checagem", label: "Checagem" },
  { key: "validaAte", label: "Válida até" },
  { key: "observacoes", label: "Observações" },
]

export default function SolicitacoesDepartamento() {
  const { usuario } = useAuth()
  const router = useRouter()
  const [filtroStatus, setFiltroStatus] = useState<string>("todos")
  const [filtroLiberacao, setFiltroLiberacao] = useState<string>("todos")
  const [filtroEmpresa, setFiltroEmpresa] = useState<string>("todos")
  const [filtroSolicitante, setFiltroSolicitante] = useState<string>("todos")
  const [buscaGeral, setBuscaGeral] = useState<string>("")
  const [solicitacoesReais, setSolicitacoesReais] = useState<any[]>([])
  const [carregando, setCarregando] = useState(true)
  const [dialogAberto, setDialogAberto] = useState(false)
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" }>({
    key: "dataInicial", // Default sorting
    direction: "asc",
  })
  const [mostrarFiltros, setMostrarFiltros] = useState(false)

  const [prestadorSelecionado, setPrestadorSelecionado] = useState<{
    solicitacao: any
    prestador: any
  } | null>(null)
  const [paginaAtual, setPaginaAtual] = useState(1)
  const PRESTADORES_POR_PAGINA = 50

  // Estados para configuração de colunas
  const [modalColunasAberto, setModalColunasAberto] = useState(false)
  const [modalObservacoesAberto, setModalObservacoesAberto] = useState(false)

  // 🆕 Estado para Modal de Edição (Correção)
  const [modalEdicaoAberto, setModalEdicaoAberto] = useState(false)
  const [dadosEdicao, setDadosEdicao] = useState({ doc1: "", doc2: "" })
  const [salvandoEdicao, setSalvandoEdicao] = useState(false)
  const [mensagemSucesso, setMensagemSucesso] = useState<string | null>(null)
  const [modalDownloadAberto, setModalDownloadAberto] = useState(false)
  const [filtroEmpresaDownload, setFiltroEmpresaDownload] = useState<string>("todos")
  const [filtroPeriodoDownload, setFiltroPeriodoDownload] = useState<string>("todos")
  const [filtroChecagemDownload, setFiltroChechagemDownload] = useState<string>("todos")
  const [filtroLiberacaoDownload, setFiltroLiberacaoDownload] = useState<string>("todos")

  const handleAbrirEdicao = () => {
    if (prestadorSelecionado) {
      setDadosEdicao({
        doc1: prestadorSelecionado.prestador.doc1 || "",
        doc2: prestadorSelecionado.prestador.doc2 || "",
      })
      setModalEdicaoAberto(true)
    }
  }

  const handleSalvarEdicao = async () => {
    if (!prestadorSelecionado) return
    setSalvandoEdicao(true)

    try {
      const { error } = await supabase
        .from("prestadores")
        .update({
          doc1: dadosEdicao.doc1,
          doc2: dadosEdicao.doc2,
          checagem: "pendente", // Resetar status checagem
          liberacao: "pendente", // Resetar status liberação
          observacoes: null, // Limpar observações de erro
        })
        .eq("id", prestadorSelecionado.prestador.id)

      if (error) throw error

      setMensagemSucesso("Dados corrigidos com sucesso! A solicitação foi reenviada para análise.")
      setModalEdicaoAberto(false)
      // setPopoverAberto(null) // Fechar modal de detalhes - This variable is not defined in the current scope.

      // Atualizar lista
      // const { data } = await getSolicitacoesByDepartamento(user?.department || "") // 'user' is not defined, should be 'usuario'. 'department' is not a property of 'usuario', it's 'departamento'.
      // setSolicitacoes(data || []) // 'setSolicitacoes' is not defined, should be 'setSolicitacoesReais'.
      // setDadosFiltrados(data || []) // 'setDadosFiltrados' is not defined.

      // Corrected logic for updating list:
      await buscarSolicitacoesDepartamento(); // Re-fetch all data
      setPrestadorSelecionado(null); // Clear selected prestador after successful edit

    } catch (error) {
      console.error("Erro ao salvar edição:", error)
      alert("Erro ao salvar alterações. Tente novamente.")
    } finally {
      setSalvandoEdicao(false)
    }
  }
  const [carregandoDownload, setCarregandoDownload] = useState(false)
  // Estado inicial das colunas: todas visíveis por padrão
  const [colunasVisiveis, setColunasVisiveis] = useState<Record<string, boolean>>(() => {
    return COLUNAS_DISPONIVEIS.reduce((acc, col) => {
      acc[col.key] = true
      return acc
    }, {} as Record<string, boolean>)
  })

  // Carregar preferências do localStorage apenas APÓS o componente montar (lado do cliente)
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const salvas = localStorage.getItem("solicitante-departamento-colunas-visiveis")
        if (salvas) {
          const parsed = JSON.parse(salvas)
          if (parsed && typeof parsed === 'object') {
            setColunasVisiveis(prev => ({ ...prev, ...parsed }))
          }
        }
      } catch (error) {
        console.error("❌ SOLICITANTE: Falha ao carregar colunas do localStorage:", error)
      }
    }
  }, [])

  // Salvar preferências no localStorage apenas quando mudarem (e se houver dados)
  useEffect(() => {
    if (typeof window !== "undefined" && Object.keys(colunasVisiveis).length > 0) {
      localStorage.setItem("solicitante-departamento-colunas-visiveis", JSON.stringify(colunasVisiveis))
    }
  }, [colunasVisiveis])

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

  const normalizeString = (str: string): string => {
    return str
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
  }

  const getPrioridade = (prestador: any) => {
    if (prestador.checagem === "pendente" && prestador.liberacao === "urgente") return 1
    if (prestador.checagem === "pendente" && prestador.liberacao === "pendente") return 2
    return 3
  }

  const buscarSolicitacoesDepartamento = async () => {
    try {
      setCarregando(true)
      if (usuario?.departamento) {
        const solicitacoes = await getSolicitacoesByDepartamento(usuario.departamento)
        setSolicitacoesReais(solicitacoes)
      }
    } catch (error) {
      console.error("Erro ao buscar solicitações:", error)
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => {
    buscarSolicitacoesDepartamento()
  }, [usuario?.departamento])

  // Resetar página quando filtros mudarem
  useEffect(() => {
    setPaginaAtual(1)
  }, [filtroStatus, filtroLiberacao, filtroSolicitante, filtroEmpresa, buscaGeral])

  if (carregando) {
    return (
      <div className="flex justify-center items-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-slate-600"></div>
      </div>
    )
  }

  const solicitantesDepartamento = Array.from(
    new Set(solicitacoesReais.filter((s) => s.departamento === usuario?.departamento).map((s) => s.solicitante)),
  ).sort()

  const empresasDepartamento = Array.from(
    new Set(solicitacoesReais.filter((s) => s.departamento === usuario?.departamento).map((s) => s.empresa)),
  ).sort()

  const dadosFiltrados = solicitacoesReais
    .filter((solicitacao) => solicitacao.departamento === usuario?.departamento)
    .map((solicitacao) => {
      const solicitanteMatch = filtroSolicitante === "todos" || solicitacao.solicitante === filtroSolicitante
      const empresaMatch = filtroEmpresa === "todos" || solicitacao.empresa === filtroEmpresa

      if (!solicitanteMatch || !empresaMatch) return null

      let buscaMatch = true
      if (buscaGeral) {
        const buscaNormalizada = normalizeString(buscaGeral)
        const solicitacaoNormalizada = normalizeString(JSON.stringify(solicitacao))
        buscaMatch = solicitacaoNormalizada.includes(buscaNormalizada)
      }
      if (!buscaMatch) return null

      const prestadoresFiltrados = solicitacao.prestadores.filter((prestador: any) => {
        const checagemStatusReal = getChecagemStatus(prestador)
        const liberacaoStatusReal = getLiberacaoStatus(prestador, solicitacao.dataFinal)

        let statusMatch = filtroStatus === "todos"
        if (filtroStatus === "vencida") statusMatch = checagemStatusReal === "vencida"
        else if (filtroStatus !== "todos") statusMatch = prestador.checagem === filtroStatus

        let liberacaoMatch = filtroLiberacao === "todos"
        if (filtroLiberacao === "vencida") liberacaoMatch = liberacaoStatusReal === "vencida"
        else if (filtroLiberacao !== "todos") liberacaoMatch = prestador.liberacao === filtroLiberacao

        return statusMatch && liberacaoMatch
      })

      if (prestadoresFiltrados.length > 0) {
        return { ...solicitacao, prestadores: prestadoresFiltrados }
      }
      return null
    })
    .filter((s) => s !== null)

  const dadosOrdenados = dadosFiltrados
    .flatMap((solicitacao) =>
      solicitacao.prestadores.map((prestador: any) => ({
        solicitacao,
        prestador,
        prioridade: getPrioridade(prestador),
      })),
    )
    .sort((a, b) => {
      // Lógica de ordenação dinâmica
      const { key, direction } = sortConfig
      let valorA: any
      let valorB: any

      switch (key) {
        case "numero":
          valorA = a.solicitacao.numero
          valorB = b.solicitacao.numero
          break
        case "dataSolicitacao":
          valorA = new Date(a.solicitacao.dataSolicitacao.split("/").reverse().join("-")).getTime()
          valorB = new Date(b.solicitacao.dataSolicitacao.split("/").reverse().join("-")).getTime()
          break
        case "empresa":
          valorA = a.solicitacao.empresa
          valorB = b.solicitacao.empresa
          break
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
        default:
          return 0
      }

      if (valorA < valorB) {
        return direction === "asc" ? -1 : 1
      }
      if (valorA > valorB) {
        return direction === "asc" ? 1 : -1
      }
      return 0
    })

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

  // Calcular paginação
  const totalPrestadores = dadosOrdenados.length
  const totalPaginas = Math.ceil(totalPrestadores / PRESTADORES_POR_PAGINA)
  const indiceInicio = (paginaAtual - 1) * PRESTADORES_POR_PAGINA
  const indiceFim = indiceInicio + PRESTADORES_POR_PAGINA
  const dadosPaginados = dadosOrdenados.slice(indiceInicio, indiceFim)

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

  const totalSolicitacoesDepartamento = solicitacoesReais.filter((s) => s.departamento === usuario?.departamento).length
  const minhasSolicitacoes = dadosPaginados.filter(({ solicitacao }) => solicitacao.solicitante === usuario?.nome)
  const outrassolicitacoes = dadosPaginados.filter(({ solicitacao }) => solicitacao.solicitante !== usuario?.nome)
  const totalPrestadoresFiltrados = dadosOrdenados.length

  const deveExibirBotaoRenovar = (prestador: any, dataFinal: string) => {
    const checagemStatus = getChecagemStatus(prestador)
    const liberacaoStatus = getLiberacaoStatus(prestador, dataFinal)
    if (checagemStatus === "vencida" || liberacaoStatus === "vencida") return true
    if (prestador.checagemValidaAte && isDateExpired(prestador.checagemValidaAte)) return false
    if (prestador.checagemValidaAte && isAccessExpiringSoon(prestador.checagemValidaAte)) return true
    if (dataFinal && isAccessExpiringSoon(dataFinal)) return true
    return false
  }

  const handleRenovar = (solicitacao: any) => {
    const dadosRenovacao = {
      tipoSolicitacao: solicitacao.tipoSolicitacao,
      local: solicitacao.local,
      empresa: solicitacao.empresa,
      prestadores: solicitacao.prestadores.map((p: any) => ({
        id: p.id,
        nome: p.nome,
        doc1: p.doc1,
      })),
      dataInicial: "",
      dataFinal: "",
    }

    // Save to sessionStorage and navigate
    if (typeof window !== "undefined") {
      sessionStorage.setItem("renovacao_temp", JSON.stringify(dadosRenovacao))
    }
    router.push("/solicitante/nova-solicitacao")
  }
  const handleVisualizarSolicitacao = (solicitacao: any, prestador: any) => {
    setPrestadorSelecionado({ solicitacao, prestador })
    setDialogAberto(true)
  }

  const handleDownloadExcel = async (filtroEmpresa?: string, filtroPeriodo?: string) => {
    try {
      setCarregandoDownload(true)
      console.log("📊 Iniciando download Excel - Solicitante Departamento")

      // Importar XLSX dinamicamente
      const XLSX = await import("xlsx")

      // Configurar XLSX para browser
      XLSX.set_fs({})

      // 🎯 APLICAR FILTROS DO MODAL DE DOWNLOAD
      let dadosFinal = [...dadosOrdenados]
      
      if (filtroEmpresaDownload !== "todos") {
        dadosFinal = dadosFinal.filter(item => item.solicitacao.empresa === filtroEmpresaDownload)
      }
      
      if (filtroPeriodoDownload !== "todos") {
        const agora = new Date()
        let limite = new Date()
        
        if (filtroPeriodoDownload === "hoje") {
          limite.setHours(0, 0, 0, 0)
        } else if (filtroPeriodoDownload === "semana") {
          limite.setDate(agora.getDate() - 7)
        } else if (filtroPeriodoDownload === "mes") {
          limite.setMonth(agora.getMonth() - 1)
        }
        
        dadosFinal = dadosFinal.filter(item => {
          const dataSolicitacao = new Date(item.solicitacao.dataSolicitacao.split("/").reverse().join("-"))
          return dataSolicitacao >= limite
        })
      }
      
      if (filtroChecagemDownload !== "todos") {
        dadosFinal = dadosFinal.filter(item => {
          const statusReal = getChecagemStatus(item.prestador)
          if (filtroChecagemDownload === "vencida") return statusReal === "vencida"
          return item.prestador.checagem === filtroChecagemDownload
        })
      }
      
      if (filtroLiberacaoDownload !== "todos") {
        dadosFinal = dadosFinal.filter(item => {
          const statusReal = getLiberacaoStatus(item.prestador, item.solicitacao.dataFinal)
          if (filtroLiberacaoDownload === "vencida") return statusReal === "vencida"
          return item.prestador.liberacao === filtroLiberacaoDownload
        })
      }

      // Preparar dados para Excel (Fiel aos Cabeçalhos do Upload!)
      const dadosParaExportar = dadosFinal.map((item, index) => ({
        "Nome": item.prestador.nome,
        "Empresa": item.solicitacao.empresa,
        "RG / Doc1": item.prestador.doc1,
        "CPF / Doc2": item.prestador.doc2 || "-",
        "Data Inicial": item.solicitacao.dataInicial,
        "Data Final": item.solicitacao.dataFinal,
        "Liberação": getLiberacaoStatus(item.prestador, item.solicitacao.dataFinal),
        "Checagem": getChecagemStatus(item.prestador),
        "Válida até": item.prestador.checagemValidaAte ? formatarDataParaBR(item.prestador.checagemValidaAte) : "-",
        "Observações": item.prestador.observacoes || "-",
        "Departamento": item.solicitacao.departamento,
        "Número": item.solicitacao.numero,
        "#": index + 1,
      }))

      // Criar workbook
      const wb = XLSX.utils.book_new()

      // Criar worksheet com os dados
      const ws = XLSX.utils.json_to_sheet(dadosParaExportar)

      // Adicionar worksheet ao workbook
      XLSX.utils.book_append_sheet(wb, ws, "Dados")

      // Criar aba de resumo
      const resumo = [
        { Métrica: "Total de Prestadores", Valor: dadosParaExportar.length },
        { Métrica: "Departamento", Valor: usuario?.departamento || "-" },
        { Métrica: "Data de Geração", Valor: new Date().toLocaleString("pt-BR") },
        { Métrica: "Usuário", Valor: usuario?.nome || "-" },
      ]

      const wsResumo = XLSX.utils.json_to_sheet(resumo)
      XLSX.utils.book_append_sheet(wb, wsResumo, "Resumo")

      // Gerar nome do arquivo
      const agora = new Date()
      const dataFormatada = agora.toLocaleDateString("pt-BR").replace(/\//g, "-")
      const nomeArquivo = `solicitacoes_departamento_${dataFormatada}.xlsx`

      // Gerar e baixar arquivo Excel
      const arrayBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" })
      const blob = new Blob([arrayBuffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      })

      const link = document.createElement("a")
      const url = URL.createObjectURL(blob)
      link.setAttribute("href", url)
      link.setAttribute("download", nomeArquivo)
      link.style.visibility = "hidden"
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      console.log("✅ Download Excel concluído:", dadosParaExportar.length, "registros")
    } catch (error) {
      console.error("❌ Erro no download Excel:", error)
      alert("Erro ao gerar arquivo Excel. Tente novamente.")
    } finally {
      setCarregandoDownload(false)
    }
  }

  return (
    <div className="bg-transparent p-4 font-sans">
      <div className="mx-auto space-y-4">

        {/* Card Principal */}
        <Card className="shadow-lg border-0 rounded-xl overflow-hidden bg-white/95 backdrop-blur-sm relative z-20">
          <CardContent className="p-6">
            <div className="mb-6 bg-slate-50 border-l-4 border-slate-400 p-4 rounded-r-md">
              <div className="flex items-center gap-3">
                <Users className="h-5 w-5 text-slate-600" />
                <p className="text-sm text-slate-900 font-medium">
                  Visualizando solicitações de <span className="font-bold underline">{usuario?.departamento}</span>.
                  Total: <span className="bg-slate-200 px-2 py-0.5 rounded text-slate-700 font-bold ml-1">{totalSolicitacoesDepartamento}</span> solicitações
                  <span className="text-slate-400 mx-2">|</span>
                  <span className="text-slate-600">{minhasSolicitacoes.length} suas, {outrassolicitacoes.length} de colegas</span>
                </p>
              </div>
            </div>

            {/* Área de Filtros principal */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 bg-white p-4 rounded-lg border border-slate-100 shadow-sm">
              <div className="flex items-center gap-3">
                <Filter className="h-5 w-5 text-slate-500" />
                <h3 className="text-lg font-semibold text-slate-700">Filtros & Busca</h3>
              </div>

              <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                <Button
                  onClick={() => setMostrarFiltros(!mostrarFiltros)}
                  variant="outline"
                  size="sm"
                  className="bg-white hover:bg-slate-50 text-slate-600 border-slate-200"
                >
                  Filtros Avançados
                  <ChevronDown className={`h-4 w-4 ml-2 transition-transform duration-200 ${mostrarFiltros ? "rotate-180" : ""}`} />
                </Button>

                {/* Botão Colunas */}
                <div className="relative inline-block text-left">
                  <Button
                    onClick={() => setModalColunasAberto(!modalColunasAberto)}
                    variant="outline"
                    size="sm"
                    className="bg-white hover:bg-slate-50 text-slate-600 border-slate-200"
                  >
                    <Columns className="h-4 w-4 mr-2" />
                    Colunas
                    <ChevronDown className="h-3 w-3 ml-2" />
                  </Button>

                  {modalColunasAberto && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setModalColunasAberto(false)}></div>
                      <div className="absolute right-0 mt-2 w-64 bg-white rounded-md shadow-xl z-50 border border-slate-200 p-4 animate-in fade-in zoom-in-95">
                        <div className="flex items-center justify-between mb-3 border-b pb-2">
                          <span className="font-bold text-xs uppercase tracking-widest text-slate-500">Exibir Colunas</span>
                          <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                            {Object.values(colunasVisiveis).filter(Boolean).length}/{COLUNAS_DISPONIVEIS.length}
                          </span>
                        </div>

                        <div className="flex gap-2 mb-3">
                          <Button
                            onClick={() => toggleTodasColunas(true)}
                            variant="ghost"
                            size="sm"
                            className="flex-1 h-7 text-[10px] font-bold uppercase tracking-tight text-blue-600 hover:bg-blue-50 border border-blue-100 rounded"
                          >
                            Todas
                          </Button>
                          <Button
                            onClick={() => toggleTodasColunas(false)}
                            variant="ghost"
                            size="sm"
                            className="flex-1 h-7 text-[10px] font-bold uppercase tracking-tight text-slate-600 hover:bg-slate-50 border border-slate-100 rounded"
                          >
                            Ocultar
                          </Button>
                        </div>

                        <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
                          {COLUNAS_DISPONIVEIS.map((coluna) => (
                            <label
                              key={coluna.key}
                              className="flex items-center space-x-2 cursor-pointer hover:bg-slate-50 p-1.5 rounded transition-colors"
                            >
                              <input
                                type="checkbox"
                                checked={colunasVisiveis[coluna.key] || false}
                                onChange={() => toggleColuna(coluna.key)}
                                className="h-4 w-4 text-slate-800 rounded border-slate-300 focus:ring-slate-500"
                              />
                              <span className="text-sm font-medium text-slate-600">{coluna.label}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </div>

                <Button
                  onClick={() => setModalDownloadAberto(true)}
                  disabled={carregandoDownload}
                  variant="outline"
                  size="sm"
                  className="bg-white hover:bg-slate-50 text-slate-600 border-slate-200"
                >
                  {carregandoDownload ? (
                    <div className="h-4 w-4 border-2 border-slate-400 border-t-slate-600 rounded-full animate-spin mr-2" />
                  ) : (
                    <Download className="h-4 w-4 mr-2" />
                  )}
                  Download
                </Button>
              </div>
            </div>

            <div className="space-y-4 mb-6">
              <div className="grid gap-2">
                <Label className="text-sm text-slate-500 font-medium">Busca Geral</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Nome ou documento..."
                    value={buscaGeral}
                    onChange={(e) => setBuscaGeral(e.target.value)}
                    className="pl-9 h-10 border-slate-200 bg-white"
                  />
                </div>
              </div>

              {/* Filtros Avançados (Collapsible) */}
              {mostrarFiltros && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 pt-6 mt-6 border-t border-slate-100 animate-in fade-in slide-in-from-top-4 duration-300">
                  {/* Empresa */}
                  <div>
                    <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">Filtrar Empresa</Label>
                    <Select value={filtroEmpresa} onValueChange={setFiltroEmpresa}>
                      <SelectTrigger className="h-10 border-slate-300 rounded-none focus:ring-0 bg-white">
                        <SelectValue placeholder="Todas" />
                      </SelectTrigger>
                      <SelectContent className="rounded-none border-slate-300">
                        <SelectItem value="todos">Todas as Empresas</SelectItem>
                        {empresasDepartamento.map((empresa) => (
                          <SelectItem key={empresa} value={empresa}>
                            {empresa}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Status Checagem */}
                  <div>
                    <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">Célula Checagem</Label>
                    <Select value={filtroStatus} onValueChange={setFiltroStatus}>
                      <SelectTrigger className="h-10 border-slate-300 rounded-none focus:ring-0 bg-white">
                        <SelectValue placeholder="Todos" />
                      </SelectTrigger>
                      <SelectContent className="rounded-none border-slate-300">
                        <SelectItem value="todos">Todos os Status</SelectItem>
                        <SelectItem value="pendente">Pendente</SelectItem>
                        <SelectItem value="aprovado">Aprovado</SelectItem>
                        <SelectItem value="reprovado">Reprovado</SelectItem>
                        <SelectItem value="revisar">Revisar</SelectItem>
                        <SelectItem value="excecao">Exceção</SelectItem>
                        <SelectItem value="vencida">Vencida</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Liberação */}
                  <div>
                    <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">Liberação</Label>
                    <Select value={filtroLiberacao} onValueChange={setFiltroLiberacao}>
                      <SelectTrigger className="h-10 border-slate-300 rounded-none focus:ring-0 bg-white">
                        <SelectValue placeholder="Todos" />
                      </SelectTrigger>
                      <SelectContent className="rounded-none border-slate-300">
                        <SelectItem value="todos">Todos os Status</SelectItem>
                        <SelectItem value="pendente">Pendente</SelectItem>
                        <SelectItem value="ok">Ok</SelectItem>
                        <SelectItem value="urgente">Urgente</SelectItem>
                        <SelectItem value="vencida">Vencida</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Solicitante */}
                  <div>
                    <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">Responsável</Label>
                    <Select value={filtroSolicitante} onValueChange={setFiltroSolicitante}>
                      <SelectTrigger className="h-10 border-slate-300 rounded-none focus:ring-0 bg-white">
                        <SelectValue placeholder="Todos" />
                      </SelectTrigger>
                      <SelectContent className="rounded-none border-slate-300">
                        <SelectItem value="todos">Todos os Solicitantes</SelectItem>
                        {solicitantesDepartamento.map((solicitante) => (
                          <SelectItem key={solicitante} value={solicitante}>
                            {solicitante}
                            {solicitante === usuario?.nome && " (Você)"}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
            </div>

            {/* Informações de Paginação/Totais */}
            <div className="flex items-center justify-between mt-8 mb-4">
              <div className="text-sm text-slate-600 font-medium">
                Mostrando <span className="font-bold text-slate-800">{Math.min(indiceInicio + 1, totalPrestadores)}</span> - <span className="font-bold text-slate-800">{Math.min(indiceFim, totalPrestadores)}</span> de <span className="font-bold text-slate-800">{totalPrestadores}</span> prestadores
              </div>
              <div className="text-sm font-medium text-slate-600">
                Página <span className="font-bold text-slate-800">{paginaAtual}</span> de <span className="font-bold text-slate-800">{totalPaginas || 1}</span>
              </div>
            </div>

            {/* Container da Tabela */}
            <div className="rounded-xl border border-slate-200 overflow-hidden bg-white shadow-sm">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-slate-50/80 sticky top-0 z-50 shadow-sm border-b border-slate-200">
                    <TableRow className="hover:bg-slate-50/80 border-b border-slate-200">
                      {colunasVisiveis.numero && (
                        <TableHead className="font-semibold text-slate-800 text-center h-12 cursor-pointer transition-colors px-4 align-middle" onClick={() => requestSort("numero")}>
                          <div className="flex items-center justify-center gap-1">
                            Número {getSortIcon("numero")}
                          </div>
                        </TableHead>
                      )}
                      {colunasVisiveis.dataSolicitacao && (
                        <TableHead className="font-semibold text-slate-800 text-center h-12 cursor-pointer transition-colors px-4 align-middle" onClick={() => requestSort("dataSolicitacao")}>
                          <div className="flex items-center justify-center gap-1">
                            Data {getSortIcon("dataSolicitacao")}
                          </div>
                        </TableHead>
                      )}
                      {colunasVisiveis.empresa && (
                        <TableHead className="font-semibold text-slate-800 text-center h-12 cursor-pointer transition-colors px-4 align-middle" onClick={() => requestSort("empresa")}>
                          <div className="flex items-center justify-center gap-1">
                            Empresa {getSortIcon("empresa")}
                          </div>
                        </TableHead>
                      )}
                      {colunasVisiveis.prestador && (
                        <TableHead className="font-semibold text-slate-800 text-center h-12 cursor-pointer transition-colors min-w-[150px] px-4 align-middle" onClick={() => requestSort("prestador")}>
                          <div className="flex items-center justify-center gap-1">
                            Prestador {getSortIcon("prestador")}
                          </div>
                        </TableHead>
                      )}
                      {colunasVisiveis.doc1 && (
                        <TableHead className="font-semibold text-slate-800 text-center h-12 cursor-pointer transition-colors px-4 align-middle" onClick={() => requestSort("doc1")}>
                          <div className="flex items-center justify-center gap-1">
                            Doc1 {getSortIcon("doc1")}
                          </div>
                        </TableHead>
                      )}
                      {colunasVisiveis.doc2 && (
                        <TableHead className="font-semibold text-slate-800 text-center h-12 px-4 align-middle">
                          Doc2
                        </TableHead>
                      )}
                      {colunasVisiveis.dataInicial && (
                        <TableHead className="font-semibold text-slate-800 text-center h-12 cursor-pointer transition-colors px-4 align-middle" onClick={() => requestSort("dataInicial")}>
                          <div className="flex items-center justify-center gap-1">
                            Data Inicial {getSortIcon("dataInicial")}
                          </div>
                        </TableHead>
                      )}
                      {colunasVisiveis.dataFinal && (
                        <TableHead className="font-semibold text-slate-800 text-center h-12 cursor-pointer transition-colors px-4 align-middle" onClick={() => requestSort("dataFinal")}>
                          <div className="flex items-center justify-center gap-1">
                            Data Final {getSortIcon("dataFinal")}
                          </div>
                        </TableHead>
                      )}
                      {colunasVisiveis.liberacao && (
                        <TableHead className="font-semibold text-slate-800 text-center h-12 px-4 align-middle">
                          Liberação
                        </TableHead>
                      )}
                      {colunasVisiveis.checagem && (
                        <TableHead className="font-semibold text-slate-800 text-center h-12 px-4 align-middle">
                          Checagem
                        </TableHead>
                      )}
                      {colunasVisiveis.validaAte && (
                        <TableHead className="font-semibold text-slate-800 text-center h-12 px-4 align-middle">
                          Válida até
                        </TableHead>
                      )}
                      {colunasVisiveis.observacoes && (
                        <TableHead className="font-semibold text-slate-800 text-center h-12 min-w-[200px] px-4 align-middle">
                          Observações
                        </TableHead>
                      )}
                      <TableHead className="font-semibold text-slate-800 text-center h-12 px-4 align-middle">
                        Ações
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="[&_tr:last-child]:border-0">
                    {dadosPaginados.map(({ solicitacao, prestador, prioridade }, index) => {
                      const prestadorIndex = solicitacao.prestadores.findIndex((p: any) => p.id === prestador.id)
                      // Remover esta linha:
                      // const isFirstPrestadorOfSolicitacao = index === 0 || dadosOrdenados[index - 1].solicitacao.id !== solicitacao.id
                      const checagemStatus = getChecagemStatus(prestador)
                      const liberacaoStatus = getLiberacaoStatus(prestador, solicitacao.dataFinal)

                      return (
                        <TableRow
                          key={`${solicitacao.id}-${prestador.id}`}
                          className={`hover:bg-slate-50 ${solicitacao.solicitante === usuario?.nome ? "bg-slate-25 border-l-4 border-l-slate-500" : ""
                            } ${prestadorIndex > 0 ? "border-l-4 border-l-slate-200 bg-slate-25" : ""}`}
                        >
                          {colunasVisiveis.numero && (
                            <TableCell className="p-4 align-middle text-sm text-center font-medium">
                              <div className="flex items-center justify-center gap-2">
                                {/* Indicador de prioridade */}
                                {prestador.checagem === "pendente" && prestador.liberacao === "urgente" && (
                                  <div
                                    className="w-2 h-2 bg-red-500 rounded-full"
                                    title="Prioridade ALTA - Urgente"
                                  ></div>
                                )}
                                {prestador.checagem === "pendente" && prestador.liberacao === "pendente" && (
                                  <div className="w-2 h-2 bg-slate-500 rounded-full" title="Prioridade NORMAL"></div>
                                )}
                                <span className="text-slate-700">{solicitacao.numero}</span>
                                {solicitacao.solicitante === usuario?.nome && (
                                  <Badge variant="outline" className="ml-2 text-[10px] h-4 px-1 uppercase tracking-tighter bg-slate-50 text-slate-500 border-slate-200">
                                    Minha
                                  </Badge>
                                )}
                                {solicitacao.statusGeral === "parcial" && (
                                  <AlertTriangle
                                    className="h-4 w-4 text-orange-500"
                                  />
                                )}
                              </div>
                            </TableCell>
                          )}
                          {colunasVisiveis.dataSolicitacao && (
                            <TableCell className="p-4 align-middle text-sm whitespace-nowrap text-center text-slate-600">
                              {solicitacao.dataSolicitacao}
                            </TableCell>
                          )}
                          {colunasVisiveis.empresa && (
                            <TableCell className="p-4 align-middle text-sm text-center text-slate-700 font-medium">{solicitacao.empresa}</TableCell>
                          )}
                          {colunasVisiveis.prestador && (
                            <TableCell className="p-4 align-middle text-sm text-center">
                              <div className="whitespace-nowrap font-medium text-slate-700 flex items-center justify-center gap-2">
                                {prestador.nome}
                              </div>
                            </TableCell>
                          )}
                          {colunasVisiveis.doc1 && (
                            <TableCell className="p-4 align-middle text-sm text-center">
                              <div className="text-xs font-mono whitespace-nowrap text-slate-600">{prestador.doc1}</div>
                            </TableCell>
                          )}
                          {colunasVisiveis.doc2 && (
                            <TableCell className="p-4 align-middle text-sm text-center">
                              <div className="text-xs font-mono whitespace-nowrap text-slate-600">{prestador.doc2 || "-"}</div>
                            </TableCell>
                          )}
                          {colunasVisiveis.dataInicial && (
                            <TableCell className="p-4 align-middle text-sm whitespace-nowrap text-center">
                              <DataInicialIndicator
                                dataInicial={solicitacao.dataInicial}
                                isReprovado={prestador.checagem === "reprovado"}
                              />
                            </TableCell>
                          )}
                          {colunasVisiveis.dataFinal && (
                            <TableCell className="p-4 align-middle text-sm whitespace-nowrap text-center text-slate-600">
                              {prestador.checagem === "reprovado" ? (
                                <span className="text-slate-400">-</span>
                              ) : (
                                <div className="flex items-center justify-center gap-2">
                                  <span
                                    className={isDateExpired(solicitacao.dataFinal) ? "text-red-600 font-medium" : ""}
                                  >
                                    {solicitacao.dataFinal}
                                  </span>
                                  {isDateExpired(solicitacao.dataFinal) && (
                                    <AlertTriangle className="h-4 w-4 text-red-600" />
                                  )}
                                </div>
                              )}
                            </TableCell>
                          )}
                          {colunasVisiveis.liberacao && (
                            <TableCell className="p-4 align-middle whitespace-nowrap text-center">
                              <div className="flex items-center justify-center gap-2">
                                <StatusLiberacaoIcon status={liberacaoStatus} />
                                <StatusLiberacaoBadge status={liberacaoStatus} />
                              </div>
                            </TableCell>
                          )}
                          {colunasVisiveis.checagem && (
                            <TableCell className="p-4 align-middle text-center">
                              <div className="flex items-center justify-center gap-2">
                                <StatusChecagemIcon status={checagemStatus} />
                                <StatusChecagemBadge status={checagemStatus} />
                              </div>
                            </TableCell>
                          )}
                          {colunasVisiveis.validaAte && (
                            <TableCell className="p-4 align-middle text-slate-600 text-center text-sm">
                              {prestador.checagemValidaAte ? formatarDataParaBR(prestador.checagemValidaAte) : <span className="text-slate-300">-</span>}
                            </TableCell>
                          )}
                          {colunasVisiveis.observacoes && (
                            <TableCell className="p-4 align-middle text-left">
                              {prestador.observacoes ? (
                                <div className="text-[11px] leading-tight text-slate-500 bg-slate-50 p-2 border border-slate-100 rounded-sm">
                                  {prestador.observacoes}
                                </div>
                              ) : (
                                <span className="text-slate-300">-</span>
                              )}
                            </TableCell>
                          )}
                          <TableCell className="p-4 align-middle text-center">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleVisualizarSolicitacao(solicitacao, prestador)}
                              className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-full"
                              title="Visualizar Detalhes"
                            >
                              <Eye className="h-5 w-5" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>

              {dadosPaginados.length === 0 && (
                <div className="text-center py-20 bg-slate-50 border-x border-b border-slate-200">
                  <Search className="h-12 w-12 mx-auto mb-4 text-slate-300 opacity-50" />
                  <p className="text-lg font-bold text-slate-400 uppercase tracking-wider">Nenhum registro localizado</p>
                  <p className="text-sm text-slate-400">Tente ajustar seus critérios de filtragem.</p>
                </div>
              )}
            </div>

            <div className="mt-6 flex flex-col md:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-100">
              <div className="text-sm text-slate-600 font-medium">
                Total: <span className="font-bold text-slate-800">{totalPrestadores}</span> prestadores
              </div>

              <div className="flex items-center gap-2">
                <Button
                  onClick={handlePaginaAnterior}
                  disabled={paginaAtual === 1}
                  variant="outline"
                  size="sm"
                  className="h-9 px-3 border-slate-200 hover:bg-slate-50 text-slate-600"
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Anterior
                </Button>

                <div className="text-sm font-medium text-slate-600 min-w-[60px] text-center">
                  {paginaAtual} / {totalPaginas > 0 ? totalPaginas : 1}
                </div>

                <Button
                  onClick={handleProximaPagina}
                  disabled={paginaAtual === totalPaginas || totalPaginas === 0}
                  variant="outline"
                  size="sm"
                  className="h-9 px-3 border-slate-200 hover:bg-slate-50 text-slate-600"
                >
                  Próxima
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
              {/* 📊 MODAL DE DOWNLOAD INTELIGENTE */}
          <Dialog open={modalDownloadAberto} onOpenChange={setModalDownloadAberto}>
            <DialogContent className="sm:max-w-lg overflow-hidden border-slate-200">
              <DialogHeader>
                <DialogTitle className="text-xl font-bold text-slate-800 flex items-center gap-2">
                  <Download className="h-6 w-6 text-blue-600" />
                  Assistente de Exportação Excel
                </DialogTitle>
                <div className="text-sm text-slate-500">Filtre e valide os dados antes de gerar a planilha.</div>
              </DialogHeader>
              <div className="py-6 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Filtrar Empresa</Label>
                    <Select value={filtroEmpresaDownload} onValueChange={setFiltroEmpresaDownload}>
                      <SelectTrigger className="bg-slate-50 border-slate-200 h-10">
                        <SelectValue placeholder="Todas" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todos">Todas as Empresas</SelectItem>
                        {empresasDepartamento.map((emp) => (
                          <SelectItem key={emp} value={emp}>{emp}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Período</Label>
                    <Select value={filtroPeriodoDownload} onValueChange={setFiltroPeriodoDownload}>
                      <SelectTrigger className="bg-slate-50 border-slate-200 h-10">
                        <SelectValue placeholder="Geral" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todos">Todo o Histórico</SelectItem>
                        <SelectItem value="hoje">Somente Hoje</SelectItem>
                        <SelectItem value="semana">Últimos 7 dias</SelectItem>
                        <SelectItem value="mes">Último Mês</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Status Checagem</Label>
                    <Select value={filtroChecagemDownload} onValueChange={setFiltroChechagemDownload}>
                      <SelectTrigger className="bg-slate-50 border-slate-200 h-10">
                        <SelectValue placeholder="Todos" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todos">Todos os Status</SelectItem>
                        <SelectItem value="pendente">Pendente</SelectItem>
                        <SelectItem value="aprovado">Aprovado</SelectItem>
                        <SelectItem value="reprovado">Reprovado</SelectItem>
                        <SelectItem value="vencida">Vencida</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Status Liberação</Label>
                    <Select value={filtroLiberacaoDownload} onValueChange={setFiltroLiberacaoDownload}>
                      <SelectTrigger className="bg-slate-50 border-slate-200 h-10">
                        <SelectValue placeholder="Todos" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todos">Todos os Status</SelectItem>
                        <SelectItem value="pendente">Pendente</SelectItem>
                        <SelectItem value="ok">Ok</SelectItem>
                        <SelectItem value="urgente">Urgente</SelectItem>
                        <SelectItem value="vencida">Vencida</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* PRÉVIA DE DADOS */}
                <div className="bg-slate-900 rounded-xl p-4 border border-slate-800 shadow-inner">
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <Users className="h-3 w-3" />
                      Prévia dos Nomes Encontrados
                    </div>
                    <Badge className="bg-blue-600/20 text-blue-400 border-blue-500/30 text-[10px]">
                      {(() => {
                        let filtrados = [...dadosOrdenados]
                        if (filtroEmpresaDownload !== "todos") filtrados = filtrados.filter(i => i.solicitacao.empresa === filtroEmpresaDownload)
                        if (filtroPeriodoDownload !== "todos") {
                            const agora = new Date()
                            let limite = new Date()
                            if (filtroPeriodoDownload === "hoje") limite.setHours(0, 0, 0, 0)
                            else if (filtroPeriodoDownload === "semana") limite.setDate(agora.getDate() - 7)
                            else if (filtroPeriodoDownload === "mes") limite.setMonth(agora.getMonth() - 1)
                            filtrados = filtrados.filter(item => new Date(item.solicitacao.dataSolicitacao.split("/").reverse().join("-")) >= limite)
                        }
                        if (filtroChecagemDownload !== "todos") {
                            filtrados = filtrados.filter(item => {
                                const statusReal = getChecagemStatus(item.prestador)
                                return filtroChecagemDownload === "vencida" ? statusReal === "vencida" : item.prestador.checagem === filtroChecagemDownload
                            })
                        }
                        if (filtroLiberacaoDownload !== "todos") {
                            filtrados = filtrados.filter(item => {
                                const statusReal = getLiberacaoStatus(item.prestador, item.solicitacao.dataFinal)
                                return filtroLiberacaoDownload === "vencida" ? statusReal === "vencida" : item.prestador.liberacao === filtroLiberacaoDownload
                            })
                        }
                        return filtrados.length
                      })()} prestadores
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    {(() => {
                      let filtrados = [...dadosOrdenados]
                      if (filtroEmpresaDownload !== "todos") filtrados = filtrados.filter(i => i.solicitacao.empresa === filtroEmpresaDownload)
                      if (filtroPeriodoDownload !== "todos") {
                          const agora = new Date()
                          let limite = new Date()
                          if (filtroPeriodoDownload === "hoje") limite.setHours(0, 0, 0, 0)
                          else if (filtroPeriodoDownload === "semana") limite.setDate(agora.getDate() - 7)
                          else if (filtroPeriodoDownload === "mes") limite.setMonth(agora.getMonth() - 1)
                          filtrados = filtrados.filter(item => new Date(item.solicitacao.dataSolicitacao.split("/").reverse().join("-")) >= limite)
                      }
                      if (filtroChecagemDownload !== "todos") {
                          filtrados = filtrados.filter(item => {
                              const statusReal = getChecagemStatus(item.prestador)
                              return filtroChecagemDownload === "vencida" ? statusReal === "vencida" : item.prestador.checagem === filtroChecagemDownload
                          })
                      }
                      if (filtroLiberacaoDownload !== "todos") {
                          filtrados = filtrados.filter(item => {
                              const statusReal = getLiberacaoStatus(item.prestador, item.solicitacao.dataFinal)
                              return filtroLiberacaoDownload === "vencida" ? statusReal === "vencida" : item.prestador.liberacao === filtroLiberacaoDownload
                          })
                      }
                      
                      const nomes = filtrados.slice(0, 5)
                      
                      if (nomes.length === 0) return <div className="text-slate-500 text-xs py-2 italic text-center">Nenhum registro encontrado para estes filtros.</div>
                      
                      return (
                        <>
                          {nomes.map((item, idx) => (
                            <div key={idx} className="text-xs text-slate-300 flex items-center gap-2 py-1 border-b border-white/5 last:border-0 truncate">
                              <span className="h-1.5 w-1.5 rounded-full bg-blue-500"></span>
                              {item.prestador.nome} 
                              <span className="text-[10px] text-slate-500">({item.solicitacao.empresa})</span>
                            </div>
                          ))}
                          {filtrados.length > 5 && (
                            <div className="text-[10px] text-slate-500 pt-2 text-center">... e mais {filtrados.length - 5} nomes</div>
                          )}
                        </>
                      )
                    })()}
                  </div>
                </div>
              </div>
              <DialogFooter className="bg-slate-100 -mx-6 -mb-6 p-4 flex gap-3">
                <Button variant="ghost" onClick={() => setModalDownloadAberto(false)} className="flex-1 text-slate-600">Cancelar</Button>
                <Button 
                  onClick={() => {
                    handleDownloadExcel(filtroEmpresaDownload, filtroPeriodoDownload)
                    setModalDownloadAberto(false)
                  }}
                  disabled={(() => {
                    let filtrados = [...dadosOrdenados]
                    if (filtroEmpresaDownload !== "todos") filtrados = filtrados.filter(i => i.solicitacao.empresa === filtroEmpresaDownload)
                    if (filtroPeriodoDownload !== "todos") {
                        const agora = new Date()
                        let limite = new Date()
                        if (filtroPeriodoDownload === "hoje") limite.setHours(0, 0, 0, 0)
                        else if (filtroPeriodoDownload === "semana") limite.setDate(agora.getDate() - 7)
                        else if (filtroPeriodoDownload === "mes") limite.setMonth(agora.getMonth() - 1)
                        filtrados = filtrados.filter(item => new Date(item.solicitacao.dataSolicitacao.split("/").reverse().join("-")) >= limite)
                    }
                    if (filtroChecagemDownload !== "todos") {
                        filtrados = filtrados.filter(item => {
                            const statusReal = getChecagemStatus(item.prestador)
                            return filtroChecagemDownload === "vencida" ? statusReal === "vencida" : item.prestador.checagem === filtroChecagemDownload
                        })
                    }
                    if (filtroLiberacaoDownload !== "todos") {
                        filtrados = filtrados.filter(item => {
                            const statusReal = getLiberacaoStatus(item.prestador, item.solicitacao.dataFinal)
                            return filtroLiberacaoDownload === "vencida" ? statusReal === "vencida" : item.prestador.liberacao === filtroLiberacaoDownload
                        })
                    }
                    return filtrados.length === 0
                  })()}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20"
                >
                  Confirmar e Gerar
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Dialog para visualização - igual ao do GESTOR */}
      <Dialog
        open={dialogAberto}
        onOpenChange={(open) => {
          setDialogAberto(open)
          if (!open) {
            setPrestadorSelecionado(null)
          }
        }}
      >
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes da Solicitação</DialogTitle>
          </DialogHeader>

          {prestadorSelecionado && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold">Número da Solicitação:</h4>
                  <p>{prestadorSelecionado.solicitacao.numero}</p>
                </div>
                <div>
                  <h4 className="font-semibold">Solicitante:</h4>
                  <p>{prestadorSelecionado.solicitacao.solicitante}</p>
                </div>
                <div>
                  <h4 className="font-semibold">Departamento:</h4>
                  <p>{prestadorSelecionado.solicitacao.departamento}</p>
                </div>
                <div>
                  <h4 className="font-semibold">Empresa:</h4>
                  <p>{prestadorSelecionado.solicitacao.empresa}</p>
                </div>
                <div>
                  <h4 className="font-semibold">Local:</h4>
                  <p>{prestadorSelecionado.solicitacao.local}</p>
                </div>
              </div>

              <div>
                <h4 className="font-semibold">Prestador:</h4>
                <p>
                  {prestadorSelecionado.prestador.nome} - {prestadorSelecionado.prestador.doc1}
                </p>
              </div>

              <div>
                <h4 className="font-semibold">Status da Checagem:</h4>
                <div className="flex items-center gap-2">
                  <StatusChecagemIcon status={getChecagemStatus(prestadorSelecionado.prestador)} />
                  <StatusChecagemBadge status={getChecagemStatus(prestadorSelecionado.prestador)} />
                </div>
              </div>

              {prestadorSelecionado.prestador.observacoes && (
                <div>
                  <h4 className="font-semibold">Observações / Justificativa:</h4>
                  <p className="p-3 bg-slate-50 rounded-md border text-sm text-slate-700 whitespace-pre-wrap">
                    {prestadorSelecionado.prestador.observacoes.includes('[ERRO RG]')
                      ? "Em análise (Validando documento)"
                      : prestadorSelecionado.prestador.observacoes}
                  </p>

                  {/* Botão de Correção para Reprovados */}
                  {prestadorSelecionado.prestador.checagem === 'reprovado' && (
                    <div className="mt-3 flex justify-end">
                      <Button onClick={handleAbrirEdicao} className="bg-blue-600 hover:bg-blue-700 text-white">
                        Corrigir Documentos
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de Edição (Correção) */}
      <Dialog open={modalEdicaoAberto} onOpenChange={setModalEdicaoAberto}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Corrigir Documentos</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="doc1">Doc 1 (RG, RNE, Passaporte)</Label>
              <Input
                id="doc1"
                value={dadosEdicao.doc1}
                onChange={(e) => setDadosEdicao({ ...dadosEdicao, doc1: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="doc2">Doc 2 (CPF, CNH)</Label>
              <Input
                id="doc2"
                value={dadosEdicao.doc2}
                onChange={(e) => setDadosEdicao({ ...dadosEdicao, doc2: e.target.value })}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setModalEdicaoAberto(false)}>Cancelar</Button>
            <Button onClick={handleSalvarEdicao} disabled={salvandoEdicao}>
              {salvandoEdicao ? "Salvando..." : "Salvar e Reenviar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
