"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import Header from "@/components/header"
import Navigation from "@/components/navigation"
import InvitationMonitor from "@/components/op/InvitationMonitor"
import { ThemeProvider } from "@/contexts/theme-context"

export default function AuthenticatedLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const { usuario, isLoading } = useAuth()
    const [isCollapsed, setIsCollapsed] = useState(false)
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
        <ThemeProvider>
            <AuthenticatedLayoutContent isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed}>
                {children}
            </AuthenticatedLayoutContent>
        </ThemeProvider>
    )
}

function AuthenticatedLayoutContent({ 
    children, 
    isCollapsed, 
    setIsCollapsed 
}: { 
    children: React.ReactNode, 
    isCollapsed: boolean, 
    setIsCollapsed: (v: boolean) => void 
}) {
    return (
        <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 transition-colors duration-500">
            <Header 
                isCollapsed={isCollapsed} 
                onToggle={() => setIsCollapsed(!isCollapsed)} 
            />
            <div className="flex flex-1">
                <Navigation 
                    isCollapsed={isCollapsed} 
                    onToggle={() => setIsCollapsed(!isCollapsed)} 
                />
                <main className={`flex-1 p-6 ${isCollapsed ? 'md:ml-20' : 'md:ml-72'} transition-all duration-300`}>
                    <div className="max-w-none mx-auto">
                        {children}
                    </div>
                </main>
            </div>
            <InvitationMonitor />
        </div>
    )
}

