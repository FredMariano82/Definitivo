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
  const [dadosPorPerfil, setDadosPorPerfil] = useState<ProdutividadePerfil[]>([])
  const [usuariosSelecionados, setUsuariosSelecionados] = useState<Set<string>>(new Set())
  const [perfisSelecionados, setPerfisSelecionados] = useState<Set<string>>(new Set())
  const [carregando, setCarregando] = useState(true)
  // Dados removidos (agora vêm via props)
  const [visualizacaoPorPerfil, setVisualizacaoPorPerfil] = useState(false)
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
      const [dadosIndividuais, dadosPerfis, stats] = await Promise.all([
        ProdutividadeService.buscarProdutividadePorHora(inicio || undefined, fim || undefined),
        ProdutividadeService.buscarProdutividadePorPerfil(inicio || undefined, fim || undefined),
        ProdutividadeService.buscarEstatisticasProdutividade(inicio || undefined, fim || undefined) as Promise<any>,
      ])

      setDadosProdutividade(dadosIndividuais)
      setDadosPorPerfil(dadosPerfis)
      setEstatisticas(stats)

      // Selecionar todos por padrão
      setUsuariosSelecionados(new Set(dadosIndividuais.map((u) => u.usuario)))
      setPerfisSelecionados(new Set(dadosPerfis.map((p) => p.perfil)))
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

  const togglePerfil = (perfil: string) => {
    const novosPerfis = new Set(perfisSelecionados)
    if (novosPerfis.has(perfil)) {
      novosPerfis.delete(perfil)
    } else {
      novosPerfis.add(perfil)
    }
    setPerfisSelecionados(novosPerfis)
  }

  const selecionarTodos = () => {
    if (visualizacaoPorPerfil) {
      setPerfisSelecionados(new Set(dadosPorPerfil.map((p) => p.perfil)))
    } else {
      setUsuariosSelecionados(new Set(dadosProdutividade.map((u) => u.usuario)))
    }
  }

  const desmarcarTodos = () => {
    if (visualizacaoPorPerfil) {
      setPerfisSelecionados(new Set())
    } else {
      setUsuariosSelecionados(new Set())
    }
  }

  // Preparar dados para o gráfico
  const dadosGrafico = Array.from({ length: 24 }, (_, hora) => {
    const dadosHora: any = { hora: `${hora.toString().padStart(2, "0")}:00` }

    if (visualizacaoPorPerfil) {
      dadosPorPerfil.forEach((perfil) => {
        if (perfisSelecionados.has(perfil.perfil)) {
          const dadoHora = perfil.dadosPorHora.find((d) => d.hora === hora)
          dadosHora[perfil.perfil] = dadoHora?.prestadores || 0
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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-blue-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total de Usuários</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-700">{estatisticas.totalUsuarios}</div>
            <p className="text-xs text-gray-500 mt-1">Usuários ativos</p>
          </CardContent>
        </Card>

        <Card className="border-green-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total de Prestadores</CardTitle>
            <Activity className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-700">{estatisticas.totalPrestadores}</div>
            <p className="text-xs text-gray-500 mt-1">Prestadores processados</p>
          </CardContent>
        </Card>

        <Card className="border-orange-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Horário Mais Ativo</CardTitle>
            <Clock className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-700">
              {estatisticas.horarioMaisAtivo.hora.toString().padStart(2, "0")}:00
            </div>
            <p className="text-xs text-gray-500 mt-1">{estatisticas.horarioMaisAtivo.prestadores} prestadores</p>
          </CardContent>
        </Card>

        <Card className="border-purple-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Usuário Mais Ativo</CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold text-purple-700 truncate">
              {estatisticas.usuarioMaisAtivo.usuario || "N/A"}
            </div>
            <p className="text-xs text-gray-500 mt-1">{estatisticas.usuarioMaisAtivo.prestadores} prestadores</p>
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
                {visualizacaoPorPerfil ? "Perfis" : "Usuários"} (
                {visualizacaoPorPerfil ? dadosPorPerfil.length : dadosProdutividade.length})
              </CardTitle>

              {/* Toggle de Visualização */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setVisualizacaoPorPerfil(!visualizacaoPorPerfil)}
                className="flex items-center gap-2"
              >
                {visualizacaoPorPerfil ? <ToggleRight className="h-4 w-4" /> : <ToggleLeft className="h-4 w-4" />}
                {visualizacaoPorPerfil ? "Perfil" : "Individual"}
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
            {visualizacaoPorPerfil
              ? // Visualização por Perfil
              dadosPorPerfil.map((perfil) => (
                <div key={perfil.perfil} className="flex items-center space-x-3">
                  <Checkbox
                    id={perfil.perfil}
                    checked={perfisSelecionados.has(perfil.perfil)}
                    onCheckedChange={() => togglePerfil(perfil.perfil)}
                  />
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: perfil.cor }} />
                    <Label
                      htmlFor={perfil.perfil}
                      className="text-sm font-medium cursor-pointer truncate capitalize"
                      title={perfil.perfil}
                    >
                      {perfil.perfil}
                    </Label>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {perfil.dadosPorHora.reduce((sum, h) => sum + h.prestadores, 0)}
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

            {(visualizacaoPorPerfil ? dadosPorPerfil.length : dadosProdutividade.length) === 0 && (
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
              {visualizacaoPorPerfil ? perfisSelecionados.size : usuariosSelecionados.size}{" "}
              {visualizacaoPorPerfil ? "perfil(s)" : "usuário(s)"} selecionado(s)
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
                    
                    {visualizacaoPorPerfil 
                      ? dadosPorPerfil.map((perfil) => (
                          perfisSelecionados.has(perfil.perfil) && (
                            <Line
                              key={perfil.perfil}
                              type="monotone"
                              dataKey={perfil.perfil}
                              stroke={perfil.cor}
                              strokeWidth={3}
                              dot={{ r: 4, strokeWidth: 2, fill: '#fff' }}
                              activeDot={{ r: 6 }}
                              name={perfil.perfil}
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
