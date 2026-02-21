"use client"

import { useState, useEffect } from "react"
import { Filter, Search, CheckCircle, XCircle, Clock, ShieldAlert, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { StatusCadastroBadge, StatusCadastroIcon, getCadastroStatus } from "../ui/status-badges"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DataInicialIndicator } from "../../utils/date-indicators"

const PRESTADORES_POR_PAGINA = 10

const MinhasSolicitacoes = () => {
  const [paginaAtual, setPaginaAtual] = useState(1)
  const [filtroStatus, setFiltroStatus] = useState("todos")
  const [filtroCadastro, setFiltroCadastro] = useState("todos")
  const [buscaGeral, setBuscaGeral] = useState("")

  // Resetar página quando filtros mudarem
  useEffect(() => {
    setPaginaAtual(1)
  }, [filtroStatus, filtroCadastro, buscaGeral])

  // Dados mock expandidos para demonstração da paginação
  const solicitacoesMock = [
    {
      id: "1",
      numero: "2025-001",
      dataSolicitacao: "15/01/2025",
      dataInicial: "20/01/2025",
      dataFinal: "25/01/2025",
      departamento: "TI",
      local: "Sede Principal",
      prestadores: Array.from({ length: 150 }, (_, i) => ({
        id: `p${i + 1}`,
        nome: `Prestador ${i + 1}`,
        documento: `${String(i + 1).padStart(3, "0")}.456.789-00`,
        status: (i % 3 === 0 ? "aprovado" : i % 3 === 1 ? "pendente" : "reprovado") as const,
        cadastro: (i % 4 === 0 ? "ok" : i % 4 === 1 ? "pendente" : i % 4 === 2 ? "urgente" : "pendente") as const,
        checagemValidaAte: i % 2 === 0 ? "25/01/2026" : undefined,
        justificativa: i % 5 === 0 ? `Justificativa para prestador ${i + 1}` : undefined,
      })),
    },
  ]

  // Filtrar prestadores
  const todosPrestadores = solicitacoesMock.flatMap(
    (solicitacao) =>
      solicitacao.prestadores?.filter((prestador) => {
        // Filtro de status
        const statusMatch = filtroStatus === "todos" || prestador.status === filtroStatus

        // Filtro de cadastro
        const cadastroMatch = filtroCadastro === "todos" || prestador.cadastro === filtroCadastro

        // Filtro de busca
        let buscaMatch = true
        if (buscaGeral.trim()) {
          const termo = buscaGeral.toLowerCase()
          buscaMatch = prestador.nome.toLowerCase().includes(termo) || prestador.documento.toLowerCase().includes(termo)
        }

        return statusMatch && cadastroMatch && buscaMatch
      }) || [],
  )

  // Calcular paginação
  const totalPrestadores = todosPrestadores.length
  const totalPaginas = Math.ceil(totalPrestadores / PRESTADORES_POR_PAGINA)
  const indiceInicio = (paginaAtual - 1) * PRESTADORES_POR_PAGINA
  const indiceFim = indiceInicio + PRESTADORES_POR_PAGINA
  const prestadoresPaginados = todosPrestadores.slice(indiceInicio, indiceFim)

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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 p-4">
      <div className="max-w-7xl mx-auto">
        <Card className="shadow-lg border-0">
          <CardHeader className="pb-6">
            <CardTitle className="text-2xl font-bold text-blue-800 text-center">📋 Minhas Solicitações</CardTitle>
            <div className="w-24 h-1 bg-blue-600 mx-auto rounded-full"></div>
          </CardHeader>

          <CardContent>
            {/* Filtros */}
            <div className="mb-6 p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-2 mb-4">
                <Filter className="h-5 w-5 text-blue-600" />
                <Label className="text-lg font-medium text-blue-700">Filtros</Label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Status Checagem */}
                <div>
                  <Label className="text-sm font-medium text-blue-700 mb-2 block">Status Checagem</Label>
                  <Select value={filtroStatus} onValueChange={setFiltroStatus}>
                    <SelectTrigger className="border-blue-300">
                      <SelectValue placeholder="Selecione o status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos</SelectItem>
                      <SelectItem value="pendente">Pendente</SelectItem>
                      <SelectItem value="aprovado">Aprovado</SelectItem>
                      <SelectItem value="reprovado">Reprovado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Status Liberação */}
                <div>
                  <Label className="text-sm font-medium text-blue-700 mb-2 block">Status Liberação</Label>
                  <Select value={filtroCadastro} onValueChange={setFiltroCadastro}>
                    <SelectTrigger className="border-blue-300">
                      <SelectValue placeholder="Selecione o cadastro" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos</SelectItem>
                      <SelectItem value="pendente">Pendente</SelectItem>
                      <SelectItem value="ok">Ok</SelectItem>
                      <SelectItem value="urgente">Urgente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Busca Geral */}
                <div>
                  <Label className="text-sm font-medium text-blue-700 mb-2 block">Busca Geral</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-blue-400" />
                    <Input
                      type="text"
                      placeholder="Nome ou documento..."
                      value={buscaGeral}
                      onChange={(e) => setBuscaGeral(e.target.value)}
                      className="pl-10 border-blue-300 focus:border-blue-600 focus:ring-blue-600"
                    />
                  </div>
                  {buscaGeral && <p className="text-xs text-blue-500 mt-1">{totalPrestadores} resultado(s)</p>}
                </div>
              </div>
            </div>

            {/* Informações de Paginação */}
            <div className="mb-4 flex items-center justify-between text-sm text-blue-600">
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
            <div className="rounded-lg border border-blue-200 overflow-x-auto">
              <Table className="min-w-full">
                <TableHeader>
                  <TableRow className="bg-blue-50">
                    <TableHead className="font-semibold text-blue-800 text-center min-w-[160px]">Prestador</TableHead>
                    <TableHead className="font-semibold text-blue-800 text-center min-w-[130px]">Documento</TableHead>
                    <TableHead className="font-semibold text-blue-800 text-center min-w-[100px] whitespace-nowrap">
                      Data Inicial
                    </TableHead>
                    <TableHead className="font-semibold text-blue-800 text-center min-w-[100px] whitespace-nowrap">
                      Data Final
                    </TableHead>
                    <TableHead className="font-semibold text-blue-800 text-center min-w-[90px]">Liberação</TableHead>
                    <TableHead className="font-semibold text-blue-800 text-center min-w-[100px]">Checagem</TableHead>
                    <TableHead className="font-semibold text-blue-800 text-center min-w-[130px] whitespace-nowrap">
                      Válida até
                    </TableHead>
                    <TableHead className="font-semibold text-blue-800 text-center min-w-[200px]">
                      Justificativa
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {prestadoresPaginados.map((prestador, index) => (
                    <TableRow key={prestador.id} className="hover:bg-blue-50">
                      <TableCell className="text-sm text-center">
                        <div className="whitespace-nowrap font-medium">{prestador.nome}</div>
                      </TableCell>
                      <TableCell className="text-sm text-center">
                        <div className="text-xs font-mono whitespace-nowrap">{prestador.documento}</div>
                      </TableCell>
                      <TableCell className="text-sm whitespace-nowrap text-center">
                        <DataInicialIndicator
                          dataInicial={solicitacoesMock[0].dataInicial}
                          isReprovado={prestador.status === "reprovado"}
                        />
                      </TableCell>
                      <TableCell className="text-sm whitespace-nowrap text-center">
                        {prestador.status === "reprovado" ? (
                          <span className="text-blue-400">-</span>
                        ) : (
                          solicitacoesMock[0].dataFinal
                        )}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-center">
                        <div className="flex items-center justify-center gap-2">
                          <StatusCadastroIcon status={getCadastroStatus(prestador, solicitacoesMock[0].dataFinal)} />
                          <StatusCadastroBadge status={getCadastroStatus(prestador, solicitacoesMock[0].dataFinal)} />
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-2 whitespace-nowrap">
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
                      <TableCell className="text-sm whitespace-nowrap text-center">
                        {prestador.checagemValidaAte ? (
                          <span>{prestador.checagemValidaAte}</span>
                        ) : (
                          <span className="text-blue-400">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-center">
                        {prestador.justificativa ? (
                          <div className="max-w-xs truncate" title={prestador.justificativa}>
                            {prestador.justificativa}
                          </div>
                        ) : null}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Controles de Paginação */}
            <div className="mt-4 flex items-center justify-between">
              <div className="text-sm text-blue-600">
                <strong>Total:</strong> {totalPrestadores} prestadores
              </div>

              <div className="flex items-center gap-2">
                <Button
                  onClick={handlePaginaAnterior}
                  disabled={paginaAtual === 1}
                  variant="outline"
                  size="sm"
                  className="border-blue-300 text-blue-600 disabled:opacity-50"
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Anterior
                </Button>

                <span className="text-sm text-blue-600 px-3">
                  {paginaAtual} / {totalPaginas}
                </span>

                <Button
                  onClick={handleProximaPagina}
                  disabled={paginaAtual === totalPaginas}
                  variant="outline"
                  size="sm"
                  className="border-blue-300 text-blue-600 disabled:opacity-50"
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

export default MinhasSolicitacoes
