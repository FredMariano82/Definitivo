import { OpEquipe, OpPosto, OpEscalaDiaria } from "@/services/op-service";
import { BrainCircuit, Clock, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { OpEscalaComEstado } from "../gestao-escalas";

interface Props {
    escalas: OpEscalaComEstado[];
    equipePool: OpEquipe[];
}

export function SmartMatchmaker({ escalas, equipePool }: Props) {
    // 1. Identificar quem está trabalhando em um posto fixo
    const trabalhandoEmPosto = escalas.filter(e => e.status_dia === "Trabalhando" && e.op_postos);

    // 2. Ordenar pelo tempo de trabalho (simulando que quem entrou primeiro, precisa pausar primeiro)
    // Como simplificação, usaremos o horario_inicio alfanumérico. Em prod seria Date calc real.
    const filaPausas = trabalhandoEmPosto.sort((a, b) => a.horario_inicio.localeCompare(b.horario_inicio)).slice(0, 3);

    // 3. Lógica do Matchmaker (Encontrar o melhor rendicionista)
    const getSugestaoRendicao = (posto: OpPosto) => {
        // Rendicionistas são os que estão em "Base/Espera" no equipePool ou alocados como "Base" (sem posto) nas escalas
        const volantesNasEscalas = escalas.filter(e => e.status_dia === "Trabalhando" && !e.op_postos).map(e => e.op_equipe);
        const todosDisponiveis = [...equipePool, ...volantesNasEscalas];

        // Tentar achar um perfeito
        const perfectMatch = todosDisponiveis.find(m =>
            (posto.exige_armamento ? m.possui_porte_arma : true) &&
            (posto.exige_cnh ? m.possui_cnh : true)
        );

        return perfectMatch || null;
    };

    if (filaPausas.length === 0) {
        return (
            <div className="bg-slate-800 rounded-xl p-4 text-white shadow-xl">
                <div className="flex items-center gap-2 mb-2">
                    <BrainCircuit className="text-blue-400 w-5 h-5" />
                    <h3 className="font-bold">Matchmaker Automático</h3>
                </div>
                <p className="text-xs text-slate-400">Nenhum posto ocupado detectado para sugerir pausas no momento.</p>
            </div>
        );
    }

    return (
        <div className="bg-slate-800 rounded-xl p-4 text-white shadow-xl space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-700 pb-2">
                <BrainCircuit className="text-blue-400 w-5 h-5" />
                <h3 className="font-bold">Próximos a Pausar</h3>
            </div>

            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-1">
                {filaPausas.map((escala, index) => {
                    const posto = escala.op_postos!;
                    const sugestao = getSugestaoRendicao(posto);

                    return (
                        <div key={escala.id} className="bg-slate-700/50 p-3 rounded-lg border border-slate-600 relative overflow-hidden">
                            {/* Ranking Ribbon */}
                            <div className={`absolute top-0 right-0 w-6 h-6 flex items-center justify-center text-[10px] font-bold rounded-bl-lg ${index === 0 ? 'bg-red-500 text-white' : 'bg-slate-600'}`}>
                                #{index + 1}
                            </div>

                            <div className="mb-2 pr-4">
                                <p className="text-xs text-slate-400 uppercase font-semibold">{posto.nome_posto}</p>
                                <div className="flex items-center gap-2 mt-1">
                                    <Clock className="w-3 h-3 text-amber-400" />
                                    <span className="font-bold text-sm truncate" title={escala.op_equipe.nome_completo}>{escala.op_equipe.nome_completo}</span>
                                </div>
                            </div>

                            {/* Área da Sugestão */}
                            <div className="mt-3 p-2 bg-blue-900/30 rounded border border-blue-800/50">
                                <p className="text-[10px] text-blue-300 font-semibold mb-1 flex items-center gap-1">
                                    SUGESTÃO DA IA <ArrowRight className="w-3 h-3" />
                                </p>
                                {sugestao ? (
                                    <div className="flex justify-between items-center">
                                        <span className="font-bold text-xs text-blue-100 truncate">{sugestao.nome_completo}</span>
                                        <div className="flex gap-1 shrink-0">
                                            {sugestao.possui_porte_arma && <Badge variant="outline" className="text-[9px] border-blue-400 text-blue-300 px-1 py-0 h-4 min-w-0">VSPP</Badge>}
                                            {sugestao.possui_cnh && <Badge variant="outline" className="text-[9px] border-blue-400 text-blue-300 px-1 py-0 h-4 min-w-0">CNH</Badge>}
                                        </div>
                                    </div>
                                ) : (
                                    <span className="text-xs text-red-400 font-semibold italic">Nenhum rendicionista livre atende requisitos.</span>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
