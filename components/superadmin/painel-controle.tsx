"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { FileText, CheckCircle, BarChart3, Settings, Database, Shield, Activity, FileSpreadsheet, Search, Loader2, GitMerge } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState, useRef } from "react"
import { toast } from "sonner"

export default function PainelControle() {
  const router = useRouter()

  const [loading, setLoading] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [currentAction, setCurrentAction] = useState<string | null>(null)
  const [firstFile, setFirstFile] = useState<File | null>(null)
  const [passoMerge, setPassoMerge] = useState<number>(1)

  const handleNavigate = (id: string) => {
    if (id === "convert-csv" || id === "enrich-rgs" || id === "adjust-vencimento" || id === "merge-datas") {
      setCurrentAction(id)
      if (id === "merge-datas" && firstFile) {
        // Se já escolheu o primeiro, o botão agora dispara o segundo
        fileInputRef.current?.click()
      } else {
        setFirstFile(null)
        setPassoMerge(1)
        fileInputRef.current?.click()
      }
      return
    }

    switch (id) {
      case "dashboard": router.push("/admin/dashboard"); break
      case "todas-solicitacoes": router.push("/admin/todas-solicitacoes"); break
      case "nova-solicitacao-admin": router.push("/admin/nova-solicitacao"); break
      case "consulta-solicitacoes-gestor": router.push("/gestor/consulta"); break
      case "solicitacoes-pendentes": router.push("/aprovador/pendentes"); break
      case "nova-solicitacao": router.push("/solicitante/nova-solicitacao"); break
      case "solicitacoes-departamento": router.push("/solicitante/departamento"); break
      case "migracao-dados": router.push("/suporte/migracao"); break
      case "consultar-solicitacoes": router.push("/suporte/consulta"); break
      case "gestao-usuarios": router.push("/superadmin/usuarios"); break
      case "cftv-manutencao": router.push("/admin/kanban?category=manutencao_cftv"); break
      case "cftv-ronda": router.push("/admin/kanban?category=ronda_dvr"); break
      case "cftv-checklist": router.push("/admin/kanban?category=checklist_central"); break
      default: console.warn(`Rota não encontrada: ${id}`)
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

    setLoading(currentAction)
    const toastId = toast.loading("Processando...")

    try {
      const formData = new FormData()
      if (currentAction === "merge-datas") {
        formData.append("file1", firstFile as File)
        formData.append("file2", files[0])
      } else {
        formData.append("file", files[0])
      }

      const endpoints: Record<string, string> = {
        "convert-csv": "/api/admin/convert-csv",
        "enrich-rgs": "/api/admin/enrich-rgs",
        "adjust-vencimento": "/api/admin/adjust-vencimento",
        "merge-datas": "/api/admin/merge-datas"
      }
      
      const response = await fetch(endpoints[currentAction], { method: "POST", body: formData })
      if (!response.ok) throw new Error("Erro no processamento")

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = response.headers.get("Content-Disposition")?.split("filename=")[1]?.replace(/"/g, "") || "resultado.xlsx"
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast.success("Sucesso!", { id: toastId })
    } catch (error: any) {
      toast.error("Falha no processo", { id: toastId })
    } finally {
      setLoading(null); setCurrentAction(null); setFirstFile(null); setPassoMerge(1)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  const acessosRapidos = [
    {
      categoria: "Ferramentas de Automação",
      cor: "bg-red-500",
      icone: <Activity className="h-5 w-5" />,
      itens: [
        { id: "convert-csv", label: "1. CSV em Excel", descricao: "Limpa acentos" },
        { id: "enrich-rgs", label: "2. Localizar RGs", descricao: "ID Control" },
        { id: "adjust-vencimento", label: "3. +6 Meses", descricao: "Coluna D" },
        { id: "merge-datas", label: "4. Cruzar ADM + ID", descricao: "Sincroniza datas" },
      ],
    },
    {
        categoria: "Administração",
        cor: "bg-blue-500",
        icone: <Settings className="h-5 w-5" />,
        itens: [
          { id: "dashboard", label: "Dashboard Geral", descricao: "Métricas e relatórios" },
        ],
      },
    {
      categoria: "Monitoramento CFTV",
      cor: "bg-emerald-600",
      icone: <Shield className="h-5 w-5" />,
      itens: [
        { id: "cftv-manutencao", label: "CFTV Manutenções", descricao: "Status de reparos" },
        { id: "cftv-ronda", label: "Ronda dos DVR's", descricao: "Verificação de gravação" },
        { id: "cftv-checklist", label: "Checklist Central", icon: <CheckCircle className="h-4 w-4" />, descricao: "Verificação diária" },
      ],
    },
  ]

  return (
    <div className="space-y-6">
      <input type="file" ref={fileInputRef} className="hidden" accept=".csv,.xlsx,.xls" onChange={handleFileChange} onClick={(e) => (e.currentTarget.value = "")} />
      <div className="text-center">
        <h1 className="text-3xl font-bold text-white">Painel SuperAdmin</h1>
        <p className="text-slate-300">Ferramentas de Automação</p>
      </div>

      <div className="grid gap-6">
        {acessosRapidos.map((categoria) => (
          <Card key={categoria.categoria} className="bg-white/10 backdrop-blur border-white/20">
            <CardHeader><CardTitle className="text-white flex items-center gap-2"><div className={`p-2 rounded-lg ${categoria.cor}`}>{categoria.icone}</div>{categoria.categoria}</CardTitle></CardHeader>
            <CardContent>
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {categoria.itens.map((item) => (
                  <Button key={item.id} variant="outline" className="h-auto p-4 text-left justify-start bg-white/5 border-white/20 text-white" disabled={loading !== null} onClick={() => handleNavigate(item.id)}>
                    <div className="flex items-center gap-3">
                      {loading === item.id ? <Loader2 className="animate-spin h-5 w-5" /> : 
                       item.id === "merge-datas" && passoMerge === 2 ? <GitMerge className="text-yellow-400 animate-pulse h-5 w-5" /> : <FileText className="h-5 w-5" />}
                      <div>
                        <div className="font-medium">{item.id === "merge-datas" && passoMerge === 2 ? "👉 CLIQUE P/ PLANILHA 2" : item.label}</div>
                        <div className="text-xs text-slate-300">{item.id === "merge-datas" && passoMerge === 2 ? "Selecione a ID CONTROL" : item.descricao}</div>
                      </div>
                    </div>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
