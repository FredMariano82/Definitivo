"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { PrestadoresService } from "../../services/prestadores-service"
import type { Prestador } from "../../types"
import { CheckCircle, DollarSign, Users, Send, AlertTriangle } from "lucide-react"

interface EconomiaCalculada {
  prestadorId: string
  prestadorNome: string
  prestadorDoc1: string
  tipoEconomia: "maxima" | "operacional" | "evitado" | "nenhuma"
  valorEconomizado: number
  detalhes: string
  conflitoData?: boolean
  validadeCalculada?: string
  isExcecao?: boolean
  validadeISO?: string | null
}

interface ModalPreviaSolicitacaoProps {
  isOpen: boolean
  onClose: () => void
  onConfirmar: (economias: EconomiaCalculada[], overrideDataFinal?: string) => Promise<void>
  prestadores: Array<{ id: string; nome: string; doc1: string; empresa?: string }>
  tipoSolicitacao: "checagem_liberacao" | "somente_liberacao"
  dataInicial: string
  dataFinal: string
  solicitante: string
  departamento: string
  local: string
  empresa: string
  onAjustarDataFinal?: (novaData: string) => void
}

export default function ModalPreviaSolicitacao({
  isOpen,
  onClose,
  onConfirmar,
  prestadores,
  tipoSolicitacao,
  dataInicial,
  dataFinal,
  solicitante,
  departamento,
  local,
  empresa,
  onAjustarDataFinal,
}: ModalPreviaSolicitacaoProps) {
  const [economias, setEconomias] = useState<EconomiaCalculada[]>([])
  const [carregandoAnalise, setCarregandoAnalise] = useState(false)
  const [enviandoSolicitacao, setEnviandoSolicitacao] = useState(false)
  const [decisoesConflito, setDecisoesConflito] = useState<Record<string, "ajustar" | "pagar">>({})
  const [dataFinalExibicao, setDataFinalExibicao] = useState(dataFinal)

  // Sincronizar data final de exibição
  useEffect(() => {
    setDataFinalExibicao(dataFinal)
  }, [dataFinal])

  // Calcular economias quando modal abrir
  useEffect(() => {
    if (isOpen && prestadores.length > 0) {
      calcularEconomias()
    }
  }, [isOpen, prestadores, tipoSolicitacao, dataFinal])

  const calcularEconomias = async () => {
    console.log(`\n💰 === CALCULANDO ECONOMIAS NA PRÉVIA ===`)
    console.log(`👥 Prestadores: ${prestadores.length}`)
    console.log(`📋 Tipo: ${tipoSolicitacao}`)

    setCarregandoAnalise(true)
    const economiasCalculadas: EconomiaCalculada[] = []

    try {
      // Processar cada prestador
      for (const prestador of prestadores) {
        const doc1ParaValidar = prestador.doc1.trim() || ""

        if (!doc1ParaValidar || !prestador.nome.trim()) {
          // Prestador incompleto - sem economia
          economiasCalculadas.push({
            prestadorId: prestador.id,
            prestadorNome: prestador.nome || "Nome não informado",
            prestadorDoc1: doc1ParaValidar,
            tipoEconomia: "nenhuma",
            valorEconomizado: 0,
            detalhes: "Prestador com dados incompletos",
          })
          continue
        }

        console.log(`🔍 Analisando: ${prestador.nome} - Doc: ${doc1ParaValidar}`)

        // Consultar prestador no banco
        const prestadorEncontrado = await PrestadoresService.consultarPrestadorPorDocumento(doc1ParaValidar)

        if (!prestadorEncontrado) {
          // Prestador novo - sem economia
          economiasCalculadas.push({
            prestadorId: prestador.id,
            prestadorNome: prestador.nome,
            prestadorDoc1: doc1ParaValidar,
            tipoEconomia: "nenhuma",
            valorEconomizado: 0,
            detalhes: "Prestador novo - primeira checagem necessária",
            isExcecao: false,
            validadeISO: null
          })
          continue
        }

        // Verificar status
        const statusChecagem = PrestadoresService.verificarStatusChecagem(prestadorEncontrado as any)
        const statusLiberacao = (prestadorEncontrado as any).liberacao || "pendente"

        console.log(`📊 ${prestador.nome}: Checagem=${statusChecagem}, Liberação=${statusLiberacao}`)

        // Aplicar regras de economia
        let economia: EconomiaCalculada = {
          prestadorId: prestador.id,
          prestadorNome: prestador.nome,
          prestadorDoc1: doc1ParaValidar,
          tipoEconomia: "nenhuma",
          valorEconomizado: 0,
          isExcecao: statusChecagem === "excecao",
          validadeISO: (prestadorEncontrado as any).checagem_valida_ate || null,
          detalhes: "Sem economia detectada",
        }

        // REGRA: Nome não confere
        if (prestadorEncontrado.nome.toLowerCase().trim() !== prestador.nome.toLowerCase().trim()) {
          economia = {
            ...economia,
            tipoEconomia: "evitado",
            valorEconomizado: 20.0,
            detalhes: `Erro de digitação evitado. Nome correto: ${prestadorEncontrado.nome}`,
          }
        }
        // REGRA: Checagem reprovada
        else if (statusChecagem === "reprovado") {
          economia = {
            ...economia,
            tipoEconomia: "evitado",
            valorEconomizado: 20.0,
            detalhes: "Tentativa de solicitar prestador reprovado foi bloqueada",
          }
        }
        // REGRA: Já em processo completo
        else if ((statusLiberacao === "pendente" || statusLiberacao === "urgente") && statusChecagem === "pendente") {
          economia = {
            ...economia,
            tipoEconomia: "operacional",
            valorEconomizado: 20.0,
            detalhes: "Duplicação evitada - prestador já em processo de checagem e liberação",
          }
        }
        // REGRA: Checagem válida + em processo de liberação
        else if ((statusLiberacao === "pendente" || statusLiberacao === "urgente") && statusChecagem === "valido") {
          economia = {
            ...economia,
            tipoEconomia: "operacional",
            valorEconomizado: 20.0,
            detalhes: `Duplicação evitada - já em processo de liberação (checagem válida até ${prestadorEncontrado.validadeChecagem})`,
          }
        }
        // REGRA: Checagem válida + liberado
        else if (statusLiberacao === "ok" && statusChecagem === "valido") {
          economia = {
            ...economia,
            tipoEconomia: "maxima",
            valorEconomizado: 20.0,
            detalhes: `Checagem desnecessária evitada - válida até ${prestadorEncontrado.validadeChecagem}`,
          }
        }
        // REGRA: Já liberado por exceção
        else if (statusLiberacao === "ok" && statusChecagem === "excecao") {
          economia = {
            ...economia,
            tipoEconomia: "maxima",
            valorEconomizado: 20.0,
            detalhes: "Processo desnecessário evitado - já liberado por exceção",
          }
        }

        // 🎯 NOVA REGRA: CONFLITO DE DATA (Data Final > Validade Checagem)
        if (
          (economia.tipoEconomia === "maxima" || economia.tipoEconomia === "operacional") &&
          prestadorEncontrado.validadeChecagem
        ) {
          const [diaV, mesV, anoV] = prestadorEncontrado.validadeChecagem.split("/").map(Number)
          const dataValidade = new Date(anoV, mesV - 1, diaV)
          const dataFinalSolicitacao = new Date(dataFinal + "T23:59:59")

          if (dataFinalSolicitacao > dataValidade) {
            console.log(`⚠️ CONFLITO DETECTADO para ${prestador.nome}: Final=${dataFinal} > Validade=${prestadorEncontrado.validadeChecagem}`)
            
            const decisaoAtual = decisoesConflito[prestador.id]

            if (decisaoAtual === "ajustar") {
              // Usuário escolheu ajustar -> Mantém economia e muda detalhes
              economia = {
                ...economia,
                conflitoData: true,
                validadeCalculada: prestadorEncontrado.validadeChecagem,
                detalhes: `Data final será ajustada para ${prestadorEncontrado.validadeChecagem} (limite da checagem)`,
              }
            } else if (decisaoAtual === "pagar") {
              // Usuário escolheu pagar -> Perde economia e exige nova checagem
              economia = {
                ...economia,
                tipoEconomia: "nenhuma",
                valorEconomizado: 0,
                conflitoData: true,
                validadeCalculada: prestadorEncontrado.validadeChecagem,
                detalhes: "Nova checagem será realizada para cobrir todo o período solicitado",
              }
            } else {
              // Aguardando decisão -> Avisa no modal
              economia = {
                ...economia,
                conflitoData: true,
                validadeCalculada: prestadorEncontrado.validadeChecagem,
              }
            }
          }
        }

        economiasCalculadas.push(economia)
      }

      console.log(`💰 Economias calculadas: ${economiasCalculadas.length}`)
      setEconomias(economiasCalculadas)
    } catch (error) {
      console.error("💥 Erro ao calcular economias:", error)
    } finally {
      setCarregandoAnalise(false)
    }
  }

  const handleDecidirConflito = (prestadorId: string, decisao: "ajustar" | "pagar") => {
    setDecisoesConflito((prev) => ({ ...prev, [prestadorId]: decisao }))
    
    // Se escolheu ajustar e é o primeiro/único ajuste, vamos sugerir a data final menor no topo
    if (decisao === "ajustar") {
      const economia = economias.find(e => e.prestadorId === prestadorId)
      if (economia?.validadeCalculada) {
        // Converter DD/MM/YYYY para YYYY-MM-DD
        const [d, m, a] = economia.validadeCalculada.split("/")
        const dataFormatada = `${a}-${m}-${d}`
        setDataFinalExibicao(dataFormatada)
      }
    }
  }

  const handleConfirmar = async () => {
    console.log(`🚀 CONFIRMANDO ENVIO - Contabilizando ${economias.length} economias`)

    // Se houve algum ajuste de data, notificar o componente pai (via prop)
    const temAjuste = Object.values(decisoesConflito).includes("ajustar")
    if (temAjuste && onAjustarDataFinal) {
      onAjustarDataFinal(dataFinalExibicao)
    }

    setEnviandoSolicitacao(true)

    try {
      await onConfirmar(economias, temAjuste ? dataFinalExibicao : undefined)
    } catch (error) {
      console.error("💥 Erro ao confirmar:", error)
    } finally {
      setEnviandoSolicitacao(false)
    }
  }

  // Calcular totais
  const totalEconomias = economias.filter((e) => e.tipoEconomia !== "nenhuma").length
  const valorTotalEconomizado = economias.reduce((acc, e) => acc + e.valorEconomizado, 0)
  const economiasMaxima = economias.filter((e) => e.tipoEconomia === "maxima").length
  const economiasOperacional = economias.filter((e) => e.tipoEconomia === "operacional").length
  const economiasEvitado = economias.filter((e) => e.tipoEconomia === "evitado").length

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Send className="h-5 w-5" />
            Prévia da Solicitação
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Resumo da Solicitação */}
          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold text-slate-700 mb-3">📋 Resumo da Solicitação</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <strong>Solicitante:</strong> {solicitante}
                </div>
                <div>
                  <strong>Departamento:</strong> {departamento}
                </div>
                <div>
                  <strong>Local:</strong> {local}
                </div>
                <div>
                  <strong>Empresa:</strong> {empresa}
                </div>
                <div>
                  <strong>Tipo:</strong>{" "}
                  {tipoSolicitacao === "checagem_liberacao" ? "Checagem + Liberação" : "Somente Liberação"}
                </div>
                <div>
                  <strong>Período:</strong> {dataInicial} até {dataFinalExibicao !== dataFinal ? (
                    <span className="text-blue-600 font-bold underline decoration-blue-300">
                      {new Date(dataFinalExibicao + "T00:00:00").toLocaleDateString("pt-BR")}*
                    </span>
                  ) : dataFinal}
                </div>
              </div>
              {dataFinalExibicao !== dataFinal && (
                <div className="mt-2 text-[10px] text-blue-600 italic">
                  * A data final foi reduzida para respeitar a validade das checagens existentes.
                </div>
              )}
            </CardContent>
          </Card>

          {/* Resumo de Economias */}
          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">
                <DollarSign className="h-4 w-4" />💰 Resumo de Economias
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{totalEconomias}</div>
                  <div className="text-sm text-green-700">Economias Detectadas</div>
                </div>
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">R$ {valorTotalEconomizado.toFixed(2)}</div>
                  <div className="text-sm text-blue-700">Valor Economizado</div>
                </div>
                <div className="text-center p-3 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">{economiasMaxima}</div>
                  <div className="text-sm text-purple-700">Já liberado</div>
                </div>
                <div className="text-center p-3 bg-orange-50 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">{economiasOperacional + economiasEvitado}</div>
                  <div className="text-sm text-orange-700">Já em processo</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Lista de Prestadores */}
          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">
                <Users className="h-4 w-4" />👥 Prestadores ({prestadores.length})
              </h3>

              {carregandoAnalise ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-600 mx-auto mb-2"></div>
                  <p className="text-slate-600">Analisando prestadores...</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {economias.map((economia) => (
                    <div key={economia.prestadorId} className={`flex flex-col p-3 border rounded-lg ${economia.conflitoData && !decisoesConflito[economia.prestadorId] ? 'border-amber-400 bg-amber-50' : ''}`}>
                      <div className="flex items-center justify-between ">
                        <div className="flex-1">
                          <div className="font-medium text-slate-800">{economia.prestadorNome}</div>
                          <div className="text-sm text-slate-600">Doc: {economia.prestadorDoc1}</div>
                          <div className="text-xs text-slate-500 mt-1">{economia.detalhes}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          {economia.tipoEconomia !== "nenhuma" && (
                            <Badge variant="outline" className="text-green-600 border-green-600">
                              R$ {economia.valorEconomizado.toFixed(2)}
                            </Badge>
                          )}
                          <Badge
                            variant={
                              economia.tipoEconomia === "maxima"
                                ? "secondary"
                                : economia.tipoEconomia === "operacional"
                                  ? "secondary"
                                  : economia.tipoEconomia === "evitado"
                                    ? "destructive"
                                    : "outline"
                            }
                          >
                            {economia.tipoEconomia === "maxima"
                              ? "✅ Liberado"
                              : economia.tipoEconomia === "operacional"
                                ? "⏳ Já em processo"
                                : economia.tipoEconomia === "evitado"
                                  ? "🛡️ Evitado"
                                  : "➖ Sem economia"}
                          </Badge>
                        </div>
                      </div>

                      {/* ⚠️ ÁREA DE CONFLITO DE DATA */}
                      {economia.conflitoData && (
                        <div className="mt-3 pt-3 border-t border-amber-200">
                          <div className="flex items-center gap-2 text-amber-700 text-xs font-semibold mb-2">
                            <AlertTriangle className="h-4 w-4" />
                            Atenção: Data final ({new Date(dataFinal + "T00:00:00").toLocaleDateString("pt-BR")}) extrapola validade da checagem ({economia.validadeCalculada}).
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant={decisoesConflito[economia.prestadorId] === "ajustar" ? "default" : "outline"}
                              className={`text-[10px] h-7 ${decisoesConflito[economia.prestadorId] === "ajustar" ? "bg-amber-600 hover:bg-amber-700" : "border-amber-300 text-amber-700 hover:bg-amber-100"}`}
                              onClick={() => handleDecidirConflito(economia.prestadorId, "ajustar")}
                            >
                              Ajustar Data para {economia.validadeCalculada}
                            </Button>
                            <Button
                              size="sm"
                              variant={decisoesConflito[economia.prestadorId] === "pagar" ? "default" : "outline"}
                              className={`text-[10px] h-7 ${decisoesConflito[economia.prestadorId] === "pagar" ? "bg-blue-600 hover:bg-blue-700" : "border-blue-300 text-blue-700 hover:bg-blue-100"}`}
                              onClick={() => handleDecidirConflito(economia.prestadorId, "pagar")}
                            >
                              Manter e Pagar Nova Checagem
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Separator />

          {/* Botões */}
          <div className="flex justify-end">
            <Button
              onClick={handleConfirmar}
              className="bg-green-600 hover:bg-green-700 text-white"
              disabled={
                carregandoAnalise || 
                enviandoSolicitacao || 
                economias.some(e => e.conflitoData && !decisoesConflito[e.prestadorId])
              }
            >
              {enviandoSolicitacao ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Enviando...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Ok
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
