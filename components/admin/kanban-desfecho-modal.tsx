"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

export type DesfechoTipo = "sucesso" | "insucesso_tecnico" | "insucesso_operacional"

interface KanbanDesfechoModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (desfecho: DesfechoTipo, observacao: string) => void
  taskTitle: string
}

export function KanbanDesfechoModal({
  isOpen,
  onClose,
  onConfirm,
  taskTitle,
}: KanbanDesfechoModalProps) {
  const [desfecho, setDesfecho] = useState<DesfechoTipo>("sucesso")
  const [observacao, setObservacao] = useState("")

  const handleConfirm = () => {
    onConfirm(desfecho, observacao)
    setDesfecho("sucesso")
    setObservacao("")
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Finalizar Tarefa</DialogTitle>
          <DialogDescription>
            Selecione o desfecho para a tarefa: <strong className="text-foreground">{taskTitle}</strong>
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="space-y-4">
            <Label>Tipo de Desfecho</Label>
            <RadioGroup
              value={desfecho}
              onValueChange={(val) => setDesfecho(val as DesfechoTipo)}
              className="flex flex-col space-y-2"
            >
              <div className="flex items-center space-x-2 border p-3 rounded-md hover:bg-muted/50 cursor-pointer">
                <RadioGroupItem value="sucesso" id="sucesso" />
                <Label htmlFor="sucesso" className="cursor-pointer font-medium text-green-600 dark:text-green-500">
                  Sucesso
                </Label>
              </div>
              <div className="flex items-center space-x-2 border p-3 rounded-md hover:bg-muted/50 cursor-pointer border-l-4 border-l-yellow-500">
                <RadioGroupItem value="insucesso_tecnico" id="insucesso_tecnico" />
                <Label htmlFor="insucesso_tecnico" className="cursor-pointer font-medium">
                  Insucesso Técnico
                </Label>
              </div>
              <div className="flex items-center space-x-2 border p-3 rounded-md hover:bg-muted/50 cursor-pointer border-l-4 border-l-red-500">
                <RadioGroupItem value="insucesso_operacional" id="insucesso_operacional" />
                <Label htmlFor="insucesso_operacional" className="cursor-pointer font-medium">
                  Insucesso Operacional
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label htmlFor="observacao">Observações Adicionais (Opcional, porém recomendado em caso de Insucesso)</Label>
            <Textarea
              id="observacao"
              placeholder="Detalhes sobre a finalização ou o motivo do insucesso..."
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
              className="resize-none"
              rows={3}
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button type="button" onClick={handleConfirm}>
            Salvar e Finalizar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
