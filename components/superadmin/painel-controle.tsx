"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { FileText, CheckCircle, BarChart3, Settings, Database, Shield, Activity, FileSpreadsheet, Search, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState, useRef } from "react"
import { toast } from "sonner"

export default function PainelControle() {
  const router = useRouter()

  const [loading, setLoading] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [currentAction, setCurrentAction] = useState<string | null>(null)

  const handleNavigate = (id: string) => {
    if (id === "convert-csv" || id === "enrich-rgs") {
      setCurrentAction(id)
      fileInputRef.current?.click()
      return
    }

    switch (id) {
      case "dashboard":
        router.push("/admin/dashboard")
        break
      case "todas-solicitacoes":
        router.push("/admin/todas-solicitacoes")
        break
      case "nova-solicitacao-admin":
        router.push("/admin/nova-solicitacao")
        break
      case "consulta-solicitacoes-gestor":
        router.push("/gestor/consulta")
        break
      case "solicitacoes-pendentes":
        router.push("/aprovador/pendentes")
        break
      case "nova-solicitacao":
        router.push("/solicitante/nova-solicitacao")
        break
      case "solicitacoes-departamento":
        router.push("/solicitante/departamento")
        break
      case "migracao-dados":
        router.push("/suporte/migracao")
        break
      case "consultar-solicitacoes":
        router.push("/suporte/consulta")
        break
      case "gestao-usuarios":
        router.push("/superadmin/usuarios")
        break
      default:
        console.warn(`Rota não encontrada para ID: ${id}`)
    }
  }

  const acessosRapidos = [
    {
      categoria: "Administração",
      cor: "bg-blue-500",
      icone: <Settings className="h-5 w-5" />,
      itens: [
        { id: "dashboard", label: "Dashboard Geral", descricao: "Métricas e relatórios" },
        { id: "gestao-usuarios", label: "Gestão de Usuários (MVP)", descricao: "Criar contas, senhas e perfis de departamentos" },
        { id: "todas-solicitacoes", label: "Todas Solicitações", descricao: "Gerenciar todas as solicitações" },
        { id: "nova-solicitacao-admin", label: "Nova Solicitação (Admin)", descricao: "Criar solicitação como admin" },
      ],
    },
    {
      categoria: "Gestão",
      cor: "bg-green-500",
      icone: <BarChart3 className="h-5 w-5" />,
      itens: [
        { id: "consulta-solicitacoes-gestor", label: "Consulta Gestor", descricao: "Visão gerencial das solicitações" },
      ],
    },
    {
      categoria: "Aprovação",
      cor: "bg-orange-500",
      icone: <CheckCircle className="h-5 w-5" />,
      itens: [
        { id: "solicitacoes-pendentes", label: "Solicitações Pendentes", descricao: "Aprovar/reprovar solicitações" },
      ],
    },
    {
      categoria: "Solicitações",
      cor: "bg-purple-500",
      icone: <FileText className="h-5 w-5" />,
      itens: [
        { id: "nova-solicitacao", label: "Nova Solicitação", descricao: "Criar nova solicitação" },
        {
          id: "solicitacoes-departamento",
          label: "Solicitações Departamento",
          descricao: "Ver solicitações do departamento",
        },
      ],
    },
    {
      categoria: "Suporte",
      cor: "bg-indigo-500",
      icone: <Database className="h-5 w-5" />,
      itens: [
        { id: "migracao-dados", label: "Migração de Dados", descricao: "Migrar dados históricos" },
        { id: "consultar-solicitacoes", label: "Consultar Solicitações", descricao: "Consulta avançada" },
      ],
    },
    {
      categoria: "Ferramentas de Automação",
      cor: "bg-red-500",
      icone: <Activity className="h-5 w-5" />,
      itens: [
        { id: "convert-csv", label: "Converte .csv em Excel", descricao: "Corrige acentos, nomes (Title Case) e colunas" },
        { id: "enrich-rgs", label: "Localizar RGs aqui", descricao: "Busca RGs no ID Control via Planilha" },
      ],
    },
  ]

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !currentAction) return

    setLoading(currentAction)
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
      setLoading(null)
      setCurrentAction(null)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  return (
    <div className="space-y-6">
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept={currentAction === "convert-csv" ? ".csv" : ".csv,.xlsx"}
        onChange={handleFileChange}
      />
      {/* Header */}
      <div className="text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Shield className="h-8 w-8 text-purple-600" />
          <h1 className="text-3xl font-bold text-white">Painel SuperAdmin (V2 - Automação)</h1>
        </div>
        <p className="text-slate-300">Acesso completo a todas as funcionalidades do sistema</p>
        <Badge variant="secondary" className="mt-2 bg-purple-100 text-purple-800">
          <Activity className="h-3 w-3 mr-1" />
          Privilégios Máximos
        </Badge>
      </div>

      {/* Cards de Acesso Rápido */}
      <div className="grid gap-6">
        {acessosRapidos.map((categoria) => (
          <Card key={categoria.categoria} className="bg-white/10 backdrop-blur border-white/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <div className={`p-2 rounded-lg ${categoria.cor}`}>{categoria.icone}</div>
                {categoria.categoria}
              </CardTitle>
              <CardDescription className="text-slate-300">
                Funcionalidades de {categoria.categoria.toLowerCase()}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {categoria.itens.map((item) => (
                  <Button
                    key={item.id}
                    variant="outline"
                    className="h-auto p-4 text-left justify-start bg-white/5 border-white/20 hover:bg-white/10 text-white hover:text-white"
                    disabled={loading !== null}
                    onClick={() => handleNavigate(item.id)}
                  >
                    <div className="flex items-center gap-3 w-full">
                      {loading === item.id ? (
                        <Loader2 className="h-5 w-5 animate-spin text-white shrink-0" />
                      ) : (
                        item.id === "convert-csv" ? <FileSpreadsheet className="h-5 w-5 text-red-300 shrink-0" /> :
                        item.id === "enrich-rgs" ? <Search className="h-5 w-5 text-red-300 shrink-0" /> : null
                      )}
                      <div>
                        <div className="font-medium">{item.label}</div>
                        <div className="text-xs text-slate-300 mt-1">{item.descricao}</div>
                      </div>
                    </div>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Estatísticas Rápidas */}
      <Card className="bg-white/10 backdrop-blur border-white/20">
        <CardHeader>
          <CardTitle className="text-white">Acesso Total Habilitado</CardTitle>
          <CardDescription className="text-slate-300">
            Como SuperAdmin, você tem acesso a todas as{" "}
            {acessosRapidos.reduce((total, cat) => total + cat.itens.length, 0)} funcionalidades
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {acessosRapidos.map((cat) => (
              <Badge key={cat.categoria} variant="outline" className="border-white/30 text-white">
                {cat.categoria}: {cat.itens.length} funções
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
