"use client"

import { useState, useEffect } from "react"
import { Search, CheckCircle, XCircle, Clock, AlertTriangle, ChevronLeft, ChevronRight } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useAuth } from "../../contexts/auth-context"
import { getSolicitacoesByDepartamento } from "../../services/solicitacoes-service"
import { formatarDataParaBR } from "../../utils/date-helpers"
import { getChecagemStatus, getCadastroStatus } from "../ui/status-badges"
import { Button } from "@/components/ui/button"

export default function Checagens() {
  const { usuario } = useAuth()
  const [buscaGeral, setBuscaGeral] = useState<string>("")
  const [solicitacoesReais, setSolicitacoesReais] = useState<any[]>([])
  const [carregando, setCarregando] = useState(true)
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

  // Filtrar e organizar dados por status de checagem
  const dadosPorStatus = solicitacoesReais
    .filter((solicitacao) => solicitacao.departamento === usuario?.departamento)
    .filter((solicitacao) =>
      solicitacao.prestadores.some((p: any) => getCadastroStatus(p, solicitacao.dataFinal) === "ok"),
    )
    .flatMap((solicitacao) =>
      solicitacao.prestadores
        .filter((prestador: any) => getCadastroStatus(prestador, solicitacao.dataFinal) === "ok")
        .map((prestador: any) => ({
          solicitacao,
          prestador,
          statusChecagem: getChecagemStatus(prestador),
        })),
    )
    .filter((item) => {
      if (!buscaGeral) return true
      const busca = buscaGeral.toLowerCase()
      return (
        item.prestador.nome.toLowerCase().includes(busca) ||
        item.prestador.documento.toLowerCase().includes(busca) ||
        item.solicitacao.numero.toLowerCase().includes(busca)
      )
    })

  const statusCounts = {
    pendente: dadosPorStatus.filter((item) => item.statusChecagem === "pendente").length,
    aprovado: dadosPorStatus.filter((item) => item.statusChecagem === "aprovado").length,
    reprovado: dadosPorStatus.filter((item) => item.statusChecagem === "reprovado").length,
    vencida: dadosPorStatus.filter((item) => item.statusChecagem === "vencida").length,
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "aprovado":
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case "reprovado":
        return <XCircle className="h-4 w-4 text-red-600" />
      case "vencida":
        return <AlertTriangle className="h-4 w-4 text-red-600" />
      default:
        return <Clock className="h-4 w-4 text-yellow-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "aprovado":
        return "text-green-600 bg-green-50"
      case "reprovado":
        return "text-red-600 bg-red-50"
      case "vencida":
        return "text-red-600 bg-red-50"
      default:
        return "text-yellow-600 bg-yellow-50"
    }
  }

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="max-w-7xl mx-auto">
        <Card className="glass shadow-2xl border-white/20 overflow-hidden rounded-3xl">
          <CardHeader className="pb-8 pt-10 premium-gradient relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-400/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-cyan-400/10 rounded-full blur-3xl -ml-24 -mb-24"></div>

            <CardTitle className="text-3xl font-black text-white text-center tracking-tight relative z-10 flex items-center justify-center gap-3">
              <CheckCircle className="h-8 w-8 text-blue-400" />
              Status das Checagens - {usuario?.departamento}
            </CardTitle>
            <div className="w-20 h-1.5 bg-gradient-to-r from-blue-400 to-cyan-400 mx-auto rounded-full mt-4 relative z-10 shadow-lg shadow-blue-500/20"></div>
          </CardHeader>

          <CardContent className="pt-8">
            {/* Resumo por Status */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
              {[
                { label: "Pendentes", count: statusCounts.pendente, icon: Clock, color: "yellow" },
                { label: "Aprovados", count: statusCounts.aprovado, icon: CheckCircle, color: "green" },
                { label: "Reprovados", count: statusCounts.reprovado, icon: XCircle, color: "red" },
                { label: "Vencidas", count: statusCounts.vencida, icon: AlertTriangle, color: "rose" }
              ].map((stat) => (
                <div key={stat.label} className="group transition-soft hover:translate-y-[-4px]">
                  <Card className={`border-0 bg-${stat.color}-500/5 hover:bg-${stat.color}-500/10 rounded-2xl transition-soft`}>
                    <CardContent className="p-6 text-center">
                      <stat.icon className={`h-7 w-7 text-${stat.color}-600 mx-auto mb-2`} />
                      <div className={`text-2xl font-black text-${stat.color}-700`}>{stat.count}</div>
                      <div className={`text-[10px] font-bold uppercase tracking-wider text-${stat.color}-600/70`}>{stat.label}</div>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>

            <div className="bg-slate-500/5 border border-slate-200 rounded-2xl p-4 mb-8 flex items-center gap-4">
              <div className="bg-blue-500/20 p-2 rounded-lg">
                <CheckCircle className="h-5 w-5 text-blue-600" />
              </div>
              <p className="text-slate-600 font-medium">
                Acompanhe o status das checagens realizadas pelos aprovadores. Total de prestadores:{" "}
                <span className="text-blue-600 font-bold">{dadosPorStatus.length}</span>
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
                  className="h-12 border-slate-200 focus:border-blue-500 focus:ring-blue-500 rounded-xl pr-12 text-slate-700 bg-slate-50/50"
                />
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-blue-600 p-1.5 rounded-lg text-white shadow-lg">
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
                    <TableHead className="py-5 font-bold text-slate-800 text-center uppercase tracking-tighter text-xs">Documento</TableHead>
                    <TableHead className="py-5 font-bold text-slate-800 text-center uppercase tracking-tighter text-xs">Status Checagem</TableHead>
                    <TableHead className="py-5 font-bold text-slate-800 text-center uppercase tracking-tighter text-xs">Válida até</TableHead>
                    <TableHead className="py-5 font-bold text-slate-800 text-center uppercase tracking-tighter text-xs">Observações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dadosPaginados.map(({ solicitacao, prestador, statusChecagem }, index) => (
                    <TableRow key={`${solicitacao.id}-${prestador.id}`} className="hover:bg-blue-50/30 transition-soft border-b border-slate-100 last:border-0">
                      <TableCell className="font-medium text-sm text-center">{solicitacao.numero}</TableCell>
                      <TableCell className="text-sm text-center">{prestador.nome}</TableCell>
                      <TableCell className="text-sm text-center">
                        <div className="text-xs font-mono">{prestador.documento}</div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div
                          className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(statusChecagem)}`}
                        >
                          {getStatusIcon(statusChecagem)}
                          {statusChecagem.charAt(0).toUpperCase() + statusChecagem.slice(1)}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-center">
                        {prestador.checagemValidaAte ? (
                          formatarDataParaBR(prestador.checagemValidaAte)
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-center max-w-[200px]">
                        {prestador.observacoes ? (
                          <div className="text-xs text-slate-600 bg-slate-50 p-2 rounded border whitespace-pre-wrap break-words">
                            {prestador.observacoes}
                          </div>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {dadosPaginados.length === 0 && (
              <div className="text-center py-20 text-slate-400">
                <Search className="h-16 w-16 mx-auto mb-4 opacity-20" />
                <p className="text-lg font-medium">Nenhuma checagem encontrada.</p>
                <p className="text-sm">Tente ajustar seus termos de busca.</p>
              </div>
            )}

            <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="text-sm font-bold text-slate-400 uppercase tracking-widest">
                Total: <span className="text-blue-600">{totalPrestadores}</span> prestadores
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
      </div>
    </div>
  )
}
