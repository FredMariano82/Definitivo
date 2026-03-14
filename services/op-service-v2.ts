import { createClient } from '@supabase/supabase-js'
import { 
    format, 
    parseISO, 
    differenceInCalendarDays,
    isAfter,
    isBefore,
    startOfDay
} from 'date-fns'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
export const supabase = createClient(supabaseUrl, supabaseKey)

export interface OpEquipe {
    id: string
    re: string
    nome_completo: string
    funcao: string
    tipo_escala: string
    referencia_escala: string
    status_ativo: boolean
    possui_porte_arma: boolean
    possui_cnh: boolean
    data_reciclagem?: string
    data_inicio_ferias?: string
    data_fim_ferias?: string
}

export interface OpEscalaDiaria {
    id: string
    colaborador_id: string
    data_plantao: string
    status_dia: string
    posto_id?: string
    horario_inicio: string
    horario_fim: string
    observacoes?: string
}

export interface OpEvento {
    id?: string
    nome: string
    tipo: string
    data_inicio: string
    data_fim: string
    horario_inicio?: string
    horario_fim?: string
    cor?: string
    local?: string
    observacoes?: string
    // Novos campos para Integração e Detalhamento
    local_detalhado?: string
    publico_estimado?: string
    foto_evento?: string
    
    // Período de Montagem
    montagem_inicio_data?: string
    montagem_inicio_hora?: string
    montagem_fim_data?: string
    montagem_fim_hora?: string
    
    // Período do Evento
    evento_inicio_data?: string
    evento_inicio_hora?: string
    evento_fim_data?: string
    evento_fim_hora?: string
    
    // Período de Desmontagem
    desmontagem_inicio_data?: string
    desmontagem_inicio_hora?: string
    desmontagem_fim_data?: string
    desmontagem_fim_hora?: string
    
    created_at?: string
}

export class OpServiceV2 {
    /**
     * Busca todos os colaboradores ativos
     */
    static async getEquipe(): Promise<OpEquipe[]> {
        const { data, error } = await supabase
            .from('op_equipe')
            .select('*')
            .eq('status_ativo', true)
            .order('nome_completo')
        
        if (error) throw error
        return data || []
    }

    /**
     * Busca exceções de escala para um período (ex: um mês)
     */
    static async getEscalasPeriodo(dataInicio: string, dataFim: string): Promise<OpEscalaDiaria[]> {
        const { data, error } = await supabase
            .from('op_escala_diaria')
            .select('*')
            .gte('data_plantao', dataInicio)
            .lte('data_plantao', dataFim)
        
        if (error) throw error
        return data || []
    }

    /**
     * LÓGICA CORE: Define se o colaborador trabalha em uma data específica
     * @param colaborador Dados do colaborador
     * @param data Date object do dia sendo verificado
     * @param excecoes Lista de exceções (Faltas/Folgas extras)
     */
    static getTrabalhaNoDia(colaborador: OpEquipe, data: Date, excecoes: OpEscalaDiaria[]): boolean {
        const dataAlvoStr = format(data, 'yyyy-MM-dd')
        const dataAlvo = parseISO(dataAlvoStr)

        // 1. Verificação de Férias
        if (colaborador.data_inicio_ferias && colaborador.data_fim_ferias) {
            const inicio = parseISO(colaborador.data_inicio_ferias)
            const fim = parseISO(colaborador.data_fim_ferias)
            if (!isBefore(dataAlvo, inicio) && !isAfter(dataAlvo, fim)) {
                return false // Férias BLOQUEIA o trabalho
            }
        }

        // 2. Verificação de Exceções Manuais (Faltas, FTs, etc) para ESTE DIA
        const excecaoHoje = excecoes.find(ex => 
            ex.colaborador_id === colaborador.id && 
            ex.data_plantao === dataAlvoStr
        )

        if (excecaoHoje) {
            if (excecaoHoje.status_dia === 'Falta' || excecaoHoje.status_dia === 'Atestado' || excecaoHoje.status_dia === 'Folga') {
                return false
            }
            if (excecaoHoje.status_dia === 'Trabalhando') {
                return true
            }
        }

        // 3. Escala Teórica (Cálculo Matemático)
        const refStr = colaborador.referencia_escala || '2024-01-01'
        const refDate = parseISO(refStr)
        const diffDays = differenceInCalendarDays(dataAlvo, refDate)
        const tipoEscala = (colaborador.tipo_escala || '').toLowerCase().trim().replace(/\s/g, '')

        // Escala 12x36 (Dia Sim, Dia Não) - Trabalha se a diferença de dias for PAR (0, 2, 4...)
        if (tipoEscala === '12x36') {
            return Math.abs(diffDays) % 2 === 0
        }

        // Escala 5x1 (5 dias de trabalho, 1 de folga) - Ciclo de 6 dias
        if (tipoEscala === '5x1') {
            const resto = Math.abs(diffDays) % 6
            return resto < 5 // Dias 0, 1, 2, 3, 4 são trabalho. Dia 5 é folga.
        }

        // Escala 5x2 (Comercial) - Trabalha de Segunda a Sexta
        if (tipoEscala === '5x2') {
            const diaSemana = data.getDay() // 0=Dom, 6=Sáb
            return diaSemana !== 0 && diaSemana !== 6
        }

        return true // Padrão
    }

    /**
     * Atualiza dados de um colaborador
     */
    static async updateEquipe(id: string, dados: Partial<OpEquipe>) {
        const { error } = await supabase
            .from('op_equipe')
            .update(dados)
            .eq('id', id)
        
        if (error) throw error
    }

    /**
     * Salva ou atualiza uma exceção na escala
     */
    static async upsertEscalaDiaria(dados: Partial<OpEscalaDiaria>) {
        const { error } = await supabase
            .from('op_escala_diaria')
            .upsert(dados, { onConflict: 'colaborador_id,data_plantao' })
        
        if (error) throw error
    }

    /**
     * Busca eventos para um período
     */
    static async getEventosPeriodo(dataInicio: string, dataFim: string): Promise<OpEvento[]> {
        const { data, error } = await supabase
            .from('op_eventos')
            .select('*')
            .gte('data_inicio', dataInicio)
            .lte('data_inicio', dataFim)
        
        if (error) throw error
        return data || []
    }

    /**
     * Cria um novo evento e automatiza inserções no Kanban e Postos
     */
    static async createEvento(evento: OpEvento) {
        // 1. Inserir na tabela de eventos
        const { data, error } = await supabase
            .from('op_eventos')
            .insert(evento)
            .select()
        
        if (error) throw error
        const novoEvento = data?.[0]

        try {
            // 2. Automação Kanban
            const { error: kanbanError } = await supabase.from('kanban_tarefas').insert({
                titulo: `EVENTO: ${evento.nome}`,
                categoria: 'eventos',
                status: 'entrada',
                descricao: evento.observacoes || '',
                created_by_name: 'Sistema (Evento)',
                dados_especificos: {
                    local_evento: evento.local_detalhado || evento.local,
                    publico_estimado: evento.publico_estimado,
                    // Dados de Períodos
                    montagem_periodo: `${evento.montagem_inicio_data} ${evento.montagem_inicio_hora} até ${evento.montagem_fim_data} ${evento.montagem_fim_hora}`,
                    evento_periodo: `${evento.evento_inicio_data} ${evento.evento_inicio_hora} até ${evento.evento_fim_data} ${evento.evento_fim_hora}`,
                    desmontagem_periodo: `${evento.desmontagem_inicio_data} ${evento.desmontagem_inicio_hora} até ${evento.desmontagem_fim_data} ${evento.desmontagem_fim_hora}`,
                    // Backup para campos antigos se existirem no Kanban
                    data_hora_inicio_evento: `${evento.evento_inicio_data}T${evento.evento_inicio_hora || '00:00'}`,
                    data_hora_fim_evento: `${evento.evento_fim_data}T${evento.evento_fim_hora || '00:00'}`
                }
            })

            if (kanbanError) throw kanbanError

            // 3. Automação Painel Tático (Postos)
            const { error: postError } = await supabase.from('op_postos').insert({
                nome_posto: `EVENTO: ${evento.nome}`,
                nivel_criticidade: evento.tipo === 'Crítico' ? 1 : 3,
                is_active: true,
                exige_armamento: false
            })

            if (postError) {
                console.error("Erro ao criar posto para o evento:", postError)
            }
        } catch (autoError) {
            console.error("Erro na automação do evento:", autoError)
            // Não barramos a criação do evento se a automação falhar
        }

        return novoEvento
    }
}
