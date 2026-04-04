"use client"

import { useState } from "react"
import { AlertTriangle, Clock } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface AvisoPrazoProps {
  aceitou: boolean
  onAceitar: (aceito: boolean) => void
}

export default function AvisoPrazo({ aceitou, onAceitar }: AvisoPrazoProps) {
  const handleAceitar = (checked: boolean) => {
    onAceitar(checked)
  }

  return (
    <div className="flex justify-center w-full py-4">
      <Card className="shadow-2xl border border-slate-200 bg-white max-w-2xl w-full overflow-hidden rounded-2xl">
        <CardHeader className="pb-4 bg-slate-50/50 border-b border-slate-100">
          <CardTitle className="text-xl font-bold text-slate-800 text-center flex items-center justify-center gap-2">
            <Clock className="h-5 w-5 text-blue-600" />
            Prazo de Análise
          </CardTitle>
          <div className="w-12 h-1 bg-blue-600 mx-auto rounded-full mt-1"></div>
        </CardHeader>

        <CardContent className="pt-6">
          <Alert className="border-blue-100 bg-blue-50/50 mb-6 rounded-xl">
            <AlertTriangle className="h-5 w-5 text-blue-600" />
            <AlertDescription className="text-slate-700 leading-relaxed pt-1">
              <span className="font-bold text-blue-800">Importante:</span> O prazo para análise e aprovação das solicitações é de{" "}
              <span className="font-bold text-blue-900 underline decoration-blue-300">24 horas úteis</span> a partir do envio. 
              Solicitações enviadas após às 17h ou em finais de semana e feriados serão processadas no próximo dia útil.
            </AlertDescription>
          </Alert>

          <div className="space-y-4 px-2">
            <div className="text-sm text-slate-600 space-y-3 font-medium">
              <p className="flex items-start gap-3">
                <span className="text-blue-500 mt-1">•</span>
                <span>Solicitações urgentes podem ser priorizadas mediante justificativa, estas, serão encaminhadas para conhecimento do <span className="text-slate-900 font-bold">gestor da segurança</span>.</span>
              </p>
              <p className="flex items-start gap-3">
                <span className="text-blue-500 mt-1">•</span>
                <span>Documentação incompleta pode atrasar o processo.</span>
              </p>
              <p className="flex items-start gap-3">
                <span className="text-blue-500 mt-1">•</span>
                <span>Você receberá notificação <span className="text-blue-700 font-bold italic">aqui mesmo pelo sistema</span>, confira na aba lateral em <span className="text-slate-900 font-bold">Solicitações do Departamento</span>.</span>
              </p>
            </div>

            <div className="flex items-center space-x-3 pt-6 bg-slate-50 -mx-8 px-8 py-4 mt-4 border-t border-slate-100">
              <Checkbox id="aceitar-prazo" checked={aceitou} onCheckedChange={handleAceitar} className="h-5 w-5 data-[state=checked]:bg-blue-600" />
              <Label htmlFor="aceitar-prazo" className="text-sm font-bold text-slate-800 cursor-pointer select-none">
                Li e aceito o prazo de análise de 24 horas úteis
              </Label>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
