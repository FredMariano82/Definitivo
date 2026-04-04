"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Activity, Clock, Users, TrendingUp, Calendar, X, ToggleLeft, ToggleRight } from "lucide-react"
import {
  ProdutividadeService,
  type ProdutividadeUsuario,
  type ProdutividadePerfil,
  type ProdutividadeDepartamento,
} from "../../services/produtividade-service"
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts'

export default function GraficoProdutividadeUsuarios({ 
  dataInicial: propDataInicial, 
  dataFinal: propDataFinal 
}: { 
  dataInicial?: string; 
  dataFinal?: string; 
}) {
  const [dadosProdutividade, setDadosProdutividade] = useState<ProdutividadeUsuario[]>([])
  const [dadosPorDepartamento, setDadosPorDepartamento] = useState<ProdutividadeDepartamento[]>([])
  const [usuariosSelecionados, setUsuariosSelecionados] = useState<Set<string>>(new Set())
  const [departamentosSelecionados, setDepartamentosSelecionados] = useState<Set<string>>(new Set())
  const [carregando, setCarregando] = useState(true)
  // Dados removidos (agora vêm via props)
  const [visualizacaoPorDepartamento, setVisualizacaoPorDepartamento] = useState(false)
  const [estatisticas, setEstatisticas] = useState({
    totalUsuarios: 0,
    totalPrestadores: 0,
    horarioMaisAtivo: { hora: 0, prestadores: 0 },
    usuarioMaisAtivo: { usuario: "", prestadores: 0 },
    mediaPrestadoresPorUsuario: 0,
  })

  useEffect(() => {
    buscarDados(propDataInicial, propDataFinal)
  }, [propDataInicial, propDataFinal])

  const buscarDados = async (inicio?: string, fim?: string) => {
    try {
      setCarregando(true)
      const [dadosIndividuais, dadosDepto, stats] = await Promise.all([
        ProdutividadeService.buscarProdutividadePorHora(inicio || undefined, fim || undefined),
        ProdutividadeService.buscarProdutividadePorDepartamento(inicio || undefined, fim || undefined),
        ProdutividadeService.buscarEstatisticasProdutividade(inicio || undefined, fim || undefined) as Promise<any>,
      ])

      setDadosProdutividade(dadosIndividuais)
      setDadosPorDepartamento(dadosDepto)
      setEstatisticas(stats)

      // Selecionar todos por padrão
      setUsuariosSelecionados(new Set(dadosIndividuais.map((u) => u.usuario)))
      setDepartamentosSelecionados(new Set(dadosDepto.map((p) => p.departamento)))
    } catch (error) {
      console.error("Erro ao buscar dados de produtividade:", error)
    } finally {
      setCarregando(false)
    }
  }

  // Funções de filtro removidas (agora controladas pelo pai)

  const toggleUsuario = (usuario: string) => {
    const novosUsuarios = new Set(usuariosSelecionados)
    if (novosUsuarios.has(usuario)) {
      novosUsuarios.delete(usuario)
    } else {
      novosUsuarios.add(usuario)
    }
    setUsuariosSelecionados(novosUsuarios)
  }

  const toggleDepartamento = (depto: string) => {
    const novosDeptos = new Set(departamentosSelecionados)
    if (novosDeptos.has(depto)) {
      novosDeptos.delete(depto)
    } else {
      novosDeptos.add(depto)
    }
    setDepartamentosSelecionados(novosDeptos)
  }

  const selecionarTodos = () => {
    if (visualizacaoPorDepartamento) {
      setDepartamentosSelecionados(new Set(dadosPorDepartamento.map((p) => p.departamento)))
    } else {
      setUsuariosSelecionados(new Set(dadosProdutividade.map((u) => u.usuario)))
    }
  }

  const desmarcarTodos = () => {
    if (visualizacaoPorDepartamento) {
      setDepartamentosSelecionados(new Set())
    } else {
      setUsuariosSelecionados(new Set())
    }
  }

  // Preparar dados para o gráfico
  const dadosGrafico = Array.from({ length: 24 }, (_, hora) => {
    const dadosHora: any = { hora: `${hora.toString().padStart(2, "0")}:00` }

    if (visualizacaoPorDepartamento) {
      dadosPorDepartamento.forEach((depto) => {
        if (departamentosSelecionados.has(depto.departamento)) {
          const dadoHora = depto.dadosPorHora.find((d) => d.hora === hora)
          dadosHora[depto.departamento] = dadoHora?.prestadores || 0
        }
      })
    } else {
      dadosProdutividade.forEach((usuario) => {
        if (usuariosSelecionados.has(usuario.usuario)) {
          const dadoHora = usuario.dadosPorHora.find((d) => d.hora === hora)
          dadosHora[usuario.usuario] = dadoHora?.prestadores || 0
        }
      })
    }

    return dadosHora
  })

  const temDados = dadosGrafico.some((hora) => Object.keys(hora).some((key) => key !== "hora" && hora[key] > 0))

  // Calcular escala dinâmica baseada nos dados reais
  const calcularEscala = () => {
    const maxPrestadores = Math.max(
      ...dadosGrafico.map((hora) =>
        Math.max(
          ...Object.keys(hora)
            .filter((key) => key !== "hora")
            .map((user) => hora[user] || 0),
        ),
      ),
    )

    // Definir escala mínima de 15 para cenários típicos
    const maxPrestadoresAjustado = Math.max(maxPrestadores, 15)

    let escalaMax, incremento
    if (maxPrestadoresAjustado <= 15) {
      escalaMax = 15
      incremento = 3 // 0, 3, 6, 9, 12, 15
    } else if (maxPrestadoresAjustado <= 25) {
      escalaMax = 25
      incremento = 5 // 0, 5, 10, 15, 20, 25
    } else {
      escalaMax = Math.ceil(maxPrestadoresAjustado / 10) * 10
      incremento = Math.ceil(escalaMax / 5)
    }

    const labels = []
    for (let i = 0; i <= escalaMax; i += incremento) {
      labels.push(i)
    }

    return { max: escalaMax, incremento, labels: labels.reverse() }
  }

  const escala = calcularEscala()

  const formatarTooltip = (value: any, name: string) => {
    return [`${value} prestadores`, name]
  }

  if (carregando) {
    return (
      <Card>
        <CardContent className="flex justify-center items-center h-96">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-slate-600"></div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Filtro removido (centralizado no DashboardAdmin) */}

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="backdrop-blur-xl bg-white/40 border-white/20 shadow-xl rounded-2xl overflow-hidden hover:scale-[1.02] transition-transform duration-300">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-semibold text-slate-600">Operadores Ativos</CardTitle>
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <Users className="h-4 w-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-700 tracking-tight">{estatisticas.totalUsuarios}</div>
            <p className="text-[10px] text-slate-500 mt-1 uppercase font-bold tracking-wider">Usuários logados</p>
          </CardContent>
        </Card>

        <Card className="backdrop-blur-xl bg-white/40 border-white/20 shadow-xl rounded-2xl overflow-hidden hover:scale-[1.02] transition-transform duration-300">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-semibold text-slate-600">Fluxo de Prestadores</CardTitle>
            <div className="p-2 bg-green-500/10 rounded-lg">
              <Activity className="h-4 w-4 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-700 tracking-tight">{estatisticas.totalPrestadores}</div>
            <p className="text-[10px] text-slate-500 mt-1 uppercase font-bold tracking-wider">Total processado</p>
          </CardContent>
        </Card>

        <Card className="backdrop-blur-xl bg-white/40 border-white/20 shadow-xl rounded-2xl overflow-hidden hover:scale-[1.02] transition-transform duration-300">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-semibold text-slate-600">Pico de Atividade</CardTitle>
            <div className="p-2 bg-orange-500/10 rounded-lg">
              <Clock className="h-4 w-4 text-orange-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-700 tracking-tight">
              {estatisticas.horarioMaisAtivo.hora.toString().padStart(2, "0")}:00
            </div>
            <p className="text-[10px] text-slate-500 mt-1 uppercase font-bold tracking-wider">{estatisticas.horarioMaisAtivo.prestadores} prestadores/hora</p>
          </CardContent>
        </Card>

        <Card className="backdrop-blur-xl bg-white/40 border-white/20 shadow-xl rounded-2xl overflow-hidden hover:scale-[1.02] transition-transform duration-300">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-semibold text-slate-600">Líder de Produção</CardTitle>
            <div className="p-2 bg-purple-500/10 rounded-lg">
              <TrendingUp className="h-4 w-4 text-purple-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-purple-700 truncate tracking-tight">
              {estatisticas.usuarioMaisAtivo.usuario || "N/A"}
            </div>
            <p className="text-[10px] text-slate-500 mt-1 uppercase font-bold tracking-wider">{estatisticas.usuarioMaisAtivo.prestadores} processamentos</p>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico Principal */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Controles */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <Users className="h-5 w-5" />
                {visualizacaoPorDepartamento ? "Departamentos" : "Usuários"} (
                {visualizacaoPorDepartamento ? dadosPorDepartamento.length : dadosProdutividade.length})
              </CardTitle>

              {/* Toggle de Visualização */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setVisualizacaoPorDepartamento(!visualizacaoPorDepartamento)}
                className="flex items-center gap-2"
              >
                {visualizacaoPorDepartamento ? <ToggleRight className="h-4 w-4" /> : <ToggleLeft className="h-4 w-4" />}
                {visualizacaoPorDepartamento ? "Departamento" : "Individual"}
              </Button>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={selecionarTodos}>
                Todos
              </Button>
              <Button variant="outline" size="sm" onClick={desmarcarTodos}>
                Nenhum
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {visualizacaoPorDepartamento
              ? // Visualização por Departamento
              dadosPorDepartamento.map((depto) => (
                <div key={depto.departamento} className="flex items-center space-x-3">
                  <Checkbox
                    id={depto.departamento}
                    checked={departamentosSelecionados.has(depto.departamento)}
                    onCheckedChange={() => toggleDepartamento(depto.departamento)}
                  />
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: depto.cor }} />
                    <Label
                      htmlFor={depto.departamento}
                      className="text-sm font-medium cursor-pointer truncate capitalize"
                      title={depto.departamento}
                    >
                      {depto.departamento}
                    </Label>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {depto.dadosPorHora.reduce((sum, h) => sum + h.prestadores, 0)}
                  </Badge>
                </div>
              ))
              : // Visualização Individual
              dadosProdutividade.map((usuario) => (
                <div key={usuario.usuario} className="flex items-center space-x-3">
                  <Checkbox
                    id={usuario.usuario}
                    checked={usuariosSelecionados.has(usuario.usuario)}
                    onCheckedChange={() => toggleUsuario(usuario.usuario)}
                  />
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: usuario.cor }} />
                    <Label
                      htmlFor={usuario.usuario}
                      className="text-sm font-medium cursor-pointer truncate"
                      title={`${usuario.usuario} (${usuario.perfil})`}
                    >
                      {usuario.usuario}
                    </Label>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {usuario.dadosPorHora.reduce((sum, h) => sum + h.prestadores, 0)}
                  </Badge>
                </div>
              ))}

            {(visualizacaoPorDepartamento ? dadosPorDepartamento.length : dadosProdutividade.length) === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Activity className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>Nenhum dado encontrado</p>
                <p className="text-sm">Ajuste o período ou verifique os dados</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Gráfico */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-800">📊 Produtividade por Horário</CardTitle>
            <p className="text-sm text-gray-600">
              Prestadores processados ao longo do dia •{" "}
              {visualizacaoPorDepartamento ? departamentosSelecionados.size : usuariosSelecionados.size}{" "}
              {visualizacaoPorDepartamento ? "departamento(s)" : "usuário(s)"} selecionado(s)
            </p>
          </CardHeader>
          <CardContent>
            <div className="w-full h-[450px] bg-white p-4">
              {temDados ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={dadosGrafico} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis 
                      dataKey="hora" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 12, fill: '#666' }}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 12, fill: '#666' }}
                      label={{ value: 'Prestadores', angle: -90, position: 'insideLeft', style: { fill: '#666' } }}
                    />
                    <Tooltip 
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                    />
                    <Legend />
                    
                    {visualizacaoPorDepartamento 
                      ? dadosPorDepartamento.map((depto) => (
                          departamentosSelecionados.has(depto.departamento) && (
                            <Line
                              key={depto.departamento}
                              type="monotone"
                              dataKey={depto.departamento}
                              stroke={depto.cor}
                              strokeWidth={3}
                              dot={{ r: 4, strokeWidth: 2, fill: '#fff' }}
                              activeDot={{ r: 6 }}
                              name={depto.departamento}
                            />
                          )
                        ))
                      : dadosProdutividade.map((usuario) => (
                          usuariosSelecionados.has(usuario.usuario) && (
                            <Line
                              key={usuario.usuario}
                              type="monotone"
                              dataKey={usuario.usuario}
                              stroke={usuario.cor}
                              strokeWidth={2}
                              dot={{ r: 3, strokeWidth: 1, fill: '#fff' }}
                              activeDot={{ r: 5 }}
                              name={usuario.usuario}
                            />
                          )
                        ))
                    }
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                  <div className="text-center text-gray-500">
                    <Activity className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p className="text-lg font-medium">Nenhum dado de produtividade encontrado</p>
                    <p className="text-sm">As solicitações precisam ter horário registrado</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
