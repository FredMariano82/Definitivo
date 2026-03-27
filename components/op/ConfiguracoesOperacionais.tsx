"use client"

import { useState, useEffect, useMemo } from "react"
import { 
    Users, 
    UserPlus, 
    Edit3, 
    Trash2, 
    Search, 
    Shield, 
    Smartphone, 
    Calendar,
    Save,
    X,
    CheckCircle2,
    XCircle,
    AlertCircle,
    Plane,
    Clock,
    Phone,
    Plus
} from "lucide-react"
import { format } from "date-fns"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { OpServiceV2, OpEquipe, OpEscalaDiaria } from "@/services/op-service-v2"
import { 
    Dialog, 
    DialogContent, 
    DialogHeader, 
    DialogTitle, 
    DialogFooter,
    DialogDescription 
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"

export default function ConfiguracoesOperacionais() {
    const [equipe, setEquipe] = useState<OpEquipe[]>([])
    const [excecoes, setExcecoes] = useState<OpEscalaDiaria[]>([])
    const [loading, setLoading] = useState(true)
    const [filtro, setFiltro] = useState("")
    
    // Modal de Cadastro/Edição
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingMember, setEditingMember] = useState<OpEquipe | null>(null)
    const [isCustomFuncao, setIsCustomFuncao] = useState(false)
    const [formData, setFormData] = useState<Partial<OpEquipe>>({
        nome_completo: "",
        re: "",
        funcao: "Vigilante",
        tipo_escala: "12x36",
        tipo_servico: "Vigilante/Operacional",
        status_ativo: true,
        possui_porte_arma: false,
        possui_cnh: false,
        nivel: 3,
        cel1: "",
        cel2: "",
        tipo_vinculo: "clube"
    })

    // Lista de cargos extraída dinamicamente da equipe + padrão
    const funcoesDisponiveis = useMemo(() => {
        const padrao = ["Vigilante", "VSPP", "Portaria", "Líder", "Motorista"]
        const extras = equipe
            .map(m => m.funcao)
            .filter((v): v is string => !!v && !padrao.includes(v))
        
        return Array.from(new Set([...padrao, ...extras])).sort()
    }, [equipe])

    useEffect(() => {
        loadEquipe()
    }, [])

    const loadEquipe = async () => {
        setLoading(true)
        try {
            const today = format(new Date(), 'yyyy-MM-dd')
            const [data, listaExcecoes] = await Promise.all([
                OpServiceV2.getEquipe(),
                OpServiceV2.getEscalasPeriodo(today, today)
            ])
            setEquipe(data)
            setExcecoes(listaExcecoes)
        } catch (error) {
            console.error("Erro ao carregar equipe:", error)
        } finally {
            setLoading(false)
        }
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Trabalhando': return 'bg-blue-600'
            case 'Folga': return 'bg-slate-100 text-slate-400 border border-slate-200'
            case 'Falta': return 'bg-rose-500 text-white'
            case 'Atestado': return 'bg-orange-500 text-white'
            case 'Férias': return 'bg-purple-600 text-white'
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
    const handleOpenModal = (membro?: OpEquipe) => {
        if (membro) {
            setEditingMember(membro)
            setFormData(membro)
            // Verificar se o cargo atual está nas opções conhecidas
            setIsCustomFuncao(!funcoesDisponiveis.includes(membro.funcao || ""))
        } else {
            setEditingMember(null)
            setFormData({
                nome_completo: "",
                re: "",
                funcao: "Vigilante",
                tipo_escala: "12x36",
                tipo_servico: "Vigilante/Operacional",
                status_ativo: true,
                possui_porte_arma: false,
                possui_cnh: false,
                nivel: 3,
                cel1: "",
                cel2: "",
                tipo_vinculo: "clube"
            })
            setIsCustomFuncao(false)
        }
        setIsModalOpen(true)
    }

    const handleSave = async () => {
        if (!formData.nome_completo || !formData.re) {
            toast.error("Nome e RE são obrigatórios")
            return
        }

        try {
            if (editingMember?.id) {
                await OpServiceV2.updateEquipe(editingMember.id, formData)
                toast.success("Profissional atualizado com sucesso!")
            } else {
                // mock de criação (precisaríamos de um metodo createEquipe no service)
                // Usando upsert se disponível ou apenas avisando
                toast.info("Função de criação de novo RE em homologação.")
            }
            setIsModalOpen(false)
            loadEquipe()
        } catch (error) {
            toast.error("Erro ao salvar profissional")
        }
    }

    const filteredEquipe = equipe.filter(m => 
        m.nome_completo.toLowerCase().includes(filtro.toLowerCase()) || 
        m.re.includes(filtro)
    )

    return (
        <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-700">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="relative w-full md:w-[400px] group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-hover:text-blue-500 transition-colors" />
                    <Input 
                        placeholder="Buscar por nome ou RE..." 
                        value={filtro}
                        onChange={(e) => setFiltro(e.target.value)}
                        className="h-14 pl-12 rounded-[24px] border-slate-200 bg-white/70 backdrop-blur-sm shadow-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-bold"
                    />
                </div>
                <Button 
                    onClick={() => handleOpenModal()}
                    className="h-14 px-8 rounded-[24px] bg-slate-900 hover:bg-slate-800 text-white font-black uppercase text-xs tracking-widest flex items-center gap-3 shadow-lg shadow-slate-200 active:scale-95 transition-all w-full md:w-auto"
                >
                    <UserPlus className="h-5 w-5" />
                    Cadastrar Profissional
                </Button>
            </div>

            <Card className="border-none shadow-2xl bg-white/80 backdrop-blur-md rounded-[40px] overflow-hidden border border-white/20 w-fit max-w-full lg:max-w-[1300px]">
                <CardHeader className="p-8 border-b bg-slate-50/50">
                    <CardTitle className="text-xl font-black text-slate-800 flex items-center gap-3">
                        <Users className="h-6 w-6 text-blue-600" />
                        Lista de Profissionais Ativos
                    </CardTitle>
                    <CardDescription className="text-slate-500 font-bold">Gerencie os dados mestres do seu efetivo operacional.</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-auto min-w-full lg:min-w-0">
                            <thead>
                                <tr className="bg-slate-50/80 border-b border-slate-100 italic">
                                    <th className="px-6 py-4 text-left text-[10px] font-black uppercase text-slate-400 tracking-widest min-w-[320px]">Ajudante / Profissional</th>
                                    <th className="px-6 py-4 text-left text-[10px] font-black uppercase text-slate-400 tracking-widest w-[200px]">Escala / Contato</th>
                                    <th className="px-6 py-4 text-left text-[10px] font-black uppercase text-slate-400 tracking-widest w-[140px]">Tipo</th>
                                    <th className="px-6 py-4 text-left text-[10px] font-black uppercase text-slate-400 tracking-widest w-[120px]">Status</th>
                                    <th className="px-6 py-4 text-right text-[10px] font-black uppercase text-slate-400 tracking-widest w-[100px]">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {loading ? (
                                    <tr><td colSpan={5} className="p-20 text-center"><div className="animate-spin h-8 w-8 border-b-2 border-blue-600 mx-auto rounded-full"/></td></tr>
                                ) : filteredEquipe.filter(m => (m.tipo_vinculo || 'clube') === 'clube').map(membro => (
                                    <tr key={membro.id} className="hover:bg-blue-50/30 transition-all group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-4">
                                                <div className="relative shrink-0">
                                                    {(() => {
                                                        const statusHoje = getTodayStatus(membro)
                                                        const bgColor = getStatusColor(statusHoje)
                                                        return (
                                                            <div className={`h-12 w-12 rounded-2xl flex items-center justify-center border border-slate-200 font-black shadow-sm transition-all ${bgColor} ${statusHoje === 'Folga' ? 'text-slate-300' : 'text-white'}`}>
                                                                {statusHoje === 'Trabalhando' && <CheckCircle2 className="h-6 w-6" />}
                                                                {statusHoje === 'Folga' && <Clock className="h-6 w-6 opacity-40" />}
                                                                {statusHoje === 'Falta' && <XCircle className="h-6 w-6" />}
                                                                {statusHoje === 'Atestado' && <AlertCircle className="h-6 w-6" />}
                                                                {statusHoje === 'Férias' && <Plane className="h-6 w-6" />}
                                                            </div>
                                                        )
                                                    })()}
                                                    {membro.possui_porte_arma && (
                                                        <div className="absolute -top-1 -right-1 h-5 w-5 bg-orange-500 rounded-full border-2 border-white flex items-center justify-center shadow-sm">
                                                            <Shield className="h-3 w-3 text-white" />
                                                        </div>
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="font-black text-slate-800 text-sm">{membro.nome_completo}</p>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                                        RE {membro.re} 
                                                        <span className="text-slate-200">|</span> 
                                                        <span className={`${membro.nivel === 1 ? 'text-rose-500' : membro.nivel === 2 ? 'text-orange-500' : 'text-emerald-500'}`}>NV {membro.nivel || 3}</span>
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-1">
                                                <Badge className="bg-slate-100 text-slate-600 hover:bg-slate-200 border-none font-black text-[10px] py-1 px-3 rounded-xl uppercase tracking-wider w-fit">
                                                    {membro.tipo_escala}
                                                </Badge>
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-2 text-[10px] font-bold text-slate-700">
                                                        <Smartphone className="h-3 w-3 text-blue-500" />
                                                        {membro.cel1 || '---'}
                                                    </div>
                                                    {membro.cel2 && (
                                                        <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400">
                                                            <Phone className="h-3 w-3" />
                                                            {membro.cel2}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                {membro.tipo_servico === 'VSPP' ? (
                                                    <Badge className="bg-orange-100 text-orange-600 border-none font-black text-[10px] py-1 px-3 rounded-xl uppercase flex items-center gap-1">
                                                        <Shield className="h-3 w-3" /> {membro.funcao || 'VSPP'}
                                                    </Badge>
                                                ) : (
                                                    <Badge className="bg-blue-100 text-blue-600 border-none font-black text-[10px] py-1 px-3 rounded-xl uppercase">
                                                        {membro.funcao || 'Vigilante'}
                                                    </Badge>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 text-emerald-600 font-black text-[10px] uppercase">
                                                <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-sm shadow-emerald-200" />
                                                Ativo
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <Button 
                                                variant="ghost" 
                                                size="icon" 
                                                onClick={() => handleOpenModal(membro)}
                                                className="h-10 w-10 rounded-xl hover:bg-blue-50 hover:text-blue-600 text-slate-400 transition-all"
                                            >
                                                <Edit3 className="h-4 w-4" />
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            <Card className="border-none shadow-xl bg-white/60 backdrop-blur-md rounded-[40px] overflow-hidden border border-white/20">
                <CardHeader className="p-8 border-b bg-slate-50/30">
                    <CardTitle className="text-xl font-black text-slate-700 flex items-center gap-3">
                        <Users className="h-6 w-6 text-orange-500" />
                        Profissionais Externos / Apoio Especializado
                    </CardTitle>
                    <CardDescription className="text-slate-500 font-bold">Terceiros, consultores ou apoio operacional fora do efetivo fixo.</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-auto min-w-full lg:min-w-0">
                            <thead>
                                <tr className="bg-slate-50/80 border-b border-slate-100 italic">
                                    <th className="px-6 py-4 text-left text-[10px] font-black uppercase text-slate-400 tracking-widest min-w-[320px]">Profissional Especialista</th>
                                    <th className="px-6 py-4 text-left text-[10px] font-black uppercase text-slate-400 tracking-widest w-[200px]">Contatos Rápidos</th>
                                    <th className="px-6 py-4 text-left text-[10px] font-black uppercase text-slate-400 tracking-widest w-[140px]">Tipo</th>
                                    <th className="px-6 py-4 text-left text-[10px] font-black uppercase text-slate-400 tracking-widest w-[120px]">Status</th>
                                    <th className="px-6 py-4 text-right text-[10px] font-black uppercase text-slate-400 tracking-widest w-[100px]">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {loading ? (
                                    <tr><td colSpan={5} className="p-10 text-center"><div className="animate-spin h-5 w-5 border-b-2 border-slate-400 mx-auto rounded-full"/></td></tr>
                                ) : filteredEquipe.filter(m => m.tipo_vinculo === 'externo').map(membro => (
                                    <tr key={membro.id} className="hover:bg-orange-50/30 transition-all group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-4">
                                                <div className="relative shrink-0">
                                                    {(() => {
                                                        const statusHoje = getTodayStatus(membro)
                                                        const bgColor = getStatusColor(statusHoje)
                                                        return (
                                                            <div className={`h-12 w-12 rounded-2xl flex items-center justify-center border border-orange-200 font-black shadow-sm transition-all ${bgColor} ${statusHoje === 'Folga' ? 'bg-orange-50/50 text-orange-200' : 'text-white'}`}>
                                                                {statusHoje === 'Trabalhando' && <CheckCircle2 className="h-6 w-6" />}
                                                                {statusHoje === 'Folga' && <Clock className="h-6 w-6 opacity-40" />}
                                                                {statusHoje === 'Falta' && <XCircle className="h-6 w-6" />}
                                                                {statusHoje === 'Atestado' && <AlertCircle className="h-6 w-6" />}
                                                                {statusHoje === 'Férias' && <Plane className="h-6 w-6" />}
                                                            </div>
                                                        )
                                                    })()}
                                                </div>
                                                <div>
                                                    <p className="font-black text-slate-800 text-sm">{membro.nome_completo}</p>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                                        CPF/REF: {membro.re} 
                                                        <span className="text-slate-200">|</span> 
                                                        <span className={`${membro.nivel === 1 ? 'text-rose-500' : membro.nivel === 2 ? 'text-orange-500' : 'text-emerald-500'}`}>NV {membro.nivel || 3}</span>
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center gap-2 text-[11px] font-black text-slate-700">
                                                    <Smartphone className="h-3.5 w-3.5 text-orange-500" />
                                                    {membro.cel1 || '---'}
                                                </div>
                                                {membro.cel2 && (
                                                    <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400">
                                                        <Phone className="h-3 w-3 text-slate-300" />
                                                        {membro.cel2}
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                                {membro.tipo_servico === 'VSPP' ? (
                                                    <Badge className="bg-orange-100 text-orange-600 border-none font-black text-[10px] py-1 px-3 rounded-xl uppercase flex items-center gap-1">
                                                        <Shield className="h-3 w-3" /> {membro.funcao || 'VSPP'}
                                                    </Badge>
                                                ) : (
                                                    <Badge className="bg-slate-900 text-white border-none font-black text-[10px] py-1 px-3 rounded-xl uppercase">
                                                        {membro.funcao || 'Externo'}
                                                    </Badge>
                                                )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 text-slate-400 font-black text-[10px] uppercase">
                                                <div className="w-2 h-2 rounded-full bg-slate-300" />
                                                Especialista
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <Button 
                                                variant="ghost" 
                                                size="icon" 
                                                onClick={() => handleOpenModal(membro)}
                                                className="h-10 w-10 rounded-xl hover:bg-orange-50 hover:text-orange-600 text-slate-400 transition-all"
                                            >
                                                <Edit3 className="h-4 w-4" />
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                                {filteredEquipe.filter(m => m.tipo_vinculo === 'externo').length === 0 && !loading && (
                                    <tr>
                                        <td colSpan={5} className="p-12 text-center text-slate-400 font-bold italic text-sm">Nenhum profissional externo cadastrado.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="sm:max-w-[500px] p-0 rounded-[40px] border-none shadow-2xl overflow-hidden bg-white/95 backdrop-blur-xl">
                    <div className="h-2 bg-slate-900" />
                    <DialogHeader className="p-10 pb-4">
                        <DialogTitle className="text-2xl font-black text-slate-900 flex items-center gap-3">
                            <div className="p-3 bg-slate-100 rounded-2xl">
                                <UserPlus className="h-6 w-6 text-slate-900" />
                            </div>
                            {editingMember ? 'Editar Cadastro' : 'Novo Cadastro'}
                        </DialogTitle>
                        <DialogDescription className="text-slate-500 font-bold">Complete as informações básicas do colaborador.</DialogDescription>
                    </DialogHeader>

                    <div className="px-10 py-6 space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Nome Completo</Label>
                                <Input 
                                    value={formData.nome_completo}
                                    onChange={(e) => setFormData({...formData, nome_completo: e.target.value})}
                                    className="h-12 rounded-2xl border-slate-200 bg-slate-50/50 focus:bg-white font-black text-sm transition-all"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">RE (Registro)</Label>
                                <Input 
                                    value={formData.re}
                                    onChange={(e) => setFormData({...formData, re: e.target.value})}
                                    className="h-12 rounded-2xl border-slate-200 bg-slate-50/50 focus:bg-white font-black text-sm transition-all"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Select value={formData.tipo_escala} onValueChange={(v) => setFormData({...formData, tipo_escala: v})}>
                                    <SelectTrigger className="h-12 rounded-2xl border-slate-200 font-black text-sm bg-slate-50/50">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-2xl">
                                        <SelectItem value="12x36">12x36</SelectItem>
                                        <SelectItem value="5x1">5x1</SelectItem>
                                        <SelectItem value="5x2">5x2</SelectItem>
                                        <SelectItem value="Externo">Escala Externa</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Tipo de Vínculo</Label>
                                <Select value={formData.tipo_vinculo || 'clube'} onValueChange={(v) => setFormData({...formData, tipo_vinculo: v as any})}>
                                    <SelectTrigger className="h-12 rounded-2xl border-slate-200 font-black text-sm bg-slate-50/50">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-2xl">
                                        <SelectItem value="clube">Efetivo Clube</SelectItem>
                                        <SelectItem value="externo">Apoio Externo</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Função (Cargo Visual)</Label>
                                    <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        onClick={() => setIsCustomFuncao(!isCustomFuncao)}
                                        className={`h-6 px-1.5 rounded-lg text-[9px] font-black transition-all ${isCustomFuncao ? 'bg-blue-600 text-white hover:bg-blue-700' : 'text-blue-600 hover:bg-blue-50'}`}
                                    >
                                        {isCustomFuncao ? <CheckCircle2 className="h-3 w-3 mr-1" /> : <Plus className="h-3 w-3 mr-1" />}
                                        {isCustomFuncao ? 'ESCOLHER DA LISTA' : 'ADICIONAR NOVA'}
                                    </Button>
                                </div>
                                {isCustomFuncao ? (
                                    <Input 
                                        value={formData.funcao}
                                        placeholder="Digite o cargo (ex: Técnico CFTV)..."
                                        onChange={(e) => setFormData({...formData, funcao: e.target.value})}
                                        className="h-12 rounded-2xl border-slate-200 bg-blue-50/30 focus:bg-white font-black text-sm transition-all animate-in fade-in slide-in-from-top-2"
                                    />
                                ) : (
                                    <Select value={formData.funcao} onValueChange={(v) => setFormData({...formData, funcao: v})}>
                                        <SelectTrigger className="h-12 rounded-2xl border-slate-200 font-black text-sm bg-slate-50/50">
                                            <SelectValue placeholder="Selecione o cargo" />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-2xl">
                                            {funcoesDisponiveis.map(f => (
                                                <SelectItem key={f} value={f}>{f}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest text-orange-600">Categoria (Regra Operacional)</Label>
                                <Select value={formData.tipo_servico} onValueChange={(v) => setFormData({...formData, tipo_servico: v})}>
                                    <SelectTrigger className="h-12 rounded-2xl border-slate-200 font-black text-sm bg-slate-50/50">
                                        <SelectValue placeholder="Selecione" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-2xl">
                                        <SelectItem value="Vigilante/Operacional">Vigilante / Operacional</SelectItem>
                                        <SelectItem value="VSPP">VSPP (Proteção Pessoal)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Celular 1 (Principal)</Label>
                                <Input 
                                    value={formData.cel1}
                                    placeholder="(00) 00000-0000"
                                    onChange={(e) => setFormData({...formData, cel1: e.target.value})}
                                    className="h-12 rounded-2xl border-slate-200 bg-slate-50/50 focus:bg-white font-black text-sm transition-all"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Celular 2 (Emergência)</Label>
                                <Input 
                                    value={formData.cel2}
                                    placeholder="(00) 00000-0000"
                                    onChange={(e) => setFormData({...formData, cel2: e.target.value})}
                                    className="h-12 rounded-2xl border-slate-200 bg-slate-50/50 focus:bg-white font-black text-sm transition-all"
                                />
                            </div>
                        </div>

                        <div className="space-y-3">
                            <Label className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Classificação de Nível</Label>
                            <div className="flex gap-2 p-1.5 bg-slate-100 rounded-[20px] border border-slate-200">
                                {[
                                    { id: 1, label: 'Nível 1', color: 'bg-rose-500' },
                                    { id: 2, label: 'Nível 2', color: 'bg-orange-500' },
                                    { id: 3, label: 'Nível 3', color: 'bg-emerald-500' }
                                ].map(nivel => (
                                    <div 
                                        key={nivel.id}
                                        onClick={() => setFormData({ ...formData, nivel: nivel.id })}
                                        className={`flex-1 py-3 flex items-center justify-center gap-2 rounded-[14px] cursor-pointer transition-all text-xs font-black uppercase tracking-tighter ${formData.nivel === nivel.id ? 'bg-white text-slate-900 shadow-md ring-1 ring-slate-200' : 'text-slate-400 hover:text-slate-600'}`}
                                    >
                                        <div className={`h-1.5 w-1.5 rounded-full ${nivel.color}`} />
                                        {nivel.label}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="p-10 pt-0">
                        <Button 
                            variant="ghost" 
                            onClick={() => setIsModalOpen(false)}
                            className="h-14 rounded-2xl font-black uppercase text-xs tracking-widest px-8 text-slate-400 hover:text-slate-600 transition-all"
                        >
                            Cancelar
                        </Button>
                        <Button 
                            onClick={handleSave}
                            className="h-14 rounded-2xl bg-slate-900 text-white font-black uppercase text-xs tracking-widest px-8 hover:bg-slate-800 transition-all shadow-lg active:scale-95"
                        >
                            <Save className="h-4 w-4 mr-2" />
                            Salvar Alterações
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
