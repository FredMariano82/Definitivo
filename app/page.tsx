"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "../contexts/auth-context"

export default function RootPage() {
  const { usuario, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading) {
      if (!usuario) {
        router.push("/login")
      } else {
        if (usuario.perfil === "solicitante") {
          router.push("/solicitante/nova-solicitacao")
        } else if (usuario.perfil === "aprovador") {
          router.push("/aprovador/pendentes")
        } else if (usuario.perfil === "administrador") {
          router.push("/admin/dashboard")
        } else if (usuario.perfil === "gestor") {
          router.push("/gestor/consulta")
        } else if (usuario.perfil === "recepcao") {
          router.push("/recepcao/todas")
        } else if (usuario.perfil === "suporte") {
          router.push("/suporte/migracao")
        } else if (usuario.perfil === "superadmin") {
          router.push("/superadmin/painel")
        } else {
          router.push("/solicitante/nova-solicitacao")
        }
      }
    }
  }, [usuario, isLoading, router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-800 via-slate-900 to-blue-900 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
        <p className="text-white">Carregando...</p>
      </div>
    </div>
  )
}
