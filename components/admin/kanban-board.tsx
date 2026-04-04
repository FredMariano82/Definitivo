"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { KanbanForm } from "@/components/admin/kanban-form"
import { KanbanDesfechoModal, DesfechoTipo } from "@/components/admin/kanban-desfecho-modal"
import { KanbanDetailsModal } from "@/components/admin/kanban-details-modal"
import { OpServiceV2 } from "@/services/op-service-v2"
import { Button } from "@/components/ui/button"
import { PlusIcon, BookTextIcon, MapPin, ImageIcon, Trash2Icon } from "lucide-react"
import Link from "next/link"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/contexts/auth-context"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

export type TarefaStatus = 'entrada' | 'andamento' | 'aguardando' | 'revisao' | 'finalizado'
export type TarefaCategoria = 'imagem' | 'os' | 'ocorrencia' | 'autorizacao_chaves' | 'achados_perdidos' | 'eventos' | 'uniforme' | 'servico_noturno' | 'manutencao_cftv' | 'ronda_dvr' | 'checklist_central'

export interface KanbanTarefa {
  id: string
  titulo: string
  descricao: string
  status: TarefaStatus
  categoria: TarefaCategoria
  foto_url?: string
  dados_especificos: Record<string, any>
  created_by_name?: string
  updated_by_name?: string
  created_at: string
  updated_at?: string
}

interface KanbanBoardProps {
  title?: string;
  subtitle?: string;
  initialCategory?: TarefaCategoria;
  hideHeader?: boolean;
}

export function KanbanBoard({ title = "Gestão de Tarefas", subtitle = "Acompanhe e gerencie as tarefas do Centro de Segurança", initialCategory, hideHeader = false }: KanbanBoardProps) {
  const { usuario } = useAuth()
  const [tarefas, setTarefas] = useState<KanbanTarefa[]>([])
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [desfechoModalOpen, setDesfechoModalOpen] = useState(false)
  const [tarefaSelecionadaParaDesfecho, setTarefaSelecionadaParaDesfecho] = useState<KanbanTarefa | null>(null)
  const [detailsModalOpen, setDetailsModalOpen] = useState(false)
  const [tarefaSelecionadaDetalhes, setTarefaSelecionadaDetalhes] = useState<KanbanTarefa | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTarefas()
  }, [])

  async function fetchTarefas() {
    try {
      setLoading(true)
      let query = supabase
        .from('kanban_tarefas')
        .select('*')
        .order('created_at', { ascending: false })

      if (initialCategory) {
        query = query.eq('categoria', initialCategory)
      }

      const { data, error } = await query

      if (error) {
        if (error.code !== '42P01') {
          console.error("Erro ao buscar tarefas:", error)
        }
        return
      }

      setTarefas(data || [])
    } finally {
      setLoading(false)
    }
  }

  const columns: { id: TarefaStatus; title: string }[] = [
    { id: 'entrada', title: 'Entrada' },
    { id: 'andamento', title: 'Em Andamento' },
    { id: 'aguardando', title: 'Aguardando' },
    { id: 'revisao', title: 'Revisão' },
    { id: 'finalizado', title: 'Finalizado' },
  ]

  const getCategoriaBadge = (categoria: string, priority: string = 'baixa') => {
    const isPriority = priority.toLowerCase() === 'urgente' || priority.toLowerCase() === 'alta'
    const pulseClass = isPriority ? "animate-pulse" : ""

    switch (categoria) {
      case 'imagem': return <Badge variant="default" className={`bg-rose-600 ${pulseClass}`}>Imagem</Badge>
      case 'os': return <Badge variant="default" className={`bg-amber-500 ${pulseClass}`}>OS</Badge>
      case 'autorizacao_chaves': return <Badge variant="default" className={`bg-emerald-600 ${pulseClass}`}>Chaves</Badge>
      case 'achados_perdidos': return <Badge variant="default" className={`bg-purple-500 ${pulseClass}`}>Achados & Perdidos</Badge>
      case 'eventos': return <Badge variant="default" className={`bg-orange-600 ${pulseClass}`}>Eventos</Badge>
      case 'uniforme': return <Badge variant="default" className={`bg-teal-600 ${pulseClass}`}>Uniforme</Badge>
      case 'servico_noturno': return <Badge variant="default" className={`bg-indigo-900 ${pulseClass}`}>S. Noturno</Badge>
      case 'manutencao_cftv': return <Badge variant="default" className={`bg-cyan-600 ${pulseClass}`}>Maint. CFTV</Badge>
      case 'ronda_dvr': return <Badge variant="default" className={`bg-stone-700 ${pulseClass}`}>Ronda DVR</Badge>
      case 'checklist_central': return <Badge variant="default" className={`bg-blue-600 ${pulseClass}`}>Checklist</Badge>
      default: return <Badge variant="secondary" className={`bg-slate-500 text-white ${pulseClass}`}>Ocorrência</Badge>
    }
  }

  const getSubcategoriaBadge = (tarefa: KanbanTarefa) => {
    const { categoria, dados_especificos } = tarefa
    if (!dados_especificos) return null

    let text = ""
    let className = "bg-slate-100 text-slate-600 border-slate-200"

    switch (categoria) {
      case 'uniforme':
        text = dados_especificos.tipo_acao_uniforme
        className = "bg-teal-50 text-teal-700 border-teal-200"
        break
      case 'os':
        text = dados_especificos.prioridade
        if (text === 'urgente' || text === 'alta') className = "bg-red-50 text-red-700 border-red-200"
        else className = "bg-amber-50 text-amber-700 border-amber-200"
        break
      case 'imagem':
        text = dados_especificos.solicitante
        break
      case 'eventos':
        text = dados_especificos.local_evento
        className = "bg-rose-50 text-rose-700 border-rose-200"
        break
      case 'achados_perdidos':
        text = dados_especificos.local_encontro
        break
      default:
        return null
    }

    if (!text) return null

    return (
      <Badge 
        variant="outline" 
        className={`ml-1.5 capitalize font-normal text-[10px] h-5 ${className}`}
      >
        {text.replace('_', ' ')}
      </Badge>
    )
  }

  const getInboxBadge = (direcionar_para?: string) => {
    if (!direcionar_para || direcionar_para === 'geral') return null;

    const labels: Record<string, string> = {
      operador: "🕹️ Ops",
      administrador: "🏢 Admin",
      gestor: "👔 Gestão",
      suporte: "🛠️ Suporte"
    };

    return (
      <Badge variant="outline" className="ml-1.5 bg-slate-100 text-slate-700 border-slate-300 font-bold text-[10px] h-5 uppercase">
        {labels[direcionar_para] || direcionar_para}
      </Badge>
    );
  }

  const handleStatusChangeClick = (tarefa: KanbanTarefa, newStatus: TarefaStatus) => {
    if (newStatus === 'finalizado') {
      setTarefaSelecionadaParaDesfecho(tarefa)
      setDesfechoModalOpen(true)
    } else {
      updateTarefaStatus(tarefa.id, newStatus)
    }
  }

  const updateTarefaStatus = async (tarefaId: string, newStatus: TarefaStatus, dadosExtra?: Record<string, any>) => {
    try {
      const tarefa = tarefas.find(t => t.id === tarefaId)
      
      const { error } = await supabase
        .from('kanban_tarefas')
        .update({ 
          status: newStatus,
          updated_by_name: usuario?.nome || 'Sistema',
          updated_at: new Date().toISOString(),
          ...(dadosExtra ? { 
            dados_especificos: { ...tarefa?.dados_especificos, ...dadosExtra }
          } : {})
        })
        .eq('id', tarefaId)

      if (error) throw error

      if (tarefa?.categoria === 'eventos' && tarefa.dados_especificos?.evento_id) {
        const evento_id = tarefa.dados_especificos.evento_id;
        if (newStatus === 'finalizado') {
          await OpServiceV2.setEventoConcluido(evento_id, true)
        } else if (tarefa.status === 'finalizado') {
          // Se estava finalizado e foi movido de volta, remove a marcação de concluído
          await OpServiceV2.setEventoConcluido(evento_id, false)
        }
      }

      toast.success(`Tarefa movida para ${newStatus}`)
      fetchTarefas()
    } catch (e: any) {
      toast.error("Erro ao atualizar status: " + e.message)
    }
  }
  
  const handleDeleteTarefa = async (tarefaId: string) => {
    if (!confirm("Tem certeza que deseja excluir esta tarefa? Esta ação não pode ser desfeita.")) return

    try {
      const { error } = await supabase
        .from('kanban_tarefas')
        .delete()
        .eq('id', tarefaId)

      if (error) throw error

      toast.success("Tarefa excluída com sucesso!")
      fetchTarefas()
      setDetailsModalOpen(false)
      setTarefaSelecionadaDetalhes(null)
    } catch (e: any) {
      toast.error("Erro ao excluir tarefa: " + e.message)
    }
  }

  const handleDesfechoConfirm = async (desfecho: DesfechoTipo, observacao: string) => {
    if (!tarefaSelecionadaParaDesfecho) return

    setDesfechoModalOpen(false)
    await updateTarefaStatus(tarefaSelecionadaParaDesfecho.id, 'finalizado', {
      desfecho_final: desfecho,
      desfecho_observacao: observacao,
      data_desfecho: new Date().toISOString()
    })
    setTarefaSelecionadaParaDesfecho(null)
  }
  
  const handlePriorityCycle = async (e: React.MouseEvent, tarefa: KanbanTarefa) => {
    e.stopPropagation()
    const priorities: (string)[] = ['baixa', 'media', 'alta', 'urgente']
    const current = (tarefa.dados_especificos?.prioridade || 'baixa').toLowerCase()
    const currentIndex = priorities.indexOf(current)
    const nextIndex = (currentIndex + 1) % priorities.length
    const nextPriority = priorities[nextIndex]

    try {
      const { error } = await supabase
        .from('kanban_tarefas')
        .update({ 
          dados_especificos: { ...tarefa.dados_especificos, prioridade: nextPriority },
          updated_by_name: usuario?.nome || 'Sistema',
          updated_at: new Date().toISOString()
        })
        .eq('id', tarefa.id)

      if (error) throw error
      toast.success(`Prioridade alterada para ${nextPriority}`)
      fetchTarefas()
    } catch (e: any) {
      toast.error("Erro ao mudar prioridade: " + e.message)
    }
  }

  const getPriorityBadge = (priority: string = 'baixa') => {
    const p = priority.toLowerCase()
    switch (p) {
      case 'urgente': return <Badge variant="outline" className="bg-red-600 text-white border-none text-[10px] h-5 px-1.5 animate-pulse uppercase">Urgente</Badge>
      case 'alta': return <Badge variant="outline" className="bg-orange-500 text-white border-none text-[10px] h-5 px-1.5 uppercase">Alta</Badge>
      case 'media': return <Badge variant="outline" className="bg-yellow-400 text-slate-800 border-none text-[10px] h-5 px-1.5 uppercase">Média</Badge>
      default: return <Badge variant="outline" className="bg-slate-200 text-slate-600 border-none text-[10px] h-5 px-1.5 uppercase">Baixa</Badge>
    }
  }

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, tarefa: KanbanTarefa) => {
    e.dataTransfer.setData('tarefaId', tarefa.id)
    e.dataTransfer.effectAllowed = 'move'
    setTimeout(() => {
      if (e.target instanceof HTMLElement) {
        e.target.classList.add('opacity-50')
      }
    }, 0)
  }

  const handleDragEnd = (e: React.DragEvent<HTMLDivElement>) => {
    if (e.target instanceof HTMLElement) {
      e.target.classList.remove('opacity-50')
    }
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, newStatus: TarefaStatus) => {
    e.preventDefault()
    const tarefaId = e.dataTransfer.getData('tarefaId')
    if (!tarefaId) return

    const tarefa = tarefas.find(t => t.id === tarefaId)
    if (tarefa && tarefa.status !== newStatus) {
      handleStatusChangeClick(tarefa, newStatus)
    }
  }

  const handleCardClick = (tarefa: KanbanTarefa) => {
    setTarefaSelecionadaDetalhes(tarefa)
    setDetailsModalOpen(true)
  }

  const handleAddNote = async (tarefaId: string, note: string) => {
    const tarefa = tarefas.find(t => t.id === tarefaId)
    if (!tarefa) return

    const novaNota = {
      autor: usuario?.nome || 'Desconhecido',
      data: new Date().toISOString(),
      texto: note
    }

    const historicoAtual = tarefa.dados_especificos?.historico_notas || []
    const novoHistorico = [novaNota, ...historicoAtual]

    await updateTarefaStatus(tarefaId, tarefa.status, {
      historico_notas: novoHistorico
    })
    
    setTarefaSelecionadaDetalhes(prev => {
      if(!prev) return null;
      return {
        ...prev,
        dados_especificos: {
           ...prev.dados_especificos,
           historico_notas: novoHistorico
        }
      }
    })
  }

  return (
    <div className="p-6 h-full flex flex-col">
      {!hideHeader && (
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
            <p className="text-muted-foreground mt-1">{subtitle}</p>
          </div>
          
          <div className="flex items-center gap-3">
            <Link href="/admin/kanban/registros">
              <Button variant="outline">
                <BookTextIcon className="mr-2 h-4 w-4" />
                Livro de Registros
              </Button>
            </Link>
            <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
              <DialogTrigger asChild>
                <Button>
                  <PlusIcon className="mr-2 h-4 w-4" />
                  Nova Tarefa
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Criar Nova Tarefa</DialogTitle>
                  <DialogDescription>
                    Selecione a categoria para habilitar os campos específicos.
                  </DialogDescription>
                </DialogHeader>
                <KanbanForm 
                    onSuccess={() => {
                        setIsFormOpen(false)
                        fetchTarefas()
                    }} 
                    defaultValues={initialCategory ? { categoria: initialCategory } : undefined}
                />
              </DialogContent>
            </Dialog>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-x-auto">
        <div className="flex gap-4 h-full min-w-max pb-4">
          {columns.map(col => (
            <div 
              key={col.id} 
              className="w-80 flex flex-col bg-muted/30 rounded-lg p-4 border flex-shrink-0 transition-colors hover:bg-muted/50"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, col.id)}
            >
              <h3 className="font-semibold text-sm mb-4 flex items-center justify-between pointer-events-none">
                {col.title}
                <Badge variant="secondary" className="rounded-full">
                  {tarefas.filter(t => {
                    if (t.status !== col.id) return false;
                    if (col.id === 'finalizado') {
                      const dataCriacao = new Date(t.created_at);
                      const agora = new Date();
                      const diffMs = agora.getTime() - dataCriacao.getTime();
                      const diffHoras = diffMs / (1000 * 60 * 60);
                      return diffHoras <= 48;
                    }
                    return true;
                  }).length}
                </Badge>
              </h3>
              
              <div className="flex-1 overflow-y-auto space-y-3 pr-2">
                {loading ? (
                  <div className="text-sm text-center text-muted-foreground py-4">Carregando...</div>
                ) : (
                  tarefas.filter(t => {
                    if (t.status !== col.id) return false;
                    
                    // Filtro de 48 horas apenas para a coluna de Finalizados
                    if (col.id === 'finalizado') {
                      const dataCriacao = new Date(t.created_at);
                      const agora = new Date();
                      const diffMs = agora.getTime() - dataCriacao.getTime();
                      const diffHoras = diffMs / (1000 * 60 * 60);
                      return diffHoras <= 48;
                    }
                    
                    return true;
                  }).map(tarefa => (
                    <div 
                      key={tarefa.id} 
                      className="bg-card border rounded-md shadow-sm p-4 text-sm flex flex-col gap-2 hover:border-primary/50 transition-all cursor-grab active:cursor-grabbing"
                      draggable
                      onDragStart={(e) => handleDragStart(e, tarefa)}
                      onDragEnd={handleDragEnd}
                      onClick={() => handleCardClick(tarefa)}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex items-center flex-wrap gap-y-1">
                          {getCategoriaBadge(tarefa.categoria, tarefa.dados_especificos?.prioridade)}
                          {getSubcategoriaBadge(tarefa)}
                          {getInboxBadge(tarefa.dados_especificos?.direcionar_para)}
                          <div 
                            onClick={(e) => handlePriorityCycle(e, tarefa)}
                            className="cursor-pointer hover:scale-110 transition-transform flex items-center ml-1"
                            title="Clique para alternar prioridade"
                          >
                            {getPriorityBadge(tarefa.dados_especificos?.prioridade)}
                          </div>
                        </div>
                        <div className="flex items-center">
                          <select 
                            className="text-xs bg-transparent border-none text-muted-foreground cursor-pointer outline-none opacity-50 hover:opacity-100 transition-opacity ml-2"
                            value={tarefa.status}
                            onChange={(e) => {
                               e.stopPropagation() 
                               handleStatusChangeClick(tarefa, e.target.value as TarefaStatus)
                            }}
                            onClick={(e) => e.stopPropagation()} 
                          >
                            {columns.map(c => <option key={c.id} value={c.id}>Mover p/ {c.title}</option>)}
                          </select>
                          {usuario?.perfil === 'superadmin' && (
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-6 w-6 text-muted-foreground hover:text-destructive shrink-0 ml-1"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleDeleteTarefa(tarefa.id)
                              }}
                            >
                              <Trash2Icon className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-medium mt-1 flex-1">{tarefa.titulo}</h4>
                        {tarefa.foto_url && (
                          <div className="mt-1 shrink-0 bg-primary/10 p-1 rounded-md" title="Possui foto anexa">
                             <ImageIcon className="h-4 w-4 text-primary" />
                          </div>
                        )}
                      </div>
                      
                      {tarefa.categoria === 'imagem' && tarefa.dados_especificos?.solicitante && (
                        <div className="text-xs text-muted-foreground mt-1 bg-muted p-1.5 rounded">
                          <span className="font-medium">Req:</span> {tarefa.dados_especificos.solicitante}
                        </div>
                      )}
                      
                      {tarefa.categoria === 'os' && (
                        <div className="text-xs text-muted-foreground mt-1 flex gap-2">
                          {tarefa.dados_especificos?.local_bloco && <span>{tarefa.dados_especificos.local_bloco}</span>}
                          {tarefa.dados_especificos?.patrimonio && <span> | {tarefa.dados_especificos.patrimonio}</span>}
                        </div>
                      )}

                      {tarefa.categoria === 'eventos' && (
                        <div className="text-xs text-muted-foreground mt-1 space-y-1 bg-rose-50/50 p-2 rounded-lg border border-rose-100/50">
                          {tarefa.dados_especificos?.local_evento && (
                            <div className="flex items-center gap-1.5 capitalize text-rose-700 font-bold">
                              <MapPin className="h-3 w-3" />
                              {tarefa.dados_especificos.local_evento}
                            </div>
                          )}
                        </div>
                      )}

                      {tarefa.status === 'finalizado' && tarefa.dados_especificos?.desfecho_final && (
                        <div className={`mt-2 text-xs font-medium px-2 py-1.5 rounded-md flex items-center justify-center border
                          ${tarefa.dados_especificos.desfecho_final === 'sucesso' ? 'bg-green-500/10 text-green-600 border-green-500/20' : 
                            tarefa.dados_especificos.desfecho_final === 'insucesso_tecnico' ? 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20' : 
                            'bg-red-500/10 text-red-600 border-red-500/20'}`}
                        >
                          {tarefa.dados_especificos.desfecho_final.replace('_', ' ').toUpperCase()}
                        </div>
                      )}

                      <div className="mt-3 pt-3 border-t flex flex-col gap-1 text-[10px] text-muted-foreground">
                        <div className="flex justify-between items-center">
                          <span>Criado por: <strong className="font-medium text-foreground/80">{tarefa.created_by_name || 'Desconhecido'}</strong></span>
                        </div>
                        {tarefa.updated_by_name && (
                          <div className="flex justify-between items-center">
                            <span>Últ. Atualização: <strong className="font-medium text-foreground/80">{tarefa.updated_by_name}</strong></span>
                            <span>{tarefa.updated_at ? format(new Date(tarefa.updated_at), "dd/MM 'às' HH:mm", { locale: ptBR }) : ''}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
                
                {!loading && tarefas.filter(t => t.status === col.id).length === 0 && (
                  <div className="text-center py-8 text-sm text-muted-foreground border-2 border-dashed rounded-lg">
                    Vazio
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <KanbanDesfechoModal 
        isOpen={desfechoModalOpen}
        onClose={() => {
          setDesfechoModalOpen(false)
          setTarefaSelecionadaParaDesfecho(null)
        }}
        onConfirm={handleDesfechoConfirm}
        taskTitle={tarefaSelecionadaParaDesfecho?.titulo || ""}
      />

      <KanbanDetailsModal
        isOpen={detailsModalOpen}
        onClose={() => {
           setDetailsModalOpen(false)
           setTarefaSelecionadaDetalhes(null)
        }}
        tarefa={tarefaSelecionadaDetalhes}
        onAddNote={handleAddNote}
        onDelete={usuario?.perfil === 'superadmin' ? handleDeleteTarefa : undefined}
      />
    </div>
  )
}
