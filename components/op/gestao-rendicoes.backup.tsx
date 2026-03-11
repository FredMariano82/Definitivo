"use client"

import { useState, useEffect } from "react"
import { Clock, Play, Save, RefreshCw, Calendar as CalendarIcon, MapPin, UserSquare2, ShieldAlert } from "lucide-react"
import { OpService, OpEquipe, OpPosto, OpEscalaDiaria, OpRodizioPausas } from "@/services/op-service"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { getCurrentDate } from "@/utils/date-helpers"
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

const HORAS_COLUNAS = Array.from({ length: 19 }, (_, i) => {
    const hora = i + 6; // 06:00 até 24:00
    return `${hora.toString().padStart(2, '0')}:00`;
});

export default function GestaoRendicoes() {
    const [dataAtual, setDataAtual] = useState("")
    const [loading, setLoading] = useState(true)

    // Dados base
    const [escalas, setEscalas] = useState<(OpEscalaDiaria & { op_equipe: OpEquipe, op_postos: OpPosto })[]>([])
    const [pausas, setPausas] = useState<OpRodizioPausas[]>([])

    // Filtros derivados
    const [postosOcupados, setPostosOcupados] = useState<(OpEscalaDiaria & { op_equipe: OpEquipe, op_postos: OpPosto })[]>([])
    const [rendicionistas, setRendicionistas] = useState<(OpEscalaDiaria & { op_equipe: OpEquipe })[]>([])

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [targetSlot, setTargetSlot] = useState<{ posto_id: string, hora_coluna: string, titular: OpEquipe, posto: OpPosto } | null>(null)
    const [selectedRendicionistaId, setSelectedRendicionistaId] = useState<string>("")
    const [tipoPausa, setTipoPausa] = useState("Almoço/Janta")
    const [minutoInicio, setMinutoInicio] = useState("00")
    const [minutoFim, setMinutoFim] = useState("59")

    useEffect(() => {
        const hojeDate = getCurrentDate()
        const isoDate = hojeDate.toISOString().split('T')[0]
        setDataAtual(isoDate)
        carregarPainel(isoDate)
    }, [])

    const carregarPainel = async (dataBusca: string) => {
        setLoading(true)
        try {
            // 1. Pega todo mundo que está trabalhando hoje
            const todasEscalas = await OpService.getEscalaPorData(dataBusca) as any[]

            // 2. Galera em postos fixos
            const alocados = todasEscalas.filter(e => e.status_dia === "Trabalhando" && e.posto_id)
            setPostosOcupados(alocados)

            // 3. Galera solta (Volantes / Rendicionistas)
            const volantes = todasEscalas.filter(e => e.status_dia === "Trabalhando" && !e.posto_id)
            setRendicionistas(volantes)

            // 4. Pega as pausas já cadastradas
            const pausasDB = await OpService.getPausasPorData(dataBusca)
            setPausas(pausasDB)

        } catch (error) {
            console.error("Erro ao carregar roteiro:", error)
        } finally {
            setLoading(false)
        }
    }

    const handleDataChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const novaData = e.target.value
        setDataAtual(novaData)
        if (novaData) carregarPainel(novaData)
    }

    // ABRIR MODAL AO CLICAR NA CÉLULA
    const handleCellClick = (escalaTitular: any, hora: string) => {
        // Verifica se já existe pausa aqui (para editar/deletar futuramente, por enquanto só deleta)
        const pausaExistente = pausas.find(p => p.posto_rendido_id === escalaTitular.posto_id && p.horario_inicio.startsWith(hora.split(':')[0]))
        if (pausaExistente) {
            if (confirm("Deseja remover esta rendição?")) {
                OpService.deletarPausa(pausaExistente.id).then(() => carregarPainel(dataAtual))
            }
            return;
        }

        setTargetSlot({
            posto_id: escalaTitular.posto_id,
            hora_coluna: hora,
            titular: escalaTitular.op_equipe,
            posto: escalaTitular.op_postos
        })
        setTipoPausa("Almoço/Janta")
        setMinutoInicio("00")
        setMinutoFim("59")
        setSelectedRendicionistaId("")
        setIsModalOpen(true)
    }

    // SALVAR RENDIÇÃO
    const handleSalvarPausa = async () => {
        if (!targetSlot || !selectedRendicionistaId) return alert("Selecione um rendicionista!")

        const horaBase = targetSlot.hora_coluna.split(':')[0]

        const payload = {
            escala_diaria_id: targetSlot.titular.id, // gambiarra no model, ideal é a escala_id do rendicionista
            posto_rendido_id: targetSlot.posto_id,
            horario_inicio: `${horaBase}:${minutoInicio}:00`,
            horario_fim: `${horaBase}:${minutoFim}:00`,
            tipo_pausa: tipoPausa
        }

        // Tentar salvar no supabase
        try {
            // Se falhar (pq a tabela não existe), simulamos interface
            await OpService.salvarPausa(payload as any)
            carregarPainel(dataAtual)
        } catch {
            alert("Erro ao salvar no banco. Verifique se as novas tabelas (Migrations) rodaram corretamente.")
            // Mock provisório visual
            const mock = {
                ...payload,
                id: Math.random().toString(),
                op_escala_diaria: rendicionistas.find(r => r.colaborador_id === selectedRendicionistaId)
            }
            setPausas([...pausas, mock as any])
        }
        setIsModalOpen(false)
    }

    // ALERTA DE SOFT MATCH
    const getMatchWarning = (rendicionista_id: string, posto: OpPosto) => {
        if (!rendicionista_id) return null;
        const membro = rendicionistas.find(r => r.colaborador_id === rendicionista_id)?.op_equipe
        if (!membro) return null;

        const w = []
        if (posto.exige_armamento && !membro.possui_porte_arma) w.push("Não possui Porte (VSPP).")
        if (posto.exige_cnh && !membro.possui_cnh) w.push("Não possui CNH.")
        return w.length > 0 ? w : null
    }

    const gerarRoteiroAutomatico = () => {
        alert("Rotina Antigravity: Este botão acionará o algoritmo 'Elástico'. Ele fará um loop em postosOcupados e tentará preencher a tabela op_rodizio_pausas com a array de rendicionistas disponíveis respeitando o SoftMatch.")
    }

    return (
        <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">

            {/* HEADER COM DATA E BOTÕES */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white p-4 rounded-xl border shadow-sm">
                <div>
                    <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        <Clock className="text-indigo-600" />
                        Roteiro de Pausas (Rendições)
                    </h2>
                    <p className="text-sm text-slate-500">Planeje o giro de pausas para almoço e café da sua equipe de plantão.</p>
                </div>

                <div className="flex items-center gap-4 flex-wrap">
                    <Button variant="outline" className="border-indigo-200 text-indigo-700 hover:bg-indigo-50 hover:text-indigo-800" onClick={gerarRoteiroAutomatico}>
                        <Play className="w-4 h-4 mr-2" />
                        Gerar Roteiro Inteligente
                    </Button>

                    <div className="flex items-center gap-3 bg-slate-50 px-3 py-1.5 rounded-lg border">
                        <Label htmlFor="data-roteiro" className="font-semibold text-slate-700 whitespace-nowrap">Data:</Label>
                        <div className="relative">
                            <CalendarIcon className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                            <Input
                                id="data-roteiro"
                                type="date"
                                className="pl-9 h-10 w-[150px] cursor-pointer bg-white"
                                value={dataAtual}
                                onChange={handleDataChange}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="p-20 text-center animate-pulse text-slate-400 flex flex-col items-center">
                    <RefreshCw className="w-8 h-8 animate-spin mb-4 text-indigo-300" />
                    Buscando grades e plantonistas...
                </div>
            ) : (
                <div className="space-y-6">

                    {/* QUADRO DE RENDICIONISTAS (BASE) */}
                    <div className="bg-white rounded-xl border p-4 shadow-sm">
                        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-4 flex items-center gap-2">
                            <UserSquare2 className="w-4 h-4" />
                            Equipe Base (Volantes / Rendicionistas) disponíveis hoje
                        </h3>

                        {rendicionistas.length === 0 ? (
                            <div className="p-4 rounded border-2 border-dashed border-amber-200 bg-amber-50 text-amber-600 text-sm font-medium">
                                Ninguém marcado como "Base" na Escala Diária. Vá até lá e coloque pessoas "Trabalhando" sem posto fixo.
                            </div>
                        ) : (
                            <div className="flex gap-3 flex-wrap">
                                {rendicionistas.map(r => (
                                    <div key={r.id} className="bg-indigo-50 border border-indigo-100 rounded-lg px-3 py-2 flex flex-col">
                                        <span className="font-bold text-indigo-900 text-sm">{r.op_equipe?.nome_completo}</span>
                                        <div className="flex gap-1 mt-1">
                                            {r.op_equipe?.possui_porte_arma && <Badge variant="outline" className="text-[9px] h-4 leading-3 border-indigo-200 text-indigo-600 bg-white">VSPP</Badge>}
                                            {r.op_equipe?.possui_cnh && <Badge variant="outline" className="text-[9px] h-4 leading-3 border-indigo-200 text-indigo-600 bg-white">CNH</Badge>}
                                            {r.tipo_plantao !== "Normal" && <Badge variant="secondary" className="text-[9px] h-4 leading-3 text-white bg-indigo-600">{r.tipo_plantao}</Badge>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* THE EXCEL-LIKE GRID */}
                    <div className="bg-white border rounded-xl shadow-sm overflow-hidden flex flex-col max-h-[70vh]">

                        <div className="p-2 bg-slate-800 text-white flex justify-between items-center text-sm font-medium">
                            <span>Quadro Operacional de Pausas</span>
                            <span className="text-slate-400 text-xs">Células: Roxo (Almoço/1h) | Verde (Café/15m)</span>
                        </div>

                        <div className="overflow-auto flex-1 relative custom-scrollbar">
                            <table className="w-full text-left border-collapse min-w-max">

                                {/* TABLE HEADER - STICKY TOP */}
                                <thead className="sticky top-0 z-20 bg-slate-100 shadow-sm shadow-slate-200/50">
                                    <tr>
                                        {/* Coluna Freeze Esquerda */}
                                        <th className="sticky left-0 z-30 bg-slate-100 p-3 border-b border-r border-slate-200 min-w-[250px] shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                                            <div className="flex items-center gap-2 text-slate-700">
                                                <MapPin className="w-4 h-4 text-blue-500" />
                                                Posto Fixo Titular
                                            </div>
                                        </th>

                                        {/* Colunas de Tempo */}
                                        {HORAS_COLUNAS.map(hora => (
                                            <th key={hora} className="p-2 border-b border-r border-slate-200 min-w-[100px] text-center text-xs font-bold text-slate-600">
                                                {hora}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>

                                {/* TABLE BODY */}
                                <tbody>
                                    {postosOcupados.length === 0 ? (
                                        <tr>
                                            <td colSpan={HORAS_COLUNAS.length + 1} className="p-10 text-center text-slate-400">
                                                Nenhum posto fixo alocado na Escala Diária.
                                            </td>
                                        </tr>
                                    ) : (
                                        postosOcupados.map((escala, rowIndex) => (
                                            <tr key={escala.id} className="hover:bg-slate-50 transition-colors group">

                                                {/* Célula Titular (Sticky Left) */}
                                                <td className={`sticky left-0 z-10 bg-white group-hover:bg-slate-50 p-3 border-b border-r border-slate-200 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)] ${rowIndex % 2 === 0 ? '' : 'bg-slate-50/50'}`}>
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-bold text-slate-800 flex justify-between">
                                                            {escala.op_postos?.nome_posto.substring(0, 25)}
                                                            {escala.op_postos.exige_armamento && <ShieldAlert className="w-3 h-3 text-red-400" title="Exige VSPP" />}
                                                        </span>
                                                        <span className="text-xs text-slate-500 truncate" title={escala.op_equipe?.nome_completo}>👤 {escala.op_equipe?.nome_completo}</span>
                                                    </div>
                                                </td>

                                                {/* Células de Tempo Dinâmicas */}
                                                {HORAS_COLUNAS.map(hora => {
                                                    // Verifica se tem pausa começando nessa hora
                                                    const horaStr = hora.split(':')[0]
                                                    const pausaDaCelula = pausas.find(p => p.posto_rendido_id === escala.posto_id && p.horario_inicio.startsWith(horaStr))

                                                    return (
                                                        <td
                                                            key={`${escala.id}-${hora}`}
                                                            className="border-b border-r border-slate-100 p-1 cursor-pointer hover:bg-slate-100 transition-colors relative"
                                                            onClick={() => handleCellClick(escala, hora)}
                                                        >
                                                            {pausaDaCelula ? (
                                                                <div className={`h-full w-full rounded flex flex-col justify-center px-1 py-1 shadow-sm border ${pausaDaCelula.tipo_pausa === 'Café/Banheiro' ? 'bg-emerald-100 border-emerald-200 text-emerald-800' : 'bg-indigo-500 border-indigo-600 text-white'}`}>
                                                                    <span className="text-[10px] font-bold leading-tight truncate">
                                                                        {pausaDaCelula.op_escala_diaria?.op_equipe?.nome_completo?.split(' ')[0] || "Alocado"}
                                                                    </span>
                                                                    <span className="text-[8px] opacity-80 leading-tight">
                                                                        {pausaDaCelula.horario_inicio.slice(0, 5)} à {pausaDaCelula.horario_fim.slice(0, 5)}
                                                                    </span>
                                                                </div>
                                                            ) : (
                                                                <div className="w-full h-8 flex items-center justify-center opacity-0 hover:opacity-100">
                                                                    <span className="text-slate-300 text-[10px]">+</span>
                                                                </div>
                                                            )}
                                                        </td>
                                                    )
                                                })}

                                            </tr>
                                        ))
                                    )}
                                </tbody>

                            </table>
                        </div>
                    </div>
                </div>
            )}


            {/* DIALOG DE ALOCAÇÃO DE PAUSA */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Inserir Rendição (Cobrir Pausa)</DialogTitle>
                    </DialogHeader>
                    {targetSlot && (
                        <div className="py-4 space-y-4">

                            {/* Card de Resumo do Titular */}
                            <div className="bg-slate-50 p-3 rounded-lg border">
                                <p className="text-xs font-semibold text-slate-500 uppercase">Resumo da Vaga</p>
                                <p className="font-bold text-slate-800">{targetSlot.posto?.nome_posto}</p>
                                <p className="text-sm text-slate-600">Titular ausente: {targetSlot.titular?.nome_completo}</p>
                                <p className="text-xs font-mono bg-white mt-2 px-2 py-1 inline-block rounded border">Faixa Base: {targetSlot.hora_coluna}</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Tipo de Pausa</Label>
                                    <Select value={tipoPausa} onValueChange={setTipoPausa}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Almoço/Janta">Almoço / Janta (1h)</SelectItem>
                                            <SelectItem value="Café/Banheiro">Café / Banheiro (15m)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Minutos Int. (Ex: 00 a 59)</Label>
                                    <div className="flex items-center gap-2">
                                        <Input value={minutoInicio} onChange={e => setMinutoInicio(e.target.value)} maxLength={2} className="text-center px-1" />
                                        <span>-</span>
                                        <Input value={minutoFim} onChange={e => setMinutoFim(e.target.value)} maxLength={2} className="text-center px-1" />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2 pt-2 border-t mt-4">
                                <Label className="text-indigo-700">Escolha quem vai Cobrir o Posto:</Label>

                                {getMatchWarning(selectedRendicionistaId, targetSlot.posto) && (
                                    <div className="text-xs font-bold text-red-600 bg-red-50 p-2 rounded border border-red-200">
                                        ⚠️ ATENÇÃO: {getMatchWarning(selectedRendicionistaId, targetSlot.posto)?.join(' ')}
                                    </div>
                                )}

                                <div className="max-h-[150px] overflow-y-auto space-y-1">
                                    {rendicionistas.map(r => (
                                        <div
                                            key={r.colaborador_id}
                                            onClick={() => setSelectedRendicionistaId(r.colaborador_id)}
                                            className={`p-2 rounded border text-sm cursor-pointer transition-colors flex justify-between items-center ${selectedRendicionistaId === r.colaborador_id ? 'bg-indigo-100 border-indigo-400 font-bold' : 'hover:bg-slate-50'
                                                }`}
                                        >
                                            <span>{r.op_equipe?.nome_completo}</span>
                                            <div className="flex gap-1">
                                                {r.op_equipe?.possui_porte_arma && <span className="text-[10px] text-slate-400 border px-1 rounded">V</span>}
                                            </div>
                                        </div>
                                    ))}
                                    {rendicionistas.length === 0 && <span className="text-sm text-red-500">Sem volantes!</span>}
                                </div>
                            </div>

                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
                        <Button className="bg-indigo-600 hover:bg-indigo-700" onClick={handleSalvarPausa}>Confirmar Rotação</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

        </div>
    )
}
