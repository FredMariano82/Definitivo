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
import { format, parseISO, differenceInSeconds } from 'date-fns'
import { OpServiceV2, OpEquipe } from "@/services/op-service-v2"
import { useTheme } from "@/contexts/theme-context"
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
    Radio,
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
    ShieldCheck as ShieldIcon,
    Sun,
    FileDown
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"

const styles = `
@keyframes pulsate-suggested {
  0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(245, 158, 11, 0.4); }
  50% { transform: scale(1.02); box-shadow: 0 0 0 10px rgba(245, 158, 11, 0); }
  100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(245, 158, 11, 0); }
}
.pulsate-suggested {
  animation: pulsate-suggested 2s infinite;
}

@keyframes card-pulse {
  0% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.4); transform: scale(1.05); }
  50% { box-shadow: 0 0 20px 10px rgba(59, 130, 246, 0); transform: scale(1.08); }
  100% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.4); transform: scale(1.05); }
}
.active-card-pulse {
  animation: card-pulse 2s infinite ease-in-out;
}
`

function DraggableProfessional({ profissional, status, pausa, horarioAlocacao, onCheckOut }: { profissional: OpEquipe, status: 'service' | 'off' | 'event' | 'break' | 'assigned', pausa?: any, horarioAlocacao?: string, onCheckOut?: (id: string) => void }) {
    const { isDarkMode } = useTheme()
    
    // Cálculo do Tempo de Permanência no Posto
    const getStayTime = () => {
        if (!horarioAlocacao) return null;
        try {
            const [h, m, s] = horarioAlocacao.split(':').map(Number);
            const dataAloc = new Date();
            dataAloc.setHours(h, m, s || 0);
            
            const diffMs = new Date().getTime() - dataAloc.getTime();
            const diffMins = Math.floor(diffMs / (1000 * 60));
            
            if (diffMins < 0) return '0:00';
            const hours = Math.floor(diffMins / 60);
            const mins = diffMins % 60;
            return `${hours}:${mins.toString().padStart(2, '0')}`;
        } catch (e) {
            return null;
        }
    }

    const stayTime = getStayTime();

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
                ${isDragging ? 'opacity-40 ring-2 ring-blue-500 bg-blue-50 z-[9999]' : ''}
                ${!isDragging && (isDarkMode ? 'bg-slate-800/80 backdrop-blur-sm border-white/5 shadow-xl hover:border-blue-500/50' : 'bg-white/70 backdrop-blur-sm border-slate-200 shadow-sm hover:border-blue-300 hover:shadow-md hover:-translate-y-0.5')}
            `}
        >
            <div className="flex items-center gap-3 overflow-hidden flex-1 pointer-events-none">
                <div className="overflow-hidden">
                    <div className="flex items-center gap-2">
                        <p className={`text-sm font-black truncate leading-tight ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>{profissional.nome_completo}</p>
                        {profissional.tipo_servico === 'VSPP' && (
                            <Badge className="bg-rose-600 text-white text-[9px] font-black h-4 px-1.5 border-none uppercase shadow-sm">VSPP</Badge>
                        )}
                    </div>
                    <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">{profissional.funcao}</p>
                </div>
            </div>
            
            <div className="flex items-center gap-2">
                {(() => {
                    // 1. Se estiver OFF, não mostra nada
                    if (status === 'off') return null;

                    // 2. Se houver uma pausa ativa, ela tem PRIORIDADE MÁXIMA
                    if (pausa) {
                        const typeVal = pausa.type || pausa.tipo_pausa || '';
                        const label = String(typeVal).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                        
                        if (label.includes('cafe')) return <Coffee className="h-4 w-4 text-orange-500 animate-pulse shrink-0 fill-orange-500/10" />;
                        if (label.includes('refeicao') || label.includes('janta') || label.includes('almoco')) return <Utensils className="h-4 w-4 text-blue-500 animate-pulse shrink-0 fill-blue-500/10" />;
                        if (label.includes('ceia')) return <Moon className="h-4 w-4 text-purple-500 animate-pulse shrink-0 fill-purple-500/10" />;
                        
                        // Fallback para qualquer outra pausa
                        return <TimerIcon className="h-4 w-4 text-amber-500 animate-pulse shrink-0" />;
                    }

                    // 3. Se não está em pausa nem no posto, e é service, mostra o RAIO (Reserva)
                    if (status === 'service') {
                        return <Zap className="h-3.5 w-3.5 text-emerald-500 fill-emerald-500 shrink-0 animate-pulse" />;
                    }

                    // 4. Se estiver alocado em POSTO ou EVENTO, mostra o tempo de PERMANÊNCIA (Legibilidade Aumentada)
                    if ((status === 'assigned' || status === 'event') && stayTime) {
                        return (
                            <div className="absolute right-1.5 bottom-1.5 flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-white/90 backdrop-blur-md border border-slate-200/50 shadow-sm z-10 transition-opacity group-hover:opacity-60">
                                <TimerIcon className="h-3 w-3 text-slate-500" />
                                <span className="text-[12px] font-black text-slate-700 font-mono tracking-tighter">{stayTime}</span>
                            </div>
                        );
                    }

                    return null;
                })()}
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

function DroppableZone({ id, title, icon: Icon, professionals, alocacoes, capacity, colorClass, type, isLocked, onToggleLock, onRemoveProfessional }: any) {
    const { isDarkMode } = useTheme()
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
                border-none shadow-lg overflow-hidden flex flex-col w-[300px] shrink-0 transition-colors duration-500
                ${isOver ? (isDarkMode ? 'bg-blue-900/40 backdrop-blur-md' : 'bg-blue-50/80 backdrop-blur-md') : (isDarkMode ? 'bg-slate-900/90 backdrop-blur-sm' : 'bg-white/90 backdrop-blur-sm')}
                ${isFull && !isLocked ? 'ring-1 ring-emerald-500/20' : ''}
                ${isLocked ? (isDarkMode ? 'bg-black/40' : 'bg-slate-50/50') : ''}
                ${isDarkMode ? 'shadow-black/40' : 'shadow-slate-200/50'}
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
                        ${isOver ? (isDarkMode ? 'border-blue-500/50 bg-blue-900/20' : 'border-blue-200 bg-white/50') : (isDarkMode ? 'border-white/5' : 'border-slate-100')}
                        ${isLocked ? (isDarkMode ? 'bg-black/20 border-white/5' : 'bg-slate-100/30 border-slate-200') : ''}
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
                            professionals.map((p: OpEquipe) => {
                                const aloc = (alocacoes || []).find((a: any) => String(a.colaborador_id) === String(p.id))
                                return (
                                    <DraggableProfessional 
                                        key={p.id} 
                                        profissional={p} 
                                        status="assigned" 
                                        horarioAlocacao={aloc?.horario_alocacao}
                                        onCheckOut={onRemoveProfessional} 
                                    />
                                )
                            })
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

function PauseBanner({ title, color, icon: Icon, time, professionals, equipe, onStartPause }: any) {
    const { isDarkMode } = useTheme()
    const { isOver, setNodeRef } = useDroppable({
        id: `pause-${title.toLowerCase()}`,
        data: { type: 'pause', pauseType: title }
    })

    return (
        <div 
            ref={setNodeRef}
            className={`
                min-h-[140px] rounded-3xl p-4 transition-all duration-300 flex flex-col justify-between border-2 w-[300px] shrink-0
                ${isOver ? 'scale-105 ring-4 ring-offset-2' : ''}
                ${color === 'amber' ? (isDarkMode ? 'bg-amber-950/20 border-amber-500/30 ring-amber-500' : 'bg-amber-50 border-amber-100 ring-amber-400') : ''}
                ${color === 'orange' ? (isDarkMode ? 'bg-orange-950/20 border-orange-500/30 ring-orange-400' : 'bg-orange-50 border-orange-100 ring-orange-400') : ''}
                ${color === 'blue' ? (isDarkMode ? 'bg-blue-950/20 border-blue-500/30 ring-blue-400' : 'bg-blue-50 border-blue-100 ring-blue-400') : ''}
                ${color === 'purple' ? (isDarkMode ? 'bg-purple-950/20 border-purple-500/30 ring-purple-400' : 'bg-purple-50 border-purple-100 ring-purple-400') : ''}
            `}
        >
            <div className="flex items-center justify-between">
                <div className={`p-2 rounded-xl shadow-sm ${isDarkMode ? 'bg-slate-800' : 'bg-white'}`}>
                    <Icon className={`h-5 w-5 ${color === 'amber' ? 'text-amber-500' : color === 'orange' ? 'text-orange-500' : color === 'blue' ? 'text-blue-500' : 'text-purple-500'}`} />
                </div>
                <Badge variant="outline" className="bg-white/50 border-none font-black text-[10px]">
                    {professionals.length} ATIVOS
                </Badge>
            </div>
            
            <div>
                <h3 className={`text-xs font-black uppercase tracking-widest mb-0.5 ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>{title}</h3>
                <p className={`text-[10px] font-bold uppercase tracking-tighter ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>{time} MINUTOS</p>
            </div>

            <div className="mt-4 space-y-2">
                {professionals.map((p: any) => {
                    const profData: OpEquipe = equipe.find((e: OpEquipe) => e.id === p.id) || { id: p.id, nome_completo: (p as any).nome, funcao: 'Pausa', tipo_servico: '' }
                    const isOverdue = p.seconds > p.limitSeconds
                    const displaySeconds = isOverdue ? (p.seconds - p.limitSeconds) : p.seconds
                    const displayTime = `${Math.floor(displaySeconds/60)}:${(displaySeconds%60).toString().padStart(2, '0')}`
                    const timerColor = isOverdue ? 'text-rose-600' : 'text-emerald-500'
                    const iconColor = isOverdue ? 'text-rose-500' : 'text-emerald-500'

                    return (
                        <div key={p.id} className="relative group">
                            <DraggableProfessional 
                                profissional={profData} 
                                status="event"
                            />
                            {/* Overlay do Timer Dinâmico - Ajustado para o Canto Inferior Direito */}
                            <div className="absolute right-4 bottom-2 flex items-center gap-1.5 pointer-events-none px-2 py-0.5 rounded-lg bg-white/50 backdrop-blur-sm shadow-sm border border-slate-100/50">
                                <TimerIcon className={`h-2.5 w-2.5 ${iconColor} ${isOverdue ? 'animate-pulse' : ''}`} />
                                <span className={`text-[11px] font-black ${timerColor} font-mono`}>{displayTime}</span>
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

function DroppableSidebarArea({ id, reservaAguardando, handleCheckOut, searchTerm, getStatusParaProfissional, pausasAtivas }: any) {
    const { isDarkMode } = useTheme()
    const { isOver, setNodeRef } = useDroppable({
        id: id,
        data: { type: 'pool' }
    })

    return (
        <div 
            ref={setNodeRef} 
            className={`space-y-3 rounded-2xl transition-colors min-h-[500px] ${isOver ? (isDarkMode ? 'bg-blue-900/20 ring-2 ring-blue-500/50' : 'bg-blue-50/50 ring-2 ring-blue-200 ring-inset') : ''}`}
        >
            <h3 className="text-[9px] font-black text-emerald-500 uppercase tracking-[0.2em] flex items-center gap-2 mb-4">
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Efetivo Escalado
            </h3>
            <div className="grid gap-2">
                {reservaAguardando.map((p: OpEquipe) => {
                    const status = getStatusParaProfissional(p.id);
                    const pausa = pausasAtivas.find((pa: any) => 
                        String(pa.colaborador_id) === String(p.id) || String(pa.id) === String(p.id)
                    );
                    return <DraggableProfessional key={p.id} profissional={p} status={status as any} pausa={pausa} onCheckOut={handleCheckOut} />
                })}
                {reservaAguardando.length === 0 && !searchTerm && (
                    <div className="text-[10px] text-slate-300 border border-dashed rounded-xl py-6 text-center flex flex-col items-center gap-2">
                        <ShieldAlert className="h-4 w-4 opacity-30" />
                        <span>Nenhum profissional escalado para hoje</span>
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
    const { isDarkMode } = useTheme()
    const [equipe, setEquipe] = useState<OpEquipe[]>([])
    const [postos, setPostos] = useState<any[]>([])
    const [eventos, setEventos] = useState<any[]>([])
    const [alocacoes, setAlocacoes] = useState<any[]>([])
    const [escalasHoje, setEscalasHoje] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [lockedPostos, setLockedPostos] = useState<string[]>([])
    const [pausasAtivas, setPausasAtivas] = useState<any[]>([])
    const [turnoAtivo, setTurnoAtivo] = useState<'Dia' | 'Noite'>(() => {
        const hora = new Date().getHours()
        return (hora >= 6 && hora < 18) ? 'Dia' : 'Noite'
    })
    const [guiaTurno, setGuiaTurno] = useState<any[]>([])
    const [activeId, setActiveId] = useState<string | null>(null)
    const [searchTerm, setSearchTerm] = useState("")
    const [activeTab, setActiveTab] = useState<'tatico' | 'relatorios'>('tatico')
    const [historico, setHistorico] = useState<any[]>([])
    const [lastTick, setLastTick] = useState(Date.now())

    // Expor alocações globalmente para componentes filhos menores poderem consultar sem prop drilling excessivo
    if (typeof window !== 'undefined') {
        (window as any).__v2_alocacoes = alocacoes;
    }

    // Ticker para atualizar timers a cada minuto
    useEffect(() => {
        const timer = setInterval(() => {
            setLastTick(Date.now())
        }, 60000)
        return () => clearInterval(timer)
    }, [])

    // Estado para o Modal de Rendição
    const [rendicaoData, setRendicaoData] = useState<{
        aberto: boolean,
        profissionalEntrando: OpEquipe | null,
        profissionalSaindo: OpEquipe | null,
        targetPostoId: string,
        targetType: 'fixed' | 'event'
    }>({
        aberto: false,
        profissionalEntrando: null,
        profissionalSaindo: null,
        targetPostoId: '',
        targetType: 'fixed'
    })

    // Estado para o Modal de Download de Relatórios
    const [downloadModal, setDownloadModal] = useState({
        aberto: false,
        dataInicio: format(new Date(), 'yyyy-MM-dd'),
        dataFim: format(new Date(), 'yyyy-MM-dd'),
        profissionalId: 'todos'
    })

    // Estado para o Modal de Equipamentos (Rádio/Colete)
    const [equipamentoModal, setEquipamentoModal] = useState({
        aberto: false,
        profissionalId: '',
        targetId: '',
        targetType: '',
        radioHT: '',
        colete: false
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

    const fetchData = async (silent = false) => {
        if (!silent) setLoading(true)
        try {
            const hojeStr = new Date().toLocaleDateString('en-CA')
            const [eqData, postData, evData, alocData, escData, pausaData] = await Promise.all([
                OpServiceV2.getEquipe(),
                OpServiceV2.getPostos(),
                OpServiceV2.getEventosAtivosKanban(),
                OpServiceV2.getAlocacoesAtuais(),
                OpServiceV2.getEscalasPeriodo(hojeStr, hojeStr),
                OpServiceV2.getActivePauses()
            ])
            setEquipe(eqData)
            setPostos(postData)
            setEventos(evData)
            setAlocacoes(alocData)
            setEscalasHoje(escData)

            // Sincronizar Pausas Ativas do Banco para o Estado local
            const pAtivas = (pausaData || []).map((p: { colaborador_id: string; data_inicio: string; segundos_duracao: number; tipo_pausa: string; }) => {
                const prof = eqData.find((e: OpEquipe) => e.id === p.colaborador_id)
                const inicio = parseISO(p.data_inicio)
                const agora = new Date()
                const decorrido = differenceInSeconds(agora, inicio)
                const restante = Math.max(0, p.segundos_duracao - decorrido)
                
                // Mudar exibição: Refeição -> Almoço
                const tipoExibicao = p.tipo_pausa === 'Refeição' ? 'Almoço' : p.tipo_pausa

                return {
                    id: p.colaborador_id,
                    nome: prof?.nome_completo || 'Desconhecido',
                    type: tipoExibicao,
                    seconds: decorrido, // Agora armazenamos o tempo decorrido
                    limitSeconds: p.segundos_duracao, // E o limite máximo
                    timeLeft: `${Math.floor(decorrido/60)}:${(decorrido%60).toString().padStart(2, '0')}`
                }
            })
            setPausasAtivas(pAtivas)

            // Buscar histórico se estiver na aba de relatórios
            const histData = await OpServiceV2.getHistoricoFiltrado({
                startDate: hojeStr,
                endDate: hojeStr
            })
            setHistorico(histData)
        } catch (error) {
            console.error("Erro ao carregar dados táticos:", error)
        } finally {
            if (!silent) setLoading(false)
        }
    }

    const fetchGuia = async () => {
        try {
            const data = await OpServiceV2.getShiftGuide(turnoAtivo)
            setGuiaTurno(data)
        } catch (error) {
            console.error("Erro ao carregar guia de turno:", error)
        }
    }

    useEffect(() => {
        const prepare = async () => {
            await fetchData()
            await fetchGuia()
            // Garantir que o RENDICIONISTA exista logo no início
            try {
                await OpServiceV2.ensurePostoExists('RENDICIONISTA')
            } catch (e) {
                console.warn("Nao foi possivel pre-criar RENDICIONISTA")
            }
        }
        prepare()
    }, [turnoAtivo])

    useEffect(() => {
        // Mock de timers de pausa para a interface
        const interval = setInterval(() => {
            setPausasAtivas(prev => prev.map(p => {
                const newSeconds = p.seconds + 1
                return {
                    ...p,
                    seconds: newSeconds,
                    timeLeft: `${Math.floor(newSeconds/60)}:${(newSeconds%60).toString().padStart(2, '0')}`
                }
            }))
        }, 1000)
        return () => clearInterval(interval)
    }, [])

    // Carregar dados iniciais
    useEffect(() => {
        fetchData(false) // Carga inicial visível
        const interval = setInterval(() => fetchData(true), 30000) // Refresh silencioso a cada 30s
        return () => clearInterval(interval)
    }, [])

    // Carregar dados quando a aba de relatório for selecionada
    useEffect(() => {
        if (activeTab === 'relatorios') {
            fetchData(true) // Silencioso ao trocar de aba
        }
    }, [activeTab])

    const handleExportarFiltrado = async () => {
        try {
            const logs = await OpServiceV2.getHistoricoFiltrado({
                startDate: downloadModal.dataInicio,
                endDate: downloadModal.dataFim,
                colaborador_id: downloadModal.profissionalId
            })

            if (logs.length === 0) {
                alert("Nenhum dado encontrado para o período/profissional selecionado.")
                return
            }

            const headers = ["Horário", "Ação", "Profissional", "Origem", "Destino", "Rendeu Quem", "Duração (min)", "Rádio HT", "Colete"]
            const csvContent = [
                "\ufeff" + headers.join(";"), // Adiciona BOM para UTF-8 no Excel
                ...logs.map(log => [
                    format(parseISO(log.created_at), 'dd/MM/yyyy HH:mm:ss'),
                    log.acao,
                    log.colaborador_nome,
                    log.posto_origem || "",
                    log.posto_destino || "",
                    log.rendeu_quem_nome || "",
                    log.duracao_prevista ? Math.floor(log.duracao_prevista/60) : "",
                    log.radio_ht || "",
                    log.possui_colete ? "SIM" : "NÃO"
                ].join(";"))
            ].join("\n")

            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
            const link = document.createElement("a")
            const url = URL.createObjectURL(blob)
            link.setAttribute("href", url)
            link.setAttribute("download", `relatorio_tatico_filtrado_${downloadModal.dataInicio}_a_${downloadModal.dataFim}.csv`)
            link.style.visibility = 'hidden'
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            setDownloadModal(prev => ({ ...prev, aberto: false }))
        } catch (err) {
            console.error("Erro ao exportar relatório:", err)
            alert("Erro ao gerar relatório.")
        }
    }

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
                const prof = equipe.find(p => p.id === profissionalId)
                const alocAntiga = alocacoes.find(a => a.colaborador_id === profissionalId)
                const postoAntigo = postos.find(p => p.id === alocAntiga?.posto_id)

                const { atraso } = await OpServiceV2.salvarAlocacao(profissionalId, null)
                setPausasAtivas(prev => prev.filter(p => p.id !== profissionalId))
                
                await OpServiceV2.logMovimentacao({
                    colaborador_id: profissionalId,
                    colaborador_nome: prof?.nome_completo || 'Desconhecido',
                    acao: 'RETORNO À BASE',
                    posto_origem: postoAntigo?.nome_posto || 'Posto',
                    tempo_atraso: atraso
                })

                await fetchData()
            } catch (err) {
                console.error("Erro ao liberar para base:", err)
            }
            return
        }
        if (type === 'fixed' || type === 'event') {
            const postoAlvo = postos.find(p => p.id === targetId || p.nome_posto?.trim().toUpperCase() === 'RENDICIONISTA')
            const isRendicionista = postoAlvo?.nome_posto?.trim().toUpperCase() === 'RENDICIONISTA'
            const profsNoPosto = alocacoes.filter(a => a.posto_id === targetId)
            
            // BUSCAR MEMÓRIA DE EQUIPAMENTO (Último rádio usado hoje)
            const lastLogEq = historico.find(h => h.colaborador_id === profissionalId && (h.radio_ht || h.possui_colete))
            const radioSugerido = lastLogEq?.radio_ht || ''
            const coleteSugerido = lastLogEq?.possui_colete || false

            // Aborda rendição apenas se não for rendicionista E já houver alguém
            if (!isRendicionista && profsNoPosto.length > 0) {
                const entrando = equipe.find(p => p.id === profissionalId)
                const saindoId = profsNoPosto[0].colaborador_id
                const saindo = equipe.find(p => p.id === saindoId)
                
                setRendicaoData({
                    aberto: true,
                    profissionalEntrando: entrando || null,
                    profissionalSaindo: saindo || null,
                    targetPostoId: targetId,
                    targetType: type
                })
                return // Aguarda decisão do modal
            }

            // NOVO: Se está vindo do POOL (Reserva) para um POSTO, pede equipamentos
            const alocAtual = alocacoes.find(a => a.colaborador_id === profissionalId)
            if (!alocAtual) {
                setEquipamentoModal({
                    aberto: true,
                    profissionalId,
                    targetId,
                    targetType: type,
                    radioHT: radioSugerido,
                    colete: coleteSugerido
                })
                return
            }
        }

        try {
            // AUTOCURA: Se for rendicionista mas o ID não for UUID, resolve agora
            let finalTargetId = targetId
            if (targetId === 'rendicionista' || (targetId && targetId.length < 30)) {
                // Tenta resolver por nome se não parecer um UUID
                const pNome = (targetId === 'rendicionista' || targetId?.trim().toUpperCase() === 'RENDICIONISTA') 
                    ? 'RENDICIONISTA' 
                    : over.data.current?.title
                
                if (pNome) {
                    finalTargetId = await OpServiceV2.ensurePostoExists(pNome)
                }
            }

                const prof = equipe.find((p: OpEquipe) => p.id === profissionalId)
                const alocAntiga = alocacoes.find(a => a.colaborador_id === profissionalId)
                const postoAntigo = postos.find(p => p.id === alocAntiga?.posto_id)

                if (type === 'pause') {
                    const times: { [key: string]: number } = { 'Café': 15, 'Refeição': 60, 'Janta': 30, 'Ceia': 60 }
                    const mins = times[pauseType] || 15
                    const agoraIso = new Date().toISOString()
                    
                    await OpServiceV2.salvarAlocacao(profissionalId, null)
                    await OpServiceV2.startPause(profissionalId, pauseType, mins * 60, undefined, agoraIso)
                    
                    await OpServiceV2.logMovimentacao({
                        colaborador_id: profissionalId,
                        colaborador_nome: prof?.nome_completo || 'Desconhecido',
                        acao: 'INÍCIO PAUSA',
                        posto_origem: postoAntigo?.nome_posto || 'Reserva',
                        posto_destino: pauseType,
                        duracao_prevista: mins * 60
                    })
                }
                else if (type === 'event') {
                    const evento = eventos.find(e => e.id === targetId)
                    if (evento?.posto_id) {
                        const { atraso } = await OpServiceV2.salvarAlocacao(profissionalId, evento.posto_id)
                        await OpServiceV2.logMovimentacao({
                            colaborador_id: profissionalId,
                            colaborador_nome: prof?.nome_completo || 'Desconhecido',
                            acao: 'ALOCAÇÃO EVENTO',
                            posto_destino: evento.titulo,
                            tempo_atraso: atraso
                        })
                    }
                } else {
                    const { atraso } = await OpServiceV2.salvarAlocacao(profissionalId, finalTargetId)
                    const postoDest = postos.find(p => p.id === finalTargetId)
                    await OpServiceV2.logMovimentacao({
                        colaborador_id: profissionalId,
                        colaborador_nome: prof?.nome_completo || 'Desconhecido',
                        acao: 'ALOCAÇÃO DIRETA',
                        posto_origem: postoAntigo?.nome_posto || 'Reserva',
                        posto_destino: postoDest?.nome_posto || 'Posto',
                        tempo_atraso: atraso
                    })
                }
        } catch (err: any) {
            console.error("Erro ao salvar alocação:", err)
            // Log detalhado para o desenvolvedor ver o erro do banco no console
            if (err.message) console.error("Detalhes do erro:", err.message)
        }
        
        await fetchData()
    }

    const confirmarRendicao = async (destinoSaindo: string) => {
        const { profissionalEntrando, profissionalSaindo, targetPostoId } = rendicaoData
        
        if (!profissionalEntrando || !profissionalSaindo) {
            console.error("Dados de rendição incompletos.")
            return
        }

        try {
            const postoAlvo = postos.find(p => p.id === targetPostoId)

            // 1. Aloca o novo profissional no posto (Lembrando o rádio dele)
            const lastLogEntrando = historico.find(h => h.colaborador_id === profissionalEntrando.id && (h.radio_ht || h.possui_colete))
            const { atraso: atrasoEntrando } = await OpServiceV2.salvarAlocacao(
                profissionalEntrando.id, 
                targetPostoId, 
                lastLogEntrando?.radio_ht, 
                lastLogEntrando?.possui_colete
            )
            
            await OpServiceV2.logMovimentacao({
                colaborador_id: profissionalEntrando.id,
                colaborador_nome: profissionalEntrando.nome_completo,
                acao: 'RENDIÇÃO (ENTRADA)',
                posto_destino: postoAlvo?.nome_posto || 'Posto',
                rendeu_quem_id: profissionalSaindo.id,
                rendeu_quem_nome: profissionalSaindo.nome_completo,
                tempo_atraso: atrasoEntrando
            })

            // 2. Destina o profissional que saiu
            if (destinoSaindo === 'Reserva') {
                const { atraso: atrasoSaindo } = await OpServiceV2.salvarAlocacao(profissionalSaindo.id, null)
                await OpServiceV2.logMovimentacao({
                    colaborador_id: profissionalSaindo.id,
                    colaborador_nome: profissionalSaindo.nome_completo,
                    acao: 'RENDIÇÃO (SAÍDA PARA RESERVA)',
                    posto_origem: postoAlvo?.nome_posto || 'Posto',
                    tempo_atraso: atrasoSaindo
                })
            } else {
                // Inicia pausa (Café, Refeição, etc.)
                const times: { [key: string]: number } = { 'Café': 15, 'Refeição': 60, 'Janta': 30, 'Ceia': 60 }
                const mins = times[destinoSaindo] || 15
                
                // IMPORTANTE: Primeiro remove a alocação (que encerra pausas antigas)
                // e DEPOIS inicia a nova pausa.
                const agoraIso = new Date().toISOString()
                const { atraso: atrasoSaindo } = await OpServiceV2.salvarAlocacao(profissionalSaindo.id, null)
                await OpServiceV2.startPause(profissionalSaindo.id, destinoSaindo, mins * 60, undefined, agoraIso)

                await OpServiceV2.logMovimentacao({
                    colaborador_id: profissionalSaindo.id,
                    colaborador_nome: profissionalSaindo.nome_completo,
                    acao: `RENDIÇÃO (SAÍDA PARA ${destinoSaindo.toUpperCase()})`,
                    posto_origem: postoAlvo?.nome_posto || 'Posto',
                    posto_destino: destinoSaindo,
                    duracao_prevista: mins * 60,
                    tempo_atraso: atrasoSaindo
                })
            }
        } catch (err) {
            console.error("Erro na rendição:", err)
        }

        setRendicaoData(prev => ({ ...prev, aberto: false }))
        await fetchData()
    }

    const handleConfirmarEquipamento = async () => {
        const { profissionalId, targetId, targetType, radioHT, colete } = equipamentoModal
        console.log('--- CONFIRMANDO EQUIPAMENTOS ---')
        console.log('Profissional:', profissionalId)
        console.log('ID Alvo Inicial:', targetId)
        
        try {
            const prof = equipe.find(p => p.id === profissionalId)
            let finalTargetId = targetId
            
            // Autocura de ID do posto
            if (targetId === 'rendicionista' || (targetId && targetId.length < 30)) {
                console.log('Resolvendo ID não-UUID...')
                const pNome = (targetId === 'rendicionista' || targetId?.trim().toUpperCase() === 'RENDICIONISTA') 
                    ? 'RENDICIONISTA' 
                    : targetId
                finalTargetId = await OpServiceV2.ensurePostoExists(pNome)
            }

            console.log('ID Alvo Final:', finalTargetId)

            if (targetType === 'event') {
                const evento = eventos.find(e => e.id === targetId)
                if (evento?.posto_id) {
                    const { atraso } = await OpServiceV2.salvarAlocacao(profissionalId, evento.posto_id, radioHT, colete)
                    await OpServiceV2.logMovimentacao({
                        colaborador_id: profissionalId,
                        colaborador_nome: prof?.nome_completo || 'Desconhecido',
                        acao: 'ALOCAÇÃO EVENTO',
                        posto_destino: evento.titulo,
                        radio_ht: radioHT,
                        possui_colete: colete,
                        tempo_atraso: atraso
                    })
                }
            } else {
                const { atraso } = await OpServiceV2.salvarAlocacao(profissionalId, finalTargetId, radioHT, colete)
                const postoDest = postos.find(p => p.id === finalTargetId)
                console.log('Posto localizado na lista:', postoDest?.nome_posto)
                
                await OpServiceV2.logMovimentacao({
                    colaborador_id: profissionalId,
                    colaborador_nome: prof?.nome_completo || 'Desconhecido',
                    acao: 'ALOCAÇÃO DIRETA',
                    posto_destino: postoDest?.nome_posto || 'Posto',
                    radio_ht: radioHT,
                    possui_colete: colete,
                    tempo_atraso: atraso
                })
            }
            console.log('Alocação concluída com sucesso.')
        } catch (err: any) {
            console.error("ERRO CRÍTICO NA ALOCAÇÃO:", err)
            alert("Erro ao salvar alocação: " + (err.message || 'Erro desconhecido'))
        }

        setEquipamentoModal(prev => ({ ...prev, aberto: false }))
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
        const prof = equipe.find((p: OpEquipe) => String(p.id) === String(id))
        if (!prof) return 'off'

        const emPausa = pausasAtivas.find(p => 
            String(p.colaborador_id) === String(id) || String(p.id) === String(id)
        )
        if (emPausa) return 'break'

        const estaAlocado = alocacoes.find(a => String(a.colaborador_id) === String(id))
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
        return status === 'service' || status === 'assigned' || status === 'break'
    })

    // Quem está no efetivo mas ainda não foi para um posto (Reserva + Pausa)
    const reservaAPonteat = efetivoTotalHoje.filter(p => {
        const s = getStatusParaProfissional(p.id)
        return s === 'service' || s === 'break'
    })

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
            <style>{styles}</style>
            <div className={`flex flex-col md:flex-row gap-8 min-h-[800px] transition-colors duration-500 rounded-3xl pt-6 ${isDarkMode ? 'bg-slate-900/40' : 'bg-slate-50/50 p-2'}`}>
                
                {/* COLUNA LATERAL - GLASSMorphism SIDEBAR */}
                <div className="w-full md:w-80 shrink-0">
                    <Card className={`border-none shadow-xl transition-colors duration-500 h-full sticky top-6 ${isDarkMode ? 'bg-slate-900/80 shadow-black/20 text-slate-100' : 'shadow-slate-200/60 bg-white/80 backdrop-blur-xl'}`}>
                        <CardHeader className="p-6 pb-4">
                            <CardTitle className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Users className="h-4 w-4 text-blue-500" />
                                    <span>Efetivo Escalado</span>
                                </div>
                                <Badge className="bg-blue-50 text-blue-600 border-none font-bold">
                                    {efetivoTotalHoje.length}
                                </Badge>
                            </CardTitle>
                            
                            {/* Tab & Shift Toggles */}
                            <div className="space-y-4 mt-6">
                                <div className="flex flex-col gap-2">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Vista do Painel</p>
                                    <div className={`flex p-1 rounded-2xl border shadow-inner ${isDarkMode ? 'bg-slate-800/80 border-white/5' : 'bg-slate-100 border-slate-200'}`}>
                                        <button 
                                            onClick={() => setActiveTab('tatico')}
                                            className={`flex-1 py-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 ${activeTab === 'tatico' ? (isDarkMode ? 'bg-slate-700 text-white shadow-lg' : 'bg-white text-blue-600 shadow-md') : 'text-slate-400 hover:text-slate-600'}`}
                                        >
                                            <Monitor className="h-4 w-4" /> PAINEL
                                        </button>
                                        <button 
                                            onClick={() => setActiveTab('relatorios')}
                                            className={`flex-1 py-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 ${activeTab === 'relatorios' ? (isDarkMode ? 'bg-slate-700 text-white shadow-lg' : 'bg-white text-blue-600 shadow-md') : 'text-slate-400 hover:text-slate-600'}`}
                                        >
                                            <Calendar className="h-4 w-4" /> RELATÓRIOS
                                        </button>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-2">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Turno Ativo</p>
                                    <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200 shadow-inner">
                                        <button 
                                            onClick={() => setTurnoAtivo('Dia')}
                                            className={`flex-1 py-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 ${turnoAtivo === 'Dia' ? (isDarkMode ? 'bg-amber-600 text-white' : 'bg-white text-amber-600 shadow-md') : 'text-slate-400 hover:text-slate-600'}`}
                                        >
                                            <Sun className="h-4 w-4" /> DIA
                                        </button>
                                        <button 
                                            onClick={() => setTurnoAtivo('Noite')}
                                            className={`flex-1 py-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 ${turnoAtivo === 'Noite' ? 'bg-slate-900 text-blue-400 shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
                                        >
                                            <Moon className="h-4 w-4" /> NOITE
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Busca */}
                            <div className="mt-4 relative">
                                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                                <Input 
                                    placeholder="Buscar profissional..." 
                                    className={`pl-9 border-none h-10 rounded-xl text-sm font-medium focus-visible:ring-blue-400 ${isDarkMode ? 'bg-slate-800 text-white placeholder:text-slate-600' : 'bg-slate-100/50'}`}
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </CardHeader>

                        <CardContent className="p-5 pt-0 space-y-6">
                            <div className="space-y-6 overflow-y-auto max-h-[700px] pr-2 custom-scrollbar">
                                <DroppableSidebarArea 
                                    id="pool" 
                                    reservaAguardando={reservaAPonteat} 
                                    handleCheckOut={handleCheckOut} 
                                    searchTerm={searchTerm} 
                                    getStatusParaProfissional={getStatusParaProfissional}
                                    pausasAtivas={pausasAtivas} 
                                />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* PAINEL CENTRAL - OPERACIONAL UNIFICADO - LIMITADO A 4 COLUNAS (300px cada) */}
                <div className="flex-grow space-y-10 overflow-hidden max-w-[1320px] mx-auto lg:mx-0">
                    
                    {activeTab === 'tatico' ? (
                        <>
                            {/* GESTÃO DE PAUSAS NO TOPO */}
                    <section className="space-y-6">
                        <header className="flex items-center gap-4 mb-4">
                             <div className="h-10 w-1 rounded-full bg-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.4)]" />
                            <h2 className={`text-2xl font-black tracking-tight flex items-center gap-3 italic ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                                LOGÍSTICA
                                <span className={isDarkMode ? 'text-slate-700' : 'text-slate-200'}>/</span>
                                <span className={`text-lg uppercase tracking-[0.1em] not-italic font-black ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Gestão de Pausas</span>
                            </h2>
                        </header>

                        {/* BARRA DE GUIA OPERACIONAL - AGORA COM QUEBRA DE LINHA */}
                        <div className="mb-8 p-4 bg-slate-100/30 rounded-3xl border border-slate-100/50">
                            <div className="flex flex-wrap gap-4">
                                {guiaTurno.map((item, idx) => {
                                    const isCurrent = () => {
                                        const agora = new Date()
                                        const horaMini = parseInt(item.horario_alvo.split(':')[0])
                                        const minMini = parseInt(item.horario_alvo.split(':')[1])
                                        const hItem = new Date()
                                        hItem.setHours(horaMini, minMini, 0)
                                        
                                        // Se estamos dentro de 60 min após o horário alvo, é "atual"
                                        const diff = (agora.getTime() - hItem.getTime()) / (1000 * 60)
                                        return diff >= 0 && diff < 60
                                    }

                                    const active = isCurrent()
                                    
                                    return (
                                        <div 
                                            key={idx} 
                                            className={`
                                                flex flex-col p-4 rounded-3xl border transition-all duration-300 w-[300px] shrink-0
                                                ${active 
                                                    ? (isDarkMode 
                                                        ? `bg-${item.cor_alerta}-950/40 border-${item.cor_alerta}-500/50 z-10 shadow-2xl active-card-pulse` 
                                                        : `bg-${item.cor_alerta}-50 border-${item.cor_alerta}-200 ring-2 ring-${item.cor_alerta}-400/20 z-10 shadow-xl active-card-pulse`)
                                                    : (isDarkMode
                                                        ? 'bg-slate-800/40 border-slate-700/50 opacity-40 grayscale hover:grayscale-0 hover:opacity-100'
                                                        : 'bg-white border-slate-100 opacity-60 grayscale hover:grayscale-0 hover:opacity-100')
                                                }
                                            `}
                                        >
                                            <div className="flex items-center justify-between mb-2">
                                                <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-lg ${active ? `bg-${item.cor_alerta}-200 text-${item.cor_alerta}-800` : 'bg-slate-100 text-slate-500'}`}>
                                                    {item.horario_alvo.substring(0, 5)}
                                                </span>
                                                {active && <div className={`h-2 w-2 rounded-full bg-${item.cor_alerta}-500 animate-pulse`} />}
                                            </div>
                                            <h3 className={`text-sm font-black mb-1 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{item.titulo}</h3>
                                            <p className={`text-[11px] leading-relaxed ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>{item.instrucao}</p>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-6">
                             <PauseBanner 
                                title="Café" 
                                color="amber" 
                                icon={Coffee} 
                                time={15} 
                                professionals={pausasAtivas.filter(p => p.type === 'Café')} 
                                equipe={equipe}
                            />
                            <PauseBanner 
                                title="Almoço" 
                                color="orange" 
                                icon={Utensils} 
                                time={60} 
                                professionals={pausasAtivas.filter(p => p.type === 'Almoço' || p.type === 'Refeição')} 
                                equipe={equipe}
                            />
                            <PauseBanner 
                                title="Janta" 
                                color="blue" 
                                icon={Moon} 
                                time={30} 
                                professionals={pausasAtivas.filter(p => p.type === 'Janta')} 
                                equipe={equipe}
                            />
                            <PauseBanner 
                                title="Ceia" 
                                color="purple" 
                                icon={Sunrise} 
                                time={60} 
                                professionals={pausasAtivas.filter(p => p.type === 'Ceia')} 
                                equipe={equipe}
                            />
                        </div>
                    </section>
                    
                    {/* MAPA DE POSTOS ABAIXO */}
                    <section className="space-y-6">
                        <header className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="h-10 w-1 rounded-full bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]" />
                                <h2 className={`text-2xl font-black tracking-tight flex items-center gap-3 italic ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                                    TORRE DE CONTROLE
                                    <span className={isDarkMode ? 'text-slate-700' : 'text-slate-200'}>/</span>
                                    <span className={`text-lg uppercase tracking-[0.1em] not-italic font-black ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Mapa de Postos</span>
                                </h2>
                            </div>
                        </header>

                        <div className="flex flex-wrap gap-6">
                            {/* POSTO RENDICIONISTA DINÂMICO */}
                            {(postos || []).length > 0 && (() => {
                                const postoRend = postos.find(p => p.nome_posto?.trim().toUpperCase() === 'RENDICIONISTA')
                                const rendId = postoRend?.id || 'rendicionista'
                                return (
                                    <DroppableZone 
                                        id={rendId} 
                                        title="RENDICIONISTA" 
                                        icon={Users} 
                                        professionals={getProfisNoPosto(rendId)} 
                                        alocacoes={alocacoes}
                                        capacidade={99} 
                                        colorClass="text-blue-600 bg-blue-600" 
                                        type="fixed" 
                                        onRemoveProfessional={async (id: string) => {
                                            await OpServiceV2.salvarAlocacao(id, null)
                                            await fetchData()
                                        }}
                                    />
                                )
                            })()}

                            {/* MAPA DE TODOS OS OUTROS POSTOS */}
                            {postos
                                .filter(p => !p.nome_posto?.includes(':') && p.nome_posto?.trim().toUpperCase() !== 'RENDICIONISTA')
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
                                    
                                    const isSuggested = guiaTurno.some(g => {
                                        const agora = new Date()
                                        const hItem = new Date()
                                        const [h, m] = g.horario_alvo.split(':')
                                        hItem.setHours(parseInt(h), parseInt(m), 0)
                                        const diff = (agora.getTime() - hItem.getTime()) / (1000 * 60)
                                        return diff >= 0 && diff < 60 && g.postos_sugeridos.includes(posto.nome_posto)
                                    })

                                    return (
                                        <DroppableZone 
                                            key={posto.id} 
                                            id={posto.id} 
                                            title={posto.nome_posto} 
                                            icon={MapPin} 
                                            professionals={getProfisNoPosto(posto.id)}
                                            alocacoes={alocacoes}
                                            capacity={posto.capacity || 1}
                                            colorClass={isSuggested ? 'text-amber-500 bg-amber-500 ring-4 ring-amber-400/40 scale-105 z-10 pulsate-suggested' : borderColor}
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

                            <div className="flex flex-wrap gap-6">
                                {eventos.map(ev => (
                                    <DroppableZone 
                                        key={ev.id} 
                                        id={ev.id} 
                                        title={ev.titulo} 
                                        icon={Calendar} 
                                        professionals={getProfisNoPosto(ev.id)}
                                        alocacoes={alocacoes}
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
                    </>
                ) : (
                    /* ABA DE RELATÓRIOS - ESTILO EXCEL */
                    <section className="space-y-6 animate-in fade-in duration-500">
                        <header className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-4">
                                <div className="h-10 w-1 rounded-full bg-blue-600 shadow-[0_0_15px_rgba(37,99,235,0.4)]" />
                                <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3 italic">
                                    RELATÓRIOS
                                    <span className={isDarkMode ? 'text-slate-700' : 'text-slate-200'}>/</span>
                                    <span className={`text-lg uppercase tracking-[0.1em] not-italic font-black ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Monitoramento de Efetivo (Live)</span>
                                </h2>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button 
                                    variant="outline" 
                                    className="rounded-xl border-slate-200 text-slate-600 font-bold hover:bg-slate-50 gap-2"
                                    onClick={() => setDownloadModal(prev => ({ ...prev, aberto: true }))}
                                >
                                    <FileDown className="h-4 w-4" /> Download
                                </Button>
                                <Button 
                                    variant="outline" 
                                    className="rounded-xl border-slate-200 text-slate-600 font-bold hover:bg-slate-50 gap-2"
                                    onClick={() => fetchData()}
                                >
                                    <RefreshCcw className="h-4 w-4" /> Atualizar Dados
                                </Button>
                            </div>
                        </header>

                        <Card className={`border-none shadow-xl shadow-slate-200/50 overflow-hidden rounded-3xl ${isDarkMode ? 'bg-slate-900/80 shadow-black/20' : 'bg-white/90 backdrop-blur-sm'}`}>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse table-fixed">
                                    <thead>
                                        <tr className={`border-b ${isDarkMode ? 'bg-slate-800/50 border-white/5' : 'bg-slate-50/50 border-slate-100'}`}>
                                            <th className="w-[200px] px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Profissional</th>
                                            <th className="w-[180px] px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status / Local Atual</th>
                                            <th className="w-[150px] px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Equipamento Ativo</th>
                                            <th className="w-[120px] px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Pausas realizadas</th>
                                            <th className="w-[150px] px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Atrasos (Hoje)</th>
                                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Última Atividade</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {equipeFiltrada.filter(p => {
                                            const s = getStatusParaProfissional(p.id)
                                            return s === 'assigned' || s === 'break'
                                        }).length === 0 ? (
                                            <tr>
                                                <td colSpan={6} className="px-6 py-20 text-center text-slate-300 italic font-medium">
                                                    Nenhum profissional em atividade (Posto ou Pausa).
                                                </td>
                                            </tr>
                                        ) : (
                                            equipeFiltrada
                                                .filter(p => {
                                                    const s = getStatusParaProfissional(p.id)
                                                    return s === 'assigned' || s === 'break'
                                                })
                                                .map((prof) => {
                                                const aloc = alocacoes.find(a => a.colaborador_id === prof.id)
                                                const pausa = pausasAtivas.find(p => p.colaborador_id === prof.id)
                                                const logsProf = (historico || []).filter(h => h.colaborador_id === prof.id)
                                                const somaAtrasos = logsProf.reduce((acc, current) => acc + (current.tempo_atraso || 0), 0)
                                                const ultimaLog = logsProf[0]
                                                const postoAtual = postos.find(p => p.id === aloc?.posto_id)

                                                // Formatar descrição rica da atividade
                                                const getDescAtividade = (log: any) => {
                                                    if (!log) return '-'
                                                    let desc = log.acao || 'Ação'
                                                    if (log.posto_origem && log.posto_destino) desc = `${log.posto_origem} → ${log.posto_destino}`
                                                    else if (log.posto_destino) desc = `Para ${log.posto_destino}`
                                                    else if (log.posto_origem) desc = `Saindo de ${log.posto_origem}`
                                                    return desc
                                                }

                                                return (
                                                    <tr key={prof.id} className={`transition-colors group ${isDarkMode ? 'hover:bg-white/5' : 'hover:bg-slate-50/50'}`}>
                                                        <td className="px-6 py-4">
                                                            <div className="flex items-center gap-3">
                                                                <div className={`h-10 w-10 min-w-10 rounded-xl flex items-center justify-center font-black text-xs shadow-sm ${isDarkMode ? 'bg-slate-800 text-blue-400' : 'bg-blue-50 text-blue-600'}`}>
                                                                    {prof.nome_completo?.charAt(0)}
                                                                </div>
                                                                <div className="flex flex-col min-w-0">
                                                                    <span className={`text-sm font-black truncate ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>{prof.nome_completo}</span>
                                                                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tight truncate">{prof.funcao}</span>
                                                                </div>
                                                            </div>
                                                        </td>

                                                        <td className="px-6 py-4">
                                                            {pausa ? (
                                                                <div className="flex items-center gap-2">
                                                                    <div className="h-2 w-2 rounded-full bg-orange-500 animate-pulse" />
                                                                    <Badge variant="outline" className="bg-orange-50 text-orange-700 border-none font-black text-[9px] uppercase px-2">EM {pausa.tipo_pausa?.toUpperCase() || 'PAUSA'}</Badge>
                                                                </div>
                                                            ) : aloc ? (
                                                                <div className="flex items-center gap-2">
                                                                    <div className="h-2 w-2 rounded-full bg-emerald-500" />
                                                                    <div className="flex flex-col">
                                                                        <span className={`text-xs font-black italic ${isDarkMode ? 'text-emerald-400' : 'text-emerald-700'}`}>{postoAtual?.nome_posto || 'Posto'}</span>
                                                                        <span className="text-[9px] text-slate-400 font-bold uppercase">ALOCADO</span>
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <div className="flex items-center gap-2 opacity-50">
                                                                    <div className="h-2 w-2 rounded-full bg-slate-300" />
                                                                    <span className="text-xs font-black text-slate-400 italic">Reserva</span>
                                                                </div>
                                                            )}
                                                        </td>

                                                        <td className="px-6 py-4">
                                                            <div className="flex flex-wrap gap-2">
                                                                {aloc?.radio_ht ? (
                                                                    <div className="flex items-center gap-1 bg-blue-50 text-blue-700 px-2 py-1 rounded-lg border border-blue-100" title="Rádio HT">
                                                                        <Radio className="h-3.5 w-3.5" />
                                                                        <span className="text-[11px] font-black italic">{aloc.radio_ht}</span>
                                                                    </div>
                                                                ) : <span className="text-slate-300 text-xs px-2">-</span>}
                                                                {aloc?.possui_colete && (
                                                                    <div className="flex items-center gap-1 bg-slate-50 text-slate-700 px-2 py-1 rounded-lg border border-slate-200" title="Colete Balístico">
                                                                        <ShieldCheck className="h-3.5 w-3.5" />
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </td>

                                                        <td className="px-6 py-4">
                                                            <div className="flex items-center justify-center gap-2">
                                                                {(() => {
                                                                    const countCafe = logsProf.filter(l => l.acao?.includes('PARA CAFÉ')).length;
                                                                    const hasAlmoco = logsProf.some(l => l.acao?.includes('PARA REFEIÇÃO') || l.acao?.includes('PARA ALMOÇO'));
                                                                    const hasJanta = logsProf.some(l => l.acao?.includes('PARA JANTA'));
                                                                    const hasCeia = logsProf.some(l => l.acao?.includes('PARA CEIA'));

                                                                    return (
                                                                        <>
                                                                            <TooltipProvider>
                                                                                <Tooltip>
                                                                                    <TooltipTrigger asChild>
                                                                                        <div className="relative group/pause">
                                                                                            <Coffee className={`h-4 w-4 transition-all ${countCafe > 0 ? 'text-amber-500 fill-amber-500/20' : 'text-slate-200'}`} />
                                                                                            {countCafe > 1 && (
                                                                                                <span className="absolute -top-2 -right-2 bg-amber-500 text-white text-[8px] font-black px-1 rounded-full border border-white">x{countCafe}</span>
                                                                                            )}
                                                                                        </div>
                                                                                    </TooltipTrigger>
                                                                                    <TooltipContent><p>Cafés: {countCafe}</p></TooltipContent>
                                                                                </Tooltip>

                                                                                <Tooltip>
                                                                                    <TooltipTrigger asChild>
                                                                                        <Utensils className={`h-4 w-4 transition-all ${hasAlmoco ? 'text-orange-500 fill-orange-500/20' : 'text-slate-200'}`} />
                                                                                    </TooltipTrigger>
                                                                                    <TooltipContent><p>Almoço/Refeição</p></TooltipContent>
                                                                                </Tooltip>

                                                                                <Tooltip>
                                                                                    <TooltipTrigger asChild>
                                                                                        <Moon className={`h-4 w-4 transition-all ${hasJanta ? 'text-blue-500 fill-blue-500/20' : 'text-slate-200'}`} />
                                                                                    </TooltipTrigger>
                                                                                    <TooltipContent><p>Janta</p></TooltipContent>
                                                                                </Tooltip>

                                                                                <Tooltip>
                                                                                    <TooltipTrigger asChild>
                                                                                        <Sunrise className={`h-4 w-4 transition-all ${hasCeia ? 'text-purple-500 fill-purple-500/20' : 'text-slate-200'}`} />
                                                                                    </TooltipTrigger>
                                                                                    <TooltipContent><p>Ceia</p></TooltipContent>
                                                                                </Tooltip>
                                                                            </TooltipProvider>
                                                                        </>
                                                                    )
                                                                })()}
                                                            </div>
                                                        </td>

                                                        <td className="px-6 py-4">
                                                            {somaAtrasos > 0 ? (
                                                                <div className="flex flex-col">
                                                                    <div className="flex items-center gap-2 text-rose-600 font-black">
                                                                        <Zap className="h-3 w-3 animate-pulse" />
                                                                        <span className="text-xs">{Math.floor(somaAtrasos/60)}m {(somaAtrasos%60).toString().padStart(2, '0')}s acumulado</span>
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <span className="text-slate-300 text-[10px] uppercase font-bold">Sem atrasos</span>
                                                            )}
                                                        </td>

                                                        <td className="px-6 py-4 text-right">
                                                            {ultimaLog ? (
                                                                <div className="flex items-center justify-end gap-3 text-right">
                                                                    <div className="flex flex-col items-end min-w-0">
                                                                        <span className={`text-xs font-black ${isDarkMode ? 'text-blue-400' : 'text-blue-700'}`}>{format(parseISO(ultimaLog.created_at), 'HH:mm:ss')}</span>
                                                                        <span className="text-[10px] text-slate-400 font-bold uppercase truncate max-w-[200px]" title={ultimaLog.acao}>
                                                                            {getDescAtividade(ultimaLog)}
                                                                        </span>
                                                                    </div>
                                                                    <div className={`h-8 w-8 rounded-lg flex items-center justify-center opacity-20 ${isDarkMode ? 'bg-white/10' : 'bg-slate-200'}`}>
                                                                        <Calendar className="h-4 w-4" />
                                                                    </div>
                                                                </div>
                                                            ) : <span className="text-slate-300 text-[10px]">-</span>}
                                                        </td>
                                                    </tr>
                                                )
                                            })
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </Card>
                    </section>
                )}
                </div>
            </div>

            {/* MODAL DE RENDIÇÃO INTELIGENTE */}
            <Dialog open={rendicaoData.aberto} onOpenChange={(open) => !open && setRendicaoData(prev => ({ ...prev, aberto: false }))}>
                <DialogContent className="max-w-md bg-slate-900 border-slate-800 text-white rounded-[32px] overflow-hidden p-0 shadow-2xl">
                    <DialogTitle className="sr-only">Rendição de Posto</DialogTitle>
                    <DialogDescription className="sr-only">Modal para decidir o destino do profissional que está sendo rendido.</DialogDescription>
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

            {/* MODAL DE DOWNLOAD COM FILTROS */}
            <Dialog open={downloadModal.aberto} onOpenChange={(open) => !open && setDownloadModal(prev => ({ ...prev, aberto: false }))}>
                <DialogContent className="max-w-md bg-white border-slate-200 text-slate-900 rounded-[32px] overflow-hidden p-0 shadow-2xl">
                    <DialogHeader className="bg-slate-50 p-8 border-b border-slate-100">
                        <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-lg">
                                <FileDown className="h-6 w-6" />
                            </div>
                            <div>
                                <DialogTitle className="text-xl font-black uppercase tracking-tight italic">Download de Relatório</DialogTitle>
                                <DialogDescription className="text-slate-500 font-medium">Selecione os filtros para exportação</DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    <div className="p-8 space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Data Início</label>
                                <Input 
                                    type="date" 
                                    className="rounded-xl border-slate-200 h-11 font-bold"
                                    value={downloadModal.dataInicio}
                                    onChange={(e) => setDownloadModal(prev => ({ ...prev, dataInicio: e.target.value }))}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Data Fim</label>
                                <Input 
                                    type="date" 
                                    className="rounded-xl border-slate-200 h-11 font-bold"
                                    value={downloadModal.dataFim}
                                    onChange={(e) => setDownloadModal(prev => ({ ...prev, dataFim: e.target.value }))}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Filtrar por Profissional</label>
                            <Select 
                                value={downloadModal.profissionalId} 
                                onValueChange={(val) => setDownloadModal(prev => ({ ...prev, profissionalId: val }))}
                            >
                                <SelectTrigger className="rounded-xl border-slate-200 h-11 font-bold">
                                    <SelectValue placeholder="Selecione um profissional" />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl border-slate-200">
                                    <SelectItem value="todos" className="font-bold">Todos os profissionais</SelectItem>
                                    {equipe.map((p) => (
                                        <SelectItem key={p.id} value={p.id} className="font-bold">
                                            {p.nome_completo}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <DialogFooter className="p-8 pt-0 flex gap-3">
                        <Button 
                            variant="ghost" 
                            className="flex-1 rounded-xl font-black uppercase text-[10px] tracking-widest h-12"
                            onClick={() => setDownloadModal(prev => ({ ...prev, aberto: false }))}
                        >
                            Cancelar
                        </Button>
                        <Button 
                            className="flex-1 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black uppercase text-[10px] tracking-widest h-12 shadow-lg shadow-blue-200"
                            onClick={() => handleExportarFiltrado()}
                        >
                            Gerar Relatório
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            <Dialog open={equipamentoModal.aberto} onOpenChange={(val) => setEquipamentoModal(prev => ({ ...prev, aberto: val }))}>
                <DialogContent className="fixed top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%] w-[95vw] max-w-[440px] p-0 overflow-hidden border-none shadow-2xl rounded-3xl bg-white">
                    <DialogHeader className="p-8 pb-0 flex flex-col gap-2 relative">
                        <div className="flex items-center gap-4">
                            <div className="h-14 w-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-inner">
                                <ShieldCheck className="h-7 w-7" />
                            </div>
                            <div>
                                <DialogTitle className="text-xl font-black uppercase tracking-tight italic">Controle de Equipamento</DialogTitle>
                                <DialogDescription className="text-slate-500 font-medium">Informe os itens entregues ao profissional</DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    <div className="p-8 space-y-6">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                                    Rádio HT <span className="text-[8px] font-medium opacity-60">(Opcional)</span>
                                </label>
                                <Input 
                                    placeholder="Nº ou Nome do Rádio" 
                                    className="rounded-xl border-slate-200 h-11 font-bold bg-slate-50/50"
                                    value={equipamentoModal.radioHT}
                                    onChange={(e) => setEquipamentoModal(prev => ({ ...prev, radioHT: e.target.value }))}
                                />
                            </div>

                            <div className="flex items-center justify-between p-4 rounded-xl border border-slate-100 bg-slate-50/30">
                                <div className="space-y-0.5">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                        Colete Balístico
                                    </label>
                                    <p className="text-[9px] text-slate-400 font-medium">O profissional está com o colete?</p>
                                </div>
                                <Switch 
                                    checked={equipamentoModal.colete}
                                    onCheckedChange={(val) => setEquipamentoModal(prev => ({ ...prev, colete: val }))}
                                />
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="p-8 pt-0 flex gap-3">
                        <Button 
                            variant="ghost" 
                            className="flex-1 rounded-xl font-black uppercase text-[10px] tracking-widest h-12"
                            onClick={() => setEquipamentoModal(prev => ({ ...prev, aberto: false }))}
                        >
                            Cancelar
                        </Button>
                        <Button 
                            className="flex-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase text-[10px] tracking-widest h-12 shadow-lg shadow-emerald-200"
                            onClick={() => handleConfirmarEquipamento()}
                        >
                            Confirmar Alocação
                        </Button>
                    </DialogFooter>
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
