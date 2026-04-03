"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Users, LayoutDashboard, Settings, Calendar } from "lucide-react"
import GestaoEquipeV2 from "@/components/op/GestaoEquipeV2"
import DashboardOperacional from "@/components/op/DashboardOperacional"
import ConfiguracoesOperacionais from "@/components/op/ConfiguracoesOperacionais"
import GestaoEventos from "@/components/op/GestaoEventos"
import PainelTaticoV2 from "@/components/op/PainelTaticoV2"
import { Crosshair } from "lucide-react"

export default function PainelOperacional() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-black tracking-tight text-slate-900">Gestão Operacional</h1>
        <p className="text-slate-500 font-medium">Controle de efetivo, escalas e postos de serviço em tempo real.</p>
      </div>

      <Tabs defaultValue="equipe" className="w-full space-y-6">
        <TabsList className="bg-slate-200/50 p-1 gap-1 rounded-xl border border-slate-200 shadow-sm">
          <TabsTrigger value="dashboard" className="rounded-lg gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm font-bold text-xs uppercase tracking-wider py-2.5 px-6">
            <LayoutDashboard className="h-4 w-4" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="eventos" className="rounded-lg gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm font-bold text-xs uppercase tracking-wider py-2.5 px-6">
            <Calendar className="h-4 w-4" />
            Eventos
          </TabsTrigger>
          <TabsTrigger value="equipe" className="rounded-lg gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm font-bold text-xs uppercase tracking-wider py-2.5 px-6">
            <Users className="h-4 w-4" />
            Escala de Equipe
          </TabsTrigger>
          <TabsTrigger value="config" className="rounded-lg gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm font-bold text-xs uppercase tracking-wider py-2.5 px-6">
            <Settings className="h-4 w-4" />
            Configurações
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="border-none p-0 outline-none animate-in fade-in duration-500">
          <DashboardOperacional />
        </TabsContent>

        <TabsContent value="eventos" className="border-none p-0 outline-none animate-in fade-in duration-500">
          <GestaoEventos />
        </TabsContent>

        <TabsContent value="equipe" className="border-none p-0 outline-none animate-in fade-in duration-500">
          <GestaoEquipeV2 />
        </TabsContent>

        
        <TabsContent value="config" className="border-none p-0 outline-none animate-in fade-in duration-500">
          <ConfiguracoesOperacionais />
        </TabsContent>
      </Tabs>
    </div>
  )
}
