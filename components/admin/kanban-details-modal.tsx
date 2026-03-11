"use client"

import { useState } from "react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Clock, User } from "lucide-react"

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

interface KanbanDetailsModalProps {
  tarefa: KanbanTarefa | null
  isOpen: boolean
  onClose: () => void
  onAddNote: (tarefaId: string, note: string) => Promise<void>
}

export function KanbanDetailsModal({
  tarefa,
  isOpen,
  onClose,
  onAddNote,
}: KanbanDetailsModalProps) {
  const [newNote, setNewNote] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!tarefa) return null

  const getCategoriaBadge = (categoria: string) => {
    switch (categoria) {
      case 'imagem': return <Badge className="bg-blue-500">Busca de Imagem / CFTV</Badge>
      case 'os': return <Badge className="bg-amber-500">Ordem de Serviço (OS)</Badge>
      case 'autorizacao_chaves': return <Badge className="bg-emerald-600">Autorização de Chaves</Badge>
      case 'achados_perdidos': return <Badge className="bg-purple-500">Achados & Perdidos</Badge>
      case 'eventos': return <Badge className="bg-rose-500">Evento</Badge>
      default: return <Badge variant="secondary">Ocorrência Padrão</Badge>
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'entrada': return <Badge variant="outline">Entrada</Badge>
      case 'fazendo': return <Badge variant="outline" className="text-blue-500 border-blue-500">Fazendo</Badge>
      case 'aguardando': return <Badge variant="outline" className="text-amber-500 border-amber-500">Aguardando</Badge>
      case 'historico': return <Badge variant="outline" className="text-muted-foreground bg-muted">Histórico</Badge>
      default: return <Badge variant="outline">{status}</Badge>
    }
  }

  const handleAddNote = async () => {
    if (!newNote.trim()) return
    setIsSubmitting(true)
    try {
      await onAddNote(tarefa.id, newNote)
      setNewNote("")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Parse notes if they exist in dados_especificos
  const historicoNotas = tarefa.dados_especificos?.historico_notas || []

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[700px] h-[85vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-6 py-4 border-b shrink-0 bg-muted/20">
          <div className="flex justify-between items-start pr-6">
            <div className="space-y-1">
              <DialogTitle className="text-2xl leading-tight">{tarefa.titulo}</DialogTitle>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                {getCategoriaBadge(tarefa.categoria)}
                {getStatusBadge(tarefa.status)}
              </div>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Main Content Area */}
            <div className="md:col-span-2 space-y-6">
              
              <section>
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">Descrição</h3>
                <div className="bg-card border rounded-md p-4 text-sm whitespace-pre-wrap leading-relaxed">
                  {tarefa.descricao || "Sem descrição fornecida."}
                </div>
              </section>

              {/* Specific Data Section */}
              <section className="space-y-3">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Dados Específicos</h3>
                <div className="bg-muted/30 border rounded-md p-4 grid gap-3 text-sm">
                  {tarefa.categoria === 'imagem' && (
                    <>
                      <div className="grid grid-cols-3 gap-2 border-b pb-2">
                        <span className="text-muted-foreground">Solicitante:</span>
                        <span className="col-span-2 font-medium">{tarefa.dados_especificos?.solicitante || '-'}</span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 border-b pb-2">
                        <span className="text-muted-foreground">Data/Hora Evento:</span>
                        <span className="col-span-2 font-medium">{tarefa.dados_especificos?.data_hora_evento ? format(new Date(tarefa.dados_especificos.data_hora_evento), "dd/MM/yyyy HH:mm", { locale: ptBR }) : '-'}</span>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <span className="text-muted-foreground">Câmeras/Locais:</span>
                        <span className="col-span-2 font-medium">{tarefa.dados_especificos?.cameras_solicitadas || '-'}</span>
                      </div>
                    </>
                  )}
                  {tarefa.categoria === 'os' && (
                    <>
                      <div className="grid grid-cols-3 gap-2 border-b pb-2">
                        <span className="text-muted-foreground">Local/Bloco:</span>
                        <span className="col-span-2 font-medium">{tarefa.dados_especificos?.local_bloco || '-'}</span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 border-b pb-2">
                        <span className="text-muted-foreground">Patrimônio:</span>
                        <span className="col-span-2 font-medium">{tarefa.dados_especificos?.patrimonio || '-'}</span>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <span className="text-muted-foreground">Prioridade:</span>
                        <span className="col-span-2 capitalize font-medium">{tarefa.dados_especificos?.prioridade || '-'}</span>
                      </div>
                    </>
                  )}
                  {tarefa.categoria === 'ocorrencia' && (
                     <div className="text-muted-foreground italic">Nenhum campo estruturado extra para esta categoria.</div>
                  )}

                  {tarefa.categoria === 'autorizacao_chaves' && (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <span className="text-muted-foreground font-semibold block mb-2 border-b pb-1">Pessoas Autorizadas:</span>
                          <ul className="list-disc list-inside space-y-1">
                            {tarefa.dados_especificos?.pessoas_autorizadas?.length > 0 
                              ? tarefa.dados_especificos.pessoas_autorizadas.map((pessoa: string, idx: number) => (
                                  <li key={idx} className="font-medium">{pessoa}</li>
                                ))
                              : <li className="text-muted-foreground italic">Nenhuma informada</li>
                            }
                          </ul>
                        </div>
                        <div>
                          <span className="text-muted-foreground font-semibold block mb-2 border-b pb-1">Chaves:</span>
                          <ul className="list-disc list-inside space-y-1">
                            {tarefa.dados_especificos?.chaves_autorizadas?.length > 0 
                              ? tarefa.dados_especificos.chaves_autorizadas.map((chave: any, idx: number) => (
                                  <li key={idx} className="font-medium">
                                    {chave.nome} <Badge variant="outline" className={`ml-2 text-[10px] uppercase ${chave.tipo === 'amarela' ? 'text-amber-500 border-amber-500' : 'text-slate-400 border-slate-400'}`}>{chave.tipo}</Badge>
                                  </li>
                                ))
                              : <li className="text-muted-foreground italic">Nenhuma informada</li>
                            }
                          </ul>
                        </div>
                      </div>
                    </>
                  )}

                  {tarefa.categoria === 'achados_perdidos' && (
                    <>
                      <div className="grid grid-cols-3 gap-2 border-b pb-2">
                        <span className="text-muted-foreground">Local Encontrado:</span>
                        <span className="col-span-2 font-medium">{tarefa.dados_especificos?.local_encontro || '-'}</span>
                      </div>
                      <div className="grid grid-cols-1 gap-2 border-b pb-2">
                        <span className="text-muted-foreground block">Descrição do Pertence:</span>
                        <span className="font-medium whitespace-pre-wrap">{tarefa.dados_especificos?.descricao_pertence || '-'}</span>
                      </div>
                      {/* Placeholder for Photo */}
                      {tarefa.dados_especificos?.foto_pertence_url && (
                        <div className="mt-2">
                           <span className="text-muted-foreground block mb-2">Foto Anexa:</span>
                           {/* Em uma implementação real, seria um <img src={url} /> aqui puxando do bucket */}
                           <div className="bg-muted h-32 w-32 rounded-md flex items-center justify-center text-xs text-muted-foreground border">
                              [Ver Imagem]
                           </div>
                        </div>
                      )}
                    </>
                  )}

                  {tarefa.categoria === 'eventos' && (
                    <>
                      <div className="grid grid-cols-3 gap-2 border-b pb-2">
                        <span className="text-muted-foreground">Local do Evento:</span>
                        <span className="col-span-2 font-medium capitalize">{String(tarefa.dados_especificos?.local_evento).replace('_', ' ') || '-'}</span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 border-b pb-2">
                        <span className="text-muted-foreground">Público Est.:</span>
                        <span className="col-span-2 font-medium">{tarefa.dados_especificos?.publico_estimado || '-'}</span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 border-b pb-4 pt-2">
                        <div className="space-y-2">
                           <div className="text-xs text-muted-foreground">Início Montagem</div>
                           <div className="font-semibold text-sm">{tarefa.dados_especificos?.data_hora_inicio_montagem ? format(new Date(tarefa.dados_especificos.data_hora_inicio_montagem), "dd/MM/yy HH:mm", { locale: ptBR }) : '-'}</div>
                           <div className="text-xs text-muted-foreground mt-2">Início Evento</div>
                           <div className="font-semibold text-sm">{tarefa.dados_especificos?.data_hora_inicio_evento ? format(new Date(tarefa.dados_especificos.data_hora_inicio_evento), "dd/MM/yy HH:mm", { locale: ptBR }) : '-'}</div>
                        </div>
                        <div className="space-y-2">
                           <div className="text-xs text-muted-foreground">Fim Desmontagem</div>
                           <div className="font-semibold text-sm">{tarefa.dados_especificos?.data_hora_desmontagem ? format(new Date(tarefa.dados_especificos.data_hora_desmontagem), "dd/MM/yy HH:mm", { locale: ptBR }) : '-'}</div>
                           <div className="text-xs text-muted-foreground mt-2">Fim Evento</div>
                           <div className="font-semibold text-sm">{tarefa.dados_especificos?.data_hora_fim_evento ? format(new Date(tarefa.dados_especificos.data_hora_fim_evento), "dd/MM/yy HH:mm", { locale: ptBR }) : '-'}</div>
                        </div>
                      </div>

                      <div className="pt-2">
                        <span className="text-muted-foreground font-semibold block mb-2">Vigilantes Escalados:</span>
                        <div className="flex flex-wrap gap-2">
                          {tarefa.dados_especificos?.vigilantes_escalados?.length > 0 
                            ? tarefa.dados_especificos.vigilantes_escalados.map((vigilante: string, idx: number) => (
                                <Badge key={idx} variant="secondary" className="font-medium">{vigilante}</Badge>
                              ))
                            : <span className="text-muted-foreground text-sm italic">Nenhum vigilante escalado.</span>
                          }
                        </div>
                      </div>
                    </>
                  )}

                  {/* Mostra desfecho se existir */}
                  {tarefa.dados_especificos?.desfecho_final && (
                    <>
                      <Separator className="my-2" />
                      <div className="grid grid-cols-3 gap-2 text-primary">
                        <span className="font-semibold">Desfecho:</span>
                        <span className="col-span-2 font-bold uppercase">{String(tarefa.dados_especificos.desfecho_final).replace('_', ' ')}</span>
                      </div>
                      {tarefa.dados_especificos?.desfecho_observacao && (
                        <div className="grid grid-cols-3 gap-2 mt-1">
                          <span className="text-muted-foreground">Obs. Desfecho:</span>
                          <span className="col-span-2 italic">{tarefa.dados_especificos.desfecho_observacao}</span>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </section>

              {/* Updates / History Area */}
              <section className="space-y-4">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Histórico e Atualizações</h3>
                
                <div className="space-y-4">
                  {historicoNotas.length > 0 ? (
                    historicoNotas.map((nota: any, index: number) => (
                      <div key={index} className="flex gap-3 text-sm">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          <User className="h-4 w-4 text-primary" />
                        </div>
                        <div className="flex-1 bg-muted/50 rounded-lg p-3">
                          <div className="flex justify-between items-center mb-1">
                            <span className="font-medium">{nota.autor}</span>
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(nota.data), "dd/MM HH:mm", { locale: ptBR })}
                            </span>
                          </div>
                          <p className="text-muted-foreground whitespace-pre-wrap">{nota.texto}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-sm text-center text-muted-foreground py-4 bg-muted/20 rounded-md border border-dashed">
                      Nenhuma atualização registrada ainda.
                    </div>
                  )}
                </div>

                <div className="pt-2">
                  <Textarea 
                    placeholder="Adicionar uma nota ou atualização sobre esta tarefa..."
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    className="min-h-[80px] resize-none mb-2"
                  />
                  <div className="flex justify-end">
                    <Button size="sm" onClick={handleAddNote} disabled={!newNote.trim() || isSubmitting}>
                      {isSubmitting ? "Salvando..." : "Salvar Nota"}
                    </Button>
                  </div>
                </div>
              </section>
            </div>
            
            {/* Sidebar with Meta Information */}
            <div className="space-y-6">
              <section className="bg-muted/20 border rounded-md p-4 space-y-4">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Detalhes</h3>
                
                <div className="space-y-3 text-sm">
                  <div>
                    <span className="text-muted-foreground block mb-1">Criado por</span>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{tarefa.created_by_name || 'Desconhecido'}</span>
                    </div>
                  </div>
                  
                  <div>
                    <span className="text-muted-foreground block mb-1">Criado em</span>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>{format(new Date(tarefa.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}</span>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <span className="text-muted-foreground block mb-1">Última atualização</span>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{tarefa.updated_by_name || '-'}</span>
                    </div>
                    {tarefa.updated_at && (
                      <div className="flex items-center gap-2 mt-1">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-xs">{format(new Date(tarefa.updated_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}</span>
                      </div>
                    )}
                  </div>
                </div>
              </section>
            </div>

          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}

