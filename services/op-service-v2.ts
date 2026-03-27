import { createClient } from '@supabase/supabase-js'
import { 
    format, 
    parseISO, 
    differenceInCalendarDays,
    differenceInHours,
    isWeekend,
    getDay,
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
    tipo_servico?: string // 'VSPP' ou 'Vigilante/Operacional'
    nivel?: number // 1, 2, 3
    foto_perfil?: string
    cel1?: string
    cel2?: string
    tipo_vinculo?: 'clube' | 'externo'
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
    
    // Novos campos Fase 2.2
    patrocinador?: string
    responsavel_nome?: string
    nivel_criticidade?: number
    
    equipe_montagem?: string[]
    equipe_realizacao?: string[]
    equipe_desmontagem?: string[]
    
    has_montagem?: boolean
    has_realizacao?: boolean
    has_desmontagem?: boolean
    
    // Legado (remover futuramente se possível)
    equipe_escalada?: string[] 
    
    tipo_servico?: string // 'VSPP' ou 'Vigilante/Operacional'
    vagas_necessarias?: number
    created_at?: string
}

export interface OpEventoEquipe {
    id?: string
    evento_id: string
    colaborador_id: string
    fase: string
    status: 'PENDENTE' | 'CONVIDADO' | 'ACEITO' | 'RECUSADO'
    data_convite?: string
    data_resposta?: string
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
     * Busca todos os eventos futuros ou em andamento
     */
    static async getEventos(): Promise<OpEvento[]> {
        const hoje = format(new Date(), 'yyyy-MM-dd')
        const { data, error } = await supabase
            .from('op_eventos')
            .select('*')
            .gte('data_fim', hoje)
            .not('observacoes', 'ilike', '%[CONCLUIDO]%')
            .order('data_inicio')
        
        if (error) throw error
        return data || []
    }

    /**
     * Calcula a disponibilidade de um profissional para um evento específico
     */
    static async getDisponibilidade(colaborador: OpEquipe, data: string, horaInicio: string, horaFim: string): Promise<{
        status: 'disponivel' | 'conflito' | 'alerta' | 'afastado'
        motivo?: string
    }> {
        const dataAlvo = parseISO(data)
        
        // 1. Verificar Férias
        if (colaborador.data_inicio_ferias && colaborador.data_fim_ferias) {
            if (data >= colaborador.data_inicio_ferias && data <= colaborador.data_fim_ferias) {
                return { status: 'afastado', motivo: 'Férias' }
            }
        }

        // 2. Verificar Escala Fixa (Teórica + Exceções)
        // Precisamos buscar as exceções para esse dia específico se não as tivermos
        const { data: excecoes } = await supabase
            .from('op_escala_diaria')
            .select('*')
            .eq('colaborador_id', colaborador.id)
            .eq('data_plantao', data)
        
        const trabalhaTeorico = this.getTrabalhaNoDia(colaborador, dataAlvo, excecoes || [])
        
        if (trabalhaTeorico) {
            // Se trabalha no dia, precisamos ver se o horário do evento conflita com o turno dele
            // Turno padrão: 08:00 às 20:00 (ajustável se tivermos o horário da exceção)
            const turnoInicio = excecoes?.[0]?.horario_inicio || '08:00'
            const turnoFim = excecoes?.[0]?.horario_fim || '20:00'

            // Lógica de interseção de horários
            const conflito = (horaInicio < turnoFim && horaFim > turnoInicio)
            
            if (conflito) {
                return { status: 'conflito', motivo: `Em plantão fixo (${turnoInicio}-${turnoFim})` }
            } else {
                return { status: 'alerta', motivo: `Trabalha no dia, mas em outro turno (${turnoInicio}-${turnoFim})` }
            }
        }

        // 3. Verificar outros Eventos no mesmo horário
        const { data: outrosEventos } = await supabase
            .from('op_eventos')
            .select('*')
            .contains('equipe_realizacao', [colaborador.id])
            .or(`data_inicio.eq.${data},data_fim.eq.${data}`)

        if (outrosEventos && outrosEventos.length > 0) {
            for (const ev of outrosEventos) {
                const evInicio = ev.evento_inicio_hora || '00:00'
                const evFim = ev.evento_fim_hora || '23:59'
                if (horaInicio < evFim && horaFim > evInicio) {
                    return { status: 'conflito', motivo: `Já escalado no evento: ${ev.nome}` }
                }
            }
        }

        return { status: 'disponivel' }
    }

    // FUNÇÕES AUXILIARES DE CÁLCULO FINANCEIRO
    static calculateStaffValue(
        profissionais: OpEquipe[], 
        patrocinador: string, 
        dataInicioStr: string, 
        horaInicio: string, 
        dataFimStr: string, 
        horaFim: string
    ) {
        try {
            const start = parseISO(`${dataInicioStr}T${horaInicio}`)
            const end = parseISO(`${dataFimStr}T${horaFim}`)
            const horasTotais = differenceInHours(end, start)
            const isFimDeSemana = isWeekend(start) || isWeekend(end)
            
            let totalTotal = 0
            const detalheIndivual: { id: string, nome: string, valor: number }[] = []
            
            profissionais.forEach(membro => {
                let valorMembro = 0
                if (patrocinador === 'Paulão') {
                    if (horasTotais <= 6) valorMembro = 140
                    else if (horasTotais <= 8) valorMembro = 170
                    else valorMembro = 240
                } 
                else if (patrocinador === 'OR') {
                    valorMembro = 130
                }
                else if (patrocinador === 'Hagana') {
                    const tipo = membro.tipo_servico || 'Vigilante/Operacional'
                    if (tipo === 'VSPP') {
                        valorMembro = 240
                    } else {
                        valorMembro = isFimDeSemana ? 210 : 190
                    }
                }
                
                totalTotal += valorMembro
                detalheIndivual.push({
                    id: membro.id,
                    nome: membro.nome_completo,
                    valor: valorMembro
                })
            })
            
            return { total: totalTotal, detalhe: detalheIndivual }
        } catch (e) {
            console.error("Erro no cálculo financeiro:", e)
            return { total: 0, detalhe: [] }
        }
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
     */
    static getTrabalhaNoDia(colaborador: OpEquipe, data: Date, excecoes: OpEscalaDiaria[]): boolean {
        const dataAlvoStr = format(data, 'yyyy-MM-dd')
        const dataAlvo = parseISO(dataAlvoStr)

        // 1. Verificação de Férias
        if (colaborador.data_inicio_ferias && colaborador.data_fim_ferias) {
            const inicio = parseISO(colaborador.data_inicio_ferias)
            const fim = parseISO(colaborador.data_fim_ferias)
            if (!isBefore(dataAlvo, inicio) && !isAfter(dataAlvo, fim)) {
                return false
            }
        }

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

        const refStr = colaborador.referencia_escala || '2024-01-01'
        const refDate = parseISO(refStr)
        const diffDays = differenceInCalendarDays(dataAlvo, refDate)
        const tipoEscala = (colaborador.tipo_escala || '').toLowerCase().trim().replace(/\s/g, '')

        if (tipoEscala === '12x36') {
            return Math.abs(diffDays) % 2 === 0
        }

        if (tipoEscala === '5x1') {
            const resto = Math.abs(diffDays) % 6
            return resto < 5
        }

        if (tipoEscala === '5x2') {
            const diaSemana = data.getDay()
            return diaSemana !== 0 && diaSemana !== 6
        }

        return true
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
            .not('observacoes', 'ilike', '%[CONCLUIDO]%')
        
        if (error) throw error
        return data || []
    }

    /**
     * Cria um novo evento e automatiza inserções no Kanban e Postos
     */
    static async createEvento(evento: OpEvento) {
        const { data, error } = await supabase
            .from('op_eventos')
            .insert(evento)
            .select()
        
        if (error) throw error
        const novoEvento = data?.[0]

        try {
            // 1. Buscar detalhes da equipe escalada (necessário para nomes e tipos de serviço)
            const allStaffIds = Array.from(new Set([
                ...(evento.equipe_montagem || []),
                ...(evento.equipe_realizacao || []),
                ...(evento.equipe_desmontagem || [])
            ]))

            let staffDetails: OpEquipe[] = []
            if (allStaffIds.length > 0) {
                const { data: staffData } = await supabase.from('op_equipe').select('*').in('id', allStaffIds)
                staffDetails = staffData || []
            }

            const getStaffNames = (ids: string[]) => {
                return ids.map(id => staffDetails.find(s => s.id === id)?.nome_completo || 'Desconhecido')
            }

            const getStaffObjects = (ids: string[]) => {
                return staffDetails.filter(s => ids.includes(s.id))
            }

            const fases = []
            
            if (evento.has_montagem) {
                const equipeObj = getStaffObjects(evento.equipe_montagem || [])
                const calc = OpServiceV2.calculateStaffValue(
                    equipeObj, 
                    evento.patrocinador || 'Hagana',
                    evento.montagem_inicio_data!, evento.montagem_inicio_hora!,
                    evento.montagem_fim_data!, evento.montagem_fim_hora!
                )

                fases.push({
                    tipo: 'MONTAGEM',
                    titulo: `MONTAGEM: ${evento.nome}`,
                    data_inicio: evento.montagem_inicio_data,
                    periodo: `${evento.montagem_inicio_data} ${evento.montagem_inicio_hora} até ${evento.montagem_fim_data} ${evento.montagem_fim_hora}`,
                    equipe_detalhe: calc.detalhe,
                    valor_previsto: calc.total
                })
            }

            if (evento.has_realizacao) {
                const equipeObj = getStaffObjects(evento.equipe_realizacao || [])
                const calc = OpServiceV2.calculateStaffValue(
                    equipeObj, 
                    evento.patrocinador || 'Hagana',
                    evento.evento_inicio_data!, evento.evento_inicio_hora!,
                    evento.evento_fim_data!, evento.evento_fim_hora!
                )

                fases.push({
                    tipo: 'EVENTO',
                    titulo: `EVENTO: ${evento.nome}`,
                    data_inicio: evento.evento_inicio_data,
                    periodo: `${evento.evento_inicio_data} ${evento.evento_inicio_hora} até ${evento.evento_fim_data} ${evento.evento_fim_hora}`,
                    equipe_detalhe: calc.detalhe,
                    valor_previsto: calc.total
                })
            }

            if (evento.has_desmontagem) {
                const equipeObj = getStaffObjects(evento.equipe_desmontagem || [])
                const calc = OpServiceV2.calculateStaffValue(
                    equipeObj, 
                    evento.patrocinador || 'Hagana',
                    evento.desmontagem_inicio_data!, evento.desmontagem_inicio_hora!,
                    evento.desmontagem_fim_data!, evento.desmontagem_fim_hora!
                )

                fases.push({
                    tipo: 'DESMONTAGEM',
                    titulo: `DESMONTAGEM: ${evento.nome}`,
                    data_inicio: evento.desmontagem_inicio_data,
                    periodo: `${evento.desmontagem_inicio_data} ${evento.desmontagem_inicio_hora} até ${evento.desmontagem_fim_data} ${evento.desmontagem_fim_hora}`,
                    equipe_detalhe: calc.detalhe,
                    valor_previsto: calc.total
                })
            }

            for (const fase of fases) {
                // Registro Permanente para Relatórios
                for (const profissional of fase.equipe_detalhe) {
                    await supabase.from('op_financeiro_eventos').insert({
                        colaborador_id: profissional.id,
                        evento_id: novoEvento.id,
                        fase: fase.tipo,
                        data_referencia: fase.data_inicio,
                        valor_devido: profissional.valor,
                        status_pagamento: 'pendente'
                    })
                }

                // Kanban
                await supabase.from('kanban_tarefas').insert({
                    titulo: fase.titulo,
                    categoria: 'eventos',
                    status: 'entrada',
                    descricao: evento.observacoes || '',
                    created_by_name: 'Sistema (Fases)',
                    dados_especificos: {
                        local_evento: evento.local_detalhado || evento.local,
                        publico_estimado: evento.publico_estimado,
                        periodo_fase: fase.periodo,
                        vigilantes_escalados: fase.equipe_detalhe.map(p => `${p.nome} (R$ ${p.valor.toFixed(2)})`),
                        valor_previsto: fase.valor_previsto,
                        tipo_fase: fase.tipo
                    }
                })

                await supabase.from('op_postos').insert({
                    nome_posto: fase.titulo,
                    nivel_criticidade: evento.nivel_criticidade || (evento.tipo === 'Crítico' ? 1 : 3),
                    is_active: true,
                    exige_armamento: false
                })
            }

        } catch (autoError) {
            console.error("Erro na automação das fases do evento:", autoError)
        }

        return novoEvento
    }

    /**
     * Busca postos ativos
     */
    static async getPostos(): Promise<any[]> {
        const { data, error } = await supabase
            .from('op_postos')
            .select('*')
        
        if (error) throw error
        return data || []
    }

    /**
     * Busca alocações atuais (quem está em qual posto hoje)
     */
    static async getAlocacoesAtuais(): Promise<any[]> {
        const hoje = format(new Date(), 'yyyy-MM-dd')
        const { data, error } = await supabase
            .from('op_alocacoes')
            .select('*')
            .eq('data_alocacao', hoje)
        
        if (error) throw error
        return data || []
    }

    /**
     * Inicia uma pausa para um colaborador
     */
    static async startPause(colaborador_id: string, tipo_pausa: string, segundos: number, posto_anterior_id?: string, data_inicio?: string) {
        const { error } = await supabase
            .from('op_pausas')
            .insert({
                colaborador_id,
                tipo_pausa,
                segundos_duracao: segundos,
                posto_anterior_id,
                encerrada: false,
                data_inicio: data_inicio || new Date().toISOString()
            })
        
        if (error) throw error
    }

    /**
     * Encerra todas as pausas ativas de um colaborador
     */
    static async endPause(colaborador_id: string) {
        const { error } = await supabase
            .from('op_pausas')
            .update({ encerrada: true })
            .eq('colaborador_id', colaborador_id)
            .eq('encerrada', false)
        
        if (error) throw error
    }

    /**
     * Busca todas as pausas ativas do dia
     */
    static async getActivePauses(): Promise<any[]> {
        const { data, error } = await supabase
            .from('op_pausas')
            .select('*')
            .eq('encerrada', false)
        
        if (error) throw error
        return data || []
    }

    /**
     * Salva ou atualiza uma alocação
     */
    static async salvarAlocacao(colaborador_id: string, posto_id: string | null) {
        const hoje = format(new Date(), 'yyyy-MM-dd')
        
        // Sempre encerra pausas vigentes ao realizar qualquer movimentação de alocação/base
        await this.endPause(colaborador_id)

        if (!posto_id) {
            // Remove alocação
            const { error } = await supabase
                .from('op_alocacoes')
                .delete()
                .eq('colaborador_id', colaborador_id)
                .eq('data_alocacao', hoje)
            if (error) throw error
            return
        }

        // Se for alocado em um posto (não é null), encerra pausas ativas
        await this.endPause(colaborador_id)

        const { error } = await supabase
            .from('op_alocacoes')
            .upsert({
                colaborador_id,
                posto_id,
                data_alocacao: hoje,
                horario_alocacao: format(new Date(), 'HH:mm:ss')
            }, { onConflict: 'colaborador_id,data_alocacao' })
        
        if (error) throw error
    }

    /**
     * Garante que um posto exista pelo nome. Retorna o ID (UUID).
     */
    static async ensurePostoExists(nome: string): Promise<string> {
        // Primeiro tenta buscar por nome exato
        const { data: existente } = await supabase
            .from('op_postos')
            .select('id')
            .eq('nome_posto', nome)
            .maybeSingle()
        
        if (existente?.id) return existente.id

        // Se não existe, cria com o nome fornecido
        const { data: novo, error } = await supabase
            .from('op_postos')
            .insert({ nome_posto: nome })
            .select('id')
            .single()
        
        if (error) {
            console.error(`Erro ao criar posto ${nome}:`, error)
            throw error
        }
        
        return novo.id
    }

    /**
     * Busca tarefas de eventos ativos no Kanban
     */
    static async getEventosAtivosKanban(): Promise<any[]> {
        const { data: tarefas, error } = await supabase
            .from('kanban_tarefas')
            .select('*')
            .eq('categoria', 'eventos')
            .neq('status', 'concluido')
            .neq('status', 'historico')
        
        if (error) throw error
        if (!tarefas) return []

        // Linkar cada tarefa ao seu "posto" correspondente criado pelo createEvento
        const titulos = tarefas.map(t => t.titulo)
        const { data: postos } = await supabase
            .from('op_postos')
            .select('id, nome_posto')
            .in('nome_posto', titulos)

        return tarefas.map(t => ({
            ...t,
            posto_id: postos?.find(p => p.nome_posto === t.titulo)?.id
        }))
    }

    /**
     * Atualiza dados de um evento
     */
    static async updateEvento(id: string, dados: Partial<OpEvento>) {
        const { error } = await supabase
            .from('op_eventos')
            .update(dados)
            .eq('id', id)
        
        if (error) throw error
    }

    /**
     * Busca o status de convites de um evento
     */
    static async getConvitesEvento(eventoId: string): Promise<OpEventoEquipe[]> {
        const { data, error } = await supabase
            .from('op_eventos_equipe')
            .select('*')
            .eq('evento_id', eventoId)
        
        if (error) throw error
        return data || []
    }

    /**
     * Atualiza ou cria um status de convite
     */
    static async upsertConvite(dados: Partial<OpEventoEquipe>) {
        const { error } = await supabase
            .from('op_eventos_equipe')
            .upsert(dados, { onConflict: 'evento_id,colaborador_id,fase' })
        
        if (error) throw error
    }

    /**
     * Busca o próximo melhor profissional para substituir um recusado
     */
    static async findBestSubstitute(evento: OpEvento, fase: string, nivelAlvo: number, profissionaisExcluidos: string[]): Promise<OpEquipe | null> {
        const equipe = await this.getEquipe()
        const dataEv = evento.evento_inicio_data || evento.data_inicio
        const horaIni = evento.evento_inicio_hora || "08:00"
        const horaFim = evento.evento_fim_hora || "20:00"

        // Definir a ordem de busca baseada no nível alvo (prioridade flexível)
        let ordemNiveis: number[] = [nivelAlvo]
        if (nivelAlvo === 1) ordemNiveis = [1, 2, 3]
        else if (nivelAlvo === 2) ordemNiveis = [2, 1, 3]
        else ordemNiveis = [3, 2, 1]

        for (const nivel of ordemNiveis) {
            const candidatos = equipe.filter(m => 
                (m.nivel || 3) === nivel && 
                !profissionaisExcluidos.includes(m.id)
            )

            for (const candidato of candidatos) {
                const disp = await this.getDisponibilidade(candidato, dataEv, horaIni, horaFim)
                if (disp.status === 'disponivel') {
                    return candidato
                }
            }
        }

        return null
    }

    /**
     * Busca convites que estão em aberto há mais de X horas
     */
    static async getExpiredInvitations(hoursThreshold: number = 3): Promise<any[]> {
        const thresholdDate = new Date(Date.now() - hoursThreshold * 60 * 60 * 1000).toISOString()
        
        const { data, error } = await supabase
            .from('op_eventos_equipe')
            .select(`
                *,
                op_eventos (nome, data_inicio),
                op_equipe (nome_completo)
            `)
            .eq('status', 'CONVIDADO')
            .lt('data_convite', thresholdDate)
        
        if (error) throw error
        return data || []
    }

    /**
     * Remove um evento e seus dados relacionados (fases, convites, financeiro)
     */
    static async deleteEvento(id: string) {
        // 1. Remover convites
        await supabase.from('op_eventos_equipe').delete().eq('evento_id', id)
        
        // 2. Remover registros financeiros
        await supabase.from('op_financeiro_eventos').delete().eq('evento_id', id)
        
        // 3. Remover o evento em si
        const { error } = await supabase.from('op_eventos').delete().eq('id', id)
        
        if (error) throw error
    }

    /**
     * Reseta a escala manual de um período (deleta registros de op_escala_diaria)
     */
    static async clearManualScaleOverrides(dataInicio: string, dataFim: string) {
        const { error } = await supabase
            .from('op_escala_diaria')
            .delete()
            .gte('data_plantao', dataInicio)
            .lte('data_plantao', dataFim)
        
        if (error) throw error
    }

    /**
     * Marca um evento como concluído ou ativo usando o campo observações
     */
    /**
     * Busca o guia operacional para um turno específico
     */
    static async getShiftGuide(turno: 'Dia' | 'Noite'): Promise<any[]> {
        const { data, error } = await supabase
            .from('op_guia_turno')
            .select('*')
            .eq('turno', turno)
            .order('horario_alvo')
        
        if (error) throw error
        return data || []
    }

    /**
     * Registra uma movimentação tática no histórico
     */
    static async logMovimentacao(dados: {
        colaborador_id: string,
        colaborador_nome: string,
        acao: string,
        posto_origem?: string,
        posto_destino?: string,
        rendeu_quem_id?: string,
        rendeu_quem_nome?: string,
        duracao_prevista?: number
    }) {
        const { error } = await supabase
            .from('op_historico_movimentacoes')
            .insert({
                ...dados,
                created_at: new Date().toISOString()
            })
        
        if (error) {
            console.warn("Erro ao logar movimentação:", error)
        }
    }

    /**
     * Busca o histórico de movimentações de um dia (ou hoje)
     */
    static async getHistoricoMovimentacoes(data?: string): Promise<any[]> {
        const hoje = data || format(new Date(), 'yyyy-MM-dd')
        const { data: logs, error } = await supabase
            .from('op_historico_movimentacoes')
            .select('*')
            .gte('created_at', `${hoje}T00:00:00Z`)
            .lte('created_at', `${hoje}T23:59:59Z`)
            .order('created_at', { ascending: false })
        
        if (error) {
            console.error("Erro ao buscar histórico:", error)
            return []
        }
        return logs || []
    }
}
