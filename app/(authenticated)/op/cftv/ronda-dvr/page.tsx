"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { CFTVService, DVR } from "@/services/cftv-service"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { toast } from "sonner"
import { 
  ClipboardCheck, 
  Save, 
  RefreshCcw, 
  Info, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Disc, 
  CircleOff,
  Search,
  Printer,
  FileText,
  Activity,
  User,
  Clock
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { supabase } from "@/lib/supabase"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

type ColorState = 'verde' | 'amarelo' | 'vermelho' | 'roxo' | 'preto'

const COLOR_CONFIG: Record<ColorState, { class: string, label: string, icon: any }> = {
  verde: { class: 'bg-emerald-500 shadow-emerald-500/50', label: 'Normal', icon: CheckCircle2 },
  amarelo: { class: 'bg-amber-400 shadow-amber-400/50', label: 'Interferência', icon: AlertTriangle },
  vermelho: { class: 'bg-rose-500 shadow-rose-500/50', label: 'Sem Sinal', icon: XCircle },
  roxo: { class: 'bg-purple-600 shadow-purple-600/50', label: 'Erro de Gravação', icon: Disc },
  preto: { class: 'bg-slate-900 shadow-slate-900/50', label: 'Desativado', icon: CircleOff },
}

const COLOR_ORDER: ColorState[] = ['verde', 'amarelo', 'vermelho', 'roxo', 'preto']

export default function RondaDVRPage() {
  const { usuario } = useAuth()
  const [dvrs, setDvrs] = useState<DVR[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [matrix, setMatrix] = useState<Record<string, Record<number, ColorState>>>({})
  const [observacoes, setObservacoes] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)

  useEffect(() => {
    fetchDvrs()
  }, [])

  const fetchDvrs = async () => {
    try {
      setLoading(true)
      const data = await CFTVService.getDVRs()
      setDvrs(data)
      
      // Inicializar matriz com 'verde' para todos
      const initialMatrix: Record<string, Record<number, ColorState>> = {}
      data.forEach(dvr => {
        initialMatrix[dvr.id] = {}
        for (let i = 1; i <= (dvr.canais || 16); i++) {
          initialMatrix[dvr.id][i] = 'verde'
        }
      })
      setMatrix(initialMatrix)
    } catch (error: any) {
      toast.error("Erro ao carregar DVRs: " + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleStatusSelect = (dvrId: string, channel: number, nextColor: ColorState) => {
    setMatrix(prev => ({
        ...prev,
        [dvrId]: {
          ...prev[dvrId],
          [channel]: nextColor
        }
    }))
  }

  const handleSave = async () => {
    if (!usuario) return
    
    setSaving(true)
    try {
      const registro = {
          data_ronda: new Date().toISOString(),
          operador_nome: usuario.nome,
          dados_ronda: matrix,
          observacoes
      }

      await CFTVService.salvarRonda(registro)
      
      // AUTO-GERAÇÃO DE CARD NO KANBAN SE HOUVER ERROS
      let temErros = false
      let detalhesErros = ""

      Object.entries(matrix).forEach(([dvrId, channels]) => {
        const dvr = dvrs.find(d => d.id === dvrId)
        const canaisComProblema = Object.entries(channels)
          .filter(([_, color]) => color === 'vermelho' || color === 'roxo' || color === 'amarelo')
          .map(([ch, color]) => `CH${ch.padStart(2, '0')} (${COLOR_CONFIG[color as ColorState].label})`)
        
        if (canaisComProblema.length > 0) {
          temErros = true
          detalhesErros += `\n- ${dvr?.nome}: ${canaisComProblema.join(', ')}`
        }
      })

      if (temErros) {
        await supabase.from('kanban_tarefas').insert({
          titulo: `Pendências identificadas na Ronda de DVRs`,
          categoria: 'ronda_dvr',
          status: 'entrada',
          descricao: `Irregularidades detectadas durante a ronda realizada por ${usuario.nome}.\n\nDetalhes:${detalhesErros}\n\nObservações: ${observacoes || 'Nenhuma'}`,
          created_by_name: 'Sistema (Ronda)',
          dados_especificos: {
            origem: 'Ronda Automática',
            operador: usuario.nome,
            detalhes_contingencia: detalhesErros
          }
        })
        toast.info("Card de tarefas gerado para as pendências encontradas.")
      }

      // NOVO: Gerar card de "Ronda Realizada" sempre em FINALIZADO
      try {
        // Espelhando exatamente a estrutura que funciona no KanbanForm
        const { error: kanbanError } = await supabase.from('kanban_tarefas').insert({
          titulo: `RONDA CONCLUÍDA - ${usuario.nome}`,
          categoria: 'ronda_dvr',
          status: 'finalizado',
          descricao: `Relatório de Ronda de CFTV finalizado com sucesso.\nSaúde do Sistema: ${getSystemHealth()}%.\nFaturamento de ocorrências: ${getProblematicDVRs().length} DVRs.`,
          created_by_name: usuario.nome || 'Usuário Desconhecido',
          updated_by_name: usuario.nome || 'Usuário Desconhecido',
          dados_especificos: {
            prioridade: 'baixa',
            saude_sistema: getSystemHealth(),
            total_dvrs: dvrs.length,
            origem: 'Ronda Automática'
          }
        })
        
        if (kanbanError) {
          console.error("Erro detalhado no Kanban:", kanbanError)
          // Se falhar o 'finalizado', tentamos como 'entrada' como último recurso
          await supabase.from('kanban_tarefas').insert({
            titulo: `RONDA CONCLUÍDA (Fallback) - ${usuario.nome}`,
            categoria: 'ronda_dvr',
            status: 'entrada',
            created_by_name: usuario.nome
          })
        }
      } catch (e) {
        console.error("Exceção técnica ao inserir no Kanban:", e)
      }

      toast.success("Ronda salva com sucesso!")
      setIsPreviewOpen(false)
      // Opcional: Limpar campos após sucesso
      setObservacoes("")
    } catch (error: any) {
      toast.error("Erro ao salvar ronda: " + error.message)
    } finally {
      setSaving(false)
    }
  }

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const reportHtml = document.getElementById('printable-report')?.innerHTML || '';
    
    printWindow.document.write(`
      <html>
        <head>
          <title>Relatório de Ronda - ${new Date().toLocaleDateString()}</title>
          <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
          <style>
            body { font-family: sans-serif; padding: 40px; color: #1e293b; }
            .bg-slate-50 { background-color: #f8fafc; }
            .bg-emerald-50 { background-color: #ecfdf5; }
            .bg-rose-50 { background-color: #fff1f2; }
            .border { border: 1px solid #e2e8f0; }
            .rounded-lg { border-radius: 0.5rem; }
            .p-4 { padding: 1rem; }
            .text-2xl { font-size: 1.5rem; line-height: 2rem; }
            .font-black { font-weight: 900; }
            .uppercase { text-transform: uppercase; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #e2e8f0; padding: 8px; text-align: left; font-size: 12px; }
            th { background-color: #f1f5f9; }
            .badge { display: inline-block; padding: 2px 8px; border-radius: 9999px; font-weight: bold; border: 1px solid #e2e8f0; margin-right: 4px; font-size: 10px; }
            @media print { .no-print { display: none; } }
          </style>
        </head>
        <body>
          ${reportHtml}
          <script>
            setTimeout(() => { window.print(); window.close(); }, 500);
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  }

  const getSystemHealth = () => {
    let totalCanais = 0
    let canaisNormais = 0
    
    Object.values(matrix).forEach(channels => {
      Object.values(channels).forEach(status => {
        totalCanais++
        if (status === 'verde' || status === 'preto') canaisNormais++
      })
    })

    const percent = totalCanais > 0 ? (canaisNormais / totalCanais) * 100 : 100
    return Math.round(percent)
  }

  const getProblematicDVRs = () => {
    return dvrs.filter(dvr => {
      const channels = matrix[dvr.id]
      if (!channels) return false
      return Object.values(channels).some(status => status !== 'verde' && status !== 'preto')
    })
  }

  const filteredDvrs = dvrs.filter(dvr => 
    dvr.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    dvr.localizacao?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4 space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-1 flex items-center gap-2">
            <ClipboardCheck className="h-8 w-8 text-blue-600" />
            Ronda dos DVR's
          </h1>
          <p className="text-muted-foreground flex items-center gap-2">
            Verificação diária de integridade e gravação dos sistemas de CFTV
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={fetchDvrs} disabled={loading}>
            <RefreshCcw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Recarregar
          </Button>
          <Button onClick={() => setIsPreviewOpen(true)} disabled={saving || dvrs.length === 0} className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/20">
            <FileText className="mr-2 h-4 w-4" />
            Finalizar e Ver Relatório
          </Button>
        </div>
      </div>

      {/* Legenda */}
      <Card className="bg-slate-50 dark:bg-slate-900/50 border-blue-100 dark:border-blue-900/30">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4">
            {COLOR_ORDER.map(color => {
              const config = COLOR_CONFIG[color]
              const Icon = config.icon
              return (
                <div key={color} className="flex items-center gap-2">
                  <div className={`h-4 w-4 rounded-full ${config.class} ring-2 ring-white dark:ring-slate-800`}></div>
                  <span className="text-xs font-medium flex items-center gap-1.5">
                    <Icon className="h-3 w-3 opacity-50" />
                    {config.label}
                  </span>
                </div>
              )
            })}
            <div className="flex items-center gap-2 text-xs text-muted-foreground ml-4 border-l pl-6 border-slate-300">
              <Info className="h-4 w-4" />
              <span>Clique na "bolinha" para alterar o status</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-none shadow-xl bg-white/80 dark:bg-slate-950/80 backdrop-blur-md">
        <CardHeader className="pb-0 pt-6 px-6">
          <div className="flex items-center justify-between">
            <CardTitle>Matriz de Monitoramento</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Filtrar DVR..." 
                className="pl-9 h-9" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <CardDescription>Clique nos indicadores para registrar ocorrências</CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="rounded-xl border overflow-hidden">
            <Table>
              <TableHeader className="bg-slate-50 dark:bg-slate-900">
                <TableRow>
                  <TableHead className="w-64 font-bold text-slate-700 dark:text-slate-200">Equipamento / DVR</TableHead>
                  {Array.from({ length: 16 }).map((_, i) => (
                    <TableHead key={i} className="text-center font-bold text-slate-600 dark:text-slate-300 text-[10px] p-1 border-l">
                      {i + 1}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDvrs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={17} className="text-center py-12 text-muted-foreground">
                      Nenhum DVR encontrado para esses critérios.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredDvrs.map((dvr) => (
                    <TableRow key={dvr.id} className="hover:bg-blue-50/30 dark:hover:bg-blue-900/10 transition-colors">
                      <TableCell className="font-semibold text-slate-800 dark:text-slate-200 py-3">
                        {dvr.nome}
                        {dvr.localizacao && <div className="text-[10px] text-muted-foreground font-normal">{dvr.localizacao}</div>}
                      </TableCell>
                      {Array.from({ length: 16 }).map((_, i) => {
                        const channel = i + 1
                        const status = matrix[dvr.id]?.[channel] || 'verde'
                        return (
                          <TableCell key={channel} className="p-0 text-center border-l first:border-l-0">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <button
                                  className={`
                                    h-7 w-7 rounded-full transition-all duration-300 hover:scale-110 
                                    shadow-sm hover:shadow-md border-2 border-white dark:border-slate-800
                                    flex items-center justify-center group relative mx-auto
                                    ${COLOR_CONFIG[status].class}
                                  `}
                                  title={`Canal ${channel}: ${COLOR_CONFIG[status].label}`}
                                >
                                  <span className="text-[10px] font-bold text-white opacity-0 group-hover:opacity-100 transition-opacity">
                                    {channel}
                                  </span>
                                  
                                  {/* Pulse effect for non-green items */}
                                  {status !== 'verde' && status !== 'preto' && (
                                    <span className={`absolute inset-0 rounded-full animate-ping opacity-25 ${COLOR_CONFIG[status].class}`}></span>
                                  )}
                                </button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="center" className="w-[180px]">
                                <DropdownMenuLabel>Status do Canal {channel}</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                {COLOR_ORDER.map((color) => {
                                  const config = COLOR_CONFIG[color]
                                  const Icon = config.icon
                                  return (
                                    <DropdownMenuItem 
                                      key={color} 
                                      onClick={() => handleStatusSelect(dvr.id, channel, color)}
                                      className="flex items-center gap-3 cursor-pointer"
                                    >
                                      <div className={`h-3 w-3 rounded-full ${config.class}`} />
                                      <span className="flex-1 font-medium">{config.label}</span>
                                      <Icon className="h-4 w-4 opacity-70" />
                                    </DropdownMenuItem>
                                  )
                                })}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        )
                      })}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card className="border-none shadow-lg">
        <CardHeader>
          <CardTitle className="text-lg">Observações da Ronda</CardTitle>
          <CardDescription>Relate detalhes técnicos ou observações importantes sobre as pendências encontradas.</CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea 
            placeholder="Digite aqui observações gerais sobre a rodada de verificação..."
            className="min-h-[120px] bg-slate-50 dark:bg-slate-900 focus-visible:ring-blue-500"
            value={observacoes}
            onChange={(e) => setObservacoes(e.target.value)}
          />
        </CardContent>
      </Card>

      <div className="flex justify-end pb-8">
        <Button size="lg" onClick={() => setIsPreviewOpen(true)} disabled={saving || dvrs.length === 0} className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white px-12 h-14 text-lg font-bold rounded-2xl shadow-xl shadow-blue-600/20 hover:scale-[1.02] active:scale-[0.98] transition-all">
          <Save className="mr-3 h-6 w-6" />
          FINALIZAR E GERAR RELATÓRIO
        </Button>
      </div>

      {/* Modal de Relatório / Prévia */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0 border-none shadow-2xl">
          <div id="printable-report" className="bg-white p-8 space-y-8 text-slate-900 printable-area">
            {/* Header Relatório */}
            <div className="flex justify-between items-start border-b-2 border-slate-900 pb-6 print:pb-4">
              <div>
                <h2 className="text-2xl font-black uppercase tracking-tighter text-slate-900 flex items-center gap-2">
                  <ClipboardCheck className="h-8 w-8" />
                  Relatório de Ronda de DVR's
                </h2>
                <div className="flex gap-4 mt-2 text-sm font-semibold text-slate-600">
                  <span className="flex items-center gap-1.5"><User className="h-4 w-4" /> Operador: {usuario?.nome}</span>
                  <span className="flex items-center gap-1.5"><Clock className="h-4 w-4" /> Data: {new Date().toLocaleDateString('pt-BR')} {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-4xl font-black text-blue-600 leading-none">{getSystemHealth()}%</div>
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Saúde do Sistema</div>
              </div>
            </div>

            {/* Resumo Estatístico */}
            <div className="grid grid-cols-3 gap-6">
              <div className="bg-slate-50 border p-4 rounded-lg">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Total de DVRs</div>
                <div className="text-2xl font-black text-slate-900">{dvrs.length}</div>
              </div>
              <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-lg">
                <div className="text-xs font-bold text-emerald-600/60 uppercase tracking-wider mb-1">DVRs Normais</div>
                <div className="text-2xl font-black text-emerald-600">{dvrs.length - getProblematicDVRs().length}</div>
              </div>
              <div className="bg-rose-50 border border-rose-100 p-4 rounded-lg">
                <div className="text-xs font-bold text-rose-600/60 uppercase tracking-wider mb-1">DVRs com Ocorrências</div>
                <div className="text-2xl font-black text-rose-600">{getProblematicDVRs().length}</div>
              </div>
            </div>

            {/* Detalhamento de Ocorrências */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold flex items-center gap-2 border-b pb-2">
                <Activity className="h-5 w-5 text-blue-600" />
                Detalhamento de Irregularidades
              </h3>
              
              {getProblematicDVRs().length === 0 ? (
                <div className="text-center py-8 bg-slate-50 rounded-xl border-2 border-dashed text-slate-500 font-medium italic">
                  Nenhuma irregularidade detectada em nenhum DVR nesta ronda.
                </div>
              ) : (
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader className="bg-slate-100">
                      <TableRow>
                        <TableHead className="font-bold text-slate-800">Equipamento</TableHead>
                        <TableHead className="font-bold text-slate-800">Canais com Problema / Status Identificado</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {getProblematicDVRs().map((dvr) => {
                        const problems = Object.entries(matrix[dvr.id] || {})
                          .filter(([_, color]) => color !== 'verde' && color !== 'preto')
                          .map(([ch, color]) => ({ ch, label: COLOR_CONFIG[color as ColorState].label, color: COLOR_CONFIG[color as ColorState].class }))
                        
                        return (
                          <TableRow key={dvr.id}>
                            <TableCell className="font-bold text-slate-900">{dvr.nome}</TableCell>
                            <TableCell>
                              <div className="flex flex-wrap gap-2">
                                {problems.map((p, idx) => (
                                  <Badge key={idx} variant="outline" className={`border-slate-200 bg-white font-bold p-1 px-2`}>
                                    <div className={`w-2 h-2 rounded-full ${p.color} mr-1.5 shadow-sm`} />
                                    CH{String(p.ch).padStart(2, '0')}: {p.label}
                                  </Badge>
                                ))}
                              </div>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>

            {/* Observações */}
            {observacoes && (
              <div className="space-y-2">
                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Observações Técnicas:</h3>
                <div className="p-4 bg-slate-50 border rounded-lg text-sm leading-relaxed italic text-slate-700">
                  {observacoes}
                </div>
              </div>
            )}

            {/* Rodapé Relatório - Legenda e Assinaturas */}
            <div className="pt-8 space-y-12">
              <div className="flex items-center justify-center gap-6 p-4 bg-slate-50 rounded-xl border border-dotted border-slate-300 print:bg-white print:border-none">
                 {COLOR_ORDER.map(color => {
                    const config = COLOR_CONFIG[color]
                    return (
                      <div key={color} className="flex items-center gap-1.5">
                        <div className={`h-3 w-3 rounded-full ${config.class}`} />
                        <span className="text-[10px] font-bold text-slate-600">{config.label}</span>
                      </div>
                    )
                 })}
              </div>

              <div className="grid grid-cols-2 gap-12 pt-8">
                <div className="text-center space-y-2">
                  <div className="border-t-2 border-slate-900 mx-auto w-4/5 pt-2 font-bold text-sm">Assinatura do Operador</div>
                  <div className="text-[10px] text-slate-500 font-bold uppercase">{usuario?.nome}</div>
                </div>
                <div className="text-center space-y-2">
                  <div className="border-t-2 border-slate-900 mx-auto w-4/5 pt-2 font-bold text-sm">Responsável Técnico / Segurança</div>
                </div>
              </div>
              
              <div className="text-center pt-4">
                <p className="text-[9px] text-slate-400 font-bold italic uppercase leading-none">
                   Este relatório foi gerado automaticamente pelo Sistema de Gestão Interna. 
                   Irregularidades vinculadas ao módulo de manutenção (Dashboard).
                </p>
              </div>
            </div>
          </div>

          <DialogFooter className="sticky bottom-0 bg-slate-50/90 backdrop-blur-md p-6 border-t gap-3 print:hidden">
            <Button variant="outline" onClick={() => setIsPreviewOpen(false)} className="font-bold">
              Voltar e Ajustar
            </Button>
            <Button variant="outline" onClick={handlePrint} className="bg-white hover:bg-slate-100 font-bold">
              <Printer className="mr-2 h-4 w-4" />
              Imprimir Relatório
            </Button>
            <Button onClick={handleSave} disabled={saving} className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 shadow-xl shadow-blue-600/20">
              {saving ? 'Gravando...' : 'Confirmar e Salvar Ronda'}
            </Button>
            <style jsx global>{`
              .container {
                max-width: 1400px !important;
              }
            `}</style>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
