"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { useAuth } from "../contexts/auth-context"
import { CheckCircle, FileText, Users, BarChart3, HeadphonesIcon, Crown } from "lucide-react"
import { getSolicitacoesByDepartamento } from "../services/solicitacoes-service"
import { getLiberacaoStatus } from "./ui/status-badges"
import { converterDataBrParaDate, getCurrentDate } from "../utils/date-helpers"

export default function Navigation() {
  const { usuario } = useAuth()
  const pathname = usePathname()
  const [alertaLiberacoes, setAlertaLiberacoes] = useState(false)

  // Função para verificar prestadores com data final próxima do vencimento
  const verificarLiberacoesUrgentes = async () => {
    if (!usuario?.departamento) return

    try {
      const solicitacoes = await getSolicitacoesByDepartamento(usuario.departamento)

      // Filtrar prestadores com liberação "Ok"
      const prestadoresLiberados = solicitacoes
        .filter((solicitacao) => solicitacao.departamento === usuario?.departamento)
        .filter((solicitacao) =>
          solicitacao.prestadores.some((p: any) => {
            const status = getLiberacaoStatus(p, solicitacao.dataFinal)
            return String(status).toLowerCase() === "ok"
          }),
        )
        .flatMap((solicitacao) =>
          solicitacao.prestadores
            .filter((prestador: any) => {
              const status = getLiberacaoStatus(prestador, solicitacao.dataFinal)
              return String(status).toLowerCase() === "ok"
            })
            .map((prestador: any) => ({
              solicitacao,
              prestador,
              dataFinal: solicitacao.dataFinal,
            })),
        )

      // Verificar se algum tem data final próxima (hoje ou amanhã)
      const hoje = getCurrentDate()
      hoje.setHours(0, 0, 0, 0)

      const temUrgentes = prestadoresLiberados.some(({ dataFinal }) => {
        if (!dataFinal) return false

        const dataFinalDate = converterDataBrParaDate(dataFinal)
        if (!dataFinalDate) return false

        dataFinalDate.setHours(0, 0, 0, 0)

        const diffTime = dataFinalDate.getTime() - hoje.getTime()
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

        // Considerar urgente se vence hoje (0 dias) ou amanhã (1 dia)
        return diffDays <= 1 && diffDays >= 0
      })

      setAlertaLiberacoes(temUrgentes)
    } catch (error) {
      console.error("Erro ao verificar liberações urgentes:", error)
    }
  }

  // Verificar liberações urgentes quando o componente montar e a cada 30 segundos
  useEffect(() => {
    if (usuario?.perfil === "solicitante") {
      verificarLiberacoesUrgentes()
      const interval = setInterval(verificarLiberacoesUrgentes, 30000)
      return () => clearInterval(interval)
    }
  }, [usuario])

  const getButtonClass = (path: string) => {
    const baseClass = "px-6 py-3 rounded-lg font-medium transition-all duration-200 flex items-center gap-2"
    const isActive = pathname === path || pathname?.startsWith(path + "/")

    if (isActive) {
      return `${baseClass} bg-slate-700 text-white hover:bg-slate-800 shadow-lg`
    }
    return `${baseClass} bg-white text-slate-700 hover:bg-slate-100 border border-slate-300 shadow-sm`
  }

  const getLiberacoesButtonClass = (path: string) => {
    const baseClass = getButtonClass(path)
    const isActive = pathname === path

    if (alertaLiberacoes && !isActive) {
      return `${baseClass} animate-pulse-red shadow-lg`
    }

    return baseClass
  }

  if (!usuario) return null

  // Mapeamento de Rotas por Perfil
  const getMenuButtons = () => {
    switch (usuario.perfil) {
      case "solicitante":
        return [
          {
            href: "/solicitante/nova-solicitacao",
            label: "Nova Solicitação",
            icon: FileText,
            className: getButtonClass("/solicitante/nova-solicitacao"),
          },

          {
            href: "/solicitante/checagens",
            label: "Checagens",
            icon: CheckCircle,
            className: getButtonClass("/solicitante/checagens"),
          },
          {
            href: "/solicitante/liberacoes",
            label: "Liberações",
            icon: CheckCircle,
            className: getLiberacoesButtonClass("/solicitante/liberacoes"),
            hasAlert: alertaLiberacoes,
          },
          {
            href: "/solicitante/departamento",
            label: "Solicitações do Departamento",
            icon: Users,
            className: getButtonClass("/solicitante/departamento"),
          },
        ]

      case "aprovador":
        return [
          {
            href: "/aprovador/pendentes",
            label: "Solicitações Pendentes",
            icon: CheckCircle,
            className: getButtonClass("/aprovador/pendentes"),
          },
        ]

      case "administrador":
        return [
          {
            href: "/admin/dashboard",
            label: "Dashboard",
            icon: BarChart3,
            className: getButtonClass("/admin/dashboard"),
          },
          {
            href: "/admin/todas-solicitacoes",
            label: "Todas as Solicitações",
            icon: FileText,
            className: getButtonClass("/admin/todas-solicitacoes"),
          },
          {
            href: "/admin/nova-solicitacao",
            label: "Nova Solicitação",
            icon: FileText,
            className: getButtonClass("/admin/nova-solicitacao"),
          },
          {
            href: "/admin/upload",
            label: "Upload Histórico",
            icon: Users,
            className: getButtonClass("/admin/upload"),
          },
          {
            href: "/admin/produtividade",
            label: "Produtividade",
            icon: BarChart3,
            className: getButtonClass("/admin/produtividade"),
          },
          {
            href: "/op/painel",
            label: "Gestão Operacional",
            icon: Users,
            className: getButtonClass("/op/painel"),
          },
        ]

      case "gestor":
        return [
          {
            href: "/gestor/consulta",
            label: "Consulta Solicitações",
            icon: BarChart3,
            className: getButtonClass("/gestor/consulta"),
          },
        ]

      case "recepcao":
        return [
          {
            href: "/recepcao/todas",
            label: "Todas as Solicitações",
            icon: FileText,
            className: getButtonClass("/recepcao/todas"),
          },
        ]

      case "suporte":
        return [
          {
            href: "/suporte/migracao",
            label: "Migração de Dados",
            icon: Users,
            className: getButtonClass("/suporte/migracao"),
          },
          {
            href: "/suporte/consulta",
            label: "Consultar Solicitações",
            icon: HeadphonesIcon,
            className: getButtonClass("/suporte/consulta"),
          },
        ]

      case "superadmin":
        return [
          {
            href: "/superadmin/painel",
            label: "Painel de Controle",
            icon: Crown,
            className: getButtonClass("/superadmin/painel"),
          },
          {
            href: "/admin/dashboard", // Reutiliza rota de admin
            label: "Dashboard",
            icon: BarChart3,
            className: getButtonClass("/admin/dashboard"),
          },
          {
            href: "/admin/todas-solicitacoes",
            label: "Todas as Solicitações",
            icon: FileText,
            className: getButtonClass("/admin/todas-solicitacoes"),
          },
          {
            href: "/admin/nova-solicitacao",
            label: "Nova Solicitação",
            icon: FileText,
            className: getButtonClass("/admin/nova-solicitacao"),
          },
          {
            href: "/admin/upload",
            label: "Upload Histórico",
            icon: Users,
            className: getButtonClass("/admin/upload"),
          },
          {
            href: "/op/painel",
            label: "Gestão Operacional",
            icon: Users,
            className: getButtonClass("/op/painel"),
          },
        ]

      default:
        return []
    }
  }

  const menuButtons = getMenuButtons()

  return (
    <div className="sticky top-[89px] z-40 w-full px-4 py-4 pointer-events-none">
      <style jsx>{`
        @keyframes pulse-glow {
          0%, 100% {
            box-shadow: 0 0 5px rgba(220, 38, 38, 0.4);
            border-color: rgba(220, 38, 38, 0.5);
          }
          50% {
            box-shadow: 0 0 15px rgba(220, 38, 38, 0.7);
            border-color: rgba(220, 38, 38, 0.8);
          }
        }
        
        .animate-pulse-glow {
          animation: pulse-glow 2s ease-in-out infinite;
        }
      `}</style>
      <div className="max-w-7xl mx-auto pointer-events-auto">
        <div className="glass shadow-xl rounded-2xl p-2 flex flex-wrap gap-2 justify-center border-white/40">
          {menuButtons.map((button) => {
            const IconComponent = button.icon
            const isActive = pathname === button.href || pathname?.startsWith(button.href + "/")

            return (
              <Link key={button.href} href={button.href}>
                <Button
                  className={`
                    ${button.className.split("rounded-lg")[0]} rounded-xl px-5 py-6 transition-soft
                    ${isActive
                      ? "bg-slate-800 text-white shadow-lg ring-2 ring-blue-500/20"
                      : "bg-white/50 text-slate-700 hover:bg-white hover:translate-y-[-2px] hover:shadow-md border-transparent"}
                    ${button.hasAlert && !isActive ? "animate-pulse-glow border-red-500/50" : ""}
                  `}
                  variant="ghost"
                  asChild
                >
                  <span className="flex items-center gap-3">
                    <IconComponent className={`h-5 w-5 ${isActive ? "text-blue-400" : "text-slate-500"}`} />
                    <span className="font-semibold tracking-wide">{button.label}</span>
                    {button.hasAlert && (
                      <span className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                      </span>
                    )}
                  </span>
                </Button>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
