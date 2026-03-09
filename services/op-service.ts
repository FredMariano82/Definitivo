import { supabase } from "@/lib/supabase"

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

export class OpService {
    // --- EQUIPE ---
    static async getEquipe(): Promise<OpEquipe[]> {
        const { data, error } = await supabase.from('op_equipe').select('*').order('nome_completo');
        if (error) {
            console.error('Erro ao buscar equipe:', error);
            return [];
        }
        return data || [];
    }

    static async adicionarMembroEquipe(membro: Omit<OpEquipe, 'id'>): Promise<OpEquipe | null> {
        const { data, error } = await supabase.from('op_equipe').insert([membro]).select().single();
        if (error) {
            console.error('Erro ao adicionar membro:', error);
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
}
