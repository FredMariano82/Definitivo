"use client"

import { useState, useEffect } from "react"
import { 
    DndContext, 
    DragOverlay, 
    closestCorners, 
    KeyboardSensor, 
    PointerSensor, 
    useSensor, 
    useSensors,
    DragEndEvent,
    DragStartEvent,
    defaultDropAnimationSideEffects
} from "@dnd-kit/core"
import { 
    arrayMove, 
    SortableContext, 
    sortableKeyboardCoordinates, 
    verticalListSortingStrategy 
} from "@dnd-kit/sortable"
import { OpServiceV2, OpEquipe } from "@/services/op-service-v2"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
    Users, 
    MapPin, 
    Calendar, 
    Search, 
    UserPlus, 
    ShieldCheck,
    RefreshCcw,
    Zap,
    Anchor,
    Box,
    Lock, 
    Unlock, 
    Coffee, 
    Utensils, 
    Moon, 
    Sunrise, 
    LogOut, 
    ShieldAlert,
    Clock,
    Timer as TimerIcon,
    AlertTriangle,
    ArrowRightLeft,
    Monitor,
    User,
    ShieldCheck as ShieldIcon
} from "lucide-react"

import { useDraggable } from "@dnd-kit/core"
import { useDroppable } from "@dnd-kit/core"
import { CSS } from "@dnd-kit/utilities"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { 
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog"


function DraggableProfessional({ profissional, status, onCheckOut }: { profissional: OpEquipe, status: 'service' | 'off' | 'event', onCheckOut?: (id: string) => void }) {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: profissional.id,
        data: {
            profissional,
            status
        }
    })

    const style = transform ? {
        transform: CSS.Translate.toString(transform),
        zIndex: 1000,
    } : undefined

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...listeners}
            {...attributes}
            className={`
                group p-3 rounded-xl border flex items-center justify-between gap-3 cursor-grab active:cursor-grabbing transition-all duration-200 select-none touch-none
                ${isDragging ? 'opacity-40 ring-2 ring-blue-500 bg-blue-50 z-[9999]' : 'bg-white/70 backdrop-blur-sm border-slate-200 shadow-sm hover:border-blue-300 hover:shadow-md hover:-translate-y-0.5'}
            `}
        >
            <div className="flex items-center gap-3 overflow-hidden flex-1 pointer-events-none">
                <div className="overflow-hidden">
                    <div className="flex items-center gap-2">
                        <p className="text-sm font-black text-slate-800 truncate leading-tight">{profissional.nome_completo}</p>
                        {profissional.tipo_servico === 'VSPP' && (
                            <Badge className="bg-rose-600 text-white text-[9px] font-black h-4 px-1.5 border-none uppercase shadow-sm">VSPP</Badge>
                        )}
                    </div>
                    <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">{profissional.funcao}</p>
                </div>
            </div>
            
            <div className="flex items-center gap-2">
                {status === 'service' && <Zap className="h-3 w-3 text-emerald-500 fill-emerald-500 shrink-0 animate-pulse" />}
                {onCheckOut && (
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-7 w-7 rounded-lg text-slate-300 hover:text-rose-500 hover:bg-rose-50 opacity-0 group-hover:opacity-100 transition-all pointer-events-auto"
                        onClick={(e) => {
                            e.stopPropagation();
                            onCheckOut(profissional.id);
                        }}
                    >
                        <LogOut className="h-3.5 w-3.5" />
                    </Button>
                )}
            </div>
        </div>
    )
}

function DroppableZone({ id, title, icon: Icon, professionals, capacity, colorClass, type, isLocked, onToggleLock, onRemoveProfessional }: any) {
    const { isOver, setNodeRef } = useDroppable({
        id: id,
        data: { type },
        disabled: isLocked
    })

    const isFull = professionals.length >= (capacity || 1)

    return (
        <div 
            ref={setNodeRef}
            className={`
                relative rounded-2xl transition-all duration-400 ease-out p-1
                ${isOver ? 'scale-[1.03] ring-2 ring-blue-400 ring-offset-2' : ''}
                ${isLocked ? 'opacity-60 grayscale-[0.5]' : ''}
            `}
        >
            <Card className={`
                border-none shadow-lg shadow-slate-200/50 overflow-hidden h-full flex flex-col
                ${isOver ? 'bg-blue-50/80 backdrop-blur-md' : 'bg-white/90 backdrop-blur-sm'}
                ${isFull && !isLocked ? 'ring-1 ring-emerald-500/20' : ''}
                ${isLocked ? 'bg-slate-50/50' : ''}
            `}>
                <div className={`h-1.5 w-full ${isLocked ? 'bg-slate-300' : colorClass.split(' ')[1]}`} />
                <CardHeader className="p-4 flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className={`text-[11px] font-black uppercase tracking-[0.2em] flex items-center gap-2 ${isLocked ? 'text-slate-400' : colorClass.split(' ')[0]}`}>
                        <Icon className="h-4 w-4" />
                        <span className="truncate max-w-[120px]">{title}</span>
                    </CardTitle>
                    
                    <div className="flex items-center gap-2">
                        {onToggleLock && (
                            <Button 
                                variant="ghost" 
                                size="icon" 
                                className={`h-6 w-6 rounded-md transition-colors ${isLocked ? 'text-blue-500 bg-blue-50' : 'text-slate-300 hover:text-slate-500'}`}
                                onClick={() => onToggleLock(id)}
                            >
                                {isLocked ? <Lock className="h-3.5 w-3.5" /> : <Unlock className="h-3.5 w-3.5" />}
                            </Button>
                        )}
                        <Badge variant="secondary" className={`font-black px-2 py-0 h-5 border-none ${isLocked ? 'bg-slate-200 text-slate-400' : 'bg-slate-100 text-slate-600'}`}>
                            {professionals.length}
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent className="p-4 pt-2 flex-grow">
                    <div className={`
                        min-h-[110px] rounded-xl border-2 border-dashed p-2 space-y-2 flex flex-col transition-colors
                        ${isOver ? 'border-blue-200 bg-white/50' : 'border-slate-100'}
                        ${isLocked ? 'bg-slate-100/30 border-slate-200' : ''}
                    `}>
                        {isLocked ? (
                            <div className="flex-grow flex flex-col items-center justify-center opacity-40">
                                <Lock className="h-6 w-6 mb-2 text-slate-400" />
                                <span className="text-[9px] font-black uppercase tracking-tighter text-slate-400">Posto Fechado</span>
                            </div>
                        ) : professionals.length === 0 ? (
                            <div className="flex-grow flex flex-col items-center justify-center opacity-20 group">
                                <UserPlus className="h-8 w-8 mb-2 text-slate-400 transition-transform group-hover:scale-110" />
                                <span className="text-[9px] font-black uppercase tracking-tighter text-slate-400">Arraste para alocar</span>
                            </div>
                        ) : (
                            professionals.map((p: any) => (
                                <DraggableProfessional 
                                    key={p.id} 
                                    profissional={p} 
                                    status="event" 
                                    onCheckOut={onRemoveProfessional} 
                                />
                            ))
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

function PauseBanner({ title, color, icon: Icon, time, professionals, onStartPause }: any) {
    const { isOver, setNodeRef } = useDroppable({
        id: `pause-${title.toLowerCase()}`,
        data: { type: 'pause', pauseType: title }
    })

    return (
        <div 
            ref={setNodeRef}
            className={`
                flex-1 min-h-[140px] rounded-3xl p-4 transition-all duration-300 flex flex-col justify-between border-2
                ${isOver ? 'scale-105 ring-4 ring-offset-2' : ''}
                ${color === 'amber' ? 'bg-amber-50 border-amber-100 ring-amber-400' : ''}
                ${color === 'orange' ? 'bg-orange-50 border-orange-100 ring-orange-400' : ''}
                ${color === 'blue' ? 'bg-blue-50 border-blue-100 ring-blue-400' : ''}
                ${color === 'purple' ? 'bg-purple-50 border-purple-100 ring-purple-400' : ''}
            `}
        >
            <div className="flex items-center justify-between">
                <div className={`p-2 rounded-xl bg-white shadow-sm`}>
                    <Icon className={`h-5 w-5 ${color === 'amber' ? 'text-amber-500' : color === 'orange' ? 'text-orange-500' : color === 'blue' ? 'text-blue-500' : 'text-purple-500'}`} />
                </div>
                <Badge variant="outline" className="bg-white/50 border-none font-black text-[10px]">
                    {professionals.length} ATIVOS
                </Badge>
            </div>
            
            <div>
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-600 mb-0.5">{title}</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{time} MINUTOS</p>
            </div>

            <div className="mt-4 space-y-2">
                {professionals.map((p: any) => {
                    const profData = equipe.find(e => e.id === p.id) || { id: p.id, nome_completo: p.nome, funcao: 'Pausa', tipo_servico: p.tipo_servico }
                    return (
                        <div key={p.id} className="relative group">
                            <DraggableProfessional 
                                profissional={profData as any} 
                                status="event"
                            />
                            {/* Overlay do Timer para não quebrar a padronização mas manter a informação */}
                            <div className="absolute right-12 top-1/2 -translate-y-1/2 flex items-center gap-2 pointer-events-none pr-2 border-r border-slate-100 mr-2">
                                <TimerIcon className="h-3 w-3 text-rose-500 animate-pulse" />
                                <span className="text-sm font-black text-rose-600 font-mono">{p.timeLeft}</span>
                            </div>
                        </div>
                    )
                })}
                {professionals.length === 0 && (
                    <p className="text-[8px] font-black text-slate-300 uppercase text-center mt-2">Arraste para iniciar</p>
                )}
            </div>
        </div>
    )
}

function DroppableSidebarArea({ id, reservaAguardando, handleCheckOut, searchTerm }: any) {
    const { isOver, setNodeRef } = useDroppable({
        id: id,
        data: { type: 'pool' }
    })

    return (
        <div 
            ref={setNodeRef} 
            className={`space-y-3 rounded-2xl transition-colors min-h-[500px] ${isOver ? 'bg-blue-50/50 ring-2 ring-blue-200 ring-inset' : ''}`}
        >
            <h3 className="text-[9px] font-black text-emerald-500 uppercase tracking-[0.2em] flex items-center gap-2 mb-4">
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Efetivo em Reserva
            </h3>
            <div className="grid gap-2">
                {reservaAguardando.map((p: any) => (
                    <DraggableProfessional key={p.id} profissional={p} status="service" onCheckOut={handleCheckOut} />
                ))}
                {reservaAguardando.length === 0 && !searchTerm && (
                    <div className="text-[10px] text-slate-300 border border-dashed rounded-xl py-6 text-center flex flex-col items-center gap-2">
                        <ShieldAlert className="h-4 w-4 opacity-30" />
                        <span>Sem profissionais aguardando alocação</span>
                    </div>
                )}
            </div>
            {isOver && (
                <div className="absolute inset-0 flex items-center justify-center bg-blue-50/80 backdrop-blur-sm rounded-2xl z-10 border-2 border-dashed border-blue-400">
                    <div className="flex flex-col items-center gap-2 text-blue-600">
                        <Box className="h-8 w-8 animate-bounce" />
                        <span className="text-xs font-black uppercase tracking-widest">Soltar para Base</span>
                    </div>
                </div>
            )}
        </div>
    )
}

// --- COMPONENTE PRINCIPAL ---

export default function PainelTaticoV2() {
    const [equipe, setEquipe] = useState<OpEquipe[]>([])
    const [postos, setPostos] = useState<any[]>([])
    const [eventos, setEventos] = useState<any[]>([])
    const [alocacoes, setAlocacoes] = useState<any[]>([])
    const [escalasHoje, setEscalasHoje] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [lockedPostos, setLockedPostos] = useState<string[]>([])
    const [pausasAtivas, setPausasAtivas] = useState<any[]>([])
    const [activeId, setActiveId] = useState<string | null>(null)
    const [searchTerm, setSearchTerm] = useState("")

    // Estado para o Modal de Rendição
    const [rendicaoData, setRendicaoData] = useState<{
        aberto: boolean,
        profissionalEntrando: any,
        profissionalSaindo: any,
        targetPostoId: string,
        targetType: 'fixed' | 'event'
    }>({
        aberto: false,
        profissionalEntrando: null,
        profissionalSaindo: null,
        targetPostoId: '',
        targetType: 'fixed'
    })

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 3 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    )

    const toggleLock = (postoId: string) => {
        setLockedPostos(prev => 
            prev.includes(postoId) ? prev.filter(id => id !== postoId) : [...prev, postoId]
        )
    }

    const fetchData = async () => {
        setLoading(true)
        try {
            const hojeStr = new Date().toLocaleDateString('en-CA')
            const [eqData, postData, evData, alocData, escData] = await Promise.all([
                OpServiceV2.getEquipe(),
                OpServiceV2.getPostos(),
                OpServiceV2.getEventosAtivosKanban(),
                OpServiceV2.getAlocacoesAtuais(),
                OpServiceV2.getEscalasPeriodo(hojeStr, hojeStr)
            ])
            setEquipe(eqData)
            setPostos(postData)
            setEventos(evData)
            setAlocacoes(alocData)
            setEscalasHoje(escData)
        } catch (error) {
            console.error("Erro ao carregar dados táticos:", error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchData()
        
        // Mock de timers de pausa para a interface
        const interval = setInterval(() => {
            setPausasAtivas(prev => prev.map(p => ({
                ...p,
                timeLeft: p.seconds > 0 ? `${Math.floor((p.seconds - 1)/60)}:${((p.seconds - 1)%60).toString().padStart(2, '0')}` : '00:00',
                seconds: Math.max(0, p.seconds - 1)
            })))
        }, 1000)
        return () => clearInterval(interval)
    }, [])

    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(event.active.id as string)
    }

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event
        setActiveId(null)

        if (!over) return

        const profissionalId = active.id as string
        const targetId = over.id as string
        const type = over.data.current?.type
        const pauseType = over.data.current?.pauseType

        // CORREÇÃO: Função da Base/Reserva (Pool)
        if (targetId === 'pool') {
            try {
                await OpServiceV2.salvarAlocacao(profissionalId, null)
                setPausasAtivas(prev => prev.filter(p => p.id !== profissionalId))
                await fetchData()
            } catch (err) {
                console.error("Erro ao liberar para base:", err)
            }
            return
        }
        if (type === 'fixed' || type === 'event') {
            const profsNoPosto = alocacoes.filter(a => a.posto_id === targetId)
            if (profsNoPosto.length > 0) {
                const entrando = equipe.find(p => p.id === profissionalId)
                const saindoId = profsNoPosto[0].colaborador_id
                const saindo = equipe.find(p => p.id === saindoId)
                
                setRendicaoData({
                    aberto: true,
                    profissionalEntrando: entrando,
                    profissionalSaindo: saindo,
                    targetPostoId: targetId,
                    targetType: type
                })
                return // Aguarda decisão do modal
            }
        }

        try {
            if (targetId === 'pool') {
                await OpServiceV2.salvarAlocacao(profissionalId, null)
                setPausasAtivas(prev => prev.filter(p => p.id !== profissionalId))
            } 
            else if (type === 'pause') {
                const prof = equipe.find(p => p.id === profissionalId)
                const times: any = { 'Café': 15, 'Refeição': 60, 'Janta': 30, 'Ceia': 60 }
                const mins = times[pauseType] || 15
                
                setPausasAtivas(prev => [
                    ...prev.filter(p => p.id !== profissionalId),
                    { id: profissionalId, nome: prof?.nome_completo, type: pauseType, seconds: mins * 60, timeLeft: `${mins}:00` }
                ])
                await OpServiceV2.salvarAlocacao(profissionalId, null) 
            }
            else if (type === 'event') {
                const evento = eventos.find(e => e.id === targetId)
                if (evento?.posto_id) {
                    await OpServiceV2.salvarAlocacao(profissionalId, evento.posto_id)
                }
            } else {
                await OpServiceV2.salvarAlocacao(profissionalId, targetId)
            }
        } catch (err) {
            console.error("Erro ao salvar alocação:", err)
        }
        
        await fetchData()
    }

    const confirmarRendicao = async (destinoSaindo: string) => {
        const { profissionalEntrando, profissionalSaindo, targetPostoId } = rendicaoData
        
        try {
            // 1. Aloca o novo profissional no posto
            await OpServiceV2.salvarAlocacao(profissionalEntrando.id, targetPostoId)
            
            // 2. Destina o profissional que saiu
            if (destinoSaindo === 'Reserva') {
                await OpServiceV2.salvarAlocacao(profissionalSaindo.id, null)
            } else {
                // Inicia pausa
                const times: any = { 'Café': 15, 'Refeição': 60, 'Janta': 30, 'Ceia': 60 }
                const mins = times[destinoSaindo] || 15
                
                setPausasAtivas(prev => [
                    ...prev.filter(p => p.id !== profissionalSaindo.id),
                    { id: profissionalSaindo.id, nome: profissionalSaindo.nome_completo, type: destinoSaindo, seconds: mins * 60, timeLeft: `${mins}:00` }
                ])
                await OpServiceV2.salvarAlocacao(profissionalSaindo.id, null)
            }
        } catch (err) {
            console.error("Erro na rendição:", err)
        }

        setRendicaoData(prev => ({ ...prev, aberto: false }))
        await fetchData()
    }

    const handleCheckOut = async (id: string) => {
        if (!confirm("Encerrar o plantão deste profissional hoje?")) return
        try {
            await OpServiceV2.salvarAlocacao(id, null)
            // Aqui poderia ter um check-out real no banco se houvesse tabela de ponto
            await fetchData()
        } catch (err) {
            console.error(err)
        }
    }

    const getStatusParaProfissional = (id: string) => {
        const prof = equipe.find(p => p.id === id)
        if (!prof) return 'off'

        const estaAlocado = alocacoes.find(a => a.colaborador_id === id)
        if (estaAlocado) return 'assigned'

        const trabalhaHoje = OpServiceV2.getTrabalhaNoDia(prof, new Date(), escalasHoje)
        return trabalhaHoje ? 'service' : 'off'
    }

    // Filtragem de Busca e Efetivo
    const equipeFiltrada = equipe.filter(p => 
        p.nome_completo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.funcao.toLowerCase().includes(searchTerm.toLowerCase())
    )

    // Quem deveria estar trabalhando hoje (Escala Automática + Manual)
    const efetivoTotalHoje = equipeFiltrada.filter(p => {
        const status = getStatusParaProfissional(p.id)
        return status === 'service' || status === 'assigned'
    })

    // Quem está no efetivo mas ainda não foi para um posto (Reserva)
    const reservaAguardando = efetivoTotalHoje.filter(p => !alocacoes.some(a => a.colaborador_id === p.id))

    const getProfisNoPosto = (postoId: string) => {
        const ids = alocacoes.filter(a => a.posto_id === postoId).map(a => a.colaborador_id)
        return equipe.filter(p => ids.includes(p.id))
    }

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-[500px] bg-white/50 backdrop-blur-sm rounded-3xl border border-white">
                <div className="relative h-16 w-16 mb-6">
                    <RefreshCcw className="h-16 w-16 text-blue-500 animate-spin opacity-20" />
                    <Anchor className="h-8 w-8 text-blue-600 absolute top-4 left-4" />
                </div>
                <p className="font-black uppercase tracking-[0.3em] text-[10px] text-slate-500 border-t border-slate-200 pt-4">Sincronizando Torre de Controle</p>
            </div>
        )
    }

    return (
        <DndContext 
            sensors={sensors} 
            collisionDetection={closestCorners} 
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
        >
            <div className="flex flex-col md:flex-row gap-8 min-h-[800px] bg-slate-50/50 p-2 rounded-3xl">
                
                {/* COLUNA LATERAL - GLASSMorphism SIDEBAR */}
                <div className="w-full md:w-80 shrink-0">
                    <Card className="border-none shadow-xl shadow-slate-200/60 bg-white/80 backdrop-blur-xl h-full sticky top-6">
                        <CardHeader className="p-6 pb-4">
                            <CardTitle className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Users className="h-4 w-4 text-blue-500" />
                                    <span>Efetivo do Dia</span>
                                </div>
                                <Badge className="bg-blue-50 text-blue-600 border-none font-bold">
                                    {efetivoTotalHoje.length}
                                </Badge>
                            </CardTitle>
                            
                            {/* Busca */}
                            <div className="mt-4 relative">
                                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                                <Input 
                                    placeholder="Buscar profissional..." 
                                    className="pl-9 bg-slate-100/50 border-none h-10 rounded-xl text-sm font-medium focus-visible:ring-blue-400"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </CardHeader>

                        <CardContent className="p-5 pt-0 space-y-6">
                            <div className="space-y-6 overflow-y-auto max-h-[700px] pr-2 custom-scrollbar">
                                <DroppableSidebarArea id="pool" reservaAguardando={reservaAguardando} handleCheckOut={handleCheckOut} searchTerm={searchTerm} />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* PAINEL CENTRAL - OPERACIONAL UNIFICADO */}
                <div className="flex-grow space-y-10 overflow-hidden">
                    
                    {/* GESTÃO DE PAUSAS NO TOPO */}
                    <section className="space-y-6">
                        <header className="flex items-center gap-4 mb-4">
                            <div className="h-10 w-1 rounded-full bg-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.4)]" />
                            <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3 italic">
                                LOGÍSTICA
                                <span className="text-slate-200 not-italic">/</span>
                                <span className="text-slate-400 text-lg uppercase tracking-[0.1em] not-italic font-black">Gestão de Pausas</span>
                            </h2>
                        </header>

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                            <PauseBanner 
                                title="Café" 
                                color="amber" 
                                icon={Coffee} 
                                time={15} 
                                professionals={pausasAtivas.filter(p => p.type === 'Café')} 
                            />
                            <PauseBanner 
                                title="Refeição" 
                                color="orange" 
                                icon={Utensils} 
                                time={60} 
                                professionals={pausasAtivas.filter(p => p.type === 'Refeição')} 
                            />
                            <PauseBanner 
                                title="Janta" 
                                color="blue" 
                                icon={Moon} 
                                time={30} 
                                professionals={pausasAtivas.filter(p => p.type === 'Janta')} 
                            />
                            <PauseBanner 
                                title="Ceia" 
                                color="purple" 
                                icon={Sunrise} 
                                time={60} 
                                professionals={pausasAtivas.filter(p => p.type === 'Ceia')} 
                            />
                        </div>
                    </section>
                    
                    {/* MAPA DE POSTOS ABAIXO */}
                    <section className="space-y-6">
                        <header className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="h-10 w-1 rounded-full bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]" />
                                <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3 italic">
                                    TORRE DE CONTROLE
                                    <span className="text-slate-200 not-italic">/</span>
                                    <span className="text-slate-400 text-lg uppercase tracking-[0.1em] not-italic font-black">Mapa de Postos</span>
                                </h2>
                            </div>
                        </header>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {/* POSTO RENDICIONISTA FIXO */}
                            <DroppableZone 
                                id="rendicionista" 
                                title="RENDICIONISTA" 
                                icon={Users} 
                                professionals={getProfisNoPosto('rendicionista')} 
                                capacidade={99} 
                                colorClass="text-blue-600 bg-blue-600" 
                                type="fixed" 
                                onRemoveProfessional={async (id: string) => {
                                    await OpServiceV2.salvarAlocacao(id, null)
                                    await fetchData()
                                }}
                            />

                            {postos
                                .filter(p => !p.nome_posto.includes(':'))
                                .sort((a, b) => {
                                    const ordem = ['42', '41', '25 - Alceu (1)', '25 - Alceu (2)', '25 - Alceu (3)', '56', '57', '51', '43', '44']
                                    const getIndex = (name: string) => {
                                        const idx = ordem.findIndex(pattern => name.startsWith(pattern))
                                        return idx === -1 ? 999 : idx
                                    }
                                    return getIndex(a.nome_posto) - getIndex(b.nome_posto)
                                })
                                .map(posto => {
                                    let borderColor = 'text-emerald-500 bg-emerald-500'
                                    if (posto.nome_posto.startsWith('4')) borderColor = 'text-blue-500 bg-blue-500'
                                    if (posto.nome_posto.startsWith('25')) borderColor = 'text-rose-500 bg-rose-500'
                                    if (posto.nome_posto.startsWith('5')) borderColor = 'text-orange-500 bg-orange-500'
                                    
                                    return (
                                        <DroppableZone 
                                            key={posto.id} 
                                            id={posto.id} 
                                            title={posto.nome_posto} 
                                            icon={MapPin} 
                                            professionals={getProfisNoPosto(posto.id)}
                                            capacity={posto.capacidade || 1}
                                            colorClass={borderColor}
                                            type="fixed"
                                            isLocked={lockedPostos.includes(posto.id)}
                                            onToggleLock={toggleLock}
                                            onRemoveProfessional={async (profId: string) => {
                                                await OpServiceV2.salvarAlocacao(profId, null)
                                                await fetchData()
                                            }}
                                        />
                                    )
                                })}
                        </div>
                    </section>

                    {/* EVENTOS ATIVOS */}
                    {eventos.length > 0 && (
                        <section className="space-y-6">
                            <header className="flex items-center gap-4">
                                <div className="h-10 w-1 rounded-full bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.5)]" />
                                <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3 italic">
                                    ESTRATÉGIA
                                    <span className="text-slate-200 not-italic">/</span>
                                    <span className="text-slate-400 text-lg uppercase tracking-[0.1em] not-italic font-black">Eventos Kanban</span>
                                </h2>
                            </header>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {eventos.map(ev => (
                                    <DroppableZone 
                                        key={ev.id} 
                                        id={ev.id} 
                                        title={ev.titulo} 
                                        icon={Calendar} 
                                        professionals={getProfisNoPosto(ev.id)}
                                        capacity={0}
                                        colorClass="text-blue-500 bg-blue-500"
                                        onRemoveProfessional={async (profId: string) => {
                                            await OpServiceV2.salvarAlocacao(profId, null)
                                            await fetchData()
                                        }}
                                    />
                                ))}
                            </div>
                        </section>
                    )}
                </div>
            </div>

            {/* MODAL DE RENDIÇÃO INTELIGENTE */}
            <Dialog open={rendicaoData.aberto} onOpenChange={(open) => !open && setRendicaoData(prev => ({ ...prev, aberto: false }))}>
                <DialogContent className="max-w-md bg-slate-900 border-slate-800 text-white rounded-[32px] overflow-hidden p-0 shadow-2xl">
                    <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-8 text-center relative overflow-hidden">
                        <ArrowRightLeft className="h-16 w-16 text-white/20 absolute -right-4 -top-4 rotate-12" />
                        <div className="relative z-10 flex flex-col items-center">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="h-14 w-14 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-xl">
                                    <ArrowRightLeft className="h-8 w-8 text-white" />
                                </div>
                                <h2 className="text-2xl font-black uppercase tracking-tight italic">Troca de Posto</h2>
                            </div>
                            <p className="text-blue-100 text-sm font-medium">Defina o destino do profissional que está saindo.</p>
                        </div>
                    </div>

                    <div className="p-8 space-y-8">
                        <div className="flex items-center justify-between gap-4 bg-slate-800/50 p-4 rounded-2xl border border-slate-700/50">
                            <div className="text-center flex-1">
                                <p className="text-[10px] font-black text-emerald-400 uppercase mb-1">Entra</p>
                                <p className="text-sm font-black truncate">{rendicaoData.profissionalEntrando?.nome_completo.split(' ')[0]}</p>
                            </div>
                            <div className="h-10 w-10 rounded-full bg-slate-700 flex items-center justify-center">
                                <ArrowRightLeft className="h-5 w-5 text-slate-400" />
                            </div>
                            <div className="text-center flex-1">
                                <p className="text-[10px] font-black text-rose-400 uppercase mb-1">Sai</p>
                                <p className="text-sm font-black truncate">{rendicaoData.profissionalSaindo?.nome_completo.split(' ')[0]}</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                {[
                                    { label: 'Café', icon: Coffee, color: 'hover:bg-amber-600 hover:border-amber-500' },
                                    { label: 'Refeição', icon: Utensils, color: 'hover:bg-orange-600 hover:border-orange-500' },
                                    { label: 'Janta', icon: Moon, color: 'hover:bg-blue-600 hover:border-blue-500' },
                                    { label: 'Ceia', icon: Sunrise, color: 'hover:bg-purple-600 hover:border-purple-500' },
                                    { label: 'Reserva', icon: Box, color: 'hover:bg-slate-600 hover:border-slate-500 col-span-2' }
                                ].map((btn) => (
                                    <button
                                        key={btn.label}
                                        onClick={() => confirmarRendicao(btn.label)}
                                        className={`
                                            flex items-center justify-center gap-3 p-4 rounded-2xl bg-slate-800 border border-slate-700
                                            transition-all duration-200 active:scale-95 group font-black text-xs uppercase tracking-widest
                                            ${btn.color}
                                        `}
                                    >
                                        <btn.icon className="h-4 w-4 group-hover:scale-110 transition-transform" />
                                        {btn.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                    
                    <div className="p-4 bg-slate-950/50 text-center">
                        <button 
                            onClick={() => setRendicaoData(prev => ({ ...prev, aberto: false }))}
                            className="text-[10px] font-black text-slate-500 uppercase hover:text-white transition-colors"
                        >
                            Cancelar Operação
                        </button>
                    </div>
                </DialogContent>
            </Dialog>

            <DragOverlay dropAnimation={{
                sideEffects: defaultDropAnimationSideEffects({
                    styles: {
                        active: {
                            opacity: '0.4',
                        },
                    },
                }),
            }}>
                {activeId ? (
                    <div className="p-4 rounded-2xl border-2 border-blue-500 bg-white/95 backdrop-blur-md shadow-2xl flex items-center gap-4 min-w-[240px] border-b-4 scale-105 transition-transform rotate-2">
                        <div className="h-10 w-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black text-sm shadow-lg">
                            {equipe.find(p => p.id === activeId)?.nome_completo.charAt(0)}
                        </div>
                        <div className="overflow-hidden">
                            <p className="text-sm font-black text-slate-900 truncate">{equipe.find(p => p.id === activeId)?.nome_completo}</p>
                            <p className="text-[10px] text-blue-600 uppercase font-black tracking-widest flex items-center gap-1">
                                <Zap className="h-3 w-3 fill-blue-600" />
                                Movimentando...
                            </p>
                        </div>
                    </div>
                ) : null}
            </DragOverlay>

        </DndContext>
    )
}
