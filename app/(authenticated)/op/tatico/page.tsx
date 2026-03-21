"use client"

import PainelTaticoV2 from "@/components/op/PainelTaticoV2"

export default function TaticoPage() {
    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-black tracking-tight text-slate-900">Painel Tático</h1>
                <p className="text-slate-500 font-medium">Monitoramento em tempo real de postos, rendições e pausas.</p>
            </div>
            
            <PainelTaticoV2 />
        </div>
    )
}
