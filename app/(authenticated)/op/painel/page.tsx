"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Users, LayoutDashboard, Settings, MapPin } from "lucide-react"
import GestaoEquipeV2 from "@/components/op/GestaoEquipeV2"

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
          <TabsTrigger value="equipe" className="rounded-lg gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm font-bold text-xs uppercase tracking-wider py-2.5 px-6">
            <Users className="h-4 w-4" />
            Escala de Equipe
          </TabsTrigger>
          <TabsTrigger value="postos" className="rounded-lg gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm font-bold text-xs uppercase tracking-wider py-2.5 px-6">
            <MapPin className="h-4 w-4" />
            Postos e Alocação
          </TabsTrigger>
          <TabsTrigger value="config" className="rounded-lg gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm font-bold text-xs uppercase tracking-wider py-2.5 px-6">
            <Settings className="h-4 w-4" />
            Configurações
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="border-none p-0 outline-none">
          <div className="h-[400px] flex items-center justify-center bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
            <div className="text-center space-y-2">
              <LayoutDashboard className="h-8 w-8 text-slate-300 mx-auto" />
              <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Em desenvolvimento</p>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="equipe" className="border-none p-0 outline-none animate-in fade-in duration-500">
          <GestaoEquipeV2 />
        </TabsContent>

        <TabsContent value="postos" className="border-none p-0 outline-none">
          <div className="h-[400px] flex items-center justify-center bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
            <div className="text-center space-y-2">
              <MapPin className="h-8 w-8 text-slate-300 mx-auto" />
              <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Em desenvolvimento</p>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="config" className="border-none p-0 outline-none">
          <div className="h-[400px] flex items-center justify-center bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
            <div className="text-center space-y-2">
              <Settings className="h-8 w-8 text-slate-300 mx-auto" />
              <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Em desenvolvimento</p>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
