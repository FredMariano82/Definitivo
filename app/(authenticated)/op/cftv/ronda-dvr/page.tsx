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
    Palette
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

const STATUS_OPCOES = [
    { value: 'OK', label: 'Em Ordem', color: 'bg-emerald-500 shadow-emerald-500/50', icon: CheckCircle2 },
    { value: 'PRETA', label: 'Tela Preta / Sem Vídeo', color: 'bg-rose-500 shadow-rose-500/50', icon: EyeOff },
    { value: 'DISTORCIDA', label: 'Imagem Distorcida', color: 'bg-amber-500 shadow-amber-500/50', icon: AlertCircle },
    { value: 'DESATIVADA', label: 'Câmera Desativada', color: 'bg-slate-400 shadow-slate-400/50', icon: Camera },
    { value: 'SEM_REGISTRO', label: 'Sem Registro (Roxo)', color: 'bg-purple-600 shadow-purple-600/50', icon: Clock },
    { value: 'FORA_FOCO', label: 'Fora de Foco (Cinza)', color: 'bg-zinc-500 shadow-zinc-500/50', icon: Activity },
]

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
    const [matriz, setMatriz] = useState<{ [key: string]: string }>({})
    const [loading, setLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const [dataUltimaRonda, setDataUltimaRonda] = useState<string | null>(null)
    const [isModalOpen, setIsModalOpen] = useState(false)

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

                const ultima = await CftvService.getUltimaRonda()
                if (ultima && ultima.dados_ronda) {
                    setMatriz(ultima.dados_ronda as any)
                    setDataUltimaRonda(ultima.data_ronda || null)
                }
            } catch (err) { console.error(err) } finally { setLoading(false) }
        }
        loadInitialData()
    }, [])

    const setStatusManual = (dvrId: string, cam: number, status: string) => {
        setMatriz(prev => ({ ...prev, [`${dvrId}-${cam}`]: status }))
    }

    const setStatusLote = (status: string) => {
        if (!dvrAtivoId) return
        const dvr = dvrs.find(d => d.id === dvrAtivoId)
        if (!dvr) return
        const nova = { ...matriz }
        for (let c = 1; c <= (dvr.canais || 16); c++) nova[`${dvrAtivoId}-${c}`] = status
        setMatriz(nova)
        toast.success(`${dvr.nome}: Marcar todas como ${status}`)
    }

    const metricas = useMemo(() => {
        const totais = { total: 0, ok: 0, preta: 0, distorcida: 0, desativada: 0, sem_registro: 0, fora_foco: 0 }
        dvrs.forEach(dvr => {
            for (let c = 1; c <= (dvr.canais || 16); c++) {
                const s = matriz[`${dvr.id}-${c}`] || 'OK'
                totais.total++
                if (s === 'OK') totais.ok++
                else if (s === 'PRETA') totais.preta++
                else if (s === 'DISTORCIDA') totais.distorcida++
                else if (s === 'DESATIVADA') totais.desativada++
                else if (s === 'SEM_REGISTRO') totais.sem_registro++
                else if (s === 'FORA_FOCO') totais.fora_foco++
            }
        })
        const ativas = totais.total - totais.desativada
        const saude = ativas > 0 ? ((totais.ok / ativas) * 100).toFixed(1) : "0.0"
        return { ...totais, saude, camerasAtivas: ativas }
    }, [matriz, dvrs])

    const handleSalvarRonda = async () => {
        setIsSaving(true)
        try {
            await CftvService.salvarRonda({ data_ronda: format(new Date(), 'yyyy-MM-dd'), dados_ronda: matriz, operador_nome: 'Operador MVM', observacoes: `Saúde: ${metricas.saude}%` } as any, true)
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
                
                <Button 
                    onClick={() => setIsModalOpen(true)}
                    className="bg-blue-600 hover:bg-blue-700 h-16 px-10 rounded-3xl font-black text-lg flex items-center gap-2 shadow-2xl shadow-blue-600/30 transition-all active:scale-95"
                >
                    <Save className="h-6 w-6" />
                    CONSOLIDAR RELATÓRIO
                </Button>
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

            {/* Dash de Saúde Visual */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-6">
                <Card className="rounded-[2.5rem] border-none bg-blue-600 text-white p-6 shadow-2xl shadow-blue-400/20 text-center flex flex-col justify-center">
                    <span className="opacity-70 text-[10px] font-black uppercase mb-1 block">Saúde Geral</span>
                    <span className="text-3xl font-black">{metricas.saude}%</span>
                </Card>
                {STATUS_OPCOES.map((status) => {
                    const count = Object.values(matriz).filter(v => v === status.value).length
                    return (
                        <Card key={status.value} className="rounded-[2.5rem] border border-slate-100 bg-white p-6 shadow-sm hover:shadow-xl transition-all text-center flex flex-col justify-center group overflow-hidden">
                            <div className={`h-1 w-full ${status.color} absolute top-0 left-0 opacity-20 group-hover:opacity-100 transition-opacity`}></div>
                            <span className="text-slate-400 text-[9px] font-black uppercase mb-1 block truncate tracking-tighter">{status.label}</span>
                            <span className="text-2xl font-black text-slate-800">{count}</span>
                        </Card>
                    )
                })}
            </div>

            <div className="grid lg:grid-cols-12 gap-8 items-start">
                {/* Seletor Dinâmico */}
                <div className="lg:col-span-3 space-y-4">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-3 px-4">
                        <LayoutGrid className="h-4 w-4 text-blue-600" />
                        DISPOSITIVOS OPERACIONAIS ({dvrs.length})
                    </h3>
                    <div className="grid grid-cols-1 gap-3 max-h-[600px] overflow-y-auto pr-2 scrollbar-thin">
                        {dvrs.map((dvr) => {
                            const falhas = Object.keys(matriz).filter(k => k.startsWith(`${dvr.id}-`) && matriz[k] !== 'OK' && matriz[k] !== 'DESATIVADA').length
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
                    </CardHeader>

                    <CardContent className="p-10">
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-8">
                            {Array.from({ length: dvrAtual?.canais || 16 }).map((_, i) => {
                                const cam = i + 1
                                const statusValue = matriz[`${dvrAtivoId}-${cam}`] || 'OK'
                                const config = STATUS_OPCOES.find(o => o.value === statusValue) || STATUS_OPCOES[0]
                                const Icon = config.icon

                                return (
                                    <div key={cam} className="space-y-3 group">
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <button className={`
                                                    relative w-full aspect-video rounded-[2rem] flex flex-col items-center justify-center gap-3
                                                    transition-all duration-300 active:scale-95 shadow-xl border-4
                                                    ${config.color} ${statusValue === 'OK' ? 'border-emerald-100/30' : 'border-white/20'}
                                                    hover:brightness-110 group-hover:scale-[1.02]
                                                `}>
                                                    <div className="absolute top-3 left-4 bg-black/10 backdrop-blur-md px-4 py-1 rounded-full">
                                                        <span className="text-[11px] font-black text-white">CH {String(cam).padStart(2, '0')}</span>
                                                    </div>
                                                    <Icon className="h-12 w-12 text-white drop-shadow-xl" />
                                                    <div className="absolute bottom-3 opacity-60">
                                                        <span className="text-[9px] font-black text-white uppercase tracking-tighter">{config.label}</span>
                                                    </div>
                                                </button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-64 p-3 rounded-3xl bg-white shadow-2xl border-slate-100">
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2 mb-4">Mudar Status</p>
                                                <div className="grid grid-cols-1 gap-2">
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
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">CH {cam} - {dvrAtual?.nome}</span>
                                            <div className={`h-2.5 w-2.5 rounded-full ${config.color} shadow-lg shadow-current/50`}></div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
