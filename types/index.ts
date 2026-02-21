export interface Usuario {
  id: string
  nome: string
  email: string
  departamento: string
  departamento_id?: number // PRODUÇÃO REAL: ID departamento para relação interna
  perfil: "solicitante" | "aprovador" | "administrador" | "gestor" | "recepcao" | "suporte" | "superadmin"
}

export type StatusChecagem = "pendente" | "aprovada" | "reprovada" | "vencida" | "excecao" | "erro_rg" | "aprovado" | "reprovado"
export type StatusCadastro = "pendente" | "urgente" | "vencida" | "Ok" | "Não Ok" | "ok" | "negada"

// Atualizar a interface PrestadorAvaliacao
export interface PrestadorAvaliacao {
  id: string
  nome: string
  documento: string
  documento2?: string // PRODUÇÃO REAL: Campo documento2 adicionado
  status: StatusChecagem
  checagemValidaAte?: string
  cadastro: StatusCadastro
  observacoes?: string
  aprovadoPor?: string
  dataAvaliacao?: string
  horasRestantes?: number // Nova propriedade para o contador regressivo
  justificativa?: string // Para casos de exceção
  empresa?: string // PRODUÇÃO REAL: Campo empresa específica adicionado
}

export interface PrestadorHistorico {
  documento: string
  nome: string
  dataAprovacao?: string
  validadeChecagem?: string
  dataFinal?: string
  status: StatusChecagem | "valido" | "vencido" | "sem_historico"
  cadastro?: StatusCadastro
  empresa?: string
}

export interface Solicitacao {
  id: string
  numero: string
  solicitante: string
  departamento: string
  departamento_id?: number // PRODUÇÃO REAL: ID do departamento
  dataSolicitacao: string
  horaSolicitacao: string
  tipoSolicitacao: "checagem_liberacao" | "somente_liberacao"
  finalidade: "evento" | "obra"
  local: string
  empresa: string
  prestadores: PrestadorAvaliacao[]
  dataInicial: string
  dataFinal: string
  statusGeral: "pendente" | "aprovado" | "reprovado" | "parcial"
  observacoesGerais?: string
  economia?: "sustentavel" | "dispendioso" | "economico" | null
  custoChecagem: number
  economiaGerada?: number
  despesaGerada?: number // Nova propriedade para contabilizar despesas
}

export interface LogAlteracao {
  id: string
  solicitacaoId: string
  prestadorId?: string
  usuario: string
  dataAlteracao: string
  campoAlterado: string
  valorAnterior: string
  valorNovo: string
  justificativa: string
}

export interface DashboardMetrics {
  totalSolicitacoes: number
  solicitacoesPendentes: number
  solicitacoesAprovadas: number
  solicitacoesReprovadas: number
  totalChecagens: number
  custoTotal: number
  economiaTotal: number
  despesaTotal: number // Nova métrica
  solicitantesSustentaveis: number // Nova métrica
  solicitantesDispendiosos: number // Nova métrica
  sistemaEconomico: number // Nova métrica
  solicitacoesPorDepartamento: Record<string, number>
}

// Interface atualizada para prestador com novos campos
export interface Prestador {
  id: string
  nome: string
  documento: string
  documento2?: string // PRODUÇÃO REAL: Campo Doc2 adicionado
  empresa?: string // PRODUÇÃO REAL: Campo Empresa individual adicionado
}

// 🆕 NOVA INTERFACE PARA MIGRAÇÃO DE DADOS DO SUPORTE
export interface DadosMigracao {
  id?: string // Gerado automaticamente
  solicitante: string // Automático (usuário logado)
  departamento: string // Manual
  dataSolicitacao: string // Manual
  nome: string // Manual
  documento: string // Manual
  documento2?: string // Manual (opcional)
  empresa: string // Manual
  dataInicial: string // Manual
  dataFinal?: string // Manual (opcional)
  cadastro?: string // Automático ("Ok" se dataFinal preenchida)
  status: string // Automático ("aprovado")
  checagemValidaAte: string // Automático (dataSolicitacao + 6 meses)
}
