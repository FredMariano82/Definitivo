/**
 * Componente para indicar urgência da Data Inicial
 * 🚨 VERMELHO: Data = hoje ou já passou (CRÍTICO)
 * ⚡ LARANJA: Data em 1-3 dias (URGENTE)
 * ⚪ NORMAL: Demais casos
 */

interface DataInicialIndicatorProps {
  dataInicial: string // Formato: "DD/MM/AAAA"
  isReprovado?: boolean // Se prestador foi reprovado, mostrar "-"
  mostrarUrgencia?: boolean // Se deve mostrar cores de urgência baseado no status da liberação
}

export function DataInicialIndicator({
  dataInicial,
  isReprovado = false,
  mostrarUrgencia = true,
}: DataInicialIndicatorProps) {
  // Se prestador foi reprovado, não mostrar data
  if (isReprovado) {
    return <span className="text-slate-400">-</span>
  }

  // Se não deve mostrar urgência, retornar data normal
  if (!mostrarUrgencia) {
    return <span>{dataInicial}</span>
  }

  // Converter data brasileira para Date
  const [dia, mes, ano] = dataInicial.split("/").map(Number)
  const dataInicialDate = new Date(ano, mes - 1, dia)

  // Data atual (sem horário para comparação precisa)
  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)

  // Calcular diferença em dias
  const diferencaMs = dataInicialDate.getTime() - hoje.getTime()
  const diferencaDias = Math.ceil(diferencaMs / (1000 * 60 * 60 * 24))

  // 🚨 CRÍTICO: Data = hoje ou já passou
  if (diferencaDias <= 0) {
    return <span className="inline-flex items-center gap-1 text-red-600 font-bold">🚨 {dataInicial}</span>
  }

  // ⚡ URGENTE: Data em 1-3 dias
  else if (diferencaDias <= 3) {
    return <span className="inline-flex items-center gap-1 text-orange-600 font-semibold">⚡ {dataInicial}</span>
  }

  // ⚪ NORMAL: Demais casos
  else {
    return <span>{dataInicial}</span>
  }
}
