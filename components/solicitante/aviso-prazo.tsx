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
    <Card className="shadow-lg border-0 bg-white">
      <CardHeader className="pb-4">
        <CardTitle className="text-xl font-bold text-slate-800 text-center flex items-center justify-center gap-2">
          <Clock className="h-5 w-5 text-slate-600" />
          Prazo de Análise
        </CardTitle>
        <div className="w-16 h-1 bg-slate-600 mx-auto rounded-full"></div>
      </CardHeader>

      <CardContent>
        <Alert className="border-slate-200 bg-slate-50 mb-4">
          <AlertTriangle className="h-4 w-4 text-slate-600" />
          <AlertDescription className="text-slate-700">
            <strong>Importante:</strong> O prazo para análise e aprovação das solicitações é de{" "}
            <strong>48 horas úteis</strong> a partir do envio. Solicitações enviadas após às 17h ou em finais de semana
            serão processadas no próximo dia útil.
          </AlertDescription>
        </Alert>

        <div className="space-y-3">
          <div className="text-sm text-slate-600 space-y-2">
            <p>• Solicitações urgentes podem ser priorizadas mediante justificativa</p>
            <p>• Documentação incompleta pode atrasar o processo</p>
            <p>• Você receberá notificação por email sobre o status da solicitação</p>
          </div>

          <div className="flex items-center space-x-2 pt-4">
            <Checkbox id="aceitar-prazo" checked={aceitou} onCheckedChange={handleAceitar} />
            <Label htmlFor="aceitar-prazo" className="text-sm font-medium text-slate-700 cursor-pointer">
              Li e aceito o prazo de análise de 48 horas úteis
            </Label>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
