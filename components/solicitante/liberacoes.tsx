"use client"

import { useState, useEffect } from "react"
import {
  Search,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Ban,
  Siren,
  Zap,
  RotateCcw,
  Trash2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useAuth } from "../../contexts/auth-context"
import { getSolicitacoesByDepartamento } from "../../services/solicitacoes-service"
import {
  StatusLiberacaoBadge,
  StatusLiberacaoIcon,
  getLiberacaoStatus,
} from "../ui/status-badges"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { converterDataBrParaDate, getCurrentDate } from "../../utils/date-helpers"

export default function Liberacoes() {
  const { usuario } = useAuth()
  const [buscaGeral, setBuscaGeral] = useState<string>("")
  const [solicitacoesReais, setSolicitacoesReais] = useState<any[]>([])
  const [carregando, setCarregando] = useState(true)
  const [modalRenovacao, setModalRenovacao] = useState(false)
  const [prestadorSelecionado, setPrestadorSelecionado] = useState<any>(null)
  const [dataInicialRenovacao, setDataInicialRenovacao] = useState("")
  const [dataFinalRenovacao, setDataFinalRenovacao] = useState("")
  const [paginaAtual, setPaginaAtual] = useState(1)
  const PRESTADORES_POR_PAGINA = 10

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
  }, [buscaGeral])

  if (carregando) {
    return (
      <div className="flex justify-center items-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600"></div>
      </div>
    )
  }

  // Filtrar e organizar dados por status de liberação
  const dadosPorStatus = solicitacoesReais
    .filter((solicitacao) => solicitacao.departamento === usuario?.departamento)
    .filter((solicitacao) =>
      solicitacao.prestadores.some((p: any) => getLiberacaoStatus(p, solicitacao.dataFinal) === "ok"),
    )
    .flatMap((solicitacao) =>
      solicitacao.prestadores
        .filter((prestador: any) => getLiberacaoStatus(prestador, solicitacao.dataFinal) === "ok")
        .map((prestador: any) => ({
          solicitacao,
          prestador,
          statusLiberacao: getLiberacaoStatus(prestador, solicitacao.dataFinal),
        })),
    )
    .filter((item) => {
      if (!buscaGeral) return true
      const busca = buscaGeral.toLowerCase()
      return (
        item.prestador.nome.toLowerCase().includes(busca) ||
        item.prestador.doc1.toLowerCase().includes(busca) ||
        item.solicitacao.numero.toLowerCase().includes(busca)
      )
    })

  // Calcular paginação
  const totalPrestadores = dadosPorStatus.length
  const totalPaginas = Math.ceil(totalPrestadores / PRESTADORES_POR_PAGINA)
  const indiceInicio = (paginaAtual - 1) * PRESTADORES_POR_PAGINA
  const indiceFim = indiceInicio + PRESTADORES_POR_PAGINA
  const dadosPaginados = dadosPorStatus.slice(indiceInicio, indiceFim)

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

  const statusCounts = {
    pendente: dadosPorStatus.filter((item) => item.statusLiberacao === "pendente").length,
    ok: dadosPorStatus.filter((item) => item.statusLiberacao === "ok").length,
    urgente: dadosPorStatus.filter((item) => item.statusLiberacao === "urgente").length,
    vencida: dadosPorStatus.filter((item) => item.statusLiberacao === "vencida").length,
    negada: dadosPorStatus.filter((item) => item.statusLiberacao === "negada").length,
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "ok":
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case "negada":
        return <Ban className="h-4 w-4 text-red-600" />
      case "urgente":
        return <AlertTriangle className="h-4 w-4 text-orange-600" />
      case "vencida":
        return <XCircle className="h-4 w-4 text-red-600" />
      default:
        return <Clock className="h-4 w-4 text-yellow-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ok":
        return "text-green-600 bg-green-50"
      case "negada":
        return "text-red-600 bg-red-50"
      case "urgente":
        return "text-orange-600 bg-orange-50"
      case "vencida":
        return "text-red-600 bg-red-50"
      default:
        return "text-yellow-600 bg-yellow-50"
    }
  }

  const getDataAlert = (dataFinal: string) => {
    if (!dataFinal) return null

    const hoje = getCurrentDate()
    hoje.setHours(0, 0, 0, 0)

    const dataFinalDate = converterDataBrParaDate(dataFinal)
    if (!dataFinalDate) return null

    dataFinalDate.setHours(0, 0, 0, 0)

    const diffTime = dataFinalDate.getTime() - hoje.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 0) {
      return { tipo: "urgente", icon: <Siren className="h-4 w-4 text-red-600" />, color: "text-red-600 font-bold" }
    } else if (diffDays === 1) {
      return { tipo: "atencao", icon: <Zap className="h-4 w-4 text-orange-600" />, color: "text-orange-600 font-bold" }
    }
    return null
  }

  const isAcoesHabilitadas = (dataFinal: string) => {
    if (!dataFinal) return false

    const hoje = getCurrentDate()
    hoje.setHours(0, 0, 0, 0)

    const dataFinalDate = converterDataBrParaDate(dataFinal)
    if (!dataFinalDate) return false

    dataFinalDate.setHours(0, 0, 0, 0)

    const diffTime = dataFinalDate.getTime() - hoje.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    return diffDays <= 5
  }

  const handleRenovar = (prestador: any, solicitacao: any) => {
    setPrestadorSelecionado({ prestador, solicitacao })
    setDataInicialRenovacao("")
    setDataFinalRenovacao("")
    setModalRenovacao(true)
  }

  const handleExcluir = (prestador: any, solicitacao: any) => {
    if (confirm(`Tem certeza que deseja excluir ${prestador.nome}?`)) {
      // Lógica de exclusão será implementada
      console.log("Excluir prestador:", prestador.nome)
    }
  }

  const confirmarRenovacao = () => {
    // Lógica de renovação será implementada
    console.log("Renovar prestador:", prestadorSelecionado?.prestador.nome)
    console.log("Data inicial:", dataInicialRenovacao)
    console.log("Data final:", dataFinalRenovacao)
    setModalRenovacao(false)
  }

  return (
    <div className="min-h-screen bg-transparent p-6">
      <Card className="glass shadow-2xl border-white/20 overflow-hidden rounded-3xl">
        <CardHeader className="pb-8 pt-10 premium-gradient relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-400/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-cyan-400/10 rounded-full blur-3xl -ml-24 -mb-24"></div>

          <CardTitle className="text-3xl font-black text-white text-center tracking-tight relative z-10 flex items-center justify-center gap-3">
            <CheckCircle className="h-8 w-8 text-emerald-400" />
            Status das Liberações - {usuario?.departamento}
          </CardTitle>
          <div className="w-20 h-1.5 bg-gradient-to-r from-emerald-400 to-blue-400 mx-auto rounded-full mt-4 relative z-10 shadow-lg shadow-emerald-500/20"></div>
        </CardHeader>

        <CardContent className="pt-8">
          {/* Resumo por Status */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
            {[
              { label: "Pendentes", count: statusCounts.pendente, icon: Clock, color: "yellow" },
              { label: "Liberados", count: statusCounts.ok, icon: CheckCircle, color: "emerald" },
              { label: "Urgentes", count: statusCounts.urgente, icon: AlertTriangle, color: "orange" },
              { label: "Vencidas", count: statusCounts.vencida, icon: XCircle, color: "red" },
              { label: "Negadas", count: statusCounts.negada, icon: Ban, color: "slate" }
            ].map((stat) => (
              <div key={stat.label} className="group transition-soft hover:translate-y-[-4px]">
                <Card className={`border-0 bg-${stat.color === 'emerald' ? 'emerald' : stat.color}-500/5 hover:bg-${stat.color === 'emerald' ? 'emerald' : stat.color}-500/10 rounded-2xl transition-soft`}>
                  <CardContent className="p-4 text-center">
                    <stat.icon className={`h-7 w-7 text-${stat.color === 'emerald' ? 'emerald' : stat.color}-600 mx-auto mb-2`} />
                    <div className={`text-2xl font-black text-${stat.color === 'emerald' ? 'emerald' : stat.color}-700`}>{stat.count}</div>
                    <div className={`text-[10px] font-bold uppercase tracking-wider text-${stat.color === 'emerald' ? 'emerald' : stat.color}-600/70`}>{stat.label}</div>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>

          <div className="bg-slate-500/5 border border-slate-200 rounded-2xl p-4 mb-8 flex items-center gap-4">
            <div className="bg-emerald-500/20 p-2 rounded-lg">
              <CheckCircle className="h-5 w-5 text-emerald-600" />
            </div>
            <p className="text-slate-600 font-medium">
              Acompanhe o status das liberações realizadas pelos administradores. Total de prestadores:{" "}
              <span className="text-emerald-600 font-bold">{dadosPorStatus.length}</span>
            </p>
          </div>

          {/* Busca */}
          <div className="mb-8 p-6 bg-white rounded-2xl border border-slate-200 shadow-sm transition-soft hover:shadow-md">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-slate-100 p-2 rounded-lg">
                <Search className="h-5 w-5 text-slate-600" />
              </div>
              <Label className="text-lg font-bold text-slate-800">Buscar Prestador</Label>
            </div>
            <div className="relative">
              <Input
                type="text"
                placeholder="Nome, documento ou número da solicitação..."
                value={buscaGeral}
                onChange={(e) => setBuscaGeral(e.target.value)}
                className="h-12 border-slate-200 focus:border-emerald-500 focus:ring-emerald-500 rounded-xl pr-12 text-slate-700 bg-slate-50/50"
              />
              <div className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-emerald-600 p-1.5 rounded-lg text-white shadow-lg">
                <Search className="h-4 w-4" />
              </div>
            </div>
          </div>

          {/* Informações de Paginação */}
          <div className="mb-4 flex items-center justify-between text-xs font-bold uppercase tracking-widest text-slate-400">
            <div>
              Mostrando <span className="text-slate-700">{indiceInicio + 1}</span> - <span className="text-slate-700">{Math.min(indiceFim, totalPrestadores)}</span> de <span className="text-slate-700">{totalPrestadores}</span>
            </div>
            <div>
              Página <span className="text-slate-700">{paginaAtual}</span> de <span className="text-slate-700">{totalPaginas}</span>
            </div>
          </div>

          {/* Tabela */}
          <div className="rounded-2xl border border-slate-200 overflow-hidden shadow-sm bg-white">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50 hover:bg-slate-50 border-b border-slate-200">
                  <TableHead className="py-5 font-bold text-slate-800 text-center uppercase tracking-tighter text-xs">Solicitação</TableHead>
                  <TableHead className="py-5 font-bold text-slate-800 text-center uppercase tracking-tighter text-xs">Prestador</TableHead>
                  <TableHead className="py-5 font-bold text-slate-800 text-center uppercase tracking-tighter text-xs">Doc1</TableHead>
                  <TableHead className="py-5 font-bold text-slate-800 text-center uppercase tracking-tighter text-xs">Status Liberação</TableHead>
                  <TableHead className="py-5 font-bold text-slate-800 text-center uppercase tracking-tighter text-xs">Data Final</TableHead>
                  <TableHead className="py-5 font-bold text-slate-800 text-center uppercase tracking-tighter text-xs">Observações</TableHead>
                  <TableHead className="py-5 font-bold text-slate-800 text-center uppercase tracking-tighter text-xs">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dadosPaginados.map(({ solicitacao, prestador, statusLiberacao }, index) => (
                  <TableRow key={`${solicitacao.id}-${prestador.id}`} className="hover:bg-emerald-50/30 transition-soft border-b border-slate-100 last:border-0">
                    <TableCell className="font-medium text-sm text-center">{solicitacao.numero}</TableCell>
                    <TableCell className="text-sm text-center">{prestador.nome}</TableCell>
                    <TableCell className="text-sm text-center">
                      <div className="text-xs font-mono">{prestador.doc1}</div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-2">
                        <StatusLiberacaoIcon status={statusLiberacao} />
                        <StatusLiberacaoBadge status={statusLiberacao} />
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-center">
                      <div className="flex items-center justify-center gap-2">
                        {getDataAlert(solicitacao.dataFinal)?.icon}
                        <span className={getDataAlert(solicitacao.dataFinal)?.color || "text-gray-900"}>
                          {solicitacao.dataFinal}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-center max-w-[200px]">
                      {prestador.observacoes ? (
                        <div className="text-xs text-red-600 bg-red-50 p-2 rounded border border-red-200 whitespace-pre-wrap break-words">
                          {prestador.observacoes}
                        </div>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={!isAcoesHabilitadas(solicitacao.dataFinal)}
                          onClick={() => handleRenovar(prestador, solicitacao)}
                          className={`${!isAcoesHabilitadas(solicitacao.dataFinal) ? "text-gray-400 border-gray-300" : "text-blue-600 border-blue-300 hover:bg-blue-50"}`}
                        >
                          <RotateCcw className="h-3 w-3 mr-1" />
                          Renovar
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={!isAcoesHabilitadas(solicitacao.dataFinal)}
                          onClick={() => handleExcluir(prestador, solicitacao)}
                          className={`${!isAcoesHabilitadas(solicitacao.dataFinal) ? "text-gray-400 border-gray-300" : "text-red-600 border-red-300 hover:bg-red-50"}`}
                        >
                          <Trash2 className="h-3 w-3 mr-1" />
                          Excluir
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {dadosPaginados.length === 0 && (
            <div className="text-center py-20 text-slate-400">
              <Search className="h-16 w-16 mx-auto mb-4 opacity-20" />
              <p className="text-lg font-medium">Nenhuma liberação encontrada.</p>
              <p className="text-sm">Tente ajustar seus termos de busca.</p>
            </div>
          )}

          <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-sm font-bold text-slate-400 uppercase tracking-widest">
              Total: <span className="text-emerald-600">{totalPrestadores}</span> prestadores
            </div>

            <div className="flex items-center gap-3">
              <Button
                onClick={handlePaginaAnterior}
                disabled={paginaAtual === 1}
                variant="outline"
                size="sm"
                className="h-10 rounded-xl border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-30 transition-soft"
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Anterior
              </Button>

              <div className="bg-slate-100 px-4 py-2 rounded-xl text-sm font-bold text-slate-600 min-w-[80px] text-center">
                {paginaAtual} / {totalPaginas}
              </div>

              <Button
                onClick={handleProximaPagina}
                disabled={paginaAtual === totalPaginas}
                variant="outline"
                size="sm"
                className="h-10 rounded-xl border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-30 transition-soft"
              >
                Próxima
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      {/* Modal de Renovação */}
      <Dialog open={modalRenovacao} onOpenChange={setModalRenovacao}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-red-800">
              Renovar Liberação - {prestadorSelecionado?.prestador.nome}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div>
              <Label htmlFor="dataInicial" className="text-sm font-medium">
                Data Inicial
              </Label>
              <Input
                id="dataInicial"
                type="date"
                value={dataInicialRenovacao}
                onChange={(e) => setDataInicialRenovacao(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="dataFinal" className="text-sm font-medium">
                Data Final
              </Label>
              <Input
                id="dataFinal"
                type="date"
                value={dataFinalRenovacao}
                onChange={(e) => setDataFinalRenovacao(e.target.value)}
                max={prestadorSelecionado?.prestador.checagemValidaAte}
                className="mt-1"
              />
              {prestadorSelecionado?.prestador.checagemValidaAte && (
                <p className="text-xs text-gray-500 mt-1">Limite: {prestadorSelecionado.prestador.checagemValidaAte}</p>
              )}
            </div>
            <div className="flex gap-2 pt-4">
              <Button
                onClick={confirmarRenovacao}
                disabled={!dataInicialRenovacao || !dataFinalRenovacao}
                className="flex-1 bg-red-600 hover:bg-red-700"
              >
                Confirmar Renovação
              </Button>
              <Button variant="outline" onClick={() => setModalRenovacao(false)} className="flex-1">
                Cancelar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div >
  )
}
