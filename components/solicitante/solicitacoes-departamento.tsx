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
  StatusCadastroBadge,
  StatusCadastroIcon,
  getChecagemStatus,
  getCadastroStatus,
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
  { key: "documento", label: "Documento" },
  { key: "documento2", label: "Documento2" },
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
  const [filtroCadastro, setFiltroCadastro] = useState<string>("todos")
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
  const [dadosEdicao, setDadosEdicao] = useState({ documento: "", documento2: "" })
  const [salvandoEdicao, setSalvandoEdicao] = useState(false)
  const [mensagemSucesso, setMensagemSucesso] = useState<string | null>(null)

  const handleAbrirEdicao = () => {
    if (prestadorSelecionado) {
      setDadosEdicao({
        documento: prestadorSelecionado.prestador.documento || "",
        documento2: prestadorSelecionado.prestador.documento2 || "",
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
          documento: dadosEdicao.documento,
          documento2: dadosEdicao.documento2,
          status: "pendente", // Resetar status checagem
          cadastro: "pendente", // Resetar status liberação
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
  const [colunasVisiveis, setColunasVisiveis] = useState<Record<string, boolean>>(() => {
    // Tentar carregar do localStorage
    if (typeof window !== "undefined") {
      const salvas = localStorage.getItem("solicitante-departamento-colunas-visiveis")
      if (salvas) {
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
    return estadoInicial
  })

  // Salvar preferências no localStorage sempre que mudar
  useEffect(() => {
    if (typeof window !== "undefined") {
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
    if (prestador.status === "pendente" && prestador.cadastro === "urgente") return 1
    if (prestador.status === "pendente" && prestador.cadastro === "pendente") return 2
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
  }, [filtroStatus, filtroCadastro, filtroSolicitante, filtroEmpresa, buscaGeral])

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
        const cadastroStatusReal = getCadastroStatus(prestador, solicitacao.dataFinal)

        let statusMatch = filtroStatus === "todos"
        if (filtroStatus === "vencida") statusMatch = checagemStatusReal === "vencida"
        else if (filtroStatus !== "todos") statusMatch = prestador.status === filtroStatus

        let cadastroMatch = filtroCadastro === "todos"
        if (filtroCadastro === "vencida") cadastroMatch = cadastroStatusReal === "vencida"
        else if (filtroCadastro !== "todos") cadastroMatch = prestador.cadastro === filtroCadastro

        return statusMatch && cadastroMatch
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
        case "documento":
          valorA = a.prestador.documento
          valorB = b.prestador.documento
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
    const cadastroStatus = getCadastroStatus(prestador, dataFinal)
    if (checagemStatus === "vencida" || cadastroStatus === "vencida") return true
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
        documento: p.documento,
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

  const handleDownloadExcel = async () => {
    try {
      setCarregandoDownload(true)
      console.log("📊 Iniciando download Excel - Solicitante Departamento")

      // Importar XLSX dinamicamente
      const XLSX = await import("xlsx")

      // Configurar XLSX para browser
      XLSX.set_fs({})

      // Preparar dados para Excel
      const dadosParaExportar = dadosOrdenados.map((item, index) => ({
        "#": index + 1,
        Prestador: item.prestador.nome,
        Documento: item.prestador.documento,
        Documento2: item.prestador.documento2 || "-",
        "Data Inicial": item.solicitacao.dataInicial,
        "Data Final": item.solicitacao.dataFinal,
        "Status Liberação": getCadastroStatus(item.prestador, item.solicitacao.dataFinal),
        "Status Checagem": getChecagemStatus(item.prestador),
        "Válida até": item.prestador.checagemValidaAte ? formatarDataParaBR(item.prestador.checagemValidaAte) : "-",
        Observações: item.prestador.observacoes || "-",
        Departamento: item.solicitacao.departamento,
        "Número da Solicitação": item.solicitacao.numero,
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
    <div className="min-h-screen bg-slate-50 p-4">
      <div className="max-w-[1600px] mx-auto">
        <Card className="shadow-md border border-slate-200 rounded-lg overflow-hidden bg-white">
          <CardHeader className="pb-6 pt-8 bg-slate-800 border-b border-slate-700 relative">
            <CardTitle className="text-2xl font-bold text-white text-center flex items-center justify-center gap-3 tracking-tight">
              <Users className="h-6 w-6 text-slate-400" />
              Solicitações do Departamento - {usuario?.departamento}
            </CardTitle>
            <div className="w-16 h-1 bg-slate-500 mx-auto rounded-full mt-3 opacity-50"></div>
          </CardHeader>

          <CardContent className="pt-8">
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

            <div className="mb-8 border border-slate-200 rounded-md p-6 bg-white shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="bg-slate-100 p-2 rounded">
                    <Filter className="h-5 w-5 text-slate-600" />
                  </div>
                  <Label className="text-base font-bold text-slate-800 uppercase tracking-wider">Filtros & Pesquisa</Label>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => setMostrarFiltros(!mostrarFiltros)}
                    variant="outline"
                    size="sm"
                    className={`border-slate-300 h-9 px-4 rounded font-semibold ${mostrarFiltros ? "bg-slate-800 text-white hover:bg-slate-900" : "text-slate-600 hover:bg-slate-50"}`}
                  >
                    Filtros Avançados
                    <ChevronDown className={`h-4 w-4 ml-2 transition-transform ${mostrarFiltros ? "rotate-180" : ""}`} />
                  </Button>

                  {/* Botão Colunas */}
                  <div className="relative inline-block text-left">
                    <Button
                      onClick={() => setModalColunasAberto(!modalColunasAberto)}
                      variant="outline"
                      size="sm"
                      className="h-9 border-slate-300 text-slate-700 hover:bg-slate-50 rounded font-semibold"
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

                  {/* Botão Download */}
                  <Button
                    onClick={handleDownloadExcel}
                    disabled={carregandoDownload}
                    variant="outline"
                    size="sm"
                    className="h-9 border-slate-800 bg-slate-800 text-white hover:bg-slate-900 rounded font-semibold px-4 transition-all"
                  >
                    {carregandoDownload ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-white mr-2"></div>
                        Processando...
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4 mr-2" />
                        Download PDF/Excel
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Área de Filtros - Layout Flexível */}
              <div className="space-y-4">
                {/* Linha Principal: Busca Geral (Sempre Visível) */}
                <div className="flex flex-col md:flex-row gap-6 mt-4">
                  <div className="flex-1 max-w-xl">
                    <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">Pesquisa Global</Label>
                    <div className="relative">
                      <Input
                        type="text"
                        placeholder="Nome, documento, empresa ou número..."
                        value={buscaGeral}
                        onChange={(e) => setBuscaGeral(e.target.value)}
                        className="h-10 border-slate-300 focus:border-slate-800 focus:ring-0 rounded-none bg-slate-50/30 pr-10"
                      />
                      <Search className="h-4 w-4 absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                    </div>
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
                          <SelectItem value="vencida">Vencida</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Status Liberação */}
                    <div>
                      <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">Célula Liberação</Label>
                      <Select value={filtroCadastro} onValueChange={setFiltroCadastro}>
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
            </div>

            {/* Informações de Paginação */}
            <div className="mb-4 flex items-center justify-between">
              <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
                Linhagem: <span className="text-slate-800">{indiceInicio + 1}</span> — <span className="text-slate-800">{Math.min(indiceFim, totalPrestadores)}</span> <span className="mx-2 overflow-hidden opacity-30">|</span> Total de Registros: <span className="text-slate-700 font-bold">{totalPrestadores}</span>
              </div>
              <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
                Página <span className="text-slate-800">{paginaAtual}</span> <span className="mx-2 opacity-30">/</span> {totalPaginas}
              </div>
            </div>

            {/* Container com scroll e sticky header - Removendo wrapper extra do Table do shadcn se possível ou forçando estilo */}
            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <Table className="w-full border-collapse">
                <TableHeader
                  className="bg-slate-800 sticky top-0 z-50 shadow-md"
                >
                  <TableRow className="border-b border-slate-700">
                    {colunasVisiveis.numero && (
                      <TableHead
                        className="h-12 px-4 text-center align-middle font-bold text-slate-200 uppercase tracking-tighter text-[11px] min-w-[120px] whitespace-nowrap cursor-pointer hover:bg-slate-700 transition-colors z-20"
                        style={{ position: 'sticky', top: 0, zIndex: 40, backgroundColor: '#1e293b' }}
                        onClick={() => requestSort("numero")}
                      >
                        <div className="flex items-center justify-center gap-2">
                          Número {getSortIcon("numero")}
                        </div>
                      </TableHead>
                    )}
                    {colunasVisiveis.dataSolicitacao && (
                      <TableHead
                        className="h-12 px-4 text-center align-middle font-bold text-slate-200 uppercase tracking-tighter text-[11px] min-w-[110px] whitespace-nowrap cursor-pointer hover:bg-slate-700 transition-colors z-20"
                        style={{ position: 'sticky', top: 0, zIndex: 40, backgroundColor: '#1e293b' }}
                        onClick={() => requestSort("dataSolicitacao")}
                      >
                        <div className="flex items-center justify-center gap-2">
                          Solicitação {getSortIcon("dataSolicitacao")}
                        </div>
                      </TableHead>
                    )}
                    {colunasVisiveis.empresa && (
                      <TableHead
                        className="h-12 px-4 text-center align-middle font-bold text-slate-200 uppercase tracking-tighter text-[11px] min-w-[180px] cursor-pointer hover:bg-slate-700 transition-colors z-20"
                        style={{ position: 'sticky', top: 0, zIndex: 40, backgroundColor: '#1e293b' }}
                        onClick={() => requestSort("empresa")}
                      >
                        <div className="flex items-center justify-center gap-2">
                          Empresa {getSortIcon("empresa")}
                        </div>
                      </TableHead>
                    )}
                    {colunasVisiveis.prestador && (
                      <TableHead
                        className="h-12 px-4 text-center align-middle font-bold text-slate-200 uppercase tracking-tighter text-[11px] min-w-[160px] cursor-pointer hover:bg-slate-700 transition-colors z-20"
                        style={{ position: 'sticky', top: 0, zIndex: 40, backgroundColor: '#1e293b' }}
                        onClick={() => requestSort("prestador")}
                      >
                        <div className="flex items-center justify-center gap-2">
                          Prestador {getSortIcon("prestador")}
                        </div>
                      </TableHead>
                    )}
                    {colunasVisiveis.documento && (
                      <TableHead
                        className="h-12 px-4 text-center align-middle font-bold text-slate-200 uppercase tracking-tighter text-[11px] min-w-[130px] cursor-pointer hover:bg-slate-700 transition-colors z-20"
                        style={{ position: 'sticky', top: 0, zIndex: 40, backgroundColor: '#1e293b' }}
                        onClick={() => requestSort("documento")}
                      >
                        <div className="flex items-center justify-center gap-2">
                          Documento {getSortIcon("documento")}
                        </div>
                      </TableHead>
                    )}
                    {colunasVisiveis.documento2 && (
                      <TableHead
                        className="h-12 px-4 text-center align-middle font-bold text-slate-200 uppercase tracking-tighter text-[11px] min-w-[130px] z-20"
                        style={{ position: 'sticky', top: 0, zIndex: 40, backgroundColor: '#1e293b' }}
                      >
                        Documento2
                      </TableHead>
                    )}
                    {colunasVisiveis.dataInicial && (
                      <TableHead
                        className="h-12 px-4 text-center align-middle font-bold text-slate-200 uppercase tracking-tighter text-[11px] min-w-[110px] cursor-pointer hover:bg-slate-700 transition-colors z-20"
                        style={{ position: 'sticky', top: 0, zIndex: 40, backgroundColor: '#1e293b' }}
                        onClick={() => requestSort("dataInicial")}
                      >
                        <div className="flex items-center justify-center gap-2">
                          Data Inicial {getSortIcon("dataInicial")}
                        </div>
                      </TableHead>
                    )}
                    {colunasVisiveis.dataFinal && (
                      <TableHead
                        className="h-12 px-4 text-center align-middle font-bold text-slate-200 uppercase tracking-tighter text-[11px] min-w-[110px] cursor-pointer hover:bg-slate-700 transition-colors z-20"
                        style={{ position: 'sticky', top: 0, zIndex: 40, backgroundColor: '#1e293b' }}
                        onClick={() => requestSort("dataFinal")}
                      >
                        <div className="flex items-center justify-center gap-2">
                          Data Final {getSortIcon("dataFinal")}
                        </div>
                      </TableHead>
                    )}
                    {colunasVisiveis.liberacao && (
                      <TableHead
                        className="h-12 px-4 text-center align-middle font-bold text-slate-200 uppercase tracking-tighter text-[11px] min-w-[120px] whitespace-nowrap z-20"
                        style={{ position: 'sticky', top: 0, zIndex: 40, backgroundColor: '#1e293b' }}
                      >
                        Liberação
                      </TableHead>
                    )}
                    {colunasVisiveis.checagem && (
                      <TableHead
                        className="h-12 px-4 text-center align-middle font-bold text-slate-200 uppercase tracking-tighter text-[11px] min-w-[120px] whitespace-nowrap z-20"
                        style={{ position: 'sticky', top: 0, zIndex: 40, backgroundColor: '#1e293b' }}
                      >
                        Checagem
                      </TableHead>
                    )}
                    {colunasVisiveis.validaAte && (
                      <TableHead
                        className="h-12 px-4 text-center align-middle font-bold text-slate-200 uppercase tracking-tighter text-[11px] min-w-[110px] whitespace-nowrap z-20"
                        style={{ position: 'sticky', top: 0, zIndex: 40, backgroundColor: '#1e293b' }}
                      >
                        Válida até
                      </TableHead>
                    )}
                    {colunasVisiveis.observacoes && (
                      <TableHead
                        className="h-12 px-4 text-center align-middle font-bold text-slate-200 uppercase tracking-tighter text-[11px] min-w-[200px] z-20"
                        style={{ position: 'sticky', top: 0, zIndex: 40, backgroundColor: '#1e293b' }}
                      >
                        Observações
                      </TableHead>
                    )}
                    <TableHead
                      className="h-12 px-4 text-center align-middle font-bold text-slate-200 uppercase tracking-tighter text-[11px] min-w-[80px] z-30"
                      style={{ position: 'sticky', top: 0, right: 0, zIndex: 50, backgroundColor: '#1e293b' }}
                    >
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
                    const cadastroStatus = getCadastroStatus(prestador, solicitacao.dataFinal)

                    return (
                      <TableRow
                        key={`${solicitacao.id}-${prestador.id}`}
                        className={`hover:bg-slate-50 ${solicitacao.solicitante === usuario?.nome ? "bg-slate-25 border-l-4 border-l-slate-500" : ""
                          } ${prestadorIndex > 0 ? "border-l-4 border-l-slate-200 bg-slate-25" : ""}`}
                      >
                        {colunasVisiveis.numero && (
                          <TableCell className="font-medium text-sm whitespace-nowrap text-center">
                            <div className="flex items-center justify-center gap-2">
                              {/* Indicador de prioridade */}
                              {prestador.status === "pendente" && prestador.cadastro === "urgente" && (
                                <div
                                  className="w-2 h-2 bg-red-500 rounded-full"
                                  title="Prioridade ALTA - Urgente"
                                ></div>
                              )}
                              {prestador.status === "pendente" && prestador.cadastro === "pendente" && (
                                <div className="w-2 h-2 bg-slate-500 rounded-full" title="Prioridade NORMAL"></div>
                              )}
                              {solicitacao.numero}
                              {solicitacao.solicitante === usuario?.nome && (
                                <Badge variant="outline" className="ml-2 text-xs">
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
                          <TableCell className="text-sm whitespace-nowrap text-center">
                            {solicitacao.dataSolicitacao}
                          </TableCell>
                        )}
                        {colunasVisiveis.empresa && (
                          <TableCell className="text-sm text-center">{solicitacao.empresa}</TableCell>
                        )}
                        {colunasVisiveis.prestador && (
                          <TableCell className="text-sm text-center">
                            <div className="whitespace-nowrap font-medium flex items-center justify-center gap-2">
                              {prestador.nome}
                            </div>
                          </TableCell>
                        )}
                        {colunasVisiveis.documento && (
                          <TableCell className="text-sm text-center">
                            <div className="text-xs font-mono whitespace-nowrap">{prestador.documento}</div>
                          </TableCell>
                        )}
                        {colunasVisiveis.documento2 && (
                          <TableCell className="text-sm text-center">
                            <div className="text-xs font-mono whitespace-nowrap">{prestador.documento2 || "-"}</div>
                          </TableCell>
                        )}
                        {colunasVisiveis.dataInicial && (
                          <TableCell className="text-sm whitespace-nowrap text-center">
                            <DataInicialIndicator
                              dataInicial={solicitacao.dataInicial}
                              isReprovado={prestador.status === "reprovado"}
                            />
                          </TableCell>
                        )}
                        {colunasVisiveis.dataFinal && (
                          <TableCell className="text-sm whitespace-nowrap text-center">
                            {prestador.status === "reprovado" ? (
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
                          <TableCell className="whitespace-nowrap text-center">
                            <div className="flex items-center justify-center gap-2">
                              <StatusCadastroIcon status={cadastroStatus} />
                              <StatusCadastroBadge status={cadastroStatus} />
                            </div>
                          </TableCell>
                        )}
                        {colunasVisiveis.checagem && (
                          <TableCell className="px-4 py-3 text-center border-r border-slate-50">
                            <div className="flex items-center justify-center">
                              <StatusChecagemBadge status={checagemStatus} />
                            </div>
                          </TableCell>
                        )}
                        {colunasVisiveis.validaAte && (
                          <TableCell className="px-4 py-3 text-slate-600 text-center border-r border-slate-50">
                            {prestador.checagemValidaAte ? formatarDataParaBR(prestador.checagemValidaAte) : <span className="text-slate-300">-</span>}
                          </TableCell>
                        )}
                        {colunasVisiveis.observacoes && (
                          <TableCell className="px-4 py-3 text-left">
                            {prestador.observacoes ? (
                              <div className="text-[11px] leading-tight text-slate-500 bg-slate-50 p-2 border border-slate-100 rounded-sm">
                                {prestador.observacoes}
                              </div>
                            ) : (
                              <span className="text-slate-300">-</span>
                            )}
                          </TableCell>
                        )}
                        <TableCell
                          className="px-4 py-3 text-center bg-white/80 backdrop-blur-sm z-30"
                          style={{ position: 'sticky', right: 0 }}
                        >
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleVisualizarSolicitacao(solicitacao, prestador)}
                            className="h-8 w-8 p-0 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                          >
                            <Eye className="h-4 w-4" />
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

            <div className="mt-8 pt-6 border-t border-slate-200 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex flex-col gap-1">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Resumo da Visualização</div>
                <div className="flex items-center gap-4">
                  <span className="text-sm font-bold text-slate-800">{totalPrestadoresFiltrados} <span className="text-slate-400 font-medium">prestadores localizados</span></span>
                  <div className="h-4 w-[1px] bg-slate-200"></div>
                  <span className="text-sm font-bold text-slate-600 italic">{minhasSolicitacoes.length} <span className="text-slate-400/70 font-medium">seus registros</span></span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Button
                  onClick={handlePaginaAnterior}
                  disabled={paginaAtual === 1}
                  variant="outline"
                  size="sm"
                  className="h-10 px-4 border-slate-300 text-slate-700 hover:bg-slate-50 rounded-none font-bold uppercase text-[11px] tracking-tight disabled:opacity-30"
                >
                  <ChevronLeft className="h-4 w-4 mr-2" />
                  Voltar
                </Button>

                <div className="bg-slate-800 px-6 py-2 rounded-none text-xs font-black text-white min-w-[100px] text-center tracking-tighter shadow-inner">
                  PÁGINA {paginaAtual} <span className="text-slate-400 font-normal mx-1">DE</span> {totalPaginas}
                </div>

                <Button
                  onClick={handleProximaPagina}
                  disabled={paginaAtual === totalPaginas}
                  variant="outline"
                  size="sm"
                  className="h-10 px-4 border-slate-300 text-slate-700 hover:bg-slate-50 rounded-none font-bold uppercase text-[11px] tracking-tight disabled:opacity-30"
                >
                  Avançar
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
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
                  {prestadorSelecionado.prestador.nome} - {prestadorSelecionado.prestador.documento}
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
                  {prestadorSelecionado.prestador.status === 'reprovado' && (
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
                value={dadosEdicao.documento}
                onChange={(e) => setDadosEdicao({ ...dadosEdicao, documento: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="doc2">Doc 2 (CPF, CNH)</Label>
              <Input
                id="doc2"
                value={dadosEdicao.documento2}
                onChange={(e) => setDadosEdicao({ ...dadosEdicao, documento2: e.target.value })}
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
