"use client"

import { useState, useEffect } from "react"
import { CalendarClock, ShieldAlert, AlertCircle, Save, Calendar as CalendarIcon, UserPlus, CheckCircle2, Clock, MapPin } from "lucide-react"
import { OpService, OpEquipe, OpPosto, OpEscalaDiaria } from "@/services/op-service"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { getCurrentDate } from "@/utils/date-helpers"

// Statuses base
const STATUS_OPTIONS = ["Trabalhando", "Folga", "Falta", "Férias"]
const TIPOS_PLANTAO = ["Normal", "FT (Folga Trabalhada)", "RT (Recup. de Tempo)", "Evento", "Extra/Freelancer"]

export default function GestaoEscalas() {
    const [dataAtual, setDataAtual] = useState("")
    const [equipePool, setEquipePool] = useState<OpEquipe[]>([])
    const [postos, setPostos] = useState<OpPosto[]>([])
    const [escalas, setEscalas] = useState<(OpEscalaDiaria & { op_equipe: OpEquipe, op_postos: OpPosto | null })[]>([])
    const [loading, setLoading] = useState(true)

    // Seleção Interativa
    const [selectedMembro, setSelectedMembro] = useState<OpEquipe | null>(null)

    // Modal de Alocação
    const [isAlocacaoModalOpen, setIsAlocacaoModalOpen] = useState(false)
    const [alocacaoTargetStatus, setAlocacaoTargetStatus] = useState("Trabalhando") // "Trabalhando", "Folga", "Falta"
    const [alocacaoTargetPosto, setAlocacaoTargetPosto] = useState<OpPosto | null>(null)

    // Form de Alocação
    const [horarioInicio, setHorarioInicio] = useState("06:00")
    const [horarioFim, setHorarioFim] = useState("18:00")
    const [tipoPlantao, setTipoPlantao] = useState("Normal")

    // Modal Freelancer
    const [isAvulsoModalOpen, setIsAvulsoModalOpen] = useState(false)
    const [avulsoForm, setAvulsoForm] = useState({ nome: "", re: "", funcao: "Extra/Freelancer", armado: false, motorista: false })

    useEffect(() => {
        const hojeDate = getCurrentDate()
        const isoDate = hojeDate.toISOString().split('T')[0]
        setDataAtual(isoDate)
        carregarLoteDados(isoDate)
    }, [])

    const carregarLoteDados = async (dataBusca: string) => {
        setLoading(true)
        const [dadosEquipe, dadosPostos, dadosEscalas] = await Promise.all([
            OpService.getEquipe(),
            OpService.getPostos(),
            OpService.getEscalaPorData(dataBusca)
        ])

        // Equipe ativa que AINDA NÃO foi alocada hoje
        const escaladosIds = dadosEscalas.map(e => e.colaborador_id)
        const equipeDisponivel = dadosEquipe.filter(e => e.status_ativo && !escaladosIds.includes(e.id))

        setEquipePool(equipeDisponivel)
        setPostos(dadosPostos)
        setEscalas(dadosEscalas)
        setSelectedMembro(null) // limpa selecao
        setLoading(false)
    }

    const handleDataChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const novaData = e.target.value
        setDataAtual(novaData)
        if (novaData) carregarLoteDados(novaData)
    }

    // Clica num Slot do lado direito (Posto, Folga, Falta)
    const handleSlotClick = (status: string, posto: OpPosto | null) => {
        if (!selectedMembro) {
            alert("Selecione um colaborador no quadro à esquerda primeiro.")
            return
        }
        setAlocacaoTargetStatus(status)
        setAlocacaoTargetPosto(posto)

        // Resetar horários baseado no posto. Se for "Entrada Hungria (43)", default 05:00-00:00 (exemplos de Marcus)
        if (posto && posto.nome_posto.includes("43")) {
            setHorarioInicio("05:00")
            setHorarioFim("00:00")
        } else {
            setHorarioInicio("06:00")
            setHorarioFim("18:00")
        }

        setIsAlocacaoModalOpen(true)
    }

    const handleConfirmarAlocacao = async () => {
        if (!selectedMembro) return

        import("@/lib/supabase").then(async ({ supabase }) => {
            const payload = {
                colaborador_id: selectedMembro.id,
                data_plantao: dataAtual,
                horario_inicio: alocacaoTargetStatus === "Trabalhando" ? horarioInicio : "00:00",
                horario_fim: alocacaoTargetStatus === "Trabalhando" ? horarioFim : "00:00",
                status_dia: alocacaoTargetStatus,
                posto_id: alocacaoTargetStatus === "Trabalhando" && alocacaoTargetPosto ? alocacaoTargetPosto.id : null,
                tipo_plantao: tipoPlantao,
                evento_id: null // Evento real mapeado na Phase 4
            }

            const { error } = await supabase.from('op_escala_diaria').insert([payload])
            if (error) {
                alert("Erro ao salvar escala: " + error.message)
            } else {
                setIsAlocacaoModalOpen(false)
                carregarLoteDados(dataAtual)
            }
        })
    }

    const handleDeleteEscala = async (id: string) => {
        if (!confirm("Remover esta alocação e devolver ao quadro?")) return
        import("@/lib/supabase").then(async ({ supabase }) => {
            await supabase.from('op_escala_diaria').delete().eq('id', id)
            carregarLoteDados(dataAtual)
        })
    }

    const handleSalvarAvulso = async () => {
        if (!avulsoForm.nome || !avulsoForm.re) return alert("Nome e RE obrigatórios para Freelancer.")
        try {
            const novoA = await OpService.adicionarMembroEquipe({
                nome_completo: avulsoForm.nome + " (Extra)",
                re: avulsoForm.re,
                funcao: avulsoForm.funcao,
                tipo_escala: "Avulso",
                status_ativo: true,
                possui_porte_arma: avulsoForm.armado,
                possui_cnh: avulsoForm.motorista
            })
            if (novoA) {
                alert("Criado! Você já pode selecioná-lo no Quadro de Disponíveis para alocação de hoje.")
                setIsAvulsoModalOpen(false)
                setAvulsoForm({ nome: "", re: "", funcao: "Extra/Freelancer", armado: false, motorista: false })
                carregarLoteDados(dataAtual)
            }
        } catch {
            alert("Erro ao cadastrar extra.")
        }
    }

    // Lógica de Soft Block Exibição
    const getMatchWarning = (membro: OpEquipe, posto: OpPosto) => {
        const w = []
        if (posto.exige_armamento && !membro.possui_porte_arma) w.push("Não possui Porte (VSPP).")
        if (posto.exige_cnh && !membro.possui_cnh) w.push("Não possui CNH.")
        return w.length > 0 ? w : null
    }

    return (
        <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">

            {/* HEADER DE DATA E ADD AVULSO */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white p-4 rounded-xl border shadow-sm">
                <div>
                    <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        <CalendarClock className="text-blue-600" />
                        Escala Diária (Check-in Interativo)
                    </h2>
                    <p className="text-sm text-slate-500">Clique em um profissional à esquerda e depois clique na vaga à direita.</p>
                </div>

                <div className="flex items-center gap-4 flex-wrap">
                    <Button variant="outline" className="border-dashed border-slate-300 text-slate-600 hover:bg-slate-50" onClick={() => setIsAvulsoModalOpen(true)}>
                        <UserPlus className="w-4 h-4 mr-2" />
                        Lançar Cobertura (Extra)
                    </Button>

                    <div className="flex items-center gap-3 bg-slate-50 px-3 py-1.5 rounded-lg border">
                        <Label htmlFor="data-escala" className="font-semibold text-slate-700 whitespace-nowrap">Data:</Label>
                        <div className="relative">
                            <CalendarIcon className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                            <Input
                                id="data-escala"
                                type="date"
                                className="pl-9 h-10 w-[150px] cursor-pointer bg-white"
                                value={dataAtual}
                                onChange={handleDataChange}
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">

                {/* COLUNA ESQUERDA: QUADRO DE DISPONÍVEIS */}
                <div className="xl:col-span-1 space-y-4">
                    <div className="bg-slate-800 rounded-t-xl p-3 text-white flex justify-between items-center shadow-md">
                        <h3 className="font-bold">Profissionais Disponíveis</h3>
                        <Badge variant="secondary" className="bg-slate-700 text-white hover:bg-slate-600">{equipePool.length}</Badge>
                    </div>

                    <div className="bg-slate-50 border border-t-0 rounded-b-xl p-3 max-h-[700px] overflow-y-auto space-y-2 shadow-sm">
                        {equipePool.length === 0 && (
                            <div className="text-center py-10 text-slate-400 text-sm">
                                Todos escalados ou ativos não encontrados.
                            </div>
                        )}

                        {equipePool.map(membro => (
                            <div
                                key={membro.id}
                                onClick={() => setSelectedMembro(membro)}
                                className={`p-3 rounded-xl border shadow-sm transition-all cursor-pointer ${selectedMembro?.id === membro.id
                                    ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-100 transform scale-[1.02]'
                                    : 'border-slate-200 bg-white hover:border-blue-300 hover:shadow-md'
                                    }`}
                            >
                                <div className="flex justify-between items-start mb-1">
                                    <h4 className="font-bold text-slate-800 text-sm">{membro.nome_completo}</h4>
                                    {selectedMembro?.id === membro.id && <CheckCircle2 className="w-4 h-4 text-blue-600 animate-in zoom-in" />}
                                </div>
                                <p className="text-xs text-slate-500 font-mono mb-2">RE: {membro.re} • {membro.tipo_escala}</p>
                                <div className="flex gap-1 flex-wrap">
                                    {membro.possui_porte_arma && <span className="px-1.5 py-0.5 bg-red-50 text-red-600 font-bold text-[10px] rounded border border-red-100">VSPP</span>}
                                    {membro.possui_cnh && <span className="px-1.5 py-0.5 bg-indigo-50 text-indigo-600 font-bold text-[10px] rounded border border-indigo-100">CNH</span>}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* COLUNA DIREITA: TABELA DE POSTOS */}
                <div className="xl:col-span-3 space-y-6">

                    {loading ? (
                        <div className="text-center py-20 bg-white border rounded-xl shadow-sm text-slate-500 animate-pulse">
                            Construindo mosaico do dia...
                        </div>
                    ) : (
                        <div className="space-y-6">

                            {/* SLOTS DE POSTOS FIXOS */}
                            <div className="bg-white p-5 rounded-xl border shadow-sm">
                                <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                                    <MapPin className="text-blue-500" /> Postos de Trabalho (Alocação Primária)
                                </h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {postos.map(posto => {
                                        const ocupantes = escalas.filter(e => e.status_dia === "Trabalhando" && e.posto_id === posto.id)
                                        const needMatch = posto.exige_armamento || posto.exige_cnh

                                        return (
                                            <div key={posto.id} className="border border-slate-200 rounded-xl overflow-hidden hover:border-blue-300 transition-colors">
                                                <div className={`p-2 text-white font-bold text-sm flex justify-between items-center ${posto.nivel_criticidade === 1 ? 'bg-red-600' : posto.nivel_criticidade === 2 ? 'bg-amber-500' : 'bg-slate-500'
                                                    }`}>
                                                    <span>{posto.nome_posto.substring(0, 20)}</span>
                                                    {needMatch && <span title="Exige Qualificação"><ShieldAlert className="w-4 h-4" /></span>}
                                                </div>

                                                <div className="p-3 bg-slate-50 min-h-[100px] flex flex-col gap-2">
                                                    {ocupantes.map(esc => (
                                                        <div key={esc.id} className="text-sm bg-white p-2 rounded border border-slate-200 shadow-sm relative group flex justify-between items-center">
                                                            <div>
                                                                <span className="font-bold text-slate-700 block truncate" title={esc.op_equipe?.nome_completo}>{esc.op_equipe?.nome_completo}</span>
                                                                <span className="text-xs text-slate-500">{esc.horario_inicio.slice(0, 5)} - {esc.horario_fim.slice(0, 5)}</span>
                                                                {esc.tipo_plantao !== "Normal" && <Badge variant="outline" className="ml-1 text-[9px] h-4 leading-3 font-semibold bg-blue-50">{esc.tipo_plantao}</Badge>}
                                                            </div>
                                                            <Button variant="ghost" size="icon" className="h-6 w-6 text-red-500 hover:bg-red-50 hover:text-red-700 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => { e.stopPropagation(); handleDeleteEscala(esc.id); }}>
                                                                <AlertCircle className="w-3 h-3" />
                                                            </Button>
                                                        </div>
                                                    ))}

                                                    {/* Slot pra clicar e alocar */}
                                                    <div
                                                        onClick={() => handleSlotClick("Trabalhando", posto)}
                                                        className="flex items-center justify-center p-2 rounded border-2 border-dashed border-slate-300 bg-white/50 text-slate-400 text-xs font-semibold cursor-pointer hover:border-blue-400 hover:text-blue-500 hover:bg-blue-50 flex-1 transition-colors"
                                                    >
                                                        + Clique para alocar aqui
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    })}

                                    {/* CAIXA DE RENDICIONISTAS (Base Clube sem posto fixo imediato) */}
                                    <div className="border border-blue-200 rounded-xl overflow-hidden shadow-[0_0_15px_rgba(59,130,246,0.1)] transition-colors">
                                        <div className="p-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-sm flex justify-between items-center">
                                            <span>Base / Rendicionistas</span>
                                            <span title="Aguardando Roteiro de Pausas"><Clock className="w-4 h-4" /></span>
                                        </div>

                                        <div className="p-3 bg-blue-50/50 min-h-[100px] flex flex-col gap-2">
                                            {escalas.filter(e => e.status_dia === "Trabalhando" && !e.posto_id).map(esc => (
                                                <div key={esc.id} className="text-sm bg-white p-2 rounded border border-blue-200 shadow-sm relative group flex justify-between items-center">
                                                    <div>
                                                        <span className="font-bold text-slate-700 block truncate" title={esc.op_equipe?.nome_completo}>{esc.op_equipe?.nome_completo}</span>
                                                        <span className="text-xs text-slate-500">Volante</span>
                                                    </div>
                                                    <Button variant="ghost" size="icon" className="h-6 w-6 text-red-500 hover:bg-red-50 hover:text-red-700 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => { e.stopPropagation(); handleDeleteEscala(esc.id); }}>
                                                        <AlertCircle className="w-3 h-3" />
                                                    </Button>
                                                </div>
                                            ))}
                                            <div
                                                onClick={() => handleSlotClick("Trabalhando", null)}
                                                className="flex items-center justify-center p-2 rounded border-2 border-dashed border-blue-300 bg-white/50 text-blue-500 text-xs font-semibold cursor-pointer hover:border-blue-500 hover:bg-white flex-1 transition-colors"
                                            >
                                                + Lançar como base/rendição
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* SLOTS DE EXCEÇÕES (Faltas/Folgas) */}
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                {["Folga", "Falta", "Férias"].map(statusLayer => {
                                    const ocupantes = escalas.filter(e => e.status_dia === statusLayer)
                                    return (
                                        <div key={statusLayer} className="bg-slate-50 p-3 rounded-xl border shadow-sm">
                                            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center justify-between">
                                                {statusLayer}
                                                <Badge variant="outline" className="text-slate-500">{ocupantes.length}</Badge>
                                            </h4>
                                            <div className="flex flex-col gap-2 min-h-[60px]">
                                                {ocupantes.map(esc => (
                                                    <div key={esc.id} className="text-xs bg-white p-1.5 rounded border shadow-sm flex justify-between items-center group">
                                                        <span className="truncate max-w-[120px]" title={esc.op_equipe?.nome_completo}>{esc.op_equipe?.nome_completo}</span>
                                                        <button className="text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100" onClick={() => handleDeleteEscala(esc.id)}>x</button>
                                                    </div>
                                                ))}
                                                <div
                                                    onClick={() => handleSlotClick(statusLayer, null)}
                                                    className="border-dashed border-slate-300 border-2 rounded p-1.5 text-center text-xs text-slate-400 hover:text-slate-600 hover:border-slate-400 cursor-pointer transition-colors"
                                                >
                                                    + Arrastar nome
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>

                        </div>
                    )}
                </div>
            </div>

            {/* DIALOG ALOCAÇÃO */}
            <Dialog open={isAlocacaoModalOpen} onOpenChange={setIsAlocacaoModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="text-xl">Confirmar Alocação</DialogTitle>
                    </DialogHeader>
                    {selectedMembro && (
                        <div className="py-4 space-y-4">
                            <div className="bg-slate-50 p-3 rounded-lg border flex gap-3 items-center">
                                <div className="flex-1">
                                    <p className="font-bold text-slate-800">{selectedMembro.nome_completo}</p>
                                    <p className="text-sm text-slate-500">{selectedMembro.funcao}</p>
                                </div>
                                <Badge variant="secondary" className="bg-blue-100 text-blue-700">{alocacaoTargetStatus}</Badge>
                            </div>

                            {alocacaoTargetPosto && (
                                <div className="bg-blue-50/50 p-3 rounded-lg border border-blue-100">
                                    <p className="text-xs font-semibold text-slate-500 uppercase">Posto Alvo</p>
                                    <p className="font-bold text-slate-800">{alocacaoTargetPosto.nome_posto}</p>

                                    {/* Alerta de Soft Match */}
                                    {getMatchWarning(selectedMembro, alocacaoTargetPosto) && (
                                        <div className="mt-2 text-xs font-semibold text-amber-700 bg-amber-100 px-2 py-1 rounded border border-amber-200">
                                            ⚠️ Verifique: {getMatchWarning(selectedMembro, alocacaoTargetPosto)?.join(' ')}
                                        </div>
                                    )}
                                </div>
                            )}

                            {alocacaoTargetStatus === "Trabalhando" && (
                                <>
                                    <div className="space-y-2">
                                        <Label>Categorização / Custo</Label>
                                        <Select value={tipoPlantao} onValueChange={setTipoPlantao}>
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                {TIPOS_PLANTAO.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Início (Entrada)</Label>
                                            <Input type="time" value={horarioInicio} onChange={(e) => setHorarioInicio(e.target.value)} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Fim (Saída)</Label>
                                            <Input type="time" value={horarioFim} onChange={(e) => setHorarioFim(e.target.value)} />
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsAlocacaoModalOpen(false)}>Cancelar</Button>
                        <Button className="bg-blue-600 hover:bg-blue-700" onClick={handleConfirmarAlocacao}>Confirmar</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>


            {/* DIALOG FREELANCER/EXTRA */}
            <Dialog open={isAvulsoModalOpen} onOpenChange={setIsAvulsoModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Lançamento Avulso / Extra de Evento</DialogTitle>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                        <p className="text-sm text-slate-500">Cria um cadastro rápido de Cobertura/Extra. Ele ficará disponível para escalar no dia de hoje sob a tag FT/Evento.</p>

                        <div className="space-y-2">
                            <Label>Nome Completo (Freelancer / Cobertura)</Label>
                            <Input placeholder="Ex: Rodrigo Extra" value={avulsoForm.nome} onChange={(e) => setAvulsoForm({ ...avulsoForm, nome: e.target.value })} />
                        </div>

                        <div className="space-y-2">
                            <Label>Identificação (RG / Documento)</Label>
                            <Input placeholder="Documento para controle" value={avulsoForm.re} onChange={(e) => setAvulsoForm({ ...avulsoForm, re: e.target.value })} />
                        </div>

                        <div className="flex gap-4 p-3 bg-slate-50 rounded border">
                            <Label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" checked={avulsoForm.armado} onChange={(e) => setAvulsoForm({ ...avulsoForm, armado: e.target.checked })} className="rounded text-blue-600" />
                                Possui VSPP (Armado)
                            </Label>
                            <Label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" checked={avulsoForm.motorista} onChange={(e) => setAvulsoForm({ ...avulsoForm, motorista: e.target.checked })} className="rounded text-blue-600" />
                                Motorista (CNH)
                            </Label>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsAvulsoModalOpen(false)}>Cancelar</Button>
                        <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={handleSalvarAvulso}>Cadastrar Disponibilidade</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
