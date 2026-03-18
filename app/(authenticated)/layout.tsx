"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import Header from "@/components/header"
import Navigation from "@/components/navigation"
import InvitationMonitor from "@/components/op/InvitationMonitor"

export default function AuthenticatedLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const { usuario, isLoading } = useAuth()
    const router = useRouter()

    useEffect(() => {
        if (!isLoading && !usuario) {
            router.push("/login")
        }
    }, [usuario, isLoading, router])

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-800 via-slate-900 to-blue-900 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
                    <p className="text-white">Carregando...</p>
                </div>
            </div>
        )
    }

    if (!usuario) return null

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            <Header />
            <div className="flex flex-1">
                <Navigation />
                <main className="flex-1 p-6 md:ml-72 transition-all duration-300">
                    <div className="max-w-none mx-auto">
                        {children}
                    </div>
                </main>
            </div>
            <InvitationMonitor />
        </div>
    )
}
