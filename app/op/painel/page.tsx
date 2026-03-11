"use client"

import { useState } from "react"
<<<<<<< HEAD
import { Users, MapPin, CalendarClock } from "lucide-react"
=======
import { useAuth } from "@/contexts/auth-context"
import Header from "@/components/header"
import Navigation from "@/components/navigation"
import { Users, MapPin, CalendarClock, ShieldAlert, Clock } from "lucide-react"
import GestaoEquipe from "@/components/op/gestao-equipe"
>>>>>>> 71654de0c7b5b52a3611ed3d61844ed1616577f6
import GestaoPostos from "@/components/op/gestao-postos"
import GestaoEscalas from "@/components/op/gestao-escalas"
import GestaoRendicoes from "@/components/op/gestao-rendicoes"
import { Button } from "@/components/ui/button"

export default function PainelOperacional() {
    const [activeTab, setActiveTab] = useState("escala")

    return (
        <div className="min-h-screen bg-slate-50">
            <main className="max-w-[1600px] mx-auto px-4 py-8">
                <div className="mb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-800">Operação em Tempo Real</h1>
                        <p className="text-slate-600 mt-1">Painel Tático: Alocação e Giros de Base.</p>
                    </div>
                </div>

                {/* Tabs de Navegação Interna */}
                <div className="flex gap-2 p-1 bg-white border rounded-xl w-fit shadow-sm mb-4">
                    <Button
                        variant={activeTab === "escala" ? "default" : "ghost"}
                        onClick={() => setActiveTab("escala")}
                        className={`gap-2 ${activeTab === "escala" ? "bg-blue-600 text-white shadow-md hover:bg-blue-700" : "text-slate-600"}`}
                    >
                        <CalendarClock className="w-4 h-4" />
                        Painel Tático (Escala)
                    </Button>
                    <Button
                        variant={activeTab === "rendicoes" ? "default" : "ghost"}
                        onClick={() => setActiveTab("rendicoes")}
                        className={`gap-2 ${activeTab === "rendicoes" ? "bg-indigo-600 text-white shadow-md hover:bg-indigo-700" : "text-slate-600"}`}
                    >
                        <Clock className="w-4 h-4" />
                        Roteiro de Pausas
                    </Button>
                    <Button
                        variant={activeTab === "equipe" ? "default" : "ghost"}
                        onClick={() => setActiveTab("equipe")}
                        className={`gap-2 ${activeTab === "equipe" ? "bg-blue-600 text-white shadow-md hover:bg-blue-700" : "text-slate-600"}`}
                    >
                        <Users className="w-4 h-4" />
                        Gerir Equipe
                    </Button>
                    <Button
                        variant={activeTab === "postos" ? "default" : "ghost"}
                        onClick={() => setActiveTab("postos")}
                        className={`gap-2 ${activeTab === "postos" ? "bg-blue-600 text-white shadow-md hover:bg-blue-700" : "text-slate-600"}`}
                    >
                        <MapPin className="w-4 h-4" />
                        Editar Postos
                    </Button>
                </div>

                {/* Área de Conteúdo */}
                <div className="min-h-[500px]">
                    {activeTab === "escala" && (
                        <GestaoEscalas />
                    )}

                    {activeTab === "rendicoes" && (
                        <GestaoRendicoes />
                    )}

                    {activeTab === "equipe" && (
                        <div className="bg-white border rounded-xl shadow-sm p-6 text-center py-20 text-slate-500">
                            <Users className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                            <h3 className="text-xl font-medium text-slate-700">Gestão da Equipe</h3>
                            <p className="mt-2">Módulo em construção.</p>
                        </div>
                    )}

                    {activeTab === "postos" && (
                        <div className="bg-white border rounded-xl shadow-sm p-6">
                            <GestaoPostos />
                        </div>
                    )}
                </div>
            </main>
        </div>
    )
}

