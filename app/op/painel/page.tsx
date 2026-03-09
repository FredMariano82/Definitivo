"use client"

import { useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import Header from "@/components/header"
import Navigation from "@/components/navigation"
import { Users, MapPin, CalendarClock, ShieldAlert } from "lucide-react"
import GestaoEquipe from "@/components/op/gestao-equipe"
import GestaoPostos from "@/components/op/gestao-postos"
import GestaoEscalas from "@/components/op/gestao-escalas"
import { Button } from "@/components/ui/button"

export default function PainelOperacional() {
    const { usuario } = useAuth()
    const [activeTab, setActiveTab] = useState("escala")

    if (!usuario) return null

    // Proteção simples de rota
    if (usuario.perfil !== "administrador" && usuario.perfil !== "superadmin") {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="bg-white p-8 border rounded-xl shadow-sm text-center">
                    <ShieldAlert className="w-12 h-12 text-red-500 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-slate-800">Acesso Negado</h2>
                    <p className="text-slate-600 mt-2">Você não tem permissão para acessar o Módulo Operacional.</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-slate-50">
            <Header />
            <Navigation />

            <main className="max-w-7xl mx-auto px-4 py-8">
                <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-800">Gestão Operacional</h1>
                        <p className="text-slate-600 mt-1">Gerencie sua equipe, postos de trabalho e escalas diárias.</p>
                    </div>
                </div>

                {/* Tabs de Navegação Interna */}
                <div className="flex gap-2 p-1 bg-white border rounded-xl w-fit shadow-sm mb-8">
                    <Button
                        variant={activeTab === "escala" ? "default" : "ghost"}
                        onClick={() => setActiveTab("escala")}
                        className={`gap-2 ${activeTab === "escala" ? "bg-blue-600 text-white shadow-md hover:bg-blue-700" : "text-slate-600"}`}
                    >
                        <CalendarClock className="w-4 h-4" />
                        Escala Diária
                    </Button>
                    <Button
                        variant={activeTab === "equipe" ? "default" : "ghost"}
                        onClick={() => setActiveTab("equipe")}
                        className={`gap-2 ${activeTab === "equipe" ? "bg-blue-600 text-white shadow-md hover:bg-blue-700" : "text-slate-600"}`}
                    >
                        <Users className="w-4 h-4" />
                        Minha Equipe
                    </Button>
                    <Button
                        variant={activeTab === "postos" ? "default" : "ghost"}
                        onClick={() => setActiveTab("postos")}
                        className={`gap-2 ${activeTab === "postos" ? "bg-blue-600 text-white shadow-md hover:bg-blue-700" : "text-slate-600"}`}
                    >
                        <MapPin className="w-4 h-4" />
                        Postos de Trabalho
                    </Button>
                </div>

                {/* Área de Conteúdo */}
                <div className="bg-white border rounded-xl shadow-sm min-h-[500px] p-6">
                    {activeTab === "escala" && (
                        <GestaoEscalas />
                    )}

                    {activeTab === "equipe" && (
                        <div className="text-center py-20 text-slate-500">
                            <Users className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                            <h3 className="text-xl font-medium text-slate-700">Gestão da Equipe</h3>
                            <p className="mt-2">Em breve: Cadastro de membros, funções (VSPP, Vigilante) e escalas base.</p>
                        </div>
                    )}

                    {activeTab === "postos" && (
                        <GestaoPostos />
                    )}
                </div>
            </main>
        </div>
    )
}
