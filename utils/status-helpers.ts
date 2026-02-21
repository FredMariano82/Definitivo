import { isDateExpired } from "./date-helpers"
import type { StatusChecagem, StatusCadastro, PrestadorAvaliacao } from "../types"

/**
 * Determina o status real da checagem considerando vencimento
 */
export function getChecagemStatus(prestador: PrestadorAvaliacao): StatusChecagem {
  // Se não tem checagem válida até, usar status original
  if (!prestador.checagemValidaAte) {
    return prestador.status as StatusChecagem
  }

  // Se a checagem está vencida, sobrescrever status
  if (isDateExpired(prestador.checagemValidaAte)) {
    return "vencida"
  }

  // Caso contrário, usar status original
  return prestador.status as StatusChecagem
}

/**
 * Determina o status real do cadastro considerando data final
 */
export function getCadastroStatus(prestador: PrestadorAvaliacao, dataFinal: string): StatusCadastro {
  // Se não tem data final, usar status original do prestador
  if (!dataFinal) {
    return prestador.cadastro as StatusCadastro
  }

  // Se a data final está vencida, retornar "vencida" (não "vencido")
  if (isDateExpired(dataFinal)) {
    return "vencida"
  }

  // Caso contrário, usar status original do prestador
  return prestador.cadastro as StatusCadastro
}

/**
 * Verifica se o acesso está próximo do vencimento (7 dias ou menos)
 */
export function isAccessExpiringSoon(dateString: string): boolean {
  if (!dateString) return false

  try {
    // Converte data no formato DD/MM/YYYY para Date
    const [day, month, year] = dateString.split("/")
    const targetDate = new Date(Number(year), Number(month) - 1, Number(day))

    // DATA ATUAL FIXADA EM 25/01/2024 para demonstração
    const today = new Date(2024, 0, 25) // Mês 0 = Janeiro (0-indexado)

    // Calcular diferença em dias
    const diffTime = targetDate.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    // Retorna true se está entre 1 e 7 dias do vencimento
    return diffDays <= 7 && diffDays > 0
  } catch (error) {
    console.error("Erro ao verificar proximidade do vencimento:", error)
    return false
  }
}
