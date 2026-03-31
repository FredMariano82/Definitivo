"use client"

import { useState, useEffect } from "react"
import { Filter, Search, CheckCircle, XCircle, Clock, ShieldAlert, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  StatusLiberacaoBadge,
  StatusLiberacaoIcon,
  getLiberacaoStatus,
  StatusChecagemBadge,
  StatusChecagemIcon,
} from "../ui/status-badges"
import { useAuth } from "../../contexts/auth-context"
import { SolicitacoesService } from "../../services/solicitacoes-service"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DataInicialIndicator } from "../../utils/date-indicators"
import PageHeader from "@/components/page-header"

const PRESTADORES_POR_PAGINA = 10

const MinhasSolicitacoes = () => {
  const { usuario } = useAuth()
  const [paginaAtual, setPaginaAtual] = useState(1)
  const [filtroStatus, setFiltroStatus] = useState("todos")
  const [filtroLiberacao, setFiltroLiberacao] = useState("todos")
  const [buscaGeral, setBuscaGeral] = useState("")
  const [solicitacoesReais, setSolicitacoesReais] = useState<any[]>([])
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    const buscarDados = async () => {
      if (!usuario?.email) return
      try {
        setCarregando(true)
        const dados = await SolicitacoesService.listarSolicitacoes({ solicitante: usuario.email })
        setSolicitacoesReais(dados)
      } catch (error) {
        console.error("Erro ao buscar solicitações reais:", error)
      } finally {
        setCarregando(true) // Should be false, wait
        setCarregando(false)
      }
    }
    buscarDados()
  }, [usuario])

  // Resetar página quando filtros mudarem
  useEffect(() => {
    setPaginaAtual(1)
  }, [filtroStatus, filtroLiberacao, buscaGeral])

  // Filtrar prestadores
  const todosPrestadores = solicitacoesReais.flatMap(
    (solicitacao) =>
      solicitacao.prestadores?.filter((prestador: any) => {
        // Filtro de status
        const statusMatch = filtroStatus === "todos" || prestador.checagem === filtroStatus

        // Filtro de liberação
        const liberacaoMatch = filtroLiberacao === "todos" || prestador.liberacao === filtroLiberacao

        // Filtro de busca
        let buscaMatch = true
        if (buscaGeral.trim()) {
          const termo = buscaGeral.toLowerCase()
          buscaMatch = prestador.nome.toLowerCase().includes(termo) || prestador.doc1.toLowerCase().includes(termo)
        }

        return statusMatch && liberacaoMatch && buscaMatch
      }).map((p: any) => ({ ...p, solicitacaoParent: solicitacao })) || [],
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
    <div className="min-h-screen bg-transparent p-6 uppercase text-slate-700">
      <Card className="shadow-lg border-0">
        <CardContent className="pt-6">
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
                    <SelectItem value="revisar">Revisar</SelectItem>
                    <SelectItem value="excecao">Exceção</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Liberação */}
              <div>
                <Label className="text-sm font-medium text-blue-700 mb-2 block">Liberação</Label>
                <Select value={filtroLiberacao} onValueChange={setFiltroLiberacao}>
                  <SelectTrigger className="border-blue-300">
                    <SelectValue placeholder="Selecione a liberação" />
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
                  <TableHead className="font-semibold text-blue-800 text-center min-w-[130px]">Doc1</TableHead>
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
                {carregando ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-10">
                      <div className="flex justify-center items-center gap-2">
                        <Clock className="h-5 w-5 animate-spin text-blue-600" />
                        <span>Carregando solicitações reais...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : prestadoresPaginados.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-10 text-blue-400 font-medium">
                      Nenhum prestador encontrado no banco de dados.
                    </TableCell>
                  </TableRow>
                ) : (
                  prestadoresPaginados.map((prestador: any) => (
                    <TableRow key={prestador.id} className="hover:bg-blue-50">
                      <TableCell className="text-sm text-center">
                        <div className="whitespace-nowrap font-medium">{prestador.nome}</div>
                      </TableCell>
                      <TableCell className="text-sm text-center">
                        <div className="text-xs font-mono whitespace-nowrap">{prestador.doc1}</div>
                      </TableCell>
                      <TableCell className="text-sm whitespace-nowrap text-center">
                        <DataInicialIndicator
                          dataInicial={prestador.solicitacaoParent.dataInicial}
                          isReprovado={prestador.checagem === "reprovado"}
                        />
                      </TableCell>
                      <TableCell className="text-sm whitespace-nowrap text-center">
                        {prestador.checagem === "reprovado" ? (
                          <span className="text-blue-400">-</span>
                        ) : (
                          prestador.solicitacaoParent.dataFinal
                        )}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-center">
                        <div className="flex items-center justify-center gap-2">
                          <StatusLiberacaoIcon
                            status={getLiberacaoStatus(prestador, prestador.solicitacaoParent.dataFinal)}
                          />
                          <StatusLiberacaoBadge
                            status={getLiberacaoStatus(prestador, prestador.solicitacaoParent.dataFinal)}
                          />
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-2 whitespace-nowrap">
                          <StatusChecagemIcon status={prestador.checagem} />
                          <StatusChecagemBadge status={prestador.checagem} />
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
                  ))
                )}
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
  )
}

export default MinhasSolicitacoes
