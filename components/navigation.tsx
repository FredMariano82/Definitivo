"use client"

import { useState, useEffect } from "react"
import { useTheme } from "@/contexts/theme-context"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { useAuth } from "../contexts/auth-context"
import { CheckCircle, FileText, Users, BarChart3, HeadphonesIcon, Crown, DollarSign, Crosshair, ChevronLeft, ChevronRight, Key, Monitor, ClipboardCheck, Video, ChevronDown } from "lucide-react"
import { getSolicitacoesByDepartamento } from "../services/solicitacoes-service"
import { getLiberacaoStatus } from "./ui/status-badges"
import { converterDataBrParaDate, getCurrentDate } from "../utils/date-helpers"

interface MenuItem {
  href?: string;
  label: string;
  icon: any;
  className?: string;
  hasAlert?: boolean;
  subItems?: { href: string; label: string; icon: any }[];
}

interface NavigationProps {
  isCollapsed?: boolean;
  onToggle?: () => void;
}

export default function Navigation({ isCollapsed, onToggle }: NavigationProps) {
  const { isDarkMode } = useTheme()
  const { usuario } = useAuth()
  const pathname = usePathname()
  const [alertaLiberacoes, setAlertaLiberacoes] = useState(false)
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({})

  const toggleMenu = (label: string) => {
    setExpandedMenus(prev => ({
      ...prev,
      [label]: !prev[label]
    }))
  }

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
  const getMenuButtons = (): MenuItem[] => {
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
            href: "/admin/kanban",
            label: "Tarefas",
            icon: BarChart3,
            className: getButtonClass("/admin/kanban"),
          },
          {
            href: "/admin/todas-solicitacoes",
            label: "Todas as Solicitações",
            icon: FileText,
            className: getButtonClass("/admin/todas-solicitacoes"),
          },
          {
            href: "/op/painel",
            label: "Gestão Operacional",
            icon: Users,
            className: getButtonClass("/op/painel"),
          },
          {
            href: "/op/tatico",
            label: "Painél Tático",
            icon: Crosshair,
            className: getButtonClass("/op/tatico"),
          },
          {
            href: "/admin/controle-chaves",
            label: "Controle de Chaves",
            icon: Key,
            className: getButtonClass("/admin/controle-chaves"),
          },
          {
            href: "/admin/financeiro",
            label: "Financeiro",
            icon: DollarSign,
            className: getButtonClass("/admin/financeiro"),
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
            href: "/admin/kanban",
            label: "Tarefas",
            icon: BarChart3,
            className: getButtonClass("/admin/kanban"),
          },
          {
            href: "/admin/todas-solicitacoes",
            label: "Todas as Solicitações",
            icon: FileText,
            className: getButtonClass("/admin/todas-solicitacoes"),
          },
          {
            label: "Monitoramento CFTV",
            icon: Monitor,
            subItems: [
              { href: "/op/cftv/manutencao", label: "CFTV Manutenções", icon: Video },
              { href: "/op/cftv/ronda-dvr", label: "Ronda dos DVR's", icon: ClipboardCheck },
              { href: "/op/cftv/checklist", label: "Checklist Central", icon: CheckCircle },
            ]
          },
          {
            href: "/op/painel",
            label: "Gestão Operacional",
            icon: Users,
            className: getButtonClass("/op/painel"),
          },
          {
            href: "/op/tatico",
            label: "Painél Tático",
            icon: Crosshair,
            className: getButtonClass("/op/tatico"),
          },
          {
            href: "/admin/controle-chaves",
            label: "Controle de Chaves",
            icon: Key,
            className: getButtonClass("/admin/controle-chaves"),
          },
          {
            href: "/admin/financeiro",
            label: "Financeiro",
            icon: DollarSign,
            className: getButtonClass("/admin/financeiro"),
          },
        ]

      case "operador":
        return [
          {
            href: "/admin/kanban",
            label: "Tarefas",
            icon: BarChart3,
            className: getButtonClass("/admin/kanban"),
          },
          {
            href: "/admin/todas-solicitacoes",
            label: "Todas as Solicitações",
            icon: FileText,
            className: getButtonClass("/admin/todas-solicitacoes"),
          },
          {
            label: "Monitoramento CFTV",
            icon: Monitor,
            subItems: [
              { href: "/op/cftv/manutencao", label: "CFTV Manutenções", icon: Video },
              { href: "/op/cftv/ronda-dvr", label: "Ronda dos DVR's", icon: ClipboardCheck },
              { href: "/op/cftv/checklist", label: "Checklist Central", icon: CheckCircle },
            ]
          },
          {
            href: "/op/tatico",
            label: "Painél Tático",
            icon: Crosshair,
            className: getButtonClass("/op/tatico"),
          },
          {
            href: "/admin/controle-chaves",
            label: "Controle de Chaves",
            icon: Key,
            className: getButtonClass("/admin/controle-chaves"),
          },
        ]

      default:
        return []
    }
  }

  const menuButtons = getMenuButtons()

  return (
    <aside className={`fixed left-0 top-[88px] bottom-0 ${isCollapsed ? 'w-20' : 'w-72'} bg-slate-900/95 backdrop-blur-md border-r border-white/10 z-40 overflow-y-auto hidden md:block transition-all duration-300`}>
      <style jsx>{`
        @keyframes pulse-glow {
          0%, 100% {
            box-shadow: 0 0 5px rgba(255, 255, 255, 0.4);
            border-color: rgba(255, 255, 255, 0.5);
          }
          50% {
            box-shadow: 0 0 15px rgba(255, 255, 255, 0.7);
            border-color: rgba(255, 255, 255, 0.8);
          }
        }
        
        .animate-pulse-glow {
          animation: pulse-glow 2s ease-in-out infinite;
        }
      `}</style>

      <div className={`p-4 space-y-2 ${isCollapsed ? 'px-2' : ''}`}>
        {!isCollapsed && (
          <div className="px-4 py-2 mb-4 flex items-center justify-between">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Menu Principal</p>
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggle}
              className="h-6 w-6 p-0 hover:bg-white/10 text-slate-500 hover:text-white rounded-md transition-colors"
              title="Recolher Menu"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </div>
        )}
        
        {isCollapsed && (
          <div className="px-4 py-2 mb-4 flex justify-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggle}
              className="h-8 w-8 p-0 hover:bg-white/10 text-slate-500 hover:text-white rounded-lg transition-colors"
              title="Expandir Menu"
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        )}

        {menuButtons.map((button) => {
          const IconComponent = button.icon
          const isActive = button.href ? (pathname === button.href || pathname?.startsWith(button.href + "/")) : false
          const isExpanded = expandedMenus[button.label]

          if (button.subItems) {
            return (
              <div key={button.label} className="space-y-1">
                <Button
                  className={`
                    w-full ${isCollapsed ? 'justify-center' : 'justify-start'} rounded-xl px-4 py-6 transition-soft mb-1
                    bg-transparent text-slate-300 hover:bg-white/5 hover:text-white border-transparent
                  `}
                  variant="ghost"
                  onClick={() => toggleMenu(button.label)}
                >
                  <span className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3 w-full'}`}>
                    <IconComponent className={`h-5 w-5 ${isActive ? "text-white" : "text-slate-400 group-hover:text-blue-400"} ${isCollapsed ? 'h-6 w-6' : ''}`} />
                    {!isCollapsed && (
                      <>
                        <span className="font-medium tracking-wide flex-1 text-left">{button.label}</span>
                        <ChevronDown className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                      </>
                    )}
                  </span>
                </Button>
                
                {isExpanded && !isCollapsed && (
                  <div className="pl-6 space-y-1">
                    {button.subItems.map((subItem) => {
                      const SubIcon = subItem.icon
                      const isSubActive = pathname === subItem.href
                      return (
                        <Link key={subItem.href} href={subItem.href!} className="block group">
                          <Button
                            className={`
                              w-full justify-start rounded-lg px-3 py-4 transition-soft mb-1 h-8
                              ${isSubActive ? "bg-blue-600/20 text-blue-400" : "bg-transparent text-slate-400 hover:bg-white/5 hover:text-white"}
                            `}
                            variant="ghost"
                          >
                            <span className="flex items-center gap-2">
                              <SubIcon className="h-4 w-4" />
                              <span className="text-sm">{subItem.label}</span>
                            </span>
                          </Button>
                        </Link>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          }

          return (
            <Link key={button.href} href={button.href!} className="block group">
              <Button
                className={`
                  w-full ${isCollapsed ? 'justify-center' : 'justify-start'} rounded-xl px-4 py-6 transition-soft mb-1
                  ${isActive
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-900/20"
                    : "bg-transparent text-slate-300 hover:bg-white/5 hover:text-white border-transparent"}
                  ${button.hasAlert && !isActive ? "animate-pulse-glow border-white/50" : ""}
                `}
                variant="ghost"
                asChild
              >
                <span className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3 w-full'}`}>
                  <IconComponent className={`h-5 w-5 ${isActive ? "text-white" : "text-slate-400 group-hover:text-blue-400"} ${isCollapsed ? 'h-6 w-6' : ''}`} />
                  {!isCollapsed && <span className="font-medium tracking-wide">{button.label}</span>}
                  {button.hasAlert && !isCollapsed && (
                    <span className="ml-auto relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                    </span>
                  )}
                </span>
              </Button>
            </Link>
          )
        })}
      </div>

      {/* Footer do Sidebar */}
      <div className={`absolute bottom-0 left-0 right-0 p-6 border-t border-white/5 bg-slate-900/50 ${isCollapsed ? 'px-2 flex justify-center' : ''}`}>
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-blue-500/20 flex items-center justify-center border border-blue-500/30 shrink-0">
            <span className="text-xs font-bold text-blue-400">{usuario?.nome?.charAt(0)}</span>
          </div>
          {!isCollapsed && (
            <div className="overflow-hidden">
              <p className="text-xs font-bold text-white truncate">{usuario?.nome}</p>
              <p className="text-[10px] text-slate-400 truncate">{usuario?.departamento}</p>
            </div>
          )}
        </div>
      </div>
    </aside>
  )
}
