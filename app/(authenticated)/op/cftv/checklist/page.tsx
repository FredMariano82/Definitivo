"use client"

import { useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { 
  ClipboardList, 
  Save, 
  Monitor, 
  ShieldCheck, 
  Zap, 
  Coffee,
  CheckCircle2,
  ShieldAlert,
  Mail,
  CreditCard,
  Key,
  Radio,
  Smartphone,
  Gamepad2,
  Fuel,
  Usb,
  Flame,
  Check,
  X as XIcon,
  AlertCircle
} from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"
import { KanbanService } from "@/services/kanban-service"

const CHECKLIST_ITEMS = [
  { id: 'limpeza', label: 'Estação de trabalho limpa e organizada', category: 'Ambiente', icon: Coffee },
  
  { id: 'incendio', label: 'Todos os Painéis de incêndio ligados e operantes', category: 'Sistemas', icon: ShieldAlert },
  { id: 'monitores', label: 'Todos os monitores ligados e operantes', category: 'Sistemas', icon: Monitor },
  { id: 'monitoramento', label: 'Software de monitoramento aberto e conectado', category: 'Sistemas', icon: ShieldCheck },
  
  { id: 'energia', label: 'Verificação de No-breaks e energia estável', category: 'Infraestrutura', icon: Zap },
  
  { id: 'livro', label: 'Leitura do livro de ocorrências do turno anterior', category: 'Processos', icon: ClipboardList },
  { id: 'tarefas', label: 'Leitura dos e-mails e caixa de entrada em Tarefas', category: 'Processos', icon: Mail },
  
  { id: 'cartoes', label: 'Cartões de refeição Hagana e Eventos', category: 'Controle de Ativos', icon: CreditCard },
  { id: 'abastecimento', label: 'Cartão de abastecimento', category: 'Controle de Ativos', icon: Fuel },
  { id: 'controles', label: 'Controles da Hungria e Maternal', category: 'Controle de Ativos', icon: Gamepad2 },
  { id: 'chaves', label: 'Claviculário de chaves', category: 'Controle de Ativos', icon: Key },
  { id: 'radios', label: 'Rádios HT\'s (relação completa)', category: 'Controle de Ativos', icon: Radio },
  { id: 'radio_bombeiros', label: 'Rádio HT comunicador com os bombeiros', category: 'Controle de Ativos', icon: Flame },
  { id: 'celulares', label: 'Celular de ponto e corporativo carregados e operantes', category: 'Controle de Ativos', icon: Smartphone },
  { id: 'pendrives', label: 'Pen drives disponíveis para gravações de imagens', category: 'Controle de Ativos', icon: Usb },
]

interface ItemState {
  status: 'ok' | 'nok' | null
  justificativa?: string
}

export default function ChecklistCentralPage() {
  const { usuario } = useAuth()
  const router = useRouter()
  const [itemStatus, setItemStatus] = useState<Record<string, ItemState>>({})
  const [saving, setSaving] = useState(false)

  const setStatus = (id: string, status: 'ok' | 'nok') => {
    setItemStatus(prev => ({ 
      ...prev, 
      [id]: { 
        ...prev[id],
        status: prev[id]?.status === status ? null : status 
      }
    }))
  }

  const setJustificativa = (id: string, text: string) => {
    setItemStatus(prev => ({
      ...prev,
      [id]: { ...prev[id], justificativa: text }
    }))
  }

  const handleSave = async () => {
    if (!usuario) return
    
    // 1. Validar se todos os itens foram preenchidos
    const pendentes = CHECKLIST_ITEMS.filter(item => !itemStatus[item.id]?.status)
    if (pendentes.length > 0) {
      toast.error(`Ainda restam ${pendentes.length} itens sem verificação.`)
      return
    }

    // 2. Validar se falhas têm justificativa
    const falhasSemJustificativa = CHECKLIST_ITEMS.filter(item => 
      itemStatus[item.id]?.status === 'nok' && !itemStatus[item.id]?.justificativa?.trim()
    )
    if (falhasSemJustificativa.length > 0) {
      toast.error("Por favor, descreva o problema em cada item marcado com X.")
      return
    }

    setSaving(true)
    try {
      const falhas = CHECKLIST_ITEMS.filter(item => itemStatus[item.id]?.status === 'nok')
      
      // A. Criar tarefas individuais no Kanban (Coluna AGUARDANDO) para cada falha
      if (falhas.length > 0) {
        const promises = falhas.map(item => {
          return KanbanService.criarTarefa({
            titulo: `FALHA NO CHECKLIST: ${item.label}`,
            status: 'aguardando',
            categoria: 'checklist_central',
            descricao: `Falha reportada via Checklist Central:\n\n${itemStatus[item.id]?.justificativa}`,
            created_by_name: usuario.nome,
            dados_especificos: {
              item_id: item.id,
              origem: 'Checklist Central',
              operador: usuario.nome
            }
          })
        })
        await Promise.all(promises)
      }

      // B. Salvar o LOG principal do Checklist (Snapshot)
      const resJSON = CHECKLIST_ITEMS.map(item => ({
        label: item.label,
        status: itemStatus[item.id]?.status,
        justificativa: itemStatus[item.id]?.justificativa || ''
      }))

      const { error } = await supabase.from('kanban_tarefas').insert({
        titulo: `Checklist Central Realizado - ${usuario.nome}`,
        categoria: 'checklist_central',
        status: 'finalizado',
        descricao: `Checklist operacional concluído.\n\nResumo:\n${resJSON.map(r => `${r.status === 'ok' ? '✅' : '🚨'} ${r.label} ${r.justificativa ? `(${r.justificativa})` : ''}`).join('\n')}`,
        created_by_name: 'Sistema (Checklist)',
        dados_especificos: {
          tipo: 'Checklist Operacional',
          operador: usuario.nome,
          detalhes: resJSON,
          total_falhas: falhas.length
        }
      })

      if (error) throw error

      toast.success(falhas.length > 0 
        ? `Checklist salvo! ${falhas.length} tarefa(s) enviada(s) para o Kanban.` 
        : "Checklist registrado com sucesso!")
      router.push("/admin/kanban")
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
          <h1 className="text-3xl font-black tracking-tight mb-1 flex items-center gap-2 italic uppercase">
            <ShieldCheck className="h-8 w-8 text-emerald-500" />
            Checklist Central
          </h1>
          <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground ml-10">MVM Sistemas de Segurança - Rotina Ativa</p>
        </div>
      </div>

      <Card className="border-none shadow-xl bg-white/80 dark:bg-slate-950/80 backdrop-blur-md overflow-hidden rounded-[2rem]">
        <CardHeader className="bg-slate-900 text-white pb-8">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-white/10 flex items-center justify-center text-white border border-white/20 shadow-lg">
              <ClipboardList className="h-6 w-6" />
            </div>
            <div>
              <CardTitle className="text-lg font-black uppercase tracking-tight italic">Inspeção e Gerenciamento</CardTitle>
              <CardDescription className="text-slate-400 font-medium">Falhas detectadas (X) geram automaticamente tarefas no Kanban</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-4 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="space-y-4">
            {CHECKLIST_ITEMS.map((item) => {
              const Icon = item.icon
              const current = itemStatus[item.id]
              const status = current?.status
              
              return (
                <div key={item.id} className="flex flex-col gap-3">
                  <div 
                    className={`flex items-center gap-4 p-4 rounded-2xl border-2 transition-all duration-300
                      ${status === 'ok' 
                        ? 'bg-emerald-50 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-500/30' 
                        : status === 'nok'
                          ? 'bg-rose-50 border-rose-200 dark:bg-rose-950/20 dark:border-rose-500/30'
                          : 'bg-white border-slate-100 dark:bg-slate-900/40 dark:border-white/5 shadow-sm'}`}
                  >
                    <div className={`h-12 w-12 rounded-xl flex items-center justify-center shrink-0 transition-colors
                      ${status === 'ok' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 
                        status === 'nok' ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20' : 
                        'bg-slate-100 text-slate-300 dark:bg-slate-800'}`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <p className={`text-[9px] font-black uppercase tracking-widest leading-none mb-1
                        ${status === 'ok' ? 'text-emerald-600' : status === 'nok' ? 'text-rose-600' : 'text-slate-400'}`}>
                        {item.category}
                      </p>
                      <p className={`text-sm font-black leading-tight
                        ${status === 'ok' ? 'text-emerald-900' : status === 'nok' ? 'text-rose-900' : 'text-slate-700 dark:text-slate-200'}`}>
                        {item.label}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 ml-auto">
                      <button
                        onClick={() => setStatus(item.id, 'ok')}
                        className={`h-10 w-10 rounded-xl flex items-center justify-center transition-all active:scale-95 border
                          ${status === 'ok' ? 'bg-emerald-500 border-emerald-500 text-white shadow-inner' : 'bg-white border-slate-100 text-slate-300 hover:border-emerald-200 hover:text-emerald-500'}`}
                      >
                        <Check className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => setStatus(item.id, 'nok')}
                        className={`h-10 w-10 rounded-xl flex items-center justify-center transition-all active:scale-95 border
                          ${status === 'nok' ? 'bg-rose-500 border-rose-500 text-white shadow-inner' : 'bg-white border-slate-100 text-slate-300 hover:border-rose-200 hover:text-rose-500'}`}
                      >
                        <XIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </div>

                  {/* Justificativa Condicional do Item */}
                  {status === 'nok' && (
                    <div className="px-4 animate-in slide-in-from-top-2 duration-300 pb-2">
                       <div className="relative group">
                          <AlertCircle className="absolute left-3 top-3.5 h-4 w-4 text-rose-500" />
                          <Textarea 
                            placeholder={`Descreva a falha no item: ${item.label}...`}
                            className="w-full min-h-[90px] pl-9 bg-white border-rose-100 focus-visible:ring-rose-500 rounded-2xl p-3 text-sm font-semibold placeholder:text-rose-300 shadow-sm border-2"
                            value={current.justificativa || ""}
                            onChange={(e) => setJustificativa(item.id, e.target.value)}
                          />
                       </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          <div className="pt-8 space-y-4">
            <Button 
              onClick={handleSave} 
              disabled={saving}
              className={`w-full h-16 text-lg font-black uppercase tracking-[0.2em] italic rounded-2xl shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98]
                ${saving ? 'bg-slate-400' : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20'}`}
            >
              <Save className="mr-3 h-6 w-6" />
              {saving ? 'Registrando...' : 'CONCLUIR E GERAR TAREFAS'}
            </Button>
          </div>
        </CardContent>
      </Card>
      
      <div className="text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest pb-8 flex items-center justify-center gap-4">
        <span>Registro Operacional</span>
        <div className="h-1 w-1 rounded-full bg-slate-300" />
        <span>MVM Segurança</span>
        <div className="h-1 w-1 rounded-full bg-slate-300" />
        <span>Automação Ativa</span>
      </div>
    </div>
  )
}


