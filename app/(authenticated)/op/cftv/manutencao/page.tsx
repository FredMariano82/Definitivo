"use client"

import { useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { 
  Wrench, 
  Video, 
  MapPin, 
  AlertTriangle, 
  ArrowRightCircle,
  Clock
} from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"
import { CftvService } from "@/services/cftv-service"
import { ManutencaoConsolidacaoModal } from "@/components/op/manutencao-consolidacao-modal"
import { FileText, Loader2 } from "lucide-react"

export default function ManutencaoCFTVPage() {
  const { usuario } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    equipamento: "",
    local: "",
    tipo_falha: "tecnica",
    prioridade: "baixa",
    descricao: ""
  })
  const [isConsolidating, setIsConsolidating] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [tarefasHoje, setTarefasHoje] = useState<any[]>([])

  const handleOpenConsolidar = async () => {
    setIsConsolidating(true)
    try {
      const tarefas = await CftvService.getManutencoesDoDia()
      setTarefasHoje(tarefas)
      setIsModalOpen(true)
    } catch (error: any) {
      toast.error("Erro ao buscar manutenções do dia: " + error.message)
    } finally {
      setIsConsolidating(false)
    }
  }

  const handleSave = async () => {
    if (!usuario) return
    if (!formData.equipamento || !formData.local || !formData.descricao) {
      toast.error("Por favor, preencha todos os campos obrigatórios.")
      return
    }

    setLoading(true)
    try {
      const { error } = await supabase.from('kanban_tarefas').insert({
        titulo: `MANUTENÇÃO: ${formData.equipamento} - ${formData.local}`,
        categoria: 'manutencao_cftv',
        status: 'entrada',
        descricao: `Solicitação de manutenção gerada pela página operacional.\n\nEquipamento: ${formData.equipamento}\nLocal: ${formData.local}\nTipo de Falha: ${formData.tipo_falha}\nPrioridade: ${formData.prioridade}\n\nDescrição do Problema:\n${formData.descricao}`,
        created_by_name: usuario.nome,
        dados_especificos: {
          tipo: 'Manutenção Equipamento',
          equipamento: formData.equipamento,
          local: formData.local,
          prioridade: formData.prioridade,
          origem: 'Interface Operacional'
        }
      })

      if (error) throw error

      toast.success("Solicitação de manutenção enviada para o Kanban!")
      router.push("/admin/kanban") // Redirecionar para ver o card
    } catch (error: any) {
      toast.error("Erro ao registrar manutenção: " + error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-4 max-w-4xl space-y-6 animate-in fade-in slide-in-from-bottom-5 duration-500">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-1 flex items-center gap-2">
            <Wrench className="h-8 w-8 text-cyan-600" />
            Manutenções CFTV
          </h1>
          <p className="text-muted-foreground">Registro de falhas, trocas e manutenções técnicas</p>
        </div>

        <Button 
            onClick={handleOpenConsolidar}
            disabled={isConsolidating}
            variant="outline" 
            className="h-14 px-8 rounded-2xl border-cyan-100 bg-cyan-50/50 text-cyan-700 font-black uppercase tracking-widest text-xs hover:bg-cyan-100 transition-all flex items-center gap-3 shadow-sm"
        >
            {isConsolidating ? <Loader2 className="h-5 w-5 animate-spin" /> : <FileText className="h-5 w-5" />}
            Consolidar Relatório do Dia
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Formulário Principal */}
        <Card className="md:col-span-2 border-none shadow-xl bg-white/80 dark:bg-slate-950/80 backdrop-blur-md">
          <CardHeader>
            <CardTitle>Nova Solicitação</CardTitle>
            <CardDescription>Informe os detalhes do equipamento com defeito</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Video className="h-4 w-4 text-slate-400" />
                  Equipamento / Câmera
                </Label>
                <Input 
                  placeholder="Ex: Câmera CAM-04, DVR 02..." 
                  value={formData.equipamento}
                  onChange={(e) => setFormData({...formData, equipamento: e.target.value})}
                  className="bg-slate-50 dark:bg-slate-900 border-slate-200"
                />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-slate-400" />
                  Localização Exata
                </Label>
                <Input 
                  placeholder="Ex: Estacionamento B2, 2º Andar" 
                  value={formData.local}
                  onChange={(e) => setFormData({...formData, local: e.target.value})}
                  className="bg-slate-50 dark:bg-slate-900 border-slate-200"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tipo de Falha</Label>
                <Select 
                  value={formData.tipo_falha}
                  onValueChange={(val) => setFormData({...formData, tipo_falha: val})}
                >
                  <SelectTrigger className="bg-slate-50 dark:bg-slate-900 border-slate-200">
                    <SelectValue placeholder="Selecione o tipo..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tecnica">Falha Técnica (Hardware)</SelectItem>
                    <SelectItem value="software">Erro de Gravação / Software</SelectItem>
                    <SelectItem value="fisica">Dano Físico / Vandalismo</SelectItem>
                    <SelectItem value="preventiva">Manutenção Preventiva</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Prioridade Operacional</Label>
                <Select 
                  value={formData.prioridade}
                  onValueChange={(val) => setFormData({...formData, prioridade: val})}
                >
                  <SelectTrigger className="bg-slate-50 dark:bg-slate-900 border-slate-200">
                    <SelectValue placeholder="Selecione a prioridade..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="baixa">🔵 Baixa (Rotina)</SelectItem>
                    <SelectItem value="media">🟡 Média (Acompanhamento)</SelectItem>
                    <SelectItem value="alta">🟠 Alta (Correção Urgente)</SelectItem>
                    <SelectItem value="urgente">🔴 Urgente (Monitoramento em Risco)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Descrição do Problema</Label>
              <Textarea 
                placeholder="Detalhe o comportamento da falha para o técnico..."
                className="min-h-[150px] bg-slate-50 dark:bg-slate-900 focus-visible:ring-cyan-500 border-slate-200"
                value={formData.descricao}
                onChange={(e) => setFormData({...formData, descricao: e.target.value})}
              />
            </div>

            <Button 
              onClick={handleSave} 
              disabled={loading}
              className="w-full h-14 text-lg font-bold bg-cyan-600 hover:bg-cyan-700 text-white rounded-2xl shadow-xl shadow-cyan-600/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <ArrowRightCircle className="mr-3 h-6 w-6" />
              {loading ? 'Enviando...' : 'ENVIAR PARA MANUTENÇÃO'}
            </Button>
          </CardContent>
        </Card>

        {/* Sidebar / Dicas */}
        <div className="space-y-6">
          <Card className="border-none bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                Dica Importante
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Antes de solicitar manutenção técnica, verifique se a falha não é apenas de conexão ou energia do posto local.
              </p>
            </CardContent>
          </Card>

          <Card className="border-none shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Clock className="h-4 w-4 text-cyan-600" />
                Fluxo de Resolução
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <div className="flex gap-3">
                <div className="h-6 w-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold">1</div>
                <div className="text-xs">Registro da falha nesta página.</div>
              </div>
              <div className="flex gap-3">
                <div className="h-6 w-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold">2</div>
                <div className="text-xs">Geração de card no Kanban de Tarefas.</div>
              </div>
              <div className="flex gap-3">
                <div className="h-6 w-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold">3</div>
                <div className="text-xs">Atribuição técnica e início do reparo.</div>
              </div>
              <div className="flex gap-3">
                <div className="h-6 w-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold">4</div>
                <div className="text-xs">Finalização e fechamento do card.</div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <ManutencaoConsolidacaoModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        tarefas={tarefasHoje}
        operadorNome={usuario?.nome || "Técnico"}
      />
    </div>
  )
}
