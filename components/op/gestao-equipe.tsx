"use client"

import { useState, useEffect } from "react"
import { ShieldAlert, Plus, Search, Check, X, Edit, PhoneCall, ShieldCheck } from "lucide-react"
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

export default function GestaoEquipe() {
    const [equipe, setEquipe] = useState<OpEquipe[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")
    const [isDialogOpen, setIsDialogOpen] = useState(false)

    // Form state
    const [formData, setFormData] = useState<Partial<OpEquipe>>({
        nome_completo: "",
        re: "",
        funcao: "Vigilante",
        tipo_escala: "12x36",
        possui_porte_arma: false,
        possui_cnh: true,
        status_ativo: true,
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
            await OpService.adicionarMembroEquipe(formData as Omit<OpEquipe, "id">)
            setIsDialogOpen(false)
            setFormData({
                nome_completo: "",
                re: "",
                funcao: "Vigilante",
                tipo_escala: "12x36",
                possui_porte_arma: false,
                possui_cnh: true,
                status_ativo: true,
            })
            carregarEquipe()
        } catch (e) {
            alert("Erro ao salvar membro da equipe.")
        }
    }

    const filtarEquipe = equipe.filter((m) =>
        m.nome_completo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.re.includes(searchTerm) ||
        m.funcao.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const armadosCount = equipe.filter(e => e.possui_porte_arma).length;
    const cnhCount = equipe.filter(e => e.possui_cnh).length;

    return (
        <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
            {/* Header & Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="bg-gradient-to-br from-blue-50 to-white border-blue-100">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-slate-500">Total Equipe</p>
                            <h4 className="text-2xl font-bold text-slate-800">{equipe.length}</h4>
                        </div>
                        <div className="p-3 bg-blue-100 rounded-full text-blue-600">
                            <ShieldCheck className="w-6 h-6" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-indigo-50 to-white border-indigo-100">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-slate-500">Com Porte (VSPP)</p>
                            <h4 className="text-2xl font-bold text-slate-800">{armadosCount}</h4>
                        </div>
                        <div className="p-3 bg-indigo-100 rounded-full text-indigo-600">
                            <ShieldAlert className="w-6 h-6" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-emerald-50 to-white border-emerald-100">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-slate-500">Motoristas (CNH)</p>
                            <h4 className="text-2xl font-bold text-slate-800">{cnhCount}</h4>
                        </div>
                        <div className="p-3 bg-emerald-100 rounded-full text-emerald-600">
                            <Check className="w-6 h-6" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="flex flex-col sm:flex-row justify-between gap-4 items-center bg-white p-4 rounded-xl border shadow-sm">
                <div className="relative w-full sm:w-96">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <Input
                        placeholder="Buscar por nome, RE ou função..."
                        className="pl-9 h-10 bg-slate-50"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto h-10 px-6">
                            <Plus className="w-4 h-4 mr-2" />
                            Novo Membro
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[500px]">
                        <DialogHeader>
                            <DialogTitle>Adicionar Membro à Equipe</DialogTitle>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="nome" className="text-right">Nome</Label>
                                <Input id="nome" className="col-span-3" value={formData.nome_completo} onChange={(e) => setFormData({ ...formData, nome_completo: e.target.value })} placeholder="Ex: Acilônio Ribeiro" />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="re" className="text-right">RE</Label>
                                <Input id="re" className="col-span-3" value={formData.re} onChange={(e) => setFormData({ ...formData, re: e.target.value })} placeholder="Registro na empresa" />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label className="text-right">Função</Label>
                                <Select value={formData.funcao} onValueChange={(v) => setFormData({ ...formData, funcao: v })}>
                                    <SelectTrigger className="col-span-3">
                                        <SelectValue placeholder="Selecione a função" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="VSPP Coordenador">VSPP Coordenador</SelectItem>
                                        <SelectItem value="VSPP Inspetor">VSPP Inspetor</SelectItem>
                                        <SelectItem value="VSPP">VSPP</SelectItem>
                                        <SelectItem value="Op. Monitoramento">Op. Monitoramento</SelectItem>
                                        <SelectItem value="Vigilante">Vigilante</SelectItem>
                                        <SelectItem value="Técnico CFTV">Técnico CFTV</SelectItem>
                                        <SelectItem value="Assistente Administrativo">Assistente Administrativo</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label className="text-right">Escala</Label>
                                <Select value={formData.tipo_escala} onValueChange={(v) => setFormData({ ...formData, tipo_escala: v })}>
                                    <SelectTrigger className="col-span-3">
                                        <SelectValue placeholder="Selecione a escala base" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="12x36">12x36</SelectItem>
                                        <SelectItem value="5x1">5x1</SelectItem>
                                        <SelectItem value="5x2">5x2</SelectItem>
                                        <SelectItem value="Administrativo">Administrativo</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4 mt-2">
                                <Label className="text-right">Qualificações</Label>
                                <div className="col-span-3 flex gap-6">
                                    <div className="flex items-center space-x-2">
                                        <Switch
                                            id="porte"
                                            checked={formData.possui_porte_arma}
                                            onCheckedChange={(c) => setFormData({ ...formData, possui_porte_arma: c })}
                                        />
                                        <Label htmlFor="porte" className="cursor-pointer">Porte Armada</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Switch
                                            id="cnh"
                                            checked={formData.possui_cnh}
                                            onCheckedChange={(c) => setFormData({ ...formData, possui_cnh: c })}
                                        />
                                        <Label htmlFor="cnh" className="cursor-pointer">Motorista (CNH)</Label>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                            <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700">Salvar Membro</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Lista Real Data */}
            {loading ? (
                <div className="text-center py-10">Carregando equipe...</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filtarEquipe.map((membro) => (
                        <Card key={membro.id} className="overflow-hidden border-slate-200 hover:shadow-md transition-shadow">
                            <div className="h-2 bg-slate-800 w-full" />
                            <CardContent className="p-5">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h3 className="font-bold text-slate-800 text-lg truncate" title={membro.nome_completo}>
                                            {membro.nome_completo}
                                        </h3>
                                        <p className="text-sm text-slate-500 font-mono">RE: {membro.re}</p>
                                    </div>
                                    <div className={`px-2 py-1 rounded-md text-xs font-medium border ${membro.status_ativo ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                                        {membro.status_ativo ? 'Ativo' : 'Inativo'}
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <div className="flex items-center gap-2 text-sm text-slate-600">
                                        <ShieldCheck className="w-4 h-4 text-slate-400" />
                                        <span className="font-medium">{membro.funcao}</span>
                                        <span className="mx-1 text-slate-300">•</span>
                                        <span>{membro.tipo_escala}</span>
                                    </div>

                                    {/* Badges de Qualificação */}
                                    <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
                                        {membro.possui_porte_arma ? (
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-100">
                                                <span className="w-1.5 h-1.5 rounded-full bg-red-600"></span>
                                                Armado
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                                                Desarmado
                                            </span>
                                        )}

                                        {membro.possui_cnh && (
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100">
                                                <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
                                                Motorista
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                    {filtarEquipe.length === 0 && (
                        <div className="col-span-full text-center py-10 text-slate-500 bg-slate-50 rounded-lg border border-dashed">
                            Nenhum membro encontrado na equipe.
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
