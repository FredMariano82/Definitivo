"use client"

import { useState, useEffect } from "react"
import { CalendarClock, ShieldAlert, AlertCircle, Save, Calendar as CalendarIcon, UserPlus, CheckCircle2, Clock, MapPin, Coffee, Utensils } from "lucide-react"
import { OpService, OpEquipe, OpPosto, OpEscalaDiaria } from "@/services/op-service"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog"
import { getCurrentDate } from "@/utils/date-helpers"

export type OpEscalaComEstado = OpEscalaDiaria & {
    op_equipe: OpEquipe,
    op_postos: OpPosto | null,
    timer_fim_estimado?: number
};

import { DndContext, DragOverlay, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragStartEvent, DragEndEvent } from '@dnd-kit/core';
import { DraggableMembro } from "./dnd/DraggableMembro";
import { DroppablePosto } from "./dnd/DroppablePosto";
import { DroppablePausa } from "./dnd/DroppablePausa";
import { SmartMatchmaker } from "./dnd/SmartMatchmaker";

const TIPOS_PLANTAO = ["Normal", "FT (Folga Trabalhada)", "RT (Recup. de Tempo)", "Evento", "Extra/Freelancer"]

export default function GestaoEscalas() {
    const [dataAtual, setDataAtual] = useState("")
    const [equipePool, setEquipePool] = useState<OpEquipe[]>([])
    const [postos, setPostos] = useState<OpPosto[]>([])
    const [escalas, setEscalas] = useState<OpEscalaComEstado[]>([])
    const [loading, setLoading] = useState(true)

    // DnD State
    const [activeId, setActiveId] = useState<string | null>(null);
    const [activeMembro, setActiveMembro] = useState<OpEquipe | null>(null);

    // Swap State (Matchmaker -> Posto)
    const [swapModalOpen, setSwapModalOpen] = useState(false);
    const [swapData, setSwapData] = useState<{ titularReplaced: OpEscalaComEstado, volanteNew: OpEquipe, posto: OpPosto } | null>(null);

    // Modal Freelancer
    const [isAvulsoModalOpen, setIsAvulsoModalOpen] = useState(false)
    const [avulsoForm, setAvulsoForm] = useState({ nome: "", re: "", funcao: "Extra/Freelancer", armado: false, motorista: false })

    // Lista de Chamada (Check-in)
    const [isChamadaModalOpen, setIsChamadaModalOpen] = useState(false)
    const [presentesIds, setPresentesIds] = useState<Set<string>>(new Set())
    const [buscaChamada, setBuscaChamada] = useState("")

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 5, // Requires 5px movement to start drag (allows clicking)
            },
        }),
        useSensor(KeyboardSensor)
    );

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

        const escaladosIds = dadosEscalas.map(e => e.colaborador_id)
        const equipeDisponivel = dadosEquipe.filter(e => e.status_ativo && !escaladosIds.includes(e.id))

        setEquipePool(equipeDisponivel)
        setPostos(dadosPostos.filter(p => p.nome_posto !== "Chapeira" && p.nome_posto !== "Hungria"))
        setEscalas(dadosEscalas)
        setLoading(false)
    }

    const handleDataChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const novaData = e.target.value
        setDataAtual(novaData)
        if (novaData) carregarLoteDados(novaData)
    }

    // --- DND HANDLERS ---
    const handleDragStart = (event: DragStartEvent) => {
        const { active } = event;
        setActiveId(active.id as string);
        if (active.data.current?.type === 'MEMBRO') {
            setActiveMembro(active.data.current.membro);
        }
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveId(null);
        setActiveMembro(null);

        if (!over) return;

        console.log("DnD Evento:", { de: active.data.current, para: over.data.current });

        const isMembroDrop = active.data.current?.type === 'MEMBRO';
        const isPostoDrop = over.data.current?.type === 'POSTO';
        const isPausaDrop = over.data.current?.type === 'PAUSA';

        if (isMembroDrop && isPostoDrop) {
            const membro = active.data.current?.membro as OpEquipe;
            const posto = over.data.current?.posto as OpPosto | null;
            const existingEscala = active.data.current?.escala; 

            if (posto && posto.id !== 'base') {
                const ocupanteTitular = escalas.find(e => e.status_dia === "Trabalhando" && e.posto_id === posto.id);

                if (ocupanteTitular && ocupanteTitular.colaborador_id !== membro.id) {
                    console.log("Substituição detectada em:", posto.nome_posto);
                    setSwapData({
                        titularReplaced: ocupanteTitular,
                        volanteNew: membro,
                        posto: posto
                    });
                    setSwapModalOpen(true);
                    return;
                }
            }

            const isBaseDrop = posto && posto.id === 'base';
            const finalPostoId = isBaseDrop || !posto ? null : posto.id;
            const finalOpPostos = isBaseDrop || !posto ? null : posto;

            if (existingEscala) {
                console.log("Remanejando:", membro.nome_completo, "para", finalOpPostos?.nome_posto || "Base");
                setEscalas(prev => prev.map(e => e.id === existingEscala.id ? {
                    ...e,
                    posto_id: finalPostoId,
                    op_postos: finalOpPostos,
                    status_dia: "Trabalhando"
                } : e));

                import("@/lib/supabase").then(async ({ supabase }) => {
                    const { data, error } = await supabase.from('op_escala_diaria')
                        .upsert({
                            id: existingEscala.id,
                            colaborador_id: membro.id,
                            data_plantao: dataAtual,
                            posto_id: finalPostoId,
                            status_dia: "Trabalhando"
                        })
                        .select()
                        .single();
                    
                    if (error) {
                        console.error("Erro no Upsert (Remanejar):", error);
                    } else if (data) {
                        setEscalas(prev => prev.map(e => e.id === data.id ? { ...e, ...data } : e));
                        console.log("Remanejamento estável BD:", membro.nome_completo);
                    }
                });
            } else {
                console.log("Nova alocação:", membro.nome_completo, "para", finalOpPostos?.nome_posto || "Base");
                const newId = `temp-${Date.now()}`;
                setEscalas(prev => [...prev, {
                    id: newId,
                    colaborador_id: membro.id,
                    data_plantao: dataAtual,
                    horario_inicio: "18:00",
                    horario_fim: "06:00",
                    status_dia: "Trabalhando",
                    posto_id: finalPostoId,
                    tipo_plantao: "Normal",
                    op_equipe: membro,
                    op_postos: finalOpPostos
                } as any]);
                setEquipePool(prev => prev.filter(m => m.id !== membro.id));

                import("@/lib/supabase").then(async ({ supabase }) => {
                    const { data, error } = await supabase.from('op_escala_diaria')
                        .upsert({
                            colaborador_id: membro.id,
                            data_plantao: dataAtual,
                            horario_inicio: "18:00",
                            horario_fim: "06:00",
                            status_dia: "Trabalhando",
                            posto_id: finalPostoId,
                            tipo_plantao: "Normal"
                        }, { onConflict: 'colaborador_id,data_plantao' })
                        .select()
                        .single();

                    if (error) {
                        console.error("Erro no Upsert (Novo):", error);
                    } else if (data) {
                        setEscalas(prev => {
                            const filtered = prev.filter(e => e.id !== newId);
                            // Evita duplicidade se o record já existia no banco
                            const existing = filtered.find(e => e.id === data.id);
                            if (existing) return filtered.map(e => e.id === data.id ? { ...e, ...data } : e);
                            return [...filtered, { ...data, op_equipe: membro, op_postos: finalOpPostos }];
                        });
                        console.log("Alocação estável BD ID:", data.id);
                    }
                });
            }
        }

        if (isPausaDrop) {
            const membroToPause = active.data.current?.membro || active.data.current?.escala?.op_equipe;
            const existingEscala = active.data.current?.escala;
            if (!membroToPause) return;

            const { tipo, tempoMinutos } = over.data.current as any;
            const nowMs = Date.now();
            const futureMs = nowMs + (tempoMinutos * 60000);
            
            console.log("Intervalo:", membroToPause.nome_completo, "indo para", tipo);

            setEscalas(prev => {
                const alreadyOnDaily = prev.find(e => e.colaborador_id === membroToPause.id);
                if (alreadyOnDaily) {
                    return prev.map(e => e.id === alreadyOnDaily.id ? {
                        ...e,
                        status_dia: `Pausa: ${tipo}`,
                        timer_fim_estimado: futureMs,
                        posto_id: null,
                        op_postos: null
                    } : e);
                } else {
                    return [...prev, {
                        id: `temp-p-${Date.now()}`,
                        colaborador_id: membroToPause.id,
                        data_plantao: dataAtual,
                        horario_inicio: "18:00",
                        horario_fim: "06:00",
                        status_dia: `Pausa: ${tipo}`,
                        posto_id: null,
                        tipo_plantao: "Normal",
                        op_equipe: membroToPause,
                        op_postos: null,
                        timer_fim_estimado: futureMs
                    }] as any;
                }
            });
            setEquipePool(prev => prev.filter(m => m.id !== membroToPause.id));

            import("@/lib/supabase").then(async ({ supabase }) => {
                const { data, error } = await supabase.from('op_escala_diaria')
                    .upsert({
                        colaborador_id: membroToPause.id,
                        data_plantao: dataAtual,
                        horario_inicio: "18:00",
                        horario_fim: "06:00",
                        status_dia: `Pausa: ${tipo}`,
                        posto_id: null,
                        tipo_plantao: "Normal"
                    }, { onConflict: 'colaborador_id,data_plantao' })
                    .select()
                    .single();

                if (error) {
                    console.error("Erro no Upsert (Pausa):", error);
                } else if (data) {
                    setEscalas(prev => {
                        const existing = prev.find(e => e.colaborador_id === membroToPause.id);
                        if (existing) {
                            return prev.map(e => e.colaborador_id === membroToPause.id ? { ...e, ...data } : e);
                        }
                        return [...prev, { ...data, op_equipe: membroToPause }];
                    });
                }
            });
        }
    };

    const handleConfirmSwap = (tipo: "Café" | "Refeição" | "Janta" | "Ceia") => {
        if (!swapData) return;
        const { titularReplaced, volanteNew, posto } = swapData;
        console.log("Confirmando Swap:", { titular: titularReplaced.op_equipe.nome_completo, volante: volanteNew.nome_completo, pausa: tipo });

        const nowMs = Date.now();
        const duration = tipo === "Café" ? 15 : tipo === "Janta" ? 30 : 60;
        const futureMs = nowMs + (duration * 60000);
        
        const existingVolanteEscala = escalas.find(e => e.colaborador_id === volanteNew.id);

        setEscalas(prev => {
            let next = [...prev];
            const tIdx = next.findIndex(e => e.id === titularReplaced.id);
            if (tIdx >= 0) {
                next[tIdx] = { ...next[tIdx], status_dia: `Pausa: ${tipo}`, timer_fim_estimado: futureMs, posto_id: null, op_postos: null };
            }

            if (existingVolanteEscala) {
                const vIdx = next.findIndex(e => e.id === existingVolanteEscala.id);
                if (vIdx >= 0) {
                    next[vIdx] = { ...next[vIdx], status_dia: "Trabalhando", posto_id: posto.id, op_postos: posto };
                }
            } else {
                next.push({
                    id: `temp-v-${Date.now()}`,
                    colaborador_id: volanteNew.id,
                    data_plantao: dataAtual,
                    horario_inicio: "18:00",
                    horario_fim: "06:00",
                    status_dia: "Trabalhando",
                    posto_id: posto.id,
                    tipo_plantao: "Normal",
                    op_equipe: volanteNew,
                    op_postos: posto
                } as any);
            }
            return next;
        });

        if (!existingVolanteEscala) setEquipePool(prev => prev.filter(m => m.id !== volanteNew.id));

        import("@/lib/supabase").then(async ({ supabase }) => {
            const { data: d1, error: e1 } = await supabase.from('op_escala_diaria')
                .upsert({
                    id: titularReplaced.id,
                    colaborador_id: titularReplaced.colaborador_id,
                    data_plantao: dataAtual,
                    status_dia: `Pausa: ${tipo}`,
                    posto_id: null
                })
                .select()
                .single();
            
            const { data: d2, error: e2 } = await supabase.from('op_escala_diaria')
                .upsert({
                    id: existingVolanteEscala?.id,
                    colaborador_id: volanteNew.id,
                    data_plantao: dataAtual,
                    horario_inicio: "18:00",
                    horario_fim: "06:00",
                    status_dia: "Trabalhando",
                    posto_id: posto.id,
                    tipo_plantao: "Normal"
                }, { onConflict: 'colaborador_id,data_plantao' })
                .select()
                .single();

            if (e1 || e2) {
                console.error("Erro no Upsert (Swap):", e1 || e2);
            } else if (d1 && d2) {
                setEscalas(prev => prev.map(e => {
                    if (e.id === d1.id) return { ...e, ...d1 };
                    if (e.colaborador_id === volanteNew.id) return { ...e, ...d2, id: d2.id };
                    return e;
                }));
            }
        });

        setSwapModalOpen(false);
        setSwapData(null);
    };
    // --------------------

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
                alert("Criado! Você já pode arrastá-lo no Quadro de Disponíveis.")
                setIsAvulsoModalOpen(false)
                setAvulsoForm({ nome: "", re: "", funcao: "Extra/Freelancer", armado: false, motorista: false })
                carregarLoteDados(dataAtual)
            }
        } catch {
            alert("Erro ao cadastrar extra.")
        }
    }

    return (
        <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">

            {/* HEADER DE DATA E ADD AVULSO */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white p-4 rounded-xl border shadow-sm">
                <div>
                    <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        <MapPin className="text-blue-600" />
                        Painel Tático (Arrastar e Soltar)
                    </h2>
                    <p className="text-sm text-slate-500">Arraste os profissionais da esquerda para os postos de trabalho.</p>
                </div>

                <div className="flex items-center gap-4 flex-wrap">
                    <Button variant="outline" className="border-blue-300 text-blue-700 bg-blue-50 hover:bg-blue-100" onClick={() => setIsChamadaModalOpen(true)}>
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        Lista de Presença {presentesIds.size > 0 && `(${presentesIds.size})`}
                    </Button>

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

            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
            >
                <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">

                    {/* COLUNA ESQUERDA: QUADRO DE DISPONÍVEIS E MATCHMAKER */}
                    <div className="xl:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-6">
                            <SmartMatchmaker escalas={escalas} equipePool={equipePool.filter(m => presentesIds.has(m.id))} />
                        </div>
                        <div className="space-y-6">
                            <div className="bg-slate-800 rounded-t-xl p-3 text-white flex justify-between items-center shadow-md">
                                <h3 className="font-bold">Em Espera / Base Livres</h3>
                                <Badge variant="secondary" className="bg-slate-700 text-white hover:bg-slate-600">{equipePool.filter(m => presentesIds.has(m.id)).length}</Badge>
                            </div>

                            <div className="bg-slate-50 border border-t-0 rounded-b-xl p-3 max-h-[500px] overflow-y-auto space-y-2 shadow-sm">
                                {equipePool.filter(m => presentesIds.has(m.id)).length === 0 && (
                                    <div className="text-center py-10 text-slate-400 text-sm flex flex-col items-center gap-2">
                                        <AlertCircle className="w-8 h-8 text-slate-300" />
                                        <p>Nenhum profissional na Base.</p>
                                        <Button variant="link" onClick={() => setIsChamadaModalOpen(true)} className="text-blue-500">Abrir Lista de Presença</Button>
                                    </div>
                                )}

                                {equipePool.filter(m => presentesIds.has(m.id)).map(membro => (
                                    <DraggableMembro key={membro.id} membro={membro} />
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* COLUNA DIREITA: TABELA DE POSTOS E PAUSAS */}
                    <div className="xl:col-span-2 space-y-6">

                        {loading ? (
                            <div className="text-center py-20 bg-white border rounded-xl shadow-sm text-slate-500 animate-pulse">
                                Sincronizando posições táticas...
                            </div>
                        ) : (
                            <div className="space-y-6">

                                {/* ZONA DE PAUSAS VISUAIS */}
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                    <DroppablePausa
                                        id="pausa-cafe"
                                        tipo="Café"
                                        tempoMinutos={15}
                                        pausasAtivas={escalas.filter(e => e.status_dia === "Pausa: Café")}
                                        onEncerrarPausa={(id, justificativa) => handleDeleteEscala(id)}
                                    />
                                    <DroppablePausa
                                        id="pausa-refeicao"
                                        tipo="Refeição"
                                        tempoMinutos={60}
                                        pausasAtivas={escalas.filter(e => e.status_dia === "Pausa: Refeição")}
                                        onEncerrarPausa={(id, justificativa) => handleDeleteEscala(id)}
                                    />
                                    <DroppablePausa
                                        id="pausa-janta"
                                        tipo="Janta"
                                        tempoMinutos={30}
                                        pausasAtivas={escalas.filter(e => e.status_dia === "Pausa: Janta")}
                                        onEncerrarPausa={(id, justificativa) => handleDeleteEscala(id)}
                                    />
                                    <DroppablePausa
                                        id="pausa-ceia"
                                        tipo="Ceia"
                                        tempoMinutos={60}
                                        pausasAtivas={escalas.filter(e => e.status_dia === "Pausa: Ceia")}
                                        onEncerrarPausa={(id, justificativa) => handleDeleteEscala(id)}
                                    />
                                </div>

                                {/* SLOTS DE POSTOS FIXOS */}
                                <div className="bg-white p-5 rounded-xl border shadow-sm">
                                    <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                                        <MapPin className="text-blue-500" /> Mapa de Postos (Droppable)
                                    </h3>

                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {postos.map(posto => (
                                            <DroppablePosto
                                                key={posto.id}
                                                posto={posto}
                                                ocupantes={escalas.filter(e => e.status_dia === "Trabalhando" && e.posto_id === posto.id)}
                                                onRemove={handleDeleteEscala}
                                                onClickSlot={() => { }} // Legacy click, to be refactored or kept as fallback
                                            />
                                        ))}

                                        {/* CAIXA DE VOLANTES/RENDICIONISTAS */}
                                        <DroppablePosto
                                            key="base-rendicao"
                                            posto={{ id: "base", nome_posto: "Rendicionistas (Volantes)", exige_armamento: false, exige_cnh: false, nivel_criticidade: 99 }}
                                            ocupantes={escalas.filter(e => e.status_dia === "Trabalhando" && !e.posto_id)}
                                            onRemove={handleDeleteEscala}
                                            onClickSlot={() => { }}
                                        />
                                    </div>
                                </div>

                            </div>
                        )}
                    </div>
                </div>

                {/* OVERLAY PARA ARRASTAR (Efeito visual enquanto clica e segura) */}
                <DragOverlay dropAnimation={{ duration: 250, easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)' }}>
                    {activeMembro ? (
                        <div className="opacity-90 scale-105 rotate-2 p-3 rounded-xl border border-blue-500 bg-white shadow-xl">
                            <h4 className="font-bold text-slate-800 text-sm">{activeMembro.nome_completo}</h4>
                            <p className="text-xs text-slate-500 font-mono">RE: {activeMembro.re}</p>
                        </div>
                    ) : null}
                </DragOverlay>

            </DndContext>

            {/* DIALOG DA LISTA DE PRESENÇA (CHECK-IN) */}
            <Dialog open={isChamadaModalOpen} onOpenChange={setIsChamadaModalOpen}>
                <DialogContent className="max-w-2xl h-[80vh] flex flex-col">
                    <DialogHeader>
                        <DialogTitle className="text-xl flex items-center gap-2">
                            <CheckCircle2 className="text-emerald-500" />
                            Lista de Presença do Turno
                        </DialogTitle>
                        <p className="text-sm text-slate-500">Marque apenas os profissionais que estão trabalhando agora (independente do horário de entrada). Isso alimentará o Matchmaker.</p>
                    </DialogHeader>

                    <div className="flex-1 overflow-hidden flex flex-col gap-4 py-4">
                        <Input
                            placeholder="Buscar por nome ou RE..."
                            value={buscaChamada}
                            onChange={e => setBuscaChamada(e.target.value)}
                            className="bg-slate-50"
                        />

                        <div className="flex-1 overflow-y-auto border rounded-xl divide-y">
                            {equipePool
                                .filter(m => m.nome_completo.toLowerCase().includes(buscaChamada.toLowerCase()) || m.re.includes(buscaChamada))
                                .map(membro => {
                                    const isPresente = presentesIds.has(membro.id);
                                    return (
                                        <div
                                            key={membro.id}
                                            onClick={() => {
                                                const next = new Set(presentesIds);
                                                if (isPresente) next.delete(membro.id);
                                                else next.add(membro.id);
                                                setPresentesIds(next);
                                            }}
                                            className={`p-3 flex items-center justify-between cursor-pointer transition-colors hover:bg-slate-50 ${isPresente ? 'bg-emerald-50/50' : ''}`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <input
                                                    type="checkbox"
                                                    checked={isPresente}
                                                    readOnly
                                                    className="w-5 h-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                                                />
                                                <div>
                                                    <p className={`font-medium ${isPresente ? 'text-emerald-900' : 'text-slate-700'}`}>{membro.nome_completo}</p>
                                                    <p className="text-xs text-slate-500">RE: {membro.re} • {membro.funcao}</p>
                                                </div>
                                            </div>
                                            {membro.possui_porte_arma && <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">VSPP</Badge>}
                                        </div>
                                    )
                                })
                            }
                        </div>
                    </div>

                    <DialogFooter className="border-t pt-4">
                        <div className="flex-1 text-sm text-slate-500">
                            <strong>{presentesIds.size}</strong> confirmados na base ativa.
                        </div>
                        <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={() => setIsChamadaModalOpen(false)}>
                            Concluir Check-in ({presentesIds.size})
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* DIALOG FREELANCER (Mantido) */}
            <Dialog open={isAvulsoModalOpen} onOpenChange={setIsAvulsoModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Lançamento Avulso / Extra</DialogTitle>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
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
                        <Button className="bg-emerald-600 text-white" onClick={handleSalvarAvulso}>Cadastrar</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            {/* DIALOG SWAP / PAUSA RENDIÇÃO */}
            <Dialog open={swapModalOpen} onOpenChange={setSwapModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="text-xl text-blue-800">Rendição Feita!</DialogTitle>
                    </DialogHeader>
                    {swapData && (
                        <div className="py-4 space-y-6 text-center">
                            <p className="text-slate-600">
                                <strong>{swapData.volanteNew.nome_completo}</strong> acaba de assumir o posto de <strong>{swapData.titularReplaced.op_equipe.nome_completo}</strong> em <em>{swapData.posto.nome_posto}</em>.
                            </p>

                            <h3 className="font-bold text-lg text-slate-800 mb-2 border-t pt-4">O titular substituído foi para qual pausa?</h3>

                            <div className="grid grid-cols-2 gap-4">
                                <Button className="h-20 flex flex-col items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600" onClick={() => handleConfirmSwap("Café")}>
                                    <span className="text-2xl">☕</span>
                                    <span>Café (15 min)</span>
                                </Button>
                                <Button className="h-20 flex flex-col items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600" onClick={() => handleConfirmSwap("Refeição")}>
                                    <span className="text-2xl">🍽️</span>
                                    <span>Almoço (60 min)</span>
                                </Button>
                                <Button className="h-20 flex flex-col items-center justify-center gap-2 bg-indigo-500 hover:bg-indigo-600" onClick={() => handleConfirmSwap("Janta")}>
                                    <span className="text-2xl">🌙</span>
                                    <span>Janta (30 min)</span>
                                </Button>
                                <Button className="h-20 flex flex-col items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700" onClick={() => handleConfirmSwap("Ceia")}>
                                    <span className="text-2xl">🥣</span>
                                    <span>Ceia (60 min)</span>
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

        </div>
    )
}
