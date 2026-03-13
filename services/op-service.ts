import { supabase } from "@/lib/supabase"
import { differenceInDays, isBefore, isAfter, parseISO } from "date-fns"

export interface OpEquipe {
    id: string;
    re: string;
    nome_completo: string;
    funcao: string;
    tipo_escala: string;
    data_base_calculo?: string;
    status_ativo: boolean;
    possui_porte_arma: boolean;
    possui_cnh: boolean;
    data_reciclagem?: string;
    data_inicio_ferias?: string;
    data_fim_ferias?: string;
    referencia_escala?: string; // Data para base do Par/Impar (escala 12x36)
}

export interface OpPosto {
    id: string;
    nome_posto: string;
    exige_armamento: boolean;
    exige_cnh: boolean;
    nivel_criticidade: number;
}

export interface OpEscalaDiaria {
    id: string;
    colaborador_id: string;
    data_plantao: string;
    horario_inicio: string;
    horario_fim: string;
    status_dia: string; // Trabalhando, Folga, Falta...
    posto_id?: string;
    tipo_plantao?: string; // Normal, FT, Evento, Extra
    evento_id?: string;
    observacoes?: string;
}

export interface OpRodizioPausas {
    id: string;
    escala_diaria_id: string;
    posto_rendido_id: string;
    horario_inicio: string;
    horario_fim: string;
    tipo_pausa: string; // "Almoço", "Janta", "Café", "Banheiro"
    rendicionista_id?: string;
    created_at?: string;
    // Para relacionamentos ao carregar:
    op_escala_diaria?: OpEscalaDiaria & { op_equipe?: OpEquipe };
    op_postos?: OpPosto;
}

export interface OpCheckin {
    id: string;
    data_checkin: string;
    colaborador_ids: string[];
}

export class OpService {
    // --- FUNÇÕES AUXILIARES ---
    private static sanitizarDadosEquipe(membro: Partial<OpEquipe>): any {
        const d: any = { ...membro };
        const final: any = {};
        
        // Mapeamento explícito das colunas que existem no banco (Snake Case)
        const colunasValidas = [
            're', 'nome_completo', 'funcao', 'tipo_escala', 'data_base_calculo',
            'status_ativo', 'possui_porte_arma', 'possui_cnh', 'data_reciclagem',
            'data_inicio_ferias', 'data_fim_ferias', 'referencia_escala'
        ];

        colunasValidas.forEach(col => {
            if (d[col] !== undefined) {
                // Se for string vazia em campos de data, vira null
                if (['data_reciclagem', 'data_inicio_ferias', 'data_fim_ferias', 'referencia_escala', 'data_base_calculo'].includes(col)) {
                    final[col] = d[col] === "" ? null : d[col];
                } else {
                    final[col] = d[col];
                }
            }
        });

        return final;
    }

    // --- LÓGICA DE ESCALA CENTRALIZADA ---
    static getTrabalhaNoDia(colaborador: OpEquipe, data: string | Date, excecoes?: OpEscalaDiaria[]): boolean {
        const dataAlvo = typeof data === 'string' ? parseISO(data) : data;
        
        // 1. Verificação de Exceções Manuais (Faltas, FTs, etc)
        if (excecoes) {
            const excessao = excecoes.find(ex => ex.colaborador_id === colaborador.id);
            if (excessao) {
                if (excessao.status_dia === 'Falta' || excessao.status_dia === 'Atestado' || excessao.status_dia === 'Folga') {
                    return false;
                }
                if (excessao.status_dia === 'Trabalhando') {
                    return true;
                }
            }
        }

        // 2. Se estiver em férias, não trabalha
        if (colaborador.data_inicio_ferias && colaborador.data_fim_ferias) {
            const inicio = parseISO(colaborador.data_inicio_ferias);
            const fim = parseISO(colaborador.data_fim_ferias);
            if (!isBefore(dataAlvo, inicio) && !isAfter(dataAlvo, fim)) {
                return false;
            }
        }

        // 3. Regra baseada no tipo de escala teórica
        const refDate = colaborador.referencia_escala ? parseISO(colaborador.referencia_escala) : new Date(2024, 0, 1);
        const diffDays = differenceInDays(dataAlvo, refDate);

        if (colaborador.tipo_escala === '12x36') {
            return diffDays % 2 === 0;
        }

        if (colaborador.tipo_escala === '5x1') {
            return diffDays % 6 < 5;
        }

        if (colaborador.tipo_escala === '5x2') {
            const diaSemana = dataAlvo.getDay();
            return diaSemana !== 0 && diaSemana !== 6;
        }

        return true;
    }

    static async adicionarMembroEquipe(membro: Omit<OpEquipe, 'id'>): Promise<OpEquipe | null> {
        const dadosSanitizados = this.sanitizarDadosEquipe(membro);
        const { data, error } = await supabase.from('op_equipe').insert([dadosSanitizados]).select().single();
        if (error) {
            console.error('Erro ao adicionar membro:', error);
            throw error;
        }
        return data;
    }

    static async atualizarMembroEquipe(id: string, membro: Partial<OpEquipe>): Promise<OpEquipe | null> {
        const dadosSanitizados = this.sanitizarDadosEquipe(membro);
        const { data, error } = await supabase.from('op_equipe').update(dadosSanitizados).eq('id', id).select().single();
        if (error) {
            console.error('Erro ao atualizar membro:', error);
            throw error;
        }
        return data;
    }

    // --- POSTOS ---
    static async getPostos(): Promise<OpPosto[]> {
        const { data, error } = await supabase.from('op_postos').select('*').order('nivel_criticidade');
        if (error) {
            console.error('Erro ao buscar postos:', error);
            return [];
        }
        return data || [];
    }

    static async adicionarPosto(posto: Omit<OpPosto, 'id'>): Promise<OpPosto | null> {
        const { data, error } = await supabase.from('op_postos').insert([posto]).select().single();
        if (error) {
            console.error('Erro ao adicionar posto:', error);
            throw error;
        }
        return data;
    }

    // --- ESCALA DIÁRIA ---
    static async getEscalaPorData(dataString: string): Promise<(OpEscalaDiaria & { op_equipe: OpEquipe, op_postos: OpPosto })[]> {
        const { data, error } = await supabase
            .from('op_escala_diaria')
            .select(`
                *,
                op_equipe (*),
                op_postos (*)
            `)
            .eq('data_plantao', dataString);

        if (error) {
            console.error('Erro ao buscar escala diária:', error);
            return [];
        }
        return data || [];
    }

    static async getEscalasRegiao(dataInicio: string, dataFim: string): Promise<OpEscalaDiaria[]> {
        const { data, error } = await supabase
            .from('op_escala_diaria')
            .select('*')
            .gte('data_plantao', dataInicio)
            .lte('data_plantao', dataFim);

        if (error) {
            console.error('Erro ao buscar escalas do mês:', error);
            return [];
        }
        return data || [];
    }

    static async upsertEscalaDiaria(escala: Partial<OpEscalaDiaria>): Promise<void> {
        // 1. Verificar se já existe um registro para este colaborador nesta data
        const { data: existente, error: errBusca } = await supabase
            .from('op_escala_diaria')
            .select('id')
            .eq('colaborador_id', escala.colaborador_id)
            .eq('data_plantao', escala.data_plantao)
            .maybeSingle();

        if (errBusca) {
            console.error('Erro ao verificar escala existente:', errBusca);
            throw errBusca;
        }

        if (existente) {
            // 2. Se existe, faz update
            const { error: errUpdate } = await supabase
                .from('op_escala_diaria')
                .update(escala)
                .eq('id', existente.id);
            
            if (errUpdate) {
                console.error('Erro ao atualizar escala (Verifique se há política de UPDATE):', errUpdate);
                throw errUpdate;
            }
        } else {
            // 3. Se não existe, faz insert
            const { error: errInsert } = await supabase
                .from('op_escala_diaria')
                .insert([escala]);

            if (errInsert) {
                console.error('Erro ao inserir nova escala:', errInsert);
                throw errInsert;
            }
        }
    }

    // --- RODÍZIO DE PAUSAS (RENDIÇÕES) ---
    static async getPausasPorData(dataString: string): Promise<OpRodizioPausas[]> {
        const { data, error } = await supabase
            .from('op_rodizio_pausas')
            .select(`
        *,
        op_escala_diaria!inner(*, op_equipe(*)),
        op_postos(*)
      `)
            .eq('op_escala_diaria.data_plantao', dataString);

        if (error) {
            console.error('Erro ao buscar pausas do roteiro:', error);
            return [];
        }
        return data || [];
    }

    static async salvarPausa(pausa: Omit<OpRodizioPausas, 'id' | 'created_at' | 'op_escala_diaria' | 'op_postos'>): Promise<OpRodizioPausas | null> {
        const { data, error } = await supabase.from('op_rodizio_pausas').insert([pausa]).select().single();
        if (error) {
            console.error('Erro ao salvar pausa:', error);
            throw error;
        }
        return data;
    }

    static async deletarPausa(id: string): Promise<void> {
        const { error } = await supabase.from('op_rodizio_pausas').delete().eq('id', id);
        if (error) {
            console.error('Erro ao deletar pausa:', error);
            throw error;
        }
    }

    // --- CHECK-IN (LISTA DE PRESENÇA) ---
    static async getCheckin(dataString: string): Promise<string[]> {
        const { data, error } = await supabase
            .from('op_checkin')
            .select('colaborador_ids')
            .eq('data_checkin', dataString)
            .maybeSingle();
        
        if (error && error.code !== 'PGRST116') {
            console.error('Erro ao buscar check-in:', error);
            return [];
        }
        return data?.colaborador_ids || [];
    }

    static async salvarCheckin(dataString: string, colaborador_ids: string[]): Promise<void> {
        const { error } = await supabase.from('op_checkin').upsert({
            data_checkin: dataString,
            colaborador_ids: colaborador_ids
        }, { onConflict: 'data_checkin' });

        if (error) {
            console.error('Erro ao salvar check-in:', error);
            throw error;
        }
    }
}
