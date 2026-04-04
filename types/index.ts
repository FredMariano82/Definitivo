export interface Usuario {
  id: string
  nome: string
  email: string
  departamento: string
  departamento_id?: number // PRODUÇÃO REAL: ID departamento para relação interna
  funcao?: string // PRODUÇÃO REAL: Nomenclatura operacional/função
  perfil: "solicitante" | "aprovador" | "administrador" | "gestor" | "recepcao" | "suporte" | "superadmin" | "operador" | "coordenador" | "encarregado"
}

export type StatusChecagem = "pendente" | "aprovada" | "reprovada" | "vencida" | "excecao" | "erro_rg" | "aprovado" | "reprovado" | "revisar" | "base"
export type StatusLiberacao = "pendente" | "urgente" | "vencida" | "Ok" | "Não Ok" | "ok" | "negada"

// Atualizar a interface PrestadorAvaliacao
export interface PrestadorAvaliacao {
  id: string
  nome: string
  doc1: string
  doc2?: string // PRODUÇÃO REAL: Campo doc2 adicionado
  checagem: StatusChecagem
  checagemValidaAte?: string
  liberacao: StatusLiberacao
  observacoes?: string
  aprovadoPor?: string
  dataAvaliacao?: string
  horasRestantes?: number // Nova propriedade para o contador regressivo
  justificativa?: string // Para casos de exceção
  empresa?: string // PRODUÇÃO REAL: Campo empresa específica adicionado
  horario_entrada?: string // Opcional para check-in
  horario_saida?: string // Opcional para check-out
  registrado_por_entrada?: string
  registrado_por_saida?: string
}

export interface PrestadorHistorico {
  doc1: string
  nome: string
  dataAprovacao?: string
  validadeChecagem?: string
  dataFinal?: string
  checagem: StatusChecagem | "valido" | "vencido" | "sem_historico"
  liberacao?: StatusLiberacao
  empresa?: string
}

export interface Solicitacao {
  id: string
  numero: string
  solicitante: string
  departamento: string
  departamento_id?: number // PRODUÇÃO REAL: ID do departamento
  dataSolicitacao: string
  dataSolicitacaoRaw?: string // YYYY-MM-DD
  horaSolicitacao: string
  horaSolicitacaoRaw?: string // HH:mm:ss
  tipoSolicitacao: "checagem_liberacao" | "somente_liberacao"
  finalidade: "evento" | "obra"
  local: string
  empresa: string
  prestadores: PrestadorAvaliacao[]
  dataInicial: string
  dataFinal: string
  statusGeral: "pendente" | "aprovado" | "reprovado" | "parcial" | "base" | "pendente_gestor"
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
  doc1: string
  doc2?: string // PRODUÇÃO REAL: Campo Doc2 adicionado
  empresa?: string // PRODUÇÃO REAL: Campo Empresa individual adicionado
}

// 🆕 NOVA INTERFACE PARA MIGRAÇÃO DE DADOS DO SUPORTE
export interface DadosMigracao {
  id?: string // Gerado automaticamente
  solicitante: string // Automático (usuário logado)
  departamento: string // Manual
  dataSolicitacao: string // Manual
  nome: string // Manual
  doc1: string // Manual
  doc2?: string // Manual (opcional)
  empresa: string // Manual
  dataInicial: string // Manual
  dataFinal?: string // Manual (opcional)
  liberacao?: string // Automático ("Ok" se dataFinal preenchida)
  checagem: string // Automático ("aprovado")
  checagemValidaAte: string // Automático (dataSolicitacao + 6 meses)
}
