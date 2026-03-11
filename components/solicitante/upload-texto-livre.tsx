"use client"

import type React from "react"
import { useState } from "react"
import { ClipboardPaste, CheckCircle, AlertTriangle, X, Users, Wand2, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Textarea } from "@/components/ui/textarea"
import type { PrestadorExcelSolicitante } from "@/services/excel-service"
import { extrairPrestadoresDeTexto } from "@/utils/text-parser"

interface UploadTextoLivreProps {
    onListaProcessada?: (prestadores: PrestadorExcelSolicitante[]) => void
}

export default function UploadTextoLivre({ onListaProcessada }: UploadTextoLivreProps) {
    const [textoLivre, setTextoLivre] = useState("")
    const [carregando, setCarregando] = useState(false)
    const [resultado, setResultado] = useState<{
        sucesso: boolean
        erro: string
        totalProcessados: number
        prestadores: PrestadorExcelSolicitante[]
    } | null>(null)
    const [mostrarPreview, setMostrarPreview] = useState(false)

    const processarTexto = () => {
        if (!textoLivre.trim()) return

        setCarregando(true)

        try {
            console.log("📝 Processando Texto Livre com Regex Extraído...")
            const resultadoExtracao = extrairPrestadoresDeTexto(textoLivre)
            setResultado(resultadoExtracao)
        } catch (error: any) {
            setResultado({
                sucesso: false,
                erro: `Erro inesperado: ${error.message}`,
                totalProcessados: 0,
                prestadores: [],
            })
        } finally {
            setCarregando(false)
        }
    }

    const limparUpload = () => {
        setTextoLivre("")
        setResultado(null)
        setMostrarPreview(false)
    }

    const usarListaNaSolicitacao = () => {
        if (resultado?.prestadores && onListaProcessada) {
            onListaProcessada(resultado.prestadores)
        }
    }

    return (
        <Card className="w-full max-w-4xl mx-auto shadow-none border-0 sm:border sm:shadow-sm">
            <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-indigo-700">
                    <Wand2 className="h-5 w-5" />
                    Leitor Mágico de Texto (Copiar/Colar)
                </CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
                <Alert className="border-indigo-100 bg-indigo-50/50">
                    <ClipboardPaste className="h-4 w-4 text-indigo-600" />
                    <AlertDescription className="text-indigo-800 text-sm">
                        <p><strong>Recebeu a lista pelo WhatsApp ou E-mail?</strong></p>
                        <p>Apenas copie o texto inteiro e cole abaixo. Nossa IA básica vai tentar extrair os <strong>Nomes e RGs/CPFs</strong> automaticamente linha por linha.</p>
                    </AlertDescription>
                </Alert>

                <div className="space-y-3">
                    <Textarea
                        placeholder="Exemplo de cola:&#10;João Silva Soares - RG 123456789&#10;Maria de Souza CPF: 123.456.789-00"
                        className="min-h-[150px] resize-y border-slate-300 focus-visible:ring-indigo-500"
                        value={textoLivre}
                        onChange={(e) => {
                            setTextoLivre(e.target.value)
                            setResultado(null)
                        }}
                    />

                    <div className="flex gap-2 justify-end">
                        {textoLivre && (
                            <Button onClick={limparUpload} variant="ghost" className="text-slate-500 hover:text-slate-700">
                                Limpar
                            </Button>
                        )}
                        <Button
                            onClick={processarTexto}
                            disabled={carregando || !textoLivre.trim()}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white"
                        >
                            <Wand2 className="h-4 w-4 mr-2" />
                            {carregando ? "Lendo..." : "Extrair Nomes e Documentos"}
                        </Button>
                    </div>
                </div>

                {/* Resultado */}
                {resultado && (
                    <Alert className={`mt-4 ${resultado.sucesso ? "border-emerald-200 bg-emerald-50" : "border-red-200 bg-red-50"}`}>
                        {resultado.sucesso ? (
                            <CheckCircle className="h-5 w-5 text-emerald-600" />
                        ) : (
                            <AlertTriangle className="h-5 w-5 text-red-600" />
                        )}
                        <AlertDescription className={resultado.sucesso ? "text-emerald-800" : "text-red-800"}>
                            <div className="space-y-3 mt-1">
                                {resultado.sucesso ? (
                                    <>
                                        <p className="font-semibold text-emerald-700">
                                            Mágica Feita! Encontramos {resultado.totalProcessados} pessoas no texto.
                                        </p>
                                        {resultado.erro && <p className="text-xs text-emerald-600/80 italic">{resultado.erro}</p>}

                                        <div className="flex gap-3 pt-2">
                                            <Button
                                                onClick={usarListaNaSolicitacao}
                                                className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                                            >
                                                Carregar na Solicitação
                                            </Button>

                                            <Button onClick={() => setMostrarPreview(!mostrarPreview)} variant="outline" className="border-emerald-200 text-emerald-700 hover:bg-emerald-100">
                                                {mostrarPreview ? "Ocultar" : "Ver"} Lista Encontrada
                                            </Button>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <p className="font-semibold text-red-700">Ops, falha na leitura:</p>
                                        <p className="text-sm">{resultado.erro}</p>
                                    </>
                                )}
                            </div>
                        </AlertDescription>
                    </Alert>
                )}

                {/* Preview dos dados */}
                {mostrarPreview && resultado?.prestadores && (
                    <div className="mt-4 border border-emerald-100 rounded-lg overflow-hidden bg-white shadow-sm">
                        <div className="bg-emerald-50 px-4 py-2 border-b border-emerald-100">
                            <h4 className="font-medium text-emerald-800 text-sm">Preview da Leitura (Como as linhas serão preenchidas):</h4>
                        </div>
                        <div className="p-4 space-y-2 text-sm max-h-[300px] overflow-y-auto">
                            {resultado.prestadores.map((prestador, index) => (
                                <div key={index} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-md border border-slate-100 hover:bg-slate-50 transition-colors">
                                    <div className="font-medium text-slate-700 flex-1 truncate pr-4">
                                        <User className="h-3 w-3 inline mr-2 text-slate-400" />
                                        {prestador.nome}
                                    </div>
                                    <div className="font-mono text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded">
                                        Doc: {prestador.doc1}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
