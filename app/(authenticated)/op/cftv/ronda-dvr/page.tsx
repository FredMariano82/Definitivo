'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { 
    Video, 
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
    History,
    FileText,
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

const TOTAL_DVRS = 14
const CAMERAS_POR_DVR = 16

const STATUS_OPCOES = [
    { value: 'OK', label: 'Em Ordem', color: 'bg-emerald-500 shadow-emerald-500/50', icon: CheckCircle2 },
    { value: 'PRETA', label: 'Tela Preta / Sem Vídeo', color: 'bg-rose-500 shadow-rose-500/50', icon: EyeOff },
    { value: 'DISTORCIDA', label: 'Imagem Distorcida / Interferência', color: 'bg-amber-500 shadow-amber-500/50', icon: AlertCircle },
    { value: 'DESATIVADA', label: 'Câmera Desativada / Canal Vazio', color: 'bg-slate-400 shadow-slate-400/50', icon: Camera },
    { value: 'SEM_REGISTRO', label: 'Sem Registro (Roxo)', color: 'bg-purple-600 shadow-purple-600/50', icon: Clock },
    { value: 'FORA_FOCO', label: 'Fora de Foco (Cinza)', color: 'bg-zinc-500 shadow-zinc-500/50', icon: Activity },
]

export default function RondaDVRPage() {
    const router = useRouter()
    const [dvrs, setDvrs] = useState<any[]>([])
    const [dvrAtivoId, setDvrAtivoId] = useState<string | null>(null)
    const [matriz, setMatriz] = useState<{ [key: string]: string }>({})
    const [loading, setLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const [dataUltimaRonda, setDataUltimaRonda] = useState<string | null>(null)

    // Carregar DVRs e última ronda ao iniciar
    useEffect(() => {
        const loadInitialData = async () => {
            setLoading(true)
            try {
                // 1. Carregar lista de DVRs reais
                const listaDvrs = await CftvService.getDVRs()
                setDvrs(listaDvrs)
                if (listaDvrs.length > 0) {
                    setDvrAtivoId(listaDvrs[0].id)
                }

                // 2. Carregar última ronda
                const ultima = await CftvService.getUltimaRonda()
                if (ultima && ultima.dados_ronda) {
                    setMatriz(ultima.dados_ronda as { [key: string]: string })
                    setDataUltimaRonda(ultima.data_ronda || null)
                } else {
                    // Inicializar se vazio (opcional, matriz é dinâmica)
                    setMatriz({})
                }
            } catch (error) {
                console.error("Erro ao carregar dados iniciais:", error)
                toast.error("Erro ao sincronizar com o banco de DVRs.")
            } finally {
                setLoading(false)
            }
        }
        loadInitialData()
    }, [])

    const toggleStatus = (dvrId: string, camera: number) => {
        const key = `${dvrId}-${camera}`
        const statusAtual = matriz[key] || 'OK'
        const currentIndex = STATUS_OPCOES.findIndex(op => op.value === statusAtual)
        const nextIndex = (currentIndex + 1) % STATUS_OPCOES.length
        
        setMatriz(prev => ({
            ...prev,
            [key]: STATUS_OPCOES[nextIndex].value
        }))
    }

    const setStatusManual = (dvrId: string, camera: number, status: string) => {
        const key = `${dvrId}-${camera}`
        setMatriz(prev => ({
            ...prev,
            [key]: status
        }))
    }

    const setStatusLote = (status: string) => {
        if (!dvrAtivoId) return
        const novaMatriz = { ...matriz }
        for (let c = 1; c <= CAMERAS_POR_DVR; c++) {
            novaMatriz[`${dvrAtivoId}-${c}`] = status
        }
        setMatriz(novaMatriz)
        const dvrNome = dvrs.find(d => d.id === dvrAtivoId)?.nome || "DVR"
        toast.success(`${dvrNome}: Todas as câmeras marcadas como ${status}`)
    }

    // Métricas
    const metricas = useMemo(() => {
        const totais = {
            total: 0,
            ok: 0,
            preta: 0,
            distorcida: 0,
            desativada: 0,
            sem_registro: 0,
            fora_foco: 0
        }

        Object.values(matriz).forEach(status => {
            totais.total++
            if (status === 'OK') totais.ok++
            if (status === 'PRETA') totais.preta++
            if (status === 'DISTORCIDA') totais.distorcida++
            if (status === 'DESATIVADA') totais.desativada++
            if (status === 'SEM_REGISTRO') totais.sem_registro++
            if (status === 'FORA_FOCO') totais.fora_foco++
        })

        // Cálculo de Saúde Apenas das Câmeras Ativas (Desconta as Desativadas/Pretas do Total para fins de eficiência de imagem)
        // No entanto, para visualização de "saúde da malha", calculamos sobre o que deveria estar ativo.
        const camerasAtivasTeoricas = totais.total - totais.desativada
        const saudeImage = camerasAtivasTeoricas > 0 
            ? ((totais.ok / camerasAtivasTeoricas) * 100).toFixed(1) 
            : "0.0"

        return { ...totais, saude: saudeImage, camerasAtivas: camerasAtivasTeoricas }
    }, [matriz])

    const handleSalvarRonda = async () => {
        setIsSaving(true)
        try {
            const novaRonda: Partial<RondaDVR> = {
                data_ronda: format(new Date(), 'yyyy-MM-dd'),
                dados_ronda: matriz as any,
                operador_nome: 'Sistema (Recuperação)',
                observacoes: `Total: ${metricas.total} | OK: ${metricas.ok} | Saúde: ${metricas.saude}%`
            }

            await CftvService.salvarRonda(novaRonda as any)
            toast.success("Ronda de DVRs salva com sucesso!")
            
            // Redirecionar para tarefas para ver o card gerado
            setTimeout(() => {
                router.push('/admin/tarefas')
                toast("Um card foi gerado no seu Kanban em 'FINALIZADOS' detalhando esta ronda.")
            }, 1000)

        } catch (error) {
            console.error("Erro ao salvar ronda:", error)
            toast.error("Erro ao salvar ronda.")
        } finally {
            setIsSaving(false)
        }
    }

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <RefreshCw className="h-10 w-10 animate-spin text-blue-600" />
                <p className="text-slate-500 font-medium animate-pulse uppercase tracking-widest text-xs">Carregando quadro operacional...</p>
            </div>
        )
    }

    return (
        <div className="space-y-8 pb-20 max-w-7xl mx-auto">
            {/* Header Estratégico */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                        <MonitorCheck className="h-10 w-10 text-blue-600 p-2 bg-blue-50 rounded-2xl" />
                        MONITORAMENTO CFTV
                        <Badge variant="outline" className="ml-2 bg-emerald-50 text-emerald-600 border-none text-xs font-black px-3">CONCENTRADOR AO VIVO</Badge>
                    </h1>
                    <p className="text-slate-500 mt-1 flex items-center gap-2 font-medium">
                        <Activity className="h-4 w-4 text-emerald-500" />
                        Controle de integridade da malha óptica e gravadores digitais
                        {dataUltimaRonda && (
                            <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded-full text-slate-400">
                                ÚLTIMA ATUALIZAÇÃO: {format(new Date(dataUltimaRonda), "dd/MM 'às' HH:mm", { locale: ptBR })}
                            </span>
                        )}
                    </p>
                </div>
                
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <Button 
                        variant="default" 
                        size="lg" 
                        disabled={isSaving}
                        onClick={handleSalvarRonda}
                        className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 h-14 px-8 rounded-2xl font-black text-base transition-all active:scale-95 flex items-center gap-2 shadow-xl shadow-blue-600/20"
                    >
                        {isSaving ? <RefreshCw className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
                        {isSaving ? "PROCESSANDO..." : "CONSOLIDAR RONDA"}
                    </Button>
                </div>
            </div>

            {/* Dash de Saúde */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                <Card className="rounded-3xl border-none bg-blue-600 text-white shadow-xl shadow-blue-200">
                    <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                        <span className="opacity-70 text-[10px] font-black uppercase tracking-widest mb-1">Saúde Malha</span>
                        <span className="text-3xl font-black">{metricas.saude}%</span>
                        <Badge className="mt-2 bg-white/20 text-white hover:bg-white/30 border-none">
                            {metricas.ok}/{metricas.camerasAtivas} ON
                        </Badge>
                    </CardContent>
                </Card>
                {STATUS_OPCOES.map((status) => {
                    const count = Object.values(matriz).filter(v => v === status.value).length
                    return (
                        <Card key={status.value} className="rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all group overflow-hidden">
                            <div className={`h-1 w-full ${status.color} opacity-30 group-hover:opacity-100 transition-opacity`}></div>
                            <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                                <span className="text-slate-400 text-[9px] font-black uppercase tracking-tighter mb-1 line-clamp-1">{status.label}</span>
                                <span className={`text-2xl font-black ${count > 0 ? 'text-slate-800' : 'text-slate-300'}`}>{count}</span>
                                <div className={`h-1.5 w-1.5 rounded-full ${status.color} mt-2`}></div>
                            </CardContent>
                        </Card>
                    )
                })}
            </div>

            <div className="grid lg:grid-cols-12 gap-8 items-start">
                {/* Seletor de DVR */}
                <div className="lg:col-span-3 space-y-4">
                    <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 px-2">
                        <ArrowRight className="h-4 w-4 text-blue-600" />
                        Unidade de Gravação
                    </h3>
                    <div className="grid grid-cols-1 gap-2 max-h-[500px] overflow-y-auto pr-2 scrollbar-thin">
                        {dvrs.map((dvr) => {
                            const camerasDvr = Object.keys(matriz).filter(key => key.startsWith(`${dvr.id}-`))
                            const camerasComProblema = camerasDvr.filter(key => matriz[key] !== 'OK' && matriz[key] !== 'DESATIVADA').length
                            
                            return (
                                <Button
                                    key={dvr.id}
                                    variant={dvrAtivoId === dvr.id ? 'default' : 'outline'}
                                    className={`
                                        h-14 rounded-2xl font-black text-sm flex items-center justify-between px-4 transition-all
                                        ${dvrAtivoId === dvr.id ? 'bg-blue-600 shadow-lg shadow-blue-600/30' : 'hover:bg-slate-50 border-slate-200'}
                                    `}
                                    onClick={() => setDvrAtivoId(dvr.id)}
                                >
                                    <span className="truncate max-w-[150px]">{dvr.nome}</span>
                                    {camerasComProblema > 0 && (
                                        <Badge className="bg-rose-500 text-[10px] h-5 min-w-[20px] px-1.5 flex items-center justify-center rounded-full border-2 border-white">
                                            {camerasComProblema}
                                        </Badge>
                                    )}
                                </Button>
                            )
                        })}
                    </div>

                    <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 flex flex-col gap-3">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center mb-2">Comandos em Lote</p>
                        <Button variant="outline" className="rounded-xl font-bold bg-white border-emerald-100 text-emerald-600 h-11" onClick={() => setStatusLote('OK')}>
                            SET: Tudo em Ordem
                        </Button>
                        <Button variant="outline" className="rounded-xl font-bold bg-white border-slate-100 text-slate-400 h-11" onClick={() => setStatusLote('DESATIVADA')}>
                            SET: Tudo Desativado
                        </Button>
                    </div>
                </div>

                {/* Grid de Câmeras */}
                <Card className="lg:col-span-9 rounded-[2.5rem] border-none shadow-2xl shadow-slate-200/50 overflow-hidden bg-white">
                    <CardHeader className="bg-slate-50/50 border-b border-slate-100/50 p-8">
                        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                            <div className="flex items-center gap-4">
                                <div className="h-14 w-14 bg-white rounded-2xl shadow-sm flex items-center justify-center">
                                    <MonitorCheck className="h-7 w-7 text-blue-600" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-black text-slate-900 tracking-tight uppercase">
                                        MAPA: {dvrs.find(d => d.id === dvrAtivoId)?.nome || "Selecione um DVR"}
                                    </h2>
                                    <p className="text-slate-400 text-sm font-bold">Gerenciamento {(dvrs.find(d => d.id === dvrAtivoId)?.canais || CAMERAS_POR_DVR)} canais físicos</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 bg-white p-2 rounded-2xl shadow-sm border border-slate-100/50">
                                <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl" onClick={() => {
                                    const index = dvrs.findIndex(d => d.id === dvrAtivoId)
                                    if (index > 0) setDvrAtivoId(dvrs[index - 1].id)
                                }}>
                                    <ChevronLeft className="h-5 w-5" />
                                </Button>
                                <span className="font-black px-4 text-slate-600 text-xs uppercase">
                                    {(dvrs.findIndex(d => d.id === dvrAtivoId) + 1)} / {dvrs.length}
                                </span>
                                <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl" onClick={() => {
                                    const index = dvrs.findIndex(d => d.id === dvrAtivoId)
                                    if (index < dvrs.length - 1) setDvrAtivoId(dvrs[index + 1].id)
                                }}>
                                    <ChevronRight className="h-5 w-5" />
                                </Button>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-8">
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-6">
                            {Array.from({ length: (dvrs.find(d => d.id === dvrAtivoId)?.canais || CAMERAS_POR_DVR) }).map((_, i) => {
                                const camNum = i + 1
                                const status = matriz[`${dvrAtivoId}-${camNum}`] || 'OK'
                                const config = STATUS_OPCOES.find(op => op.value === status) || STATUS_OPCOES[0]
                                const Icon = config.icon

                                return (
                                    <div key={camNum} className="space-y-2 group">
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <button
                                                    className={`
                                                        relative w-full aspect-video rounded-3xl flex flex-col items-center justify-center gap-2
                                                        transition-all duration-300 active:scale-95 shadow-lg border-4
                                                        ${config.color} ${status === 'OK' ? 'border-emerald-100/30' : 'border-white/20'}
                                                        hover:brightness-110 group-hover:shadow-xl
                                                    `}
                                                >
                                                    <div className="absolute top-3 left-4 bg-black/10 backdrop-blur-md px-3 py-1 rounded-full border border-white/20">
                                                        <span className="text-[10px] font-black text-white">CH {String(camNum).padStart(2, '0')}</span>
                                                    </div>
                                                    
                                                    <Icon className="h-10 w-10 text-white drop-shadow-md transition-transform group-hover:scale-110" />
                                                    
                                                    <div className="absolute bottom-3 text-center">
                                                        <span className="text-[10px] font-black text-white/90 uppercase tracking-tighter drop-shadow-md">
                                                            {config.label === 'OK' ? 'Estável' : config.label.split(' ')[0]}
                                                        </span>
                                                    </div>

                                                    <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <Palette className="h-4 w-4 text-white/50" />
                                                    </div>
                                                </button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-64 p-2 rounded-2xl bg-white/90 backdrop-blur-xl border-white/20 shadow-2xl" side="top">
                                                <div className="grid grid-cols-1 gap-1">
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2 mb-1">Selecionar Status</p>
                                                    {STATUS_OPCOES.map((op) => (
                                                        <button
                                                            key={op.value}
                                                            onClick={() => setStatusManual(dvrAtivoId!, camNum, op.value)}
                                                            className={`
                                                                flex items-center gap-3 p-2 rounded-xl transition-all
                                                                ${status === op.value ? 'bg-slate-100' : 'hover:bg-slate-50'}
                                                            `}
                                                        >
                                                            <div className={`h-6 w-6 rounded-lg ${op.color} flex items-center justify-center`}>
                                                                <op.icon className="h-3 w-3 text-white" />
                                                            </div>
                                                            <span className="text-[11px] font-bold text-slate-700">{op.label}</span>
                                                            {status === op.value && <CheckCircle2 className="h-3 w-3 text-emerald-500 ml-auto" />}
                                                        </button>
                                                    ))}
                                                </div>
                                            </PopoverContent>
                                        </Popover>
                                        <div className="flex justify-between items-center px-2">
                                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter truncate max-w-[120px]">
                                                {dvrs.find(d => d.id === dvrAtivoId)?.nome} - CH {camNum}
                                            </span>
                                            <div className={`h-2 w-2 rounded-full ${config.color}`}></div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>

                        <div className="mt-12 p-8 bg-slate-50 rounded-[2rem] border border-slate-100 border-dashed">
                            <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                                <LayoutGrid className="h-4 w-4" />
                                Legenda de Status Operacional
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {STATUS_OPCOES.map((op) => (
                                    <div key={op.value} className="flex items-center gap-4 p-3 rounded-2xl hover:bg-white transition-colors">
                                        <div className={`h-10 w-10 rounded-xl ${op.color} flex items-center justify-center shadow-lg`}>
                                            <op.icon className="h-5 w-5 text-white" />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[11px] font-black text-slate-800 leading-tight">{op.label}</span>
                                            <span className="text-[9px] font-bold text-slate-400 uppercase">Ação: Alternar com clique</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
} 
