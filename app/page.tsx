"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "../contexts/auth-context"

export default function RootPage() {
  const router = useRouter()

  useEffect(() => {
    router.push("/admin/controle-chaves")
  }, [router])

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-slate-600">Redirecionando para o Painel Tático...</p>
      </div>
    </div>
  )
}
