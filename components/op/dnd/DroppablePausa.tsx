import { useDroppable } from "@dnd-kit/core";
import { Coffee, Utensils, AlertCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { OpEscalaDiaria, OpEquipe } from "@/services/op-service";
import { DraggableMembro } from "./DraggableMembro";

interface Props {
    id: string;
    tipo: "Café" | "Refeição" | "Janta" | "Ceia";
    tempoMinutos: number; // 15, 30, ou 60
    pausasAtivas: (OpEscalaDiaria & { op_equipe: OpEquipe, timer_fim_estimado?: number })[];
    onEncerrarPausa: (id: string, justificativa?: string) => void;
}

export function DroppablePausa({ id, tipo, tempoMinutos, pausasAtivas, onEncerrarPausa }: Props) {
    const { setNodeRef, isOver } = useDroppable({
        id,
        data: {
            type: "PAUSA",
            tipo,
            tempoMinutos
        }
    });

    const [now, setNow] = useState(Date.now());

    useEffect(() => {
        const interval = setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(interval);
    }, []);

    const formatTimeLimit = (endTimeMs: number | undefined) => {
        if (!endTimeMs) return "00:00";
        const diff = endTimeMs - now;
        if (diff <= 0) return "ATRASADO";

        const m = Math.floor(diff / 60000);
        const s = Math.floor((diff % 60000) / 1000);
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const isLate = (endTimeMs: number | undefined) => {
        if (!endTimeMs) return false;
        return (endTimeMs - now) <= 0;
    }

    // Definindo estilos por tipo de pausa
    let bgStyle = "bg-slate-50 border-slate-200";
    let headerStyle = "bg-slate-500 text-white";
    let IconComponent = Coffee;

    if (tipo === "Café") {
        bgStyle = "bg-amber-50 border-amber-200";
        headerStyle = "bg-amber-500 text-white";
        IconComponent = Coffee;
    } else if (tipo === "Refeição") {
        bgStyle = "bg-orange-50 border-orange-200";
        headerStyle = "bg-orange-500 text-white";
        IconComponent = Utensils;
    } else if (tipo === "Janta") {
        bgStyle = "bg-indigo-50 border-indigo-200";
        headerStyle = "bg-indigo-500 text-white";
        IconComponent = Utensils;
    } else if (tipo === "Ceia") {
        bgStyle = "bg-purple-50 border-purple-200";
        headerStyle = "bg-purple-600 text-white";
        IconComponent = Utensils;
    }

    return (
        <div className={`border rounded-xl overflow-hidden shadow-sm transition-colors ${isOver ? 'ring-2 ring-blue-400' : ''}`}>
            <div className={`p-2 font-bold text-sm flex justify-between items-center ${headerStyle}`}>
                <div className="flex items-center gap-2">
                    <IconComponent className="w-4 h-4" />
                    <span>{tipo} ({tempoMinutos}m)</span>
                </div>
                <span className="bg-white/20 px-2 rounded-full text-xs">{pausasAtivas.length} ativos</span>
            </div>

            <div
                ref={setNodeRef}
                className={`p-3 min-h-[120px] flex flex-col gap-2 ${bgStyle} ${isOver ? 'bg-blue-50/50 mix-blend-multiply' : ''}`}
            >
                {pausasAtivas.map(pausa => {
                    const atrasado = isLate(pausa.timer_fim_estimado);
                    return (
                        <div key={pausa.id} className="relative group">
                            <DraggableMembro 
                                membro={pausa.op_equipe} 
                                escala={pausa}
                                className={atrasado ? 'bg-red-50 border-red-300 animate-pulse' : ''}
                            />
                            
                            <div className="absolute right-3 bottom-3 flex items-center gap-2 pointer-events-none">
                                <div className={`font-mono font-bold text-sm ${atrasado ? 'text-red-600' : 'text-slate-500'}`}>
                                    {formatTimeLimit(pausa.timer_fim_estimado)}
                                </div>
                            </div>

                            <button
                                onClick={() => {
                                    if (atrasado) {
                                        const just = prompt(`A pausa de ${pausa.op_equipe?.nome_completo} estourou o tempo. Motivo do atraso:`);
                                        onEncerrarPausa(pausa.id, just || "Não informado");
                                    } else {
                                        onEncerrarPausa(pausa.id);
                                    }
                                }}
                                className={`absolute right-2 top-2 px-2 py-1 rounded font-bold text-[10px] z-10 transition-opacity ${atrasado ? 'bg-red-600 text-white hover:bg-red-700' : 'opacity-0 group-hover:opacity-100 bg-slate-100 text-slate-600 hover:bg-slate-200'
                                    }`}
                            >
                                {atrasado ? 'JUSTIFICAR' : 'VOLTAR'}
                            </button>
                            {atrasado && <AlertCircle className="absolute -top-1 -right-1 text-red-600 bg-white rounded-full w-4 h-4 z-20" />}
                        </div>
                    )
                })}

                {pausasAtivas.length === 0 && !isOver && (
                    <div className="flex-1 flex items-center justify-center text-xs font-semibold text-slate-400 opacity-70">
                        Nenhum {tipo.toLowerCase()} ativo
                    </div>
                )}

                {isOver && (
                    <div className="flex-1 flex items-center justify-center border-2 border-dashed border-blue-400 text-blue-600 rounded bg-blue-100/50 font-bold p-2 text-xs">
                        Iniciar Timer
                    </div>
                )}
            </div>
        </div>
    );
}
