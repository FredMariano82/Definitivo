"use client"

import { useState, useEffect } from "react"
import { Clock, Download, Play, Save, RefreshCw } from "lucide-react"
import { OpService, OpEquipe, OpPosto, OpEscalaDiaria } from "@/services/op-service"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { getCurrentDate } from "@/utils/date-helpers"

export default function GestaoRendicoes() {
    const [dataAtual, setDataAtual] = useState("")
    // const [escalas, setEscalas] = useState<(OpEscalaDiaria & { op_equipe: OpEquipe, op_postos: OpPosto | null })[]>([])
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        const hojeDate = getCurrentDate()
        const isoDate = hojeDate.toISOString().split('T')[0]
        setDataAtual(isoDate)
        carregarRoteiro(isoDate)
    }, [])

    const carregarRoteiro = async (dataBusca: string) => {
        setLoading(true)
        // TODO: Phase 5 - Implement data fetching for op_rodizio_pausas 
        // const dadosEscalas = await OpService.getEscalaPorData(dataBusca)
        // setEscalas(dadosEscalas)
        setLoading(false)
    }

    const gerarRoteiroAutomatico = () => {
        alert("Antigravity: Aqui o algoritmo 'Elástico de Rendições' será implementado cruzando a Array de Rendicionistas com as janelas de 1h (Almoço/Janta) e 15m (Café) dos postos fixos.")
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">

            {/* HEADER */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white p-4 rounded-xl border shadow-sm">
                <div>
                    <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        <Clock className="text-indigo-600" />
                        Roteiro de Pausas (Rendições)
                    </h2>
                    <p className="text-sm text-slate-500">Administre as janelas de almoço, janta e café usando os Rendicionistas base.</p>
                </div>

                <div className="flex flex-wrap gap-3">
                    <Button variant="outline" className="text-slate-600" onClick={gerarRoteiroAutomatico}>
                        <Play className="w-4 h-4 mr-2" />
                        Gerar Roteiro Automático (Elástico)
                    </Button>
                    <Button className="bg-indigo-600 hover:bg-indigo-700">
                        <Save className="w-4 h-4 mr-2" />
                        Salvar Quadro
                    </Button>
                </div>
            </div>

            {loading ? (
                <div className="p-20 text-center animate-pulse text-slate-400">Carregando roteiro do dia...</div>
            ) : (
                <div className="bg-white rounded-xl border p-6 text-center text-slate-500">
                    <RefreshCw className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-slate-700 mb-2">Estrutura Visual em Construção</h3>
                    <p className="max-w-md mx-auto text-sm">
                        O painel de Rendições (Linha do tempo interativa e Algoritmo de cruzamento) será codificado na próxima etapa a partir da leitura do <code className="bg-slate-100 px-1 rounded text-pink-600">ANTIGRAVITY_HANDOFF.md</code>.
                    </p>
                </div>
            )}
        </div>
    )
}
