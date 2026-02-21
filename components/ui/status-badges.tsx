import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle, Clock, AlertTriangle, ShieldAlert } from "lucide-react"
import type { StatusChecagem, StatusCadastro, PrestadorAvaliacao } from "../../types"
import { isDateExpired } from "../../utils/date-helpers"

// Função para calcular o status real da checagem
export function getChecagemStatus(prestador: PrestadorAvaliacao): StatusChecagem {
  // Se foi reprovado, mantém reprovado
  if (prestador.status === "reprovada") {
    return "reprovada"
  }

  // Se é exceção, mantém exceção
  if (prestador.status === "excecao") {
    return "excecao"
  }

  // Se foi aprovado, verifica se ainda está válido
  if (prestador.status === "aprovada" && prestador.checagemValidaAte) {
    const isExpired = isDateExpired(prestador.checagemValidaAte)
    return isExpired ? "vencida" : "aprovada"
  }

  // Se está pendente, mantém pendente
  return prestador.status
}

// Função para calcular o status real do cadastro (Liberação)
export function getCadastroStatus(prestador: PrestadorAvaliacao, dataFinal: string): StatusCadastro {
  // Se foi negada pelo admin, mantém negada
  if (prestador.cadastro === "negada") {
    return "negada"
  }

  // Se a Data Final já passou, status é "vencida"
  if (dataFinal && isDateExpired(dataFinal)) {
    return "vencida"
  }

  // Caso contrário, usa o status original do cadastro
  return prestador.cadastro
}

// Componentes de Badge para Checagem
export function StatusChecagemBadge({ status }: { status: StatusChecagem }) {
  const variants = {
    pendente: "bg-yellow-100 text-yellow-800 border-yellow-200",
    aprovada: "bg-green-100 text-green-800 border-green-200",
    reprovada: "bg-red-100 text-red-800 border-red-200",
    vencida: "bg-gray-100 text-gray-800 border-gray-200",
    excecao: "bg-purple-100 text-purple-800 border-purple-200",
    erro_rg: "bg-orange-100 text-orange-800 border-orange-200", // 🆕 NOVO STATUS
  }

  const labels = {
    pendente: "Pendente",
    aprovada: "Aprovada",
    reprovada: "Reprovada",
    vencida: "Vencida",
    excecao: "Exceção",
    erro_rg: "Erro RG", // 🆕 NOVO STATUS
  }

  // Normalizar o status para garantir compatibilidade
  const normalizedStatus =
    status === "aprovado" ? "aprovada" : status === "reprovado" ? "reprovada" : (status as StatusChecagem)

  return (
    <Badge variant="outline" className={`${variants[normalizedStatus]} font-semibold`}>
      {labels[normalizedStatus]}
    </Badge>
  )
}

// Componentes de Badge para Cadastro (Liberação)
export function StatusCadastroBadge({ status }: { status: StatusCadastro }) {
  // CORREÇÃO: Normalizar status para maiúsculo se necessário
  const normalizedStatus = (status as string) === "ok" ? "Ok" : (status as string) === "não ok" ? "Não Ok" : status

  const variants = {
    Ok: "bg-green-100 text-green-800 border-green-200",
    "Não Ok": "bg-red-100 text-red-800 border-red-200",
    pendente: "bg-yellow-100 text-yellow-800 border-yellow-200",
    urgente: "bg-red-100 text-red-800 border-red-200",
    vencida: "bg-gray-100 text-gray-800 border-gray-200",
    negada: "bg-red-100 text-red-800 border-red-200",
  }

  const labels = {
    Ok: "Ok",
    "Não Ok": "Não Ok",
    pendente: "Pendente",
    urgente: "Urgente",
    vencida: "Vencida",
    negada: "Negada",
  }

  return (
    <Badge variant="outline" className={`${variants[normalizedStatus]} font-semibold`}>
      {labels[normalizedStatus]}
    </Badge>
  )
}

// Componentes de Ícone para Checagem
export function StatusChecagemIcon({ status }: { status: StatusChecagem }) {
  // Normalizar o status para garantir compatibilidade
  const normalizedStatus =
    (status as string) === "aprovado" ? "aprovada" : (status as string) === "reprovado" ? "reprovada" : (status as StatusChecagem)

  const icons = {
    pendente: <Clock className="h-4 w-4 text-yellow-600" />,
    aprovada: <CheckCircle className="h-4 w-4 text-green-600" />,
    reprovada: <XCircle className="h-4 w-4 text-red-600" />,
    vencida: <AlertTriangle className="h-4 w-4 text-gray-600" />,
    excecao: <ShieldAlert className="h-4 w-4 text-purple-600" />,
    erro_rg: <ShieldAlert className="h-4 w-4 text-orange-600" />, // 🆕 NOVO STATUS
  }

  return icons[normalizedStatus]
}

// Componentes de Ícone para Cadastro (Liberação)
export function StatusCadastroIcon({ status }: { status: StatusCadastro }) {
  // CORREÇÃO: Normalizar status para maiúsculo se necessário
  const normalizedStatus = (status as string) === "ok" ? "Ok" : (status as string) === "não ok" ? "Não Ok" : status

  const icons = {
    Ok: <CheckCircle className="h-4 w-4 text-green-600" />,
    "Não Ok": <XCircle className="h-4 w-4 text-red-600" />,
    pendente: <Clock className="h-4 w-4 text-yellow-600" />,
    urgente: <AlertTriangle className="h-4 w-4 text-red-600" />,
    vencida: <XCircle className="h-4 w-4 text-gray-600" />,
    negada: <XCircle className="h-4 w-4 text-red-600" />, // 🆕 NOVO STATUS
  }

  return icons[normalizedStatus]
}
