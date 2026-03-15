import { supabase } from './op-service-v2'

export interface RegistroFinanceiro {
    id: string
    colaborador_id: string
    evento_id: string
    fase: string
    data_referencia: string
    valor_devido: number
    status_pagamento: 'pendente' | 'pago' | 'cancelado'
    created_at: string
    // Relacionamentos
    colaborador?: {
        nome_completo: string
        funcao: string
    }
    evento?: {
        nome: string
        patrocinador: string
    }
}

export class FinanceiroService {
    /**
     * Busca todos os registros financeiros com filtros opcionais
     */
    static async getRegistros(filtros?: {
        colaborador_id?: string
        status?: string
        patrocinador?: string
    }): Promise<RegistroFinanceiro[]> {
        let query = supabase
            .from('op_financeiro_eventos')
            .select(`
                *,
                colaborador:op_equipe(nome_completo, funcao),
                evento:op_eventos(nome, patrocinador)
            `)
            .order('data_referencia', { ascending: false })

        if (filtros?.colaborador_id && filtros.colaborador_id !== 'todos') {
            query = query.eq('colaborador_id', filtros.colaborador_id)
        }

        if (filtros?.status && filtros.status !== 'todos') {
            query = query.eq('status_pagamento', filtros.status)
        }

        const { data, error } = await query

        if (error) throw error

        let result = data as RegistroFinanceiro[]

        // Filtro manual para patrocinador (já que é um relacionamento de segundo nível na tabela eventos)
        if (filtros?.patrocinador && filtros.patrocinador !== 'todos') {
            result = result.filter(reg => reg.evento?.patrocinador === filtros.patrocinador)
        }

        return result || []
    }

    /**
     * Atualiza o status de pagamento de um registro
     */
    static async updateStatus(id: string, status: 'pendente' | 'pago' | 'cancelado') {
        const { error } = await supabase
            .from('op_financeiro_eventos')
            .update({ status_pagamento: status })
            .eq('id', id)
        
        if (error) throw error
    }

    /**
     * Busca resumo totalizador
     */
    static async getResumo() {
        const { data, error } = await supabase
            .from('op_financeiro_eventos')
            .select('valor_devido, status_pagamento')

        if (error) throw error

        const totalPendente = data
            .filter(r => r.status_pagamento === 'pendente')
            .reduce((acc, r) => acc + Number(r.valor_devido), 0)

        const totalPago = data
            .filter(r => r.status_pagamento === 'pago')
            .reduce((acc, r) => acc + Number(r.valor_devido), 0)

        return {
            totalPendente,
            totalPago,
            totalGeral: totalPendente + totalPago
        }
    }
}
