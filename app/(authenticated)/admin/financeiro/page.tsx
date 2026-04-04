"use client"

import { useState, useEffect } from "react"
import { FinanceiroService, RegistroFinanceiro } from "@/services/financeiro-service"
import { OpServiceV2, OpEquipe } from "@/services/op-service-v2"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
    Table, 
    TableBody, 
    TableCell, 
    TableHead, 
    TableHeader, 
    TableRow 
} from "@/components/ui/table"
import { 
    Select, 
    SelectContent, 
    SelectItem, 
    SelectTrigger, 
    SelectValue 
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { 
    DollarSign, 
    TrendingUp, 
    Clock, 
    CheckCircle2, 
    Filter, 
    RefreshCcw,
    Search
} from "lucide-react"
import { format, parseISO } from "date-fns"
import { ptBR } from "date-fns/locale"

export default function FinanceiroPage() {
    const [registros, setRegistros] = useState<RegistroFinanceiro[]>([])
    const [equipe, setEquipe] = useState<OpEquipe[]>([])
    const [resumo, setResumo] = useState({ totalPendente: 0, totalPago: 0, totalGeral: 0 })
    const [loading, setLoading] = useState(true)
    const [updating, setUpdating] = useState<string | null>(null)

    // Filtros
    const [filtroStatus, setFiltroStatus] = useState("todos")
    const [filtroProfissional, setFiltroProfissional] = useState("todos")
    const [filtroPatrocinador, setFiltroPatrocinador] = useState("todos")

    const carregarDados = async () => {
        setLoading(true)
        try {
            const [regData, resData, equipeData] = await Promise.all([
                FinanceiroService.getRegistros({
                    status: filtroStatus,
                    colaborador_id: filtroProfissional,
                    patrocinador: filtroPatrocinador
                }),
                FinanceiroService.getResumo(),
                OpServiceV2.getEquipe()
            ])
            setRegistros(regData)
            setResumo(resData)
            setEquipe(equipeData)
        } catch (error) {
            console.error("Erro ao carregar dados financeiros:", error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        carregarDados()
    }, [filtroStatus, filtroProfissional, filtroPatrocinador])

    const handleToggleStatus = async (id: string, currentStatus: string) => {
        setUpdating(id)
        try {
            const nextStatus = currentStatus === 'pendente' ? 'pago' : 'pendente'
            await FinanceiroService.updateStatus(id, nextStatus as any)
            await carregarDados()
        } catch (error) {
            console.error("Erro ao atualizar status:", error)
        } finally {
            setUpdating(null)
        }
    }

    const formatMoeda = (valor: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor)
    }

    return (
        <div className="p-8 space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">Financeiro Operacional</h1>
                    <p className="text-slate-500">Gestão de pagamentos e extratos de eventos.</p>
                </div>
                <Button 
                    onClick={carregarDados} 
                    variant="outline" 
                    className="flex items-center gap-2"
                    disabled={loading}
                >
                    <RefreshCcw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                    Atualizar
                </Button>
            </div>

            {/* Dashboard Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-white border-none shadow-sm overflow-hidden group hover:shadow-md transition-all duration-300 border-l-4 border-l-amber-500">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-slate-500 uppercase tracking-wider flex items-center gap-2">
                            <Clock className="h-4 w-4 text-amber-500" />
                            Total Pendente
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-slate-900">{formatMoeda(resumo.totalPendente)}</div>
                        <p className="text-xs text-slate-500 mt-1 italic">Valores aguardando pagamento</p>
                    </CardContent>
                </Card>

                <Card className="bg-white border-none shadow-sm overflow-hidden group hover:shadow-md transition-all duration-300 border-l-4 border-l-emerald-500">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-slate-500 uppercase tracking-wider flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                            Total Pago
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-slate-900">{formatMoeda(resumo.totalPago)}</div>
                        <p className="text-xs text-slate-500 mt-1 italic">Valores já liquidados</p>
                    </CardContent>
                </Card>

                <Card className="bg-white border-none shadow-sm overflow-hidden group hover:shadow-md transition-all duration-300 border-l-4 border-l-blue-500">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-slate-500 uppercase tracking-wider flex items-center gap-2">
                            <TrendingUp className="h-4 w-4 text-blue-500" />
                            Total Geral
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-slate-900">{formatMoeda(resumo.totalGeral)}</div>
                        <p className="text-xs text-slate-500 mt-1 italic">Montante total movimentado</p>
                    </CardContent>
                </Card>
            </div>

            {/* Filtros */}
            <Card className="border-none shadow-sm bg-slate-50/50">
                <CardContent className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-600 uppercase flex items-center gap-2">
                                <Search className="h-3 w-3" /> Profissional
                            </label>
                            <Select value={filtroProfissional} onValueChange={setFiltroProfissional}>
                                <SelectTrigger className="bg-white border-slate-200">
                                    <SelectValue placeholder="Todos os profissionais" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="todos">Todos os profissionais</SelectItem>
                                    {equipe.map(colab => (
                                        <SelectItem key={colab.id} value={colab.id}>{colab.nome_completo}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-600 uppercase flex items-center gap-2">
                                <Filter className="h-3 w-3" /> Patrocinador
                            </label>
                            <Select value={filtroPatrocinador} onValueChange={setFiltroPatrocinador}>
                                <SelectTrigger className="bg-white border-slate-200">
                                    <SelectValue placeholder="Todos" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="todos">Todos</SelectItem>
                                    <SelectItem value="Paulão">Paulão</SelectItem>
                                    <SelectItem value="Hagana">Hagana</SelectItem>
                                    <SelectItem value="OR">OR</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-600 uppercase flex items-center gap-2">
                                <Filter className="h-3 w-3" /> Status
                            </label>
                            <Select value={filtroStatus} onValueChange={setFiltroStatus}>
                                <SelectTrigger className="bg-white border-slate-200">
                                    <SelectValue placeholder="Todos" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="todos">Todos</SelectItem>
                                    <SelectItem value="pendente">Pendente</SelectItem>
                                    <SelectItem value="pago">Pago</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <Button 
                            variant="ghost" 
                            className="text-slate-500 hover:text-slate-800"
                            onClick={() => {
                                setFiltroStatus("todos")
                                setFiltroProfissional("todos")
                                setFiltroPatrocinador("todos")
                            }}
                        >
                            Limpar Filtros
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Tabela */}
            <Card className="border-none shadow-sm overflow-hidden">
                <Table>
                    <TableHeader className="bg-slate-50">
                        <TableRow>
                            <TableHead className="font-bold text-slate-700">Profissional</TableHead>
                            <TableHead className="font-bold text-slate-700">Evento / Fase</TableHead>
                            <TableHead className="font-bold text-slate-700">Patrocinador</TableHead>
                            <TableHead className="font-bold text-slate-700">Data</TableHead>
                            <TableHead className="font-bold text-slate-700">Valor</TableHead>
                            <TableHead className="font-bold text-slate-700">Status</TableHead>
                            <TableHead className="text-right font-bold text-slate-700">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center py-10 text-slate-500">
                                    <RefreshCcw className="h-6 w-6 animate-spin mx-auto mb-2" />
                                    Carregando lançamentos...
                                </TableCell>
                            </TableRow>
                        ) : registros.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center py-10 text-slate-500">
                                    Nenhum registro encontrado para os filtros selecionados.
                                </TableCell>
                            </TableRow>
                        ) : (
                            registros.map((reg) => (
                                <TableRow key={reg.id} className="hover:bg-slate-50/50 transition-colors">
                                    <TableCell>
                                        <div className="font-medium text-slate-900">{reg.colaborador?.nome_completo}</div>
                                        <div className="text-xs text-slate-500">{reg.colaborador?.funcao}</div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="font-medium text-slate-900">{reg.evento?.nome}</div>
                                        <Badge variant="outline" className="text-[10px] uppercase font-bold text-blue-600 border-blue-100 bg-blue-50">
                                            {reg.fase}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="secondary" className="bg-slate-100 text-slate-600 border-none">
                                            {reg.evento?.patrocinador || 'N/A'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-slate-600">
                                        {format(parseISO(reg.data_referencia), "dd/MM/yyyy", { locale: ptBR })}
                                    </TableCell>
                                    <TableCell className="font-bold text-slate-900">
                                        {formatMoeda(reg.valor_devido)}
                                    </TableCell>
                                    <TableCell>
                                        <Badge 
                                            className={`
                                                font-bold border-none
                                                ${reg.status_pagamento === 'pago' 
                                                    ? 'bg-emerald-100 text-emerald-700' 
                                                    : 'bg-amber-100 text-amber-700'}
                                            `}
                                        >
                                            {reg.status_pagamento.toUpperCase()}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button 
                                            size="sm"
                                            variant={reg.status_pagamento === 'pago' ? "ghost" : "default"}
                                            className={reg.status_pagamento === 'pago' ? "text-slate-400" : "bg-emerald-600 hover:bg-emerald-700"}
                                            disabled={updating === reg.id}
                                            onClick={() => handleToggleStatus(reg.id, reg.status_pagamento)}
                                        >
                                            {updating === reg.id ? (
                                                <RefreshCcw className="h-4 w-4 animate-spin" />
                                            ) : reg.status_pagamento === 'pago' ? (
                                                "Estornar"
                                            ) : (
                                                "Marcar Pago"
                                            )}
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </Card>
        </div>
    )
}
