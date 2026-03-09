"use client"

import { useState, useEffect } from "react"
import { MapPin, Plus, AlertTriangle, ShieldAlert, BadgeCheck } from "lucide-react"
import { OpService, OpPosto } from "@/services/op-service"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

export default function GestaoPostos() {
    const [postos, setPostos] = useState<OpPosto[]>([])
    const [loading, setLoading] = useState(true)
    const [isDialogOpen, setIsDialogOpen] = useState(false)

    const [formData, setFormData] = useState<Partial<OpPosto>>({
        nome_posto: "",
        exige_armamento: false,
        exige_cnh: false,
        nivel_criticidade: 3,
    })

    useEffect(() => {
        carregarPostos()
    }, [])

    const carregarPostos = async () => {
        setLoading(true)
        const dados = await OpService.getPostos()
        setPostos(dados)
        setLoading(false)
    }

    const handleSave = async () => {
        if (!formData.nome_posto) {
            alert("Preencha o nome do posto.")
            return
        }

        try {
            await OpService.adicionarPosto(formData as Omit<OpPosto, "id">)
            setIsDialogOpen(false)
            setFormData({
                nome_posto: "",
                exige_armamento: false,
                exige_cnh: false,
                nivel_criticidade: 3,
            })
            carregarPostos()
        } catch (e) {
            alert("Erro ao salvar o posto.")
        }
    }

    const getCriticidadeBadge = (nivel: number) => {
        switch (nivel) {
            case 1:
                return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700 border border-red-200 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Nível 1 - Crítico</span>
            case 2:
                return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700 border border-amber-200">Nível 2 - Importante</span>
            case 3:
            default:
                return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">Nível 3 - Flexível</span>
        }
    }

    return (
        <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-between items-center bg-white p-4 rounded-xl border shadow-sm">
                <div>
                    <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        <MapPin className="text-blue-600" />
                        Mapeamento de Postos
                    </h2>
                    <p className="text-sm text-slate-500">Gerencie as regras de qualificação exigidas em cada local.</p>
                </div>

                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-blue-600 hover:bg-blue-700 h-10 px-6">
                            <Plus className="w-4 h-4 mr-2" />
                            Novo Posto
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[500px]">
                        <DialogHeader>
                            <DialogTitle>Adicionar Posto de Trabalho</DialogTitle>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="nome" className="text-right">Nome</Label>
                                <Input id="nome" className="col-span-3" value={formData.nome_posto} onChange={(e) => setFormData({ ...formData, nome_posto: e.target.value })} placeholder="Ex: Portaria Principal" />
                            </div>

                            <div className="grid grid-cols-4 items-center gap-4 mt-2">
                                <Label className="text-right">Criticidade</Label>
                                <Select value={formData.nivel_criticidade?.toString()} onValueChange={(v) => setFormData({ ...formData, nivel_criticidade: parseInt(v) })}>
                                    <SelectTrigger className="col-span-3">
                                        <SelectValue placeholder="Selecione o nível" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="1">Nível 1 (Crítico/Inviolável)</SelectItem>
                                        <SelectItem value="2">Nível 2 (Importante)</SelectItem>
                                        <SelectItem value="3">Nível 3 (Flexível)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid grid-cols-4 items-center gap-4 mt-4">
                                <Label className="text-right text-sm text-slate-500">Exigências Base (Hard Skills)</Label>
                                <div className="col-span-3 flex flex-col gap-4 bg-slate-50 p-4 rounded-lg border">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <Label htmlFor="req_porte" className="cursor-pointer font-bold text-slate-700">Armamento (VSPP)</Label>
                                            <p className="text-xs text-slate-500">Posto exige vigilante armado.</p>
                                        </div>
                                        <Switch
                                            id="req_porte"
                                            checked={formData.exige_armamento}
                                            onCheckedChange={(c) => setFormData({ ...formData, exige_armamento: c })}
                                        />
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <Label htmlFor="req_cnh" className="cursor-pointer font-bold text-slate-700">Categoria (CNH)</Label>
                                            <p className="text-xs text-slate-500">Posto exige condução de veículo.</p>
                                        </div>
                                        <Switch
                                            id="req_cnh"
                                            checked={formData.exige_cnh}
                                            onCheckedChange={(c) => setFormData({ ...formData, exige_cnh: c })}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                            <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700">Mapear Posto</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            {loading ? (
                <div className="text-center py-10">Carregando postos...</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {postos.map((posto) => (
                        <Card key={posto.id} className="overflow-hidden border-slate-200 hover:border-blue-300 transition-colors">
                            <div className={`h-2 w-full ${posto.nivel_criticidade === 1 ? 'bg-red-500' : posto.nivel_criticidade === 2 ? 'bg-amber-500' : 'bg-slate-400'}`} />
                            <CardContent className="p-5">
                                <div className="flex justify-between items-start mb-6">
                                    <h3 className="font-bold text-slate-800 text-lg">{posto.nome_posto}</h3>
                                    {getCriticidadeBadge(posto.nivel_criticidade)}
                                </div>

                                <div className="space-y-3 bg-slate-50 p-3 rounded-lg border border-slate-100">
                                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Requisitos de Escala</p>

                                    <div className="flex items-center justify-between">
                                        <span className="text-sm flex items-center gap-2 text-slate-700">
                                            <ShieldAlert className="w-4 h-4 text-slate-400" />
                                            Armamento
                                        </span>
                                        {posto.exige_armamento ? (
                                            <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded">Exigido</span>
                                        ) : (
                                            <span className="text-xs text-slate-400">Opcional</span>
                                        )}
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <span className="text-sm flex items-center gap-2 text-slate-700">
                                            <BadgeCheck className="w-4 h-4 text-slate-400" />
                                            Motorista (CNH)
                                        </span>
                                        {posto.exige_cnh ? (
                                            <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">Exigido</span>
                                        ) : (
                                            <span className="text-xs text-slate-400">Opcional</span>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                    {postos.length === 0 && (
                        <div className="col-span-full text-center py-10 text-slate-500 bg-slate-50 rounded-lg border border-dashed">
                            Nenhum posto de trabalho mapeado.
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
