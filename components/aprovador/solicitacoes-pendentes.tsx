"use client"

import { useState, useEffect } from "react"
import {
  CheckCircle,
  XCircle,
  Clock,
  Filter,
  Search,
  AlertTriangle,
  RefreshCw,
  Download,
  Settings,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import type { Solicitacao, PrestadorAvaliacao } from "../../types"
import { getChecagemStatus } from "../ui/status-badges"
import { getAllSolicitacoes } from "../../services/solicitacoes-service"
import { supabase } from "@/lib/supabase"
import { formatarDataParaBR } from "../../utils/date-helpers"

export default function SolicitacoesPendentes() {
  const [paginaAtual, setPaginaAtual] = useState(1)
  const PRESTADORES_POR_PAGINA = 10
  const [filtroEmpresa, setFiltroEmpresa] = useState<string>("todos")
  const [filtroPesquisaData, setFiltroPesquisaData] = useState("")
  const [filtroStatus, setFiltroStatus] = useState<string>("todos")
  const [buscaGeral, setBuscaGeral] = useState("")

  // Novos estados para modais
  const [modalDownloadAberto, setModalDownloadAberto] = useState(false)
  const [modalColunasAberto, setModalColunasAberto] = useState(false)

  // Estados para controle de colunas visíveis
  const [colunasVisiveis, setColunasVisiveis] = useState({
    dataSolicitacao: true,
    dataInicial: true,
    empresa: true,
    prestador: true,
    doc1: true,
    doc2: true,
    checagem: true,
    validaAte: true,
    justificativa: true,
  })

  // Estados para download
  const [opcoesDownload, setOpcoesDownload] = useState({
    dataSolicitacao: true,
    dataInicial: true,
    empresa: true,
    prestador: true,
    doc1: true,
    doc2: true,
    checagem: true,
    validaAte: true,
    justificativa: true,
  })
  const [rangeDataDownload, setRangeDataDownload] = useState({
    dataInicio: "",
    dataFim: "",
  })
  const [prestadorAvaliando, setPrestadorAvaliando] = useState<{
    solicitacao: Solicitacao
    prestador: PrestadorAvaliacao
  } | null>(null)
  const [novoStatus, setNovoStatus] = useState("")
  const [justificativa, setJustificativa] = useState("")
  const [dialogAvaliacaoAberto, setDialogAvaliacaoAberto] = useState(false)
  const [solicitacoesReais, setSolicitacoesReais] = useState<Solicitacao[]>([])
  const [carregando, setCarregando] = useState(true)

  const empresas = Array.from(new Set(solicitacoesReais.map((s) => s.empresa)))

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "aprovado":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Aprovado</Badge>
      case "reprovado":
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Reprovado</Badge>
      case "pendente":
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Pendente</Badge>
      case "revisar":
        return <Badge className="bg-fuchsia-100 text-fuchsia-800 hover:bg-fuchsia-100 border-fuchsia-200">Revisar</Badge>
      case "parcial":
        return <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100">Parcial</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "aprovado":
        return <CheckCircle className="h-3 w-3 text-green-600" />
      case "reprovado":
        return <XCircle className="h-3 w-3 text-red-600" />
      case "pendente":
        return <Clock className="h-3 w-3 text-yellow-600" />
      case "revisar":
        return <AlertTriangle className="h-3 w-3 text-fuchsia-600" />
      case "parcial":
        return <AlertTriangle className="h-3 w-3 text-orange-600" />
      default:
        return null
    }
  }

  // Função para normalizar texto (remover acentos, converter para minúsculo)
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

  const getPrioridade = (prestador: PrestadorAvaliacao, solicitacao: Solicitacao) => {
    // 🚨 PRIORIDADE 0 (TOPO): Status Pendente ou Revisar
    if (prestador.checagem === "pendente" || prestador.checagem === "revisar") {
      return 0 // Qualquer prestador pendente ou em Revisar tem prioridade máxima
    }

    // ⚪ PRIORIDADE 1 (FINAL): Todos os outros status
    return 1 // Aprovados, reprovados, etc. vão para o final
  }

  const buscarSolicitacoes = async (silent = false) => {
    try {
      if (!silent) setCarregando(true)
      // Buscar todas as solicitações para mostrar também as já avaliadas
      const solicitacoes = await getAllSolicitacoes()

      // DEBUG: Verificar como os dados migrados estão sendo identificados
      console.log("🔍 DEBUG - Dados recebidos:", solicitacoes)

      // Filtrar dados migrados pelo suporte - testar diferentes possibilidades
      const solicitacoesFiltradas = solicitacoes
        .map((solicitacao) => ({
          ...solicitacao,
          prestadores: solicitacao.prestadores.filter((prestador) => {
            // DEBUG: Log para verificar campos do prestador
            console.log("🔍 DEBUG - Prestador:", {
              nome: prestador.nome,
              aprovado_por: (prestador as any).aprovado_por,
              aprovadoPor: prestador.aprovadoPor,
              checagem: prestador.checagem,
              observacoes: prestador.observacoes,
            })
            const isMigrado =
              (prestador as any).aprovado_por === "Dados migrados pelo suporte" ||
              prestador.aprovadoPor === "Dados migrados pelo suporte" ||
              (prestador.observacoes && prestador.observacoes.includes("migrados pelo suporte")) ||
              (prestador.justificativa && prestador.justificativa.includes("migrados pelo suporte"))

            if (isMigrado) {
              console.log("🚫 FILTRADO - Prestador migrado:", prestador.nome)
            }

            return !isMigrado
          }),
        }))
        .filter((solicitacao) => solicitacao.prestadores.length > 0)

      setSolicitacoesReais(solicitacoesFiltradas)
      console.log("📊 Dados filtrados:", solicitacoesFiltradas)
    } catch (error) {
      console.error("Erro ao buscar solicitações:", error)
    } finally {
      if (!silent) setCarregando(false)
    }
  }

  useEffect(() => {
    buscarSolicitacoes()
  }, [])

  // Resetar página quando filtros mudarem
  useEffect(() => {
    setPaginaAtual(1)
  }, [filtroEmpresa, filtroPesquisaData, filtroStatus, buscaGeral])

  // Filtrar solicitações
  const dadosIniciais = solicitacoesReais
    .map((solicitacao) => {
      // Filtro de empresa
      const empresaMatch = filtroEmpresa === "todos" || solicitacao.empresa === filtroEmpresa

      if (!empresaMatch) return null

      // Filtro por data inicial
      let dataMatch = true
      if (filtroPesquisaData) {
        const [ano, mes, dia] = filtroPesquisaData.split("-")
        const dataFormatada = `${dia}/${mes}/${ano}`
        dataMatch = solicitacao.dataInicial === dataFormatada
      }

      if (!dataMatch) return null

      // Filtrar prestadores dentro da solicitação
      const prestadoresFiltrados = solicitacao.prestadores.filter((prestador) => {
        // Calcular status real para filtros
        const checagemStatusReal = getChecagemStatus(prestador)

        // Filtro de status checagem (incluindo status calculados)
        let statusMatch = filtroStatus === "todos"
        if (filtroStatus === "vencida") {
          statusMatch = checagemStatusReal === "vencida"
        } else if (filtroStatus !== "todos") {
          const statusParaFiltro =
            filtroStatus === "aprovado" ? "aprovado" : filtroStatus === "reprovado" ? "reprovado" : filtroStatus
          statusMatch = prestador.checagem === statusParaFiltro
        }

        // Filtro de busca geral
        let buscaMatch = true
        if (buscaGeral.trim()) {
          const termoBusca = buscaGeral.trim()
          const nomeNormalizado = normalizarTexto(prestador.nome)
          const documentoNormalizado = normalizarDocumento(prestador.doc1)
          const termoBuscaNormalizado = normalizarTexto(termoBusca)
          const termoBuscaDocumento = normalizarDocumento(termoBusca)

          buscaMatch =
            nomeNormalizado.includes(termoBuscaNormalizado) || documentoNormalizado.includes(termoBuscaDocumento)
        }

        return statusMatch && buscaMatch
      })

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
      solicitacao.prestadores.map((prestador) => ({
        solicitacao,
        prestador,
        prioridade: getPrioridade(prestador, solicitacao),
      })),
    )
    .sort((a, b) => {
      // Ordenar por prioridade (menor número = maior prioridade)
      if (a.prioridade !== b.prioridade) {
        return a.prioridade - b.prioridade
      }

      // Se mesma prioridade, ordenar por data inicial (mais próxima primeiro)
      const dataA = new Date(a.solicitacao.dataInicial.split("/").reverse().join("-"))
      const dataB = new Date(b.solicitacao.dataInicial.split("/").reverse().join("-"))
      return dataA.getTime() - dataB.getTime()
    })

  // Calcular paginação
  const totalPrestadores = dadosFiltrados.length
  const totalPaginas = Math.ceil(totalPrestadores / PRESTADORES_POR_PAGINA)
  const indiceInicio = (paginaAtual - 1) * PRESTADORES_POR_PAGINA
  const indiceFim = indiceInicio + PRESTADORES_POR_PAGINA
  const dadosPaginados = dadosFiltrados.slice(indiceInicio, indiceFim)

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

  const handleAvaliar = (solicitacao: Solicitacao, prestador: PrestadorAvaliacao) => {
    setPrestadorAvaliando({ solicitacao, prestador })
    setNovoStatus("")
    setJustificativa("")
    setDialogAvaliacaoAberto(true)
  }

  const simularAvaliacao = async () => {
    if (!prestadorAvaliando) return

    try {
      const agora = new Date()
      // Estado anterior para rollback se necessário
      const estadoAnterior = [...solicitacoesReais]

      // ATUALIZAÇÃO OTIMISTA (Muda na tela IMEDIATAMENTE)
      setSolicitacoesReais((prevSolicitacoes) =>
        prevSolicitacoes.map((s) => {
          if (s.id !== prestadorAvaliando.solicitacao.id) return s
          return {
            ...s,
            prestadores: s.prestadores.map((p) => {
              if (p.id !== prestadorAvaliando.prestador.id) return p

              // Ajuste Mágico no Frontend Optimistic Update
              let newDoc1 = p.doc1;
              let newDoc2 = p.doc2;
              if (p.checagem === "revisar" && novoStatus === "aprovado") {
                newDoc2 = p.doc1;
                newDoc1 = ""; // limpar
              }

              return { ...p, checagem: novoStatus as any, justificativa: justificativa || undefined, doc1: newDoc1, doc2: newDoc2 }
            }),
          }
        }),
      )

      const updateData: any = {
        checagem: novoStatus,
        aprovado_por: "Sistema", // Idealmente usar o nome real do usuário logado
        data_avaliacao: agora.toISOString(),
        justificativa: justificativa || null,
      }

      if (novoStatus === "aprovado") {
        // Calcular validade da checagem (6 meses)
        const validadeChecagem = new Date()
        validadeChecagem.setMonth(validadeChecagem.getMonth() + 6)
        updateData.checagem_valida_ate = validadeChecagem.toISOString().split("T")[0]
      }

      // AJUSTE MÁGICO para ROBO4
      if (prestadorAvaliando.prestador.checagem === "revisar" && novoStatus === "aprovado") {
        updateData.doc2 = prestadorAvaliando.prestador.doc1;
        updateData.doc1 = "";
      }

      // CORREÇÃO: Salvar realmente no Supabase
      const { error } = await supabase.from("prestadores").update(updateData).eq("id", prestadorAvaliando.prestador.id)

      if (error) {
        console.error("Erro ao atualizar status:", error)
        alert("Erro ao salvar avaliação. Tente novamente.")
        // Rollback em caso de erro
        setSolicitacoesReais(estadoAnterior)
        return
      }

      // Atualizar status geral da solicitação
      await atualizarStatusGeralSolicitacao(prestadorAvaliando.prestador.id)

      // Buscar dados atualizados SILENCIOSAMENTE (sem Loading Screen)
      buscarSolicitacoes(true)

      console.log("📝 Avaliação registrada:")
      console.log(`Prestador: ${prestadorAvaliando.prestador.nome}`)
      console.log(`Novo Status: ${novoStatus}`)
      console.log(`Justificativa: ${justificativa}`)
    } catch (error) {
      console.error("Erro ao atualizar status:", error)
      alert("Erro ao salvar avaliação. Tente novamente.")
    }
  }

  // Adicionar função para atualizar o status geral da solicitação
  const atualizarStatusGeralSolicitacao = async (prestadorId: string) => {
    try {
      // Buscar a solicitação do prestador
      const { data: prestador } = await supabase
        .from("prestadores")
        .select("solicitacao_id")
        .eq("id", prestadorId)
        .single()

      if (!prestador) return

      // Buscar todos os prestadores da solicitação
      const { data: prestadores } = await supabase
        .from("prestadores")
        .select("checagem")
        .eq("solicitacao_id", prestador.solicitacao_id)

      if (!prestadores) return

      const statusList = prestadores.map((p) => (p as any).checagem)
      let novoStatus: string

      if (statusList.every((s) => s === "aprovado")) {
        novoStatus = "aprovado"
      } else if (statusList.every((s) => s === "reprovado")) {
        novoStatus = "reprovado"
      } else if (statusList.some((s) => s === "aprovado") && statusList.some((s) => s === "reprovado")) {
        novoStatus = "parcial"
      } else {
        novoStatus = "pendente"
      }

      await supabase
        .from("solicitacoes")
        .update({
          status_geral: novoStatus,
        })
        .eq("id", prestador.solicitacao_id)
    } catch (error) {
      console.error("Erro ao atualizar status geral:", error)
    }
  }

  const handleSalvarAvaliacao = () => {
    if (!novoStatus) {
      alert("Selecione um status para continuar")
      return
    }

    if (novoStatus === "reprovado" && !justificativa.trim()) {
      alert("Justificativa é obrigatória para reprovação")
      return
    }

    simularAvaliacao()
    setDialogAvaliacaoAberto(false)
    setPrestadorAvaliando(null)
    setNovoStatus("")
    setJustificativa("")
  }

  if (carregando) {
    return (
      <div className="flex justify-center items-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-slate-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="max-w-7xl mx-auto">
        <Card className="shadow-lg border-0">
          <CardHeader className="pb-6">
            <CardTitle className="text-2xl font-bold text-slate-800 text-center">Solicitações Pendentes</CardTitle>
            <div className="w-24 h-1 bg-slate-600 mx-auto rounded-full"></div>
          </CardHeader>

          <CardContent>
            {/* Filtros */}
            <div className="mb-6 p-4 bg-slate-50 rounded-lg">
              <div className="flex items-center gap-2 mb-4">
                <Filter className="h-5 w-5 text-slate-600" />
                <Label className="text-lg font-medium text-slate-700">Filtros</Label>
                <div className="ml-auto flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => buscarSolicitacoes()}>
                    <RefreshCw className="h-4 w-4 mr-1" /> Atualizar
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setModalDownloadAberto(true)}>
                    <Download className="h-4 w-4 mr-1" /> Download
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setModalColunasAberto(true)}>
                    <Settings className="h-4 w-4 mr-1" /> Colunas
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Empresa */}
                <div>
                  <Label className="text-sm font-medium text-slate-700 mb-2 block">Empresa</Label>
                  <Select value={filtroEmpresa} onValueChange={setFiltroEmpresa}>
                    <SelectTrigger className="border-slate-300">
                      <SelectValue placeholder="Selecione a empresa" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todas</SelectItem>
                      {empresas.map((empresa) => (
                        <SelectItem key={empresa} value={empresa}>
                          {empresa}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Status Checagem */}
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
                      <SelectItem value="vencida">Vencida</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Pesquisa por Data Inicial */}
                <div>
                  <Label className="text-sm font-medium text-slate-700 mb-2 block">Pesquisa por Data Inicial</Label>
                  <Input
                    type="date"
                    value={filtroPesquisaData}
                    onChange={(e) => setFiltroPesquisaData(e.target.value)}
                    className="border-slate-300 focus:border-slate-600 focus:ring-slate-600"
                  />
                </div>

                {/* Busca Geral */}
                <div>
                  <Label className="text-sm font-medium text-slate-700 mb-2 block">Busca Geral</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      type="text"
                      placeholder="Nome ou documento..."
                      value={buscaGeral}
                      onChange={(e) => setBuscaGeral(e.target.value)}
                      className="pl-10 border-slate-300 focus:border-slate-600 focus:ring-slate-600"
                    />
                  </div>
                  {buscaGeral && <p className="text-xs text-slate-500 mt-1">{dadosFiltrados.length} resultado(s)</p>}
                </div>
              </div>
            </div>

            {/* Informações de Paginação */}
            <div className="mb-4 flex items-center justify-between text-sm text-slate-600">
              <div>
                <strong>
                  Mostrando {indiceInicio + 1} - {Math.min(indiceFim, totalPrestadores)} de {totalPrestadores}{" "}
                  prestadores
                </strong>
              </div>
              <div>
                <strong>
                  Página {paginaAtual} de {totalPaginas}
                </strong>
              </div>
            </div>

            {/* Tabela */}
            <div className="rounded-lg border border-slate-200 overflow-x-auto">
              <Table className="min-w-full">
                <TableHeader>
                  <TableRow className="bg-slate-50">
                    {colunasVisiveis.dataSolicitacao && (
                      <TableHead className="font-semibold text-slate-800 text-center min-w-[100px] whitespace-nowrap">
                        Data Solicitação
                      </TableHead>
                    )}
                    {colunasVisiveis.dataInicial && (
                      <TableHead className="font-semibold text-slate-800 text-center min-w-[100px] whitespace-nowrap">
                        Data Inicial
                      </TableHead>
                    )}
                    {colunasVisiveis.empresa && (
                      <TableHead className="font-semibold text-slate-800 text-center min-w-[160px]">Empresa</TableHead>
                    )}
                    {colunasVisiveis.prestador && (
                      <TableHead className="font-semibold text-slate-800 text-center min-w-[160px]">
                        Prestador
                      </TableHead>
                    )}
                    {colunasVisiveis.doc1 && (
                      <TableHead className="font-semibold text-slate-800 text-center min-w-[130px]">
                        Doc1
                      </TableHead>
                    )}
                    {colunasVisiveis.doc2 && (
                      <TableHead className="font-semibold text-slate-800 text-center min-w-[130px]">
                        Doc2
                      </TableHead>
                    )}
                    {colunasVisiveis.checagem && (
                      <TableHead className="font-semibold text-slate-800 text-center min-w-[100px]">Checagem</TableHead>
                    )}
                    {colunasVisiveis.validaAte && (
                      <TableHead className="font-semibold text-slate-800 text-center min-w-[130px] whitespace-nowrap">
                        Válida até
                      </TableHead>
                    )}
                    <TableHead className="font-semibold text-slate-800 text-center min-w-[120px]">Ações</TableHead>
                    {colunasVisiveis.justificativa && (
                      <TableHead className="font-semibold text-slate-800 text-center min-w-[200px]">
                        Justificativa
                      </TableHead>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dadosPaginados.map(({ solicitacao, prestador, prioridade }, index) => (
                    <TableRow key={`${solicitacao.id}-${prestador.id}`} className="hover:bg-slate-50">
                      {colunasVisiveis.dataSolicitacao && (
                        <TableCell className="text-sm whitespace-nowrap text-center">
                          {solicitacao.dataSolicitacao}
                        </TableCell>
                      )}
                      {colunasVisiveis.dataInicial && (
                        <TableCell className="text-sm whitespace-nowrap text-center">
                          <div className="flex items-center justify-center gap-2">
                            {prestador.checagem === "reprovado" ? (
                              <span className="text-slate-400">-</span>
                            ) : (
                              <>
                                {prestador.checagem === "pendente" ? (
                                  (() => {
                                    const hoje = new Date()
                                    hoje.setHours(0, 0, 0, 0)
                                    const [dia, mes, ano] = solicitacao.dataInicial.split("/")
                                    const dataInicial = new Date(
                                      Number.parseInt(ano),
                                      Number.parseInt(mes) - 1,
                                      Number.parseInt(dia),
                                    )
                                    dataInicial.setHours(0, 0, 0, 0)
                                    const diferencaDias = Math.ceil(
                                      (dataInicial.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24),
                                    )

                                    if (diferencaDias <= 0) {
                                      return (
                                        <span className="inline-flex items-center gap-1 text-red-600 font-bold">
                                          🚨 {solicitacao.dataInicial}
                                        </span>
                                      )
                                    } else if (diferencaDias <= 3) {
                                      return (
                                        <span className="inline-flex items-center gap-1 text-orange-600 font-semibold">
                                          ⚡ {solicitacao.dataInicial}
                                        </span>
                                      )
                                    } else {
                                      return <span>{solicitacao.dataInicial}</span>
                                    }
                                  })()
                                ) : (
                                  <span>{solicitacao.dataInicial}</span>
                                )}
                              </>
                            )}
                          </div>
                        </TableCell>
                      )}
                      {colunasVisiveis.empresa && (
                        <TableCell className="text-sm text-center">
                          <div className="whitespace-nowrap font-medium">{solicitacao.empresa}</div>
                        </TableCell>
                      )}
                      {colunasVisiveis.prestador && (
                        <TableCell className="text-sm text-center">
                          <div className="whitespace-nowrap font-medium">{prestador.nome}</div>
                        </TableCell>
                      )}
                      {colunasVisiveis.doc1 && (
                        <TableCell className="text-sm text-center">
                          <div className="text-xs font-mono whitespace-nowrap">{prestador.doc1}</div>
                        </TableCell>
                      )}
                      {colunasVisiveis.doc2 && (
                        <TableCell className="text-sm text-center">
                          <div className="text-xs font-mono whitespace-nowrap">{prestador.doc2 || "-"}</div>
                        </TableCell>
                      )}
                      {colunasVisiveis.checagem && (
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-2 whitespace-nowrap">
                            {prestador.checagem === "aprovado" && (
                              <>
                                <CheckCircle className="h-4 w-4 text-green-600" />
                                <Badge className="bg-green-100 text-green-800 border-green-200">Aprovada</Badge>
                              </>
                            )}
                            {prestador.checagem === "reprovado" && (
                              <>
                                <XCircle className="h-4 w-4 text-red-600" />
                                <Badge className="bg-red-100 text-red-800 border-red-200">Reprovada</Badge>
                              </>
                            )}
                            {prestador.checagem === "pendente" && (
                              <>
                                <Clock className="h-4 w-4 text-yellow-600" />
                                <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Pendente</Badge>
                              </>
                            )}
                            {prestador.checagem === "revisar" && (
                              <>
                                <AlertTriangle className="h-4 w-4 text-fuchsia-600" />
                                <Badge className="bg-fuchsia-100 text-fuchsia-800 border-fuchsia-200">Revisar</Badge>
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
                            <span className="text-slate-400">-</span>
                          )}
                        </TableCell>
                      )}
                      <TableCell>
                        <div className="flex items-center justify-center gap-1">
                          {(prestador.checagem === "pendente" || prestador.checagem === "revisar") && (
                            <Button
                              onClick={() => handleAvaliar(solicitacao, prestador)}
                              variant="outline"
                              size="sm"
                              className="border-green-600 text-green-600 hover:bg-green-50 h-7 w-7 p-0"
                            >
                              <CheckCircle className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                      {colunasVisiveis.justificativa && (
                        <TableCell className="text-sm text-center max-w-[200px]">
                          {prestador.justificativa ? (
                            <div className="text-xs text-slate-600 truncate" title={prestador.justificativa}>
                              {prestador.justificativa}
                            </div>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {dadosFiltrados.length === 0 && (
              <div className="text-center py-8 text-slate-500">
                <Search className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                <p>Nenhum prestador encontrado com os filtros aplicados.</p>
              </div>
            )}

            {/* Controles de Paginação */}
            <div className="mt-4 flex items-center justify-between">
              <div className="text-sm text-slate-600">
                <strong>Total:</strong> {totalPrestadores} prestadores
              </div>

              <div className="flex items-center gap-2">
                <Button
                  onClick={handlePaginaAnterior}
                  disabled={paginaAtual === 1}
                  variant="outline"
                  size="sm"
                  className="border-slate-300 text-slate-600 disabled:opacity-50"
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Anterior
                </Button>

                <span className="text-sm text-slate-600 px-3">
                  {paginaAtual} / {totalPaginas}
                </span>

                <Button
                  onClick={handleProximaPagina}
                  disabled={paginaAtual === totalPaginas}
                  variant="outline"
                  size="sm"
                  className="border-slate-300 text-slate-600 disabled:opacity-50"
                >
                  Próxima
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>

            <div className="mt-6 text-sm text-slate-600">
              <span>
                Mostrando <strong>{totalPrestadores}</strong> prestadores
              </span>
            </div>

            {/* Dialog de Avaliação */}
            <Dialog open={dialogAvaliacaoAberto} onOpenChange={setDialogAvaliacaoAberto}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    Avaliar Prestador: {prestadorAvaliando?.prestador.nome}
                    <div className="text-sm text-slate-600 font-normal mt-1">
                      Solicitação: {prestadorAvaliando?.solicitacao.numero}
                    </div>
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded">
                    <div className="text-sm">
                      <p>
                        <strong>Prestador:</strong> {prestadorAvaliando?.prestador.nome}
                      </p>
                      <p>
                        <strong>Doc1:</strong> {prestadorAvaliando?.prestador.doc1}
                      </p>
                      <p>
                        <strong>Empresa:</strong> {prestadorAvaliando?.solicitacao.empresa}
                      </p>
                      <p>
                        <strong>Local:</strong> {prestadorAvaliando?.solicitacao.local}
                      </p>
                    </div>
                  </div>

                  {prestadorAvaliando?.prestador.checagem === "revisar" && (
                    <div className="bg-fuchsia-50/50 border border-fuchsia-200 text-fuchsia-800 p-3 rounded-md text-sm mt-4">
                      <div className="flex gap-2">
                        <AlertTriangle className="h-5 w-5 text-fuchsia-600 shrink-0" />
                        <div>
                          <p className="font-semibold mb-1">Ação de Revisão Pendente</p>
                          <p>
                            {(() => {
                              const match = prestadorAvaliando.prestador.observacoes?.match(/\[CONFLITO RG: (.*?)\]/)
                              const rgConflito = match ? match[1] : "não identificado"

                              return (
                                <>
                                  Foi detectado duplicidade para <strong className="font-semibold">{prestadorAvaliando.prestador.nome}</strong> no cadastro do ID Control. Se você tiver certeza que é a mesma pessoa, ao <strong className="font-semibold">Aprovar</strong> o documento <strong className="font-semibold">{prestadorAvaliando.prestador.doc1}</strong> será automaticamente gravado no sistema como o <strong className="font-semibold">CPF</strong> (preenchendo a vaga), uma vez que o campo de RG já está ocupado com <strong className="font-semibold">{rgConflito}</strong>.
                                </>
                              )
                            })()}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div>
                    <Label htmlFor="status" className="text-base font-medium">
                      Decisão da Avaliação *
                    </Label>
                    <Select value={novoStatus} onValueChange={setNovoStatus}>
                      <SelectTrigger className="mt-2">
                        <SelectValue placeholder="Selecione a decisão" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="aprovado">✅ Aprovar</SelectItem>
                        <SelectItem value="reprovado">❌ Devolver</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="justificativa" className="text-base font-medium">
                      Justificativa {novoStatus === "reprovado" && "*"}
                    </Label>
                    <Textarea
                      id="justificativa"
                      value={justificativa}
                      onChange={(e) => setJustificativa(e.target.value)}
                      placeholder={
                        novoStatus === "reprovado"
                          ? "Justificativa obrigatória para devolução..."
                          : "Observações adicionais (opcional)..."
                      }
                      className="mt-2"
                      rows={4}
                    />
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button variant="outline" onClick={() => setDialogAvaliacaoAberto(false)} className="flex-1">
                      Cancelar
                    </Button>
                    <Button
                      onClick={handleSalvarAvaliacao}
                      className={`flex-1 ${novoStatus === "reprovado" ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"} text-white`}
                      disabled={!novoStatus}
                    >
                      {novoStatus === "aprovado" ? "Confirmar Aprovação" : novoStatus === "reprovado" ? "Confirmar Devolução" : "Salvar Avaliação"}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            {/* Modal de Download */}
            <Dialog open={modalDownloadAberto} onOpenChange={setModalDownloadAberto}>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Download Excel</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-3">
                    <Label className="text-base font-medium">Selecione as colunas:</Label>
                    <div className="space-y-2">
                      {Object.entries({
                        dataSolicitacao: "Data Solicitação",
                        dataInicial: "Data Inicial",
                        empresa: "Empresa",
                        prestador: "Prestador",
                        doc1: "Doc1",
                        doc2: "Doc2",
                        checagem: "Checagem",
                        validaAte: "Válida até",
                        justificativa: "Justificativa",
                      }).map(([key, label]) => (
                        <div key={key} className="flex items-center space-x-2">
                          <Checkbox
                            id={key}
                            checked={opcoesDownload[key as keyof typeof opcoesDownload]}
                            onCheckedChange={(checked) =>
                              setOpcoesDownload((prev) => ({ ...prev, [key]: checked as boolean }))
                            }
                          />
                          <Label htmlFor={key} className="text-sm">
                            {label}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-base font-medium">Range de datas:</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label htmlFor="dataInicio" className="text-xs">
                          De:
                        </Label>
                        <Input
                          id="dataInicio"
                          type="date"
                          value={rangeDataDownload.dataInicio}
                          onChange={(e) => setRangeDataDownload((prev) => ({ ...prev, dataInicio: e.target.value }))}
                          className="text-xs"
                        />
                      </div>
                      <div>
                        <Label htmlFor="dataFim" className="text-xs">
                          Até:
                        </Label>
                        <Input
                          id="dataFim"
                          type="date"
                          value={rangeDataDownload.dataFim}
                          onChange={(e) => setRangeDataDownload((prev) => ({ ...prev, dataFim: e.target.value }))}
                          className="text-xs"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button variant="outline" onClick={() => setModalDownloadAberto(false)} className="flex-1">
                      Cancelar
                    </Button>
                    <Button
                      onClick={() => {
                        // Aqui implementar a lógica de download
                        console.log("Download com opções:", opcoesDownload, rangeDataDownload)
                        setModalDownloadAberto(false)
                      }}
                      className="flex-1 bg-slate-600 hover:bg-slate-700"
                    >
                      Baixar Excel
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {/* Modal de Colunas */}
            <Dialog open={modalColunasAberto} onOpenChange={setModalColunasAberto}>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Colunas Visíveis</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    {Object.entries({
                      dataSolicitacao: "Data Solicitação",
                      dataInicial: "Data Inicial",
                      empresa: "Empresa",
                      prestador: "Prestador",
                      doc1: "Doc1",
                      doc2: "Doc2",
                      checagem: "Checagem",
                      validaAte: "Válida até",
                      justificativa: "Justificativa",
                    }).map(([key, label]) => (
                      <div key={key} className="flex items-center space-x-2">
                        <Checkbox
                          id={`col-${key}`}
                          checked={colunasVisiveis[key as keyof typeof colunasVisiveis]}
                          onCheckedChange={(checked) =>
                            setColunasVisiveis((prev) => ({ ...prev, [key]: checked as boolean }))
                          }
                        />
                        <Label htmlFor={`col-${key}`} className="text-sm">
                          {label}
                        </Label>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button variant="outline" onClick={() => setModalColunasAberto(false)} className="flex-1">
                      Fechar
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
