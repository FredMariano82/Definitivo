"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { KanbanForm } from "@/components/admin/kanban-form"
import { KanbanDesfechoModal, DesfechoTipo } from "@/components/admin/kanban-desfecho-modal"
import { KanbanDetailsModal } from "@/components/admin/kanban-details-modal"
import { Button } from "@/components/ui/button"
import { PlusIcon, BookTextIcon } from "lucide-react"
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

type TarefaStatus = 'entrada' | 'fazendo' | 'aguardando' | 'historico'
type TarefaCategoria = 'imagem' | 'os' | 'ocorrencia' | 'autorizacao_chaves' | 'achados_perdidos' | 'eventos'

interface KanbanTarefa {
  id: string
  titulo: string
  descricao: string
  status: TarefaStatus
  categoria: TarefaCategoria
  dados_especificos: Record<string, any>
  created_by_name?: string
  updated_by_name?: string
  created_at: string
  updated_at?: string
}

export default function KanbanBoardPage() {
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
      const { data, error } = await supabase
        .from('kanban_tarefas')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        // Ignora erro se a tabela nao existir ainda
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
    { id: 'fazendo', title: 'Fazendo' },
    { id: 'aguardando', title: 'Aguardando' },
    { id: 'historico', title: 'Histórico' },
  ]

  const getCategoriaBadge = (categoria: string) => {
    switch (categoria) {
      case 'imagem': return <Badge variant="default" className="bg-blue-500">Imagem</Badge>
      case 'os': return <Badge variant="default" className="bg-amber-500">OS</Badge>
      case 'autorizacao_chaves': return <Badge variant="default" className="bg-emerald-600">Chaves</Badge>
      case 'achados_perdidos': return <Badge variant="default" className="bg-purple-500">Achados & Perdidos</Badge>
      case 'eventos': return <Badge variant="default" className="bg-rose-500">Eventos</Badge>
      default: return <Badge variant="secondary">Ocorrência</Badge>
    }
  }

  const handleStatusChangeClick = (tarefa: KanbanTarefa, newStatus: TarefaStatus) => {
    if (newStatus === 'historico') {
      // Abre modal de desfecho
      setTarefaSelecionadaParaDesfecho(tarefa)
      setDesfechoModalOpen(true)
    } else {
      // Atualiza direto
      updateTarefaStatus(tarefa.id, newStatus)
    }
  }

  const updateTarefaStatus = async (tarefaId: string, newStatus: TarefaStatus, dadosExtra?: Record<string, any>) => {
    try {
      const { error } = await supabase
        .from('kanban_tarefas')
        .update({ 
          status: newStatus,
          updated_by_name: usuario?.nome || 'Sistema',
          updated_at: new Date().toISOString(),
          ...(dadosExtra ? { 
            dados_especificos: { ...tarefas.find(t => t.id === tarefaId)?.dados_especificos, ...dadosExtra }
          } : {})
        })
        .eq('id', tarefaId)

      if (error) throw error

      toast.success(`Tarefa movida para ${newStatus}`)
      fetchTarefas() // Recarrega
    } catch (e: any) {
      toast.error("Erro ao atualizar status: " + e.message)
    }
  }

  const handleDesfechoConfirm = async (desfecho: DesfechoTipo, observacao: string) => {
    if (!tarefaSelecionadaParaDesfecho) return

    setDesfechoModalOpen(false)
    await updateTarefaStatus(tarefaSelecionadaParaDesfecho.id, 'historico', {
      desfecho_final: desfecho,
      desfecho_observacao: observacao,
      data_desfecho: new Date().toISOString()
    })
    setTarefaSelecionadaParaDesfecho(null)
  }

  // Drag and Drop Handlers
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, tarefa: KanbanTarefa) => {
    e.dataTransfer.setData('tarefaId', tarefa.id)
    e.dataTransfer.effectAllowed = 'move'
    // Opcional: Adicionar classe para visual de "arrastando"
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
    e.preventDefault() // Necessário para permitir o drop
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
    
    // Atualiza a visualização do modal
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
    <div className="p-6 h-[calc(100vh-4rem)] flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestão Kanban</h1>
          <p className="text-muted-foreground mt-1">
            Acompanhe e gerencie as tarefas do Centro de Segurança
          </p>
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
              <KanbanForm onSuccess={() => {
                setIsFormOpen(false)
                fetchTarefas()
              }} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

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
                  {tarefas.filter(t => t.status === col.id).length}
                </Badge>
              </h3>
              
              <div className="flex-1 overflow-y-auto space-y-3 pr-2">
                {loading ? (
                  <div className="text-sm text-center text-muted-foreground py-4">Carregando...</div>
                ) : (
                  tarefas.filter(t => t.status === col.id).map(tarefa => (
                    <div 
                      key={tarefa.id} 
                      className="bg-card border rounded-md shadow-sm p-4 text-sm flex flex-col gap-2 hover:border-primary/50 transition-all cursor-grab active:cursor-grabbing"
                      draggable
                      onDragStart={(e) => handleDragStart(e, tarefa)}
                      onDragEnd={handleDragEnd}
                      onClick={() => handleCardClick(tarefa)}
                    >
                      <div className="flex justify-between items-start">
                        {getCategoriaBadge(tarefa.categoria)}
                        {/* Dropdown status temporário simulando drag n drop */}
                        <select 
                          className="text-xs bg-transparent border-none text-muted-foreground cursor-pointer outline-none opacity-50 hover:opacity-100 transition-opacity ml-2"
                          value={tarefa.status}
                          onChange={(e) => {
                             e.stopPropagation() // Evita abrir o modal
                             handleStatusChangeClick(tarefa, e.target.value as TarefaStatus)
                          }}
                          onClick={(e) => e.stopPropagation()} // Evita abrir o modal ao clicar no seletor
                        >
                          {columns.map(c => <option key={c.id} value={c.id}>Mover p/ {c.title}</option>)}
                        </select>
                      </div>
                      <h4 className="font-medium mt-1">{tarefa.titulo}</h4>
                      
                      {/* Dados Específicos Summary */}
                      {tarefa.categoria === 'imagem' && tarefa.dados_especificos?.solicitante && (
                        <div className="text-xs text-muted-foreground mt-1 bg-muted p-1.5 rounded">
                          <span className="font-medium">Req:</span> {tarefa.dados_especificos.solicitante}
                        </div>
                      )}
                      
                      {tarefa.categoria === 'os' && (
                        <div className="text-xs text-muted-foreground mt-1 flex gap-2">
                          {tarefa.dados_especificos?.prioridade && (
                             <span className="capitalize text-destructive font-medium border border-destructive/30 px-1 rounded-sm">
                               {tarefa.dados_especificos.prioridade}
                             </span>
                          )}
                          {tarefa.dados_especificos?.local_bloco && <span>{tarefa.dados_especificos.local_bloco}</span>}
                        </div>
                      )}

                      {/* Desfecho Badge se for Historico */}
                      {tarefa.status === 'historico' && tarefa.dados_especificos?.desfecho_final && (
                        <div className={`mt-2 text-xs font-medium px-2 py-1.5 rounded-md flex items-center justify-center border
                          ${tarefa.dados_especificos.desfecho_final === 'sucesso' ? 'bg-green-500/10 text-green-600 border-green-500/20' : 
                            tarefa.dados_especificos.desfecho_final === 'insucesso_tecnico' ? 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20' : 
                            'bg-red-500/10 text-red-600 border-red-500/20'}`}
                        >
                          {tarefa.dados_especificos.desfecho_final.replace('_', ' ').toUpperCase()}
                        </div>
                      )}

                      {/* Card Footer com Metadados (Criador e Atualização) */}
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
      />
    </div>
  )
}
