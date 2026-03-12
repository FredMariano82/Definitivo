"use client"

import type React from "react"
import { useState, useRef } from "react"
import { Camera, CheckCircle, AlertTriangle, X, Image as ImageIcon, Wand2, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import type { PrestadorExcelSolicitante } from "@/services/excel-service"
import { extrairPrestadoresDeTexto } from "@/utils/text-parser"
// import Tesseract from "tesseract.js"
import { Progress } from "@/components/ui/progress"

interface UploadFotoListaProps {
    onListaProcessada?: (prestadores: PrestadorExcelSolicitante[]) => void
}

export default function UploadFotoLista({ onListaProcessada }: UploadFotoListaProps) {
    const [imagem, setImagem] = useState<File | null>(null)
    const [imagemPreview, setImagemPreview] = useState<string | null>(null)
    const [carregando, setCarregando] = useState(false)
    const [progresso, setProgresso] = useState<number>(0)
    const [statusOCR, setStatusOCR] = useState<string>("")
    const [resultado, setResultado] = useState<{
        sucesso: boolean
        erro: string
        totalProcessados: number
        prestadores: PrestadorExcelSolicitante[]
    } | null>(null)

    const [mostrarPreview, setMostrarPreview] = useState(false)
    const inputRef = useRef<HTMLInputElement>(null)

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (file) {
            if (file.type.startsWith("image/")) {
                setImagem(file)
                setImagemPreview(URL.createObjectURL(file))
                setResultado(null)
                setMostrarPreview(false)
            } else {
                alert("Por favor, selecione uma imagem válida (JPG, PNG, etc).")
            }
        }
    }

    const processarImagem = async () => {
        if (!imagem) return

        setCarregando(true)
        setProgresso(0)
        setStatusOCR("Iniciando Leitura Ótica (OCR)...")

        try {
            console.log("📸 OCR desativado temporariamente...")
            /*
            const { data: { text } } = await Tesseract.recognize(
                imagem,
                'por', // Português
                {
                    logger: (m: any) => {
                        if (m.status === "recognizing text") {
                            setProgresso(Math.floor(m.progress * 100))
                            setStatusOCR("Lendo caracteres da imagem...")
                        } else {
                            setStatusOCR("Carregando inteligência óptica...")
                        }
                    }
                }
            )
            */
            const text = "OCR desativado"

            console.log("📝 Texto extraído da imagem:", text)
            setStatusOCR("Analisando Nomes e Documentos...")

            // Utiliza a mesma lógica do Regex! O reuso perfeito.
            const resultadoExtracao = extrairPrestadoresDeTexto(text)

            setResultado(resultadoExtracao)

            if (!resultadoExtracao.sucesso) {
                setResultado(prev => prev ? { ...prev, erro: "A foto estava muito embaçada ou não possui RGs/CPFs no padrão reconhecível. Tente tirar outra foto mais nítida." } : null)
            }

        } catch (error: any) {
            console.error("💥 Erro no Tesseract:", error)
            setResultado({
                sucesso: false,
                erro: `Falha ao ler a imagem. Tente uma foto com iluminação melhor.`,
                totalProcessados: 0,
                prestadores: [],
            })
        } finally {
            setCarregando(false)
            setStatusOCR("")
            setProgresso(0)
        }
    }

    const limparUpload = () => {
        setImagem(null)
        setImagemPreview(null)
        setResultado(null)
        setMostrarPreview(false)
        if (inputRef.current) {
            inputRef.current.value = ""
        }
    }

    const usarListaNaSolicitacao = () => {
        if (resultado?.prestadores && onListaProcessada) {
            onListaProcessada(resultado.prestadores)
        }
    }

    return (
        <Card className="w-full max-w-4xl mx-auto shadow-none border-0 sm:border sm:shadow-sm">
            <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-fuchsia-700">
                    <Camera className="h-5 w-5" />
                    Tirar Foto da Lista de Papel (OCR)
                </CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
                <Alert className="border-fuchsia-100 bg-fuchsia-50/50">
                    <ImageIcon className="h-4 w-4 text-fuchsia-600" />
                    <AlertDescription className="text-fuchsia-800 text-sm">
                        <p><strong>Recebeu uma folha de papel impressa com os nomes?</strong></p>
                        <p>Tire uma foto bem focada pelo celular e envie aqui. O sistema lerá a foto e extrairá os Nomes e Documentos pra você!</p>
                    </AlertDescription>
                </Alert>

                <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row items-center gap-4 border-2 border-dashed border-slate-200 p-6 rounded-lg bg-slate-50 justify-center">
                        <input ref={inputRef} type="file" accept="image/*" capture="environment" onChange={handleFileSelect} className="hidden" />

                        {!imagem ? (
                            <Button
                                onClick={() => inputRef.current?.click()}
                                variant="outline"
                                className="border-fuchsia-200 text-fuchsia-700 hover:bg-fuchsia-50 h-12 w-full sm:w-auto px-8"
                            >
                                <Camera className="h-5 w-5 mr-2" />
                                Tirar Foto / Anexar Imagem
                            </Button>
                        ) : (
                            <div className="flex flex-col w-full gap-4">
                                <div className="flex items-start justify-between w-full bg-white p-3 rounded border border-slate-200 shadow-sm gap-4">
                                    <div className="flex items-center gap-3 overflow-hidden">
                                        {imagemPreview && (
                                            <div className="h-16 w-16 min-w-16 rounded overflow-hidden border border-slate-100 bg-slate-100 flex items-center justify-center relative">
                                                <img src={imagemPreview} alt="Preview" className="object-cover h-full w-full opacity-80" />
                                            </div>
                                        )}
                                        <div className="truncate">
                                            <span className="text-sm font-medium text-slate-700 block truncate">{imagem.name}</span>
                                            <span className="text-xs text-slate-500">{(imagem.size / 1024 / 1024).toFixed(2)} MB</span>
                                        </div>
                                    </div>
                                    <Button onClick={limparUpload} variant="ghost" size="icon" className="text-red-500 hover:bg-red-50 hover:text-red-600 shrink-0">
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>

                                {!resultado && (
                                    <Button
                                        onClick={processarImagem}
                                        disabled={carregando}
                                        className="bg-fuchsia-600 hover:bg-fuchsia-700 text-white w-full"
                                    >
                                        <Wand2 className="h-4 w-4 mr-2" />
                                        {carregando ? "Olhando para a foto..." : "Ler Nomes e Documentos da Foto"}
                                    </Button>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Progress */}
                {carregando && (
                    <div className="space-y-2 py-4 px-2">
                        <div className="flex justify-between text-xs text-fuchsia-700 font-medium">
                            <span>{statusOCR}</span>
                            <span>{progresso}%</span>
                        </div>
                        <Progress value={progresso} className="h-2 bg-fuchsia-100 [&>div]:bg-fuchsia-600" />
                    </div>
                )}

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
                                            Mágica Feita! Lemos a foto e encontramos {resultado.totalProcessados} pessoas.
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
                                        <p className="font-semibold text-red-700">Ops, falha na leitura Visual:</p>
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
                            <h4 className="font-medium text-emerald-800 text-sm">Preview da Leitura da Foto:</h4>
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
