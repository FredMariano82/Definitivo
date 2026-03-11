import { OpEscalaDiaria, OpEquipe, OpPosto } from "./op-service"

export interface PausaProgramada {
    id: string;
    colaborador_id: string;
    nome_colaborador: string;
    posto_id: string;
    nome_posto: string;
    rendicionista_id: string;
    nome_rendicionista: string;
    tipo_pausa: "Café" | "Jantar" | "Almoço" | "Intermitência";
    horario_inicio: string;
    horario_fim: string;
    concluida: boolean;
}

export class GiroService {
    /**
     * Gera um roteiro de giros baseado na escala do dia e regras de negócio.
     */
    static gerarRoteiro(
        escala: (OpEscalaDiaria & { op_equipe: OpEquipe, op_postos: OpPosto })[],
        regras: {
            tempoCafe: number; // minutos
            tempoRefeicao: number; // minutos
            janelaInicio: string;
            janelaFim: string;
        } = { tempoCafe: 15, tempoRefeicao: 60, janelaInicio: "19:00", janelaFim: "02:00" }
    ): PausaProgramada[] {
        const roteiro: PausaProgramada[] = [];

        // 1. Identificar quem é rendicionista (Volante ou que fechou posto)
        // No exemplo do Marcus: Portaria 43 vira rendicionista às 20:00
        const rendicionistasAtivos = escala.filter(e => !e.posto_id || e.op_postos?.nome_posto.includes("43"));

        // 2. Identificar quem precisa de rendição (estão em postos fixos que não fecham)
        const alocados = escala.filter(e => e.posto_id && !e.op_postos?.nome_posto.includes("43"));

        // 3. Ordenar alocados por prioridade (ex: quem já estava lá antes das 18:00)
        // Para simplificar, vamos usar o horário de início (quem começou mais cedo)
        alocados.sort((a, b) => a.horario_inicio.localeCompare(b.horario_inicio));

        let horarioAtual = new Date();
        // Ajustar para a janela sugerida (ex: 20:05 do dia da escala)
        const baseDate = "2026-03-09"; // Mock ou data da escala
        let cursorTime = new Date(`${baseDate}T20:05:00`);

        // Regra Marcus: 43 -> 44 (Café)
        const p44 = alocados.find(a => a.op_postos?.nome_posto.includes("44"));
        const p43 = rendicionistasAtivos.find(r => r.op_postos?.nome_posto.includes("43"));

        if (p44 && p43) {
            roteiro.push({
                id: Math.random().toString(36).substr(2, 9),
                colaborador_id: p44.colaborador_id,
                nome_colaborador: p44.op_equipe.nome_completo,
                posto_id: p44.posto_id!,
                nome_posto: p44.op_postos.nome_posto,
                rendicionista_id: p43.colaborador_id,
                nome_rendicionista: p43.op_equipe.nome_completo,
                tipo_pausa: "Café",
                horario_inicio: "20:05",
                horario_fim: "20:20",
                concluida: false
            });
            // Atualiza cursor para o fim desse café
            cursorTime = new Date(`${baseDate}T20:20:00`);
        }

        // 4. Distribuir demais giros (Exemplo simplificado)
        alocados.forEach(alocado => {
            if (alocado.op_postos?.nome_posto.includes("44")) return; // Já foi

            const hInicio = cursorTime.toTimeString().slice(0, 5);
            cursorTime.setMinutes(cursorTime.getMinutes() + regras.tempoCafe);
            const hFim = cursorTime.toTimeString().slice(0, 5);

            roteiro.push({
                id: Math.random().toString(36).substr(2, 9),
                colaborador_id: alocado.colaborador_id,
                nome_colaborador: alocado.op_equipe.nome_completo,
                posto_id: alocado.posto_id!,
                nome_posto: alocado.op_postos.nome_posto,
                rendicionista_id: p43?.colaborador_id || "SISTEMA",
                nome_rendicionista: p43?.op_equipe.nome_completo || "Rendicionista",
                tipo_pausa: "Café",
                horario_inicio: hInicio,
                horario_fim: hFim,
                concluida: false
            });
        });

        return roteiro;
    }
}
