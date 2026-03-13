import { useDraggable } from "@dnd-kit/core";
import { OpEquipe } from "@/services/op-service";
import { CheckCircle2 } from "lucide-react";

export function DraggableMembro({ membro, escala, selectedId, onClick }: { membro: OpEquipe, escala?: any, selectedId?: string, onClick?: () => void }) {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: escala ? `escala-${escala.id}` : `membro-${membro.id}`,
        data: {
            type: "MEMBRO",
            membro,
            escala
        }
    });

    const style = transform ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        zIndex: 50,
        opacity: isDragging ? 0.8 : 1,
        boxShadow: isDragging ? '0 10px 25px -5px rgba(0, 0, 0, 0.2)' : undefined,
    } : undefined;

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...listeners}
            {...attributes}
            onClick={onClick}
            className={`p-3 rounded-xl border shadow-sm transition-all cursor-grab active:cursor-grabbing ${selectedId === membro.id
                    ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-100 transform scale-[1.02]'
                    : 'border-slate-200 bg-white hover:border-blue-300 hover:shadow-md'
                }`}
        >
            <div className="flex justify-between items-start mb-1">
                <h4 className="font-bold text-slate-800 text-sm">{membro.nome_completo}</h4>
                {selectedId === membro.id && <CheckCircle2 className="w-4 h-4 text-blue-600" />}
            </div>
            <p className="text-xs text-slate-500 font-mono mb-2">RE: {membro.re} • {membro.tipo_escala}</p>
            <div className="flex gap-1 flex-wrap">
                {membro.possui_porte_arma && <span className="px-1.5 py-0.5 bg-red-50 text-red-600 font-bold text-[10px] rounded border border-red-100">VSPP</span>}
                {membro.possui_cnh && <span className="px-1.5 py-0.5 bg-indigo-50 text-indigo-600 font-bold text-[10px] rounded border border-indigo-100">CNH</span>}
            </div>
        </div>
    );
}
