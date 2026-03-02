import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle, Clock, AlertTriangle, ShieldAlert } from "lucide-react"
import type { StatusChecagem, StatusLiberacao, PrestadorAvaliacao } from "../../types"
import { isDateExpired } from "../../utils/date-helpers"

// Função para calcular o status real da checagem
export function getChecagemStatus(prestador: PrestadorAvaliacao): StatusChecagem {
  // Se foi reprovado, mantém reprovado
  if (prestador.checagem === "reprovada") {
    return "reprovada"
  }

  // Se é exceção, mantém exceção
  if (prestador.checagem === "excecao") {
    return "excecao"
  }

  // Se foi aprovado, verifica se ainda está válido
  if (prestador.checagem === "aprovada" && prestador.checagemValidaAte) {
    const isExpired = isDateExpired(prestador.checagemValidaAte)
    return isExpired ? "vencida" : "aprovada"
  }

  // Se está pendente, mantém pendente
  return prestador.checagem
}

// Função para calcular o status real da liberação
export function getLiberacaoStatus(prestador: PrestadorAvaliacao, dataFinal: string): StatusLiberacao {
  // Se foi negada pelo admin, mantém negada
  if (prestador.liberacao === "negada") {
    return "negada"
  }

  // Se a Data Final já passou, status é "vencida"
  if (dataFinal && isDateExpired(dataFinal)) {
    return "vencida"
  }

  // Caso contrário, usa o status original da liberação
  return prestador.liberacao
}

// Componentes de Badge para Checagem
export function StatusChecagemBadge({ status }: { status: StatusChecagem }) {
  const variants: Record<string, string> = {
    pendente: "bg-yellow-100 text-yellow-800 border-yellow-200",
    aprovada: "bg-green-100 text-green-800 border-green-200",
    aprovado: "bg-green-100 text-green-800 border-green-200",
    reprovada: "bg-red-100 text-red-800 border-red-200",
    reprovado: "bg-red-100 text-red-800 border-red-200",
    vencida: "bg-gray-100 text-gray-800 border-gray-200",
    excecao: "bg-purple-100 text-purple-800 border-purple-200",
    erro_rg: "bg-orange-100 text-orange-800 border-orange-200",
    revisar: "bg-fuchsia-100 text-fuchsia-800 border-fuchsia-200",
  }

  const labels: Record<string, string> = {
    pendente: "Pendente",
    aprovada: "Aprovada",
    aprovado: "Aprovada",
    reprovada: "Reprovada",
    reprovado: "Reprovada",
    vencida: "Vencida",
    excecao: "Exceção",
    erro_rg: "Erro RG",
    revisar: "Revisar",
  }

  // Normalizar o status para garantir compatibilidade
  const normalizedStatus = status as string

  return (
    <Badge variant="outline" className={`${variants[normalizedStatus] || variants.pendente} font-semibold`}>
      {labels[normalizedStatus] || normalizedStatus}
    </Badge>
  )
}

// Componentes de Badge para Liberação
export function StatusLiberacaoBadge({ status }: { status: StatusLiberacao }) {
  // CORREÇÃO: Normalizar status para maiúsculo se necessário
  const statusStr = String(status).toLowerCase()
  const normalizedStatus = statusStr === "ok" ? "Ok" : statusStr === "não ok" ? "Não Ok" : (status as string)

  const variants: Record<string, string> = {
    Ok: "bg-green-100 text-green-800 border-green-200",
    ok: "bg-green-100 text-green-800 border-green-200",
    "Não Ok": "bg-red-100 text-red-800 border-red-200",
    "não ok": "bg-red-100 text-red-800 border-red-200",
    pendente: "bg-yellow-100 text-yellow-800 border-yellow-200",
    urgente: "bg-red-100 text-red-800 border-red-200",
    vencida: "bg-gray-100 text-gray-800 border-gray-200",
    negada: "bg-red-100 text-red-800 border-red-200",
  }

  const labels: Record<string, string> = {
    Ok: "Ok",
    ok: "Ok",
    "Não Ok": "Não Ok",
    "não ok": "Não Ok",
    pendente: "Pendente",
    urgente: "Urgente",
    vencida: "Vencida",
    negada: "Negada",
  }

  return (
    <Badge variant="outline" className={`${variants[normalizedStatus] || variants.pendente} font-semibold`}>
      {labels[normalizedStatus] || normalizedStatus}
    </Badge>
  )
}

// Componentes de Ícone para Checagem
export function StatusChecagemIcon({ status }: { status: StatusChecagem }) {
  const normalizedStatus = status as string

  const icons: Record<string, JSX.Element> = {
    pendente: <Clock className="h-4 w-4 text-yellow-600" />,
    aprovada: <CheckCircle className="h-4 w-4 text-green-600" />,
    aprovado: <CheckCircle className="h-4 w-4 text-green-600" />,
    reprovada: <XCircle className="h-4 w-4 text-red-600" />,
    reprovado: <XCircle className="h-4 w-4 text-red-600" />,
    vencida: <AlertTriangle className="h-4 w-4 text-gray-600" />,
    excecao: <ShieldAlert className="h-4 w-4 text-purple-600" />,
    erro_rg: <ShieldAlert className="h-4 w-4 text-orange-600" />,
    revisar: <ShieldAlert className="h-4 w-4 text-fuchsia-600" />,
  }

  return icons[normalizedStatus] || icons.pendente
}

// Componentes de Ícone para Liberação
export function StatusLiberacaoIcon({ status }: { status: StatusLiberacao }) {
  // CORREÇÃO: Normalizar status para maiúsculo se necessário
  const statusStr = String(status).toLowerCase()
  const normalizedStatus = statusStr === "ok" ? "Ok" : statusStr === "não ok" ? "Não Ok" : (status as string)

  const icons: Record<string, JSX.Element> = {
    Ok: <CheckCircle className="h-4 w-4 text-green-600" />,
    ok: <CheckCircle className="h-4 w-4 text-green-600" />,
    "Não Ok": <XCircle className="h-4 w-4 text-red-600" />,
    "não ok": <XCircle className="h-4 w-4 text-red-600" />,
    pendente: <Clock className="h-4 w-4 text-yellow-600" />,
    urgente: <AlertTriangle className="h-4 w-4 text-red-600" />,
    vencida: <XCircle className="h-4 w-4 text-gray-600" />,
    negada: <XCircle className="h-4 w-4 text-red-600" />,
  }

  return icons[normalizedStatus] || icons.pendente
}
