"use client"

import { useState, useEffect } from "react"
import { 
    format, 
    parseISO,
    isAfter,
    startOfDay,
    formatDistanceToNow
} from "date-fns"
import { ptBR } from "date-fns/locale"
import { 
    Calendar as CalendarIcon, 
    Users, 
    Shield, 
    Clock, 
    MapPin,
    AlertTriangle,
    CheckCircle2,
    XCircle,
    Info,
    Plus,
    Search,
    ChevronRight,
    Star,
    MessageCircle,
    Share2,
    Trash2
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { OpServiceV2, OpEquipe, OpEvento } from "@/services/op-service-v2"
import { Badge } from "@/components/ui/badge"
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
import { 
    Select, 
    SelectContent, 
    SelectItem, 
    SelectTrigger, 
    SelectValue 
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { toast } from "sonner"

export default function GestaoEventos() {
    const [eventos, setEventos] = useState<OpEvento[]>([])
    const [equipe, setEquipe] = useState<OpEquipe[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedEvento, setSelectedEvento] = useState<OpEvento | null>(null)
    const [isSelectionModalOpen, setIsSelectionModalOpen] = useState(false)
    const [disponibilidadeMap, setDisponibilidadeMap] = useState<Record<string, {status: string, motivo?: string}>>({})
    const [searchMembro, setSearchMembro] = useState("")
    const [convitesMap, setConvitesMap] = useState<Record<string, any>>({}) // Key: colaboradorId_fase
    const [isEventModalOpen, setIsEventModalOpen] = useState(false)
    const [eventFormData, setEventFormData] = useState<OpEvento>({
        nome: "",
        tipo: "Social",
        data_inicio: format(new Date(), 'yyyy-MM-dd'),
        data_fim: format(new Date(), 'yyyy-MM-dd'),
        cor: "#f59e0b",
        local: "",
        observacoes: "",
        local_detalhado: "",
        publico_estimado: "",
        foto_evento: "",
        patrocinador: "Hagana",
        responsavel_nome: "",
        nivel_criticidade: 3,
        montagem_inicio_data: format(new Date(), 'yyyy-MM-dd'),
        montagem_inicio_hora: "08:00",
        montagem_fim_data: format(new Date(), 'yyyy-MM-dd'),
        montagem_fim_hora: "18:00",
        equipe_montagem: [],
        has_montagem: true,
        evento_inicio_data: format(new Date(), 'yyyy-MM-dd'),
        evento_inicio_hora: "19:00",
        evento_fim_data: format(new Date(), 'yyyy-MM-dd'),
        evento_fim_hora: "23:59",
        equipe_realizacao: [],
        has_realizacao: true,
        desmontagem_inicio_data: format(new Date(), 'yyyy-MM-dd'),
        desmontagem_inicio_hora: "00:00",
        desmontagem_fim_data: format(new Date(), 'yyyy-MM-dd'),
        desmontagem_fim_hora: "08:00",
        equipe_desmontagem: [],
        has_desmontagem: false
    })

    useEffect(() => {
        loadData()
    }, [])

    const loadData = async () => {
        setLoading(true)
        try {
            const [listaEventos, listaEquipe] = await Promise.all([
                OpServiceV2.getEventos(),
                OpServiceV2.getEquipe()
            ])
            setEventos(listaEventos)
            setEquipe(listaEquipe)
        } catch (error) {
            console.error("Erro ao carregar eventos:", error)
            toast.error("Erro ao carregar dados")
        } finally {
            setLoading(false)
        }
    }

    const openSelectionModal = async (evento: OpEvento) => {
        setSelectedEvento(evento)
        setIsSelectionModalOpen(true)
        setLoading(true)
        
        // Calcular disponibilidade para todos os membros para este evento
        const map: Record<string, {status: string, motivo?: string}> = {}
        const dataEv = evento.evento_inicio_data || evento.data_inicio
        const horaIni = evento.evento_inicio_hora || "08:00"
        const horaFim = evento.evento_fim_hora || "20:00"

        await Promise.all(equipe.map(async (membro) => {
            const disp = await OpServiceV2.getDisponibilidade(membro, dataEv, horaIni, horaFim)
            map[membro.id] = disp
        }))
        
        setDisponibilidadeMap(map)

        // Carregar convites
        try {
            const convites = await OpServiceV2.getConvitesEvento(evento.id!)
            const cMap: Record<string, any> = {}
            convites.forEach(c => {
                cMap[`${c.colaborador_id}_${c.fase}`] = c
            })
            setConvitesMap(cMap)
        } catch (error) {
            console.error("Erro ao carregar convites:", error)
        }

        setLoading(false)
    }

    const toggleMembroNoEvento = async (membroId: string) => {
        if (!selectedEvento) return
        
        const currentEquipe = selectedEvento.equipe_realizacao || []
        let newEquipe: string[]
        
        if (currentEquipe.includes(membroId)) {
            newEquipe = currentEquipe.filter(id => id !== membroId)
        } else {
            const disp = disponibilidadeMap[membroId]
            if (disp?.status === 'conflito' || disp?.status === 'afastado') {
                if (!confirm(`Atenção: Este profissional está com ${disp.status} (${disp.motivo}). Deseja forçar a escalação manual?`)) {
                    return
                }
            }
            newEquipe = [...currentEquipe, membroId]
        }

        try {
            // Atualizar no banco
            await OpServiceV2.updateEvento(selectedEvento.id!, { equipe_realizacao: newEquipe })
            
            // Atualizar localmente
            setEventos(prev => prev.map(ev => ev.id === selectedEvento.id ? { ...ev, equipe_realizacao: newEquipe } : ev))
            setSelectedEvento(prev => prev ? { ...prev, equipe_realizacao: newEquipe } : null)
            
            toast.success("Equipe atualizada")
        } catch (error) {
            toast.error("Erro ao atualizar")
        }
    }

    const generateWhatsAppMessage = (evento: OpEvento, membroIndividual?: OpEquipe) => {
        const dataFormatada = format(parseISO(evento.data_inicio), "dd/MM/yyyy")
        const equipeNomes = (evento.equipe_realizacao || []).map(id => {
            const m = equipe.find(e => e.id === id)
            if (!m) return ""
            const isVspp = m.tipo_servico === 'VSPP' || m.funcao?.includes('VSPP')
            return `• ${m.nome_completo}${isVspp ? ' (🛡️ VSPP)' : ''}`
        }).filter(n => n !== "").join('\n')

        let texto = ""
        if (membroIndividual) {
            texto = `📢 *INFORMATIVO DE ESCALA - ${evento.nome.toUpperCase()}*\n\n` +
                    `Olá *${membroIndividual.nome_completo}*, você está escalado para este evento:\n\n` +
                    `📅 *DATA:* ${dataFormatada}\n` +
                    `⏰ *HORÁRIO:* ${evento.evento_inicio_hora} às ${evento.evento_fim_hora}\n` +
                    `📍 *LOCAL:* ${evento.local_detalhado || evento.local}\n\n` +
                    `🛡️ *EQUIPE COMPLETA:*\n${equipeNomes}\n\n` +
                    `_Por favor, confirme o recebimento deste informativo._`
        } else {
            texto = `📢 *ESCAlA GERAL - ${evento.nome.toUpperCase()}*\n\n` +
                    `📅 *DATA:* ${dataFormatada}\n` +
                    `⏰ *HORÁRIO:* ${evento.evento_inicio_hora} às ${evento.evento_fim_hora}\n` +
                    `📍 *LOCAL:* ${evento.local_detalhado || evento.local}\n\n` +
                    `🛡️ *EQUIPE ESCALADA:*\n${equipeNomes}`
        }

        return encodeURIComponent(texto)
    }

    const sendWhatsApp = (membro: OpEquipe, evento: OpEvento, tipo: 'convite' | 'confirmacao' = 'confirmacao') => {
        const cel = membro.cel1 || membro.cel2
        if (!cel) {
            toast.error("Este profissional não possui celular cadastrado.")
            return
        }

        const dataFormatada = format(parseISO(evento.data_inicio), "dd/MM/yyyy")
        let texto = ""

        if (tipo === 'convite') {
            // Calcular valor individual para o convite
            const calc = OpServiceV2.calculateStaffValue(
                [membro],
                evento.patrocinador || 'Hagana',
                evento.evento_inicio_data || evento.data_inicio,
                evento.evento_inicio_hora || "08:00",
                evento.evento_fim_data || evento.data_fim || (evento.evento_inicio_data || evento.data_inicio),
                evento.evento_fim_hora || "20:00"
            )
            const valorMembro = calc.total

            texto = `📢 *CONVITE DE ESCALA - ${evento.nome.toUpperCase()}*\n\n` +
                    `Olá *${membro.nome_completo}*, temos uma vaga para este evento:\n\n` +
                    `📅 *DATA:* ${dataFormatada}\n` +
                    `⏰ *HORÁRIO:* ${evento.evento_inicio_hora} às ${evento.evento_fim_hora}\n` +
                    `📍 *LOCAL:* ${evento.local_detalhado || evento.local}\n` +
                    `💰 *VALOR:* R$ ${valorMembro.toFixed(2)}\n\n` +
                    `*Você tem disponibilidade?*\n` +
                    `Responda com *SIM* ou *NÃO* para seguirmos com o registro.`
            
            // Atualizar status para CONVIDADO
            handleUpdateConvite(membro.id, 'CONVIDADO')
        } else {
            texto = generateWhatsAppMessage(evento, membro)
        }

        const cleanNumber = cel.replace(/\D/g, '')
        const encodedMessage = encodeURIComponent(texto)
        window.open(`https://wa.me/55${cleanNumber}?text=${encodedMessage}`, '_blank')
    }

    const handleUpdateConvite = async (colaboradorId: string, status: 'PENDENTE' | 'CONVIDADO' | 'ACEITO' | 'RECUSADO', fase: string = 'realizacao') => {
        if (!selectedEvento) return

        try {
            await OpServiceV2.upsertConvite({
                evento_id: selectedEvento.id!,
                colaborador_id: colaboradorId,
                fase,
                status,
                data_convite: status === 'CONVIDADO' ? new Date().toISOString() : undefined,
                data_resposta: (status === 'ACEITO' || status === 'RECUSADO') ? new Date().toISOString() : undefined
            })

            setConvitesMap(prev => ({
                ...prev,
                [`${colaboradorId}_${fase}`]: { 
                    ...prev[`${colaboradorId}_${fase}`], 
                    status,
                    colaborador_id: colaboradorId,
                    fase
                }
            }))

            if (status === 'RECUSADO') {
                handleRecusaSubstituicao(colaboradorId, fase)
            }

            toast.success(`Status atualizado: ${status}`)
        } catch (error) {
            toast.error("Erro ao atualizar status")
        }
    }

    const handleCancelConvite = async (membro: OpEquipe) => {
        if (!selectedEvento) return

        try {
            // 1. Atualizar status para PENDENTE no banco
            await OpServiceV2.upsertConvite({
                evento_id: selectedEvento.id!,
                colaborador_id: membro.id,
                fase: 'realizacao',
                status: 'PENDENTE',
                data_convite: null as any // Limpar data
            })

            // 2. Remover da equipe do evento
            const currentEquipe = selectedEvento.equipe_realizacao || []
            const newEquipe = currentEquipe.filter(id => id !== membro.id)
            await OpServiceV2.updateEvento(selectedEvento.id!, { equipe_realizacao: newEquipe })

            // 3. Atualizar Estado Local
            setConvitesMap(prev => ({
                ...prev,
                [`${membro.id}_realizacao`]: { ...prev[`${membro.id}_realizacao`], status: 'PENDENTE', data_convite: null }
            }))
            setSelectedEvento(prev => prev ? { ...prev, equipe_realizacao: newEquipe } : null)
            setEventos(prev => prev.map(ev => ev.id === selectedEvento.id ? { ...ev, equipe_realizacao: newEquipe } : ev))

            // 4. Abrir WhatsApp de "Despedida"
            const texto = `Olá *${membro.nome_completo}*, por conta do tempo de resposta, tivemos que seguir com outro profissional para esta vaga no evento *${selectedEvento.nome}*. Agradecemos o interesse e contamos com você em uma próxima! 🙌`
            const cel = membro.cel1 || membro.cel2
            if (cel) {
                const cleanNumber = cel.replace(/\D/g, '')
                window.open(`https://wa.me/55${cleanNumber}?text=${encodeURIComponent(texto)}`, '_blank')
            }

            toast.info("Convite cancelado e vaga liberada.")
        } catch (error) {
            console.error("Erro ao cancelar convite:", error)
            toast.error("Erro ao cancelar convite")
        }
    }

    const handleRecusaSubstituicao = async (colaboradorId: string, fase: string) => {
        if (!selectedEvento) return
        
        const mOriginal = equipe.find(e => e.id === colaboradorId)
        if (!mOriginal) return

        toast.info("Buscando substituto de mesmo nível...")
        
        // Remover o atual do evento
        const currentEquipe = selectedEvento.equipe_realizacao || []
        const newEquipeBase = currentEquipe.filter(id => id !== colaboradorId)
        
        // Buscar candidatos que já não estão no evento
        const substituto = await OpServiceV2.findBestSubstitute(
            selectedEvento, 
            fase, 
            mOriginal.nivel || 3, 
            [...currentEquipe] // Excluir todos que já estão (incluindo o que recusou)
        )

        if (substituto) {
            const finalEquipe = [...newEquipeBase, substituto.id]
            await OpServiceV2.updateEvento(selectedEvento.id!, { equipe_realizacao: finalEquipe })
            
            setEventos(prev => prev.map(ev => ev.id === selectedEvento.id ? { ...ev, equipe_realizacao: finalEquipe } : ev))
            setSelectedEvento(prev => prev ? { ...prev, equipe_realizacao: finalEquipe } : null)
            
            // Criar convite pendente para o novo
            handleUpdateConvite(substituto.id, 'PENDENTE', fase)
            
            toast.success(`Substituto encontrado: ${substituto.nome_completo}. Enviando novo convite...`)
            // Opcional: já abrir o WhatsApp para o novo convite?
            // sendWhatsApp(substituto, selectedEvento, 'convite')
        } else {
            toast.warning("Não encontrei disponível de mesmo nível no momento.")
        }
    }

    const shareEventLink = (evento: OpEvento) => {
        const message = generateWhatsAppMessage(evento)
        window.open(`https://wa.me/?text=${message}`, '_blank')
    }

    const handleCreateEvento = async () => {
        if (!eventFormData.nome) return
        setLoading(true)
        try {
            const payload: OpEvento = {
                ...eventFormData,
                data_inicio: eventFormData.montagem_inicio_data || eventFormData.data_inicio,
                data_fim: eventFormData.desmontagem_fim_data || eventFormData.data_fim
            }
            
            await OpServiceV2.createEvento(payload)
            setIsEventModalOpen(false)
            
            // Resetar form
            setEventFormData({
                nome: "",
                tipo: "Social",
                data_inicio: format(new Date(), 'yyyy-MM-dd'),
                data_fim: format(new Date(), 'yyyy-MM-dd'),
                cor: "#f59e0b",
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
                desmontagem_fim_data: format(new Date(), 'yyyy-MM-dd'),
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
            
        } catch (error: any) {
            console.error("Erro ao criar evento:", error)
            toast.error("Erro ao salvar: " + (error.message || "tente novamente"))
        } finally {
            setLoading(false)
        }
    }

    const handleDeleteEvento = async (id: string) => {
        if (!confirm("Deseja realmente cancelar/excluir este evento? Esta ação não pode ser desfeita.")) return
        
        setLoading(true)
        try {
            await OpServiceV2.deleteEvento(id)
            toast.success("Evento removido com sucesso")
            loadData()
        } catch (error) {
            console.error("Erro ao excluir evento:", error)
            toast.error("Erro ao excluir evento")
        } finally {
            setLoading(false)
        }
    }

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'disponivel': return <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            case 'conflito': return <XCircle className="h-4 w-4 text-rose-500" />
            case 'alerta': return <AlertTriangle className="h-4 w-4 text-amber-500" />
            case 'afastado': return <Info className="h-4 w-4 text-purple-500" />
            default: return null
        }
    }

    if (loading && eventos.length === 0) {
        return <div className="p-20 text-center animate-pulse font-black text-slate-400 uppercase tracking-widest text-xs">Carregando Eventos...</div>
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex justify-between items-center mb-2">
                <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
                    <Shield className="h-6 w-6 text-blue-600" />
                    Gestão de Operações
                </h2>
                <Button 
                    onClick={() => setIsEventModalOpen(true)}
                    className="bg-slate-900 hover:bg-black text-white font-black text-xs uppercase tracking-widest rounded-2xl h-12 px-6 flex items-center gap-2 transition-all active:scale-95 shadow-xl shadow-slate-200"
                >
                    <Plus className="h-5 w-5" />
                    Novo Evento
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {eventos.map(evento => (
                    <Card key={evento.id} className="overflow-hidden border-none shadow-xl hover:shadow-2xl transition-all group rounded-[32px] bg-white">
                        <div className="h-3 w-full" style={{ backgroundColor: evento.cor || '#3b82f6' }}></div>
                        <CardHeader className="p-6 pb-2">
                            <div className="flex justify-between items-start mb-2">
                                <Badge variant="outline" className="bg-slate-50 text-[10px] font-black border-slate-200 py-1 rounded-lg uppercase tracking-wider">
                                    {evento.tipo}
                                </Badge>
                                <Badge className={`
                                    ${evento.nivel_criticidade === 1 ? 'bg-rose-500' : evento.nivel_criticidade === 2 ? 'bg-orange-500' : 'bg-emerald-500'}
                                    text-white text-[10px] font-black px-2 py-1 rounded-lg uppercase tracking-wider
                                `}>
                                    NÍVEL {evento.nivel_criticidade || 3}
                                </Badge>
                            </div>
                            <CardTitle className="text-xl font-black text-slate-900 group-hover:text-blue-600 transition-colors">
                                {evento.nome}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 pt-2 space-y-4">
                            <div className="space-y-2">
                                <div className="flex items-center gap-2 text-slate-500">
                                    <CalendarIcon className="h-4 w-4" />
                                    <span className="text-xs font-bold uppercase">{format(parseISO(evento.data_inicio), "dd 'de' MMMM", { locale: ptBR })}</span>
                                </div>
                                <div className="flex items-center gap-2 text-slate-500">
                                    <Clock className="h-4 w-4" />
                                    <span className="text-xs font-bold uppercase">{evento.evento_inicio_hora} às {evento.evento_fim_hora}</span>
                                </div>
                                <div className="flex items-center gap-2 text-slate-500">
                                    <MapPin className="h-4 w-4" />
                                    <span className="text-xs font-bold truncate">{evento.local_detalhado || evento.local}</span>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                                <div className="flex -space-x-2">
                                    {(evento.equipe_realizacao || []).slice(0, 4).map(id => {
                                        const m = equipe.find(e => e.id === id)
                                        return (
                                            <div key={id} className="h-8 w-8 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center text-[10px] font-black text-slate-600 shadow-sm" title={m?.nome_completo}>
                                                {m?.nome_completo.charAt(0)}
                                            </div>
                                        )
                                    })}
                                    {(evento.equipe_realizacao?.length || 0) > 4 && (
                                        <div className="h-8 w-8 rounded-full bg-blue-50 border-2 border-white flex items-center justify-center text-[10px] font-black text-blue-600 shadow-sm">
                                            +{(evento.equipe_realizacao?.length || 0) - 4}
                                        </div>
                                    )}
                                    {(evento.equipe_realizacao?.length || 0) === 0 && (
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic ml-2">Vazia</span>
                                    )}
                                </div>
                                <div className="flex items-center gap-1">
                                    <Button 
                                        onClick={() => shareEventLink(evento)}
                                        variant="ghost" 
                                        size="icon"
                                        className="h-9 w-9 rounded-xl text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700"
                                        title="Compartilhar Escala Geral"
                                    >
                                        <Share2 className="h-4 w-4" />
                                    </Button>
                                    <Button 
                                        onClick={() => handleDeleteEvento(evento.id!)}
                                        variant="ghost" 
                                        size="icon"
                                        className="h-9 w-9 rounded-xl text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                                        title="Cancelar/Excluir Evento"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                    <Button 
                                        onClick={() => openSelectionModal(evento)}
                                        variant="ghost" 
                                        size="sm"
                                        className="rounded-xl font-black text-[10px] uppercase tracking-widest text-blue-600 hover:bg-blue-50"
                                    >
                                        Escalar <ChevronRight className="h-3 w-3 ml-1" />
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <Dialog open={isSelectionModalOpen} onOpenChange={setIsSelectionModalOpen}>
                <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden rounded-[32px] border-none shadow-2xl bg-white h-[90vh] flex flex-col">
                    <DialogHeader className="p-8 pb-4 shrink-0 bg-slate-50/50">
                        <DialogTitle className="text-2xl font-black text-slate-900 flex items-center gap-3">
                            <div className="p-2 bg-blue-600 rounded-2xl shadow-lg shadow-blue-500/20">
                                <Users className="h-6 w-6 text-white" />
                            </div>
                            Escala Inteligente
                        </DialogTitle>
                        <DialogDescription className="text-slate-500 font-bold mt-2">
                           <div className="flex flex-col gap-2">
                               <div>{selectedEvento?.nome} • {selectedEvento ? format(parseISO(selectedEvento.data_inicio), "dd/MM/yyyy") : ""}</div>
                               <div className="flex items-center gap-3">
                                   <div className="flex items-center gap-1.5 px-2 py-1 bg-blue-50 text-blue-700 rounded-lg border border-blue-100">
                                       <Users className="h-3 w-3" />
                                       <span className="text-[10px] font-black uppercase tracking-widest leading-none">
                                           Vagas: {selectedEvento?.vagas_necessarias || 0}
                                       </span>
                                   </div>
                                   <div className="flex items-center gap-1.5 px-2 py-1 bg-emerald-50 text-emerald-700 rounded-lg border border-emerald-100">
                                       <CheckCircle2 className="h-3 w-3" />
                                       <span className="text-[10px] font-black uppercase tracking-widest leading-none">
                                           Preenchidas: {selectedEvento?.equipe_realizacao?.length || 0}
                                       </span>
                                   </div>
                                   <div className="flex items-center gap-1.5 px-2 py-1 bg-slate-50 text-slate-500 rounded-lg border border-slate-100">
                                       <div className="h-1.5 w-1.5 rounded-full bg-slate-300" />
                                       <span className="text-[10px] font-black uppercase tracking-widest leading-none">
                                           Faltam: {Math.max(0, (selectedEvento?.vagas_necessarias || 0) - (selectedEvento?.equipe_realizacao?.length || 0))}
                                       </span>
                                   </div>
                               </div>
                           </div>
                        </DialogDescription>
                    </DialogHeader>

                    <div className="p-6 pt-2 shrink-0 border-b border-slate-100">
                        <div className="relative group">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-hover:text-blue-500 transition-colors" />
                            <Input 
                                placeholder="Buscar por nome ou RE..." 
                                value={searchMembro}
                                onChange={(e) => setSearchMembro(e.target.value)}
                                className="h-12 pl-10 rounded-2xl border-slate-200 bg-white shadow-inner focus:ring-4 focus:ring-blue-500/10 font-bold text-sm"
                            />
                        </div>
                    </div>

                    <ScrollArea className="flex-1 p-6">
                        <div className="space-y-6">
                            <div className="space-y-2 mb-6">
                                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 pl-2 mb-3 flex items-center gap-2">
                                    <div className="h-1 w-3 bg-blue-600 rounded-full" />
                                    Efetivo Clube
                                </h4>
                                {equipe
                                    .filter(m => (m.tipo_vinculo || 'clube') === 'clube')
                                    .filter(m => m.nome_completo.toLowerCase().includes(searchMembro.toLowerCase()) || m.re.includes(searchMembro))
                                    .sort((a, b) => {
                                        const dispA = disponibilidadeMap[a.id]?.status === 'disponivel' ? 0 : 1
                                        const dispB = disponibilidadeMap[b.id]?.status === 'disponivel' ? 0 : 1
                                        if (dispA !== dispB) return dispA - dispB

                                        if (selectedEvento) {
                                            const nivelAlvo = selectedEvento.nivel_criticidade || 3
                                            const getPeso = (n: number, alvo: number) => {
                                                if (n === alvo) return 0
                                                if (alvo === 1) return n === 2 ? 1 : 2
                                                if (alvo === 2) return n === 1 ? 1 : 2
                                                return n === 2 ? 1 : 2
                                            }
                                            const pesoA = getPeso(a.nivel || 3, nivelAlvo)
                                            const pesoB = getPeso(b.nivel || 3, nivelAlvo)
                                            if (pesoA !== pesoB) return pesoA - pesoB
                                        }
                                        return a.nome_completo.localeCompare(b.nome_completo)
                                    })
                                    .map(membro => {
                                        const disp = disponibilidadeMap[membro.id]
                                        const isSelected = selectedEvento?.equipe_realizacao?.includes(membro.id)
                                        
                                        return (
                                            <div 
                                                key={membro.id}
                                                onClick={() => toggleMembroNoEvento(membro.id)}
                                                className={`
                                                    p-4 rounded-2xl border transition-all cursor-pointer flex items-center gap-4
                                                    ${isSelected ? 'bg-blue-50 border-blue-200 ring-1 ring-blue-500/20' : 'bg-white border-slate-100 hover:border-slate-300'}
                                                `}
                                            >
                                                <div className="relative shrink-0">
                                                    <div className={`
                                                        h-10 w-10 rounded-xl flex items-center justify-center border shadow-sm transition-all
                                                        ${disp?.status === 'disponivel' ? 'bg-emerald-500 border-emerald-400 text-white shadow-emerald-200' : 
                                                          disp?.status === 'conflito' ? 'bg-rose-500 border-rose-400 text-white shadow-rose-200' :
                                                          disp?.status === 'afastado' ? 'bg-purple-500 border-purple-400 text-white shadow-purple-200' :
                                                          'bg-slate-100 border-slate-200 text-slate-400'}
                                                    `}>
                                                        {disp?.status === 'disponivel' && <CheckCircle2 className="h-5 w-5" />}
                                                        {disp?.status === 'conflito' && <XCircle className="h-5 w-5" />}
                                                        {disp?.status === 'afastado' && <Info className="h-5 w-5" />}
                                                        {!disp?.status && membro.nome_completo.charAt(0)}
                                                    </div>
                                                    {membro.possui_porte_arma && (
                                                        <div className="absolute -top-1 -right-1 h-5 w-5 bg-orange-500 rounded-full border-2 border-white flex items-center justify-center shadow-sm">
                                                            <Shield className="h-3 w-3 text-white" />
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex-1 overflow-hidden">
                                                    <p className="font-black text-slate-800 text-sm truncate">{membro.nome_completo}</p>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <Badge variant="outline" className="text-[9px] font-black px-1.5 py-0 rounded-md uppercase tracking-tighter border-slate-200 text-slate-400">
                                                            RE {membro.re}
                                                        </Badge>
                                                        <Badge className={`
                                                            ${membro.nivel === 1 ? 'bg-rose-500' : membro.nivel === 2 ? 'bg-orange-500' : 'bg-emerald-500'}
                                                            text-white text-[9px] font-black px-1.5 py-0 rounded-md uppercase tracking-tighter
                                                        `}>
                                                            NV {membro.nivel || 3}
                                                        </Badge>
                                                    </div>
                                                </div>
                                                <div className="shrink-0 flex items-center gap-3">
                                                    <div className="text-right">
                                                        <div className="flex items-center justify-end gap-1.5 mb-1">
                                                            {getStatusIcon(disp?.status)}
                                                            <span className={`text-[9px] font-black uppercase tracking-widest ${disp?.status === 'disponivel' ? 'text-emerald-600' : disp?.status === 'conflito' ? 'text-rose-600' : 'text-slate-400'}`}>
                                                                {disp?.status === 'disponivel' ? 'Livre' : disp?.status}
                                                            </span>
                                                        </div>
                                                        {disp?.motivo && <p className="text-[8px] font-bold text-slate-400 italic max-w-[120px] truncate">{disp.motivo}</p>}
                                                    </div>
                                                    {isSelected && (
                                                        <div className="flex flex-col gap-2">
                                                            {(() => {
                                                                const cStatus = convitesMap[`${membro.id}_realizacao`]?.status || 'PENDENTE'
                                                                
                                                                return (
                                                                    <div className="flex items-center gap-1">
                                                                        {cStatus === 'PENDENTE' && (
                                                                            <Button 
                                                                                size="sm"
                                                                                variant="outline"
                                                                                className="h-8 text-[9px] font-black uppercase tracking-widest border-emerald-200 text-emerald-600 hover:bg-emerald-50 rounded-lg"
                                                                                onClick={(e) => { e.stopPropagation(); sendWhatsApp(membro, selectedEvento!, 'convite'); }}
                                                                            >
                                                                                <MessageCircle className="h-3 w-3 mr-1" /> Convidar
                                                                            </Button>
                                                                        )}
                                                                        {cStatus === 'CONVIDADO' && (
                                                                            <div className="flex gap-1">
                                                                                <Button 
                                                                                    size="sm"
                                                                                    className="h-8 bg-emerald-500 hover:bg-emerald-600 text-white text-[9px] font-black uppercase rounded-lg"
                                                                                    onClick={(e) => { e.stopPropagation(); handleUpdateConvite(membro.id, 'ACEITO'); }}
                                                                                >
                                                                                    Aceitou
                                                                                </Button>
                                                                                <Button 
                                                                                    size="sm"
                                                                                    className="h-8 bg-rose-500 hover:bg-rose-600 text-white text-[9px] font-black uppercase rounded-lg"
                                                                                    onClick={(e) => { e.stopPropagation(); handleUpdateConvite(membro.id, 'RECUSADO'); }}
                                                                                >
                                                                                    Recusou
                                                                                </Button>
                                                                            </div>
                                                                        )}
                                                                        {cStatus === 'ACEITO' && (
                                                                            <Button 
                                                                                size="sm"
                                                                                className="h-8 bg-blue-600 hover:bg-blue-700 text-white text-[9px] font-black uppercase rounded-lg"
                                                                                onClick={(e) => { e.stopPropagation(); sendWhatsApp(membro, selectedEvento!, 'confirmacao'); }}
                                                                            >
                                                                                Confirmar Detalhes
                                                                            </Button>
                                                                        )}
                                                                        {cStatus === 'RECUSADO' && (
                                                                            <Badge className="bg-slate-200 text-slate-500 text-[8px] uppercase">Recusou</Badge>
                                                                        )}
                                                                    </div>
                                                                )
                                                            })()}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )
                                    })}
                            </div>

                            {/* GRUPO APOIO EXTERNO */}
                            <div className="space-y-2">
                                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 pl-2 mb-3 flex items-center gap-2">
                                    <div className="h-1 w-3 bg-orange-500 rounded-full" />
                                    Apoio Externo / Especialistas
                                </h4>
                                {equipe
                                    .filter(m => m.tipo_vinculo === 'externo')
                                    .filter(m => m.nome_completo.toLowerCase().includes(searchMembro.toLowerCase()) || m.re.includes(searchMembro))
                                    .sort((a, b) => {
                                        const dispA = disponibilidadeMap[a.id]?.status === 'disponivel' ? 0 : 1
                                        const dispB = disponibilidadeMap[b.id]?.status === 'disponivel' ? 0 : 1
                                        if (dispA !== dispB) return dispA - dispB

                                        if (selectedEvento) {
                                            const nivelAlvo = selectedEvento.nivel_criticidade || 3
                                            const getPeso = (n: number, alvo: number) => {
                                                if (n === alvo) return 0
                                                if (alvo === 1) return n === 2 ? 1 : 2
                                                if (alvo === 2) return n === 1 ? 1 : 2
                                                return n === 2 ? 1 : 2
                                            }
                                            const pesoA = getPeso(a.nivel || 3, nivelAlvo)
                                            const pesoB = getPeso(b.nivel || 3, nivelAlvo)
                                            if (pesoA !== pesoB) return pesoA - pesoB
                                        }
                                        return a.nome_completo.localeCompare(b.nome_completo)
                                    })
                                    .map(membro => {
                                        const disp = disponibilidadeMap[membro.id]
                                        const isSelected = selectedEvento?.equipe_realizacao?.includes(membro.id)
                                        
                                        return (
                                            <div 
                                                key={membro.id}
                                                onClick={() => toggleMembroNoEvento(membro.id)}
                                                className={`
                                                    p-4 rounded-2xl border transition-all cursor-pointer flex items-center gap-4
                                                    ${isSelected ? 'bg-orange-50 border-orange-200 ring-1 ring-orange-500/20' : 'bg-white border-slate-100 hover:border-slate-300'}
                                                `}
                                            >
                                                <div className="relative shrink-0">
                                                    <div className={`
                                                        h-10 w-10 rounded-xl flex items-center justify-center border shadow-sm transition-all
                                                        ${disp?.status === 'disponivel' ? 'bg-emerald-500 border-emerald-400 text-white shadow-emerald-200' : 
                                                          disp?.status === 'conflito' ? 'bg-rose-500 border-rose-400 text-white shadow-rose-200' :
                                                          disp?.status === 'afastado' ? 'bg-purple-500 border-purple-400 text-white shadow-purple-200' :
                                                          'bg-slate-100 border-slate-200 text-slate-400'}
                                                    `}>
                                                        {disp?.status === 'disponivel' && <CheckCircle2 className="h-5 w-5" />}
                                                        {disp?.status === 'conflito' && <XCircle className="h-5 w-5" />}
                                                        {disp?.status === 'afastado' && <Info className="h-5 w-5" />}
                                                        {!disp?.status && membro.nome_completo.charAt(0)}
                                                    </div>
                                                    {membro.possui_porte_arma && (
                                                        <div className="absolute -top-1 -right-1 h-5 w-5 bg-orange-500 rounded-full border-2 border-white flex items-center justify-center shadow-sm">
                                                            <Shield className="h-3 w-3 text-white" />
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex-1 overflow-hidden">
                                                    <p className="font-black text-slate-800 text-sm truncate">{membro.nome_completo}</p>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <Badge variant="outline" className="text-[9px] font-black px-1.5 py-0 rounded-md uppercase tracking-tighter border-slate-200 text-slate-400">
                                                            REF {membro.re}
                                                        </Badge>
                                                        <Badge className="bg-slate-900 text-white text-[9px] font-black px-1.5 py-0 rounded-md uppercase tracking-tighter">
                                                            {membro.tipo_servico || 'Especialista'}
                                                        </Badge>
                                                        <Badge className={`
                                                            ${membro.nivel === 1 ? 'bg-rose-500' : membro.nivel === 2 ? 'bg-orange-500' : 'bg-emerald-500'}
                                                            text-white text-[9px] font-black px-1.5 py-0 rounded-md uppercase tracking-tighter
                                                        `}>
                                                            NV {membro.nivel || 3}
                                                        </Badge>
                                                    </div>
                                                </div>
                                                <div className="shrink-0 flex items-center gap-3">
                                                    <div className="text-right">
                                                        <div className="flex items-center justify-end gap-1.5 mb-1">
                                                            {getStatusIcon(disp?.status)}
                                                            <span className={`text-[9px] font-black uppercase tracking-widest ${disp?.status === 'disponivel' ? 'text-emerald-600' : disp?.status === 'conflito' ? 'text-rose-600' : 'text-slate-400'}`}>
                                                                {disp?.status === 'disponivel' ? 'Livre' : disp?.status}
                                                            </span>
                                                        </div>
                                                        {disp?.motivo && <p className="text-[8px] font-bold text-slate-400 italic max-w-[120px] truncate">{disp.motivo}</p>}
                                                    </div>
                                                    {isSelected && (
                                                        <div className="flex flex-col gap-2">
                                                            {(() => {
                                                                const cStatus = convitesMap[`${membro.id}_realizacao`]?.status || 'PENDENTE'
                                                                
                                                                return (
                                                                    <div className="flex items-center gap-1">
                                                                        {cStatus === 'PENDENTE' && (
                                                                            <Button 
                                                                                size="sm"
                                                                                variant="outline"
                                                                                className="h-8 text-[9px] font-black uppercase tracking-widest border-emerald-200 text-emerald-600 hover:bg-emerald-50 rounded-lg"
                                                                                onClick={(e) => { e.stopPropagation(); sendWhatsApp(membro, selectedEvento!, 'convite'); }}
                                                                            >
                                                                                <MessageCircle className="h-3 w-3 mr-1" /> Convidar
                                                                            </Button>
                                                                        )}
                                                                        {cStatus === 'CONVIDADO' && (
                                                                            <div className="flex gap-1">
                                                                                <Button 
                                                                                    size="sm"
                                                                                    className="h-8 bg-emerald-500 hover:bg-emerald-600 text-white text-[9px] font-black uppercase rounded-lg"
                                                                                    onClick={(e) => { e.stopPropagation(); handleUpdateConvite(membro.id, 'ACEITO'); }}
                                                                                >
                                                                                    Aceitou
                                                                                </Button>
                                                                                <Button 
                                                                                    size="sm"
                                                                                    className="h-8 bg-rose-500 hover:bg-rose-600 text-white text-[9px] font-black uppercase rounded-lg"
                                                                                    onClick={(e) => { e.stopPropagation(); handleUpdateConvite(membro.id, 'RECUSADO'); }}
                                                                                >
                                                                                    Recusou
                                                                                </Button>
                                                                            </div>
                                                                        )}
                                                                        {cStatus === 'ACEITO' && (
                                                                            <Button 
                                                                                size="sm"
                                                                                className="h-8 bg-blue-600 hover:bg-blue-700 text-white text-[9px] font-black uppercase rounded-lg"
                                                                                onClick={(e) => { e.stopPropagation(); sendWhatsApp(membro, selectedEvento!, 'confirmacao'); }}
                                                                            >
                                                                                Confirmar Detalhes
                                                                            </Button>
                                                                        )}
                                                                        {cStatus === 'RECUSADO' && (
                                                                            <Badge className="bg-slate-200 text-slate-500 text-[8px] uppercase">Recusou</Badge>
                                                                        )}
                                                                    </div>
                                                                )
                                                            })()}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )
                                    })}
                            </div>
                        </div>
                    </ScrollArea>

                    <DialogFooter className="p-8 pt-4 bg-slate-50 border-t border-slate-100 shrink-0">
                        <Button onClick={() => setIsSelectionModalOpen(false)} className="w-full h-14 bg-slate-900 hover:bg-black rounded-2xl font-black text-white uppercase tracking-widest text-xs transition-all active:scale-95 shadow-xl shadow-slate-200">
                            Concluir Escalação
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
                            Define o período e níveis de criticidade. A escalação detalhada da equipe será feita clicando no botão 'Escalar' do card gerado.
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
                                        {['#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#ec4899'].map(color => (
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
                                    <div className="grid grid-cols-3 gap-4">
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Público Estimado</Label>
                                            <Input placeholder="Ex: 800" value={eventFormData.publico_estimado} onChange={(e) => setEventFormData({ ...eventFormData, publico_estimado: e.target.value })} className="h-12 rounded-xl border-slate-200 font-bold bg-white" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Vagas (Profissionais)</Label>
                                            <Input type="number" placeholder="Ex: 10" value={eventFormData.vagas_necessarias} onChange={(e) => setEventFormData({ ...eventFormData, vagas_necessarias: parseInt(e.target.value) || 0 })} className="h-12 rounded-xl border-slate-200 font-bold bg-white" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">URL Foto</Label>
                                            <Input placeholder="Opcional" value={eventFormData.foto_evento} onChange={(e) => setEventFormData({ ...eventFormData, foto_evento: e.target.value })} className="h-12 rounded-xl border-slate-200 font-bold bg-white" />
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
