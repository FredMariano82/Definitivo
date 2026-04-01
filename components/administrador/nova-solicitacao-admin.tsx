"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { supabase } from "@/lib/supabase"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { useAuth } from "../../contexts/auth-context"
import { SolicitacoesService } from "../../services/solicitacoes-service"
import { PrestadoresService } from "../../services/prestadores-service"
import type { Prestador } from "../../types"
import { Plus, Trash2, User, FileSpreadsheet, X, AlertTriangle, CheckCircle, Wand2, ShieldCheck, MessageSquare } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import UploadListaExcel from "../solicitante/upload-lista-excel"
import UploadTextoLivre from "../solicitante/upload-texto-livre"
import ModalPreviaSolicitacao from "../solicitante/modal-previa-solicitacao"
import UploadHistoricoExcel from "./upload-historico-excel"
import { Switch } from "@/components/ui/switch"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Library, Camera } from "lucide-react"
import { AutocompleteRG } from "@/components/ui/autocomplete-rg"
import UploadFotoLista from "../solicitante/upload-foto-lista"

interface NovaSolicitacaoAdminProps {
  dadosPrePreenchidos?: {
    tipoSolicitacao?: string
    finalidade?: string
    local?: string
    empresa?: string
    prestadores?: Array<{ id: string; nome: string; doc1: string; doc2?: string; empresa?: string }>
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
      doc1: "",
      doc2: "",
      empresa: "",
    },
  ])
  const [dataInicial, setDataInicial] = useState("")
  const [dataFinal, setDataFinal] = useState("")
  const [erro, setErro] = useState("")
  const [isSuperAdmin, setIsSuperAdmin] = useState(false)
  const tipoSolicitacao = "checagem_liberacao" // ← ADM: Fixo como checagem + liberação

  // Efeito para carregar dados iniciais e verificar perfil
  const [sucesso, setSucesso] = useState("")
  const [carregando, setCarregando] = useState(false)

  const [alertaDataUrgente, setAlertaDataUrgente] = useState("")
  const [mostrarOpcoesPrazo, setMostrarOpcoesPrazo] = useState(false)
  const [prosseguirUrgente, setProsseguirUrgente] = useState(false)

  // 🎯 ESTADOS PARA LÓGICA DE EMPRESA INTELIGENTE
  const [modoEmpresa, setModoEmpresa] = useState<"geral" | "especifica" | "nenhum">("nenhum")

  // Adicionar estado para controlar modal de upload
  const [mostrarUploadLista, setMostrarUploadLista] = useState(false)
  const [mostrarUploadTexto, setMostrarUploadTexto] = useState(false)
  const [mostrarUploadFoto, setMostrarUploadFoto] = useState(false)
  const [mostrarPrevia, setMostrarPrevia] = useState(false)
  const [dadosVieramDoExcel, setDadosVieramDoExcel] = useState(false)

  const [mostrarModalPrevia, setMostrarModalPrevia] = useState(false)

  // Adicionar estado para controlar modal de upload histórico
  const [mostrarUploadHistorico, setMostrarUploadHistorico] = useState(false)

  // 🎯 MODO DE APROVAÇÃO DIRETA (EXCLUSIVO SUPERADMIN)
  const [modoAprovacaoDireta, setModoAprovacaoDireta] = useState<"padrao" | "solo_liberacao" | "solo_checagem" | "lib_checagem_ok">("padrao")

  const dataAtual = new Date()

  // ← ADM: Campos editáveis para nome e departamento
  const [nomesolicitante, setNomeSolicitante] = useState(usuario?.nome || "")
  const [departamentoSolicitante, setDepartamentoSolicitante] = useState(usuario?.departamento || "")

  // 🎯 DATA E HORA MANUAIS (EXCLUSIVO SUPERADMIN)
  const [dataSolicitacaoManual, setDataSolicitacaoManual] = useState(new Date().toISOString().split("T")[0])
  const [horaSolicitacaoManual, setHoraSolicitacaoManual] = useState(new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }))

  // 🎯 MODO BIBLIOTECA (APENAS CADASTRO)
  const [modoBiblioteca, setModoBiblioteca] = useState(false)

  const [listaDepartamentos, setListaDepartamentos] = useState<string[]>([])

  // Buscar departamentos do Supabase
  useEffect(() => {
    const fetchDepartamentos = async () => {
      const { data, error } = await supabase
        .from("departamentos")
        .select("nome")
        .order("nome", { ascending: true })
      
      if (!error && data) {
        setListaDepartamentos(data.map(d => d.nome))
      }
    }
    fetchDepartamentos()
  }, [])

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
        doc1: "",
        doc2: "",
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

  const atualizarPrestador = (id: string, campo: "nome" | "doc1" | "doc2" | "empresa", valor: string) => {
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

    if (prestador && prestador.doc1.trim()) {
      const documentoParaValidar = prestador.doc1.trim()
      console.log(`🔍 ADM - Buscando prestador com doc1: "${documentoParaValidar}"`)

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

  const validarFormulario = () => {
    if (!nomesolicitante.trim()) return "Nome do solicitante é obrigatório"
    if (!departamentoSolicitante.trim()) return "Departamento é obrigatório"
    if (!local.trim()) return "Local / Evento é obrigatório"

    if (!empresa.trim() && modoEmpresa !== "especifica" && !modoBiblioteca) return "Empresa prestadora é obrigatória"

    // Ignorar validação de datas se estiver no modo biblioteca
    if (usuario?.perfil !== "superadmin" && !modoBiblioteca) {
      if (!dataInicial) return "Data inicial é obrigatória"
      if (!dataFinal) return "Data final é obrigatória"
    }

    for (const prestador of prestadores) {
      if (!prestador.nome.trim()) {
        return "Todos os prestadores devem ter nome preenchido"
      }
      if (!prestador.doc1.trim() && !prestador.doc2?.trim()) {
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

    if (dataInicial && dataFinal && new Date(dataFinal) < new Date(dataInicial)) {
      return "Data final deve ser posterior à data inicial"
    }

    const agora = new Date()
    const hojeLocal = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate())
    const hojeFormatado = `${hojeLocal.getFullYear()}-${String(hojeLocal.getMonth() + 1).padStart(2, "0")}-${String(hojeLocal.getDate()).padStart(2, "0")}`

    if (dataInicial && dataInicial === hojeFormatado && !prosseguirUrgente) {
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
          doc1: p.doc1,
          doc2: p.doc2,
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
        dataInicial: modoBiblioteca ? "" : dataInicial,
        dataFinal: modoBiblioteca ? "" : dataFinal,
        dataSolicitacao: usuario?.perfil === "superadmin" ? dataSolicitacaoManual : undefined,
        horaSolicitacao: usuario?.perfil === "superadmin" ? `${horaSolicitacaoManual}:00` : undefined,
        modoAprovacaoDireta: modoBiblioteca ? "padrao" : (usuario?.perfil === "superadmin" ? modoAprovacaoDireta : "padrao"),
        modoBiblioteca: modoBiblioteca,
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
            { id: `prestador_inicial_${Date.now()}`, nome: "", doc1: "", doc2: "", empresa: "" },
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

  useEffect(() => {
    if (dadosPrePreenchidos) {
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

      if (onLimparDadosPrePreenchidos) {
        onLimparDadosPrePreenchidos()
      }
    }
  }, [dadosPrePreenchidos, onLimparDadosPrePreenchidos])

  const validarAoSairDoCampoDoc2 = async (prestadorId: string) => {
    const prestador = prestadores.find((p) => p.id === prestadorId)

    if (prestador && prestador.doc2?.trim()) {
      const documentoParaValidar = prestador.doc2.trim()
      console.log(`🔍 ADM - Buscando prestador com doc2: "${documentoParaValidar}"`)

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

  const processarListaExcel = (prestadoresExcel: any[]) => {
    console.log(`📝 ADM EXCEL LIMPO - Processando ${prestadoresExcel.length} prestadores`)

    const novosPrestadores = prestadoresExcel.map((p, index) => ({
      id: `excel_${Date.now()}_${index}_${Math.random().toString(36).substr(2, 5)}`,
      nome: p.nome || "",
      doc1: p.doc1 || "",
      doc2: p.doc2 || "",
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

  const verificarDataUrgente = (data: string) => {
    if (!data) {
      setAlertaDataUrgente("")
      setMostrarOpcoesPrazo(false)
      setProsseguirUrgente(false)
      return
    }

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
    <div className="min-h-screen bg-transparent p-4 space-y-6">
      {tipoSolicitacao && (
        <Card className="shadow-lg border-0">
          <CardHeader className="pb-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex-1">
                <CardTitle className="text-2xl font-bold text-slate-800 text-center md:text-left">Nova Solicitação de Acesso</CardTitle>
                <div className="w-24 h-1 bg-blue-600 mx-auto md:mx-0 rounded-full"></div>
              </div>

              {/* 🎯 SWITCH MODO BIBLIOTECA - APENAS SUPERADMIN */}
              {usuario?.perfil === "superadmin" && (
                <div className={`flex items-center space-x-3 p-3 rounded-lg border-2 transition-all ${modoBiblioteca ? 'bg-amber-50 border-amber-200' : 'bg-slate-50 border-slate-100'}`}>
                  <div className={`p-2 rounded-full ${modoBiblioteca ? 'bg-amber-100 text-amber-600' : 'bg-slate-200 text-slate-500'}`}>
                    <Library className="h-5 w-5" />
                  </div>
                  <div className="flex flex-col">
                    <span className={`text-sm font-bold leading-none ${modoBiblioteca ? 'text-amber-700' : 'text-slate-700'}`}>
                      Modo Biblioteca
                    </span>
                    <span className="text-[10px] text-slate-500 mt-1">Apenas alimentar base de dados</span>
                  </div>
                  <Switch 
                    checked={modoBiblioteca} 
                    onCheckedChange={setModoBiblioteca}
                    className="data-[state=checked]:bg-amber-500"
                  />
                </div>
              )}
            </div>
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
                  <Select 
                    value={departamentoSolicitante} 
                    onValueChange={(val) => setDepartamentoSolicitante(val)}
                  >
                    <SelectTrigger className="border-slate-300 focus:border-blue-600 focus:ring-blue-600">
                      <SelectValue placeholder="Selecione o departamento" />
                    </SelectTrigger>
                    <SelectContent>
                      {listaDepartamentos.map((depto) => (
                        <SelectItem key={depto} value={depto}>
                          {depto}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-sm font-medium text-slate-700">Data e Hora da Solicitação</Label>
                  {usuario?.perfil === "superadmin" ? (
                    <div className="flex gap-2">
                      <Input
                        type="date"
                        value={dataSolicitacaoManual}
                        onChange={(e) => setDataSolicitacaoManual(e.target.value)}
                        className="border-slate-300 focus:border-blue-600 focus:ring-blue-600 h-10"
                      />
                      <Input
                        type="time"
                        value={horaSolicitacaoManual}
                        onChange={(e) => setHoraSolicitacaoManual(e.target.value)}
                        className="border-slate-300 focus:border-blue-600 focus:ring-blue-600 h-10"
                      />
                    </div>
                  ) : (
                    <Input value={dadosAutomaticos.dataHoraSolicitacao} disabled className="bg-slate-50 text-slate-600 h-10" />
                  )}
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
                      onClick={() => setMostrarUploadTexto(true)}
                      className="bg-[#2563eb] hover:bg-[#1d4ed8] text-white shadow-[0_0_15px_rgba(37,99,235,0.2)] transition-all"
                      size="sm"
                    >
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Texto de Whatsapp
                    </Button>
                    <Button
                      type="button"
                      onClick={() => setMostrarUploadFoto(true)}
                      size="sm"
                      className="bg-orange-600 hover:bg-orange-700 text-white shadow-[0_0_15px_rgba(234,88,12,0.2)] transition-all"
                    >
                      <Camera className="h-4 w-4 mr-2" />
                      Foto da Lista
                    </Button>
                    <Button
                      type="button"
                      onClick={() => setMostrarUploadLista(true)}
                      size="sm"
                      className="bg-[#1e293b] hover:bg-[#0f172a] text-white shadow-[0_0_15px_rgba(30,41,59,0.2)] transition-all"
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
                  {prestadores.map((prestador, index) => (
                    <div key={prestador.id} className="space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
                        <div className="md:col-span-1">
                          <Label className="text-sm font-medium text-slate-700">Doc1 (RG, etc)</Label>
                          <AutocompleteRG
                            value={prestador.doc1}
                            onChange={(valor) => atualizarPrestador(prestador.id, "doc1", valor)}
                            onSelect={(sugestao) => {
                              const novosPrestadores = prestadores.map((p) =>
                                p.id === prestador.id
                                  ? {
                                      ...p,
                                      doc1: sugestao.doc1,
                                      nome: sugestao.nome,
                                      empresa: sugestao.empresa || p.empresa,
                                    }
                                  : p,
                              )
                              setPrestadores(novosPrestadores)
                              if (sugestao.empresa && modoEmpresa !== "especifica") {
                                setModoEmpresa("especifica")
                                setEmpresa("")
                              }
                            }}
                            placeholder="RG, etc"
                            disabled={carregando}
                          />
                        </div>

                        <div>
                          <Label className="text-sm font-medium text-slate-700">Doc2 (CPF, CNH, etc)</Label>
                          <Input
                            value={prestador.doc2 || ""}
                            onChange={(e) => atualizarPrestador(prestador.id, "doc2", e.target.value)}
                            onBlur={() => validarAoSairDoCampoDoc2(prestador.id)}
                            placeholder="CPF, CNH, etc"
                            className="border-slate-300 focus:border-blue-600 focus:ring-blue-600"
                          />
                        </div>

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

              {/* Datas de Acesso - FORMATO COMPACTO */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="dataInicial" className="text-xs font-semibold text-slate-500 uppercase">
                    Data Inicial {usuario?.perfil !== "superadmin" && "*"}
                  </Label>
                  <Input
                    type="date"
                    id="dataInicial"
                    value={dataInicial}
                    onChange={(e) => {
                      setDataInicial(e.target.value)
                      verificarDataUrgente(e.target.value)
                    }}
                    className="border-slate-300 focus:border-blue-600 focus:ring-blue-600 h-9"
                  />
                </div>
                <div>
                  <Label htmlFor="dataFinal" className="text-xs font-semibold text-slate-500 uppercase">
                    Data Final {usuario?.perfil !== "superadmin" && "*"}
                  </Label>
                  <Input
                    type="date"
                    id="dataFinal"
                    value={dataFinal}
                    onChange={(e) => setDataFinal(e.target.value)}
                    className="border-slate-300 focus:border-blue-600 focus:ring-blue-600 h-9"
                  />
                </div>
                
                {/* Espaçamento extra para manter os campos compactos à esquerda */}
                <div className="hidden lg:block lg:col-span-2"></div>
              </div>

              {alertaDataUrgente && (
                <Alert className="border-yellow-200 bg-yellow-50 text-yellow-800">
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  <AlertDescription>{alertaDataUrgente}</AlertDescription>
                </Alert>
              )}

              {mostrarOpcoesPrazo && (
                <div className="flex items-center space-x-2">
                  <Checkbox id="prosseguirUrgente" onCheckedChange={(checked) => setProsseguirUrgente(checked === true)} />
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
                <Alert className="border-green-200 bg-green-50 text-green-800">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription>{sucesso}</AlertDescription>
                </Alert>
              )}

              {usuario?.perfil === "superadmin" && (
                <div className="bg-blue-50/50 p-6 rounded-xl border border-blue-100 space-y-4">
                  <div className="flex items-center gap-2 text-blue-800">
                    <ShieldCheck className="h-5 w-5" />
                    <span className="font-bold uppercase tracking-wider text-sm">Controle de Aprovação Direta (SuperAdmin)</span>
                  </div>
                  
                  <RadioGroup 
                    value={modoAprovacaoDireta} 
                    onValueChange={(val: any) => setModoAprovacaoDireta(val)}
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
                  >
                    <div className="relative">
                      <RadioGroupItem value="padrao" id="padrao" className="peer sr-only" />
                      <Label
                        htmlFor="padrao"
                        className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-blue-600 [&:has([data-state=checked])]:border-blue-600 cursor-pointer"
                      >
                        <div className="text-sm font-semibold">Fluxo Padrão</div>
                        <div className="text-[10px] text-muted-foreground text-center mt-1">Segue para aprovação pendente</div>
                      </Label>
                    </div>

                    <div className="relative">
                      <RadioGroupItem value="solo_liberacao" id="solo_liberacao" className="peer sr-only" />
                      <Label
                        htmlFor="solo_liberacao"
                        className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-blue-600 [&:has([data-state=checked])]:border-blue-600 cursor-pointer"
                      >
                        <div className="text-sm font-semibold">Só Liberação OK</div>
                        <div className="text-[10px] text-muted-foreground text-center mt-1">Cadastra como liberado direto</div>
                      </Label>
                    </div>

                    <div className="relative">
                      <RadioGroupItem value="solo_checagem" id="solo_checagem" className="peer sr-only" />
                      <Label
                        htmlFor="solo_checagem"
                        className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-blue-600 [&:has([data-state=checked])]:border-blue-600 cursor-pointer"
                      >
                        <div className="text-sm font-semibold">Só Checagem OK</div>
                        <div className="text-[10px] text-muted-foreground text-center mt-1">Aprova checagem (+6 meses)</div>
                      </Label>
                    </div>

                    <div className="relative">
                      <RadioGroupItem value="lib_checagem_ok" id="lib_checagem_ok" className="peer sr-only" />
                      <Label
                        htmlFor="lib_checagem_ok"
                        className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-blue-600 [&:has([data-state=checked])]:border-blue-600 cursor-pointer"
                      >
                        <div className="text-sm font-semibold">Lib + Checagem OK</div>
                        <div className="text-[10px] text-muted-foreground text-center mt-1">Aprovação total imediata</div>
                      </Label>
                    </div>
                  </RadioGroup>
                </div>
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

      {/* Modal de Upload Texto Livre */}
      {mostrarUploadTexto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-white rounded-lg shadow-xl relative">
            <button
              onClick={() => setMostrarUploadTexto(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 z-10"
            >
              <X className="h-6 w-6" />
            </button>
            <div className="p-4">
              <UploadTextoLivre
                onListaProcessada={(novosPrestadores) => {
                  const prestadoresComId = novosPrestadores.map((p) => ({
                    ...p,
                    id: Math.random().toString(36).substr(2, 9),
                  }))
                  
                  // Se a primeira linha estiver totalmente vazia, remover antes de adicionar
                  const listaBase = (prestadores.length === 1 && !prestadores[0].nome && !prestadores[0].doc1) 
                    ? [] 
                    : prestadores;

                  setPrestadores([...listaBase, ...prestadoresComId])
                  setMostrarUploadTexto(false)

                  // Detecção de empresas para Texto de Whatsapp
                  const empresasEspecificas = novosPrestadores.filter((p) => p.empresa?.trim())
                  if (empresasEspecificas.length > 0) {
                    setModoEmpresa("especifica")
                    setEmpresa("")
                  }
                }}
              />
            </div>
          </div>
        </div>
      )}

      {mostrarUploadHistorico && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="text-lg font-semibold">Upload de Histórico (Administrador)</h3>
              <Button variant="ghost" size="icon" onClick={() => setMostrarUploadHistorico(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="p-4">
              <UploadHistoricoExcel />
            </div>
          </div>
        </div>
      )}

      {mostrarUploadLista && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl">
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="text-lg font-semibold">Upload de Lista Excel</h3>
              <Button variant="ghost" size="icon" onClick={() => setMostrarUploadLista(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="p-4">
              <UploadListaExcel onListaProcessada={processarListaExcel} />
            </div>
          </div>
        </div>
      )}

      {mostrarUploadFoto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-white rounded-lg shadow-xl relative">
            <button
              onClick={() => setMostrarUploadFoto(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 z-10"
            >
              <X className="h-6 w-6" />
            </button>
            <div className="p-4">
              <UploadFotoLista
                onListaProcessada={(novosPrestadores) => {
                  const prestadoresComId = novosPrestadores.map((p, index) => ({
                    ...p,
                    id: `foto_${Date.now()}_${index}`,
                  }))
                  
                  const listaBase = (prestadores.length === 1 && !prestadores[0].nome && !prestadores[0].doc1) 
                    ? [] 
                    : prestadores;
                  
                  setPrestadores([...listaBase, ...prestadoresComId])
                  setMostrarUploadFoto(false)
                }}
              />
            </div>
          </div>
        </div>
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
      />
    </div>
  )
}
