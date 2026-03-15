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
    Search as SearchIcon
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
    const [filtroStatusHoje, setFiltroStatusHoje] = useState("todos")
    
    // Estados para o Modal de Edição
    const [editingColab, setEditingColab] = useState<OpEquipe | null>(null)
    const [isEditModalOpen, setIsEditModalOpen] = useState(false)
    const [editFormData, setEditFormData] = useState({
        referencia_escala: "",
        data_reciclagem: "",
        data_inicio_ferias: "",
        data_fim_ferias: "",
        tipo_servico: "Vigilante/Operacional"
    })
    
    // Estados para o Modal de Novo Evento
    const [isEventModalOpen, setIsEventModalOpen] = useState(false)
    const [eventFormData, setEventFormData] = useState<OpEvento>({
        nome: "",
        tipo: "Social",
        data_inicio: format(new Date(), 'yyyy-MM-dd'),
        data_fim: format(new Date(), 'yyyy-MM-dd'),
        cor: "#3b82f6",
        local: "",
        observacoes: "",
        local_detalhado: "",
        publico_estimado: "",
        foto_evento: "",
        // Novos Campos Fase 2.2
        patrocinador: "Hagana",
        responsavel_nome: "",
        nivel_criticidade: 3,
        // Montagem
        montagem_inicio_data: format(new Date(), 'yyyy-MM-dd'),
        montagem_inicio_hora: "08:00",
        montagem_fim_data: format(new Date(), 'yyyy-MM-dd'),
        montagem_fim_hora: "18:00",
        equipe_montagem: [],
        has_montagem: true,
        // Evento
        evento_inicio_data: format(new Date(), 'yyyy-MM-dd'),
        evento_inicio_hora: "19:00",
        evento_fim_data: format(new Date(), 'yyyy-MM-dd'),
        evento_fim_hora: "23:59",
        equipe_realizacao: [],
        has_realizacao: true,
        // Desmontagem
        desmontagem_inicio_data: format(new Date(), 'yyyy-MM-dd'),
        desmontagem_inicio_hora: "00:00",
        desmontagem_fim_data: format(new Date(), 'yyyy-MM-dd'),
        desmontagem_fim_hora: "08:00",
        equipe_desmontagem: [],
        has_desmontagem: false
    })

    const monthStart = startOfMonth(currentDate)
    const monthEnd = endOfMonth(currentDate)
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd })

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
            tipo_servico: membro.tipo_servico || "Vigilante/Operacional"
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

    const handleCreateEvento = async () => {
        if (!eventFormData.nome) return
        setLoading(true)
        try {
            // Sincronizar data_inicio/data_fim globais (para a barra no calendário) com o período do EVENTO real
            const payload: OpEvento = {
                ...eventFormData,
                data_inicio: eventFormData.montagem_inicio_data || eventFormData.data_inicio,
                data_fim: eventFormData.desmontagem_fim_data || eventFormData.data_fim
            }
            
            console.log("Iniciando criação de evento com payload:", payload)
            const res = await OpServiceV2.createEvento(payload)
            console.log("Evento criado com sucesso:", res)
            
            setIsEventModalOpen(false)
            // Resetar form
            setEventFormData({
                nome: "",
                tipo: "Social",
                data_inicio: format(new Date(), 'yyyy-MM-dd'),
                data_fim: format(new Date(), 'yyyy-MM-dd'),
                cor: "#3b82f6",
                local: "",
                observacoes: "",
                local_detalhado: "",
                publico_estimado: "",
                foto_evento: "",
                montagem_inicio_data: format(new Date(), 'yyyy-MM-dd'),
                montagem_inicio_hora: "08:00",
                montagem_fim_data: format(new Date(), 'yyyy-MM-dd'),
                montagem_fim_hora: "18:00",
                evento_inicio_data: format(new Date(), 'yyyy-MM-dd'),
                evento_inicio_hora: "19:00",
                evento_fim_data: format(new Date(), 'yyyy-MM-dd'),
                evento_fim_hora: "23:59",
                desmontagem_inicio_data: format(new Date(), 'yyyy-MM-dd'),
                desmontagem_inicio_hora: "00:00",
                desmontagem_fim_hora: "08:00",
                equipe_montagem: [],
                equipe_realizacao: [],
                equipe_desmontagem: [],
                has_montagem: true,
                has_realizacao: true,
                has_desmontagem: false,
                patrocinador: "Hagana",
                responsavel_nome: "",
                nivel_criticidade: 3
            })
            loadData()
            toast.success("Evento planejado e enviado ao Kanban!")
        } catch (error: any) {
            console.error("Erro fatal ao criar evento:", error)
            toast.error("Erro ao salvar: " + (error.message || "tente novamente"))
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
                        <Button 
                            onClick={() => setIsEventModalOpen(true)}
                            className="bg-slate-900 hover:bg-slate-800 text-white font-black text-xs uppercase tracking-widest rounded-xl h-10 px-4 flex items-center gap-2 transition-all active:scale-95 mr-2"
                        >
                            <Plus className="h-4 w-4" />
                            Adicionar Evento
                        </Button>
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

                            <Select value={filtroStatusHoje} onValueChange={setFiltroStatusHoje}>
                                <SelectTrigger className="h-10 w-[135px] rounded-xl border-slate-200 bg-white font-bold text-[10px] uppercase tracking-wider">
                                    <div className="flex items-center gap-2">
                                        <Clock className="h-3.5 w-3.5 text-slate-400" />
                                        <SelectValue placeholder="Status Hoje" />
                                    </div>
                                </SelectTrigger>
                                <SelectContent className="rounded-2xl border-slate-200 shadow-2xl">
                                    <SelectItem value="todos" className="text-[10px] font-black uppercase tracking-widest">Status (Hoje)</SelectItem>
                                    <SelectItem value="Trabalhando" className="text-[10px] font-black uppercase tracking-widest">Trabalhando</SelectItem>
                                    <SelectItem value="Folga" className="text-[10px] font-black uppercase tracking-widest">Folga</SelectItem>
                                    <SelectItem value="Falta" className="text-[10px] font-black uppercase tracking-widest">Falta</SelectItem>
                                    <SelectItem value="Atestado" className="text-[10px] font-black uppercase tracking-widest">Atestado</SelectItem>
                                    <SelectItem value="Férias" className="text-[10px] font-black uppercase tracking-widest">Férias</SelectItem>
                                    <SelectItem value="Reciclagem" className="text-[10px] font-black uppercase tracking-widest">Reciclagem Próxima</SelectItem>
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
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto overflow-y-auto max-h-[calc(100vh-320px)] custom-scrollbar">
                        <table className="w-full border-collapse">
                            <thead className="sticky top-0 z-30 bg-slate-50 shadow-sm border-b border-slate-200">
                                <tr>
                                    <th className="p-6 text-left font-black text-slate-400 text-[10px] uppercase tracking-[0.2em] sticky left-0 z-40 bg-slate-50 border-r min-w-[320px]">
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
                                                className={`p-3 text-center border-r last:border-r-0 min-w-[48px] transition-colors ${isToday(day) ? 'bg-blue-200 shadow-inner' : isWeekend ? 'bg-slate-300' : ''}`}
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
                                {equipe
                                    .filter(membro => {
                                        const matchNome = membro.nome_completo.toLowerCase().includes(filtroNome.toLowerCase())
                                        const matchEscala = filtroEscala === "todos" || membro.tipo_escala === filtroEscala
                                        
                                        // Filtro VSPP mais resiliente (checa tipo_servico e funcao)
                                        const isVSPP = (membro.tipo_servico?.toUpperCase() === 'VSPP') || 
                                                     (membro.funcao?.toUpperCase().includes('VSPP'))
                                        const matchVSPP = filtroVSPP === "todos" || 
                                                        (filtroVSPP === "VSPP" && isVSPP) ||
                                                        (filtroVSPP === "Vigilante" && !isVSPP)
                                        
                                        // Filtro Status Hoje
                                        let matchStatusHoje = true
                                        if (filtroStatusHoje !== "todos") {
                                            const hoje = startOfDay(new Date())
                                            const statusTeorico = OpServiceV2.getTrabalhaNoDia(membro, hoje, [])
                                            const excecao = excecoes.find(ex => ex.colaborador_id === membro.id && ex.data_plantao === format(hoje, 'yyyy-MM-dd'))
                                            
                                            let statusAtual = statusTeorico ? 'Trabalhando' : 'Folga'
                                            if (excecao) statusAtual = excecao.status_dia
                                            if (membro.data_inicio_ferias && membro.data_fim_ferias) {
                                                const hojeStr = format(hoje, 'yyyy-MM-dd')
                                                if (hojeStr >= membro.data_inicio_ferias && hojeStr <= membro.data_fim_ferias) {
                                                    statusAtual = 'Férias'
                                                }
                                            }
                                            if (filtroStatusHoje === 'Reciclagem') {
                                                if (membro.data_reciclagem) {
                                                    const dataRec = new Date(membro.data_reciclagem)
                                                    const diff = (dataRec.getTime() - hoje.getTime()) / (1000 * 3600 * 24)
                                                    matchStatusHoje = diff <= 30
                                                } else {
                                                    matchStatusHoje = false
                                                }
                                            } else {
                                                matchStatusHoje = statusAtual === filtroStatusHoje
                                            }
                                        }

                                        return matchNome && matchEscala && matchVSPP && matchStatusHoje
                                    })
                                    .map((membro) => (
                                    <tr key={membro.id} className="hover:bg-blue-50/30 transition-all border-b last:border-0 border-slate-100 group">
                                        <td className="p-5 sticky left-0 z-20 bg-white group-hover:bg-blue-50/50 border-r shadow-[4px_0_10px_-4px_rgba(0,0,0,0.05)] transition-colors">
                                            <div className="flex items-center gap-4">
                                                <div className="relative shrink-0">
                                                    <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center border border-slate-200 text-slate-700 font-black shadow-sm group-hover:from-blue-100 group-hover:to-blue-200 group-hover:text-blue-700 transition-all">
                                                        {membro.nome_completo.charAt(0)}
                                                    </div>
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
                                                <td key={day.toString()} className={`p-1.5 border-r last:border-r-0 transition-all ${isToday(day) ? 'bg-blue-100/10' : isWeekend ? 'bg-slate-100/40' : ''}`}>
                                                    <div className="flex justify-center group/cell relative">
                                                        <TooltipProvider>
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <div 
                                                                        onClick={() => handleStatusChange(membro.id, day, status, statusTeorico)}
                                                                        className={`
                                                                            w-9 h-9 rounded-xl cursor-pointer transition-all duration-300 flex items-center justify-center
                                                                            ${getStatusColor(status)}
                                                                            ${status === 'Trabalhando' ? 'ring-2 ring-blue-500/20 scale-95' : 'hover:scale-110'}
                                                                            ${excecao ? 'ring-4 ring-white shadow-xl' : ''}
                                                                        `}
                                                                    >
                                                                        {status === 'Trabalhando' && <CheckCircle2 className="h-5 w-5 text-white opacity-90 drop-shadow-md" />}
                                                                        {status === 'Falta' && <XCircle className="h-5 w-5 text-white opacity-90 drop-shadow-md" />}
                                                                        {status === 'Atestado' && <AlertCircle className="h-5 w-5 text-white opacity-90 drop-shadow-md" />}
                                                                        {status === 'Férias' && <Plane className="h-5 w-5 text-white opacity-90 drop-shadow-md" />}
                                                                    </div>
                                                                </TooltipTrigger>
                                                                <TooltipContent side="top" className="bg-slate-900 text-white font-bold p-2 rounded-lg border-none shadow-2xl">
                                                                    {status.toUpperCase()}
                                                                    {excecao && <span className="block text-[10px] font-medium opacity-50 mt-0.5 italic">Alteração Manual</span>}
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
                <div className="ml-auto flex items-center gap-2 text-slate-400">
                    <Info className="h-4 w-4" />
                    <span className="text-xs font-bold italic lowercase">clique no dia para alternar status rapidamente</span>
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

            <Dialog open={isEventModalOpen} onOpenChange={setIsEventModalOpen}>
                <DialogContent className="sm:max-w-[700px] p-0 overflow-hidden rounded-[32px] border-none shadow-2xl bg-white max-h-[90vh] flex flex-col">
                    <div className="h-2 shrink-0" style={{ backgroundColor: eventFormData.cor }}></div>
                    <DialogHeader className="p-8 pb-4 shrink-0">
                        <DialogTitle className="text-2xl font-black text-slate-900 flex items-center gap-3">
                            <div className="p-2 bg-slate-100 rounded-2xl">
                                <Plus className="h-6 w-6 text-slate-900" />
                            </div>
                            Planejamento de Evento
                        </DialogTitle>
                        <DialogDescription className="text-slate-500 font-bold mt-2">
                            Detalhe todos os períodos do projeto para automação e escala de equipe.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="px-8 py-4 space-y-8 overflow-y-auto custom-scrollbar pb-10">
                        {/* INFORMAÇÕES BÁSICAS */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="h-4 w-1 bg-slate-900 rounded-full"></div>
                                <h3 className="text-xs font-black uppercase tracking-widest text-slate-900">Informações Gerais</h3>
                            </div>
                            <div className="grid grid-cols-12 gap-4">
                                <div className="col-span-8 space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Nome do Evento</Label>
                                    <Input 
                                        placeholder="Ex: Casamento Fred & Maria"
                                        value={eventFormData.nome}
                                        onChange={(e) => setEventFormData({ ...eventFormData, nome: e.target.value })}
                                        className="h-12 rounded-xl border-slate-200 font-bold"
                                    />
                                </div>
                                <div className="col-span-4 space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Tipo</Label>
                                    <Select 
                                        value={eventFormData.tipo} 
                                        onValueChange={(val) => setEventFormData({ ...eventFormData, tipo: val })}
                                    >
                                        <SelectTrigger className="h-12 rounded-xl border-slate-200 font-bold">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Social">Social</SelectItem>
                                            <SelectItem value="Operacional">Operacional</SelectItem>
                                            <SelectItem value="Crítico">Crítico</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="grid grid-cols-12 gap-4">
                                <div className="col-span-8 space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Local Detalhado / Posto</Label>
                                    <Input 
                                        placeholder="Ex: Salão de Festas Principal"
                                        value={eventFormData.local_detalhado}
                                        onChange={(e) => setEventFormData({ ...eventFormData, local_detalhado: e.target.value })}
                                        className="h-12 rounded-xl border-slate-200 font-bold"
                                    />
                                </div>
                                <div className="col-span-4 space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Cor</Label>
                                    <div className="flex gap-2 p-1 bg-slate-50 rounded-xl border border-slate-100 h-12">
                                        {['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'].map(color => (
                                            <div 
                                                key={color}
                                                onClick={() => setEventFormData({ ...eventFormData, cor: color })}
                                                className={`h-full flex-1 rounded-lg cursor-pointer transition-all ${eventFormData.cor === color ? 'scale-110 shadow-md ring-2 ring-offset-2 ring-slate-200' : 'opacity-40 hover:opacity-100'}`}
                                                style={{ backgroundColor: color }}
                                            />
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* NOVOS CAMPOS FASE 2.2 */}
                            <div className="grid grid-cols-12 gap-4">
                                <div className="col-span-12 md:col-span-6 space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Responsável p/ Evento</Label>
                                    <Input 
                                        placeholder="Nome do cliente/organizador"
                                        value={eventFormData.responsavel_nome}
                                        onChange={(e) => setEventFormData({ ...eventFormData, responsavel_nome: e.target.value })}
                                        className="h-12 rounded-xl border-slate-200 font-bold bg-white"
                                    />
                                </div>
                                <div className="col-span-12 md:col-span-6 space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Patrocinador ($$$)</Label>
                                    <div className="flex gap-1 p-1 bg-slate-50 rounded-xl border border-slate-100 h-12">
                                        {['Hagana', 'Paulão', 'OR'].map(patro => (
                                            <div 
                                                key={patro}
                                                onClick={() => setEventFormData({ ...eventFormData, patrocinador: patro })}
                                                className={`flex-1 flex items-center justify-center rounded-lg cursor-pointer transition-all text-[9px] font-black uppercase tracking-tighter ${eventFormData.patrocinador === patro ? 'bg-white text-emerald-600 shadow-sm ring-1 ring-slate-200 border-emerald-100' : 'text-slate-400 hover:bg-slate-100'}`}
                                            >
                                                {patro}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Nível de Criticidade</Label>
                                    <div className="flex gap-2 p-1 bg-slate-50 rounded-xl border border-slate-100 h-12">
                                        {[
                                            { id: 1, label: 'Nível 1 (Crítico)', color: 'rose' },
                                            { id: 2, label: 'Nível 2 (Atenção)', color: 'orange' },
                                            { id: 3, label: 'Nível 3 (Normal)', color: 'emerald' }
                                        ].map(nivel => (
                                            <div 
                                                key={nivel.id}
                                                onClick={() => setEventFormData({ ...eventFormData, nivel_criticidade: nivel.id })}
                                                className={`flex-1 flex items-center justify-center rounded-lg cursor-pointer transition-all text-[9px] font-black uppercase tracking-tighter border ${eventFormData.nivel_criticidade === nivel.id ? 'bg-slate-900 text-white border-slate-900 shadow-md' : 'bg-white text-slate-400 border-slate-100 hover:border-slate-300'}`}
                                            >
                                                <div className={`w-2 h-2 rounded-full mr-2 bg-${nivel.color}-500 shadow-sm`}></div>
                                                {nivel.label}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className={`p-6 rounded-[24px] border transition-all ${eventFormData.has_montagem ? 'bg-blue-50/50 border-blue-200/50' : 'bg-slate-50 border-slate-100 opacity-60'}`}>
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <div className={`h-4 w-1 ${eventFormData.has_montagem ? 'bg-blue-500' : 'bg-slate-300'} rounded-full`}></div>
                                    <h3 className={`text-xs font-black uppercase tracking-widest ${eventFormData.has_montagem ? 'text-blue-600' : 'text-slate-400'}`}>Fase 1: Montagem</h3>
                                </div>
                                <div 
                                    onClick={() => setEventFormData({ ...eventFormData, has_montagem: !eventFormData.has_montagem })}
                                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full border cursor-pointer transition-all ${eventFormData.has_montagem ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-slate-200 text-slate-400'}`}
                                >
                                    <div className={`h-2 w-2 rounded-full ${eventFormData.has_montagem ? 'bg-white' : 'bg-slate-300'}`}></div>
                                    <span className="text-[10px] font-black uppercase tracking-tighter">{eventFormData.has_montagem ? 'Habilitado' : 'Desabilitado'}</span>
                                </div>
                            </div>

                            {eventFormData.has_montagem && (
                                <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Início (Data)</Label>
                                            <Input type="date" value={eventFormData.montagem_inicio_data} onChange={(e) => setEventFormData({ ...eventFormData, montagem_inicio_data: e.target.value })} className="h-12 rounded-xl border-slate-200 font-bold bg-white" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Horário</Label>
                                            <Input type="time" value={eventFormData.montagem_inicio_hora} onChange={(e) => setEventFormData({ ...eventFormData, montagem_inicio_hora: e.target.value })} className="h-12 rounded-xl border-slate-200 font-bold bg-white" />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Término (Data)</Label>
                                            <Input type="date" value={eventFormData.montagem_fim_data} onChange={(e) => setEventFormData({ ...eventFormData, montagem_fim_data: e.target.value })} className="h-12 rounded-xl border-slate-200 font-bold bg-white" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Horário</Label>
                                            <Input type="time" value={eventFormData.montagem_fim_hora} onChange={(e) => setEventFormData({ ...eventFormData, montagem_fim_hora: e.target.value })} className="h-12 rounded-xl border-slate-200 font-bold bg-white" />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Equipe de Montagem</Label>
                                        <div className="grid grid-cols-2 gap-2 max-h-[150px] overflow-y-auto p-2 bg-white rounded-xl border border-slate-200 custom-scrollbar">
                                            {equipe.map(membro => (
                                                <div 
                                                    key={membro.id}
                                                    onClick={() => {
                                                        const current = eventFormData.equipe_montagem || [];
                                                        setEventFormData({ ...eventFormData, equipe_montagem: current.includes(membro.id) ? current.filter(id => id !== membro.id) : [...current, membro.id] });
                                                    }}
                                                    className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-all ${(eventFormData.equipe_montagem || []).includes(membro.id) ? 'bg-blue-50 border-blue-200 ring-2 ring-blue-500/20' : 'bg-slate-50 border-transparent'}`}
                                                >
                                                    <div className={`h-1.5 w-1.5 rounded-full ${(eventFormData.equipe_montagem || []).includes(membro.id) ? 'bg-blue-500' : 'bg-slate-300'}`}></div>
                                                    <span className="text-[10px] font-bold text-slate-700 truncate">{membro.nome_completo.split(' ')[0]} {membro.nome_completo.split(' ').pop()}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className={`p-6 rounded-[24px] border transition-all ${eventFormData.has_realizacao ? 'bg-indigo-50/50 border-indigo-200/50' : 'bg-slate-50 border-slate-100 opacity-60'}`}>
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <div className={`h-4 w-1 ${eventFormData.has_realizacao ? 'bg-indigo-600' : 'bg-slate-300'} rounded-full`}></div>
                                    <h3 className={`text-xs font-black uppercase tracking-widest ${eventFormData.has_realizacao ? 'text-indigo-700' : 'text-slate-400'}`}>Fase 2: O Evento</h3>
                                </div>
                                <div 
                                    onClick={() => setEventFormData({ ...eventFormData, has_realizacao: !eventFormData.has_realizacao })}
                                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full border cursor-pointer transition-all ${eventFormData.has_realizacao ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-slate-200 text-slate-400'}`}
                                >
                                    <div className={`h-2 w-2 rounded-full ${eventFormData.has_realizacao ? 'bg-white' : 'bg-slate-300'}`}></div>
                                    <span className="text-[10px] font-black uppercase tracking-tighter">{eventFormData.has_realizacao ? 'Habilitado' : 'Desabilitado'}</span>
                                </div>
                            </div>

                            {eventFormData.has_realizacao && (
                                <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Início (Data)</Label>
                                            <Input type="date" value={eventFormData.evento_inicio_data} onChange={(e) => setEventFormData({ ...eventFormData, evento_inicio_data: e.target.value })} className="h-12 rounded-xl border-slate-200 font-bold bg-white" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Horário</Label>
                                            <Input type="time" value={eventFormData.evento_inicio_hora} onChange={(e) => setEventFormData({ ...eventFormData, evento_inicio_hora: e.target.value })} className="h-12 rounded-xl border-slate-200 font-bold bg-white" />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Término (Data)</Label>
                                            <Input type="date" value={eventFormData.evento_fim_data} onChange={(e) => setEventFormData({ ...eventFormData, evento_fim_data: e.target.value })} className="h-12 rounded-xl border-slate-200 font-bold bg-white" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Horário</Label>
                                            <Input type="time" value={eventFormData.evento_fim_hora} onChange={(e) => setEventFormData({ ...eventFormData, evento_fim_hora: e.target.value })} className="h-12 rounded-xl border-slate-200 font-bold bg-white" />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Público Estimado</Label>
                                            <Input placeholder="Ex: 800" value={eventFormData.publico_estimado} onChange={(e) => setEventFormData({ ...eventFormData, publico_estimado: e.target.value })} className="h-12 rounded-xl border-slate-200 font-bold bg-white" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">URL Foto</Label>
                                            <Input placeholder="Opcional" value={eventFormData.foto_evento} onChange={(e) => setEventFormData({ ...eventFormData, foto_evento: e.target.value })} className="h-12 rounded-xl border-slate-200 font-bold bg-white" />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Equipe Realização</Label>
                                        <div className="grid grid-cols-2 gap-2 max-h-[150px] overflow-y-auto p-2 bg-white rounded-xl border border-slate-200 custom-scrollbar">
                                            {equipe.map(membro => (
                                                <div 
                                                    key={membro.id}
                                                    onClick={() => {
                                                        const current = eventFormData.equipe_realizacao || [];
                                                        setEventFormData({ ...eventFormData, equipe_realizacao: current.includes(membro.id) ? current.filter(id => id !== membro.id) : [...current, membro.id] });
                                                    }}
                                                    className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-all ${(eventFormData.equipe_realizacao || []).includes(membro.id) ? 'bg-indigo-50 border-indigo-200 ring-2 ring-indigo-500/20' : 'bg-slate-50 border-transparent'}`}
                                                >
                                                    <div className={`h-1.5 w-1.5 rounded-full ${(eventFormData.equipe_realizacao || []).includes(membro.id) ? 'bg-indigo-600' : 'bg-slate-300'}`}></div>
                                                    <span className="text-[10px] font-bold text-slate-700 truncate">{membro.nome_completo.split(' ')[0]} {membro.nome_completo.split(' ').pop()}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className={`p-6 rounded-[24px] border transition-all ${eventFormData.has_desmontagem ? 'bg-amber-50/50 border-amber-200/50' : 'bg-slate-50 border-slate-100 opacity-60'}`}>
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <div className={`h-4 w-1 ${eventFormData.has_desmontagem ? 'bg-amber-500' : 'bg-slate-300'} rounded-full`}></div>
                                    <h3 className={`text-xs font-black uppercase tracking-widest ${eventFormData.has_desmontagem ? 'text-amber-600' : 'text-slate-400'}`}>Fase 3: Desmontagem</h3>
                                </div>
                                <div 
                                    onClick={() => setEventFormData({ ...eventFormData, has_desmontagem: !eventFormData.has_desmontagem })}
                                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full border cursor-pointer transition-all ${eventFormData.has_desmontagem ? 'bg-amber-600 border-amber-600 text-white' : 'bg-white border-slate-200 text-slate-400'}`}
                                >
                                    <div className={`h-2 w-2 rounded-full ${eventFormData.has_desmontagem ? 'bg-white' : 'bg-slate-300'}`}></div>
                                    <span className="text-[10px] font-black uppercase tracking-tighter">{eventFormData.has_desmontagem ? 'Habilitado' : 'Desabilitado'}</span>
                                </div>
                            </div>

                            {eventFormData.has_desmontagem && (
                                <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Início (Data)</Label>
                                            <Input type="date" value={eventFormData.desmontagem_inicio_data} onChange={(e) => setEventFormData({ ...eventFormData, desmontagem_inicio_data: e.target.value })} className="h-12 rounded-xl border-slate-200 font-bold bg-white" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Horário</Label>
                                            <Input type="time" value={eventFormData.desmontagem_inicio_hora} onChange={(e) => setEventFormData({ ...eventFormData, desmontagem_inicio_hora: e.target.value })} className="h-12 rounded-xl border-slate-200 font-bold bg-white" />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Término (Data)</Label>
                                            <Input type="date" value={eventFormData.desmontagem_fim_data} onChange={(e) => setEventFormData({ ...eventFormData, desmontagem_fim_data: e.target.value })} className="h-12 rounded-xl border-slate-200 font-bold bg-white" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Horário</Label>
                                            <Input type="time" value={eventFormData.desmontagem_fim_hora} onChange={(e) => setEventFormData({ ...eventFormData, desmontagem_fim_hora: e.target.value })} className="h-12 rounded-xl border-slate-200 font-bold bg-white" />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Equipe Desmontagem</Label>
                                        <div className="grid grid-cols-2 gap-2 max-h-[150px] overflow-y-auto p-2 bg-white rounded-xl border border-slate-200 custom-scrollbar">
                                            {equipe.map(membro => (
                                                <div 
                                                    key={membro.id}
                                                    onClick={() => {
                                                        const current = eventFormData.equipe_desmontagem || [];
                                                        setEventFormData({ ...eventFormData, equipe_desmontagem: current.includes(membro.id) ? current.filter(id => id !== membro.id) : [...current, membro.id] });
                                                    }}
                                                    className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-all ${(eventFormData.equipe_desmontagem || []).includes(membro.id) ? 'bg-amber-100 border-amber-300 ring-2 ring-amber-500/20' : 'bg-slate-50 border-transparent'}`}
                                                >
                                                    <div className={`h-1.5 w-1.5 rounded-full ${(eventFormData.equipe_desmontagem || []).includes(membro.id) ? 'bg-amber-600' : 'bg-slate-300'}`}></div>
                                                    <span className="text-[10px] font-bold text-slate-700 truncate">{membro.nome_completo.split(' ')[0]} {membro.nome_completo.split(' ').pop()}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>


                        {/* OBSERVAÇÕES */}
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Observações Gerais / Plano de Segurança</Label>
                            <Textarea 
                                placeholder="Descreva detalhes importantes..."
                                value={eventFormData.observacoes}
                                onChange={(e) => setEventFormData({ ...eventFormData, observacoes: e.target.value })}
                                className="min-h-[120px] rounded-xl border-slate-200 font-medium resize-none shadow-inner"
                            />
                        </div>
                    </div>

                    <DialogFooter className="p-8 pt-4 bg-slate-50 border-t border-slate-100 shrink-0">
                        <Button variant="ghost" onClick={() => setIsEventModalOpen(false)} className="h-14 rounded-2xl font-black text-slate-400 uppercase tracking-widest text-xs hover:bg-slate-200/50">
                            Cancelar
                        </Button>
                        <Button 
                            onClick={handleCreateEvento} 
                            disabled={loading || !eventFormData.nome}
                            className="h-14 px-10 bg-slate-900 hover:bg-black rounded-2xl font-black text-white uppercase tracking-widest text-xs transition-all active:scale-95 shadow-xl shadow-slate-200"
                        >
                            {loading ? "Processando..." : "Confirmar Planejamento"}
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
