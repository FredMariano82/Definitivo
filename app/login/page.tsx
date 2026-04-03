"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import LoginForm from "@/components/login-form"

export default function LoginPage() {
    const { usuario, isLoading } = useAuth()
    const router = useRouter()

    useEffect(() => {
        if (!isLoading && usuario) {
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
    }, [usuario, isLoading, router])

    if (isLoading) {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
            </div>
        )
    }

    return <LoginForm />
}
