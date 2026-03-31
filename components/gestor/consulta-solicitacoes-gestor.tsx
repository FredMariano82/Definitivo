"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Eye, AlertTriangle, Filter, ArrowUpDown, ChevronLeft, ChevronRight, CheckSquare, Calendar } from "lucide-react"
import type { Solicitacao, PrestadorAvaliacao } from "../../types"
import { getAllSolicitacoes } from "../../services/solicitacoes-service"
import { supabase } from "@/lib/supabase"
import { EconomiasService, type EconomiaMetricas } from "../../services/economias-service"
import { DataInicialIndicator } from "../../utils/date-indicators"
import { StatusChecagemBadge, StatusChecagemIcon } from "../ui/status-badges"

export default function ConsultaSolicitacoesGestor() {
  const [paginaAtual, setPaginaAtual] = useState(1)
  const [prestadoresReprovados, setPrestadoresReprovados] = useState<
    Array<{
      solicitacao: Solicitacao
      prestador: PrestadorAvaliacao
    }>
  >([])
  const [prestadoresFiltrados, setPrestadoresFiltrados] = useState<
    Array<{
      solicitacao: Solicitacao
      prestador: PrestadorAvaliacao
    }>
  >([])
  const [dialogAberto, setDialogAberto] = useState(false)
  const [prestadorSelecionado, setPrestadorSelecionado] = useState<{
    solicitacao: Solicitacao
    prestador: PrestadorAvaliacao
  } | null>(null)
  const [novaJustificativa, setNovaJustificativa] = useState("")
  const [mostrandoConfirmacao, setMostrandoConfirmacao] = useState(false)
  const [filtroStatus, setFiltroStatus] = useState<string>("todos")
  const [ordenacaoData, setOrdenacaoData] = useState<string>("desc") // desc = mais recente primeiro
  const [dataValidadeExcecao, setDataValidadeExcecao] = useState<string>(() => {
    const data = new Date()
    data.setMonth(data.getMonth() + 6)
    return data.toISOString().split("T")[0]
  })
  const [metricasEconomia, setMetricasEconomia] = useState<EconomiaMetricas>({
    totalEconomizado: 0,
    totalCasos: 0,
    economiaMaxima: 0,
    economiaOperacional: 0,
    desperdicioEvitado: 0,
    porSolicitante: [],
  })
  const [carregandoEconomia, setCarregandoEconomia] = useState(false)
  const PRESTADORES_POR_PAGINA = 10

  console.log("🎯 ConsultaSolicitacoesGestor renderizado")

  useEffect(() => {
    const buscarPrestadoresReprovados = async () => {
      try {
        console.log("🔍 Buscando prestadores reprovados...")
        setCarregandoEconomia(true)

        // BUSCAR DADOS REAIS DO SUPABASE
        const solicitacoesReais = await getAllSolicitacoes()
        console.log("📊 Dados brutos do Supabase:", solicitacoesReais)

        // Buscar métricas de economia
        const economia = await EconomiasService.buscarMetricasEconomia()
        setMetricasEconomia(economia)

        const reprovados: Array<{
          solicitacao: Solicitacao
          prestador: PrestadorAvaliacao
        }> = []

        solicitacoesReais.forEach((solicitacao) => {
          solicitacao.prestadores.forEach((prestador) => {
            // BUSCAR POR TODOS OS STATUS POSSÍVEIS DE REPROVAÇÃO E EXCEÇÃO
            if (
              prestador.checagem === "reprovado" ||
              prestador.checagem === "reprovada" ||
              prestador.checagem === "excecao"
            ) {
              reprovados.push({ solicitacao, prestador })
              console.log("❌ Prestador reprovado/exceção encontrado:", prestador.nome, "Status:", prestador.checagem)
            }
          })
        })

        console.log(`✅ Total de prestadores reprovados: ${reprovados.length}`)
        setPrestadoresReprovados(reprovados)
      } catch (error) {
        console.error("❌ Erro ao buscar prestadores reprovados:", error)
        setPrestadoresReprovados([])
      } finally {
        setCarregandoEconomia(false)
      }
    }

    buscarPrestadoresReprovados()
  }, [])

  // APLICAR FILTROS E ORDENAÇÃO
  useEffect(() => {
    let dadosFiltrados = [...prestadoresReprovados]

    // FILTRO POR STATUS
    if (filtroStatus !== "todos") {
      dadosFiltrados = dadosFiltrados.filter((item) => {
        if (filtroStatus === "reprovado") {
          return item.prestador.checagem === "reprovado" || item.prestador.checagem === "reprovada"
        }
        if (filtroStatus === "excecao") {
          return item.prestador.checagem === "excecao"
        }
        if (filtroStatus === "pendente_gestor") {
          return item.solicitacao.statusGeral === "pendente_gestor"
        }
        return true
      })
    }

    // PRIORIZAÇÃO: 
    // 1. Pendentes Gestor (Renovações urgentes)
    // 2. Reprovados (Casos novos)
    // 3. Exceções já vigentes
    dadosFiltrados.sort((a, b) => {
      const isPendA = a.solicitacao.statusGeral === "pendente_gestor" ? 1 : 0
      const isPendB = b.solicitacao.statusGeral === "pendente_gestor" ? 1 : 0
      
      if (isPendA !== isPendB) return isPendB - isPendA

      const statusA = a.prestador.checagem
      const statusB = b.prestador.checagem

      // Se A é reprovado e B é exceção, A vem primeiro
      if ((statusA === "reprovado" || statusA === "reprovada") && statusB === "excecao") {
        return -1
      }
      // Se A é exceção e B é reprovado, B vem primeiro
      if (statusA === "excecao" && (statusB === "reprovado" || statusB === "reprovada")) {
        return 1
      }
      return 0
    })

    console.log("🔍 Dados filtrados:", dadosFiltrados.length)
    setPrestadoresFiltrados(dadosFiltrados)
  }, [prestadoresReprovados, filtroStatus, ordenacaoData])

  // Resetar página quando filtros mudarem
  useEffect(() => {
    setPaginaAtual(1)
  }, [filtroStatus, ordenacaoData])

  // CORRIGIR FORMATAÇÃO DE DATAS
  const formatarData = (data: string) => {
    if (!data) return "N/A"

    try {
      // Se já está no formato DD/MM/YYYY, retornar direto
      if (data.includes("/")) {
        return data
      }

      // Se está no formato ISO (YYYY-MM-DD), converter
      if (data.includes("-")) {
        const [ano, mes, dia] = data.split("T")[0].split("-")
        return `${dia}/${mes}/${ano}`
      }

      // Tentar criar Date object
      const dataObj = new Date(data)
      if (isNaN(dataObj.getTime())) {
        console.warn("⚠️ Data inválida:", data)
        return "Data inválida"
      }

      return dataObj.toLocaleDateString("pt-BR")
    } catch (error) {
      console.error("❌ Erro ao formatar data:", error, data)
      return "Erro na data"
    }
  }

  const calcularHorasRestantes = (validaAte?: string) => {
    if (!validaAte) return "N/A"

    try {
      let dataLimite: Date

      // Se está no formato DD/MM/YYYY
      if (validaAte.includes("/")) {
        const [dia, mes, ano] = validaAte.split("/")
        dataLimite = new Date(Number(ano), Number(mes) - 1, Number(dia))
      }
      // Se está no formato ISO
      else {
        dataLimite = new Date(validaAte)
      }

      if (isNaN(dataLimite.getTime())) {
        return "Data inválida"
      }

      const agora = new Date()
      const diffMs = dataLimite.getTime() - agora.getTime()
      const diffHoras = Math.floor(diffMs / (1000 * 60 * 60))

      if (diffHoras <= 0) return "Vencido"
      if (diffHoras <= 24) return `${diffHoras}h (Urgente)`

      const dias = Math.floor(diffHoras / 24)
      const horas = diffHoras % 24
      return `${dias}d ${horas}h`
    } catch (error) {
      console.error("❌ Erro ao calcular horas:", error)
      return "Erro no cálculo"
    }
  }

  // CORRIGIR BADGES DE STATUS
  const renderStatus = (status: any) => {
    return (
      <div className="flex items-center gap-2">
        <StatusChecagemIcon status={status} />
        <StatusChecagemBadge status={status} />
      </div>
    )
  }

  const handleVisualizarSolicitacao = (item: { solicitacao: Solicitacao; prestador: PrestadorAvaliacao }) => {
    setPrestadorSelecionado(item)
    setDialogAberto(true)
    setMostrandoConfirmacao(false)
  }

  const handleExcecao = (item: { solicitacao: Solicitacao; prestador: PrestadorAvaliacao }) => {
    setPrestadorSelecionado(item)
    setDialogAberto(true)
    setMostrandoConfirmacao(true)
    setNovaJustificativa("")

    console.log("🔥 BOTÃO EXCEÇÃO CLICADO!")
    console.log("📋 Item selecionado:", item)
    console.log("👤 Prestador:", item.prestador.nome)
    console.log("🏷️ Status atual:", item.prestador.checagem)

    console.log("✅ Estados atualizados - Dialog deve abrir")
  }

  const confirmarExcecao = async () => {
    if (!prestadorSelecionado || !novaJustificativa.trim()) {
      alert("Por favor, preencha a justificativa antes de confirmar.")
      return
    }

    try {
      console.log("💾 Salvando exceção no banco...")
      console.log("🆔 ID do prestador:", prestadorSelecionado.prestador.id)

      // PRIMEIRO: Verificar se o prestador existe
      const { data: prestadorExistente, error: erroConsulta } = await supabase
        .from("prestadores")
        .select("id, checagem")
        .eq("id", prestadorSelecionado.prestador.id)
        .single()

      if (erroConsulta) {
        console.error("❌ Erro ao consultar prestador:", erroConsulta)
        alert("Erro: Prestador não encontrado no banco de dados.")
        return
      }

      console.log("👤 Prestador encontrado:", prestadorExistente)

      // SEGUNDO: Atualizar com o status correto
      const { data, error } = await supabase
        .from("prestadores")
        .update({
          checagem: "excecao", // Coluna: Checagem
          liberacao: "pendente", // 🔥 PRODUÇÃO REAL: Alterado para PENDENTE (Admin deve fazer o cadastro manual)
          justificativa: novaJustificativa,
          checagem_valida_ate: dataValidadeExcecao, // Salvar data de validade da exceção
          data_avaliacao: new Date().toISOString(),
          aprovado_por: "Gestor - Exceção",
        })
        .eq("id", prestadorSelecionado.prestador.id)
        .select()

      if (error) {
        console.error("❌ Erro detalhado ao atualizar status:", error)

        // Se o erro for de constraint, mostrar mensagem específica
        if (error.message.includes("prestadores_status_check")) {
          alert(
            `❌ ERRO DE BANCO: O status "excecao" não é permitido na tabela. Execute o script SQL para corrigir a constraint.`,
          )
        } else {
          alert(`❌ Erro ao salvar exceção: ${error.message}`)
        }
        return
      }

      console.log("✅ Exceção salva com sucesso!", data)

      // Atualizar estado local
      setPrestadoresReprovados((prev) =>
        prev.map((item) => {
          if (
            item.solicitacao.id === prestadorSelecionado.solicitacao.id &&
            item.prestador.id === prestadorSelecionado.prestador.id
          ) {
            return {
              ...item,
              prestador: {
                ...item.prestador,
                checagem: "excecao" as any,
                liberacao: "pendente" as any,
                justificativa: novaJustificativa,
                checagemValidaAte: dataValidadeExcecao.split("-").reverse().join("/"), // Atualizar localmente no formato DD/MM/YYYY
              },
            }
          }
          return item
        }),
      )

      setDialogAberto(false)
      setMostrandoConfirmacao(false)
      setPrestadorSelecionado(null)
      setNovaJustificativa("")
      alert("✅ Status alterado para Exceção com sucesso!")
    } catch (error) {
      console.error("❌ Erro ao confirmar exceção:", error)
      alert("Erro interno. Tente novamente.")
    }
  }

  const handleConfirmarReprovacao = async (item: { solicitacao: Solicitacao; prestador: PrestadorAvaliacao }) => {
    if (!confirm(`Confirma a REPROVAÇÃO definitiva para ${item.prestador.nome}?`)) return

    try {
      const { error } = await supabase
        .from("prestadores")
        .update({
          aprovado_por: "Gestor - Reprovação Confirmada",
        })
        .eq("id", item.prestador.id)

      if (error) throw error

      setPrestadoresReprovados((prev) =>
        prev.map((p) => {
          if (p.prestador.id === item.prestador.id) {
            return {
              ...p,
              prestador: { ...p.prestador, aprovado_por: "Gestor - Reprovação Confirmada" } as any,
            }
          }
          return p
        }),
      )

      alert("✅ Reprovação confirmada com sucesso.")
    } catch (error) {
      console.error("Erro ao confirmar reprovação:", error)
      alert("Erro ao confirmar.")
    }
  }

  const handleRevisarRenovacao = (item: { solicitacao: Solicitacao; prestador: PrestadorAvaliacao }) => {
    setPrestadorSelecionado(item)
    setDialogAberto(true)
    setMostrandoConfirmacao(true)
    // Pre-preecher com dados da renovação
    setNovaJustificativa(item.prestador.justificativa || "")
    
    // Tentar pegar a data final da solicitação para a validade da exceção
    if (item.solicitacao.dataFinal) {
      if (item.solicitacao.dataFinal.includes("/")) {
        const [d, m, a] = item.solicitacao.dataFinal.split("/")
        setDataValidadeExcecao(`${a}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`)
      }
    }
  }

  const handleAprovarRenovacao = async (solicitacaoId: string, novaJustif?: string) => {
    try {
      console.log("🔓 Validando renovação:", solicitacaoId)
      
      const updateData: any = { 
        status_geral: "aprovado"
      }
      
      // Atualizar solicitação
      const { error: errorSolic } = await supabase
        .from("solicitacoes")
        .update(updateData)
        .eq("id", solicitacaoId)

      if (errorSolic) throw errorSolic

      // Se passou nova justificativa, atualizar o prestador também
      if (novaJustif && prestadorSelecionado) {
        await supabase
          .from("prestadores")
          .update({ 
            justificativa: novaJustif,
            checagem_valida_ate: dataValidadeExcecao 
          })
          .eq("id", prestadorSelecionado.prestador.id)
      }

      setPrestadoresReprovados((prev) =>
        prev.map((item) => {
          if (item.solicitacao.id === solicitacaoId) {
            return {
              ...item,
              solicitacao: { ...item.solicitacao, statusGeral: "aprovado" as any },
            }
          }
          return item
        }),
      )

      setDialogAberto(false)
      setMostrandoConfirmacao(false)
      alert("✅ Renovação validada com sucesso! Agora a ADM pode liberar o acesso.")
    } catch (error: any) {
      console.error("Erro ao validar renovação:", error)
      alert("Erro ao validar: " + error.message)
    }
  }

  // Calcular paginação
  const totalPrestadores = prestadoresFiltrados.length
  const totalPaginas = Math.ceil(totalPrestadores / PRESTADORES_POR_PAGINA)
  const indiceInicio = (paginaAtual - 1) * PRESTADORES_POR_PAGINA
  const indiceFim = indiceInicio + PRESTADORES_POR_PAGINA
  const prestadoresPaginados = prestadoresFiltrados.slice(indiceInicio, indiceFim)

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
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-slate-800">
            Consulta de Solicitações - Prestadores Reprovados e Exceções
          </CardTitle>
          <p className="text-slate-600">
            Visualize e gerencie prestadores que foram reprovados na checagem ou que possuem exceções
          </p>
        </CardHeader>
        <CardContent>
          {/* BARRA DE FILTROS */}
          <div className="flex flex-wrap gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">Filtros:</span>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">Status:</label>
              <Select value={filtroStatus} onValueChange={setFiltroStatus}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Selecionar status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="pendente_gestor">🔔 Pendente Validação</SelectItem>
                  <SelectItem value="reprovado">❌ Reprovada</SelectItem>
                  <SelectItem value="excecao">🟣 Exceção</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">Data Solicitação:</label>
              <Select value={ordenacaoData} onValueChange={setOrdenacaoData}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Ordenar por data" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="desc">
                    <div className="flex items-center gap-2">
                      <ArrowUpDown className="h-4 w-4" />
                      Mais recente primeiro
                    </div>
                  </SelectItem>
                  <SelectItem value="asc">
                    <div className="flex items-center gap-2">
                      <ArrowUpDown className="h-4 w-4" />
                      Mais antigo primeiro
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span>Total: {prestadoresFiltrados.length} registros</span>
            </div>
          </div>

          {/* 💰 SEÇÃO: MÉTRICAS DE ECONOMIA */}
          <Card className="border-emerald-200 bg-emerald-50">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-emerald-800">💰 Métricas de Economia do Sistema</CardTitle>
              <p className="text-emerald-600">Acompanhe as economias geradas pelo sistema de validação inteligente</p>
            </CardHeader>
            <CardContent>
              {carregandoEconomia ? (
                <div className="flex justify-center p-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-emerald-600"></div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-white p-4 rounded-lg border border-emerald-200">
                    <div className="text-2xl font-bold text-emerald-700">
                      R$ {metricasEconomia.totalEconomizado.toFixed(2)}
                    </div>
                    <div className="text-sm text-emerald-600">Economia Total</div>
                    <div className="text-xs text-gray-500">{metricasEconomia.totalCasos} casos detectados</div>
                  </div>
                  <div className="bg-white p-4 rounded-lg border border-green-200">
                    <div className="text-2xl font-bold text-green-700">{metricasEconomia.economiaMaxima}</div>
                    <div className="text-sm text-green-600">Economia Máxima</div>
                    <div className="text-xs text-gray-500">Checagens evitadas</div>
                  </div>
                  <div className="bg-white p-4 rounded-lg border border-blue-200">
                    <div className="text-2xl font-bold text-blue-700">{metricasEconomia.economiaOperacional}</div>
                    <div className="text-sm text-blue-600">Economia Operacional</div>
                    <div className="text-xs text-gray-500">Duplicações evitadas</div>
                  </div>
                  <div className="bg-white p-4 rounded-lg border border-orange-200">
                    <div className="text-2xl font-bold text-orange-700">{metricasEconomia.desperdicioEvitado}</div>
                    <div className="text-sm text-orange-600">Desperdício Evitado</div>
                    <div className="text-xs text-gray-500">Erros bloqueados</div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {prestadoresFiltrados.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-slate-500">
                {prestadoresReprovados.length === 0
                  ? "Nenhum prestador reprovado encontrado."
                  : "Nenhum registro encontrado com os filtros aplicados."}
              </p>
              <p className="text-xs text-slate-400 mt-2">Verifique o console do navegador para logs de debug</p>
            </div>
          ) : (
            <>
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

              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data Solicitação</TableHead>
                      <TableHead>Data Inicial</TableHead>
                      <TableHead>Departamento</TableHead>
                      <TableHead>Empresa</TableHead>
                      <TableHead>Prestador</TableHead>
                      <TableHead>Doc1</TableHead>
                      <TableHead>Checagem</TableHead>
                      <TableHead>Válida até</TableHead>
                      {/* Coluna Horas Restantes removida */}
                      <TableHead>Justificativa</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {prestadoresPaginados.map((item, index) => (
                      <TableRow
                        key={`${item.solicitacao.id}-${item.prestador.id}-${index}`}
                        className={
                          item.prestador.checagem === "reprovado" || item.prestador.checagem === "reprovada"
                            ? "bg-red-50 border-l-4 border-l-red-500"
                            : "bg-purple-50 border-l-4 border-l-purple-500"
                        }
                      >
                        <TableCell>
                          <span title={`Original: ${item.solicitacao.dataSolicitacao}`}>
                            {formatarData(item.solicitacao.dataSolicitacao)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div title={`Original: ${item.solicitacao.dataInicial}`}>
                            <DataInicialIndicator
                              dataInicial={formatarData(item.solicitacao.dataInicial)}
                              isReprovado={false}
                            />
                          </div>
                        </TableCell>
                        <TableCell>{item.solicitacao.departamento}</TableCell>
                        <TableCell>{item.solicitacao.empresa}</TableCell>
                        <TableCell className="font-medium">{item.prestador.nome}</TableCell>
                        <TableCell>{item.prestador.doc1}</TableCell>
                        <TableCell>
                          <span title={`Status original: ${item.prestador.checagem}`}>
                            {renderStatus(item.prestador.checagem)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span title={`Original: ${item.prestador.checagemValidaAte}`}>
                            {item.prestador.checagemValidaAte ? formatarData(item.prestador.checagemValidaAte) : "N/A"}
                          </span>
                        </TableCell>
                        {/* Célula Horas Restantes removida */}
                        <TableCell>
                          <div className="max-w-xs truncate" title={item.prestador.justificativa || ""}>
                            {item.prestador.justificativa || "Sem justificativa"}
                          </div>
                        </TableCell>
                        <TableCell>
                            <div className="flex gap-2">
                              <Button size="sm" variant="outline" onClick={() => handleVisualizarSolicitacao(item)}>
                                <Eye className="h-4 w-4" />
                              </Button>
                              
                              {/* Botão de Validar Renovação - Idêntico ao de Exceção mas com outra função */}
                              {item.solicitacao.statusGeral === "pendente_gestor" && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-orange-600 border-orange-600 hover:bg-orange-50"
                                  onClick={() => handleRevisarRenovacao(item)}
                                  title="Validar Renovação de Exceção"
                                >
                                  <AlertTriangle className="h-4 w-4" />
                                </Button>
                              )}

                              {(item.prestador.checagem === "reprovado" || item.prestador.checagem === "reprovada") && (
                                <>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="text-orange-600 border-orange-600 hover:bg-orange-50"
                                    onClick={() => handleExcecao(item)}
                                    title="Criar Exceção"
                                  >
                                    <AlertTriangle className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="text-blue-600 border-blue-600 hover:bg-blue-50"
                                    onClick={() => handleConfirmarReprovacao(item)}
                                    title="Confirmar Reprovação"
                                  >
                                    <CheckSquare className="h-4 w-4" />
                                  </Button>
                                </>
                              )}
                            </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

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
            </>
          )}
        </CardContent>
      </Card>

      {/* Dialog para exceção */}
      <Dialog
        open={dialogAberto}
        onOpenChange={(open) => {
          console.log("🔄 Dialog state mudou:", open)
          setDialogAberto(open)
          if (!open) {
            setMostrandoConfirmacao(false)
            setNovaJustificativa("")
          }
        }}
      >
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{mostrandoConfirmacao ? "Confirmar Exceção" : "Detalhes da Solicitação"}</DialogTitle>
          </DialogHeader>

          {prestadorSelecionado && !mostrandoConfirmacao && (
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
                <div>
                  <h4 className="font-semibold">Finalidade:</h4>
                  <p>{prestadorSelecionado.solicitacao.finalidade}</p>
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
                <p>{renderStatus(prestadorSelecionado.prestador.checagem)}</p>
              </div>

              {prestadorSelecionado.prestador.justificativa && (
                <div>
                  <h4 className="font-semibold">Justificativa do Aprovador:</h4>
                  <p className="bg-gray-50 p-3 rounded">{prestadorSelecionado.prestador.justificativa}</p>
                </div>
              )}
            </div>
          )}

          {/* Confirmação de exceção */}
          {mostrandoConfirmacao && prestadorSelecionado && (
            <div className="space-y-6">
              {/* Pergunta de confirmação */}
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-6">
                <div className="flex items-center gap-3 mb-4">
                  <AlertTriangle className="h-6 w-6 text-orange-600" />
                  <h4 className="font-semibold text-orange-800 text-lg">
                    {prestadorSelecionado.solicitacao.statusGeral === "pendente_gestor" ? "Validação de Renovação" : "Confirmação de Exceção"}
                  </h4>
                </div>

                <div className="bg-white rounded-lg p-4 mb-4">
                  <p className="text-gray-700 mb-2">
                    <strong>Prestador:</strong> {prestadorSelecionado.prestador.nome}
                  </p>
                  <p className="text-gray-700 mb-2">
                    <strong>Doc1:</strong> {prestadorSelecionado.prestador.doc1}
                  </p>
                   <p className="text-gray-700">
                    <strong>Status Atual:</strong>
                    <span className={`ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${prestadorSelecionado.prestador.checagem === "excecao" ? "bg-purple-100 text-purple-800" : "bg-red-100 text-red-800"}`}>
                      {prestadorSelecionado.prestador.checagem === "excecao" ? "Exceção (Renovação)" : "Reprovado"}
                    </span>
                  </p>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                  <p className="text-yellow-800 font-medium">
                    ⚠️ Tem certeza que deseja reverter a decisão de bloqueio para este prestador?
                  </p>
                  <p className="text-yellow-700 text-sm mt-1">
                    Esta ação criará uma exceção que permitirá acesso temporário ao clube.
                  </p>
                </div>
              </div>
              
              {/* Seletor de Data de Validade */}
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-4">
                <div className="flex items-center gap-2 mb-3">
                  <Calendar className="h-5 w-5 text-purple-600" />
                  <h4 className="font-semibold text-purple-800">📅 Validade desta Exceção</h4>
                </div>
                <p className="text-sm text-purple-700 mb-3">
                  Defina até quando esta exceção será aceita pelo sistema (padrão: 6 meses):
                </p>
                <Input
                  type="date"
                  value={dataValidadeExcecao}
                  onChange={(e) => setDataValidadeExcecao(e.target.value)}
                  className="max-w-xs border-purple-300 focus:border-purple-500 focus:ring-purple-500"
                />
              </div>

              {/* Campo de justificativa */}
              <div className="space-y-3">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-blue-800 font-medium mb-2">
                    📝 Preencha o campo "justificativa" com o período que este prestador poderá ter acesso ao clube:
                  </p>
                  <p className="text-blue-700 text-sm">Seja específico sobre datas, horários e condições de acesso.</p>
                </div>

                <Textarea
                  value={novaJustificativa}
                  onChange={(e) => setNovaJustificativa(e.target.value)}
                  placeholder="Ex: Liberado para acesso de 15/01/2024 a 30/01/2024 das 08:00 às 18:00 para conclusão de obra emergencial no setor administrativo. Acesso restrito à área da obra com acompanhamento de funcionário responsável."
                  rows={5}
                  className="w-full"
                />

                {novaJustificativa.trim() && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <p className="text-green-800 text-sm">
                      ✅ Justificativa preenchida. Você pode confirmar a exceção.
                    </p>
                  </div>
                )}
              </div>

              {/* Botões de ação */}
              <div className="flex gap-3 justify-end pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => {
                    setDialogAberto(false)
                    setMostrandoConfirmacao(false)
                    setNovaJustificativa("")
                  }}
                  className="px-6"
                >
                  ❌ Não, Cancelar
                </Button>
                <Button
                  onClick={() => {
                    if (prestadorSelecionado.solicitacao.statusGeral === "pendente_gestor") {
                      handleAprovarRenovacao(prestadorSelecionado.solicitacao.id, novaJustificativa)
                    } else {
                      confirmarExcecao()
                    }
                  }}
                  disabled={!novaJustificativa.trim()}
                  className="bg-orange-600 hover:bg-orange-700 px-6"
                >
                  {prestadorSelecionado.solicitacao.statusGeral === "pendente_gestor" ? "✅ Confirmar Renovação" : "✅ Sim, Confirmar Exceção"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
