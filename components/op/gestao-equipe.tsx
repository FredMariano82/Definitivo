"use client"
import React, { useState, useEffect } from "react"

import {
    ShieldAlert,
    Users,
    CalendarClock,
    Plus,
    Search,
    Check,
    X,
    Edit,
    PhoneCall,
    ShieldCheck,
    ArrowRight,
    UserCircle2
} from "lucide-react"
import { OpService, OpEquipe } from "@/services/op-service"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { format, isAfter, isBefore, addDays, differenceInDays, startOfMonth, endOfMonth, eachDayOfInterval } from "date-fns"
import { ptBR } from "date-fns/locale"

export default function GestaoEquipe() {
    const [equipe, setEquipe] = useState<OpEquipe[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [editingMemberId, setEditingMemberId] = useState<string | null>(null)

    const [formData, setFormData] = useState<Partial<OpEquipe>>({
        nome_completo: "",
        re: "",
        funcao: "Vigilante",
        tipo_escala: "12x36",
        possui_porte_arma: false,
        possui_cnh: true,
        status_ativo: true,
        data_reciclagem: "",
        data_inicio_ferias: "",
        data_fim_ferias: "",
        referencia_escala: format(new Date(), 'yyyy-MM-dd'),
    })

    useEffect(() => {
        carregarEquipe()
    }, [])

    const carregarEquipe = async () => {
        setLoading(true)
        const dados = await OpService.getEquipe()
        setEquipe(dados)
        setLoading(false)
    }

    const handleSave = async () => {
        if (!formData.nome_completo || !formData.re) {
            alert("Preencha o Nome e o RE.")
            return
        }

        try {
            if (editingMemberId) {
                await OpService.atualizarMembroEquipe(editingMemberId, formData)
            } else {
                await OpService.adicionarMembroEquipe(formData as Omit<OpEquipe, "id">)
            }
            
            setIsDialogOpen(false)
            setEditingMemberId(null)
            setFormData({
                nome_completo: "",
                re: "",
                funcao: "Vigilante",
                tipo_escala: "12x36",
                possui_porte_arma: false,
                possui_cnh: true,
                status_ativo: true,
                data_reciclagem: "",
                data_inicio_ferias: "",
                data_fim_ferias: "",
                referencia_escala: format(new Date(), 'yyyy-MM-dd'),
            })
            await carregarEquipe()
            alert(editingMemberId ? "Colaborador atualizado com sucesso!" : "Colaborador cadastrado com sucesso!")
        } catch (e) {
            console.error("Erro ao salvar:", e)
            alert("Erro ao salvar membro da equipe. Verifique o console para mais detalhes.")
        }
    }

    const handleEdit = (membro: OpEquipe) => {
        setEditingMemberId(membro.id)
        setFormData({
            nome_completo: membro.nome_completo,
            re: membro.re,
            funcao: membro.funcao,
            tipo_escala: membro.tipo_escala,
            possui_porte_arma: membro.possui_porte_arma,
            possui_cnh: membro.possui_cnh,
            status_ativo: membro.status_ativo,
            data_reciclagem: membro.data_reciclagem || "",
            data_inicio_ferias: membro.data_inicio_ferias || "",
            data_fim_ferias: membro.data_fim_ferias || "",
            referencia_escala: membro.referencia_escala || format(new Date(), 'yyyy-MM-dd'),
        })
        setIsDialogOpen(true)
    }

    const filtarEquipe = equipe
        .filter((m) =>
            m.nome_completo.toLowerCase().includes(searchTerm.toLowerCase()) ||
            m.re.includes(searchTerm) ||
            m.funcao.toLowerCase().includes(searchTerm.toLowerCase())
        )
        .sort((a, b) => {
            // Primeiro agrupa por tipo de escala (12x36 antes de 5x1 ou vice-versa, vici dita)
            if (a.tipo_escala !== b.tipo_escala) {
                return a.tipo_escala.localeCompare(b.tipo_escala)
            }
            return a.nome_completo.localeCompare(b.nome_completo)
        })

    const armadosCount = equipe.filter(e => e.possui_porte_arma).length;
    const cnhCount = equipe.filter(e => e.possui_cnh).length;

    return (
        <div className="space-y-6 animate-in fade-in duration-700">
            <Tabs defaultValue="dashboard" className="w-full">
                <div className="flex justify-between items-center mb-6">
                    <TabsList className="bg-slate-100/50 p-1 border">
                        <TabsTrigger value="dashboard" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">Dashboard</TabsTrigger>
                        <TabsTrigger value="equipe" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">Equipe</TabsTrigger>
                        <TabsTrigger value="calendario" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">Calendário de Escala</TabsTrigger>
                    </TabsList>

                    <div className="flex gap-3">
                        <div className="relative hidden sm:block">
                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                            <Input
                                placeholder="Buscar colaborador..."
                                className="pl-9 h-9 w-64 bg-white border-slate-200"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                            <DialogTrigger asChild>
                                <Button className="bg-slate-900 hover:bg-slate-800 text-white shadow-lg shadow-slate-200">
                                    <Plus className="w-4 h-4 mr-2" />
                                    Novo Membro
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[600px] border-none shadow-2xl">
                                <DialogHeader>
                                    <DialogTitle className="text-2xl font-bold text-slate-800">
                                        {editingMemberId ? 'Editar Colaborador' : 'Novo Colaborador'}
                                    </DialogTitle>
                                </DialogHeader>
                                <div className="grid grid-cols-2 gap-6 py-4">
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="nome">Nome Completo</Label>
                                            <Input id="nome" value={formData.nome_completo} onChange={(e) => setFormData({ ...formData, nome_completo: e.target.value })} placeholder="Ex: Acilônio Ribeiro" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="re">RE (Registro)</Label>
                                            <Input id="re" value={formData.re} onChange={(e) => setFormData({ ...formData, re: e.target.value })} placeholder="Número do registro" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Função</Label>
                                            <Select value={formData.funcao} onValueChange={(v) => setFormData({ ...formData, funcao: v })}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Selecione..." />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="VSPP Coordenador">VSPP Coordenador</SelectItem>
                                                    <SelectItem value="VSPP Inspetor">VSPP Inspetor</SelectItem>
                                                    <SelectItem value="VSPP">VSPP</SelectItem>
                                                    <SelectItem value="Op. Monitoramento">Op. Monitoramento</SelectItem>
                                                    <SelectItem value="Vigilante">Vigilante</SelectItem>
                                                    <SelectItem value="Técnico CFTV">Técnico CFTV</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <Label>Tipo de Escala</Label>
                                            <Select value={formData.tipo_escala} onValueChange={(v) => setFormData({ ...formData, tipo_escala: v })}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Selecione..." />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="12x36">12x36 Par/Ímpar</SelectItem>
                                                    <SelectItem value="5x1">5x1 Rotação</SelectItem>
                                                    <SelectItem value="5x2">5x2 Comercial</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="reciclagem">Data da Próxima Reciclagem</Label>
                                            <Input id="reciclagem" type="date" value={formData.data_reciclagem} onChange={(e) => setFormData({ ...formData, data_reciclagem: e.target.value })} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="referencia">Referência de Escala (Início)</Label>
                                            <Input id="referencia" type="date" value={formData.referencia_escala} onChange={(e) => setFormData({ ...formData, referencia_escala: e.target.value })} />
                                        </div>
                                        <div className="pt-2 space-y-3">
                                            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                                                <Label htmlFor="porte" className="cursor-pointer">Porte de Arma</Label>
                                                <Switch id="porte" checked={formData.possui_porte_arma} onCheckedChange={(c) => setFormData({ ...formData, possui_porte_arma: c })} />
                                            </div>
                                            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                                                <Label htmlFor="cnh" className="cursor-pointer">Motorista (CNH)</Label>
                                                <Switch id="cnh" checked={formData.possui_cnh} onCheckedChange={(c) => setFormData({ ...formData, possui_cnh: c })} />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                                    <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700">Salvar Colaborador</Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>

                <TabsContent value="dashboard" className="space-y-6">
                    {/* Glassmorphism Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div className="group relative overflow-hidden p-6 rounded-3xl bg-white border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-500">
                            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform">
                                <Users className="w-24 h-24" />
                            </div>
                            <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Total Efetivo</p>
                            <h3 className="text-4xl font-extrabold text-slate-900 mt-2">{equipe.length}</h3>
                            <div className="mt-4 flex items-center gap-2">
                                <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                <span className="text-xs font-medium text-emerald-600">Operação 100% Ativa</span>
                            </div>
                        </div>

                        <div className="group relative overflow-hidden p-6 rounded-3xl bg-gradient-to-br from-indigo-600 to-blue-700 text-white shadow-lg shadow-blue-200">
                            <div className="absolute top-0 right-0 p-8 opacity-10">
                                <ShieldAlert className="w-24 h-24" />
                            </div>
                            <p className="text-sm font-semibold opacity-80 uppercase tracking-wider">Equipe Armada</p>
                            <h3 className="text-4xl font-extrabold mt-2">{armadosCount}</h3>
                            <p className="mt-4 text-xs font-medium opacity-90">Qualificados para VSPP</p>
                        </div>

                        <div className="group relative overflow-hidden p-6 rounded-3xl bg-white border border-slate-100 shadow-sm">
                            <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Reciclagem Pendente</p>
                            <h3 className="text-4xl font-extrabold text-red-600 mt-2">
                                {equipe.filter(e => e.data_reciclagem && isBefore(new Date(e.data_reciclagem), addDays(new Date(), 30))).length}
                            </h3>
                            <div className="mt-4 flex flex-wrap gap-1">
                                <Badge variant="destructive" className="bg-red-50 text-red-600 border-red-100 text-[10px]">Atenção Crítica</Badge>
                            </div>
                        </div>

                        <div className="group relative overflow-hidden p-6 rounded-3xl bg-white border border-slate-100 shadow-sm">
                            <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Em Férias/Afastados</p>
                            <h3 className="text-4xl font-extrabold text-amber-600 mt-2">0</h3>
                            <p className="mt-4 text-xs font-medium text-amber-600">Ver Calendário &rarr;</p>
                        </div>
                    </div>

                    {/* Alerts and Insights */}
                    <Card className="border-l-4 border-l-red-500 bg-red-50/30">
                        <CardHeader className="py-4">
                            <div className="flex items-center gap-3">
                                <ShieldAlert className="w-5 h-5 text-red-600" />
                                <CardTitle className="text-base text-red-900">Alertas Operacionais</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent className="pb-4">
                            <p className="text-sm text-red-800 opacity-80">Existem 3 colaboradores com reciclagem vencendo este mês. Regularize para manter o posto em conformidade.</p>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="equipe">
                    {loading ? (
                        <div className="flex flex-col justify-center items-center py-20 gap-4">
                            <div className="h-10 w-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                            <p className="text-slate-500 font-medium">Sincronizando dados da equipe...</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {filtarEquipe.map((membro) => {
                                const isReciclagemClose = membro.data_reciclagem && isBefore(new Date(membro.data_reciclagem), addDays(new Date(), 30));
                                const isReciclagemExpired = membro.data_reciclagem && isBefore(new Date(membro.data_reciclagem), new Date());

                                return (
                                    <div key={membro.id} className="group relative bg-white border border-slate-100 rounded-3xl p-5 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="h-12 w-12 rounded-2xl bg-slate-50 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                                <Users className="w-6 h-6" />
                                            </div>
                                            <Badge className={membro.status_ativo ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-slate-100 text-slate-500 border-slate-200"}>
                                                {membro.status_ativo ? "Ativo" : "Inativo"}
                                            </Badge>
                                        </div>

                                        <div className="space-y-1">
                                            <h4 className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors uppercase tracking-tight">{membro.nome_completo}</h4>
                                            <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
                                                <span>RE: {membro.re}</span>
                                                <span className="h-1 w-1 rounded-full bg-slate-300"></span>
                                                <span className="text-blue-600 font-bold">{membro.tipo_escala}</span>
                                            </div>
                                            {membro.referencia_escala && (
                                                <p className="text-[10px] text-slate-400 font-medium italic">
                                                    Ref: {format(new Date(membro.referencia_escala), 'dd/MM/yyyy')}
                                                </p>
                                            )}
                                        </div>

                                        <div className="mt-6 flex flex-wrap gap-2">
                                            {membro.possui_porte_arma && (
                                                <Badge variant="outline" className="rounded-lg bg-red-50/50 text-red-700 border-red-100 gap-1 capitalize">
                                                    <ShieldAlert className="w-3 h-3" /> Armado
                                                </Badge>
                                            )}
                                            {membro.possui_cnh && (
                                                <Badge variant="outline" className="rounded-lg bg-blue-50/50 text-blue-700 border-blue-100 gap-1 capitalize">
                                                    Motorista
                                                </Badge>
                                            )}
                                        </div>

                                        <div className={`mt-6 pt-4 border-t ${isReciclagemExpired ? 'bg-red-50/50 -mx-5 -mb-5 px-5 pb-5 rounded-b-3xl' : 'border-slate-50'}`}>
                                            <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                                                <span>Reciclagem</span>
                                                {isReciclagemExpired && <span className="text-red-600">Vencida</span>}
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className={`text-sm font-bold ${isReciclagemExpired ? 'text-red-700' : isReciclagemClose ? 'text-amber-600' : 'text-slate-700'}`}>
                                                    {membro.data_reciclagem ? format(new Date(membro.data_reciclagem), 'dd/MM/yyyy') : 'Não informada'}
                                                </span>
                                                <Button size="sm" variant="ghost" className="h-8 w-8 p-0 rounded-full hover:bg-slate-100" onClick={() => handleEdit(membro)}>
                                                    <Edit className="w-3.5 h-3.5" />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="calendario" className="animate-in fade-in zoom-in-95 duration-500">
                    <div className="space-y-6">
                        {/* Upper Legend and Controls */}
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
                            <div className="flex flex-wrap gap-4">
                                <div className="flex items-center gap-2">
                                    <div className="h-3 w-3 rounded-full bg-blue-600"></div>
                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Trabalho</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="h-3 w-3 rounded-full bg-slate-100 border border-slate-200"></div>
                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Folga</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="h-3 w-3 rounded-full bg-amber-500"></div>
                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Férias</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="h-3 w-3 rounded-full bg-red-500"></div>
                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Falta/Atestado</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <Button variant="outline" size="sm" className="rounded-xl h-9 px-4 text-xs font-bold border-slate-200">Mês Anterior</Button>
                                <div className="px-4 py-2 bg-slate-50 rounded-xl border border-slate-100 text-xs font-black text-slate-700 uppercase tracking-tight">
                                    Março 2024
                                </div>
                                <Button variant="outline" size="sm" className="rounded-xl h-9 px-4 text-xs font-bold border-slate-200">Próximo Mês</Button>
                            </div>
                        </div>

                        {/* Main Calendar Grid */}
                        <Card className="rounded-[2.5rem] border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden bg-white">
                            <div className="overflow-x-auto">
                                <table className="w-full border-collapse">
                                    <thead>
                                        <tr className="bg-slate-50/50 border-b border-slate-100">
                                            <th className="text-left py-5 px-8 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 w-[320px] sticky left-0 bg-slate-50/95 backdrop-blur-sm z-10">
                                                Colaborador
                                            </th>
                                            {eachDayOfInterval({ 
                                                start: startOfMonth(new Date()), 
                                                end: endOfMonth(new Date()) 
                                            }).map((day, i) => (
                                                <th key={i} className={`text-center w-10 min-w-[40px] py-4 text-[9px] font-black border-l border-slate-100/30
                                                    ${format(day, 'E', { locale: ptBR }).startsWith('s') ? 'bg-amber-50/30 text-amber-600' : 'text-slate-400'}
                                                `}>
                                                    <div className="flex flex-col items-center">
                                                        <span>{format(day, 'E', { locale: ptBR }).charAt(0).toUpperCase()}</span>
                                                        <span className="text-[11px] text-slate-600 mt-1">{format(day, 'd')}</span>
                                                    </div>
                                                </th>
                                            ))}
                                            <th className="w-16"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {['12x36', '5x1', '5x2'].map(grupo => {
                                            const membrosNoGrupo = filtarEquipe.filter(m => m.tipo_escala === grupo);
                                            if (membrosNoGrupo.length === 0) return null;
                                            
                                            return (
                                                <React.Fragment key={grupo}>
                                                    <tr className="bg-slate-50/80">
                                                        <td colSpan={33} className="py-2 px-8 text-[10px] font-black text-slate-500 uppercase tracking-widest border-y border-slate-100/50">
                                                            Escala {grupo} 
                                                            <span className="ml-2 px-2 py-0.5 bg-white rounded-full border border-slate-200 lowercase font-bold opacity-60">
                                                                {membrosNoGrupo.length} {membrosNoGrupo.length === 1 ? 'membro' : 'membros'}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                    {membrosNoGrupo.map((m) => {
                                                        return (
                                                            <tr key={m.id} className="hover:bg-blue-50/30 transition-colors group">
                                                                <td className="py-3 px-8 sticky left-0 bg-white group-hover:bg-blue-50/30 transition-colors z-10 border-r border-slate-50 shadow-[4px_0_8px_-4px_rgba(0,0,0,0.05)]">
                                                                    <div className="flex items-center gap-3">
                                                                        <div className="h-8 w-8 rounded-xl bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-500 border border-slate-200">
                                                                            {m.nome_completo.charAt(0)}
                                                                        </div>
                                                                        <div className="flex flex-col min-w-0">
                                                                            <span className="text-[12px] font-bold text-slate-800 uppercase tracking-tight truncate w-[240px]">
                                                                                {m.nome_completo}
                                                                            </span>
                                                                            <span className="text-[9px] font-bold text-blue-600/70 font-mono">
                                                                                RE {m.re || '---'}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                </td>
                                                                {eachDayOfInterval({ 
                                                                    start: startOfMonth(new Date()), 
                                                                    end: endOfMonth(new Date()) 
                                                                }).map((day, i) => {
                                                                    const refDate = m.referencia_escala ? new Date(m.referencia_escala) : new Date();
                                                                    const diffDays = differenceInDays(day, refDate);
                                                                    
                                                                    let isWorkDay = false;
                                                                    if (m.tipo_escala === '12x36') {
                                                                        isWorkDay = diffDays % 2 === 0;
                                                                    } else if (m.tipo_escala === '5x1') {
                                                                        isWorkDay = diffDays % 6 < 5;
                                                                    } else if (m.tipo_escala === '5x2') {
                                                                        const dweek = day.getDay();
                                                                        isWorkDay = dweek !== 0 && dweek !== 6;
                                                                    }

                                                                    // Check if on vacation
                                                                    const isOnVacation = m.data_inicio_ferias && m.data_fim_ferias && 
                                                                        !isBefore(day, new Date(m.data_inicio_ferias)) && 
                                                                        !isAfter(day, new Date(m.data_fim_ferias));

                                                                    return (
                                                                        <td key={i} className="p-0.5 border-l border-slate-50/50">
                                                                            <div className={`h-9 w-full rounded-lg transition-all duration-300 flex items-center justify-center text-[10px] font-black
                                                                                ${isOnVacation ? 'bg-amber-500 text-white shadow-lg shadow-amber-200 scale-90' : 
                                                                                  isWorkDay ? 'bg-blue-600 text-white shadow-lg shadow-blue-200/50 scale-[0.85]' : 
                                                                                  'text-slate-100'}
                                                                            `}>
                                                                                {isOnVacation ? 'F' : isWorkDay ? 'T' : ''}
                                                                            </div>
                                                                        </td>
                                                                    )
                                                                })}
                                                                <td className="py-2 px-4 text-center">
                                                                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0 rounded-full hover:bg-white hover:shadow-md text-slate-400 hover:text-blue-600" onClick={() => handleEdit(m)}>
                                                                        <Edit className="w-3.5 h-3.5" />
                                                                    </Button>
                                                                </td>
                                                            </tr>
                                                        )
                                                    })}
                                                </React.Fragment>
                                            )
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </Card>

                        {/* Informational Footer */}
                        <div className="flex items-center gap-4 p-6 bg-blue-50/50 rounded-3xl border border-blue-100/50">
                            <div className="p-3 bg-white rounded-2xl shadow-sm">
                                <CalendarClock className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                                <h4 className="text-sm font-bold text-blue-900">Inteligência de Escala</h4>
                                <p className="text-[11px] text-blue-800 opacity-70 leading-relaxed max-w-2xl">
                                    O sistema calcula automaticamente os dias de trabalho baseados na data de referência. 
                                    Para ajustar exceções (Faltas, Afastamentos ou Férias), clique no ícone de edição ao lado do nome do colaborador.
                                </p>
                            </div>
                        </div>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    )
}
