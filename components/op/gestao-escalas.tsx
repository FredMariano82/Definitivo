"use client"

import { useState, useEffect } from "react"
import { CalendarClock, Plus, ShieldAlert, Check, AlertCircle, Save, Calendar as CalendarIcon } from "lucide-react"
import { OpService, OpEquipe, OpPosto, OpEscalaDiaria } from "@/services/op-service"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { getCurrentDate } from "@/utils/date-helpers"

export default function GestaoEscalas() {
    const [dataAtual, setDataAtual] = useState("")
    const [equipe, setEquipe] = useState<OpEquipe[]>([])
    const [postos, setPostos] = useState<OpPosto[]>([])
    const [escalas, setEscalas] = useState<(OpEscalaDiaria & { op_equipe: OpEquipe, op_postos: OpPosto })[]>([])

    const [loading, setLoading] = useState(true)

    // Novo plantão Form
    const [colaboradorId, setColaboradorId] = useState("")
    const [postoId, setPostoId] = useState("")
    const [horarioInicio, setHorarioInicio] = useState("06:00")
    const [horarioFim, setHorarioFim] = useState("18:00")
    const [statusDia, setStatusDia] = useState("Trabalhando")

    useEffect(() => {
        // Inicializa com a data de hoje formatada (YYYY-MM-DD) para input type date
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

        // Deixa apenas os ativos na lista de seleção
        setEquipe(dadosEquipe.filter(e => e.status_ativo))
        setPostos(dadosPostos)
        setEscalas(dadosEscalas)
        setLoading(false)
    }

    const handleDataChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const novaData = e.target.value
        setDataAtual(novaData)
        if (novaData) {
            carregarLoteDados(novaData)
        }
    }

    // --- MATCH LOGIC (Soft Block) ---
    const verificarMatch = () => {
        if (!colaboradorId || !postoId || statusDia !== "Trabalhando") return null

        const colaborador = equipe.find(e => e.id === colaboradorId)
        const posto = postos.find(p => p.id === postoId)

        if (!colaborador || !posto) return null

        const avisos = []
        if (posto.exige_armamento && !colaborador.possui_porte_arma) {
            avisos.push("Posto exige armamento (VSPP) e o colaborador não possui porte.")
        }
        if (posto.exige_cnh && !colaborador.possui_cnh) {
            avisos.push("Posto exige CNH (Motorista) e o colaborador não possui.")
        }

        // Verificação de Sobrevivência (exemplo básico se já tem muita gente alocada... - V2)

        return avisos
    }

    const avisosMatch = verificarMatch()

    const handleSalvarEscala = async () => {
        if (!colaboradorId) return alert("Selecione um colaborador.")
        if (statusDia === "Trabalhando" && !postoId) return alert("Selecione um posto para o plantão.")
        if (!dataAtual) return alert("Data inválida.")

        // Adicionado usando chamada direta do supabase no serviço (ainda não criamos a helper no OpService)
        import("@/lib/supabase").then(async ({ supabase }) => {
            const payload = {
                colaborador_id: colaboradorId,
                data_plantao: dataAtual,
                horario_inicio: horarioInicio,
                horario_fim: horarioFim,
                status_dia: statusDia,
                posto_id: statusDia === "Trabalhando" ? postoId : null
            }

            const { error } = await supabase.from('op_escala_diaria').insert([payload])
            if (error) {
                alert("Erro ao salvar escala: " + error.message)
            } else {
                // Limpar form e recarregar a lista do dia
                setColaboradorId("")
                setPostoId("")
                carregarLoteDados(dataAtual)
            }
        })
    }

    const handleDeleteEscala = async (id: string) => {
        if (!confirm("Tem certeza que deseja remover esta alocação?")) return

        import("@/lib/supabase").then(async ({ supabase }) => {
            const { error } = await supabase.from('op_escala_diaria').delete().eq('id', id)
            if (!error) carregarLoteDados(dataAtual)
        })
    }

    return (
        <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
            {/* HEADER DE DATA */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white p-4 rounded-xl border shadow-sm">
                <div>
                    <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        <CalendarClock className="text-blue-600" />
                        Check-in de Plantão Diário
                    </h2>
                    <p className="text-sm text-slate-500">Faça a alocação de postos ("O Plantão Real") e cruzamento de requisitos.</p>
                </div>

                <div className="flex items-center gap-3">
                    <Label htmlFor="data-escala" className="font-semibold text-slate-700 whitespace-nowrap">Data do Plantão:</Label>
                    <div className="relative">
                        <CalendarIcon className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                        <Input
                            id="data-escala"
                            type="date"
                            className="pl-9 h-10 w-[160px] cursor-pointer"
                            value={dataAtual}
                            onChange={handleDataChange}
                        />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* COLUNA ESQUERDA: FORMULÁRIO DE ALOCAÇÃO */}
                <div className="lg:col-span-1 space-y-4">
                    <Card className="border-slate-200 shadow-sm sticky top-24">
                        <div className="h-1 bg-blue-600 w-full rounded-t-xl" />
                        <CardContent className="p-5">
                            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                                <Plus className="w-4 h-4" /> Nova Alocação
                            </h3>

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Colaborador</Label>
                                    <Select value={colaboradorId} onValueChange={setColaboradorId}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selecione na equipe..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {equipe.map(e => <SelectItem key={e.id} value={e.id}>{e.nome_completo} ({e.funcao})</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label>Status no Dia</Label>
                                    <Select value={statusDia} onValueChange={setStatusDia}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Trabalhando">Trabalhando (Check-in confirmed)</SelectItem>
                                            <SelectItem value="Folga">Folga</SelectItem>
                                            <SelectItem value="Falta">Falta</SelectItem>
                                            <SelectItem value="Férias">Férias / Afastamento</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {statusDia === "Trabalhando" && (
                                    <>
                                        <div className="space-y-2">
                                            <Label>Posicionamento (Posto)</Label>
                                            <Select value={postoId} onValueChange={setPostoId}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Selecione o posto..." />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {postos.map(p => (
                                                        <SelectItem key={p.id} value={p.id}>
                                                            {p.nivel_criticidade === 1 ? '🔴 ' : p.nivel_criticidade === 2 ? '🟠 ' : '⚪ '}
                                                            {p.nome_posto}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        {/* ALERTAS DE MATCH/SOFT BLOCK */}
                                        {avisosMatch && avisosMatch.length > 0 && (
                                            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800 animate-in fade-in duration-300">
                                                <div className="flex items-center gap-2 font-bold mb-1">
                                                    <AlertCircle className="w-4 h-4 text-amber-600" />
                                                    Alerta de Requisito (Soft Match)
                                                </div>
                                                <ul className="list-disc list-inside space-y-1">
                                                    {avisosMatch.map((aviso, i) => <li key={i}>{aviso}</li>)}
                                                </ul>
                                                <p className="text-xs mt-2 text-amber-700 italic">O sistema permite salvar para modo paliativo/emergência.</p>
                                            </div>
                                        )}

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label>Início do Turno</Label>
                                                <Input type="time" value={horarioInicio} onChange={(e) => setHorarioInicio(e.target.value)} />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Fim do Turno</Label>
                                                <Input type="time" value={horarioFim} onChange={(e) => setHorarioFim(e.target.value)} />
                                            </div>
                                        </div>
                                    </>
                                )}

                                <Button
                                    className="w-full bg-blue-600 hover:bg-blue-700 mt-2"
                                    onClick={handleSalvarEscala}
                                >
                                    <Save className="w-4 h-4 mr-2" />
                                    Salvar na Escala
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* COLUNA DIREITA: QUADRO DE ALOCAÇÕES */}
                <div className="lg:col-span-2 space-y-4">
                    {loading ? (
                        <div className="text-center py-10 bg-white border rounded-xl shadow-sm">Carregando escala do dia...</div>
                    ) : escalas.length === 0 ? (
                        <div className="text-center py-16 bg-white border border-dashed rounded-xl shadow-sm text-slate-500">
                            <CalendarClock className="w-12 h-12 mx-auto text-slate-300 mb-2" />
                            <p>Nenhuma pessoa escalada para este dia.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-3">
                            {/* Separar Trabalhando dos Faltantes/Folgas */}
                            {['Trabalhando', 'Falta', 'Folga', 'Férias'].map(statusLayer => {
                                const escalasFiltradas = escalas.filter(e => e.status_dia === statusLayer)
                                if (escalasFiltradas.length === 0) return null

                                return (
                                    <div key={statusLayer} className="space-y-2">
                                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 pl-2 mt-4 flex items-center gap-2">
                                            {statusLayer === 'Trabalhando' ? <div className="w-2 h-2 rounded-full bg-blue-500" /> : <div className="w-2 h-2 rounded-full bg-slate-300" />}
                                            Status: {statusLayer} ({escalasFiltradas.length})
                                        </h4>

                                        {escalasFiltradas.map(escala => {
                                            const colab = escala.op_equipe;
                                            const posto = escala.op_postos;

                                            const checkMatch = posto ? [
                                                posto.exige_armamento && !colab.possui_porte_arma,
                                                posto.exige_cnh && !colab.possui_cnh
                                            ].some(Boolean) : false;

                                            return (
                                                <div key={escala.id} className="flex flex-col sm:flex-row items-center justify-between p-4 bg-white border border-slate-200 rounded-xl shadow-sm hover:border-slate-300 transition-colors gap-4">
                                                    <div className="flex md:items-center gap-4 w-full flex-col sm:flex-row">

                                                        <div className="min-w-[40px] hidden sm:flex items-center justify-center p-2 bg-slate-50 rounded-lg">
                                                            {statusLayer === 'Trabalhando' ? <ShieldAlert className="text-slate-400 w-5 h-5" /> : <AlertCircle className="text-slate-300 w-5 h-5" />}
                                                        </div>

                                                        <div className="flex-1">
                                                            <h4 className="font-bold text-slate-800">{colab?.nome_completo || 'Desconhecido'}</h4>
                                                            <p className="text-sm text-slate-500 font-mono">RE: {colab?.re} • {colab?.funcao}</p>
                                                        </div>

                                                        {statusLayer === "Trabalhando" && (
                                                            <div className="flex-1 border-l sm:pl-4 border-slate-100 mt-2 sm:mt-0 pt-2 sm:pt-0">
                                                                <p className="text-xs text-slate-500 uppercase font-semibold">Posto Atual</p>
                                                                <p className="text-sm font-bold text-slate-800 flex items-center gap-1">
                                                                    {posto?.nome_posto || 'Sem posto'}
                                                                </p>
                                                                <p className="text-xs text-slate-500 font-mono">
                                                                    Turno: {escala.horario_inicio.slice(0, 5)} até {escala.horario_fim.slice(0, 5)}
                                                                </p>
                                                            </div>
                                                        )}

                                                    </div>

                                                    <div className="flex gap-2 w-full sm:w-auto mt-2 sm:mt-0">
                                                        {checkMatch && (
                                                            <div className="flex items-center px-2 py-1 bg-amber-50 text-amber-700 text-xs font-bold rounded border border-amber-200" title="Requisitos do posto não atendidos totalmente">
                                                                <AlertCircle className="w-3 h-3 mr-1" /> Exceção Match
                                                            </div>
                                                        )}
                                                        <Button variant="ghost" className="text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => handleDeleteEscala(escala.id)}>
                                                            Remover
                                                        </Button>
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
