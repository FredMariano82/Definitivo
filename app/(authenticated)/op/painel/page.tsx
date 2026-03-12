"use client"

import { useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Users, MapPin, CalendarClock, Clock } from "lucide-react"
import GestaoPostos from "@/components/op/gestao-postos"
import GestaoEscalas from "@/components/op/gestao-escalas"
import GestaoEquipe from "@/components/op/gestao-equipe"
import GestaoRendicoes from "@/components/op/gestao-rendicoes"
import { Button } from "@/components/ui/button"
import PageHeader from "@/components/page-header"

export default function PainelOperacional() {
    const [activeTab, setActiveTab] = useState("escala")

    return (
        <div className="min-h-screen bg-white">
            <PageHeader
                title="Operação em Tempo Real"
                subtitle="Painel Tático: Alocação e Giros de Base."
                backHref="/admin/dashboard"
            />

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
                    <GestaoEquipe />
                )}

                {activeTab === "postos" && (
                    <div className="bg-white border rounded-xl shadow-sm p-6">
                        <GestaoPostos />
                    </div>
                )}
            </div>
        </div>
    )
}
