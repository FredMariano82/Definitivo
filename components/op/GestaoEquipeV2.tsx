"use client"

import { useState, useEffect } from "react"
import { 
    format, 
    addMonths, 
    subMonths, 
    startOfMonth, 
    endOfMonth, 
    eachDayOfInterval, 
    isToday, 
    parseISO,
    startOfDay
} from "date-fns"
import { ptBR } from "date-fns/locale"
import { 
    ChevronLeft, 
    ChevronRight, 
    Calendar as CalendarIcon, 
    User, 
    Shield, 
    Info, 
    Clock, 
    Save, 
    MoreVertical, 
    Trash2,
    CheckCircle2,
    XCircle,
    AlertCircle,
    Plane,
    Plus,
    Settings,
    Filter,
    Search as SearchIcon,
    Star
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { OpServiceV2, OpEquipe, OpEscalaDiaria, OpEvento } from "@/services/op-service-v2"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { 
    Dialog, 
    DialogContent, 
    DialogHeader, 
    DialogTitle, 
    DialogFooter,
    DialogDescription
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"

export default function GestaoEquipeV2() {
    const [currentDate, setCurrentDate] = useState(new Date())
    const [equipe, setEquipe] = useState<OpEquipe[]>([])
    const [excecoes, setExcecoes] = useState<OpEscalaDiaria[]>([])
    const [eventos, setEventos] = useState<OpEvento[]>([])
    const [loading, setLoading] = useState(true)
    
    // Estados para Filtros
    const [filtroNome, setFiltroNome] = useState("")
    const [filtroEscala, setFiltroEscala] = useState("todos")
    const [filtroVSPP, setFiltroVSPP] = useState("todos")
    const [filtroVisao, setFiltroVisao] = useState("todos")
    const [filtroEventoId, setFiltroEventoId] = useState("todos")
    
    // Estados para o Modal de Edição
    const [editingColab, setEditingColab] = useState<OpEquipe | null>(null)
    const [isEditModalOpen, setIsEditModalOpen] = useState(false)
    const [editFormData, setEditFormData] = useState({
        referencia_escala: "",
        data_reciclagem: "",
        data_inicio_ferias: "",
        data_fim_ferias: "",
        tipo_servico: "Vigilante/Operacional",
        nivel: 3
    })
    


    const monthStart = startOfMonth(currentDate)
    const monthEnd = endOfMonth(currentDate)
    const allDays = eachDayOfInterval({ start: monthStart, end: monthEnd })
    
    // Filtro de Dias: Se visão "Evento" ou filtro de projeto ativo
    const days = filtroEventoId !== "todos"
        ? allDays.filter(day => {
            const dayStr = format(day, 'yyyy-MM-dd')
            const ev = eventos.find(e => e.id === filtroEventoId)
            return ev ? (dayStr >= ev.data_inicio && dayStr <= ev.data_fim) : false
        })
        : filtroVisao === "Evento" 
            ? allDays.filter(day => {
                const dayStr = format(day, 'yyyy-MM-dd')
                return eventos.some(ev => dayStr >= ev.data_inicio && dayStr <= ev.data_fim)
            })
            : filtroVisao === "Atestado"
                ? allDays.filter(day => {
                    const dayStr = format(day, 'yyyy-MM-dd')
                    return excecoes.some(ex => ex.data_plantao === dayStr && ex.status_dia === 'Atestado')
                })
                : filtroVisao === "Férias"
                    ? allDays.filter(day => {
                        const dayStr = format(day, 'yyyy-MM-dd')
                        return equipe.some(m => m.data_inicio_ferias && m.data_fim_ferias && dayStr >= m.data_inicio_ferias && dayStr <= m.data_fim_ferias)
                    })
                    : allDays

    useEffect(() => {
        loadData()
    }, [currentDate])

    const loadData = async () => {
        setLoading(true)
        try {
            const startStr = format(monthStart, 'yyyy-MM-dd')
            const endStr = format(monthEnd, 'yyyy-MM-dd')

            const [membros, listaExcecoes, listaEventos] = await Promise.all([
                OpServiceV2.getEquipe(),
                OpServiceV2.getEscalasPeriodo(startStr, endStr),
                OpServiceV2.getEventosPeriodo(startStr, endStr)
            ])

            // Ordenação Personalizada: 12x36 -> 5x1 -> 5x2
            const orderMap: Record<string, number> = { '12x36': 1, '5x1': 2, '5x2': 3 }
            const sortedMembros = [...(membros || [])].sort((a, b) => {
                const orderA = orderMap[a.tipo_escala] || 99
                const orderB = orderMap[b.tipo_escala] || 99
                if (orderA !== orderB) return orderA - orderB
                return a.nome_completo.localeCompare(b.nome_completo)
            })

            setEquipe(sortedMembros)
            setExcecoes(listaExcecoes)
            setEventos(listaEventos)
        } catch (error) {
            console.error("Erro ao carregar dados operacionais:", error)
        } finally {
            setLoading(false)
        }
    }

    const nextMonth = () => setCurrentDate(addMonths(currentDate, 1))
    const prevMonth = () => setCurrentDate(subMonths(currentDate, 1))

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Trabalhando': return 'bg-blue-600 shadow-lg shadow-blue-500/30'
            case 'Folga': return 'bg-slate-100 text-slate-400 border border-slate-200'
            case 'Falta': return 'bg-rose-500 text-white shadow-lg shadow-rose-500/30'
            case 'Atestado': return 'bg-orange-500 text-white shadow-lg shadow-orange-500/30'
            case 'Férias': return 'bg-purple-600 text-white shadow-lg shadow-purple-500/30'
            default: return 'bg-slate-50'
        }
    }

    const getTodayStatus = (membro: OpEquipe) => {
        const today = new Date()
        const dayStr = format(today, 'yyyy-MM-dd')
        const statusTeorico = OpServiceV2.getTrabalhaNoDia(membro, today, [])
        const excecao = excecoes.find(ex => ex.colaborador_id === membro.id && ex.data_plantao === dayStr)
        
        let status = statusTeorico ? 'Trabalhando' : 'Folga'
        if (excecao) status = excecao.status_dia
        
        if (membro.data_inicio_ferias && membro.data_fim_ferias) {
            if (dayStr >= membro.data_inicio_ferias && dayStr <= membro.data_fim_ferias) {
                status = 'Férias'
            }
        }
        return status
    }

    const handleStatusChange = async (colabId: string, day: Date, currentStatus: string, worksTheory: boolean) => {
        const dayStr = format(day, 'yyyy-MM-dd')
        let newStatus = 'Trabalhando'
        
        if (currentStatus === 'Trabalhando') newStatus = 'Falta'
        else if (currentStatus === 'Falta') newStatus = 'Folga'
        else if (currentStatus === 'Folga') newStatus = 'Trabalhando'
        else newStatus = worksTheory ? 'Falta' : 'Folga'

        try {
            await OpServiceV2.upsertEscalaDiaria({
                colaborador_id: colabId,
                data_plantao: dayStr,
                status_dia: newStatus,
                horario_inicio: '08:00',
                horario_fim: '20:00'
            })
            loadData() 
        } catch (error) {
            console.error("Erro ao salvar status:", error)
        }
    }

    const openEditModal = (membro: OpEquipe) => {
        setEditingColab(membro)
        setEditFormData({
            referencia_escala: membro.referencia_escala || "",
            data_reciclagem: membro.data_reciclagem || "",
            data_inicio_ferias: membro.data_inicio_ferias || "",
            data_fim_ferias: membro.data_fim_ferias || "",
            tipo_servico: membro.tipo_servico || "Vigilante/Operacional",
            nivel: membro.nivel || 3
        })
        setIsEditModalOpen(true)
    }

    const handleSaveEdits = async () => {
        if (!editingColab) return
        setLoading(true)
        
        // Limpeza dos dados: Converter strings vazias em undefined para satisfazer Partial<OpEquipe>
        const cleanedData: Partial<OpEquipe> = {
            referencia_escala: editFormData.referencia_escala || undefined,
            data_reciclagem: editFormData.data_reciclagem || undefined,
            data_inicio_ferias: editFormData.data_inicio_ferias || undefined,
            data_fim_ferias: editFormData.data_fim_ferias || undefined,
            tipo_servico: editFormData.tipo_servico
        }

        try {
            await OpServiceV2.updateEquipe(editingColab.id, cleanedData)
            setIsEditModalOpen(false)
            loadData()
        } catch (error) {
            console.error("Erro ao atualizar colaborador:", error)
        } finally {
            setLoading(false)
        }
    }

    const handleClearTests = async () => {
        if (!confirm("Deseja realmente limpar todos os testes e alterações manuais deste mês? A escala voltará ao padrão teórico.")) return
        
        setLoading(true)
        try {
            const startStr = format(monthStart, 'yyyy-MM-dd')
            const endStr = format(monthEnd, 'yyyy-MM-dd')
            await OpServiceV2.clearManualScaleOverrides(startStr, endStr)
            toast.success("Testes limpos. Escala resetada com sucesso.")
            loadData()
        } catch (error) {
            console.error("Erro ao limpar testes:", error)
            toast.error("Erro ao limpar testes")
        } finally {
            setLoading(false)
        }
    }


    if (loading && equipe.length === 0) {
        return (
            <div className="flex items-center justify-center p-20">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <Card className="border-none shadow-xl bg-white/80 backdrop-blur-md overflow-hidden rounded-3xl border border-white/20">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 p-8 border-b bg-slate-50/50">
                    <div>
                        <CardTitle className="text-2xl font-black text-slate-800 flex items-center gap-3">
                            <div className="p-2 bg-blue-600 rounded-xl shadow-lg shadow-blue-500/20">
                                <CalendarIcon className="h-6 w-6 text-white" />
                            </div>
                            Escala de Equipe
                        </CardTitle>
                        <CardDescription className="mt-1 font-medium text-slate-500">
                            Gestão de escalas 12x36, 5x1 e 5x2. Clique no nome para configurar ou no dia para alterar status.
                        </CardDescription>
                    </div>
                    <div className="flex items-center gap-4 bg-white p-2 rounded-2xl border border-slate-200 shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="relative group/search">
                                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-hover/search:text-blue-500 transition-colors" />
                                <Input 
                                    placeholder="Buscar por nome..." 
                                    value={filtroNome}
                                    onChange={(e) => setFiltroNome(e.target.value)}
                                    className="h-10 pl-9 w-[200px] rounded-xl border-slate-200 bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-bold text-xs"
                                />
                            </div>

                            <Select value={filtroEscala} onValueChange={setFiltroEscala}>
                                <SelectTrigger className="h-10 w-[120px] rounded-xl border-slate-200 bg-white font-bold text-[10px] uppercase tracking-wider">
                                    <div className="flex items-center gap-2">
                                        <Filter className="h-3.5 w-3.5 text-slate-400" />
                                        <SelectValue placeholder="Escala" />
                                    </div>
                                </SelectTrigger>
                                <SelectContent className="rounded-2xl border-slate-200 shadow-2xl">
                                    <SelectItem value="todos" className="text-[10px] font-black uppercase tracking-widest">Todas Escalas</SelectItem>
                                    <SelectItem value="12x36" className="text-[10px] font-black uppercase tracking-widest">12x36</SelectItem>
                                    <SelectItem value="5x1" className="text-[10px] font-black uppercase tracking-widest">5x1</SelectItem>
                                    <SelectItem value="5x2" className="text-[10px] font-black uppercase tracking-widest">5x2</SelectItem>
                                </SelectContent>
                            </Select>

                            <Select value={filtroVSPP} onValueChange={setFiltroVSPP}>
                                <SelectTrigger className="h-10 w-[120px] rounded-xl border-slate-200 bg-white font-bold text-[10px] uppercase tracking-wider">
                                    <div className="flex items-center gap-2">
                                        <Shield className="h-3.5 w-3.5 text-slate-400" />
                                        <SelectValue placeholder="Tipo" />
                                    </div>
                                </SelectTrigger>
                                <SelectContent className="rounded-2xl border-slate-200 shadow-2xl">
                                    <SelectItem value="todos" className="text-[10px] font-black uppercase tracking-widest">Todos Tipos</SelectItem>
                                    <SelectItem value="VSPP" className="text-[10px] font-black uppercase tracking-widest">Apenas VSPP</SelectItem>
                                    <SelectItem value="Vigilante" className="text-[10px] font-black uppercase tracking-widest">Apenas Vigilante</SelectItem>
                                </SelectContent>
                            </Select>

                            <Select value={filtroVisao} onValueChange={setFiltroVisao}>
                                <SelectTrigger className="h-10 w-[145px] rounded-xl border-slate-200 bg-white font-bold text-[10px] uppercase tracking-wider">
                                    <div className="flex items-center gap-2">
                                        <Clock className="h-3.5 w-3.5 text-slate-400" />
                                        <SelectValue placeholder="Visão" />
                                    </div>
                                </SelectTrigger>
                                <SelectContent className="rounded-2xl border-slate-200 shadow-2xl">
                                    <SelectItem value="todos" className="text-[10px] font-black uppercase tracking-widest">Visão Geral</SelectItem>
                                    <SelectItem value="Evento" className="text-[10px] font-black uppercase tracking-widest text-blue-600">Isolar Eventos</SelectItem>
                                    <SelectItem value="Atestado" className="text-[10px] font-black uppercase tracking-widest text-orange-600">Isolar Atestados</SelectItem>
                                    <SelectItem value="Férias" className="text-[10px] font-black uppercase tracking-widest text-purple-600">Isolar Férias</SelectItem>
                                    <SelectItem value="Reciclagem" className="text-[10px] font-black uppercase tracking-widest text-rose-600">Próximas Reciclagens</SelectItem>
                                </SelectContent>
                            </Select>

                            <Select value={filtroEventoId} onValueChange={setFiltroEventoId}>
                                <SelectTrigger className="h-10 w-[180px] rounded-xl border-slate-200 bg-white font-bold text-[10px] uppercase tracking-wider">
                                    <div className="flex items-center gap-2">
                                        <div className="h-2 w-2 rounded-full bg-yellow-500 animate-pulse" />
                                        <SelectValue placeholder="Isolar Evento" />
                                    </div>
                                </SelectTrigger>
                                <SelectContent className="rounded-2xl border-slate-200 shadow-2xl">
                                    <SelectItem value="todos" className="text-[10px] font-black uppercase tracking-widest text-slate-400">Todos os Projetos</SelectItem>
                                    {eventos.map(ev => (
                                        <SelectItem key={ev.id} value={ev.id!} className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full inline-block mr-2" style={{ backgroundColor: ev.cor }} />
                                            {ev.nome}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <div className="h-6 w-px bg-slate-200 mx-2"></div>
                            
                            <Button variant="ghost" size="icon" onClick={prevMonth} className="hover:bg-slate-100 rounded-xl h-10 w-10">
                                <ChevronLeft className="h-6 w-6 text-slate-600" />
                            </Button>
                            <div className="flex flex-col items-center min-w-[140px]">
                                <span className="font-black text-slate-800 capitalize text-sm tracking-tight">
                                    {format(currentDate, "MMMM yyyy", { locale: ptBR })}
                                </span>
                            </div>
                            <Button variant="ghost" size="icon" onClick={nextMonth} className="hover:bg-slate-100 rounded-xl h-10 w-10">
                                <ChevronRight className="h-6 w-6 text-slate-600" />
                            </Button>
                            <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={handleClearTests}
                                className="h-10 px-4 rounded-xl border-rose-200 text-rose-600 hover:bg-rose-50 font-black text-[10px] uppercase tracking-widest flex items-center gap-2 transition-all active:scale-95"
                            >
                                <Trash2 className="h-4 w-4" />
                                Limpar Testes
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto overflow-y-auto max-h-[calc(100vh-320px)] custom-scrollbar">
                        <table className="w-auto border-collapse">
                            <thead className="sticky top-0 z-30 bg-slate-50 shadow-sm border-b border-slate-200">
                                <tr>
                                    <th className="p-4 text-left font-black text-slate-400 text-[10px] uppercase tracking-[0.2em] sticky left-0 z-40 bg-slate-50 border-r min-w-[320px]">
                                        Colaborador / Especialidade
                                    </th>
                                    {days.map(day => {
                                        const isWeekend = day.getDay() === 0 || day.getDay() === 6
                                        // Mapeamento manual para garantir exatamente o que o usuário quer
                                        const weekdayNames: { [key: number]: string } = {
                                            0: 'dom.', 1: 'seg.', 2: 'ter.', 3: 'qua.', 4: 'qui.', 5: 'sex.', 6: 'sab.'
                                        }
                                        const weekdayName = weekdayNames[day.getDay()]

                                        return (
                                            <th 
                                                key={day.toString()} 
                                                className={`p-1 text-center border-r last:border-r-0 min-w-[45px] transition-colors ${isToday(day) ? 'bg-blue-200 shadow-inner' : isWeekend ? 'bg-slate-300' : ''}`}
                                            >
                                                <div className="flex flex-col items-center">
                                                    <span className={`text-[10px] font-black uppercase tracking-tighter ${isToday(day) ? 'text-blue-700' : isWeekend ? 'text-slate-600' : 'text-slate-400'}`}>
                                                        {weekdayName}
                                                    </span>
                                                    <span className={`text-base font-black mt-1 ${isToday(day) ? 'text-blue-700' : 'text-slate-700'}`}>
                                                        {format(day, "d")}
                                                    </span>
                                                </div>
                                            </th>
                                        )
                                    })}
                                </tr>
                                
                                {/* ZONA DE EVENTOS */}
                                {eventos.length > 0 && (
                                    <tr className="border-b border-slate-200 bg-white">
                                        <th className="sticky left-0 z-40 bg-white p-4 text-left border-r shadow-[4px_0_10px_-4px_rgba(0,0,0,0.05)]">
                                            <div className="flex items-center gap-2">
                                                <div className="p-1 px-2 bg-blue-50 rounded-lg border border-blue-100">
                                                    <span className="text-[9px] font-black uppercase tracking-widest text-blue-600">Eventos</span>
                                                </div>
                                            </div>
                                        </th>
                                        {days.map(day => {
                                            const dayStr = format(day, 'yyyy-MM-dd')
                                            const eventosDia = eventos.filter(ev => dayStr >= ev.data_inicio && dayStr <= ev.data_fim)
                                            const isWeekend = day.getDay() === 0 || day.getDay() === 6
                                            
                                            return (
                                                <td key={day.toString()} className={`p-1 border-r last:border-r-0 transition-all duration-300 ${isToday(day) ? 'bg-blue-50/60' : isWeekend ? 'bg-slate-200/50' : ''}`}>
                                                    <div className="flex flex-col gap-1 min-h-[20px] justify-center">
                                                        {eventosDia.map(ev => (
                                                            <TooltipProvider key={ev.id}>
                                                                <Tooltip>
                                                                    <TooltipTrigger asChild>
                                                                        <div 
                                                                            className="h-2 w-full rounded-full cursor-help hover:opacity-80 transition-opacity"
                                                                            style={{ backgroundColor: ev.cor || '#3b82f6' }}
                                                                        />
                                                                    </TooltipTrigger>
                                                                    <TooltipContent side="top" className="bg-slate-900 text-white p-3 rounded-2xl border-none shadow-2xl">
                                                                        <p className="font-black text-xs uppercase tracking-tight">{ev.nome}</p>
                                                                        <div className="flex items-center gap-2 mt-1 opacity-60">
                                                                            <span className="text-[9px] font-black uppercase">{ev.tipo}</span>
                                                                            <span className="text-[9px]">•</span>
                                                                            <span className="text-[9px] font-black uppercase text-blue-400">{ev.local}</span>
                                                                        </div>
                                                                    </TooltipContent>
                                                                </Tooltip>
                                                            </TooltipProvider>
                                                        ))}
                                                    </div>
                                                </td>
                                            )
                                        })}
                                    </tr>
                                )}
                            </thead>
                            <tbody>
                                {/* SEÇÃO CLUBE */}
                                <tr className="bg-slate-100/50">
                                    <td colSpan={days.length + 1} className="p-2 px-6 sticky left-0 z-20">
                                        <div className="flex items-center gap-2">
                                            <div className="h-1 w-4 bg-blue-600 rounded-full" />
                                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-800">Efetivo Próprio (Clube)</span>
                                        </div>
                                    </td>
                                </tr>
                                {equipe
                                    .filter(membro => (membro.tipo_vinculo || 'clube') === 'clube')
                                    .filter(membro => {
                                        const matchNome = membro.nome_completo.toLowerCase().includes(filtroNome.toLowerCase()) ||
                                                          membro.re.toLowerCase().includes(filtroNome.toLowerCase())
                                        const matchEscala = filtroEscala === "todos" || 
                                                           membro.tipo_escala?.toUpperCase() === filtroEscala.toUpperCase()
                                        
                                        const isVSPP = (membro.tipo_servico?.toUpperCase() === 'VSPP') || 
                                                     (membro.funcao?.toUpperCase().includes('VSPP'))
                                        const matchVSPP = filtroVSPP === "todos" || 
                                                        (filtroVSPP === "VSPP" && isVSPP) ||
                                                        (filtroVSPP === "Vigilante" && !isVSPP)
                                        
                                        let matchVisao = true
                                        // ... (mantendo lógica de visão)
                                        return matchNome && matchEscala && matchVSPP && matchVisao
                                    })
                                    .map((membro) => (
                                    <tr key={membro.id} className="hover:bg-blue-50/30 transition-all border-b last:border-0 border-slate-100 group">
                                        <td className="p-3 sticky left-0 z-20 bg-white group-hover:bg-blue-50/50 border-r shadow-[4px_0_10px_-4px_rgba(0,0,0,0.05)] transition-colors">
                                            <div className="flex items-center gap-3">
                                                <div className="relative shrink-0">
                                                    {(() => {
                                                        const statusHoje = getTodayStatus(membro)
                                                        const bgColor = getStatusColor(statusHoje)
                                                        return (
                                                            <div className={`h-10 w-10 rounded-xl flex items-center justify-center border border-slate-200 font-black shadow-sm transition-all ${bgColor} ${statusHoje === 'Folga' ? 'text-slate-300' : 'text-white'}`}>
                                                                {statusHoje === 'Trabalhando' && <CheckCircle2 className="h-5 w-5" />}
                                                                {statusHoje === 'Folga' && <Clock className="h-5 w-5 opacity-40" />}
                                                                {statusHoje === 'Falta' && <XCircle className="h-5 w-5" />}
                                                                {statusHoje === 'Atestado' && <AlertCircle className="h-5 w-5" />}
                                                                {statusHoje === 'Férias' && <Plane className="h-5 w-5" />}
                                                            </div>
                                                        )
                                                    })()}
                                                    {membro.possui_porte_arma && (
                                                        <div className="absolute -top-1 -right-1 h-5 w-5 bg-orange-500 rounded-full border-2 border-white flex items-center justify-center shadow-sm">
                                                            <Shield className="h-3 w-3 text-white" />
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="overflow-hidden flex-1 cursor-pointer group/name" onClick={() => openEditModal(membro)}>
                                                    <div className="flex items-center justify-between mb-1.5">
                                                        <p className="font-black text-slate-800 text-sm truncate group-hover/name:text-blue-600 transition-colors tracking-tight">
                                                            {membro.nome_completo}
                                                        </p>
                                                        <Settings className="h-3.5 w-3.5 text-slate-300 opacity-0 group-hover:opacity-100 transition-all hover:text-blue-500 ml-2" />
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Badge variant="outline" className="bg-slate-50 text-[10px] font-black text-slate-500 border-slate-200 px-2 py-0.5 rounded-lg uppercase tracking-wider">
                                                            RE: {membro.re}
                                                        </Badge>
                                                        <Badge variant="secondary" className={`
                                                            ${membro.tipo_escala === '12x36' ? 'bg-indigo-50 text-indigo-600' : membro.tipo_escala === '5x1' ? 'bg-cyan-50 text-cyan-600' : 'bg-emerald-50 text-emerald-600'}
                                                            border-none text-[10px] font-black px-2 py-0.5 rounded-lg uppercase tracking-wider
                                                        `}>
                                                            {membro.tipo_escala}
                                                        </Badge>
                                                        <Badge className={`
                                                            ${membro.nivel === 1 ? 'bg-rose-500' : membro.nivel === 2 ? 'bg-orange-500' : 'bg-emerald-500'}
                                                            text-white text-[9px] font-black px-1.5 py-0.5 rounded-md uppercase tracking-tighter
                                                        `}>
                                                            NV {membro.nivel || 3}
                                                        </Badge>
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        {days.map(day => {
                                            const statusTeorico = OpServiceV2.getTrabalhaNoDia(membro, day, [])
                                            const excecao = excecoes.find(ex => ex.colaborador_id === membro.id && ex.data_plantao === format(day, 'yyyy-MM-dd'))
                                            const isWeekend = day.getDay() === 0 || day.getDay() === 6
                                            
                                            let status = statusTeorico ? 'Trabalhando' : 'Folga'
                                            if (excecao) status = excecao.status_dia
                                            
                                            if (membro.data_inicio_ferias && membro.data_fim_ferias) {
                                                const dayStr = format(day, 'yyyy-MM-dd')
                                                if (dayStr >= membro.data_inicio_ferias && dayStr <= membro.data_fim_ferias) {
                                                    status = 'Férias'
                                                }
                                            }

                                            return (
                                                <td key={day.toString()} className={`p-1 border-r last:border-r-0 transition-all ${isToday(day) ? 'bg-blue-100/10' : isWeekend ? 'bg-slate-100/40' : ''}`}>
                                                    <div className="flex justify-center group/cell relative">
                                                        <TooltipProvider>
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <div 
                                                                        onClick={() => handleStatusChange(membro.id, day, status, statusTeorico)}
                                                                        className={`
                                                                            w-7 h-7 rounded-lg cursor-pointer transition-all duration-300 flex items-center justify-center
                                                                            ${getStatusColor(status)}
                                                                            ${status === 'Trabalhando' ? 'ring-2 ring-blue-500/20 scale-95' : 'hover:scale-110'}
                                                                            ${excecao ? 'ring-4 ring-white shadow-xl' : ''}
                                                                        `}
                                                                    >
                                                                        {status === 'Trabalhando' && <div className="h-5 w-5" />}
                                                                        {status === 'Falta' && <XCircle className="h-5 w-5 text-white opacity-90 drop-shadow-md" />}
                                                                        {status === 'Atestado' && <AlertCircle className="h-5 w-5 text-white opacity-90 drop-shadow-md" />}
                                                                        {status === 'Férias' && <Plane className="h-5 w-5 text-white opacity-90 drop-shadow-md" />}
                                                                        
                                                                        {/* Sobreposição de Estrela para Eventos */}
                                                                        {(() => {
                                                                            const dayStr = format(day, 'yyyy-MM-dd');
                                                                            const eventoNoDia = eventos.find(ev => 
                                                                                dayStr >= ev.data_inicio && dayStr <= ev.data_fim && (
                                                                                    (ev.equipe_montagem?.includes(membro.id)) || 
                                                                                    (ev.equipe_realizacao?.includes(membro.id)) || 
                                                                                    (ev.equipe_desmontagem?.includes(membro.id)) ||
                                                                                    (ev.equipe_escalada?.includes(membro.id))
                                                                                )
                                                                            );
                                                                            if (eventoNoDia) {
                                                                                return (
                                                                                    <div className="absolute inset-0 flex items-center justify-center">
                                                                                        <Star 
                                                                                            className="h-6 w-6 fill-current drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]" 
                                                                                            style={{ color: eventoNoDia.cor || '#f59e0b' }}
                                                                                        />
                                                                                    </div>
                                                                                );
                                                                            }
                                                                            return null;
                                                                        })()}
                                                                    </div>
                                                                </TooltipTrigger>
                                                                <TooltipContent side="top" className="bg-slate-900 text-white font-bold p-2 rounded-lg border-none shadow-2xl">
                                                                    <div className="flex flex-col gap-1">
                                                                        <span>{status.toUpperCase()}</span>
                                                                        {(() => {
                                                                            const dayStr = format(day, 'yyyy-MM-dd');
                                                                            const ev = eventos.find(ev => 
                                                                                dayStr >= ev.data_inicio && dayStr <= ev.data_fim && (
                                                                                    (ev.equipe_montagem?.includes(membro.id)) || 
                                                                                    (ev.equipe_realizacao?.includes(membro.id)) || 
                                                                                    (ev.equipe_desmontagem?.includes(membro.id)) ||
                                                                                    (ev.equipe_escalada?.includes(membro.id))
                                                                                )
                                                                            );
                                                                            return ev ? <span className="text-yellow-400 text-[10px] font-black uppercase tracking-widest border-t border-white/10 pt-1 mt-1">Evento: {ev.nome}</span> : null;
                                                                        })()}
                                                                        {excecao && <span className="block text-[10px] font-medium opacity-50 italic">Alteração Manual</span>}
                                                                    </div>
                                                                </TooltipContent>
                                                            </Tooltip>
                                                        </TooltipProvider>
                                                    </div>
                                                </td>
                                            )
                                        })}
                                    </tr>
                                ))}
                                {/* SEÇÃO APOIO EXTERNO */}
                                <tr className="bg-orange-50/30">
                                    <td colSpan={days.length + 1} className="p-2 px-6 sticky left-0 z-20">
                                        <div className="flex items-center gap-2">
                                            <div className="h-1 w-4 bg-orange-500 rounded-full" />
                                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-800">Profissionais Externos / Apoio Especializado</span>
                                        </div>
                                    </td>
                                </tr>
                                {equipe
                                    .filter(membro => membro.tipo_vinculo === 'externo')
                                    .filter(membro => {
                                        const matchNome = membro.nome_completo.toLowerCase().includes(filtroNome.toLowerCase()) ||
                                                          membro.re.toLowerCase().includes(filtroNome.toLowerCase())
                                        const matchEscala = filtroEscala === "todos" || 
                                                           membro.tipo_escala?.toUpperCase() === filtroEscala.toUpperCase()
                                        
                                        const isVSPP = (membro.tipo_servico?.toUpperCase() === 'VSPP') || 
                                                     (membro.funcao?.toUpperCase().includes('VSPP'))
                                        const matchVSPP = filtroVSPP === "todos" || 
                                                        (filtroVSPP === "VSPP" && isVSPP) ||
                                                        (filtroVSPP === "Vigilante" && !isVSPP)
                                        
                                        let matchVisao = true
                                        // ... (mantendo lógica de visão)
                                        return matchNome && matchEscala && matchVSPP && matchVisao
                                    })
                                    .map((membro) => (
                                    <tr key={membro.id} className="hover:bg-orange-50/30 transition-all border-b last:border-0 border-orange-100 group">
                                        <td className="p-3 sticky left-0 z-20 bg-white group-hover:bg-orange-50/50 border-r shadow-[4px_0_10px_-4px_rgba(0,0,0,0.05)] transition-colors">
                                            <div className="flex items-center gap-3">
                                                <div className="relative shrink-0">
                                                    {(() => {
                                                        const statusHoje = getTodayStatus(membro)
                                                        const bgColor = getStatusColor(statusHoje)
                                                        return (
                                                            <div className={`h-10 w-10 rounded-xl flex items-center justify-center border border-orange-200 font-black shadow-sm transition-all ${bgColor} ${statusHoje === 'Folga' ? 'bg-orange-50/50 text-orange-200' : 'text-white'}`}>
                                                                {statusHoje === 'Trabalhando' && <CheckCircle2 className="h-5 w-5" />}
                                                                {statusHoje === 'Folga' && <Clock className="h-5 w-5 opacity-40" />}
                                                                {statusHoje === 'Falta' && <XCircle className="h-5 w-5" />}
                                                                {statusHoje === 'Atestado' && <AlertCircle className="h-5 w-5" />}
                                                                {statusHoje === 'Férias' && <Plane className="h-5 w-5" />}
                                                            </div>
                                                        )
                                                    })()}
                                                </div>
                                                <div className="overflow-hidden flex-1 cursor-pointer group/name" onClick={() => openEditModal(membro)}>
                                                    <div className="flex items-center justify-between mb-1.5">
                                                        <p className="font-black text-slate-800 text-sm truncate group-hover/name:text-orange-600 transition-colors tracking-tight">
                                                            {membro.nome_completo}
                                                        </p>
                                                        <Settings className="h-3.5 w-3.5 text-slate-300 opacity-0 group-hover:opacity-100 transition-all hover:text-orange-500 ml-2" />
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Badge variant="outline" className="bg-slate-50 text-[10px] font-black text-slate-500 border-slate-200 px-2 py-0.5 rounded-lg uppercase tracking-wider">
                                                            REF: {membro.re}
                                                        </Badge>
                                                        <Badge className="bg-slate-900 text-white border-none text-[10px] font-black px-2 py-0.5 rounded-lg uppercase tracking-wider">
                                                            {membro.tipo_servico || 'Externo'}
                                                        </Badge>
                                                        <Badge className={`
                                                            ${membro.nivel === 1 ? 'bg-rose-500' : membro.nivel === 2 ? 'bg-orange-500' : 'bg-emerald-500'}
                                                            text-white text-[9px] font-black px-1.5 py-0.5 rounded-md uppercase tracking-tighter
                                                        `}>
                                                            NV {membro.nivel || 3}
                                                        </Badge>
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        {days.map(day => {
                                            const statusTeorico = OpServiceV2.getTrabalhaNoDia(membro, day, [])
                                            const excecao = excecoes.find(ex => ex.colaborador_id === membro.id && ex.data_plantao === format(day, 'yyyy-MM-dd'))
                                            const isWeekend = day.getDay() === 0 || day.getDay() === 6
                                            
                                            let status = statusTeorico ? 'Trabalhando' : 'Folga'
                                            if (excecao) status = excecao.status_dia
                                            
                                            return (
                                                <td key={day.toString()} className={`p-1 border-r last:border-r-0 transition-all ${isToday(day) ? 'bg-orange-100/10' : isWeekend ? 'bg-slate-100/40' : ''}`}>
                                                    <div className="flex justify-center group/cell relative">
                                                        <TooltipProvider>
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <div 
                                                                        onClick={() => handleStatusChange(membro.id, day, status, statusTeorico)}
                                                                        className={`
                                                                            w-7 h-7 rounded-lg cursor-pointer transition-all duration-300 flex items-center justify-center
                                                                            ${getStatusColor(status)}
                                                                            ${status === 'Trabalhando' ? 'ring-2 ring-orange-500/20 scale-95' : 'hover:scale-110'}
                                                                            ${excecao ? 'ring-4 ring-white shadow-xl' : ''}
                                                                        `}
                                                                    >
                                                                        {status === 'Trabalhando' && <div className="h-5 w-5" />}
                                                                        {status === 'Falta' && <XCircle className="h-5 w-5 text-white opacity-90 drop-shadow-md" />}
                                                                        {status === 'Atestado' && <AlertCircle className="h-5 w-5 text-white opacity-90 drop-shadow-md" />}
                                                                        
                                                                        {/* Sobreposição de Estrela para Eventos */}
                                                                        {(() => {
                                                                            const dayStr = format(day, 'yyyy-MM-dd');
                                                                            const eventoNoDia = eventos.find(ev => 
                                                                                dayStr >= ev.data_inicio && dayStr <= ev.data_fim && (
                                                                                    (ev.equipe_montagem?.includes(membro.id)) || 
                                                                                    (ev.equipe_realizacao?.includes(membro.id)) || 
                                                                                    (ev.equipe_desmontagem?.includes(membro.id)) ||
                                                                                    (ev.equipe_escalada?.includes(membro.id))
                                                                                )
                                                                            );
                                                                            if (eventoNoDia) {
                                                                                return (
                                                                                    <div className="absolute inset-0 flex items-center justify-center">
                                                                                        <Star 
                                                                                            className="h-6 w-6 fill-current drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]" 
                                                                                            style={{ color: eventoNoDia.cor || '#f59e0b' }}
                                                                                        />
                                                                                    </div>
                                                                                );
                                                                            }
                                                                            return null;
                                                                        })()}
                                                                    </div>
                                                                </TooltipTrigger>
                                                                <TooltipContent side="top" className="bg-slate-900 text-white font-bold p-2 rounded-lg border-none shadow-2xl">
                                                                    <div className="flex flex-col gap-1">
                                                                        <span>{status.toUpperCase()}</span>
                                                                        {(() => {
                                                                            const dayStr = format(day, 'yyyy-MM-dd');
                                                                            const ev = eventos.find(ev => 
                                                                                dayStr >= ev.data_inicio && dayStr <= ev.data_fim && (
                                                                                    (ev.equipe_montagem?.includes(membro.id)) || 
                                                                                    (ev.equipe_realizacao?.includes(membro.id)) || 
                                                                                    (ev.equipe_desmontagem?.includes(membro.id)) ||
                                                                                    (ev.equipe_escalada?.includes(membro.id))
                                                                                )
                                                                            );
                                                                            return ev ? <span className="text-yellow-400 text-[10px] font-black uppercase tracking-widest border-t border-white/10 pt-1 mt-1">Evento: {ev.nome}</span> : null;
                                                                        })()}
                                                                    </div>
                                                                </TooltipContent>
                                                            </Tooltip>
                                                        </TooltipProvider>
                                                    </div>
                                                </td>
                                            )
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            {/* Legenda Estilizada */}
            <div className="flex flex-wrap gap-8 p-8 bg-white border border-slate-200 rounded-3xl shadow-lg">
                <div className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-lg bg-blue-600 shadow-lg shadow-blue-500/30"></div>
                    <span className="text-sm font-black text-slate-700 lowercase tracking-tight">trabalhando</span>
                </div>
                <div className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-lg bg-slate-100 border border-slate-200"></div>
                    <span className="text-sm font-black text-slate-700 lowercase tracking-tight">folga</span>
                </div>
                <div className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-lg bg-rose-500 shadow-lg shadow-rose-500/30"></div>
                    <span className="text-sm font-black text-slate-700 lowercase tracking-tight">falta</span>
                </div>
                <div className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-lg bg-orange-500 shadow-lg shadow-orange-500/30"></div>
                    <span className="text-sm font-black text-slate-700 lowercase tracking-tight">atestado</span>
                </div>
                <div className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-lg bg-purple-600 shadow-lg shadow-purple-500/30"></div>
                    <span className="text-sm font-black text-slate-700 lowercase tracking-tight">férias</span>
                </div>
                <div className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-lg bg-white border border-slate-200 flex items-center justify-center relative">
                        <Star className="h-4 w-4 text-orange-500 fill-current" />
                    </div>
                    <span className="text-sm font-black text-slate-700 lowercase tracking-tight">evento programado</span>
                </div>
                <div className="ml-auto flex items-center gap-2 text-slate-400">
                    <Info className="h-4 w-4" />
                    <span className="text-xs font-bold italic lowercase tracking-tight">clique no dia para alternar status rapidamente</span>
                </div>
            </div>

            <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
                <DialogContent className="sm:max-w-[450px] p-0 overflow-hidden rounded-[32px] border-none shadow-2xl bg-white/95 backdrop-blur-xl">
                    <div className="h-2 bg-gradient-to-r from-blue-600 to-indigo-600"></div>
                    <DialogHeader className="p-8 pb-4">
                        <DialogTitle className="text-2xl font-black text-slate-900 flex items-center gap-3">
                            <div className="p-2 bg-slate-100 rounded-2xl">
                                <User className="h-6 w-6 text-blue-600" />
                            </div>
                            {editingColab?.nome_completo.split(' ')[0]}
                            <span className="text-slate-400 font-medium text-lg ml-auto px-3 py-1 bg-slate-50 rounded-xl border border-slate-100">
                                RE {editingColab?.re}
                            </span>
                        </DialogTitle>
                        <DialogDescription className="text-slate-500 font-bold mt-2">
                            Ajuste as propriedades fundamentais para o cálculo automático das escalas e vencimentos.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="px-8 py-4 space-y-6">
                        <div className="space-y-3">
                            <Label htmlFor="referencia" className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Data de Referência (Motor de Escala)</Label>
                            <Input 
                                id="referencia" 
                                type="date" 
                                value={editFormData.referencia_escala} 
                                onChange={(e) => setEditFormData({ ...editFormData, referencia_escala: e.target.value })}
                                className="h-14 rounded-2xl border-slate-200 bg-slate-50/50 focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all text-base font-black text-slate-700"
                            />
                        </div>

                        <div className="space-y-3">
                            <Label htmlFor="reciclagem" className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Vencimento da Reciclagem</Label>
                            <Input 
                                id="reciclagem" 
                                type="date" 
                                value={editFormData.data_reciclagem} 
                                onChange={(e) => setEditFormData({ ...editFormData, data_reciclagem: e.target.value })}
                                className="h-14 rounded-2xl border-slate-200 bg-slate-50/50 focus:bg-white focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 transition-all text-base font-black text-slate-700"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-3">
                                <Label htmlFor="ferias_inicio" className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Início das Férias</Label>
                                <Input 
                                    id="ferias_inicio" 
                                    type="date" 
                                    value={editFormData.data_inicio_ferias} 
                                    onChange={(e) => setEditFormData({ ...editFormData, data_inicio_ferias: e.target.value })}
                                    className="h-14 rounded-2xl border-slate-200 bg-slate-50/50 focus:bg-white focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 transition-all text-base font-black text-slate-700"
                                />
                            </div>
                            <div className="space-y-3">
                                <Label htmlFor="ferias_fim" className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Fim das Férias</Label>
                                <Input 
                                    id="ferias_fim" 
                                    type="date" 
                                    value={editFormData.data_fim_ferias} 
                                    onChange={(e) => setEditFormData({ ...editFormData, data_fim_ferias: e.target.value })}
                                    className="h-14 rounded-2xl border-slate-200 bg-slate-50/50 focus:bg-white focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 transition-all text-base font-black text-slate-700"
                                />
                            </div>
                        </div>

                        <div className="space-y-3">
                            <Label className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Tipo de Serviço (Cálculo Hagana)</Label>
                            <div className="flex gap-2 p-1.5 bg-slate-100 rounded-[20px] border border-slate-200">
                                {[
                                    { id: 'Vigilante/Operacional', label: 'Vig. / Op.' },
                                    { id: 'VSPP', label: 'VSPP (Armado)' }
                                ].map(option => (
                                    <div 
                                        key={option.id}
                                        onClick={() => setEditFormData({ ...editFormData, tipo_servico: option.id })}
                                        className={`flex-1 py-3 text-center rounded-[14px] cursor-pointer transition-all text-xs font-black uppercase tracking-tighter ${editFormData.tipo_servico === option.id ? 'bg-white text-blue-600 shadow-md ring-1 ring-blue-100' : 'text-slate-400 hover:text-slate-600'}`}
                                    >
                                        {option.label}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="p-8 pt-4 bg-slate-50 border-t border-slate-100 flex-col sm:flex-row gap-3">
                        <Button variant="ghost" onClick={() => setIsEditModalOpen(false)} className="flex-1 h-14 rounded-2xl font-black text-slate-400 uppercase tracking-widest hover:bg-slate-200 transition-all text-xs">
                            Descartar
                        </Button>
                        <Button onClick={handleSaveEdits} className="flex-[2] h-14 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-2xl font-black text-white shadow-xl shadow-blue-500/30 uppercase tracking-widest text-xs transition-all active:scale-95 disabled:opacity-50">
                            {loading ? "Processando..." : "Salvar Configurações"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>



            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar { width: 8px; height: 8px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #cbd5e1; }
            `}</style>
        </div>
    )
}
