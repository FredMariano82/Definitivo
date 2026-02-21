"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { useAuth } from "../../contexts/auth-context"
import { SolicitacoesService } from "../../services/solicitacoes-service"
import { PrestadoresService } from "../../services/prestadores-service"
import type { Prestador } from "../../types"
import { Plus, Trash2, User, FileSpreadsheet, X, AlertTriangle, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Checkbox } from "@/components/ui/checkbox"
import UploadListaExcel from "../solicitante/upload-lista-excel"
import ModalPreviaSolicitacao from "../solicitante/modal-previa-solicitacao"
import UploadHistoricoExcel from "./upload-historico-excel"

interface NovaSolicitacaoAdminProps {
  dadosPrePreenchidos?: {
    tipoSolicitacao?: string
    finalidade?: string
    local?: string
    empresa?: string
    prestadores?: Array<{ id: string; nome: string; documento: string; documento2?: string; empresa?: string }>
    dataInicial?: string
    dataFinal?: string
  }
  onLimparDadosPrePreenchidos?: () => void
}

export default function NovaSolicitacaoAdmin({
  dadosPrePreenchidos,
  onLimparDadosPrePreenchidos,
}: NovaSolicitacaoAdminProps = {}) {
  const { usuario } = useAuth()
  const [local, setLocal] = useState("")
  const [empresa, setEmpresa] = useState("")
  const [prestadores, setPrestadores] = useState<Prestador[]>([
    {
      id: `prestador_inicial_${Date.now()}`,
      nome: "",
      documento: "",
      documento2: "",
      empresa: "",
    },
  ])
  const [dataInicial, setDataInicial] = useState("")
  const [dataFinal, setDataFinal] = useState("")
  const [erro, setErro] = useState("")
  const [sucesso, setSucesso] = useState("")
  const [carregando, setCarregando] = useState(false)

  const [alertaDataUrgente, setAlertaDataUrgente] = useState("")
  const [mostrarOpcoesPrazo, setMostrarOpcoesPrazo] = useState(false)
  const [prosseguirUrgente, setProsseguirUrgente] = useState(false)

  // 🎯 ESTADOS PARA LÓGICA DE EMPRESA INTELIGENTE
  const [modoEmpresa, setModoEmpresa] = useState<"geral" | "especifica" | "nenhum">("nenhum")

  // Adicionar estado para controlar modal de upload
  const [mostrarUploadLista, setMostrarUploadLista] = useState(false)

  // 🎯 NOVOS ESTADOS PARA CORREÇÕES
  const [dadosVieramDoExcel, setDadosVieramDoExcel] = useState(false)

  const [mostrarModalPrevia, setMostrarModalPrevia] = useState(false)

  // Adicionar estado para controlar modal de upload histórico
  const [mostrarUploadHistorico, setMostrarUploadHistorico] = useState(false)

  const dataAtual = new Date()

  // ← ADM: Campos editáveis para nome e departamento
  const [nomesolicitante, setNomeSolicitante] = useState(usuario?.nome || "")
  const [departamentoSolicitante, setDepartamentoSolicitante] = useState(usuario?.departamento || "")

  const dadosAutomaticos = {
    solicitante: nomesolicitante,
    departamento: departamentoSolicitante,
    dataHoraSolicitacao: dataAtual.toLocaleString("pt-BR"),
  }

  const adicionarPrestador = () => {
    // Gerar ID único baseado em timestamp para evitar conflitos
    const novoId = `prestador_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    setPrestadores([
      ...prestadores,
      {
        id: novoId,
        nome: "",
        documento: "",
        documento2: "",
        empresa: "",
      },
    ])
  }

  const removerPrestador = (id: string) => {
    console.log(`🗑️ ADM - Removendo prestador ID: ${id}`)

    if (prestadores.length > 1) {
      const novosPrestadores = prestadores.filter((p) => p.id !== id)
      setPrestadores(novosPrestadores)
    }
  }

  const atualizarPrestador = (id: string, campo: "nome" | "documento" | "documento2" | "empresa", valor: string) => {
    console.log(`🔄 ADM - Atualizando prestador ID ${id}, campo ${campo}: "${valor}"`)

    const novosPrestadores = prestadores.map((p) => (p.id === id ? { ...p, [campo]: valor } : p))
    setPrestadores(novosPrestadores)

    // 🎯 LÓGICA INTELIGENTE DE EMPRESA - EXCLUSÃO MÚTUA
    if (campo === "empresa") {
      if (valor.trim() !== "" && modoEmpresa !== "especifica") {
        console.log("🏢 ADM - Mudando para modo ESPECÍFICO - desabilitando empresa geral")
        setModoEmpresa("especifica")
      } else if (valor.trim() === "") {
        const temOutrasEmpresasEspecificas = novosPrestadores.some((p) => p.id !== id && p.empresa?.trim())
        if (!temOutrasEmpresasEspecificas) {
          console.log("🏢 ADM - Nenhuma empresa específica - voltando para modo nenhum")
          setModoEmpresa("nenhum")
        }
      }
    }
  }

  // 🎯 FUNÇÃO PARA ATUALIZAR EMPRESA GERAL COM LÓGICA INTELIGENTE
  const atualizarEmpresaGeral = (valor: string) => {
    setEmpresa(valor)

    // 🎯 LÓGICA INTELIGENTE DE EMPRESA - EXCLUSÃO MÚTUA
    if (valor.trim() !== "" && modoEmpresa !== "geral") {
      // Empresa geral preenchida - mudar para modo geral
      console.log("🏢 ADM - Mudando para modo GERAL - desabilitando empresas específicas")
      setModoEmpresa("geral")
      // Limpar todas as empresas específicas
      const novosPrestadores = prestadores.map((p) => ({ ...p, empresa: "" }))
      setPrestadores(novosPrestadores)
    } else if (valor.trim() === "") {
      // Empresa geral esvaziada
      console.log("🏢 ADM - Empresa geral esvaziada - voltando para modo nenhum")
      setModoEmpresa("nenhum")
    }
  }

  const validarAoSairDoCampo = async (prestadorId: string) => {
    const prestador = prestadores.find((p) => p.id === prestadorId)

    if (prestador && prestador.documento.trim()) {
      const documentoParaValidar = prestador.documento.trim()
      console.log(`🔍 ADM - Buscando prestador com documento: "${documentoParaValidar}"`)

      try {
        const prestadorEncontrado = await PrestadoresService.consultarPrestadorPorDocumento(documentoParaValidar)

        if (prestadorEncontrado && prestadorEncontrado.nome) {
          console.log(`🎯 ADM - Auto-preenchendo nome: ${prestadorEncontrado.nome}`)
          console.log(`🏢 ADM - Auto-preenchendo empresa: ${prestadorEncontrado.empresa || "Não informada"}`)

          const novosPrestadores = prestadores.map((p) =>
            p.id === prestadorId
              ? {
                  ...p,
                  nome: prestadorEncontrado.nome,
                  empresa: prestadorEncontrado.empresa || p.empresa, // Manter empresa atual se não houver no banco
                }
              : p,
          )
          setPrestadores(novosPrestadores)

          // Se preencheu empresa específica, ajustar modo empresa
          if (prestadorEncontrado.empresa && prestadorEncontrado.empresa.trim()) {
            if (modoEmpresa !== "especifica") {
              console.log("🏢 ADM - Auto-mudando para modo ESPECÍFICO devido ao auto-preenchimento")
              setModoEmpresa("especifica")
              setEmpresa("") // Limpar empresa geral
            }
          }
        }
      } catch (error) {
        console.error("❌ ADM - Erro ao buscar prestador:", error)
      }
    }
  }

  const converterDataBrParaDate = (dataBr: string): Date | null => {
    if (!dataBr) return null

    try {
      const [dia, mes, ano] = dataBr.split("/").map(Number)
      return new Date(ano, mes - 1, dia) // Mês é 0-indexado em JavaScript
    } catch (error) {
      console.error("Erro ao converter data:", error)
      return null
    }
  }

  // Função para converter data no formato YYYY-MM-DD para objeto Date
  const converterDataIsoParaDate = (dataIso: string): Date | null => {
    if (!dataIso) return null

    try {
      return new Date(dataIso)
    } catch (error) {
      console.error("Erro ao converter data ISO:", error)
      return null
    }
  }

  const validarFormulario = () => {
    if (!nomesolicitante.trim()) return "Nome do solicitante é obrigatório"
    if (!departamentoSolicitante.trim()) return "Departamento é obrigatório"
    if (!local.trim()) return "Local / Evento é obrigatório"

    if (!empresa.trim() && modoEmpresa !== "especifica") return "Empresa prestadora é obrigatória"

    if (!dataInicial) return "Data inicial é obrigatória"
    if (!dataFinal) return "Data final é obrigatória"

    for (const prestador of prestadores) {
      if (!prestador.nome.trim()) {
        return "Todos os prestadores devem ter nome preenchido"
      }
      if (!prestador.documento.trim() && !prestador.documento2?.trim()) {
        return "Todos os prestadores devem ter pelo menos um documento preenchido (Doc1 ou Doc2)"
      }
    }

    if (modoEmpresa === "especifica") {
      for (const prestador of prestadores) {
        if (!prestador.empresa?.trim()) {
          return "No modo empresas específicas, todos os prestadores devem ter empresa preenchida"
        }
      }
    }

    if (new Date(dataFinal) < new Date(dataInicial)) {
      return "Data final deve ser posterior à data inicial"
    }

    const agora = new Date()
    const hojeLocal = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate())
    const hojeFormatado = `${hojeLocal.getFullYear()}-${String(hojeLocal.getMonth() + 1).padStart(2, "0")}-${String(hojeLocal.getDate()).padStart(2, "0")}`

    if (dataInicial === hojeFormatado && !prosseguirUrgente) {
      return "Confirme se deseja prosseguir com a solicitação urgente ou corrija a data inicial"
    }

    return ""
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErro("")
    setSucesso("")

    const erroValidacao = validarFormulario()
    if (erroValidacao) {
      setErro(erroValidacao)
      return
    }

    // Abrir modal de prévia ao invés de enviar diretamente
    setMostrarModalPrevia(true)
  }

  const confirmarEnvioAposModal = async (economias: any[]) => {
    if (!usuario) return

    setCarregando(true)

    try {
      console.log("🚀 ADM - ENVIANDO SOLICITAÇÃO")

      // Determinar empresa final para cada prestador
      const prestadoresComEmpresa = prestadores.map((p) => {
        let empresaFinal = ""
        if (modoEmpresa === "geral") {
          empresaFinal = empresa
        } else if (modoEmpresa === "especifica") {
          empresaFinal = p.empresa || ""
        }
        return {
          nome: p.nome,
          documento: p.documento,
          documento2: p.documento2,
          empresa: empresaFinal,
        }
      })

      const empresaSolicitacao = modoEmpresa === "geral" ? empresa : prestadoresComEmpresa[0]?.empresa || ""

      const {
        sucesso: sucessoEnvio,
        erro: erroEnvio,
        solicitacao,
      } = await SolicitacoesService.criarSolicitacao({
        solicitante: nomesolicitante,
        departamento: departamentoSolicitante,
        usuarioId: usuario.id,
        tipoSolicitacao,
        finalidade: "obra",
        local,
        empresa: empresaSolicitacao,
        prestadores: prestadoresComEmpresa,
        dataInicial: dataInicial,
        dataFinal: dataFinal,
      })

      if (sucessoEnvio && solicitacao) {
        setSucesso(`Solicitação ${solicitacao.numero} enviada com sucesso! (Criada pelo ADM)`)
        setMostrarModalPrevia(false)

        // Limpar formulário após sucesso
        setTimeout(() => {
          setNomeSolicitante(usuario?.nome || "")
          setDepartamentoSolicitante(usuario?.departamento || "")
          setLocal("")
          setEmpresa("")
          setPrestadores([
            { id: `prestador_inicial_${Date.now()}`, nome: "", documento: "", documento2: "", empresa: "" },
          ])
          setDataInicial("")
          setDataFinal("")
          setSucesso("")
          setModoEmpresa("nenhum")
        }, 4000)
      } else {
        setErro(erroEnvio || "Erro ao criar solicitação")
        setMostrarModalPrevia(false)
      }
    } catch (error) {
      console.error("💥 ADM - Erro:", error)
      setErro("Erro inesperado ao enviar solicitação")
      setMostrarModalPrevia(false)
    } finally {
      setCarregando(false)
    }
  }

  // Revalidar prestadores quando mudar o tipo de solicitação OU data final
  useEffect(() => {
    if (dadosPrePreenchidos) {
      if (dadosPrePreenchidos.tipoSolicitacao) {
        // REMOVE setTipoSolicitacao(dadosPrePreenchidos.tipoSolicitacao as "checagem_liberacao" | "somente_liberacao")
      }
      if (dadosPrePreenchidos.local) {
        setLocal(dadosPrePreenchidos.local)
      }
      if (dadosPrePreenchidos.empresa) {
        setEmpresa(dadosPrePreenchidos.empresa)
      }
      if (dadosPrePreenchidos.prestadores && dadosPrePreenchidos.prestadores.length > 0) {
        setPrestadores(dadosPrePreenchidos.prestadores)
      }
      if (dadosPrePreenchidos.dataInicial) {
        setDataInicial(dadosPrePreenchidos.dataInicial)
      }
      if (dadosPrePreenchidos.dataFinal) {
        setDataFinal(dadosPrePreenchidos.dataFinal)
      }

      // Aceitar automaticamente o prazo se for renovação
      // REMOVE setAceitouPrazo(true)

      // Limpar dados após aplicar
      if (onLimparDadosPrePreenchidos) {
        onLimparDadosPrePreenchidos()
      }
    }
  }, [dadosPrePreenchidos, onLimparDadosPrePreenchidos])

  const validarAoSairDoCampoDoc2 = async (prestadorId: string) => {
    const prestador = prestadores.find((p) => p.id === prestadorId)

    if (prestador && prestador.documento2?.trim()) {
      const documentoParaValidar = prestador.documento2.trim()
      console.log(`🔍 ADM - Buscando prestador com documento2: "${documentoParaValidar}"`)

      try {
        const prestadorEncontrado = await PrestadoresService.consultarPrestadorPorDocumento(documentoParaValidar)

        if (prestadorEncontrado && prestadorEncontrado.nome) {
          console.log(`🎯 ADM - Auto-preenchendo nome via Doc2: ${prestadorEncontrado.nome}`)
          console.log(`🏢 ADM - Auto-preenchendo empresa via Doc2: ${prestadorEncontrado.empresa || "Não informada"}`)

          const novosPrestadores = prestadores.map((p) =>
            p.id === prestadorId
              ? {
                  ...p,
                  nome: prestadorEncontrado.nome,
                  empresa: prestadorEncontrado.empresa || p.empresa, // Manter empresa atual se não houver no banco
                }
              : p,
          )
          setPrestadores(novosPrestadores)

          // Se preencheu empresa específica, ajustar modo empresa
          if (prestadorEncontrado.empresa && prestadorEncontrado.empresa.trim()) {
            if (modoEmpresa !== "especifica") {
              console.log("🏢 ADM - Auto-mudando para modo ESPECÍFICO devido ao auto-preenchimento via Doc2")
              setModoEmpresa("especifica")
              setEmpresa("") // Limpar empresa geral
            }
          }
        }
      } catch (error) {
        console.error("❌ ADM - Erro ao buscar prestador via Doc2:", error)
      }
    }
  }

  // Adicionar função para processar lista do Excel
  const processarListaExcel = (prestadoresExcel: any[]) => {
    console.log(`📝 ADM EXCEL LIMPO - Processando ${prestadoresExcel.length} prestadores`)

    const novosPrestadores = prestadoresExcel.map((p, index) => ({
      id: `excel_${Date.now()}_${index}_${Math.random().toString(36).substr(2, 5)}`,
      nome: p.nome || "",
      documento: p.documento || "",
      documento2: p.documento2 || "",
      empresa: p.empresa || "",
    }))

    setPrestadores(novosPrestadores)
    setMostrarUploadLista(false)

    // Lógica de empresa (mantida)
    const empresasEspecificas = prestadoresExcel.filter((p) => p.empresa?.trim())
    const empresasUnicas = [...new Set(prestadoresExcel.map((p) => p.empresa).filter(Boolean))]

    if (empresasEspecificas.length > 0) {
      setModoEmpresa("especifica")
      setEmpresa("")
    } else if (empresasUnicas.length === 1) {
      setEmpresa(empresasUnicas[0])
      setModoEmpresa("geral")
    }

    console.log(`✅ ADM EXCEL LIMPO - ${novosPrestadores.length} prestadores carregados SEM validações`)
  }

  const tipoSolicitacao = "checagem_liberacao" // ← ADM: Fixo como checagem + liberação

  const verificarDataUrgente = (data: string) => {
    const dataSelecionada = new Date(data)
    const dataAtual = new Date()
    const diferencaEmDias = (dataSelecionada.getTime() - dataAtual.getTime()) / (1000 * 3600 * 24)

    if (diferencaEmDias === 0) {
      setAlertaDataUrgente("A data inicial é hoje. Confirme se deseja prosseguir com a solicitação urgente.")
      setMostrarOpcoesPrazo(true)
    } else {
      setAlertaDataUrgente("")
      setMostrarOpcoesPrazo(false)
      setProsseguirUrgente(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 space-y-6">
      {/* ← ADM: Header específico do ADM */}
      <Card className="shadow-lg border-0 bg-gradient-to-r from-blue-600 to-blue-700">
        <CardContent className="p-6">
          <div className="text-center text-white">
            <h1 className="text-3xl font-bold mb-2">🔧 Painel do Administrador</h1>
            <p className="text-blue-100 mb-4">
              Nova Solicitação de Acesso - Modo Administrativo com Busca Dupla e Auto-preenchimento
            </p>
            <Button
              onClick={() => setMostrarUploadHistorico(true)}
              variant="outline"
              className="border-white text-white hover:bg-white hover:text-blue-600"
            >
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              Upload Histórico Excel
            </Button>
          </div>
        </CardContent>
      </Card>

      {mostrarUploadHistorico && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b flex justify-between items-center">
              <h2 className="text-xl font-bold">Upload de Histórico Excel</h2>
              <Button onClick={() => setMostrarUploadHistorico(false)} variant="ghost" size="sm">
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="p-4">
              <UploadHistoricoExcel
                onUploadCompleto={(totalSalvos) => {
                  console.log(`✅ ADM - ${totalSalvos} prestadores salvos no histórico`)
                  setMostrarUploadHistorico(false)
                  // Opcional: mostrar notificação de sucesso
                }}
              />
            </div>
          </div>
        </div>
      )}

      {tipoSolicitacao && mostrarUploadLista && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b flex justify-between items-center">
              <h2 className="text-xl font-bold">Upload de Lista Excel</h2>
              <Button onClick={() => setMostrarUploadLista(false)} variant="ghost" size="sm">
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="p-4">
              <UploadListaExcel onListaProcessada={processarListaExcel} />
            </div>
          </div>
        </div>
      )}

      {tipoSolicitacao && (
        <Card className="shadow-lg border-0">
          <CardHeader className="pb-6">
            <CardTitle className="text-2xl font-bold text-slate-800 text-center">Nova Solicitação de Acesso</CardTitle>
            <div className="w-24 h-1 bg-blue-600 mx-auto rounded-full"></div>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* ← ADM: Campos editáveis */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label className="text-sm font-medium text-slate-700">Nome do Solicitante *</Label>
                  <Input
                    value={nomesolicitante}
                    onChange={(e) => setNomeSolicitante(e.target.value)}
                    placeholder="Digite o nome do solicitante"
                    className="border-slate-300 focus:border-blue-600 focus:ring-blue-600"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium text-slate-700">Departamento *</Label>
                  <Input
                    value={departamentoSolicitante}
                    onChange={(e) => setDepartamentoSolicitante(e.target.value)}
                    placeholder="Digite o departamento"
                    className="border-slate-300 focus:border-blue-600 focus:ring-blue-600"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium text-slate-700">Data e Hora da Solicitação</Label>
                  <Input value={dadosAutomaticos.dataHoraSolicitacao} disabled className="bg-slate-50 text-slate-600" />
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="local" className="text-sm font-medium text-slate-700">
                    Local / Evento *
                  </Label>
                  <Input
                    id="local"
                    value={local}
                    onChange={(e) => setLocal(e.target.value)}
                    placeholder="Ex: Piscina, Quadra de Tênis, Evento Corporativo"
                    className="border-slate-300 focus:border-blue-600 focus:ring-blue-600"
                  />
                </div>
                <div>
                  <Label htmlFor="empresa" className="text-sm font-medium text-slate-700">
                    Empresa Prestadora
                  </Label>
                  <Input
                    id="empresa"
                    value={empresa}
                    onChange={(e) => atualizarEmpresaGeral(e.target.value)}
                    disabled={modoEmpresa === "especifica"}
                    placeholder={
                      modoEmpresa === "especifica"
                        ? "Desabilitado - usando empresas específicas"
                        : "Nome da empresa (se todos forem da mesma empresa)"
                    }
                    className={`border-slate-300 focus:border-blue-600 focus:ring-blue-600 ${modoEmpresa === "especifica" ? "bg-slate-100 text-slate-500" : ""}`}
                  />
                </div>
              </div>

              <Separator />

              <div>
                <div className="flex items-center justify-between mb-4">
                  <Label className="text-lg font-medium text-slate-700">Prestadores</Label>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      onClick={() => setMostrarUploadLista(true)}
                      variant="outline"
                      size="sm"
                      className="border-blue-600 text-blue-600 hover:bg-blue-50"
                    >
                      <FileSpreadsheet className="h-4 w-4 mr-2" />
                      Upload Excel
                    </Button>
                    <Button
                      type="button"
                      onClick={adicionarPrestador}
                      variant="outline"
                      size="sm"
                      className="border-blue-600 text-blue-600 hover:bg-blue-50"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Adicionar Prestador
                    </Button>
                  </div>
                </div>

                <div className="space-y-4">
                  {/* 🎯 ALERTA EXPLICATIVO INTELIGENTE */}
                  <Alert className="mb-4 border-blue-200 bg-blue-50">
                    <User className="h-4 w-4 text-blue-600" />
                    <AlertDescription className="text-blue-700">
                      <div className="space-y-2">
                        <p>
                          <strong>🔍 Busca Dupla + Auto-preenchimento:</strong> Preencha Doc1 ou Doc2. O sistema buscará
                          em ambas as colunas do banco e preencherá automaticamente o nome quando encontrar o prestador.
                        </p>
                        <p>
                          <strong>🏢 Modo Empresa:</strong> Preencha a empresa geral OU as empresas específicas (não
                          ambos)
                        </p>
                      </div>
                    </AlertDescription>
                  </Alert>

                  {prestadores.map((prestador, index) => (
                    <div key={prestador.id} className="space-y-3">
                      {/* Grid com 5 colunas - IGUAL AO SOLICITANTE */}
                      <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
                        {/* Nome */}
                        <div>
                          <Label className="text-sm font-medium text-slate-700">Nome</Label>
                          <Input
                            value={prestador.nome}
                            onChange={(e) => atualizarPrestador(prestador.id, "nome", e.target.value)}
                            onBlur={() => validarAoSairDoCampo(prestador.id)}
                            placeholder="Nome completo (auto-preenchido)"
                            className="border-slate-300 focus:border-blue-600 focus:ring-blue-600"
                          />
                        </div>

                        {/* Doc1 */}
                        <div>
                          <Label className="text-sm font-medium text-slate-700">Doc1 (RG, etc)</Label>
                          <Input
                            value={prestador.documento}
                            onChange={(e) => atualizarPrestador(prestador.id, "documento", e.target.value)}
                            onBlur={() => validarAoSairDoCampo(prestador.id)}
                            placeholder="RG, etc"
                            className="border-slate-300 focus:border-blue-600 focus:ring-blue-600"
                          />
                        </div>

                        {/* Doc2 */}
                        <div>
                          <Label className="text-sm font-medium text-slate-700">Doc2 (CPF, CNH, etc)</Label>
                          <Input
                            value={prestador.documento2 || ""}
                            onChange={(e) => atualizarPrestador(prestador.id, "documento2", e.target.value)}
                            onBlur={() => validarAoSairDoCampoDoc2(prestador.id)}
                            placeholder="CPF, CNH, etc"
                            className="border-slate-300 focus:border-blue-600 focus:ring-blue-600"
                          />
                        </div>

                        {/* 🎯 EMPRESA ESPECÍFICA INTELIGENTE - NO GRID */}
                        <div>
                          <Label className="text-sm font-medium text-slate-700">Empresa</Label>
                          <Input
                            value={prestador.empresa || ""}
                            onChange={(e) => atualizarPrestador(prestador.id, "empresa", e.target.value)}
                            disabled={modoEmpresa === "geral"}
                            placeholder={
                              modoEmpresa === "geral" ? "Desabilitado - usando empresa geral" : "Empresa específica"
                            }
                            className={`border-slate-300 focus:border-blue-600 focus:ring-blue-600 ${modoEmpresa === "geral" ? "bg-slate-100 text-slate-500" : ""}`}
                          />
                        </div>

                        {/* Botão remover - SÓ ÍCONE */}
                        <div>
                          {prestadores.length > 1 && (
                            <Button
                              type="button"
                              onClick={() => removerPrestador(prestador.id)}
                              variant="outline"
                              size="icon"
                              className="border-red-300 text-red-600 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="dataInicial" className="text-sm font-medium text-slate-700">
                    Data Inicial *
                  </Label>
                  <Input
                    type="date"
                    id="dataInicial"
                    value={dataInicial}
                    onChange={(e) => {
                      setDataInicial(e.target.value)
                      verificarDataUrgente(e.target.value)
                    }}
                    className="border-slate-300 focus:border-blue-600 focus:ring-blue-600"
                  />
                </div>
                <div>
                  <Label htmlFor="dataFinal" className="text-sm font-medium text-slate-700">
                    Data Final *
                  </Label>
                  <Input
                    type="date"
                    id="dataFinal"
                    value={dataFinal}
                    onChange={(e) => setDataFinal(e.target.value)}
                    className="border-slate-300 focus:border-blue-600 focus:ring-blue-600"
                  />
                </div>
              </div>

              {alertaDataUrgente && (
                <Alert variant="warning">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{alertaDataUrgente}</AlertDescription>
                </Alert>
              )}

              {mostrarOpcoesPrazo && (
                <div className="flex items-center space-x-2">
                  <Checkbox id="prosseguirUrgente" onCheckedChange={setProsseguirUrgente} />
                  <label
                    htmlFor="prosseguirUrgente"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Estou ciente de que esta solicitação é urgente e pode não seguir o prazo padrão.
                  </label>
                </div>
              )}

              {erro && <Alert variant="destructive">{erro}</Alert>}
              {sucesso && (
                <Alert variant="success">
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>{sucesso}</AlertDescription>
                </Alert>
              )}

              <div className="flex justify-end pt-4">
                <Button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2"
                  disabled={carregando}
                >
                  {carregando ? "Enviando..." : "Enviar Solicitação (ADM)"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <ModalPreviaSolicitacao
        isOpen={mostrarModalPrevia}
        onClose={() => setMostrarModalPrevia(false)}
        solicitante={nomesolicitante}
        departamento={departamentoSolicitante}
        tipoSolicitacao={tipoSolicitacao}
        local={local}
        empresa={empresa}
        prestadores={prestadores}
        dataInicial={dataInicial}
        dataFinal={dataFinal}
        onConfirmar={confirmarEnvioAposModal}
        alertasPrestadores={{}}
      />
    </div>
  )
}
