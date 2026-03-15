"use client"

import { useState, useEffect } from "react"
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
    CheckCircle2
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { OpServiceV2, OpEquipe } from "@/services/op-service-v2"
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
    const [loading, setLoading] = useState(true)
    const [filtro, setFiltro] = useState("")
    
    // Modal de Cadastro/Edição
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingMember, setEditingMember] = useState<Partial<OpEquipe> | null>(null)
    const [formData, setFormData] = useState<Partial<OpEquipe>>({
        nome_completo: "",
        re: "",
        funcao: "Vigilante",
        tipo_escala: "12x36",
        tipo_servico: "Vigilante/Operacional",
        status_ativo: true,
        possui_porte_arma: false,
        possui_cnh: false
    })

    useEffect(() => {
        loadEquipe()
    }, [])

    const loadEquipe = async () => {
        setLoading(true)
        try {
            const data = await OpServiceV2.getEquipe()
            setEquipe(data)
        } catch (error) {
            console.error("Erro ao carregar equipe:", error)
        } finally {
            setLoading(false)
        }
    }

    const handleOpenModal = (member: OpEquipe | null = null) => {
        if (member) {
            setEditingMember(member)
            setFormData(member)
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
                referencia_escala: new Date().toISOString().split('T')[0]
            })
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

            <Card className="border-none shadow-2xl bg-white/80 backdrop-blur-md rounded-[40px] overflow-hidden border border-white/20">
                <CardHeader className="p-8 border-b bg-slate-50/50">
                    <CardTitle className="text-xl font-black text-slate-800 flex items-center gap-3">
                        <Users className="h-6 w-6 text-blue-600" />
                        Lista de Profissionais Ativos
                    </CardTitle>
                    <CardDescription className="text-slate-500 font-bold">Gerencie os dados mestres do seu efetivo operacional.</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-slate-50/80 border-b border-slate-100">
                                    <th className="p-6 text-left text-[10px] font-black uppercase text-slate-400 tracking-widest">Profissional</th>
                                    <th className="p-6 text-left text-[10px] font-black uppercase text-slate-400 tracking-widest">Escala</th>
                                    <th className="p-6 text-left text-[10px] font-black uppercase text-slate-400 tracking-widest">Tipo</th>
                                    <th className="p-6 text-left text-[10px] font-black uppercase text-slate-400 tracking-widest">Status</th>
                                    <th className="p-6 text-right text-[10px] font-black uppercase text-slate-400 tracking-widest">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {loading ? (
                                    <tr><td colSpan={5} className="p-20 text-center"><div className="animate-spin h-8 w-8 border-b-2 border-blue-600 mx-auto rounded-full"/></td></tr>
                                ) : filteredEquipe.map(m => (
                                    <tr key={m.id} className="hover:bg-blue-50/30 transition-all group">
                                        <td className="p-6">
                                            <div className="flex items-center gap-4">
                                                <div className="h-12 w-12 rounded-2xl bg-slate-100 flex items-center justify-center font-black text-slate-500 group-hover:bg-white group-hover:text-blue-600 transition-all shadow-sm">
                                                    {m.nome_completo.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="font-black text-slate-800 text-sm">{m.nome_completo}</p>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">RE {m.re}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-6">
                                            <Badge className="bg-slate-100 text-slate-600 hover:bg-slate-200 border-none font-black text-[10px] py-1 px-3 rounded-xl uppercase tracking-wider">
                                                {m.tipo_escala}
                                            </Badge>
                                        </td>
                                        <td className="p-6">
                                            <div className="flex items-center gap-2">
                                                {m.tipo_servico === 'VSPP' ? (
                                                    <Badge className="bg-orange-100 text-orange-600 border-none font-black text-[10px] py-1 px-3 rounded-xl uppercase flex items-center gap-1">
                                                        <Shield className="h-3 w-3" /> VSPP
                                                    </Badge>
                                                ) : (
                                                    <Badge className="bg-blue-100 text-blue-600 border-none font-black text-[10px] py-1 px-3 rounded-xl uppercase">
                                                        Vigilante
                                                    </Badge>
                                                )}
                                            </div>
                                        </td>
                                        <td className="p-6">
                                            <div className="flex items-center gap-2 text-emerald-600 font-black text-[10px] uppercase">
                                                <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-sm shadow-emerald-200" />
                                                Ativo
                                            </div>
                                        </td>
                                        <td className="p-6 text-right">
                                            <Button 
                                                variant="ghost" 
                                                size="icon" 
                                                onClick={() => handleOpenModal(m)}
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
                                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Tipo de Escala</Label>
                                <Select value={formData.tipo_escala} onValueChange={(v) => setFormData({...formData, tipo_escala: v})}>
                                    <SelectTrigger className="h-12 rounded-2xl border-slate-200 font-black text-sm bg-slate-50/50">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-2xl">
                                        <SelectItem value="12x36">12x36</SelectItem>
                                        <SelectItem value="5x1">5x1</SelectItem>
                                        <SelectItem value="5x2">5x2</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Função / Serviço</Label>
                                <Select value={formData.tipo_servico} onValueChange={(v) => setFormData({...formData, tipo_servico: v})}>
                                    <SelectTrigger className="h-12 rounded-2xl border-slate-200 font-black text-sm bg-slate-50/50">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-2xl">
                                        <SelectItem value="Vigilante/Operacional">Vigilante Comum</SelectItem>
                                        <SelectItem value="VSPP">VSPP (Armado)</SelectItem>
                                    </SelectContent>
                                </Select>
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
