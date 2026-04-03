"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import Header from "@/components/header"
import Navigation from "@/components/navigation"
import InvitationMonitor from "@/components/op/InvitationMonitor"
import { ThemeProvider } from "@/contexts/theme-context"
import { OraculoChat } from "@/components/op/OraculoChat"
import { Bot, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function AuthenticatedLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const { usuario, isLoading } = useAuth()
    const [isCollapsed, setIsCollapsed] = useState(false)
    const [isOraculoOpen, setIsOraculoOpen] = useState(false)
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
            <AuthenticatedLayoutContent 
                isCollapsed={isCollapsed} 
                setIsCollapsed={setIsCollapsed}
                isOraculoOpen={isOraculoOpen}
                setIsOraculoOpen={setIsOraculoOpen}
            >
                {children}
            </AuthenticatedLayoutContent>
        </ThemeProvider>
    )
}

function AuthenticatedLayoutContent({ 
    children, 
    isCollapsed, 
    setIsCollapsed,
    isOraculoOpen,
    setIsOraculoOpen
}: { 
    children: React.ReactNode, 
    isCollapsed: boolean, 
    setIsCollapsed: (v: boolean) => void,
    isOraculoOpen: boolean,
    setIsOraculoOpen: (v: boolean) => void
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

            {/* BOTÃO FLUTUANTE DO ORÁCULO GLOBAL */}
            <div className="fixed bottom-8 right-8 z-[9999] flex flex-col items-end gap-4">
                {isOraculoOpen && (
                    <div className="w-[450px] shadow-2xl animate-in fade-in slide-in-from-bottom-10 duration-500">
                        <OraculoChat onClose={() => setIsOraculoOpen(false)} />
                    </div>
                )}
                
                <Button 
                    onClick={() => setIsOraculoOpen(!isOraculoOpen)}
                    className={`h-16 w-16 rounded-full shadow-2xl transition-all duration-500 hover:scale-110 active:scale-95 border-none
                        ${isOraculoOpen 
                            ? 'bg-rose-500 hover:bg-rose-600 text-white' 
                            : 'bg-gradient-to-br from-blue-600 to-indigo-700 text-white'}`}
                >
                    {isOraculoOpen ? <XCircle className="h-8 w-8" /> : <Bot className="h-8 w-8" />}
                    {!isOraculoOpen && (
                        <span className="absolute -top-1 -right-1 flex h-5 w-5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-5 w-5 bg-emerald-500 border-2 border-white items-center justify-center text-[8px] font-black text-white">AI</span>
                        </span>
                    )}
                </Button>
            </div>
        </div>
    )
}

