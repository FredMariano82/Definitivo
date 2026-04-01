"use client"

import { useState, useEffect } from "react"
import { ChaveInventario, ChavesService, ChaveStatus } from "@/services/chaves-service"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search, Loader2, LogOut, LogIn, History, ListCheck } from "lucide-react"
import { toast } from "sonner"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useAuth } from "@/contexts/auth-context"

export function ChavesInventory() {
  const { usuario } = useAuth()
  const [chaves, setChaves] = useState<ChaveInventario[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterModelo, setFilterModelo] = useState<string>("todos")
  const [filterStatus, setFilterStatus] = useState<string>("todos")
  const [sugestoes, setSugestoes] = useState<{ nome: string, setor: string }[]>([])
  const [historico, setHistorico] = useState<any[]>([])
  const [historicoLoading, setHistoricoLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("inventario")
  
  // Modal de Devolução
  const [returnModalOpen, setReturnModalOpen] = useState(false)
  const [chaveParaDevolver, setChaveParaDevolver] = useState<ChaveInventario | null>(null)
  const [quemDevolveu, setQuemDevolveu] = useState("")

  useEffect(() => {
    fetchChaves()
    fetchSugestoes()
    fetchHistorico()
  }, [])

  async function fetchHistorico() {
    try {
      setHistoricoLoading(true)
      const data = await ChavesService.getHistorico()
      setHistorico(data)
    } catch (error) {
      console.error("Erro ao buscar histórico:", error)
    } finally {
      setHistoricoLoading(false)
    }
  }

  async function fetchSugestoes() {
    try {
      const data = await ChavesService.getSugestoes()
      setSugestoes(data)
    } catch (error) {
      console.error("Erro ao buscar sugestões:", error)
    }
  }

  async function fetchChaves() {
    try {
      setLoading(true)
      const data = await ChavesService.getTodas()
      setChaves(data)
    } catch (error: any) {
      console.error(error)
      toast.error(error.message || "Erro ao carregar inventário de chaves")
    } finally {
      setLoading(false)
    }
  }

  const handleConfirmarDevolucao = async () => {
    if (!chaveParaDevolver) return
    
    // Lógica inteligente: Se vazio, usa quem retirou
    const nomeFinal = quemDevolveu.trim() || chaveParaDevolver.responsavel_nome || "Nao informado"
    
    try {
        await ChavesService.devolver(chaveParaDevolver.id, nomeFinal, usuario?.nome || "Operador")
        toast.success(`Chave ${chaveParaDevolver.numero} devolvida por ${nomeFinal}!`)
        setReturnModalOpen(false)
        setQuemDevolveu("")
        fetchChaves()
        fetchHistorico()
    } catch (e: any) {
        toast.error("Erro ao devolver: " + e.message)
    }
  }

  const initialFiltered = chaves.filter(c => {
    const searchString = (c.numero + c.local + (c.responsavel_nome || '') + (c.responsavel_setor || '')).toLowerCase()
    const matchSearch = searchString.includes(searchTerm.toLowerCase())
    const matchModelo = filterModelo === "todos" || c.modelo === filterModelo
    const matchStatus = filterStatus === "todos" || c.status === filterStatus
    return matchSearch && matchModelo && matchStatus
  })

  // Ordenação base por número
  initialFiltered.sort((a, b) => (a.numero || '').localeCompare(b.numero || '', undefined, { numeric: true }))

  let filteredChaves = initialFiltered

  // Se o filtro for "todos", aplicamos a intercalação visual
  if (filterModelo === "todos") {
    const amarelas = initialFiltered.filter(c => c.modelo === 'amarela')
    const pratas = initialFiltered.filter(c => c.modelo === 'prata')
    const interleaved: ChaveInventario[] = []
    const maxLen = Math.max(amarelas.length, pratas.length)
    for (let i = 0; i < maxLen; i++) {
      if (i < amarelas.length) interleaved.push(amarelas[i])
      if (i < pratas.length) interleaved.push(pratas[i])
    }
    filteredChaves = interleaved
  }

  const getStatusBadge = (status: ChaveStatus) => {
    switch (status) {
      case 'disponivel': return <Badge className="bg-[#008f39] hover:bg-[#008f39] text-white border-0 px-2 py-0.5 rounded-full text-[11px] font-normal">Disponível</Badge>
      case 'emprestada': return <Badge className="bg-[#ff8c00] hover:bg-[#ff8c00] text-white border-0 px-2 py-0.5 rounded-full text-[11px] font-normal">Emprestada</Badge>
      case 'nao_devolvida': return <Badge className="bg-[#d00000] hover:bg-[#d00000] text-white border-0 px-2 py-0.5 rounded-full text-[11px] font-normal">Não Devolvida</Badge>
      case 'manutencao': return <Badge variant="secondary" className="px-2 py-0.5 rounded-full text-[11px] font-normal">Manutenção</Badge>
      case 'extraviada': return <Badge variant="destructive" className="px-2 py-0.5 rounded-full text-[11px] font-normal">Extraviada</Badge>
      default: return null
    }
  }

  const getModeloStyle = (modelo: string) => {
    return modelo === 'amarela' ? "bg-[#ffb400] text-black" : "bg-[#e2e8f0] text-black"
  }

  if (loading && chaves.length === 0) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-3 text-muted-foreground">Carregando inventário...</span>
      </div>
    )
  }

  return (
    <Tabs defaultValue="inventario" className="w-full" onValueChange={setActiveTab}>
      <TabsList className="grid w-[400px] grid-cols-2 mb-6 ml-0">
        <TabsTrigger value="inventario" className="flex items-center gap-2">
          <ListCheck className="h-4 w-4" />
          Inventário Atual
        </TabsTrigger>
        <TabsTrigger value="historico" className="flex items-center gap-2" onClick={() => fetchHistorico()}>
          <History className="h-4 w-4" />
          Histórico de Movimentos
        </TabsTrigger>
      </TabsList>

      <TabsContent value="inventario" className="space-y-4 border-0 p-0 m-0">
        <div className="bg-white/50 backdrop-blur-sm p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-1 group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
            <Input 
              placeholder="Pesquisar por número, local ou responsável..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-white/80 border-slate-200 focus:border-blue-300 transition-all"
            />
          </div>
          
          <div className="flex gap-2 shrink-0">
            <Select value={filterModelo} onValueChange={setFilterModelo}>
              <SelectTrigger className="w-[140px] bg-white">
                <SelectValue placeholder="Modelo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos Modelos</SelectItem>
                <SelectItem value="prata">Chave Prata</SelectItem>
                <SelectItem value="amarela">Chave Amarela</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[140px] bg-white">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos Status</SelectItem>
                <SelectItem value="disponivel">Disponível</SelectItem>
                <SelectItem value="emprestada">Emprestada</SelectItem>
                <SelectItem value="nao_devolvida">Não Devolvida</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" size="icon" onClick={() => fetchChaves()} title="Atualizar">
              <Loader2 className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>

        <div className="bg-white border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto max-h-[80vh]">
            <table className="w-full text-left border-collapse border border-slate-200">
              <thead className="sticky top-0 z-10 bg-slate-50 border-b border-slate-200">
                <tr className="text-[10px] font-bold text-slate-500 uppercase">
                  <th className="px-2 py-1.5 w-20 border border-slate-200 text-center">CHAVE</th>
                  <th className="px-2 py-1.5 w-[350px] border border-slate-200">LOCAL / BLOCO</th>
                  <th className="px-2 py-1.5 w-32 border border-slate-200">STATUS</th>
                  <th className="px-2 py-1.5 border border-slate-200">RESPONSÁVEL</th>
                  <th className="px-2 py-1.5 border border-slate-200">SETOR</th>
                  <th className="px-2 py-1.5 border border-slate-200">OPERADOR</th>
                  <th className="px-2 py-1.5 w-28 border border-slate-200 text-left">INÍCIO</th>
                  <th className="px-2 py-1.5 w-20 border border-slate-200 text-center">AÇÃO</th>
                </tr>
              </thead>
              <tbody className="text-[12px]">
                {filteredChaves.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center text-slate-400">
                      Nenhuma chave encontrada com os filtros atuais.
                    </td>
                  </tr>
                ) : (
                  filteredChaves.map((chave) => (
                    <tr key={chave.id} className="hover:bg-slate-50 transition-colors">
                      <td className={`px-2 py-1 border border-slate-200 font-bold text-center ${getModeloStyle(chave.modelo)}`}>
                        {chave.numero}
                      </td>
                      <td className="px-2 py-1 border border-slate-200">
                        <div className="font-normal text-slate-700">{chave.local}</div>
                        {chave.obs && <div className="text-[10px] text-slate-400 italic mt-0.5">{chave.obs}</div>}
                      </td>
                      <td className="px-2 py-1 border border-slate-200 text-center">{getStatusBadge(chave.status)}</td>
                      <td className="px-2 py-1 border border-slate-200">
                        <Input 
                          className="h-7 text-[12px] bg-transparent border-0 focus-visible:ring-1 focus-visible:ring-blue-400 px-1 font-medium text-slate-700"
                          placeholder="Responsável..."
                          value={chave.responsavel_nome || ''}
                          list="responsavels-list"
                          onChange={(e) => {
                            const novoNome = e.target.value
                            setChaves(prev => prev.map(c => c.id === chave.id ? { ...c, responsavel_nome: novoNome } : c))
                            const sugestao = sugestoes.find(s => s.nome === novoNome)
                            if (sugestao && sugestao.setor) {
                              setChaves(prev => prev.map(c => c.id === chave.id ? { ...c, responsavel_setor: sugestao.setor } : c))
                            }
                          }}
                        />
                      </td>
                      <td className="px-2 py-1 border border-slate-200">
                        <Input 
                          className="h-7 text-[12px] bg-transparent border-0 focus-visible:ring-1 focus-visible:ring-blue-400 px-1 text-slate-600"
                          placeholder="Setor..."
                          value={chave.responsavel_setor || ''}
                          list="setores-list"
                          onChange={(e) => {
                            const novoSetor = e.target.value
                            setChaves(prev => prev.map(c => c.id === chave.id ? { ...c, responsavel_setor: novoSetor } : c))
                          }}
                        />
                      </td>
                      <td className="px-2 py-1 border border-slate-200 text-slate-600">
                        {chave.operador_nome || '-'}
                      </td>
                      <td className="px-2 py-1 border border-slate-200 text-left">
                        {chave.data_emprestimo ? (
                          <span className="text-slate-500 font-normal">
                            {format(new Date(chave.data_emprestimo), "dd/MM/yyyy HH:mm")}
                          </span>
                        ) : '-'}
                      </td>
                      <td className="px-2 py-1 border border-slate-200 text-center">
                        {chave.status === 'disponivel' ? (
                          <Button 
                            size="sm" variant="ghost" 
                            className={`h-6 w-6 p-0 rounded-full ${chave.responsavel_nome ? 'text-blue-600 bg-blue-50 ring-2 ring-blue-500/20' : 'text-emerald-600 hover:bg-emerald-50'}`}
                            onClick={async () => {
                              if (!chave.responsavel_nome || !chave.responsavel_setor) {
                                toast.error("Preencha Responsável e Setor")
                                return
                              }
                              try {
                                await ChavesService.emprestar(chave.id, {
                                  responsavel_nome: chave.responsavel_nome,
                                  responsavel_setor: chave.responsavel_setor,
                                  operador_nome: usuario?.nome || "Operador"
                                })
                                toast.success(`Chave ${chave.numero} emprestada!`)
                                fetchChaves()
                                fetchHistorico()
                              } catch (e: any) { toast.error(e.message) }
                            }}
                          >
                            <LogOut className="h-3 w-3" />
                          </Button>
                        ) : chave.status === 'emprestada' ? (
                          <div className="flex items-center justify-center gap-1">
                            <Button 
                              size="sm" variant="ghost" 
                              className="h-6 w-6 p-0 text-orange-600 hover:bg-orange-50 rounded-full"
                              onClick={() => {
                                  setChaveParaDevolver(chave)
                                  setQuemDevolveu("")
                                  setReturnModalOpen(true)
                              }}
                              title="Registrar Devolução"
                            >
                              <LogIn className="h-3 w-3" />
                            </Button>
                            <Button 
                              size="sm" variant="ghost" 
                              className="h-6 w-6 p-0 text-rose-600 hover:bg-rose-50 rounded-full"
                              onClick={async () => {
                                if (confirm(`Marcar chave ${chave.numero} como NÃO DEVOLVIDA?`)) {
                                  try {
                                    await ChavesService.marcarNaoDevolvida(chave.id, usuario?.nome || "Operador")
                                    toast.warning(`Chave ${chave.numero} marcada como pendente!`)
                                    fetchChaves()
                                    fetchHistorico()
                                  } catch (e: any) { toast.error(e.message) }
                                }
                              }}
                              title="Marcar como NÃO DEVOLVIDA"
                            >
                               <History className="h-3 w-3" />
                            </Button>
                          </div>
                        ) : (
                          <Button 
                            size="sm" variant="ghost" 
                            className="h-6 w-6 p-0 text-emerald-600 hover:bg-emerald-50 rounded-full"
                            onClick={() => {
                                setChaveParaDevolver(chave)
                                setQuemDevolveu("")
                                setReturnModalOpen(true)
                            }}
                            title="Registrar Devolução"
                          >
                            <LogIn className="h-3 w-3" />
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </TabsContent>

      <TabsContent value="historico" className="space-y-4 border-0 p-0 m-0">
        <div className="bg-white border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto max-h-[80vh]">
            <table className="w-full text-left border-collapse border border-slate-200">
              <thead className="sticky top-0 z-10 bg-slate-50 border-b border-slate-200">
                <tr className="text-[10px] font-bold text-slate-500 uppercase">
                  <th className="px-2 py-1.5 w-20 border border-slate-200 text-center">CHAVE</th>
                  <th className="px-2 py-1.5 w-24 border border-slate-200">TIPO</th>
                  <th className="px-2 py-1.5 w-[300px] border border-slate-200">DATA / HORA</th>
                  <th className="px-2 py-1.5 border border-slate-200">RESPONSÁVEL</th>
                  <th className="px-2 py-1.5 border border-slate-200">SETOR</th>
                  <th className="px-2 py-1.5 border border-slate-200">OPERADOR</th>
                  <th className="px-2 py-1.5 border border-slate-200">LOCAL / BLOCO</th>
                </tr>
              </thead>
              <tbody className="text-[12px]">
                {historicoLoading ? (
                  <tr><td colSpan={7} className="px-4 py-8 text-center text-blue-500"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></td></tr>
                ) : historico.length === 0 ? (
                  <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-400">Nenhum movimento registrado.</td></tr>
                ) : (
                  historico.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                      <td className={`px-2 py-1 border border-slate-200 font-bold text-center ${getModeloStyle(log.modelo)}`}>{log.numero}</td>
                      <td className="px-2 py-1 border border-slate-200 text-center">
                        <Badge className={
                          log.tipo === 'SAIDA' ? "bg-orange-100 text-orange-700 hover:bg-orange-100 border-0" : 
                          log.tipo === 'NÃO DEVOLVIDA' ? "bg-rose-100 text-rose-700 hover:bg-rose-100 border-0" :
                          "bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-0"
                        }>
                          {log.tipo}
                        </Badge>
                      </td>
                      <td className="px-2 py-1 border border-slate-200 font-medium text-slate-600">
                        {format(new Date(log.data_evento), "dd/MM/yyyy 'às' HH:mm:ss", { locale: ptBR })}
                      </td>
                      <td className="px-2 py-1 border border-slate-200 text-slate-700">{log.responsavel_nome}</td>
                      <td className="px-2 py-1 border border-slate-200 text-slate-600">{log.responsavel_setor}</td>
                      <td className="px-2 py-1 border border-slate-200 text-slate-500">{log.operador_nome}</td>
                      <td className="px-2 py-1 border border-slate-200 text-slate-400 italic text-[11px]">{log.local}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </TabsContent>

      <datalist id="responsavels-list">
        {sugestoes.map((s, idx) => <option key={idx} value={s.nome}>{s.setor}</option>)}
      </datalist>
      <datalist id="setores-list">
        {Array.from(new Set(sugestoes.map(s => s.setor))).filter(Boolean).map((setor, idx) => <option key={idx} value={setor as string} />)}
      </datalist>

      {/* Modal de Devolução Inteligente */}
      <Dialog open={returnModalOpen} onOpenChange={setReturnModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <LogIn className="h-5 w-5 text-orange-500" />
              Devolução de Chave
            </DialogTitle>
            <DialogDescription>
              Confirmando retorno da chave nº <strong>{chaveParaDevolver?.numero}</strong> ({chaveParaDevolver?.local})
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4 space-y-4">
            <div className="grid gap-2">
              <label className="text-sm font-medium">Quem está devolvendo?</label>
              <Input 
                placeholder={chaveParaDevolver?.responsavel_nome ? `Deixe vazio para: ${chaveParaDevolver.responsavel_nome}` : "Nome de quem devolveu"}
                value={quemDevolveu}
                onChange={(e) => setQuemDevolveu(e.target.value)}
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && handleConfirmarDevolucao()}
              />
              <p className="text-[11px] text-slate-500 italic">
                * Se deixar vazio, o sistema assumirá que quem retirou é quem está devolvendo.
              </p>
            </div>
            
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs space-y-1">
              <p><strong>Emprestado para:</strong> {chaveParaDevolver?.responsavel_nome}</p>
              <p><strong>Setor:</strong> {chaveParaDevolver?.responsavel_setor}</p>
              <p><strong>Data/Hora Saída:</strong> {chaveParaDevolver?.data_emprestimo && format(new Date(chaveParaDevolver.data_emprestimo), "dd/MM/yyyy HH:mm")}</p>
            </div>
          </div>
          
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setReturnModalOpen(false)}>Cancelar</Button>
            <Button className="bg-orange-600 hover:bg-orange-700 text-white" onClick={handleConfirmarDevolucao}>
              Confirmar Baixa
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Tabs>
  )
}

function Select({ value, onValueChange, children }: any) {
    return (
        <select 
            value={value} 
            onChange={(e) => onValueChange(e.target.value)}
            className="h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
            {children}
        </select>
    )
}

function SelectTrigger({ children, className }: any) { return <>{children}</> }
function SelectContent({ children }: any) { return <>{children}</> }
function SelectItem({ value, children }: any) { return <option value={value}>{children}</option> }
function SelectValue({ placeholder }: any) { return null }
