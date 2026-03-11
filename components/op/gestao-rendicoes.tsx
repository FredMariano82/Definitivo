"use client"

import { useState, useEffect } from "react"
import { Clock, Play, Save, RefreshCw, Calendar as CalendarIcon, MapPin, ShieldAlert, CheckCircle2, UserCircle, Coffee, Utensils, AlertTriangle } from "lucide-react"
import { OpService, OpEquipe, OpPosto, OpEscalaDiaria, OpRodizioPausas } from "@/services/op-service"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { getCurrentDate } from "@/utils/date-helpers"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

type StatusPausa = "Aguardando" | "Em Pausa" | "Retornou"

// View Model para a Tabela Mestra
interface RowData {
    escala_id: string;
    titular: OpEquipe;
    posto: OpPosto;
    horario_posto: string; // Ex: 06:00 - 18:00

    // Status do Checklist
    cafe: { status: StatusPausa, pausa_id?: string, rendicionista_id?: string, saida?: string, retorno?: string };
    almoco: { status: StatusPausa, pausa_id?: string, rendicionista_id?: string, saida?: string, retorno?: string };

    // Estado Geral da Linha
    status_atual: "No Posto" | "Café" | "Almoço";
    rendicionista_atual_id?: string;
}

export default function GestaoRendicoes() {
    const [dataAtual, setDataAtual] = useState("")
    const [loading, setLoading] = useState(true)

    const [rows, setRows] = useState<RowData[]>([])
    const [rendicionistas, setRendicionistas] = useState<(OpEscalaDiaria & { op_equipe: OpEquipe })[]>([])

    useEffect(() => {
        const hojeDate = getCurrentDate()
        const isoDate = hojeDate.toISOString().split('T')[0]
        setDataAtual(isoDate)
        carregarPainel(isoDate)
    }, [])

    const carregarPainel = async (dataBusca: string) => {
        setLoading(true)
        try {
            const todasEscalas = await OpService.getEscalaPorData(dataBusca) as any[]
            const alocados = todasEscalas.filter(e => e.status_dia === "Trabalhando" && e.posto_id)
            const volantes = todasEscalas.filter(e => e.status_dia === "Trabalhando" && !e.posto_id)

            setRendicionistas(volantes)

            const pausasDB = await OpService.getPausasPorData(dataBusca)

            // Constrói a View (As Linhas da Tabela)
            const montadas: RowData[] = alocados.map(escala => {

                // Busca se já tem pausa salva
                const pausasDestePosto = pausasDB.filter(p => p.posto_rendido_id === escala.posto_id)
                const dbCafe = pausasDestePosto.find(p => p.tipo_pausa === "Café")
                const dbAlmoco = pausasDestePosto.find(p => p.tipo_pausa === "Almoço")

                return {
                    escala_id: escala.id,
                    titular: escala.op_equipe,
                    posto: escala.op_postos,
                    horario_posto: `${escala.horario_inicio.slice(0, 5)} - ${escala.horario_fim.slice(0, 5)}`,

                    cafe: {
                        status: dbCafe ? "Retornou" : "Aguardando",
                        pausa_id: dbCafe?.id,
                        rendicionista_id: dbCafe?.rendicionista_id, // Usando o rendicionista salvo ou mapeado
                        saida: dbCafe?.horario_inicio,
                        retorno: dbCafe?.horario_fim
                    },
                    almoco: {
                        status: dbAlmoco ? "Retornou" : "Aguardando",
                        pausa_id: dbAlmoco?.id,
                        rendicionista_id: dbAlmoco?.rendicionista_id,
                        saida: dbAlmoco?.horario_inicio,
                        retorno: dbAlmoco?.horario_fim
                    },
                    status_atual: "No Posto"
                }
            })

            setRows(montadas)

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

    // ALGORITMO GERADOR INTELIGENTE
    const gerarRoteiroInteligente = () => {
        if (rendicionistas.length === 0) return alert("Não há Volantes disponíveis para gerar o roteiro. Aloque alguém como Base na Escala Diária.")

        setLoading(true)

        setTimeout(() => {
            const novasLinhas = [...rows]
            let horaAlmocoClock = 11 // Começa os almoços as 11h
            let poolMapeamentoVSPP = rendicionistas.filter(r => r.op_equipe?.possui_porte_arma)
            let poolGeral = [...rendicionistas]

            // 1. Passar pelos postos que exigem VSPP primeiro e amarrar os Rendicionistas que têm VSPP
            novasLinhas.forEach(row => {
                if (row.posto.exige_armamento && row.almoco.status === "Aguardando") {
                    if (poolMapeamentoVSPP.length > 0) {
                        const rendEscolhido = poolMapeamentoVSPP[0]
                        row.almoco.rendicionista_id = rendEscolhido.colaborador_id
                        row.almoco.saida = `${horaAlmocoClock}:00`
                        row.almoco.retorno = `${horaAlmocoClock + 1}:00`
                    }
                }
            })

            // 2. Preencher o resto com quem sobrou, sem furar a regra
            horaAlmocoClock = 11
            novasLinhas.forEach(row => {
                if (!row.posto.exige_armamento && row.almoco.status === "Aguardando" && !row.almoco.rendicionista_id) {
                    if (poolGeral.length > 0) {
                        const randomRend = poolGeral[Math.floor(Math.random() * poolGeral.length)]
                        row.almoco.rendicionista_id = randomRend.colaborador_id
                    }
                }
            })

            setRows(novasLinhas)
            setLoading(false)
        }, 800)
    }

    // Interação de Clique na Célula de Check
    const alternarStatusPausa = (escala_id: string, tipo: 'cafe' | 'almoco') => {
        setRows(current => current.map(row => {
            if (row.escala_id === escala_id) {
                const trgt = row[tipo]
                if (trgt.status === "Aguardando") {
                    trgt.status = "Em Pausa"
                    row.status_atual = tipo === 'cafe' ? 'Café' : 'Almoço'
                } else if (trgt.status === "Em Pausa") {
                    trgt.status = "Retornou"
                    row.status_atual = 'No Posto'
                } else {
                    trgt.status = "Aguardando" // reset
                    row.status_atual = 'No Posto'
                }
            }
            return row
        }))
    }

    const setDropRendicionista = (escala_id: string, tipo: 'cafe' | 'almoco', r_id: string) => {
        setRows(current => current.map(row => {
            if (row.escala_id === escala_id) row[tipo].rendicionista_id = r_id
            return row
        }))
    }

    // --- RENDER HELPERS ---
    const renderBadgeStatus = (status: StatusPausa, tipo: 'cafe' | 'almoco') => {
        if (status === "Retornou") return <Badge className="bg-emerald-500 hover:bg-emerald-600"><CheckCircle2 className="w-3 h-3 mr-1" /> ok</Badge>
        if (status === "Em Pausa") return <Badge className="bg-amber-500 animate-pulse">🕒 Em Andamento</Badge>
        return <Badge variant="outline" className="text-slate-400 border-slate-200">⏳ Aguardando</Badge>
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">

            {/* HEADER COM DATA E BOTÕES */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-900 p-4 rounded-xl border-slate-800 shadow-sm">
                <div>
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <UserCircle className="text-emerald-400" />
                        Checklist Operacional de Giro
                    </h2>
                    <p className="text-sm text-slate-400">Modelo Mestre: Titulares x Pausas Programadas</p>
                </div>

                <div className="flex items-center gap-4 flex-wrap">
                    <Button className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all" onClick={gerarRoteiroInteligente}>
                        <Play className="w-4 h-4 mr-2" />
                        Gerar Roteiro Inteligente
                    </Button>

                    <Button variant="outline" className="border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white" onClick={() => carregarPainel(dataAtual)}>
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Resetar
                    </Button>

                    <div className="flex items-center gap-3 bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700">
                        <Label htmlFor="data-roteiro" className="font-semibold text-slate-300 whitespace-nowrap">Data:</Label>
                        <div className="relative">
                            <CalendarIcon className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                            <Input
                                id="data-roteiro"
                                type="date"
                                className="pl-9 h-10 w-[150px] cursor-pointer bg-slate-700 border-slate-600 text-white"
                                value={dataAtual}
                                onChange={handleDataChange}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="p-20 text-center animate-pulse text-slate-400 flex flex-col items-center">
                    <RefreshCw className="w-8 h-8 animate-spin mb-4 text-emerald-500" />
                    Processando Matriz...
                </div>
            ) : (
                <div className="space-y-4">

                    {/* INFO RENDICIONISTAS */}
                    <div className="flex flex-wrap gap-2 mb-2">
                        <span className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                            Mão de Obra Volante:
                            {rendicionistas.length} Disponíveis
                        </span>
                        {rendicionistas.map(r => (
                            <Badge key={r.colaborador_id} variant="secondary" className="bg-indigo-50 text-indigo-700 border-indigo-200">
                                {r.op_equipe?.nome_completo.split(' ')[0]} {r.op_equipe?.possui_porte_arma && "(VSPP)"}
                            </Badge>
                        ))}
                    </div>

                    {/* A TABELA ESTILO OPERADOR */}
                    <div className="bg-white border border-slate-300 rounded-xl shadow-xl overflow-hidden text-sm">

                        {/* THEAD ESCURO */}
                        <div className="bg-[#1e293b] text-white flex text-xs font-bold tracking-wider">
                            <div className="p-3 w-[220px] border-r border-slate-700">Nome / Cargo</div>
                            <div className="p-3 w-[150px] border-r border-slate-700">Posto Fixo</div>
                            <div className="p-3 w-[120px] border-r border-slate-700 text-center">Entrada - Saída</div>

                            {/* Bloco Café */}
                            <div className="w-[300px] border-r border-slate-700 bg-emerald-900/40">
                                <div className="p-1 text-center border-b border-slate-700 text-emerald-300 flex justify-center items-center gap-1"><Coffee className="w-3 h-3" /> CAFÉ (15m)</div>
                                <div className="flex">
                                    <div className="p-2 flex-1 border-r border-slate-700 text-center">Status</div>
                                    <div className="p-2 flex-1 text-center">Quem Rendeu</div>
                                </div>
                            </div>

                            {/* Bloco Almoço */}
                            <div className="w-[300px] border-r border-slate-700 bg-indigo-900/40">
                                <div className="p-1 text-center border-b border-slate-700 text-indigo-300 flex justify-center items-center gap-1"><Utensils className="w-3 h-3" /> ALMOÇO/JANTA (1h)</div>
                                <div className="flex">
                                    <div className="p-2 flex-1 border-r border-slate-700 text-center">Status</div>
                                    <div className="p-2 flex-1 text-center">Quem Rendeu</div>
                                </div>
                            </div>

                            <div className="p-3 flex-1 text-center">STATUS GERAL</div>
                        </div>

                        {/* TBODY */}
                        <div className="divide-y divide-slate-200">
                            {rows.length === 0 && (
                                <div className="p-8 text-center text-slate-500">Nenhum titular no posto hoje.</div>
                            )}

                            {rows.map((row, idx) => (
                                <div key={row.escala_id} className={`flex hover:bg-sky-50 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}`}>

                                    {/* NOME / CARGO */}
                                    <div className="p-3 w-[220px] border-r border-slate-200 flex flex-col justify-center">
                                        <Badge variant="default" className="w-fit mb-1 bg-[#1e40af] hover:bg-[#1e3a8a] text-[10px] px-2 py-0">
                                            {row.titular.nome_completo.split(' ').slice(0, 2).join(' ')} / {row.titular.possui_porte_arma ? 'VSPP' : 'Controlador'}
                                        </Badge>
                                        <span className="text-[10px] text-slate-400">RE: {row.titular.re}</span>
                                    </div>

                                    {/* POSTO FIXO */}
                                    <div className="p-3 w-[150px] border-r border-slate-200 flex items-center justify-between">
                                        <Badge variant="outline" className={`font-mono text-xs ${row.posto.nivel_criticidade === 1 ? 'border-red-400 text-red-700 bg-red-50' : 'border-indigo-200 text-indigo-700 bg-indigo-50'}`}>
                                            {row.posto.nome_posto.substring(0, 10)}
                                        </Badge>
                                        {row.posto.exige_armamento && <ShieldAlert className="w-3 h-3 text-red-500" title="Exige Arma" />}
                                    </div>

                                    {/* TURNO */}
                                    <div className="p-3 w-[120px] border-r border-slate-200 flex items-center justify-center font-mono text-xs text-slate-600">
                                        {row.horario_posto}
                                    </div>

                                    {/* --- BLOCO CAFÉ --- */}
                                    <div className="w-[300px] border-r border-slate-200 flex bg-emerald-50/30">
                                        {/* Status / Check */}
                                        <div
                                            className="p-2 flex-1 border-r border-slate-200 flex flex-col items-center justify-center cursor-pointer hover:bg-emerald-100"
                                            onClick={() => alternarStatusPausa(row.escala_id, 'cafe')}
                                        >
                                            {renderBadgeStatus(row.cafe.status, 'cafe')}
                                        </div>
                                        {/* Quem Rendeu */}
                                        <div className="p-2 flex-1 flex items-center justify-center">
                                            <Select value={row.cafe.rendicionista_id || ""} onValueChange={(v) => setDropRendicionista(row.escala_id, 'cafe', v)}>
                                                <SelectTrigger className="h-7 text-[10px] bg-white border-slate-300">
                                                    <SelectValue placeholder="Selecionar..." />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {rendicionistas.map(r => (
                                                        <SelectItem key={r.colaborador_id} value={r.colaborador_id} className="text-[10px]">
                                                            {r.op_equipe?.nome_completo.split(' ')[0]} {r.op_equipe?.possui_porte_arma ? '(V)' : ''}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>

                                    {/* --- BLOCO ALMOÇO --- */}
                                    <div className="w-[300px] border-r border-slate-200 flex bg-indigo-50/30">
                                        {/* Status / Check */}
                                        <div
                                            className="p-2 flex-1 border-r border-slate-200 flex flex-col items-center justify-center cursor-pointer hover:bg-indigo-100"
                                            onClick={() => alternarStatusPausa(row.escala_id, 'almoco')}
                                        >
                                            {renderBadgeStatus(row.almoco.status, 'almoco')}
                                            {row.almoco.saida && <span className="text-[9px] text-slate-400 mt-1">{row.almoco.saida.substring(0, 5)} as {row.almoco.retorno?.substring(0, 5)}</span>}
                                        </div>
                                        {/* Quem Rendeu */}
                                        <div className="p-2 flex-1 flex items-center justify-center">
                                            <Select value={row.almoco.rendicionista_id || ""} onValueChange={(v) => setDropRendicionista(row.escala_id, 'almoco', v)}>
                                                <SelectTrigger className={`h-7 text-[10px] bg-white border-slate-300 ${row.posto.exige_armamento && rendicionistas.find(r => r.colaborador_id === row.almoco.rendicionista_id)?.op_equipe?.possui_porte_arma === false ? 'border-red-500 bg-red-50' : ''}`}>
                                                    <SelectValue placeholder="Selecionar..." />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {rendicionistas.map(r => (
                                                        <SelectItem key={r.colaborador_id} value={r.colaborador_id} className="text-[10px]">
                                                            {r.op_equipe?.nome_completo.split(' ')[0]} {r.op_equipe?.possui_porte_arma ? '(V)' : ''}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>

                                    {/* STATUS GERAL */}
                                    <div className="p-4 flex-1 flex items-center justify-center bg-slate-50">
                                        <div className="flex items-center gap-2">
                                            {row.status_atual === "No Posto" && <span className="flex items-center text-slate-500 text-xs font-bold"><div className="w-2 h-2 rounded-full bg-slate-400 mr-2"></div> No Posto</span>}
                                            {row.status_atual === "Café" && <span className="flex items-center text-emerald-600 text-xs font-bold animate-pulse"><div className="w-2 h-2 rounded-full bg-emerald-500 mr-2"></div> No Café</span>}
                                            {row.status_atual === "Almoço" && <span className="flex items-center text-indigo-600 text-xs font-bold animate-pulse"><div className="w-2 h-2 rounded-full bg-indigo-500 mr-2"></div> No Almoço</span>}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 mt-4">
                        <Button className="bg-slate-800">
                            <Save className="w-4 h-4 mr-2" />
                            Salvar Rotina no Banco
                        </Button>
                    </div>

                </div>
            )}
        </div>
    )
}
