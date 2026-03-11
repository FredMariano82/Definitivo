import { useDroppable } from "@dnd-kit/core";
import { OpPosto, OpEscalaDiaria, OpEquipe } from "@/services/op-service";
import { ShieldAlert, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface Props {
    posto: OpPosto;
    ocupantes: (OpEscalaDiaria & { op_equipe: OpEquipe })[];
    onRemove: (id: string) => void;
    onClickSlot: () => void;
}

export function DroppablePosto({ posto, ocupantes, onRemove, onClickSlot }: Props) {
    const { setNodeRef, isOver } = useDroppable({
        id: `posto-${posto.id}`,
        data: {
            type: "POSTO",
            posto
        }
    });

    const needMatch = posto.exige_armamento || posto.exige_cnh;

    return (
        <div
            className={`border rounded-xl overflow-hidden transition-colors ${isOver ? 'border-blue-500 ring-2 ring-blue-200 bg-blue-50/20' : 'border-slate-200 hover:border-blue-300'
                }`}
        >
            <div className={`p-2 text-white font-bold text-sm flex justify-between items-center ${posto.nivel_criticidade === 1 ? 'bg-red-600' : posto.nivel_criticidade === 2 ? 'bg-amber-500' : 'bg-slate-500'
                }`}>
                <span>{posto.nome_posto.substring(0, 20)}</span>
                {needMatch && <span title="Exige Qualificação"><ShieldAlert className="w-4 h-4" /></span>}
            </div>

            <div
                ref={setNodeRef}
                className={`p-3 min-h-[100px] flex flex-col gap-2 transition-colors ${isOver ? 'bg-blue-50/50' : 'bg-slate-50'
                    }`}
            >
                {ocupantes.map(esc => (
                    <div key={esc.id} className="text-sm bg-white p-2 rounded border border-slate-200 shadow-sm relative group flex justify-between items-center z-10">
                        <div>
                            <span className="font-bold text-slate-700 block truncate" title={esc.op_equipe?.nome_completo}>{esc.op_equipe?.nome_completo}</span>
                            <span className="text-xs text-slate-500">{esc.horario_inicio.slice(0, 5)} - {esc.horario_fim.slice(0, 5)}</span>
                            {esc.tipo_plantao !== "Normal" && <Badge variant="outline" className="ml-1 text-[9px] h-4 leading-3 font-semibold bg-blue-50">{esc.tipo_plantao}</Badge>}
                        </div>
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-red-500 hover:bg-red-50 hover:text-red-700 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => { e.stopPropagation(); onRemove(esc.id); }}>
                            <AlertCircle className="w-3 h-3" />
                        </Button>
                    </div>
                ))}

                {/* Slot visual para soltar */}
                <div
                    onClick={onClickSlot}
                    className={`flex items-center justify-center p-2 rounded border-2 border-dashed text-xs font-semibold cursor-pointer flex-1 transition-colors ${isOver
                            ? 'border-blue-500 bg-blue-100 text-blue-700'
                            : 'border-slate-300 bg-white/50 text-slate-400 hover:border-blue-400 hover:text-blue-500 hover:bg-blue-50'
                        }`}
                >
                    {isOver ? "Solte aqui!" : "+ Arraste para alocar"}
                </div>
            </div>
        </div>
    );
}
