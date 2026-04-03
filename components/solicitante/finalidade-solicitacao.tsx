"use client"
import { Building, Calendar } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"

interface FinalidadeSolicitacaoProps {
  onFinalidadeChange: (finalidade: "evento" | "obra") => void
  finalidadeSelecionada: string
}

export default function FinalidadeSolicitacao({
  onFinalidadeChange,
  finalidadeSelecionada,
}: FinalidadeSolicitacaoProps) {
  return (
    <Card className="border-green-200 bg-green-50">
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-green-800 mb-2">Finalidade da Solicitação</h3>
            <p className="text-sm text-green-700">Informe o que esta solicitação de acesso atenderá:</p>
          </div>

          <RadioGroup
            value={finalidadeSelecionada}
            onValueChange={(value) => onFinalidadeChange(value as "evento" | "obra")}
            className="space-y-4"
          >
            <div className="flex items-start space-x-3 p-4 border border-green-200 rounded-lg bg-white hover:bg-green-25 transition-colors">
              <RadioGroupItem value="evento" id="evento" className="mt-1" />
              <div className="flex-1">
                <Label htmlFor="evento" className="flex items-center gap-2 font-medium cursor-pointer">
                  <Calendar className="h-5 w-5 text-blue-600" />
                  Eventos
                </Label>
                <p className="text-sm text-gray-600 mt-1">
                  Tudo aquilo que se refere a <strong>convenções, festas, reuniões, campeonatos</strong> e etc.
                  <br />
                  <span className="text-green-700 font-medium">Exemplos:</span> Festa de aniversário, reunião de
                  diretoria, campeonato de tênis, convenção empresarial
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3 p-4 border border-green-200 rounded-lg bg-white hover:bg-green-25 transition-colors">
              <RadioGroupItem value="obra" id="obra" className="mt-1" />
              <div className="flex-1">
                <Label htmlFor="obra" className="flex items-center gap-2 font-medium cursor-pointer">
                  <Building className="h-5 w-5 text-orange-600" />
                  Serviços Gerais
                </Label>
                <p className="text-sm text-gray-600 mt-1">
                  Tudo aquilo que se refere a{" "}
                  <strong>reformas, manutenções periódicas, pequenos serviços de reparo</strong> ou até mesmo uma grande
                  obra.
                  <br />
                  <span className="text-green-700 font-medium">Exemplos:</span> Pintura, troca de equipamentos, reforma
                  de banheiro, manutenção de piscina
                </p>
              </div>
            </div>
          </RadioGroup>

          {finalidadeSelecionada && (
            <div className="mt-4 p-3 bg-green-100 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2 text-green-800">
                {finalidadeSelecionada === "evento" ? (
                  <Calendar className="h-4 w-4" />
                ) : (
                  <Building className="h-4 w-4" />
                )}
                <span className="text-sm font-medium">
                  Finalidade selecionada:{" "}
                  <strong>{finalidadeSelecionada === "evento" ? "Eventos" : "Serviços Gerais"}</strong>
                </span>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
