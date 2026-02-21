"use client"

import { FileCheck, UserCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface TipoSolicitacaoProps {
  onTipoChange: (tipo: "checagem_liberacao" | "somente_liberacao") => void
  tipoSelecionado: string
}

export default function TipoSolicitacao({ onTipoChange, tipoSelecionado }: TipoSolicitacaoProps) {
  // Função que executa a mesma lógica para ambos os botões
  const handleTipoChange = (tipoVisual: "checagem_liberacao" | "somente_liberacao") => {
    // Ambos executam a mesma função internamente, mas mantêm o estado visual diferente
    onTipoChange(tipoVisual)
  }

  return (
    <Card className="shadow-lg border-0 bg-white">
      <CardHeader className="pb-4">
        <CardTitle className="text-xl font-bold text-slate-800 text-center">Tipo de Solicitação</CardTitle>
        <div className="w-16 h-1 bg-slate-600 mx-auto rounded-full"></div>
      </CardHeader>

      <CardContent>
        <Alert className="border-slate-200 bg-slate-50 mb-6">
          <FileCheck className="h-4 w-4 text-slate-600" />
          <AlertDescription className="text-slate-700">
            <strong>Escolha o tipo de solicitação:</strong> Checagem completa para novos prestadores ou apenas liberação
            para prestadores já aprovados.
          </AlertDescription>
        </Alert>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Button
            variant={tipoSelecionado === "checagem_liberacao" ? "default" : "outline"}
            onClick={() => handleTipoChange("checagem_liberacao")}
            className={`h-auto p-6 flex flex-col items-center gap-3 ${
              tipoSelecionado === "checagem_liberacao"
                ? "bg-slate-600 hover:bg-slate-700 text-white"
                : "border-slate-300 text-slate-700 hover:bg-slate-50"
            }`}
          >
            <FileCheck className="h-8 w-8" />
            <div className="text-center">
              <div className="font-semibold">Checagem + Liberação</div>
              <div className="text-sm opacity-80 mt-1">
                Para prestadores novos ou que precisam de nova checagem de documentos
              </div>
            </div>
          </Button>

          <Button
            variant={tipoSelecionado === "somente_liberacao" ? "default" : "outline"}
            onClick={() => handleTipoChange("somente_liberacao")}
            className={`h-auto p-6 flex flex-col items-center gap-3 ${
              tipoSelecionado === "somente_liberacao"
                ? "bg-slate-600 hover:bg-slate-700 text-white"
                : "border-slate-300 text-slate-700 hover:bg-slate-50"
            }`}
          >
            <UserCheck className="h-8 w-8" />
            <div className="text-center">
              <div className="font-semibold">Somente Liberação</div>
              <div className="text-sm opacity-80 mt-1">
                Para prestadores já aprovados que precisam apenas de liberação de acesso
              </div>
            </div>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
