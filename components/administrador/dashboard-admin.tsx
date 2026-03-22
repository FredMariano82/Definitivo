"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { TrendingUp, Users, FileText, DollarSign, AlertTriangle, Filter, X } from "lucide-react"
import { getAllSolicitacoes } from "../../services/solicitacoes-service"
import RelatorioModal from "./relatorio-modal"
import { EconomiasService, type EconomiaMetricas } from "../../services/economias-service"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import GraficoProdutividadeUsuarios from "./grafico-produtividade-usuarios"
import PageHeader from "@/components/page-header"
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"
import { Power, Play, Pause, FileSpreadsheet, Search, Loader2, Activity } from "lucide-react"
import { useRef } from "react"

export default function DashboardAdmin() {
  const [solicitacoes, setSolicitacoes] = useState<any[]>([])
  const [filtroSolicitante, setFiltroSolicitante] = useState<string>("todos")
  const [filtroTipo, setFiltroTipo] = useState<string>("todos") // todos, economia, urgente
  const [filtroDepartamento, setFiltroDepartamento] = useState<string>("todos")
  const [filtroMes, setFiltroMes] = useState<string>("todos")
  const [carregando, setCarregando] = useState(true)
  const [metricasEconomia, setMetricasEconomia] = useState<EconomiaMetricas>({
    totalEconomizado: 0,
    totalCasos: 0,
    economiaMaxima: 0,
    economiaOperacional: 0,
    desperdicioEvitado: 0,
    porSolicitante: [],
  })
  const [carregandoEconomia, setCarregandoEconomia] = useState(false)
  const [roboAtivo, setRoboAtivo] = useState(true)
  const [carregandoRobo, setCarregandoRobo] = useState(false)
  const [historicoRobo, setHistoricoRobo] = useState<any[]>([])
  const [carregandoHistorico, setCarregandoHistorico] = useState(false)
  // 📅 NOVOS ESTADOS PARA FILTRO DE DATA
  const [dataInicial, setDataInicial] = useState<string>("")
  const [dataFinal, setDataFinal] = useState<string>("")
  const [loadingAcao, setLoadingAcao] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [currentAction, setCurrentAction] = useState<string | null>(null)

  useEffect(() => {
    const buscarDados = async () => {
      try {
        setCarregando(true)
        setCarregandoEconomia(true)

        // Buscar solicitações
        const dados = await getAllSolicitacoes()
        setSolicitacoes(dados)

        // Buscar métricas de economia
        const economia = await EconomiasService.buscarMetricasEconomia({
          solicitante: filtroSolicitante !== "todos" ? filtroSolicitante : undefined,
          dataInicial: filtroMes !== "todos" ? `2024-${filtroMes}-01` : undefined,
          dataFinal: filtroMes !== "todos" ? `2024-${filtroMes}-31` : undefined,
        })
        setMetricasEconomia(economia)
      } catch (error) {
        console.error("Erro:", error)
      } finally {
        setCarregando(false)
        setCarregandoEconomia(false)
      }
    }
    buscarDados()

    // Buscar status do robô
    const buscarStatusRobo = async () => {
      try {
        const res = await fetch('/api/robo-control')
        const data = await res.json()
        setRoboAtivo(data.active)
      } catch (error) {
        console.error("Erro ao buscar status do robô:", error)
      }
    }
    buscarStatusRobo()

    // Buscar histórico do robô
    const buscarHistoricoRobo = async () => {
      try {
        setCarregandoHistorico(true)
        const res = await fetch('/api/robo-history')
        const data = await res.json()
        setHistoricoRobo(data)
      } catch (error) {
        console.error("Erro ao buscar histórico do robô:", error)
      } finally {
        setCarregandoHistorico(false)
      }
    }
    buscarHistoricoRobo()

    // Atualizar histórico a cada 30 segundos se o dashboard estiver aberto
    const interval = setInterval(buscarHistoricoRobo, 30000)
    return () => clearInterval(interval)
  }, [filtroSolicitante, filtroMes])

  const handleToggleRobo = async (checked: boolean) => {
    try {
      setCarregandoRobo(true)
      const res = await fetch('/api/robo-control', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: checked })
      })

      if (res.ok) {
        setRoboAtivo(checked)
        toast.success(checked ? "Robô 4 Ativado" : "Robô 4 Pausado")
      } else {
        toast.error("Erro ao alterar status do robô")
      }
    } catch (error) {
      toast.error("Erro na comunicação com o servidor")
    } finally {
      setCarregandoRobo(false)
    }
  }

  const solicitantes = Array.from(new Set(solicitacoes.map((s) => s.solicitante)))
  const departamentos = Array.from(new Set(solicitacoes.map((s) => s.departamento)))

  const meses = [
    { value: "01", label: "Janeiro" },
    { value: "02", label: "Fevereiro" },
    { value: "03", label: "Março" },
    { value: "04", label: "Abril" },
    { value: "05", label: "Maio" },
    { value: "06", label: "Junho" },
    { value: "07", label: "Julho" },
    { value: "08", label: "Agosto" },
    { value: "09", label: "Setembro" },
    { value: "10", label: "Outubro" },
    { value: "11", label: "Novembro" },
    { value: "12", label: "Dezembro" },
  ]

  // Filtrar dados baseado nos filtros selecionados - INCLUINDO DATAS
  const dadosFiltrados = solicitacoes.filter((s) => {
    const solicitanteMatch = filtroSolicitante === "todos" || s.solicitante === filtroSolicitante
    const departamentoMatch = filtroDepartamento === "todos" || s.departamento === filtroDepartamento

    // 📅 FILTRO DE DATA
    let dataMatch = true
    if (dataInicial || dataFinal) {
      let dataSolicitacao: Date
      if (s.dataSolicitacao.includes("/")) {
        const [dia, mes, ano] = s.dataSolicitacao.split("/")
        dataSolicitacao = new Date(Number(ano), Number(mes) - 1, Number(dia))
      } else {
        dataSolicitacao = new Date(s.dataSolicitacao)
      }

      if (dataInicial) {
        const dataInicialObj = new Date(dataInicial)
        if (dataSolicitacao < dataInicialObj) dataMatch = false
      }

      if (dataFinal) {
        const dataFinalObj = new Date(dataFinal)
        dataFinalObj.setHours(23, 59, 59, 999)
        if (dataSolicitacao > dataFinalObj) dataMatch = false
      }
    }

    // Filtro de mês
    let mesMatch = true
    if (filtroMes !== "todos") {
      const dataSolicitacao = s.dataSolicitacao.split("/")
      const mesSolicitacao = dataSolicitacao[1] // formato DD/MM/YYYY
      mesMatch = mesSolicitacao === filtroMes
    }

    let tipoMatch = true
    if (filtroTipo === "economia") {
      tipoMatch = s.economia === "economia1" || s.economia === "economia2"
    } else if (filtroTipo === "urgente") {
      tipoMatch = s.prestadores && s.prestadores.some((p: any) => p.liberacao === "urgente")
    }

    return solicitanteMatch && departamentoMatch && dataMatch && mesMatch && tipoMatch
  })

  // Calcular métricas baseadas nos dados filtrados - SEMPRE INTEIROS
  const metricas = {
    total: dadosFiltrados.length,
    pendentes: dadosFiltrados.filter((s) => s.statusGeral === "pendente").length,
    aprovadas: dadosFiltrados.filter((s) => s.statusGeral === "aprovado").length,
    reprovadas: dadosFiltrados.filter((s) => s.statusGeral === "reprovado").length,
    urgentes: dadosFiltrados.filter((s) => s.prestadores && s.prestadores.some((p: any) => p.liberacao === "urgente"))
      .length,
    custoTotal: dadosFiltrados.reduce((acc, s) => {
      // Cada prestador que precisa de checagem custa R$ 20,00
      const prestadoresComChecagem =
        s.tipoSolicitacao === "checagem_liberacao" ? (s.prestadores ? s.prestadores.length : 0) : 0
      return acc + prestadoresComChecagem * 20
    }, 0),
    economiaTotal: dadosFiltrados.reduce((acc, s) => acc + (s.economiaGerada || 0), 0),
  }

  // Após calcular as métricas, adicionar estes logs:
  console.log("🔍 DEBUG - Métricas calculadas:", {
    total: metricas.total,
    pendentes: metricas.pendentes,
    aprovadas: metricas.aprovadas,
    reprovadas: metricas.reprovadas,
  })

  console.log(
    "🔍 DEBUG - Primeiras 3 solicitações:",
    dadosFiltrados.slice(0, 3).map((s) => ({
      numero: s.numero,
      statusGeral: s.statusGeral,
      solicitante: s.solicitante,
    })),
  )

  // Dados para gráfico de departamentos - CORRIGIDO
  const contadorDepartamentos = dadosFiltrados.reduce(
    (acc, s) => {
      if (s.departamento) {
        acc[s.departamento] = (acc[s.departamento] || 0) + 1
      }
      return acc
    },
    {} as Record<string, number>,
  )

  const dadosDepartamentos = Object.entries(contadorDepartamentos)
    .map(([dept, count]) => ({
      departamento: dept,
      solicitacoes: count as number,
    }))
    .sort((a, b) => (b.solicitacoes as number) - (a.solicitacoes as number))

  // Dados para gráfico de pizza CSS
  const dadosStatus = [
    { name: "Aprovadas", value: metricas.aprovadas, color: "#10B981" },
    { name: "Pendentes", value: metricas.pendentes, color: "#f59e0b" },
    { name: "Reprovadas", value: metricas.reprovadas, color: "#ef4444" },
  ] // ← REMOVER O .filter() para mostrar todos os status

  const totalStatus = dadosStatus.reduce((acc, item) => acc + item.value, 0)

  // Calcular ângulos para o gráfico de pizza CSS
  let anguloAcumulado = 0
  const dadosComAngulos = dadosStatus.map((item) => {
    const porcentagem = totalStatus > 0 ? (item.value / totalStatus) * 100 : 0
    const angulo = (porcentagem / 100) * 360
    const resultado = {
      ...item,
      porcentagem,
      anguloInicio: anguloAcumulado,
      anguloFim: anguloAcumulado + angulo,
    }
    anguloAcumulado += angulo
    return resultado
  })

  // Calcular métricas dos prestadores
  const todosPrestadores = dadosFiltrados.flatMap((s) => s.prestadores || [])
  const metricasPrestadores = {
    total: todosPrestadores.length,
    aprovados: todosPrestadores.filter((p) => p.checagem === "aprovado" || p.checagem === "aprovada").length,
    pendentes: todosPrestadores.filter((p) => p.checagem === "pendente").length,
    reprovados: todosPrestadores.filter((p) => p.checagem === "reprovado" || p.checagem === "reprovada").length,
    excecao: todosPrestadores.filter((p) => p.checagem === "excecao").length,
  }

  console.log("🔍 DEBUG - Métricas dos Prestadores:", metricasPrestadores)

  // Dados para gráfico de pizza dos prestadores
  const dadosStatusPrestadores = [
    { name: "Aprovados", value: metricasPrestadores.aprovados, color: "#10B981" },
    { name: "Pendentes", value: metricasPrestadores.pendentes, color: "#f59e0b" },
    { name: "Reprovados", value: metricasPrestadores.reprovados, color: "#ef4444" },
    { name: "Exceção", value: metricasPrestadores.excecao, color: "#8b5cf6" },
  ]

  const totalStatusPrestadores = dadosStatusPrestadores.reduce((acc, item) => acc + item.value, 0)

  // Calcular ângulos para o gráfico de pizza dos prestadores
  let anguloAcumuladoPrestadores = 0
  const dadosComAngulosPrestadores = dadosStatusPrestadores.map((item) => {
    const porcentagem = totalStatusPrestadores > 0 ? (item.value / totalStatusPrestadores) * 100 : 0
    const angulo = (porcentagem / 100) * 360
    const resultado = {
      ...item,
      porcentagem,
      anguloInicio: anguloAcumuladoPrestadores,
      anguloFim: anguloAcumuladoPrestadores + angulo,
    }
    anguloAcumuladoPrestadores += angulo
    return resultado
  })

  // Análise de solicitações urgentes
  const analiseUrgente = solicitantes
    .map((solicitante) => {
      const solicitacoesSolicitante = dadosFiltrados.filter((s) => s.solicitante === solicitante)
      const urgentesCount = solicitacoesSolicitante.filter(
        (s) => s.prestadores && s.prestadores.some((p: any) => p.liberacao === "urgente"),
      ).length
      const totalSolicitacoes = solicitacoesSolicitante.length

      return {
        solicitante,
        urgentes: urgentesCount,
        total: totalSolicitacoes,
        percentualUrgente: totalSolicitacoes > 0 ? Math.floor((urgentesCount / totalSolicitacoes) * 100) : 0,
      }
    })
    .filter((item) => item.urgentes > 0)
    .sort((a, b) => b.urgentes - a.urgentes)

  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  if (carregando) {
    return (
      <div className="flex justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-slate-600"></div>
      </div>
    )
  }

  const handleAcaoAutomacao = (id: string) => {
    setCurrentAction(id)
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !currentAction) return

    setLoadingAcao(currentAction)
    const toastId = toast.loading(currentAction === "convert-csv" ? "Convertendo arquivo..." : "Buscando RGs no sistema...")

    try {
      const formData = new FormData()
      formData.append("file", file)

      const endpoint = currentAction === "convert-csv" ? "/api/admin/convert-csv" : "/api/admin/enrich-rgs"
      const response = await fetch(endpoint, {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Erro no processamento")
      }

      // Download do arquivo retornado
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = response.headers.get("Content-Disposition")?.split("filename=")[1]?.replace(/"/g, "") || "resultado.xlsx"
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast.success("Missão cumprida com sucesso!", { id: toastId })
    } catch (error: any) {
      console.error(error)
      toast.error(`Falha: ${error.message}`, { id: toastId })
    } finally {
      setLoadingAcao(null)
      setCurrentAction(null)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  return (
    <div className="space-y-6 pt-2">
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept={currentAction === "convert-csv" ? ".csv" : ".csv,.xlsx"}
        onChange={handleFileChange}
      />

      {/* Filtros */}
      <Card className="border-slate-200 bg-slate-50">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <Filter className="h-5 w-5 text-slate-600" />
              <Label className="text-lg font-medium text-slate-800">Filtros de Análise</Label>
              <RelatorioModal
                filtroSolicitante={filtroSolicitante}
                filtroDepartamento={filtroDepartamento}
                filtroTipo={filtroTipo}
                solicitacoesReais={dadosFiltrados}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
            <div>
              <Label className="text-sm font-medium text-slate-700 mb-2 block">Solicitante</Label>
              <Select value={filtroSolicitante} onValueChange={setFiltroSolicitante}>
                <SelectTrigger className="border-slate-300">
                  <SelectValue placeholder="Selecione o solicitante" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os Solicitantes</SelectItem>
                  {solicitantes.map((solicitante) => (
                    <SelectItem key={solicitante} value={solicitante}>
                      {solicitante}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm font-medium text-slate-700 mb-2 block">Departamento</Label>
              <Select value={filtroDepartamento} onValueChange={setFiltroDepartamento}>
                <SelectTrigger className="border-slate-300">
                  <SelectValue placeholder="Selecione o departamento" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os Departamentos</SelectItem>
                  {departamentos.map((departamento) => (
                    <SelectItem key={departamento} value={departamento}>
                      {departamento}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm font-medium text-slate-700 mb-2 block">Mês</Label>
              <Select value={filtroMes} onValueChange={setFiltroMes}>
                <SelectTrigger className="border-slate-300">
                  <SelectValue placeholder="Selecione o mês" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os Meses</SelectItem>
                  {meses.map((mes) => (
                    <SelectItem key={mes.value} value={mes.value}>
                      {mes.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm font-medium text-slate-700 mb-2 block">Tipo de Análise</Label>
              <Select value={filtroTipo} onValueChange={setFiltroTipo}>
                <SelectTrigger className="border-slate-300">
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todas as Solicitações</SelectItem>
                  <SelectItem value="economia">Apenas com Economia</SelectItem>
                  <SelectItem value="urgente">Apenas Urgentes</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm font-medium text-slate-700 mb-2 block">Data Inicial</Label>
              <Input
                type="date"
                value={dataInicial}
                onChange={(e) => setDataInicial(e.target.value)}
                className="border-slate-300"
              />
            </div>

            <div>
              <Label className="text-sm font-medium text-slate-700 mb-2 block">Data Final</Label>
              <Input
                type="date"
                value={dataFinal}
                onChange={(e) => setDataFinal(e.target.value)}
                className="border-slate-300"
              />
            </div>

            <div className="flex flex-col justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setDataInicial("")
                  setDataFinal("")
                }}
                disabled={!dataInicial && !dataFinal}
                className="border-slate-300 text-slate-700 hover:bg-slate-100"
              >
                <X className="h-4 w-4 mr-2" />
                Limpar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cards de Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-slate-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total de Solicitações</CardTitle>
            <FileText className="h-4 w-4 text-slate-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-800">{metricas.total}</div>
            <p className="text-xs text-gray-500 mt-1">
              {filtroSolicitante !== "todos" ? `De ${filtroSolicitante}` : "Todas as solicitações"}
            </p>
          </CardContent>
        </Card>

        <Card className="border-orange-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Solicitações Urgentes</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-700">{metricas.urgentes}</div>
            <p className="text-xs text-gray-500 mt-1">
              {metricas.total > 0
                ? `${Math.floor((metricas.urgentes / metricas.total) * 100)}% do total`
                : "0% do total"}
            </p>
          </CardContent>
        </Card>

        <Card className="border-emerald-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Custo Total</CardTitle>
            <DollarSign className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-700">R$ {metricas.custoTotal}</div>
            <p className="text-xs text-gray-500 mt-1">
              {dadosFiltrados.reduce(
                (acc, s) =>
                  acc + (s.tipoSolicitacao === "checagem_liberacao" ? (s.prestadores ? s.prestadores.length : 0) : 0),
                0,
              )}{" "}
              prestadores × R$ 20,00
            </p>
          </CardContent>
        </Card>

        <Card className="border-emerald-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">💰 Economia Total</CardTitle>
            <TrendingUp className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-700">R$ {metricasEconomia.totalEconomizado.toFixed(2)}</div>
            <p className="text-xs text-gray-500 mt-1">{metricasEconomia.totalCasos} casos detectados</p>
          </CardContent>
        </Card>
      </div>

      {/* Controle do Robô */}
      <div className="grid grid-cols-1 gap-6">
        <Card className={`border-2 transition-all ${roboAtivo ? 'border-emerald-500 bg-emerald-50/30' : 'border-slate-300 bg-slate-50'}`}>
          <CardContent className="py-4 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-full ${roboAtivo ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-200 text-slate-500'}`}>
                {roboAtivo ? <Play className="h-6 w-6" /> : <Pause className="h-6 w-6" />}
              </div>
              <div>
                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                  Robô 4 de Sincronização (Produção)
                  <Badge className={roboAtivo ? "bg-emerald-500 hover:bg-emerald-600" : "bg-slate-500 hover:bg-slate-600"}>
                    {roboAtivo ? "ATIVO" : "PAUSADO"}
                  </Badge>
                </h3>
                <p className="text-sm text-slate-600">
                  {roboAtivo 
                    ? "O robô está processando a fila de aprovados automaticamente a cada 10 minutos." 
                    : "O robô está em modo de espera. Nenhuma sincronização será realizada."}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-white p-2 rounded-lg border border-slate-200 shadow-sm">
              <Label htmlFor="robo-toggle" className="font-semibold text-slate-700 cursor-pointer">
                {roboAtivo ? "Pausar Robô" : "Retomar Robô"}
              </Label>
              <Switch 
                id="robo-toggle" 
                checked={roboAtivo} 
                onCheckedChange={handleToggleRobo}
                disabled={carregandoRobo}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Histórico de Sincronização */}
      <div className="grid grid-cols-1 gap-6">
        <Card className="border-slate-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Histórico de Sincronização (Últimas Ações)
              </CardTitle>
              <p className="text-xs text-slate-500">Monitoramento em tempo real das atividades do Robô 4</p>
            </div>
            <Button 
                variant="outline" 
                size="sm" 
                onClick={async () => {
                    const res = await fetch('/api/robo-history')
                    const data = await res.json()
                    setHistoricoRobo(data)
                }}
                disabled={carregandoHistorico}
                className="h-8 text-xs bg-white hover:bg-slate-50 border-slate-200"
            >
                {carregandoHistorico ? "Atualizando..." : "Atualizar Agora"}
            </Button>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="py-2 px-3 font-semibold text-slate-700">Data/Hora</th>
                    <th className="py-2 px-3 font-semibold text-slate-700">Prestador</th>
                    <th className="py-2 px-3 font-semibold text-slate-700">Documento</th>
                    <th className="py-2 px-3 font-semibold text-slate-700">Status</th>
                    <th className="py-2 px-3 font-semibold text-slate-700">Resultado/ID</th>
                  </tr>
                </thead>
                <tbody>
                  {historicoRobo.length > 0 ? (
                    historicoRobo.map((log, index) => (
                      <tr key={index} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                        <td className="py-2 px-3 text-slate-600 whitespace-nowrap">
                          {new Date(log.timestamp).toLocaleString('pt-BR')}
                        </td>
                        <td className="py-2 px-3 font-medium text-slate-800">{log.nome}</td>
                        <td className="py-2 px-3 text-slate-600">{log.doc}</td>
                        <td className="py-2 px-3">
                          <Badge className={log.status === 'sucesso' ? "bg-emerald-100 text-emerald-700 border-emerald-200" : "bg-red-100 text-red-700 border-red-200"}>
                            {log.status === 'sucesso' ? "SUCESSO" : "ERRO"}
                          </Badge>
                        </td>
                        <td className="py-2 px-3 text-slate-600 font-mono text-xs">
                          {log.id_control || log.mensagem}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-500 italic bg-white">
                        Nenhuma atividade registrada no histórico.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Ferramentas de Automação (Missões Especiais) */}
      <div className="grid grid-cols-1 gap-6">
        <Card className="border-2 border-red-200 bg-red-50/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-bold text-red-800 flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Ferramentas de Automação (Missões Especiais)
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-4 pt-2">
            <Button 
                variant="outline" 
                className="bg-white border-red-200 hover:bg-red-50 text-red-700 h-auto py-3 px-6 flex flex-col items-start gap-1 min-w-[200px]"
                disabled={loadingAcao !== null}
                onClick={() => handleAcaoAutomacao("convert-csv")}
            >
              <div className="flex items-center gap-2 font-bold">
                {loadingAcao === "convert-csv" ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileSpreadsheet className="h-4 w-4" />}
                1. Converte .csv em Excel
              </div>
              <span className="text-[10px] text-red-600 font-normal">Limpa acentos, nomes e colunas</span>
            </Button>

            <Button 
                variant="outline" 
                className="bg-white border-red-200 hover:bg-red-50 text-red-700 h-auto py-3 px-6 flex flex-col items-start gap-1 min-w-[200px]"
                disabled={loadingAcao !== null}
                onClick={() => handleAcaoAutomacao("enrich-rgs")}
            >
              <div className="flex items-center gap-2 font-bold">
                {loadingAcao === "enrich-rgs" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                2. Localizar RGs aqui
              </div>
              <span className="text-[10px] text-red-600 font-normal">Busca RGs no ID Control via Planilha</span>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-800">
              Solicitações por Departamento ({dadosDepartamentos.length} departamentos)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {dadosDepartamentos.length > 0 ? (
              <div className="space-y-4">
                {dadosDepartamentos.map((item, index) => (
                  <div key={item.departamento} className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 truncate">{item.departamento}</div>
                    </div>
                    <div className="flex items-center gap-3 ml-4">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-slate-600 h-2 rounded-full"
                          style={{
                            width: `${(item.solicitacoes / Math.max(...dadosDepartamentos.map((d) => d.solicitacoes))) * 100}%`,
                          }}
                        ></div>
                      </div>
                      <div className="text-lg font-bold text-slate-600 min-w-[2rem] text-right">
                        {item.solicitacoes as number}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-gray-500">
                <div className="text-center">
                  <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-red-400" />
                  <p>Nenhum departamento encontrado!</p>
                  <p className="text-sm">Verifique os filtros aplicados</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-800">Status das Solicitações</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center">
              {/* Gráfico de Pizza CSS */}
              <div className="relative w-48 h-48 mb-6">
                <svg width="192" height="192" viewBox="0 0 192 192" className="transform -rotate-90">
                  <circle cx="96" cy="96" r="80" fill="none" stroke="#f3f4f6" strokeWidth="32" />
                  {dadosComAngulos.map((item, index) => {
                    const raio = 80
                    const centro = 96
                    const anguloInicioRad = (item.anguloInicio * Math.PI) / 180
                    const anguloFimRad = (item.anguloFim * Math.PI) / 180

                    const x1 = centro + raio * Math.cos(anguloInicioRad)
                    const y1 = centro + raio * Math.sin(anguloInicioRad)
                    const x2 = centro + raio * Math.cos(anguloFimRad)
                    const y2 = centro + raio * Math.sin(anguloFimRad)

                    const largeArcFlag = item.anguloFim - item.anguloInicio > 180 ? 1 : 0

                    const pathData = [
                      `M ${centro} ${centro}`,
                      `L ${x1} ${y1}`,
                      `A ${raio} ${raio} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
                      "Z",
                    ].join(" ")

                    return <path key={index} d={pathData} fill={item.color} stroke="white" strokeWidth="2" />
                  })}
                </svg>

                {/* Texto central */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-800">{totalStatus}</div>
                    <div className="text-sm text-gray-600">Total</div>
                  </div>
                </div>
              </div>

              {/* Legenda */}
              <div className="grid grid-cols-1 gap-3 w-full">
                {dadosStatus.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full" style={{ backgroundColor: item.color }}></div>
                      <span className="text-sm font-medium">{item.name}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold">{item.value}</div>
                      <div className="text-xs text-gray-500">
                        {totalStatus > 0 ? ((item.value / totalStatus) * 100).toFixed(1) : 0}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-800">Status dos Prestadores</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center">
              {/* Gráfico de Pizza CSS - Prestadores */}
              <div className="relative w-48 h-48 mb-6">
                <svg width="192" height="192" viewBox="0 0 192 192" className="transform -rotate-90">
                  <circle cx="96" cy="96" r="80" fill="none" stroke="#f3f4f6" strokeWidth="32" />
                  {dadosComAngulosPrestadores.map((item, index) => {
                    if (item.value === 0) return null

                    const raio = 80
                    const centro = 96
                    const anguloInicioRad = (item.anguloInicio * Math.PI) / 180
                    const anguloFimRad = (item.anguloFim * Math.PI) / 180

                    const x1 = centro + raio * Math.cos(anguloInicioRad)
                    const y1 = centro + raio * Math.sin(anguloInicioRad)
                    const x2 = centro + raio * Math.cos(anguloFimRad)
                    const y2 = centro + raio * Math.sin(anguloFimRad)

                    const largeArcFlag = item.anguloFim - item.anguloInicio > 180 ? 1 : 0

                    const pathData = [
                      `M ${centro} ${centro}`,
                      `L ${x1} ${y1}`,
                      `A ${raio} ${raio} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
                      "Z",
                    ].join(" ")

                    return <path key={index} d={pathData} fill={item.color} stroke="white" strokeWidth="2" />
                  })}
                </svg>

                {/* Texto central */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-800">{totalStatusPrestadores}</div>
                    <div className="text-sm text-gray-600">Prestadores</div>
                  </div>
                </div>
              </div>

              {/* Legenda */}
              <div className="grid grid-cols-1 gap-3 w-full">
                {dadosStatusPrestadores.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full" style={{ backgroundColor: item.color }}></div>
                      <span className="text-sm font-medium">{item.name}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold">{item.value}</div>
                      <div className="text-xs text-gray-500">
                        {totalStatusPrestadores > 0 ? ((item.value / totalStatusPrestadores) * 100).toFixed(1) : 0}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {filtroTipo === "urgente" && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-orange-800 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Análise de Solicitações Urgentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analiseUrgente.map((item, index) => (
                <div key={item.solicitante} className="flex justify-between items-center p-3 bg-white rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium text-sm">
                      #{index + 1} {item.solicitante}
                    </div>
                    <div className="text-xs text-gray-500">
                      {item.urgentes} urgentes de {item.total} solicitações
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge className="bg-orange-100 text-orange-800">{item.percentualUrgente}% urgentes</Badge>
                  </div>
                </div>
              ))}
              {analiseUrgente.length === 0 && (
                <p className="text-center text-gray-500 py-4">Nenhuma solicitação urgente no período</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 💰 NOVA SEÇÃO: ANÁLISE DE ECONOMIA */}
      <Card className="border-emerald-200 bg-emerald-50">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-emerald-800 flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />💰 Análise de Economia do Sistema
          </CardTitle>
        </CardHeader>
        <CardContent>
          {carregandoEconomia ? (
            <div className="flex justify-center p-4">
              <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-emerald-600"></div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Métricas Gerais */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-lg border border-emerald-200">
                  <div className="text-2xl font-bold text-emerald-700">{metricasEconomia.economiaMaxima}</div>
                  <div className="text-sm text-emerald-600">Economia Máxima</div>
                  <div className="text-xs text-gray-500">Já tinha checagem válida</div>
                </div>
                <div className="bg-white p-4 rounded-lg border border-blue-200">
                  <div className="text-2xl font-bold text-blue-700">{metricasEconomia.economiaOperacional}</div>
                  <div className="text-sm text-blue-600">Economia Operacional</div>
                  <div className="text-xs text-gray-500">Já estava em processo</div>
                </div>
                <div className="bg-white p-4 rounded-lg border border-orange-200">
                  <div className="text-2xl font-bold text-orange-700">{metricasEconomia.desperdicioEvitado}</div>
                  <div className="text-sm text-orange-600">Desperdício Evitado</div>
                  <div className="text-xs text-gray-500">Constava bloqueio anterior</div>
                </div>
                <div className="bg-white p-4 rounded-lg border border-green-200">
                  <div className="text-2xl font-bold text-green-700">
                    R$ {metricasEconomia.totalEconomizado.toFixed(2)}
                  </div>
                  <div className="text-sm text-green-600">Valor Total</div>
                  <div className="text-xs text-gray-500">{metricasEconomia.totalCasos} casos</div>
                </div>
              </div>

              {/* Ranking por Solicitante */}
              {metricasEconomia.porSolicitante.length > 0 && (
                <div>
                  <h4 className="font-semibold text-emerald-800 mb-3">🏆 Ranking de Economia por Solicitante</h4>
                  <div className="space-y-2">
                    {metricasEconomia.porSolicitante.slice(0, 5).map((item, index) => (
                      <div
                        key={item.solicitante}
                        className="flex justify-between items-center p-3 bg-white rounded-lg border border-emerald-200"
                      >
                        <div className="flex-1">
                          <div className="font-medium text-sm">
                            #{index + 1} {item.solicitante}
                          </div>
                          <div className="text-xs text-gray-500">
                            {item.totalCasos} casos • Máx: {item.maxima} • Op: {item.operacional} • Evit: {item.evitado}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-emerald-700">R$ {item.totalEconomia.toFixed(2)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {metricasEconomia.totalCasos === 0 && (
                <div className="text-center py-8">
                  <div className="text-gray-500">
                    <TrendingUp className="h-12 w-12 mx-auto mb-4 text-emerald-400" />
                    <p>Nenhuma economia detectada ainda</p>
                    <p className="text-sm">As economias aparecerão conforme o sistema for usado</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 📊 NOVO: GRÁFICO DE PRODUTIVIDADE */}
      <GraficoProdutividadeUsuarios />

      {/* Resumo Geral */}
      <Card className="border-slate-200 bg-slate-50">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-slate-800 flex items-center gap-2">
            <Users className="h-5 w-5" />
            Resumo de Atividades
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Solicitações analisadas:</span>
                <Badge variant="outline">{metricas.total}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Taxa de aprovação:</span>
                <span className="font-semibold text-green-600">
                  {metricas.total > 0 ? Math.floor((metricas.aprovadas / metricas.total) * 100) : 0}%
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Solicitações urgentes:</span>
                <Badge className="bg-orange-100 text-orange-800">{metricas.urgentes}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Economia detectada:</span>
                <span className="font-semibold text-green-600">{metricasEconomia.totalCasos} casos</span>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Custo evitado:</span>
                <span className="font-semibold text-green-600">R$ {metricas.economiaTotal}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Filtro ativo:</span>
                <Badge variant="secondary">
                  {filtroSolicitante !== "todos" ? filtroSolicitante : "Todos"} •{" "}
                  {filtroMes !== "todos" ? meses.find((m) => m.value === filtroMes)?.label : "Todos"} • {filtroTipo}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
