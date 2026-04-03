"use client"

import type React from "react"
import { useState, useRef } from "react"
import { Upload, FileSpreadsheet, CheckCircle, AlertTriangle, X, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { ExcelService, type PrestadorExcelSolicitante } from "@/services/excel-service"

interface UploadListaExcelProps {
  onListaProcessada?: (prestadores: PrestadorExcelSolicitante[]) => void
}

export default function UploadListaExcel({ onListaProcessada }: UploadListaExcelProps) {
  const [arquivo, setArquivo] = useState<File | null>(null)
  const [carregando, setCarregando] = useState(false)
  const [progresso, setProgresso] = useState(0)
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
      if (file.type.includes("sheet") || file.name.endsWith(".xlsx") || file.name.endsWith(".xls")) {
        setArquivo(file)
        setResultado(null)
        setMostrarPreview(false)
      } else {
        alert("Por favor, selecione um arquivo Excel (.xlsx ou .xls)")
      }
    }
  }

  const processarArquivo = async () => {
    if (!arquivo) return

    setCarregando(true)
    setProgresso(20)

    try {
      console.log("📝 SOLICITANTE - Processando Excel para nova solicitação...")
      const resultadoProcessamento = await ExcelService.processarExcelSolicitante(arquivo)
      setProgresso(100)

      setResultado({
        sucesso: resultadoProcessamento.sucesso,
        erro: resultadoProcessamento.erro,
        totalProcessados: resultadoProcessamento.totalProcessados,
        prestadores: resultadoProcessamento.prestadores,
      })

      // IMPORTANTE: Removemos o envio automático aqui para permitir que o usuário veja
      // o contador de nomes primeiro e clique no botão de confirmar manualmente.
    } catch (error: any) {
      console.error("💥 SOLICITANTE - Erro no processamento:", error)
      setResultado({
        sucesso: false,
        erro: `Erro inesperado: ${error.message}`,
        totalProcessados: 0,
        prestadores: [],
      })
    } finally {
      setCarregando(false)
      setProgresso(0)
    }
  }

  const limparUpload = () => {
    setArquivo(null)
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
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5 text-slate-600" />
          Upload de Lista Excel (Solicitante)
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Instruções */}
        <Alert className="border-slate-200 bg-slate-50">
          <FileSpreadsheet className="h-4 w-4 text-slate-600" />
          <AlertDescription className="text-slate-700">
            <div className="space-y-2">
              <p>
                <strong>📝 Colunas esperadas no Excel:</strong>
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>
                  <strong>Nome</strong> - Nome completo (Coluna 1)
                </li>
                <li>
                  <strong>Empresa</strong> - Nome da empresa (Coluna 2)
                </li>
                <li>
                  <strong>RG / Doc1</strong> - Documento principal (Coluna 3)
                </li>
                <li>
                  <strong>CPF / Doc2</strong> - Documento secundário (Coluna 4 - Opcional)
                </li>
              </ul>
              <p className="text-xs text-slate-600 mt-2">
                💡 Após processar, os prestadores seguirão o fluxo normal: Solicitante → Aprovador → Gestor → ADM
              </p>
            </div>
          </AlertDescription>
        </Alert>

        {/* Upload */}
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <input ref={inputRef} type="file" accept=".xlsx,.xls" onChange={handleFileSelect} className="hidden" />

            <Button
              onClick={() => inputRef.current?.click()}
              variant="outline"
              className="border-[#217346] text-[#217346] hover:bg-green-50"
            >
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              Selecionar Arquivo Excel
            </Button>

            {arquivo && (
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="h-4 w-4 text-green-600" />
                <span className="text-sm text-green-700">{arquivo.name}</span>
                <Button onClick={limparUpload} variant="ghost" size="sm" className="text-red-600 hover:bg-red-50">
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>

          {arquivo && !resultado && (
            <Button
              onClick={processarArquivo}
              disabled={carregando}
              className="bg-[#217346] hover:bg-[#1A5C38] text-white"
            >
              {carregando ? "Processando..." : "Processar Lista Excel"}
            </Button>
          )}
        </div>

        {/* Progress */}
        {carregando && (
          <div className="space-y-2">
            <Progress value={progresso} className="w-full" />
            <p className="text-sm text-slate-600 text-center">Processando Excel...</p>
          </div>
        )}

        {/* Resultado */}
        {resultado && (
          <Alert className={resultado.sucesso ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
            {resultado.sucesso ? (
              <CheckCircle className="h-4 w-4 text-green-600" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-red-600" />
            )}
            <AlertDescription className={resultado.sucesso ? "text-green-700" : "text-red-700"}>
              <div className="space-y-3">
                {resultado.sucesso ? (
                  <>
                    <div className="flex items-center gap-3">
                      <div className="bg-green-100 text-green-700 px-4 py-2 rounded-full font-bold text-lg flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        {resultado.totalProcessados}
                      </div>
                      <div>
                        <p className="font-semibold text-green-800">✅ Lista lida com sucesso!</p>
                        <p className="text-xs text-green-600">Encontramos {resultado.totalProcessados} prestadores prontos para importação.</p>
                      </div>
                    </div>

                    <div className="flex gap-3 pt-2">
                      <Button
                        onClick={usarListaNaSolicitacao}
                        className="bg-[#217346] hover:bg-[#1A5C38] text-white shadow-sm"
                      >
                        Enviar para o Formulário
                      </Button>

                      <Button 
                        onClick={() => setMostrarPreview(!mostrarPreview)} 
                        variant="outline" 
                        className="border-green-200 text-green-700 hover:bg-green-100"
                      >
                        {mostrarPreview ? "Ocultar" : "Ver"} Lista Encontrada
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    <p>
                      <strong>❌ Erro no processamento:</strong>
                    </p>
                    <p className="text-sm">{resultado.erro}</p>
                  </>
                )}
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Preview dos dados */}
        {mostrarPreview && resultado?.prestadores && (
          <div className="border rounded-lg p-4 bg-slate-50">
            <h4 className="font-medium mb-3">Preview dos Primeiros 10 Prestadores:</h4>
            <div className="space-y-2 text-sm">
              {resultado.prestadores.slice(0, 10).map((prestador, index) => (
                <div key={index} className="bg-white p-2 rounded border">
                  <p>
                    <strong>Nome:</strong> {prestador.nome}
                  </p>
                  <p>
                    <strong>Doc1:</strong> {prestador.doc1} | <strong>Doc2:</strong>{" "}
                    {prestador.doc2 || "N/A"}
                  </p>
                  <p>
                    <strong>Empresa:</strong> {prestador.empresa || "N/A"}
                  </p>
                </div>
              ))}
              {resultado.prestadores.length > 10 && (
                <p className="text-slate-600">... e mais {resultado.prestadores.length - 10} prestadores</p>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
