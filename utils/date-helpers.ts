/**
 * Utilitários para verificação de datas e vencimentos
 */

export function isDateExpired(dateString: string): boolean {
  if (!dateString) return false

  try {
    // Converte data no formato DD/MM/YYYY para Date
    const [day, month, year] = dateString.split("/")
    const targetDate = new Date(Number(year), Number(month) - 1, Number(day))

    // USAR DATA ATUAL REAL DO SISTEMA
    const today = new Date()

    // Zerar horas para comparar apenas a data
    today.setHours(0, 0, 0, 0)
    targetDate.setHours(0, 0, 0, 0)

    return targetDate < today
  } catch (error) {
    console.error("Erro ao verificar data:", error)
    return false
  }
}

export function formatDateBR(date: Date): string {
  const dia = String(date.getDate()).padStart(2, "0")
  const mes = String(date.getMonth() + 1).padStart(2, "0")
  const ano = date.getFullYear()

  return `${dia}/${mes}/${ano}`
}

// Função para converter data no formato DD/MM/YYYY para objeto Date
export function converterDataBrParaDate(dataBr: string): Date | null {
  if (!dataBr) return null

  try {
    const [dia, mes, ano] = dataBr.split("/").map(Number)
    return new Date(ano, mes - 1, dia) // Mês é 0-indexado em JavaScript
  } catch (error) {
    console.error("Erro ao converter data:", error)
    return null
  }
}

// Função para converter data no formato YYYY-MM-DD para objeto Date
export function converterDataIsoParaDate(dataIso: string): Date | null {
  if (!dataIso) return null

  try {
    return new Date(dataIso)
  } catch (error) {
    console.error("Erro ao converter data ISO:", error)
    return null
  }
}

// Função para obter a data atual do sistema
export function getCurrentDate(): Date {
  // USAR DATA ATUAL REAL DO SISTEMA
  return new Date()
}

// Função para formatar data ISO para formato brasileiro DD/MM/AAAA
export function formatarDataParaBR(dataISO: string): string {
  if (!dataISO) return ""

  try {
    // Criar data a partir da string ISO sem ajuste de fuso horário
    const [ano, mes, dia] = dataISO.split("T")[0].split("-").map(Number)
    return `${String(dia).padStart(2, "0")}/${String(mes).padStart(2, "0")}/${ano}`
  } catch (error) {
    console.error("Erro ao formatar data:", error)
    return dataISO // Retorna original se houver erro
  }
}

// Adicionar uma função para converter data brasileira para ISO sem ajuste de fuso
export function converterDataBrParaISO(dataBr: string): string {
  if (!dataBr) return ""

  try {
    const [dia, mes, ano] = dataBr.split("/").map(Number)
    return `${ano}-${String(mes).padStart(2, "0")}-${String(dia).padStart(2, "0")}`
  } catch (error) {
    console.error("Erro ao converter data BR para ISO:", error)
    return ""
  }
}

// Função para verificar se uma data final já passou (para status de liberação)
export function isDataFinalVencida(dataFinal: string): boolean {
  if (!dataFinal) return false

  try {
    // Converte data no formato DD/MM/YYYY para Date
    const [day, month, year] = dataFinal.split("/")
    const dataFinalDate = new Date(Number(year), Number(month) - 1, Number(day))

    // USAR DATA ATUAL REAL DO SISTEMA
    const hoje = new Date()

    // Zerar horas para comparar apenas a data
    hoje.setHours(0, 0, 0, 0)
    dataFinalDate.setHours(0, 0, 0, 0)

    // Se a data final já passou, está vencida
    return dataFinalDate < hoje
  } catch (error) {
    console.error("Erro ao verificar data final:", error)
    return false
  }
}

// Função para calcular horas restantes até uma data específica
export function calcularHorasRestantes(dataString: string): number {
  if (!dataString) return 0

  try {
    let dataLimite: Date

    // Se está no formato DD/MM/YYYY
    if (dataString.includes("/")) {
      const [dia, mes, ano] = dataString.split("/")
      dataLimite = new Date(Number(ano), Number(mes) - 1, Number(dia))
    }
    // Se está no formato ISO (YYYY-MM-DD)
    else if (dataString.includes("-")) {
      dataLimite = new Date(dataString)
    }
    // Tentar criar Date object diretamente
    else {
      dataLimite = new Date(dataString)
    }

    if (isNaN(dataLimite.getTime())) {
      console.warn("⚠️ Data inválida para calcular horas:", dataString)
      return 0
    }

    // USAR DATA ATUAL REAL DO SISTEMA
    const agora = new Date()
    const diffMs = dataLimite.getTime() - agora.getTime()
    const diffHoras = Math.floor(diffMs / (1000 * 60 * 60))

    // Se já passou, retornar 0
    return diffHoras > 0 ? diffHoras : 0
  } catch (error) {
    console.error("❌ Erro ao calcular horas restantes:", error)
    return 0
  }
}

// Função para formatar horas restantes de forma legível
export function formatarHorasRestantes(horas: number): string {
  if (horas <= 0) return "Vencido"
  if (horas <= 24) return `${horas}h (Urgente)`

  const dias = Math.floor(horas / 24)
  const horasRestantes = horas % 24

  if (horasRestantes === 0) {
    return `${dias}d`
  } else {
    return `${dias}d ${horasRestantes}h`
  }
}

// Função para converter data ISO (YYYY-MM-DD) para formato brasileiro (DD/MM/AAAA) SEM fuso horário
export function formatarDataISOParaBR(dataISO: string): string {
  if (!dataISO) return ""

  try {
    // Extrair ano, mês e dia diretamente da string ISO
    const [ano, mes, dia] = dataISO.split("T")[0].split("-")
    return `${dia}/${mes}/${ano}`
  } catch (error) {
    console.error("Erro ao formatar data ISO para BR:", error)
    return dataISO // Retorna original se houver erro
  }
}

// Função para converter data brasileira (DD/MM/AAAA) para ISO (YYYY-MM-DD) SEM fuso horário
export function converterDataBRParaISO(dataBR: string): string {
  if (!dataBR) return ""

  try {
    const [dia, mes, ano] = dataBR.split("/")
    return `${ano}-${mes.padStart(2, "0")}-${dia.padStart(2, "0")}`
  } catch (error) {
    console.error("Erro ao converter data BR para ISO:", error)
    return ""
  }
}

// Função para verificar se uma data está vencida (comparação sem fuso horário)
export function isDateExpiredSemFuso(dateString: string): boolean {
  if (!dateString) return false

  try {
    let targetDate: Date

    // Se está no formato DD/MM/YYYY
    if (dateString.includes("/")) {
      const [day, month, year] = dateString.split("/")
      targetDate = new Date(Number(year), Number(month) - 1, Number(day))
    }
    // Se está no formato YYYY-MM-DD
    else if (dateString.includes("-")) {
      const [year, month, day] = dateString.split("-")
      targetDate = new Date(Number(year), Number(month) - 1, Number(day))
    } else {
      return false
    }

    // Data atual sem horário
    const today = new Date()
    const todayWithoutTime = new Date(today.getFullYear(), today.getMonth(), today.getDate())

    return targetDate < todayWithoutTime
  } catch (error) {
    console.error("Erro ao verificar data:", error)
    return false
  }
}
