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
    Settings
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { OpServiceV2, OpEquipe, OpEscalaDiaria } from "@/services/op-service-v2"
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

export default function GestaoEquipeV2() {
    const [currentDate, setCurrentDate] = useState(new Date())
    const [equipe, setEquipe] = useState<OpEquipe[]>([])
    const [excecoes, setExcecoes] = useState<OpEscalaDiaria[]>([])
    const [loading, setLoading] = useState(true)
    
    // Estados para o Modal de Edição
    const [editingColab, setEditingColab] = useState<OpEquipe | null>(null)
    const [isEditModalOpen, setIsEditModalOpen] = useState(false)
    const [editFormData, setEditFormData] = useState({
        referencia_escala: "",
        data_reciclagem: "",
        data_inicio_ferias: "",
        data_fim_ferias: ""
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
            const [membros, listaExcecoes] = await Promise.all([
                OpServiceV2.getEquipe(),
                OpServiceV2.getEscalasPeriodo(
                    format(monthStart, 'yyyy-MM-dd'),
                    format(monthEnd, 'yyyy-MM-dd')
                )
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
            data_fim_ferias: membro.data_fim_ferias || ""
        })
        setIsEditModalOpen(true)
    }

    const handleSaveEdits = async () => {
        if (!editingColab) return
        setLoading(true)
        try {
            await OpServiceV2.updateEquipe(editingColab.id, editFormData)
            setIsEditModalOpen(false)
            loadData()
        } catch (error) {
            console.error("Erro ao atualizar colaborador:", error)
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
                        <Button variant="ghost" size="icon" onClick={prevMonth} className="hover:bg-slate-100 rounded-xl h-10 w-10">
                            <ChevronLeft className="h-6 w-6 text-slate-600" />
                        </Button>
                        <div className="flex flex-col items-center min-w-[160px]">
                            <span className="font-black text-slate-800 capitalize text-sm tracking-tight">
                                {format(currentDate, "MMMM yyyy", { locale: ptBR })}
                            </span>
                        </div>
                        <Button variant="ghost" size="icon" onClick={nextMonth} className="hover:bg-slate-100 rounded-xl h-10 w-10">
                            <ChevronRight className="h-6 w-6 text-slate-600" />
                        </Button>
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
                                    {days.map(day => (
                                        <th key={day.toString()} className={`p-3 text-center border-r last:border-r-0 min-w-[48px] ${isToday(day) ? 'bg-blue-50/80 shadow-inner' : ''}`}>
                                            <div className="flex flex-col items-center">
                                                <span className={`text-[10px] font-black uppercase tracking-tighter ${isToday(day) ? 'text-blue-600' : 'text-slate-400'}`}>
                                                    {format(day, "eee", { locale: ptBR })}
                                                </span>
                                                <span className={`text-base font-black mt-1 ${isToday(day) ? 'text-blue-600' : 'text-slate-700'}`}>
                                                    {format(day, "d")}
                                                </span>
                                            </div>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {equipe.map((membro) => (
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
                                            
                                            let status = statusTeorico ? 'Trabalhando' : 'Folga'
                                            if (excecao) status = excecao.status_dia
                                            
                                            if (membro.data_inicio_ferias && membro.data_fim_ferias) {
                                                const dayStr = format(day, 'yyyy-MM-dd')
                                                if (dayStr >= membro.data_inicio_ferias && dayStr <= membro.data_fim_ferias) {
                                                    status = 'Férias'
                                                }
                                            }

                                            return (
                                                <td key={day.toString()} className={`p-1.5 border-r last:border-r-0 ${isToday(day) ? 'bg-blue-50/20' : ''}`}>
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
