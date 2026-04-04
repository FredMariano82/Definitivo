"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { TrendingUp, FileText, DollarSign, AlertTriangle, Filter, X, Play, Pause, FileSpreadsheet, Search, Loader2, Activity, GitMerge, Database, Clock, ShieldCheck } from "lucide-react"
import { getAllSolicitacoes } from "../../services/solicitacoes-service"
import RelatorioModal from "./relatorio-modal"
import { EconomiasService, type EconomiaMetricas } from "../../services/economias-service"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import GraficoProdutividadeUsuarios from "./grafico-produtividade-usuarios"
import PageHeader from "@/components/page-header"
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"
import { useAuth } from "../../contexts/auth-context"

export default function DashboardAdmin({ hideHeader = false }: { hideHeader?: boolean }) {
  const { usuario } = useAuth()
  const [solicitacoes, setSolicitacoes] = useState<any[]>([])
  const [filtroSolicitante, setFiltroSolicitante] = useState<string>("todos")
  const [filtroTipo, setFiltroTipo] = useState<string>("todos")
  const [filtroDepartamento, setFiltroDepartamento] = useState<string>("todos")
  const [filtroMes, setFiltroMes] = useState<string>("todos")
  const [carregando, setCarregando] = useState(true)
  const [metricasEconomia, setMetricasEconomia] = useState<EconomiaMetricas>({ totalEconomizado: 0, totalCasos: 0, economiaMaxima: 0, economiaOperacional: 0, desperdicioEvitado: 0, porSolicitante: [] })
  const [roboAtivo, setRoboAtivo] = useState(true)
  const [carregandoRobo, setCarregandoRobo] = useState(false)
  const [historicoRobo, setHistoricoRobo] = useState<any[]>([])
  const [dataInicial, setDataInicial] = useState<string>("")
  const [dataFinal, setDataFinal] = useState<string>("")
  const [loadingAcao, setLoadingAcao] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [currentAction, setCurrentAction] = useState<string | null>(null)
  const [firstFile, setFirstFile] = useState<File | null>(null)
  const [passoMerge, setPassoMerge] = useState<number>(1)

  useEffect(() => {
    const buscarDados = async () => {
      try {
        setCarregando(true)
        const [dados, economia] = await Promise.all([
          getAllSolicitacoes(),
          EconomiasService.buscarMetricasEconomia({ solicitante: filtroSolicitante !== "todos" ? filtroSolicitante : undefined })
        ])
        setSolicitacoes(dados)
        setMetricasEconomia(economia)
      } catch (e) { 
        console.error(e) 
      } finally { 
        setCarregando(false) 
      }
    }
    buscarDados()
  }, [filtroSolicitante])

  // Efeito específico para o Robo4 (Desativado conforme solicitação - Basta descomentar para reativar)
  /*
  useEffect(() => {
    if (usuario?.perfil === "superadmin") {
      const inicializarRobo = async () => {
        try {
          const [statusRes, historyRes] = await Promise.all([
            fetch('/api/robo-control'),
            fetch('/api/robo-history')
          ])
          
          if (statusRes.ok) {
            const status = await statusRes.json()
            setRoboAtivo(status.active)
          }
          
          if (historyRes.ok) {
            const history = await historyRes.json()
            setHistoricoRobo(history)
          }
        } catch (e) {
          console.error("Erro ao inicializar Robo4:", e)
        }
      }
      inicializarRobo()
      const interval = setInterval(inicializarRobo, 5000) // Poll history every 5s
      return () => clearInterval(interval)
    }
  }, [usuario])
  */

  const handleToggleRobo = async (checked: boolean) => {
    setCarregandoRobo(true)
    try {
      const res = await fetch('/api/robo-control', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: checked })
      })
      
      if (res.ok) {
        setRoboAtivo(checked)
        toast.success(`Robo4 ${checked ? 'ativado' : 'desativado'} com sucesso`)
      } else {
        throw new Error("Falha na API")
      }
    } catch (e) {
      toast.error("Erro ao controlar Robo4")
    } finally {
      setCarregandoRobo(false)
    }
  }

  const handleLimparHistorico = async () => {
    if (!confirm("Tem certeza que deseja limpar o histórico?")) return
    
    try {
      const res = await fetch('/api/robo-history', { method: 'DELETE' })
      if (res.ok) {
        setHistoricoRobo([])
        toast.success("Histórico limpo")
      }
    } catch (e) {
      toast.error("Erro ao limpar histórico")
    }
  }

  const handleAcaoAutomacao = (id: string) => {
    setCurrentAction(id)
    if (id === "merge-datas" && firstFile) {
        fileInputRef.current?.click()
    } else {
        setFirstFile(null); setPassoMerge(1)
        fileInputRef.current?.click()
    }
  }

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0 || !currentAction) return

    if (currentAction === "merge-datas" && passoMerge === 1) {
        setFirstFile(files[0])
        setPassoMerge(2)
        toast.info("Planilha 1 aceita. CLIQUE DE NOVO no botão para a Planilha 2.", { duration: 6000 })
        if (fileInputRef.current) fileInputRef.current.value = ""
        return
    }

    setLoadingAcao(currentAction)
    const toastId = toast.loading("Processando...")

    try {
      const formData = new FormData()
      if (currentAction === "merge-datas") {
          formData.append("file1", firstFile as File)
          formData.append("file2", files[0])
      } else {
          formData.append("file", files[0])
      }

      const response = await fetch(`/api/admin/${currentAction}`, { method: "POST", body: formData })
      if (!response.ok) throw new Error("Erro")

      if (currentAction === "import-db") {
        const result = await response.json()
        toast.success(result.message || "Importação concluída!", { id: toastId, duration: 8000 })
      } else {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = "resultado.xlsx"
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        toast.success("Sucesso!", { id: toastId })
      }
    } catch (e) { toast.error("Erro", { id: toastId }) } finally {
      setLoadingAcao(null); setCurrentAction(null); setFirstFile(null); setPassoMerge(1)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  const metricas = {
    total: solicitacoes.length,
    pendentes: solicitacoes.filter(s => s.statusGeral === "pendente").length,
    aprovadas: solicitacoes.filter(s => s.statusGeral === "aprovado").length,
    custo: solicitacoes.filter(s => s.tipoSolicitacao === "checagem_liberacao").reduce((acc, s) => acc + (s.prestadores?.length || 0) * 20, 0)
  }

  if (carregando) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin" /></div>

  return (
    <div className="space-y-6 pt-2">
      <input type="file" ref={fileInputRef} className="hidden" accept=".csv,.xlsx,.xls" onChange={handleFileChange} onClick={(e) => (e.currentTarget.value = "")} />
      {!hideHeader && <PageHeader title="Dashboard Administrativo" subtitle="Controle total do sistema" />}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="backdrop-blur-xl bg-white/40 border-white/20 shadow-xl rounded-2xl overflow-hidden hover:scale-[1.02] transition-transform duration-300">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-semibold text-slate-600">Solicitações Totais</CardTitle>
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <FileText className="h-4 w-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-800 tracking-tight">{metricas.total}</div>
            <p className="text-[10px] text-slate-500 mt-1 uppercase font-bold tracking-wider">Histórico Geral</p>
          </CardContent>
        </Card>

        <Card className="backdrop-blur-xl bg-white/40 border-white/20 shadow-xl rounded-2xl overflow-hidden hover:scale-[1.02] transition-transform duration-300">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-semibold text-slate-600">Aguardando Análise</CardTitle>
            <div className="p-2 bg-orange-500/10 rounded-lg">
              <Clock className="h-4 w-4 text-orange-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600 tracking-tight">{metricas.pendentes}</div>
            <p className="text-[10px] text-slate-500 mt-1 uppercase font-bold tracking-wider">Pendências Atuais</p>
          </CardContent>
        </Card>

        <Card className="backdrop-blur-xl bg-white/40 border-white/20 shadow-xl rounded-2xl overflow-hidden hover:scale-[1.02] transition-transform duration-300">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-semibold text-slate-600">Investimento Processado</CardTitle>
            <div className="p-2 bg-emerald-500/10 rounded-lg">
              <DollarSign className="h-4 w-4 text-emerald-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-600 tracking-tight">R$ {metricas.custo}</div>
            <p className="text-[10px] text-slate-500 mt-1 uppercase font-bold tracking-wider">Custo de Validação</p>
          </CardContent>
        </Card>

        <Card className="backdrop-blur-xl bg-white/40 border-white/20 shadow-xl rounded-2xl overflow-hidden hover:scale-[1.02] transition-transform duration-300">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-semibold text-slate-600">Economia Gerada</CardTitle>
            <div className="p-2 bg-emerald-500/10 rounded-lg">
              <TrendingUp className="h-4 w-4 text-emerald-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-600 tracking-tight">R$ {metricasEconomia.totalEconomizado.toFixed(2)}</div>
            <p className="text-[10px] text-slate-500 mt-1 uppercase font-bold tracking-wider">Gastos Evitados</p>
          </CardContent>
        </Card>
      </div>

      {/* 
      <Card className="border-2 border-red-200 bg-red-50/10">
        <CardHeader><CardTitle className="text-red-800 flex items-center gap-2 font-bold"><Activity className="h-5 w-5" /> Automações de Planilha</CardTitle></CardHeader>
        <CardContent className="flex flex-wrap gap-4">
          {["convert-csv", "enrich-rgs", "adjust-vencimento", "merge-datas", "import-db"].map(id => (
            <Button key={id} variant="outline" className={`bg-white border-red-200 text-red-700 h-auto py-3 px-6 flex flex-col items-start min-w-[200px] ${id === "merge-datas" && passoMerge === 2 ? "border-yellow-500 bg-yellow-50" : id === "import-db" ? "border-emerald-500 bg-emerald-50 text-emerald-800" : ""}`} onClick={() => handleAcaoAutomacao(id)}>
              <div className="flex items-center gap-2 font-bold">
                {loadingAcao === id ? <Loader2 className="animate-spin h-4 w-4" /> : 
                 id === "merge-datas" && passoMerge === 2 ? <GitMerge className="text-yellow-600 animate-pulse h-4 w-4" /> : 
                 id === "import-db" ? <Database className="h-4 w-4 text-emerald-600" /> : <FileSpreadsheet className="h-4 w-4" />}
                {id === "merge-datas" && passoMerge === 2 ? "👉 CLIQUE P/ PLANILHA 2" : 
                 id === "convert-csv" ? "1. CSV em Excel" : id === "enrich-rgs" ? "2. Localizar RGs" : id === "adjust-vencimento" ? "3. +6 Meses" : id === "merge-datas" ? "4. Cruzar ADM + ID" : "5. Subir para BD"}
              </div>
              <span className={`text-[10px] ${id === "import-db" ? "text-emerald-600" : "text-red-600"}`}>
                {id === "merge-datas" && passoMerge === 2 ? "Agora a ID CONTROL" : id === "import-db" ? "Gravar no Supabase" : "Clique p/ Selecionar"}
              </span>
            </Button>
          ))}
        </CardContent>
      </Card>
      */}

      {/* Controle do Robo4 desativado conforme solicitação. Descomente abaixo para reativar. */}
      {/* 
      {usuario?.perfil === "superadmin" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="border-2 border-blue-200 bg-blue-50/10">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div className="space-y-1">
                <CardTitle className="text-blue-800 flex items-center gap-2 font-bold">
                  <Activity className="h-5 w-5" /> Controle do Robo4
                </CardTitle>
                <p className="text-xs text-blue-600">Status atual: {roboAtivo ? "Ativo" : "Inativo"}</p>
              </div>
              <div className="flex items-center gap-2">
                {carregandoRobo && <Loader2 className="h-4 w-4 animate-spin text-blue-600" />}
                <Switch 
                  checked={roboAtivo} 
                  onCheckedChange={handleToggleRobo} 
                  disabled={carregandoRobo}
                />
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 p-4 bg-white rounded-lg border border-blue-100 italic text-sm text-blue-700">
                {roboAtivo ? (
                  <><Play className="h-5 w-5 text-green-500 fill-current" /> O Robô está monitorando novas solicitações...</>
                ) : (
                  <><Pause className="h-5 w-5 text-red-500 fill-current" /> O Robô está em pausa.</>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-slate-200 bg-white">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-slate-800 flex items-center gap-2 font-bold text-sm">
                <FileText className="h-5 w-5" /> Histórico do Robô
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={handleLimparHistorico} className="text-xs text-slate-500 hover:text-red-600">
                Limpar
              </Button>
            </CardHeader>
            <CardContent>
              <div className="h-[120px] overflow-y-auto space-y-2 pr-2 text-[11px] font-mono">
                {historicoRobo.length === 0 ? (
                  <div className="text-slate-400 text-center py-8">Nenhum evento registrado</div>
                ) : (
                  historicoRobo.map((item, i) => (
                    <div key={i} className="flex gap-2 border-b border-slate-50 pb-1">
                      <span className="text-slate-400 shrink-0">[{item.timestamp}]</span>
                      <span className={item.type === 'error' ? 'text-red-500' : 'text-slate-700'}>{item.message}</span>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
      */}

      <GraficoProdutividadeUsuarios />
    </div>
  )
}
