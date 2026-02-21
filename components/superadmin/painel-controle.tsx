"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { FileText, CheckCircle, BarChart3, Settings, Database, Shield, Activity } from "lucide-react"
import { useRouter } from "next/navigation"

export default function PainelControle() {
  const router = useRouter()

  const handleNavigate = (id: string) => {
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
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Shield className="h-8 w-8 text-purple-600" />
          <h1 className="text-3xl font-bold text-white">Painel SuperAdmin</h1>
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
                    onClick={() => handleNavigate(item.id)}
                  >
                    <div>
                      <div className="font-medium">{item.label}</div>
                      <div className="text-xs text-slate-300 mt-1">{item.descricao}</div>
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
