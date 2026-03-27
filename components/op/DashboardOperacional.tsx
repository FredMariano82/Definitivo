"use client"

import { useState, useEffect } from "react"
import { format, startOfDay, parseISO } from "date-fns"
import { ptBR } from "date-fns/locale"
import { 
    Users, 
    CheckCircle2, 
    Calendar, 
    AlertTriangle, 
    UserPlus,
    Clock,
    Shield,
    TrendingUp,
    Sparkles,
    MessageSquare,
    Bot,
    XCircle
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { OpServiceV2, OpEquipe, OpEscalaDiaria, OpEvento } from "@/services/op-service-v2"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { OraculoChat } from "./OraculoChat"

export default function DashboardOperacional() {
    const [stats, setStats] = useState({
        total: 0,
        trabalhando: 0,
        folga: 0,
        faltas: 0,
        atestados: 0,
        vspp: 0,
        reciclagemVencendo: 0
    })
    const [loading, setLoading] = useState(true)
    const [eventosProximos, setEventosProximos] = useState<OpEvento[]>([])
    const [isOraculoOpen, setIsOraculoOpen] = useState(false)

    useEffect(() => {
        loadDashboardData()
    }, [])

    const loadDashboardData = async () => {
        setLoading(true)
        try {
            const hoje = startOfDay(new Date())
            const hojeStr = format(hoje, 'yyyy-MM-dd')
            
            const [equipe, excecoes, eventos] = await Promise.all([
                OpServiceV2.getEquipe(),
                OpServiceV2.getEscalasPeriodo(hojeStr, hojeStr),
                OpServiceV2.getEventosPeriodo(hojeStr, format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'))
            ])

            let trabalhando = 0
            let folga = 0
            let faltas = 0
            let atestados = 0
            let vspp = 0
            let reciclagemVencendo = 0

            equipe.forEach(membro => {
                const isVSPP = (membro.tipo_servico?.toUpperCase() === 'VSPP') || (membro.funcao?.toUpperCase().includes('VSPP'))
                if (isVSPP) vspp++

                // Check status today
                const statusTeorico = OpServiceV2.getTrabalhaNoDia(membro, hoje, [])
                const excecao = excecoes.find(ex => ex.colaborador_id === membro.id)
                
                let status = statusTeorico ? 'Trabalhando' : 'Folga'
                if (excecao) status = excecao.status_dia
                
                if (status === 'Trabalhando') trabalhando++
                else if (status === 'Folga') folga++
                else if (status === 'Falta') faltas++
                else if (status === 'Atestado') atestados++

                // Reciclagem (próximos 30 dias)
                if (membro.data_reciclagem) {
                    const dataRec = new Date(membro.data_reciclagem)
                    const diff = (dataRec.getTime() - hoje.getTime()) / (1000 * 3600 * 24)
                    if (diff <= 30) reciclagemVencendo++
                }
            })

            setStats({
                total: equipe.length,
                trabalhando,
                folga,
                faltas,
                atestados,
                vspp,
                reciclagemVencendo
            })
            setEventosProximos(eventos.slice(0, 5))

        } catch (error) {
            console.error("Erro ao carregar dashboard:", error)
        } finally {
            setLoading(false)
        }
    }

    if (loading) return (
        <div className="flex items-center justify-center p-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
    )

    return (
        <div className="space-y-6 animate-in fade-in duration-700">
            {/* Grid Principal de KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="border-none shadow-xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-[32px] overflow-hidden">
                    <CardContent className="p-8">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md">
                                <Users className="h-6 w-6 text-white" />
                            </div>
                            <TrendingUp className="h-5 w-5 text-emerald-400" />
                        </div>
                        <p className="text-white/70 text-xs font-black uppercase tracking-widest">Efetivo Total</p>
                        <h2 className="text-5xl font-black mt-1 leading-none">{stats.total}</h2>
                        <p className="text-white/50 text-[10px] font-bold mt-4 uppercase tracking-tighter">Colaboradores Ativos</p>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-xl bg-white rounded-[32px] border border-slate-100 overflow-hidden group hover:shadow-2xl transition-all duration-500">
                    <CardContent className="p-8">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-3 bg-emerald-50 rounded-2xl group-hover:bg-emerald-500 transition-all duration-500">
                                <CheckCircle2 className="h-6 w-6 text-emerald-600 group-hover:text-white transition-all duration-500" />
                            </div>
                            <Badge className="bg-emerald-100 text-emerald-600 border-none font-black">HOJE</Badge>
                        </div>
                        <p className="text-slate-400 text-xs font-black uppercase tracking-widest">Em Serviço</p>
                        <h2 className="text-5xl font-black mt-1 leading-none text-slate-800">{stats.trabalhando}</h2>
                        <div className="flex items-center gap-2 mt-4 text-emerald-600 font-black text-[10px] uppercase">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            Operação Ativa
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-xl bg-white rounded-[32px] border border-slate-100 overflow-hidden group hover:shadow-2xl transition-all duration-500">
                    <CardContent className="p-8">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-3 bg-rose-50 rounded-2xl group-hover:bg-rose-500 transition-all duration-500">
                                <XCircle className="h-6 w-6 text-rose-600 group-hover:text-white transition-all duration-500" />
                            </div>
                            <Badge className="bg-rose-100 text-rose-600 border-none font-black">Ocorrência</Badge>
                        </div>
                        <p className="text-slate-400 text-xs font-black uppercase tracking-widest">Faltas / Atestados</p>
                        <h2 className="text-5xl font-black mt-1 leading-none text-slate-800">{stats.faltas + stats.atestados}</h2>
                        <p className="text-slate-400 text-[10px] font-bold mt-4 uppercase tracking-tighter">Impacto Operacional</p>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-xl bg-slate-900 text-white rounded-[32px] overflow-hidden">
                    <CardContent className="p-8">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-3 bg-white/10 rounded-2xl">
                                <Shield className="h-6 w-6 text-orange-400" />
                            </div>
                            <Badge className="bg-orange-500/20 text-orange-400 border-none font-black text-[9px]">CRÍTICO</Badge>
                        </div>
                        <p className="text-white/50 text-xs font-black uppercase tracking-widest">Efetivo VSPP</p>
                        <h2 className="text-5xl font-black mt-1 leading-none text-white">{stats.vspp}</h2>
                        <p className="text-white/30 text-[10px] font-bold mt-4 uppercase tracking-tighter">Prontos p/ Eventos</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Eventos Próximos */}
                <Card className="lg:col-span-2 border-none shadow-xl bg-white/70 backdrop-blur-md rounded-[40px] border border-white/20 overflow-hidden">
                    <CardHeader className="p-8 pb-4">
                        <CardTitle className="text-xl font-black text-slate-900 flex items-center gap-3">
                            <div className="p-2 bg-blue-50 rounded-xl">
                                <Calendar className="h-5 w-5 text-blue-600" />
                            </div>
                            Roadmap de Eventos
                        </CardTitle>
                        <CardDescription className="text-slate-500 font-bold">Próximos compromissos na agenda operacional.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-8 pt-0">
                        {eventosProximos.length === 0 ? (
                            <div className="py-10 text-center text-slate-400 font-bold italic">Nenhum evento planejado para os próximos 30 dias.</div>
                        ) : (
                            <div className="space-y-4">
                                {eventosProximos.map(ev => (
                                    <div key={ev.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-[24px] border border-slate-100 group hover:border-blue-200 hover:bg-white transition-all">
                                        <div className="flex items-center gap-4">
                                            <div className="h-12 w-1 w-1 rounded-full" style={{ backgroundColor: ev.cor || '#3b82f6' }} />
                                            <div>
                                                <p className="font-black text-slate-800 uppercase tracking-tight text-sm">{ev.nome}</p>
                                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-2">
                                                    <Clock className="h-3 w-3" /> {format(parseISO(ev.data_inicio), "dd 'de' MMMM", { locale: ptBR })}
                                                </p>
                                            </div>
                                        </div>
                                        <Badge variant="outline" className="border-slate-200 bg-white text-[10px] font-black uppercase py-1 px-3 rounded-full text-slate-500">
                                            {ev.local}
                                        </Badge>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Alertas de Reciclagem */}
                <Card className="border-none shadow-xl bg-white rounded-[40px] border border-slate-100 overflow-hidden">
                    <CardHeader className="p-8 pb-4">
                        <CardTitle className="text-xl font-black text-slate-900 flex items-center gap-3">
                            <div className="p-2 bg-rose-50 rounded-xl">
                                <AlertTriangle className="h-5 w-5 text-rose-600" />
                            </div>
                            Reciclagens Críticas
                        </CardTitle>
                        <CardDescription className="text-slate-500 font-bold">Alerta de vencimento nos próximos 30 dias.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-8 pt-0">
                        <div className="flex flex-col items-center justify-center py-8 text-center bg-rose-50/50 rounded-3xl border border-rose-100/50">
                            <h3 className="text-4xl font-black text-rose-600 leading-none">{stats.reciclagemVencendo}</h3>
                            <p className="text-[10px] font-black text-rose-400 uppercase tracking-[0.2em] mt-2">Vencendo em Breve</p>
                        </div>
                        <Button className="w-full mt-6 h-14 rounded-2xl bg-slate-900 text-white font-black uppercase text-xs tracking-widest hover:bg-slate-800 transition-all border-none">
                            Ver Relatório Completo
                        </Button>
                    </CardContent>
                </Card>
            </div>

            {/* BOTÃO FLUTUANTE DO ORÁCULO */}
            <div className="fixed bottom-8 right-8 z-50 flex flex-col items-end gap-4">
                {isOraculoOpen && (
                    <div className="w-[450px] shadow-2xl animate-in fade-in slide-in-from-bottom-10 duration-500">
                        <OraculoChat />
                    </div>
                )}
                
                <Button 
                    onClick={() => setIsOraculoOpen(!isOraculoOpen)}
                    className={`h-16 w-16 rounded-full shadow-2xl transition-all duration-500 hover:scale-110 active:scale-95 border-none
                        ${isOraculoOpen 
                            ? 'bg-rose-500 hover:bg-rose-600 text-white' 
                            : 'bg-gradient-to-br from-blue-600 to-indigo-700 text-white'}`}
                >
                    {isOraculoOpen ? <XCircle className="h-8 w-8" /> : <Bot className="h-8 w-8" />}
                    {!isOraculoOpen && (
                        <span className="absolute -top-1 -right-1 flex h-5 w-5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-5 w-5 bg-emerald-500 border-2 border-white items-center justify-center text-[8px] font-black">AI</span>
                        </span>
                    )}
                </Button>
            </div>
        </div>
    )
}
