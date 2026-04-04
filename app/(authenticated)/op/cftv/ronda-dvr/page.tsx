'use client'

import { useState, useEffect, useMemo } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { 
    CheckCircle2, 
    Save, 
    RefreshCw, 
    ChevronLeft, 
    ChevronRight, 
    AlertCircle, 
    Activity, 
    Camera, 
    MonitorCheck,
    LayoutGrid,
    EyeOff,
    Clock,
    ArrowRight,
    Palette,
    Image as ImageIcon
} from "lucide-react"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { CftvService, RondaDVR } from '@/services/cftv-service'
import { useRouter } from 'next/navigation'
import { ConsolidacaoModal } from '@/components/op/consolidacao-modal'
import { GabaritoMosaicoModal } from '@/components/op/gabarito-mosaico-modal'

const STATUS_OPCOES = [
    { value: 'OK', label: 'Em Ordem', color: 'bg-emerald-500 shadow-emerald-500/50', icon: CheckCircle2 },
    { value: 'INTERFERENCIA', label: 'Interferência', color: 'bg-amber-500 shadow-amber-500/50', icon: AlertCircle },
    { value: 'SEM_SINAL', label: 'Sem Sinal', color: 'bg-rose-500 shadow-rose-500/50', icon: EyeOff },
    { value: 'SEM_GRAVACAO', label: 'Sem Gravação', color: 'bg-purple-600 shadow-purple-600/50', icon: Clock },
    { value: 'FORA_FOCO', label: 'Fora de Foco / Obstrução', color: 'bg-slate-500 shadow-slate-500/50', icon: Activity },
    { value: 'VAGO', label: 'Espaço Vago', color: 'bg-slate-900 shadow-slate-900/50', icon: Camera },
]

const normalizeStatus = (s: string) => {
    if (s === 'PRETA') return 'SEM_SINAL'
    if (s === 'DISTORCIDA') return 'INTERFERENCIA'
    if (s === 'SEM_REGISTRO') return 'SEM_GRAVACAO'
    if (s === 'DESATIVADA') return 'VAGO'
    return s || 'OK'
}

const LISTA_DVRS_FALLBACK = [
    'After 1', 'After 2', 'Angelina 1', 'Angelina 2', 'Almoxarifado', 
    'Audio & Luz', 'Bar da Piscina', 'Bar Do Tênis', 'Beach Tênis', 
    'Berçario Angelina', 'Bico', 'Casa', 'Central', 'C.J 1', 'C.J 2', 
    'Centro de Lutas', 'Centro de música', 'Centro Civico 1 Sala Chefia Externa', 
    'Centro Civico 2 Sala Chefia Internas', 'Centro Civico 3 Entrada Alceu', 
    'Chapeira', 'Diversos', 'Espaço Hebra', 'Fit Center 1', 'Fit Center 2', 
    'Fisioterapia', 'Fresto', 'Ginastica Artistica', 'Hungria 1', 'Hungria 2', 
    'Locker Piscina', 'Maternal 1 Rack Sala 07', 'Maternal 2 Rack Sala 07', 
    'Maternal 3 Sala 05', 'Merkas', 'Mitzpe', 'Patrimonio', 'Passarela Tênis', 
    'Piscina', 'Poli Esportivo', 'Presidencia', 'Presidente', 'Refeitorio', 
    'Tênis', 'Tesouraria / Agenda', 'T.I'
]

export default function RondaDVRPage() {
    const router = useRouter()
    const [dvrs, setDvrs] = useState<any[]>([])
    const [dvrAtivoId, setDvrAtivoId] = useState<string | null>(null)
    const [matriz, setMatriz] = useState<{ [key: string]: any }>({})
    const [loading, setLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const [dataUltimaRonda, setDataUltimaRonda] = useState<string | null>(null)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [isGabaritoOpen, setIsGabaritoOpen] = useState(false)

    useEffect(() => {
        const loadInitialData = async () => {
            setLoading(true)
            try {
                let listaDvrs = await CftvService.getDVRs()
                
                if (!listaDvrs || listaDvrs.length === 0) {
                    listaDvrs = LISTA_DVRS_FALLBACK.map((nome, i) => ({
                        id: `id-${i+1}`, 
                        nome,
                        canais: 16
                    }))
                }
                
                setDvrs(listaDvrs)
                if (listaDvrs.length > 0) setDvrAtivoId(listaDvrs[0].id)

                let savedFromCache = false
                try {
                    const cache = localStorage.getItem('cftv_ronda_draft_matrix')
                    if (cache) {
                        const parsedCache = JSON.parse(cache)
                        if (Object.keys(parsedCache).length > 0) {
                            setMatriz(parsedCache)
                            savedFromCache = true
                        }
                    }
                } catch (e) { console.error("Erro lendo cache", e) }

                const ultima = await CftvService.getUltimaRonda()
                if (ultima && ultima.dados_ronda) {
                    setDataUltimaRonda(ultima.data_ronda || null)
                    // Só puxa do banco se o cache do navegador estiver vazio
                    if (!savedFromCache) {
                        setMatriz(ultima.dados_ronda as any)
                    }
                }
            } catch (err) { console.error(err) } finally { setLoading(false) }
        }
        loadInitialData()
    }, [])

    // Rascunho Constante: Toda vez que o operador clicar num botão, salva na memória profunda do browser
    useEffect(() => {
        if (Object.keys(matriz).length > 0) {
            localStorage.setItem('cftv_ronda_draft_matrix', JSON.stringify(matriz))
        }
    }, [matriz])

    const zerarPainelManualmente = () => {
        if (confirm("ATENÇÃO: Deseja apagar o rascunho de TODAS as marcações de problemas para começar uma ronda idêntica a uma folha em branco? Tudo voltará a ser Verde (Ok).")) {
            setMatriz({})
            localStorage.removeItem('cftv_ronda_draft_matrix')
            toast.success("Rascunho de Memória Zerado. Todas as câmeras resetadas!")
        }
    }

    const setStatusManual = (dvrId: string, cam: number, status: string) => {
        setMatriz(prev => ({ 
            ...prev, 
            [`${dvrId}-${cam}`]: { status, updated_at: Date.now() } 
        }))
    }

    const setStatusLote = (status: string) => {
        if (!dvrAtivoId) return
        const dvr = dvrs.find(d => d.id === dvrAtivoId)
        if (!dvr) return
        const nova = { ...matriz }
        for (let c = 1; c <= (dvr.canais || 16); c++) {
            nova[`${dvrAtivoId}-${c}`] = { status, updated_at: Date.now() }
        }
        setMatriz(nova)
        toast.success(`${dvr.nome}: Marcar todas como ${status}`)
    }

    const metricas = useMemo(() => {
        const totais = { total: 0, ok: 0, sem_sinal: 0, interferencia: 0, vago: 0, sem_gravacao: 0, fora_foco: 0 }
        dvrs.forEach(dvr => {
            for (let c = 1; c <= (dvr.canais || 16); c++) {
                const mapValue = matriz[`${dvr.id}-${c}`]
                const rawStatus = typeof mapValue === 'string' ? mapValue : mapValue?.status
                const s = normalizeStatus(rawStatus)
                
                totais.total++
                if (s === 'OK') totais.ok++
                else if (s === 'SEM_SINAL') totais.sem_sinal++
                else if (s === 'INTERFERENCIA') totais.interferencia++
                else if (s === 'VAGO') totais.vago++
                else if (s === 'SEM_GRAVACAO') totais.sem_gravacao++
                else if (s === 'FORA_FOCO') totais.fora_foco++
            }
        })
        const ativas = totais.total - totais.vago
        const saude = ativas > 0 ? ((totais.ok / ativas) * 100).toFixed(1) : "0.0"
        return { ...totais, saude, camerasAtivas: ativas }
    }, [matriz, dvrs])

    const handleSalvarRonda = async (htmlSnapshot: string) => {
        setIsSaving(true)
        try {
            await CftvService.salvarRonda({ 
                data_ronda: format(new Date(), 'yyyy-MM-dd'), 
                dados_ronda: matriz, 
                operador_nome: 'Operador MVM', 
                observacoes: `Saúde: ${metricas.saude}%`,
                relatorio_html_snapshot: htmlSnapshot
            } as any, true)
            toast.success("Consolidado com Sucesso!")
            setIsModalOpen(false)
            setTimeout(() => router.push('/admin/kanban'), 1000)
        } catch (e) { toast.error("Falha ao salvar") } finally { setIsSaving(false) }
    }

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
            <RefreshCw className="h-10 w-10 animate-spin text-blue-600" />
            <p className="text-slate-400 font-black uppercase text-[10px]">Carregando Sistema Operacional...</p>
        </div>
    )

    const dvrAtual = dvrs.find(d => d.id === dvrAtivoId)

    return (
        <div className="space-y-8 pb-20 max-w-7xl mx-auto">
            <style>{`
                @keyframes super-slow-pulse {
                    0%, 100% { opacity: 1; transform: scale(1); }
                    50% { opacity: 0.5; transform: scale(0.97); }
                }
                @keyframes super-slow-ping {
                    0% { transform: scale(1); opacity: 1; }
                    75%, 100% { transform: scale(2.0); opacity: 0; }
                }
                .custom-pulse-heartbeat {
                    animation: super-slow-pulse 2s ease-in-out infinite;
                }
                .custom-ping-heartbeat {
                    animation: super-slow-ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;
                }
            `}</style>
            {/* Header Premium */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-6 bg-white p-8 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/50">
                <div className="flex items-center gap-6">
                    <div className="h-16 w-16 bg-blue-50 rounded-3xl flex items-center justify-center animate-pulse">
                        <MonitorCheck className="h-8 w-8 text-blue-600" />
                    </div>
                    <div>
                        <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-4">
                            RONDA DVR
                            <Badge className="bg-emerald-50 text-emerald-600 border-none text-[10px] font-black px-4 py-1.5 rounded-full uppercase">Sistema ao Vivo</Badge>
                        </h1>
                        <p className="text-slate-400 mt-1 font-bold text-xs uppercase tracking-widest">{metricas.total} CANAIS TÉCNICOS DETECTADOS</p>
                    </div>
                </div>
                
                <div className="flex flex-col items-center gap-3">
                    <Button 
                        onClick={() => setIsModalOpen(true)}
                        className="bg-blue-600 hover:bg-blue-700 h-16 px-10 rounded-3xl font-black text-lg flex items-center gap-2 shadow-2xl shadow-blue-600/30 transition-all active:scale-95"
                    >
                        <Save className="h-6 w-6" />
                        CONSOLIDAR RELATÓRIO
                    </Button>
                    <button 
                        onClick={zerarPainelManualmente} 
                        className="text-[10px] font-black uppercase tracking-widest text-slate-300 hover:text-rose-500 transition-colors"
                        title="Deseja começar uma nova ronda do absoluto zero? Clique aqui."
                    >
                        [ Zerar Memória / Começar do Zero ]
                    </button>
                </div>
            </div>

            <ConsolidacaoModal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onConfirm={handleSalvarRonda}
                metricas={metricas}
                dvrs={dvrs}
                matriz={matriz}
                isSaving={isSaving}
            />

            <GabaritoMosaicoModal
                isOpen={isGabaritoOpen}
                onClose={() => setIsGabaritoOpen(false)}
                dvr={dvrAtual || null}
                onUploadSuccess={(newUrl) => {
                    setDvrs(prev => prev.map(d => d.id === dvrAtivoId ? { ...d, mosaico_url: newUrl } : d))
                }}
            />

            {/* Dash de Saúde Visual */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-6">
                <Card className="rounded-[2.5rem] border-none bg-blue-600 text-white p-6 shadow-2xl shadow-blue-400/20 text-center flex flex-col justify-center">
                    <span className="opacity-70 text-[10px] font-black uppercase mb-1 block">Saúde Geral</span>
                    <span className="text-3xl font-black">{metricas.saude}%</span>
                </Card>
                {STATUS_OPCOES.map((status) => {
                    const count = Object.values(matriz).filter(v => {
                        const raw = typeof v === 'string' ? v : v?.status
                        return normalizeStatus(raw) === status.value
                    }).length
                    return (
                        <Card key={status.value} className="rounded-[2.5rem] border border-slate-100 bg-white p-6 shadow-sm hover:shadow-xl transition-all text-center flex flex-col justify-center group overflow-hidden">
                            <div className={`h-1 w-full ${status.color} absolute top-0 left-0 opacity-20 group-hover:opacity-100 transition-opacity`}></div>
                            <span className="text-slate-400 text-[9px] font-black uppercase mb-1 block truncate tracking-tighter">{status.label}</span>
                            <span className="text-2xl font-black text-slate-800">{count}</span>
                        </Card>
                    )
                })}
            </div>

            {/* Legenda de Cores (Índice de Status) */}
            <div className="flex flex-wrap items-center justify-center gap-6 py-4 px-8 bg-white rounded-full border border-slate-100 shadow-sm mt-8">
                {STATUS_OPCOES.map(op => (
                    <div key={op.value} className="flex items-center gap-2">
                        <div className={`h-3 w-3 rounded-full ${op.color}`}></div>
                        <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">{op.label}</span>
                    </div>
                ))}
            </div>

            <div className="grid lg:grid-cols-12 gap-8 items-start mt-8">
                {/* Seletor Dinâmico */}
                <div className="lg:col-span-3 space-y-4">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-3 px-4">
                        <LayoutGrid className="h-4 w-4 text-blue-600" />
                        DISPOSITIVOS OPERACIONAIS ({dvrs.length})
                    </h3>
                    <div className="grid grid-cols-1 gap-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                        {dvrs.map((dvr) => {
                            const falhas = Object.keys(matriz).map(k => {
                                const v = matriz[k]
                                const s = normalizeStatus(typeof v === 'string' ? v : v?.status)
                                return { k, s }
                            }).filter(({k, s}) => k.startsWith(`${dvr.id}-`) && s !== 'OK' && s !== 'VAGO').length
                            return (
                                <button
                                    key={dvr.id}
                                    className={`
                                        h-16 rounded-[1.5rem] font-black text-sm flex items-center justify-between px-6 transition-all border-2
                                        ${dvrAtivoId === dvr.id 
                                            ? 'bg-blue-600 text-white border-blue-600 shadow-xl shadow-blue-600/20 active:scale-95' 
                                            : 'bg-white text-slate-600 border-slate-100 hover:border-blue-100 hover:bg-slate-50'}
                                    `}
                                    onClick={() => setDvrAtivoId(dvr.id)}
                                >
                                    <span className="truncate max-w-[150px]">{dvr.nome}</span>
                                    {falhas > 0 && <Badge className="bg-rose-500 text-white border-none text-[10px] font-black h-6 w-6 p-0 flex items-center justify-center rounded-xl">{falhas}</Badge>}
                                </button>
                            )
                        })}
                    </div>
                </div>

                {/* Grid Premium A4 Style Canvas (Só para Interface) */}
                <Card className="lg:col-span-9 rounded-[3.5rem] border-none shadow-2xl shadow-slate-200/50 overflow-hidden bg-white">
                    <CardHeader className="bg-slate-50/50 p-10 flex flex-col md:flex-row justify-between md:items-center gap-6 border-b border-slate-100">
                        <div className="flex items-center gap-6">
                            <div className="h-16 w-16 bg-white rounded-3xl shadow-lg flex items-center justify-center border border-slate-100">
                                <MonitorCheck className="h-8 w-8 text-blue-600" />
                            </div>
                            <div>
                                <CardTitle className="text-2xl font-black text-slate-800 uppercase tracking-tighter">MAPA: {dvrAtual?.nome}</CardTitle>
                                <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mt-1 flex items-center gap-2">
                                    <ArrowRight className="h-3 w-3" /> ESTRUTURA DE {dvrAtual?.canais || 16} CANAIS TÉCNICOS
                                </p>
                            </div>
                        </div>
                        
                        <div className="flex items-center gap-3 bg-white p-3 rounded-3xl shadow-inner border border-slate-100">
                            <Button 
                                onClick={() => setIsGabaritoOpen(true)}
                                variant="outline"
                                className="border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 hover:text-emerald-800 h-12 px-6 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all mr-4 shadow-sm"
                            >
                                <ImageIcon className="h-4 w-4 mr-2" />
                                Gabarito Oficial
                            </Button>
                            
                            <div className="flex items-center gap-2 border-l pl-4 border-slate-100">
                                <Button variant="ghost" size="icon" className="h-12 w-12 rounded-2xl" onClick={() => {
                                    const idx = dvrs.findIndex(d => d.id === dvrAtivoId);
                                    if (idx > 0) setDvrAtivoId(dvrs[idx-1].id)
                                }}><ChevronLeft className="h-6 w-6" /></Button>
                                <Badge className="px-6 py-2 rounded-2xl font-black text-xs border-none bg-slate-50 text-slate-400 uppercase">
                                    {dvrs.findIndex(d => d.id === dvrAtivoId) + 1} / {dvrs.length} UNIDADES
                                </Badge>
                                <Button variant="ghost" size="icon" className="h-12 w-12 rounded-2xl" onClick={() => {
                                    const idx = dvrs.findIndex(d => d.id === dvrAtivoId);
                                    if (idx < dvrs.length-1) setDvrAtivoId(dvrs[idx+1].id)
                                }}><ChevronRight className="h-6 w-6" /></Button>
                            </div>
                        </div>
                    </CardHeader>

                    <CardContent className="p-10">
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-8">
                            {Array.from({ length: dvrAtual?.canais || 16 }).map((_, i) => {
                                const cam = i + 1
                                const mapValue = matriz[`${dvrAtivoId}-${cam}`]
                                const statusValue = normalizeStatus(typeof mapValue === 'string' ? mapValue : mapValue?.status)
                                const updatedAt = typeof mapValue === 'object' && mapValue?.updated_at ? mapValue.updated_at : 0
                                
                                const config = STATUS_OPCOES.find(o => o.value === statusValue) || STATUS_OPCOES[0]
                                const Icon = config.icon

                                // Calcula Regra de Novidade (48 Horas) para Problemas (Não Ok e Não Vago)
                                const wasUpdatedRecently = updatedAt > 0 && (Date.now() - updatedAt < 48 * 60 * 60 * 1000)
                                const isPulsoAlert = statusValue !== 'OK' && statusValue !== 'VAGO' && wasUpdatedRecently

                                return (
                                    <div key={cam} className="space-y-3 group">
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <button className={`
                                                    relative w-full aspect-video rounded-[2rem] flex flex-col items-center justify-center gap-3
                                                    transition-all duration-300 active:scale-95 shadow-xl border-4
                                                    ${config.color} ${statusValue === 'OK' ? 'border-emerald-100/30' : 'border-white/20'}
                                                    hover:brightness-110 group-hover:scale-[1.02]
                                                    ${isPulsoAlert ? 'custom-pulse-heartbeat ring-4 ring-rose-500/50 shadow-rose-500/50' : ''}
                                                `}>
                                                    <div className="absolute top-3 left-4 bg-black/10 backdrop-blur-md px-4 py-1 rounded-full">
                                                        <span className="text-[11px] font-black text-white">CH {String(cam).padStart(2, '0')}</span>
                                                    </div>
                                                    <Icon className="h-12 w-12 text-white drop-shadow-xl" />
                                                    <div className="absolute bottom-3 opacity-60">
                                                        <span className="text-[9px] font-black text-white uppercase tracking-tighter">
                                                            {config.label}
                                                            {isPulsoAlert && <span className="ml-2 bg-white/20 px-2 py-0.5 rounded-full text-[8px]">NOVO</span>}
                                                        </span>
                                                    </div>
                                                </button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-64 p-3 rounded-3xl bg-white shadow-2xl border-slate-100 relative overflow-hidden">
                                                {isPulsoAlert && (
                                                    <div className="absolute top-0 right-0 bg-rose-500 text-white text-[8px] font-black px-3 py-1 rounded-bl-xl z-10">ALERTA (48H)</div>
                                                )}
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2 mb-4">Mudar Status</p>
                                                <div className="grid grid-cols-1 gap-2 relative z-0">
                                                    {STATUS_OPCOES.map(op => (
                                                        <button key={op.value} onClick={() => setStatusManual(dvrAtivoId!, cam, op.value)} 
                                                            className={`flex items-center gap-4 p-3 rounded-2xl transition-all ${statusValue === op.value ? 'bg-slate-50' : 'hover:bg-slate-50'}`}>
                                                            <div className={`h-8 w-8 rounded-xl ${op.color} flex items-center justify-center text-white`}><op.icon className="h-4 w-4" /></div>
                                                            <span className="text-[12px] font-bold text-slate-700">{op.label}</span>
                                                        </button>
                                                    ))}
                                                </div>
                                            </PopoverContent>
                                        </Popover>
                                        <div className="flex justify-between items-center px-4">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter flex items-center gap-2">
                                                CH {cam} - {dvrAtual?.nome}
                                            </span>
                                            <div className={`h-2.5 w-2.5 rounded-full ${config.color} shadow-lg shadow-current/50 ${isPulsoAlert ? 'custom-ping-heartbeat' : ''}`}></div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </CardContent>
                </Card>
            </div>
            {/* O modal de consolidação é chamado no topo, mas foi movido para cá se preferir */}
        </div>
    )
}
