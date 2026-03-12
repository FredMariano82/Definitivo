"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { KanbanDetailsModal } from "@/components/admin/kanban-details-modal"
import { SearchIcon, CalendarIcon } from "lucide-react"

type TarefaCategoria = 'imagem' | 'os' | 'ocorrencia' | 'autorizacao_chaves' | 'achados_perdidos' | 'eventos'

interface KanbanTarefa {
  id: string
  titulo: string
  descricao: string
  status: 'entrada' | 'fazendo' | 'aguardando' | 'historico'
  categoria: TarefaCategoria
  dados_especificos: Record<string, any>
  created_by_name?: string
  updated_by_name?: string
  created_at: string
  updated_at?: string
}

export default function LivroRegistrosPage() {
  const [tarefas, setTarefas] = useState<KanbanTarefa[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [categoriaFilter, setCategoriaFilter] = useState("todas")
  const [detailsModalOpen, setDetailsModalOpen] = useState(false)
  const [tarefaSelecionada, setTarefaSelecionada] = useState<KanbanTarefa | null>(null)

  useEffect(() => {
    fetchRegistros()
  }, [])

  async function fetchRegistros() {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('kanban_tarefas')
        .select('*')
        .eq('status', 'historico')
        .order('updated_at', { ascending: false })

      if (error) {
        console.error("Erro ao buscar registros:", error)
        return
      }

      setTarefas(data || [])
    } finally {
      setLoading(false)
    }
  }

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

  const handleRowClick = (tarefa: KanbanTarefa) => {
    setTarefaSelecionada(tarefa)
    setDetailsModalOpen(true)
  }

  const filteredTarefas = tarefas.filter(tarefa => {
    const matchesSearch =
      tarefa.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tarefa.descricao?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tarefa.created_by_name?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategoria = categoriaFilter === "todas" || tarefa.categoria === categoriaFilter;

    return matchesSearch && matchesCategoria;
  })

  // We reuse the same onAddNote logic from kanban page for consistency, 
  // though realistically "histórico" tasks shouldn't be heavily edited.
  const handleAddNote = async (tarefaId: string, note: string) => {
    try {
      const tarefa = tarefas.find(t => t.id === tarefaId)
      if (!tarefa) return

      const novaNota = {
        autor: "Usuário Desconhecido", // TODO: Inject useAuth
        data: new Date().toISOString(),
        texto: note
      }

      const historico_notas = tarefa.dados_especificos?.historico_notas || []
      const novosDadosEspecificos = {
        ...tarefa.dados_especificos,
        historico_notas: [...historico_notas, novaNota]
      }

      const { error } = await supabase
        .from('kanban_tarefas')
        .update({
          dados_especificos: novosDadosEspecificos,
          updated_at: new Date().toISOString()
        })
        .eq('id', tarefaId)

      if (error) throw error

      setTarefas(tarefas.map(t =>
        t.id === tarefaId
          ? { ...t, dados_especificos: novosDadosEspecificos, updated_at: new Date().toISOString() }
          : t
      ))

      if (tarefaSelecionada?.id === tarefaId) {
        setTarefaSelecionada({ ...tarefa, dados_especificos: novosDadosEspecificos, updated_at: new Date().toISOString() })
      }

    } catch (error) {
      console.error("Erro ao adicionar nota:", error)
    }
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Livro de Registros</h1>
        <p className="text-muted-foreground">
          Histórico consolidado de todas as tarefas, ocorrências e eventos arquivados pelo Centro de Controle.
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por título, descrição ou autor..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 bg-background"
          />
        </div>

        <Select value={categoriaFilter} onValueChange={setCategoriaFilter}>
          <SelectTrigger className="w-[200px] bg-background">
            <SelectValue placeholder="Todas as Categorias" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas as Categorias</SelectItem>
            <SelectItem value="ocorrencia">Ocorrência Padrão</SelectItem>
            <SelectItem value="imagem">Busca de Imagem / CFTV</SelectItem>
            <SelectItem value="os">Ordem de Serviço (OS)</SelectItem>
            <SelectItem value="autorizacao_chaves">Autorização de Chaves</SelectItem>
            <SelectItem value="achados_perdidos">Achados e Perdidos</SelectItem>
            <SelectItem value="eventos">Eventos</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="border rounded-md bg-background">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Título</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Ocorrência</TableHead>
              <TableHead>Solicitação</TableHead>
              <TableHead>Desfecho</TableHead>
              <TableHead>Criado Por</TableHead>
              <TableHead>Arquivado Em</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center h-24 text-muted-foreground">
                  Carregando registros...
                </TableCell>
              </TableRow>
            ) : filteredTarefas.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center h-24 text-muted-foreground">
                  Nenhum registro encontrado.
                </TableCell>
              </TableRow>
            ) : (
              filteredTarefas.map((tarefa) => (
                <TableRow
                  key={tarefa.id}
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => handleRowClick(tarefa)}
                >
                  <TableCell className="font-medium">{tarefa.titulo}</TableCell>
                  <TableCell>{getCategoriaBadge(tarefa.categoria)}</TableCell>
                  <TableCell className="text-xs whitespace-nowrap">
                    {(() => {
                      const dataOcorrencia = tarefa.categoria === 'imagem'
                        ? tarefa.dados_especificos?.data_hora_evento
                        : tarefa.categoria === 'eventos'
                          ? tarefa.dados_especificos?.data_hora_inicio_evento
                          : null;

                      return dataOcorrencia
                        ? format(new Date(dataOcorrencia), "dd/MM/yyyy HH:mm", { locale: ptBR })
                        : <span className="text-muted-foreground">-</span>;
                    })()}
                  </TableCell>
                  <TableCell className="text-xs whitespace-nowrap">
                    {format(new Date(tarefa.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                  </TableCell>
                  <TableCell>
                    {tarefa.dados_especificos?.desfecho_final
                      ? <span className="uppercase text-[10px] font-semibold text-primary px-2 py-0.5 bg-primary/10 rounded-full">{String(tarefa.dados_especificos.desfecho_final).replace('_', ' ')}</span>
                      : <span className="text-muted-foreground italic text-xs">Não informado</span>
                    }
                  </TableCell>
                  <TableCell className="text-sm">{tarefa.created_by_name || 'Desconhecido'}</TableCell>
                  <TableCell className="text-xs whitespace-nowrap">
                    {tarefa.updated_at
                      ? format(new Date(tarefa.updated_at), "dd/MM/yyyy HH:mm", { locale: ptBR })
                      : '-'
                    }
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {detailsModalOpen && (
        <KanbanDetailsModal
          tarefa={tarefaSelecionada}
          isOpen={detailsModalOpen}
          onClose={() => {
            setDetailsModalOpen(false)
            setTarefaSelecionada(null)
          }}
          onAddNote={handleAddNote}
        />
      )}
    </div>
  )
}
