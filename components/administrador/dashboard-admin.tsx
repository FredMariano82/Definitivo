"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { TrendingUp, FileText, DollarSign, AlertTriangle, Filter, X, Play, Pause, FileSpreadsheet, Search, Loader2, Activity, GitMerge } from "lucide-react"
import { getAllSolicitacoes } from "../../services/solicitacoes-service"
import RelatorioModal from "./relatorio-modal"
import { EconomiasService, type EconomiaMetricas } from "../../services/economias-service"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import GraficoProdutividadeUsuarios from "./grafico-produtividade-usuarios"
import PageHeader from "@/components/page-header"
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"

export default function DashboardAdmin() {
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
        const dados = await getAllSolicitacoes()
        setSolicitacoes(dados)
        const economia = await EconomiasService.buscarMetricasEconomia({ solicitante: filtroSolicitante !== "todos" ? filtroSolicitante : undefined })
        setMetricasEconomia(economia)
      } catch (e) { console.error(e) } finally { setCarregando(false) }
    }
    buscarDados()
  }, [filtroSolicitante])

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
      <PageHeader title="Dashboard Administrativo" subtitle="Controle total do sistema" />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card><CardHeader><CardTitle className="text-sm">Total</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{metricas.total}</div></CardContent></Card>
        <Card><CardHeader><CardTitle className="text-sm">Pendentes</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-orange-600">{metricas.pendentes}</div></CardContent></Card>
        <Card><CardHeader><CardTitle className="text-sm">Custo Checagem</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-emerald-600">R$ {metricas.custo}</div></CardContent></Card>
        <Card><CardHeader><CardTitle className="text-sm">Economia</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-emerald-600">R$ {metricasEconomia.totalEconomizado.toFixed(2)}</div></CardContent></Card>
      </div>

      <Card className="border-2 border-red-200 bg-red-50/10">
        <CardHeader><CardTitle className="text-red-800 flex items-center gap-2 font-bold"><Activity className="h-5 w-5" /> Automações de Planilha</CardTitle></CardHeader>
        <CardContent className="flex flex-wrap gap-4">
          {["convert-csv", "enrich-rgs", "adjust-vencimento", "merge-datas"].map(id => (
            <Button key={id} variant="outline" className={`bg-white border-red-200 text-red-700 h-auto py-3 px-6 flex flex-col items-start min-w-[200px] ${id === "merge-datas" && passoMerge === 2 ? "border-yellow-500 bg-yellow-50" : ""}`} onClick={() => handleAcaoAutomacao(id)}>
              <div className="flex items-center gap-2 font-bold">
                {loadingAcao === id ? <Loader2 className="animate-spin h-4 w-4" /> : 
                 id === "merge-datas" && passoMerge === 2 ? <GitMerge className="text-yellow-600 animate-pulse h-4 w-4" /> : <FileSpreadsheet className="h-4 w-4" />}
                {id === "merge-datas" && passoMerge === 2 ? "👉 CLIQUE P/ PLANILHA 2" : 
                 id === "convert-csv" ? "1. CSV em Excel" : id === "enrich-rgs" ? "2. Localizar RGs" : id === "adjust-vencimento" ? "3. +6 Meses" : "4. Cruzar ADM + ID"}
              </div>
              <span className="text-[10px] text-red-600">
                {id === "merge-datas" && passoMerge === 2 ? "Agora a ID CONTROL" : "Clique p/ Selecionar"}
              </span>
            </Button>
          ))}
        </CardContent>
      </Card>

      <GraficoProdutividadeUsuarios solicitacoes={solicitacoes} />
    </div>
  )
}
