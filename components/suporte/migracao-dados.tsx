"use client"

import type React from "react"
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { useAuth } from "../../contexts/auth-context"
import { SuporteService } from "../../services/suporte-service"
import type { DadosMigracao } from "../../types"
import {
  Plus,
  Upload,
  FileSpreadsheet,
  AlertTriangle,
  CheckCircle,
  Database,
  Users,
  Calendar,
  Building,
  Download,
} from "lucide-react"

export default function MigracaoDados() {
  const { usuario } = useAuth()
  const [dados, setDados] = useState<DadosMigracao[]>([
    {
      solicitante: usuario?.nome || "",
      departamento: "",
      dataSolicitacao: "",
      nome: "",
      documento: "",
      documento2: "",
      empresa: "",
      dataInicial: "",
      dataFinal: "",
      status: "aprovado",
      checagemValidaAte: "",
    },
  ])

  const [carregando, setCarregando] = useState(false)
  const [resultado, setResultado] = useState<{
    tipo: "sucesso" | "erro" | "aviso"
    mensagem: string
    detalhes?: string[]
  } | null>(null)

  const [mostrarUploadExcel, setMostrarUploadExcel] = useState(false)

  // ➕ ADICIONAR LINHA
  const adicionarLinha = () => {
    setDados([
      ...dados,
      {
        solicitante: usuario?.nome || "",
        departamento: "",
        dataSolicitacao: "",
        nome: "",
        documento: "",
        documento2: "",
        empresa: "",
        dataInicial: "",
        dataFinal: "",
        status: "aprovado",
        checagemValidaAte: "",
      },
    ])
  }

  // 🗑️ REMOVER LINHA
  const removerLinha = (index: number) => {
    if (dados.length > 1) {
      setDados(dados.filter((_, i) => i !== index))
    }
  }

  // 🔄 ATUALIZAR CAMPO
  const atualizarCampo = (index: number, campo: keyof DadosMigracao, valor: string) => {
    const novosDados = [...dados]
    novosDados[index] = { ...novosDados[index], [campo]: valor }
    setDados(novosDados)
  }

  // ✅ VALIDAR FORMULÁRIO
  const validarFormulario = (): string => {
    for (let i = 0; i < dados.length; i++) {
      const item = dados[i]

      // Validações mais flexíveis para migração
      if (!item.nome.trim() && !item.documento.trim()) {
        return `Linha ${i + 1}: Nome ou documento são obrigatórios`
      }

      // Validar datas apenas se preenchidas
      if (item.dataFinal && item.dataInicial) {
        const dataInicialDate = converterDataBR(item.dataInicial)
        const dataFinalDate = converterDataBR(item.dataFinal)

        if (dataInicialDate && dataFinalDate && dataFinalDate < dataInicialDate) {
          return `Linha ${i + 1}: Data final deve ser posterior à data inicial`
        }
      }
    }

    return ""
  }

  // 🔄 CONVERTER DATA BRASILEIRA PARA DATE
  const converterDataBR = (dataBR: string): Date | null => {
    if (!dataBR || dataBR === "dd/mm/aaaa") return null

    try {
      if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(dataBR)) {
        const [dia, mes, ano] = dataBR.split("/")
        return new Date(Number(ano), Number(mes) - 1, Number(dia))
      }
      return null
    } catch {
      return null
    }
  }

  // 📅 CALCULAR VALIDADE DA CHECAGEM (+ 6 MESES)
  const calcularValidadeChecagem = (dataSolicitacao: string): string => {
    if (!dataSolicitacao || dataSolicitacao === "dd/mm/aaaa" || dataSolicitacao.trim() === "") {
      return "dd/mm/aaaa"
    }

    try {
      const dataDate = converterDataBR(dataSolicitacao)
      if (dataDate) {
        const dataValidade = new Date(dataDate)
        dataValidade.setMonth(dataValidade.getMonth() + 6)
        return dataValidade.toLocaleDateString("pt-BR")
      }
      return "dd/mm/aaaa"
    } catch (error) {
      console.error("Erro ao calcular validade:", error)
      return "dd/mm/aaaa"
    }
  }

  // 🚀 ENVIAR MIGRAÇÃO
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setResultado(null)

    const erro = validarFormulario()
    if (erro) {
      setResultado({
        tipo: "erro",
        mensagem: erro,
      })
      return
    }

    setCarregando(true)

    try {
      const resultado = await SuporteService.migrarDadosLote(dados)

      if (resultado.sucesso) {
        setResultado({
          tipo: "sucesso",
          mensagem: `✅ Migração concluída! ${resultado.totalSucesso} registros migrados com sucesso.`,
          detalhes:
            resultado.totalErros > 0
              ? [`❌ ${resultado.totalErros} registros falharam:`, ...resultado.detalhesErros]
              : undefined,
        })

        // Limpar formulário após sucesso
        setTimeout(() => {
          setDados([
            {
              solicitante: usuario?.nome || "",
              departamento: "",
              dataSolicitacao: "",
              nome: "",
              documento: "",
              documento2: "",
              empresa: "",
              dataInicial: "",
              dataFinal: "",
              status: "aprovado",
              checagemValidaAte: "",
            },
          ])
        }, 3000)
      } else {
        setResultado({
          tipo: "erro",
          mensagem: `❌ Erro na migração: ${resultado.erro}`,
          detalhes: resultado.detalhesErros,
        })
      }
    } catch (error: any) {
      setResultado({
        tipo: "erro",
        mensagem: `💥 Erro inesperado: ${error.message}`,
      })
    } finally {
      setCarregando(false)
    }
  }

  // 📊 PROCESSAR EXCEL
  const processarExcel = async (arquivo: File) => {
    setCarregando(true)
    setResultado(null)

    try {
      console.log("📊 Iniciando processamento do Excel...")
      const resultado = await SuporteService.processarExcelMigracao(arquivo, usuario?.nome || "")

      if (resultado.sucesso && resultado.dados.length > 0) {
        console.log("✅ Excel processado, atualizando interface com:", resultado.dados)
        setDados(resultado.dados)
        setMostrarUploadExcel(false)

        setResultado({
          tipo: "sucesso",
          mensagem: `📊 Excel processado! ${resultado.totalProcessados} registros carregados na interface.`,
        })
      } else {
        setResultado({
          tipo: "erro",
          mensagem: `❌ Erro ao processar Excel: ${resultado.erro || "Nenhum dado válido encontrado"}`,
        })
      }
    } catch (error: any) {
      console.error("💥 Erro ao processar Excel:", error)
      setResultado({
        tipo: "erro",
        mensagem: `💥 Erro ao processar Excel: ${error.message}`,
      })
    } finally {
      setCarregando(false)
    }
  }

  const downloadModelo = async () => {
    try {
      await SuporteService.downloadModeloExcel()
      setResultado({
        tipo: "sucesso",
        mensagem: "📥 Modelo Excel baixado com sucesso! Verifique sua pasta de Downloads.",
      })
    } catch (error: any) {
      setResultado({
        tipo: "erro",
        mensagem: `❌ Erro ao baixar modelo: ${error.message}`,
      })
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 space-y-6">
      {/* 🎯 HEADER DO SUPORTE */}
      <Card className="shadow-lg border-0 bg-gradient-to-r from-purple-600 to-purple-700">
        <CardContent className="p-6">
          <div className="text-center text-white">
            <h1 className="text-3xl font-bold mb-2">🛠️ Painel de Suporte</h1>
            <p className="text-purple-100 mb-4">Migração de Dados Históricos - Inserção Direta no Banco de Dados</p>
            <div className="flex justify-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Database className="h-4 w-4" />
                <span>Inserção Direta</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <span>Sem Contabilização</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>Dados Históricos</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 📊 UPLOAD EXCEL */}
      <Card className="shadow-lg border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-purple-600" />
            Upload Excel para Migração
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Alert className="border-purple-200 bg-purple-50">
              <FileSpreadsheet className="h-4 w-4 text-purple-600" />
              <AlertDescription className="text-purple-700">
                <strong>Formato esperado:</strong> Departamento | Data Solicitação | Nome | Documento | Documento2 |
                Empresa | Data Inicial | Data Final
              </AlertDescription>
            </Alert>

            <div className="flex gap-2">
              <Button
                onClick={() => setMostrarUploadExcel(!mostrarUploadExcel)}
                variant="outline"
                className="border-purple-600 text-purple-600 hover:bg-purple-50"
              >
                <Upload className="h-4 w-4 mr-2" />
                {mostrarUploadExcel ? "Cancelar Upload" : "Upload Excel"}
              </Button>

              <Button
                onClick={downloadModelo}
                variant="outline"
                className="border-green-600 text-green-600 hover:bg-green-50"
              >
                <Download className="h-4 w-4 mr-2" />
                Download Modelo Padrão
              </Button>
            </div>

            {mostrarUploadExcel && (
              <div className="border-2 border-dashed border-purple-300 rounded-lg p-6 text-center">
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={(e) => {
                    const arquivo = e.target.files?.[0]
                    if (arquivo) {
                      processarExcel(arquivo)
                    }
                  }}
                  className="hidden"
                  id="upload-excel"
                />
                <label htmlFor="upload-excel" className="cursor-pointer flex flex-col items-center gap-2">
                  <FileSpreadsheet className="h-12 w-12 text-purple-400" />
                  <span className="text-purple-600 font-medium">Clique para selecionar arquivo Excel</span>
                  <span className="text-sm text-slate-500">Formatos aceitos: .xlsx, .xls</span>
                </label>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 📝 FORMULÁRIO DE MIGRAÇÃO */}
      <Card className="shadow-lg border-0">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5 text-purple-600" />
              Migração Manual de Dados ({dados.length} registro{dados.length > 1 ? "s" : ""})
            </CardTitle>
            <Button
              onClick={adicionarLinha}
              variant="outline"
              size="sm"
              className="border-purple-600 text-purple-600 hover:bg-purple-50"
            >
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Linha
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 📋 CABEÇALHO DOS CAMPOS - COLUNAS VISÍVEIS APENAS */}
            <div className="grid grid-cols-8 gap-3 text-xs font-medium text-slate-600 px-2">
              <div className="col-span-1">Departamento</div>
              <div className="col-span-1">Data Solic.</div>
              <div className="col-span-1">Nome</div>
              <div className="col-span-1">Doc1</div>
              <div className="col-span-1">Doc2</div>
              <div className="col-span-1">Empresa</div>
              <div className="col-span-1">Data Inicial</div>
              <div className="col-span-1">Data Final</div>
              <div className="col-span-1">Válida Até</div>
            </div>

            <Separator />

            {/* 📊 LINHAS DE DADOS */}
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {dados.map((item, index) => (
                <div key={index} className="grid grid-cols-8 gap-3 items-center p-3 bg-slate-50 rounded-lg">
                  {/* CAMPOS OCULTOS - MANTIDOS PARA FUNCIONALIDADE */}
                  <input type="hidden" value={item.solicitante} />
                  <input type="hidden" value={item.dataFinal ? "Ok" : ""} />
                  <input type="hidden" value="aprovado" />

                  {/* Departamento */}
                  <div className="col-span-1">
                    <Input
                      value={item.departamento}
                      onChange={(e) => atualizarCampo(index, "departamento", e.target.value)}
                      placeholder="Depto"
                      className="text-sm"
                    />
                  </div>

                  {/* Data Solicitação */}
                  <div className="col-span-1">
                    <Input
                      value={item.dataSolicitacao}
                      onChange={(e) => atualizarCampo(index, "dataSolicitacao", e.target.value)}
                      placeholder="dd/mm/aaaa"
                      className="text-sm"
                      title={`Valor atual: ${item.dataSolicitacao || "vazio"}`}
                    />
                  </div>

                  {/* Nome */}
                  <div className="col-span-1">
                    <Input
                      value={item.nome}
                      onChange={(e) => atualizarCampo(index, "nome", e.target.value)}
                      placeholder="Nome"
                      className="text-sm"
                    />
                  </div>

                  {/* Documento */}
                  <div className="col-span-1">
                    <Input
                      value={item.documento}
                      onChange={(e) => atualizarCampo(index, "documento", e.target.value)}
                      placeholder="RG"
                      className="text-sm"
                    />
                  </div>

                  {/* Documento2 */}
                  <div className="col-span-1">
                    <Input
                      value={item.documento2 || ""}
                      onChange={(e) => atualizarCampo(index, "documento2", e.target.value)}
                      placeholder="CPF"
                      className="text-sm"
                    />
                  </div>

                  {/* Empresa */}
                  <div className="col-span-1">
                    <Input
                      value={item.empresa}
                      onChange={(e) => atualizarCampo(index, "empresa", e.target.value)}
                      placeholder="Empresa"
                      className="text-sm"
                    />
                  </div>

                  {/* Data Inicial */}
                  <div className="col-span-1">
                    <Input
                      value={item.dataInicial}
                      onChange={(e) => atualizarCampo(index, "dataInicial", e.target.value)}
                      placeholder="dd/mm/aaaa"
                      className="text-sm"
                    />
                  </div>

                  {/* Data Final */}
                  <div className="col-span-1">
                    <Input
                      value={item.dataFinal || ""}
                      onChange={(e) => atualizarCampo(index, "dataFinal", e.target.value)}
                      placeholder="dd/mm/aaaa"
                      className="text-sm"
                    />
                  </div>

                  {/* Checagem Válida Até (NOVA COLUNA VISÍVEL) */}
                  <div className="col-span-1">
                    <Input
                      value={calcularValidadeChecagem(item.dataSolicitacao)}
                      disabled
                      className="text-sm bg-green-50 text-green-700 border-green-200"
                      title="Data Solicitação + 6 meses (automático)"
                    />
                  </div>

                  {/* BOTÃO REMOVER - OCULTO MAS FUNCIONAL */}
                  {dados.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removerLinha(index)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                      title="Remover linha"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* 📊 INFORMAÇÕES AUTOMÁTICAS */}
            <Alert className="border-blue-200 bg-blue-50">
              <AlertTriangle className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-700">
                <div className="space-y-1 text-sm">
                  <p>
                    <strong>Campos Automáticos (Ocultos):</strong>
                  </p>
                  <p>
                    • <strong>Solicitante:</strong> {usuario?.nome} (usuário logado)
                  </p>
                  <p>
                    • <strong>Status:</strong> Sempre "Aprovado" para migração
                  </p>
                  <p>
                    • <strong>Cadastro:</strong> "Ok" se Data Final preenchida
                  </p>
                  <p>
                    • <strong>Válida Até:</strong> Data Solicitação + 6 meses (visível em verde)
                  </p>
                  <p>
                    • <strong>Número:</strong> Gerado automaticamente no formato ANO-000000
                  </p>
                  <p>
                    <strong>Exemplo:</strong> Data Solicitação 21/06/2025 → Válida Até 21/12/2025
                  </p>
                </div>
              </AlertDescription>
            </Alert>

            {/* 🎯 RESULTADO */}
            {resultado && (
              <Alert
                variant={resultado.tipo === "erro" ? "destructive" : "default"}
                className={
                  resultado.tipo === "sucesso"
                    ? "border-green-200 bg-green-50"
                    : resultado.tipo === "aviso"
                      ? "border-yellow-200 bg-yellow-50"
                      : ""
                }
              >
                {resultado.tipo === "sucesso" ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <AlertTriangle className="h-4 w-4" />
                )}
                <AlertDescription>
                  <div className="space-y-2">
                    <p>{resultado.mensagem}</p>
                    {resultado.detalhes && (
                      <div className="text-sm space-y-1">
                        {resultado.detalhes.map((detalhe, i) => (
                          <p key={i} className="font-mono">
                            {detalhe}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {/* 🚀 BOTÃO ENVIAR */}
            <div className="flex justify-end pt-4">
              <Button
                type="submit"
                className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-2"
                disabled={carregando}
              >
                {carregando ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Migrando...
                  </>
                ) : (
                  <>
                    <Database className="h-4 w-4 mr-2" />
                    Migrar {dados.length} Registro{dados.length > 1 ? "s" : ""}
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
