"use client"

import { useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { 
  ClipboardList, 
  Save, 
  Monitor, 
  ShieldCheck, 
  Zap, 
  Coffee,
  CheckCircle2
} from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"

const CHECKLIST_ITEMS = [
  { id: 'limpeza', label: 'Estação de trabalho limpa e organizada', category: 'Ambiente', icon: Coffee },
  { id: 'monitores', label: 'Todos os monitores ligados e operantes', category: 'Sistemas', icon: Monitor },
  { id: 'vms', label: 'Software de monitoramento (VMS) aberto e conectado', category: 'Sistemas', icon: ShieldCheck },
  { id: 'energia', label: 'Verificação de No-breaks e energia estável', category: 'Infraestrutura', icon: Zap },
  { id: 'passagem', label: 'Leitura do livro de ocorrências do turno anterior', category: 'Processos', icon: ClipboardList },
]

export default function ChecklistCentralPage() {
  const { usuario } = useAuth()
  const router = useRouter()
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({})
  const [observacoes, setObservacoes] = useState("")
  const [saving, setSaving] = useState(false)

  const toggleItem = (id: string) => {
    setCheckedItems(prev => ({ ...prev, [id]: !prev[id] }))
  }

  const handleSave = async () => {
    if (!usuario) return
    
    // Verificar se todos os itens foram marcados (ou pelo menos alguns)
    const totalItems = CHECKLIST_ITEMS.length
    const checkedCount = Object.values(checkedItems).filter(Boolean).length
    
    if (checkedCount < totalItems && !observacoes) {
      toast.error("Por favor, justifique nas observações os itens não marcados.")
      return
    }

    setSaving(true)
    try {
      // 1. Salvar no histórico (tabela a ser criada ou usar kanban direto)
      // Como ainda não criamos a tabela específica de checklist, vamos gerar um LOG no Kanban
      
      const { error } = await supabase.from('kanban_tarefas').insert({
        titulo: `Checklist Central Realizado - ${usuario.nome}`,
        categoria: 'checklist_central',
        status: 'finalizado',
        descricao: `Checklist operacional concluído.\n\nResultados:\n${CHECKLIST_ITEMS.map(item => `${checkedItems[item.id] ? '✅' : '❌'} ${item.label}`).join('\n')}\n\nObservações: ${observacoes || 'Nenhuma'}`,
        created_by_name: 'Sistema (Checklist)',
        dados_especificos: {
          tipo: 'Checklist Operacional',
          operador: usuario.nome,
          itens: checkedItems,
          concluido: checkedCount === totalItems
        }
      })

      if (error) throw error

      toast.success("Checklist registrado com sucesso!")
      router.push("/admin/kanban") // Sugestão de retorno
    } catch (error: any) {
      toast.error("Erro ao salvar checklist: " + error.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="container mx-auto p-4 max-w-3xl space-y-6 animate-in fade-in slide-in-from-bottom-5 duration-500">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-1 flex items-center gap-2">
            <ShieldCheck className="h-8 w-8 text-emerald-600" />
            Checklist Central
          </h1>
          <p className="text-muted-foreground">Verificação de rotina inicial e final de turno</p>
        </div>
      </div>

      <Card className="border-none shadow-xl bg-white/80 dark:bg-slate-950/80 backdrop-blur-md overflow-hidden">
        <CardHeader className="bg-emerald-500/10 border-b border-emerald-500/10 pb-6">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-emerald-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <div>
              <CardTitle>Itens de Verificação</CardTitle>
              <CardDescription>Marque os itens conforme a inspeção realizada no posto</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="space-y-4">
            {CHECKLIST_ITEMS.map((item) => {
              const Icon = item.icon
              const isChecked = checkedItems[item.id]
              return (
                <div 
                  key={item.id} 
                  className={`flex items-center space-x-4 p-4 rounded-xl border-2 transition-all duration-300 cursor-pointer
                    ${isChecked 
                      ? 'bg-emerald-50/50 border-emerald-200 dark:bg-emerald-900/10 dark:border-emerald-900/30' 
                      : 'bg-white border-slate-100 hover:border-emerald-100 dark:bg-slate-900 dark:border-slate-800'}`}
                  onClick={() => toggleItem(item.id)}
                >
                  <Checkbox 
                    id={item.id} 
                    checked={isChecked}
                    onCheckedChange={() => toggleItem(item.id)}
                    className="h-6 w-6 rounded-md data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500"
                  />
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600/70">{item.category}</span>
                    </div>
                    <Label 
                      htmlFor={item.id} 
                      className={`text-base font-semibold cursor-pointer transition-colors ${isChecked ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-700 dark:text-slate-300'}`}
                    >
                      {item.label}
                    </Label>
                  </div>
                  <Icon className={`h-6 w-6 transition-all ${isChecked ? 'text-emerald-500 scale-110' : 'text-slate-300'}`} />
                </div>
              )
            })}
          </div>

          <div className="pt-6 border-t space-y-4">
            <Label className="text-lg font-bold">Observações / Pendências</Label>
            <Textarea 
              placeholder="Descreva aqui qualquer anormalidade ou observação importante..."
              className="min-h-[150px] bg-slate-50 dark:bg-slate-900 focus-visible:ring-emerald-500 border-slate-200"
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
            />
          </div>

          <Button 
            onClick={handleSave} 
            disabled={saving}
            className="w-full h-16 text-lg font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl shadow-xl shadow-emerald-600/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Save className="mr-3 h-6 w-6" />
            {saving ? 'Registrando...' : 'CONCLUIR CHECKLIST'}
          </Button>
        </CardContent>
      </Card>
      
      <div className="text-center text-xs text-muted-foreground pb-8">
        Ao concluir, o registro será enviado para o histórico do sistema.
      </div>
    </div>
  )
}
