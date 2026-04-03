"use client"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"

import { useState } from "react"
import { Download, FileText, Table } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
// REMOVER esta linha:
// import { solicitacoesSimuladas } from "../../data/mock-data"

// Modificar a interface para receber dados reais:
interface RelatorioModalProps {
  filtroSolicitante: string
  filtroDepartamento: string
  filtroTipo: string
  filtroStatus?: string
  filtroCadastro?: string
  filtroAcoes?: string
  filtroEvento?: string
  solicitacoesReais: any[]
}

export default function RelatorioModal({
  filtroSolicitante,
  filtroDepartamento,
  filtroTipo,
  filtroStatus = "todos",
  filtroCadastro = "todos",
  filtroAcoes = "todos",
  filtroEvento = "todos",
  solicitacoesReais,
}: RelatorioModalProps) {
  const [open, setOpen] = useState(false)
  const [formatoRelatorio, setFormatoRelatorio] = useState<"excel" | "pdf">("excel")
  const [dataInicial, setDataInicial] = useState("")
  const [dataFinal, setDataFinal] = useState("")
  const [carregando, setCarregando] = useState(false)

  // Campos disponíveis para incluir no relatório
  const [camposSelecionados, setCamposSelecionados] = useState({
    numero: true,
    dataSolicitacao: true,
    solicitante: true,
    departamento: true,
    local: true,
    evento: true,
    empresa: true,
    prestadores: true,
    doc1: true,
    doc2: true,
    dataInicial: true,
    dataFinal: true,
    status: true,
    checagemValidaAte: false,
    cadastro: false,
    economia: false,
    custoChecagem: false,
    observacoes: false,
  })

  const handleCampoChange = (campo: string, checked: boolean) => {
    setCamposSelecionados((prev) => ({
      ...prev,
      [campo]: checked,
    }))
  }

  // Modificar a função gerarRelatorio para gerar dados simples em formato tabular
  const gerarRelatorio = async () => {
    setCarregando(true)

    setTimeout(() => {
      try {
        // Usar dados reais do sistema - CORRIGIR esta linha:
        const dadosRelatorio = (solicitacoesReais || []).filter((s) => {
          const solicitanteMatch = filtroSolicitante === "todos" || s.solicitante === filtroSolicitante
          const departamentoMatch = filtroDepartamento === "todos" || s.departamento === filtroDepartamento
          const eventoMatch = filtroEvento === "todos" || s.local === filtroEvento

          // Filtro por tipo (legado)
          let tipoMatch = true
          if (filtroTipo === "economia") {
            tipoMatch = s.economia === "economia1" || s.economia === "economia2"
          } else if (filtroTipo === "urgente") {
            const pFiltrados = s.prestadores.filter((p: any) => p.liberacao === "urgente")
            tipoMatch = pFiltrados.length > 0
          }

          // Filtro por data se especificado
          let dataMatch = true
          if (dataInicial && dataFinal) {
            const dataSol = new Date(s.dataSolicitacao.split("/").reverse().join("-"))
            const dataIni = new Date(dataInicial)
            const dataFim = new Date(dataFinal)
            dataMatch = dataSol >= dataIni && dataSol <= dataFim
          }

          return solicitanteMatch && departamentoMatch && eventoMatch && tipoMatch && dataMatch
        })

        // Calcular totais reais
        const totalSolicitacoes = dadosRelatorio.length
        const totalPrestadores = dadosRelatorio.reduce((acc, s) => acc + s.prestadores.length, 0)
        const totalCustos = dadosRelatorio.reduce((acc, s) => {
          const prestadoresComChecagem = s.tipoSolicitacao === "checagem_liberacao" ? s.prestadores.length : 0
          return acc + prestadoresComChecagem * 20
        }, 0)
        const totalEconomias = dadosRelatorio.reduce((acc, s) => acc + (s.economiaGerada || 0), 0)

        if (formatoRelatorio === "excel") {
          // Criar HTML para Excel com duas abas
          let htmlContent = `
  <html>
    <head>
      <meta charset="utf-8">
      <style>
        table { border-collapse: collapse; width: 100%; font-family: Arial, sans-serif; margin-bottom: 30px; }
        .header { background-color: #1e40af; color: white; font-weight: bold; text-align: center; padding: 8px; border: 1px solid #000; }
        .data { text-align: center; padding: 6px; border: 1px solid #ccc; }
        .total { background-color: #f3f4f6; font-weight: bold; text-align: center; padding: 8px; border: 1px solid #000; }
        .number { text-align: center; }
        .currency { text-align: right; }
        .sheet-title { font-size: 18px; font-weight: bold; margin: 20px 0; color: #1e40af; }
      </style>
    </head>
    <body>
      <div class="sheet-title">RELATÓRIO DETALHADO - SOLICITAÇÕES E PRESTADORES</div>
      <table>
        <thead>
          <tr>
            <th class="header">Número</th>
            <th class="header">Data Solicitação</th>
            <th class="header">Solicitante</th>
            <th class="header">Departamento</th>
            <th class="header">Local</th>
            <th class="header">Empresa</th>
            <th class="header">Evento</th>
            <th class="header">Nome Prestador</th>
            <th class="header">Doc1</th>
            <th class="header">Doc2</th>
            <th class="header">Data Inicial</th>
            <th class="header">Data Final</th>
            <th class="header">Status</th>
            <th class="header">Custo (R$)</th>
            <th class="header">Economia (R$)</th>
            <th class="header">Tipo Economia</th>
          </tr>
        </thead>
        <tbody>
`

          // Adicionar dados reais fielmente
          dadosRelatorio.forEach((s) => {
            s.prestadores.forEach((prestador: any) => {
              const statusFormatado = (prestador.checagem || "pendente").charAt(0).toUpperCase() + (prestador.checagem || "pendente").slice(1)
              const tipoEconomia =
                s.economia === "economia1" ? "Checagem Válida" : s.economia === "economia2" ? "Data Extrapolada" : "-"

              // Custo por prestador baseado no tipo de solicitação - APENAS SE JÁ INTERAGIU (não pendente)
              const custoPorPrestador = (s.tipoSolicitacao === "checagem_liberacao" && prestador.cadastro !== "pendente") ? 20.0 : 0.0
              const economiaPorPrestador = s.economiaGerada ? s.economiaGerada / s.prestadores.length : 0

              htmlContent += `
        <tr>
          <td class="data number">${s.numero}</td>
          <td class="data">${s.dataSolicitacao}</td>
          <td class="data">${s.solicitante}</td>
          <td class="data">${s.departamento}</td>
          <td class="data">${s.local}</td>
          <td class="data">${s.local || "-"}</td>
          <td class="data">${s.empresa || "-"}</td>
          <td class="data">${prestador.nome}</td>
          <td class="data">${prestador.doc1 || "-"}</td>
          <td class="data">${prestador.doc2 || "-"}</td>
          <td class="data">${s.dataInicial}</td>
          <td class="data">${s.dataFinal}</td>
          <td class="data">${statusFormatado}</td>
          <td class="data currency">R$ ${custoPorPrestador.toFixed(2)}</td>
          <td class="data currency">R$ ${economiaPorPrestador.toFixed(2)}</td>
          <td class="data">${tipoEconomia}</td>
        </tr>
      `
            })
          })

          htmlContent += `
        </tbody>
      </table>

      <div class="sheet-title">RESUMO POR DEPARTAMENTO</div>
      <table>
        <thead>
          <tr>
            <th class="header">Departamento</th>
            <th class="header">Quantidade de Prestadores</th>
            <th class="header">Custo (R$)</th>
            <th class="header">Valor Economizado (R$)</th>
          </tr>
        </thead>
        <tbody>
`

          // Calcular resumo por departamento
          const resumoPorDepartamento: Record<string, { prestadores: number, custo: number, economia: number }> = {}
          dadosRelatorio.forEach((s) => {
            if (!resumoPorDepartamento[s.departamento]) {
              resumoPorDepartamento[s.departamento] = {
                prestadores: 0,
                custo: 0,
                economia: 0,
              }
            }

            // Contar apenas prestadores que geraram custo (checagem_liberacao e já decidido)
            const prestadoresComCusto = s.tipoSolicitacao === "checagem_liberacao" 
              ? s.prestadores.filter((p: any) => p.cadastro !== "pendente").length 
              : 0
            
            resumoPorDepartamento[s.departamento].prestadores += prestadoresComCusto
            resumoPorDepartamento[s.departamento].custo += prestadoresComCusto * 20
            resumoPorDepartamento[s.departamento].economia += s.economiaGerada || 0
          })

          // Adicionar linhas do resumo por departamento
          let totalGeralPrestadores = 0
          let totalGeralCusto = 0
          let totalGeralEconomia = 0

          Object.entries(resumoPorDepartamento)
            .sort(([a], [b]) => a.localeCompare(b))
            .forEach(([dept, dados]) => {
              totalGeralPrestadores += dados.prestadores
              totalGeralCusto += dados.custo
              totalGeralEconomia += dados.economia

              htmlContent += `
        <tr>
          <td class="data">${dept}</td>
          <td class="data number">${dados.prestadores}</td>
          <td class="data currency">R$ ${dados.custo.toFixed(2)}</td>
          <td class="data currency">R$ ${dados.economia.toFixed(2)}</td>
        </tr>
      `
            })

          // Adicionar linha de totais
          htmlContent += `
        </tbody>
        <tfoot>
          <tr>
            <td class="total">TOTAIS</td>
            <td class="total number">${totalGeralPrestadores}</td>
            <td class="total currency">R$ ${totalGeralCusto.toFixed(2)}</td>
            <td class="total currency">R$ ${totalGeralEconomia.toFixed(2)}</td>
          </tr>
        </tfoot>
      </table>
    </body>
  </html>
`

          // Converter para blob e fazer download
          const blob = new Blob([htmlContent], { type: "application/vnd.ms-excel;charset=utf-8" })
          const url = window.URL.createObjectURL(blob)
          const link = document.createElement("a")
          link.setAttribute("href", url)
          link.setAttribute("download", `relatorio_solicitacoes_${new Date().toISOString().split("T")[0]}.xls`)
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
          window.URL.revokeObjectURL(url)

          alert(
            `✅ Relatório Excel gerado com sucesso!\n\n` +
            `📊 ${totalSolicitacoes} solicitações encontradas\n` +
            `👥 ${totalPrestadores} prestadores analisados\n` +
            `💰 R$ ${totalCustos.toFixed(2)} em custos\n` +
            `💚 R$ ${totalEconomias.toFixed(2)} em economias\n` +
            `📈 Saldo: R$ ${(totalEconomias - totalCustos).toFixed(2)}\n\n` +
            `📁 Relatório com duas seções:\n` +
            `• Dados detalhados por prestador\n` +
            `• Resumo consolidado por departamento`,
          )
        } else {
          // GERAR PDF
          const doc = new jsPDF("l", "mm", "a4") // Landscape for more columns
          const now = new Date()
          const dataRelatorio = now.toLocaleDateString("pt-BR")
          const horaRelatorio = now.toLocaleTimeString("pt-BR")

          // Título e logo simulado
          doc.setFontSize(18)
          doc.setTextColor(30, 64, 175) // #1e40af
          doc.text("RELATÓRIO DE SOLICITAÇÕES E PRESTADORES", 14, 15)
          
          doc.setFontSize(10)
          doc.setTextColor(100)
          doc.text(`Gerado em: ${dataRelatorio} às ${horaRelatorio}`, 14, 22)
          doc.text(`Filtros: Solicitante: ${filtroSolicitante} | Dept: ${filtroDepartamento} | Período: ${dataInicial || 'Início'} a ${dataFinal || 'Fim'}`, 14, 27)

          // Preparar dados para a tabela detalhada
          const head = [["Nº", "Data Sol.", "Depto", "Local", "Evento", "Empresa", "Prestador", "Doc1", "Doc2", "Status", "Custo (R$)", "Economia (R$)"]]
          const body: any[] = []

          dadosRelatorio.forEach((s) => {
            s.prestadores.forEach((p: any) => {
              const custo = (s.tipoSolicitacao === "checagem_liberacao" && p.cadastro !== "pendente") ? 20.0 : 0.0
              const economia = s.economiaGerada ? (s.economiaGerada / s.prestadores.length) : 0
              
              body.push([
                s.numero,
                s.dataSolicitacao,
                s.departamento,
                s.local || "-",
                s.local || "-", // Evento
                s.empresa || "-",
                p.nome,
                p.doc1 || "-",
                p.doc2 || "-",
                (p.checagem || "pendente").toUpperCase(),
                custo.toFixed(2),
                economia.toFixed(2)
              ])
            })
          })

          autoTable(doc, {
            head,
            body,
            startY: 35,
            theme: 'grid',
            headStyles: { fillColor: [30, 64, 175] },
            styles: { fontSize: 8 },
            columnStyles: {
              10: { halign: 'right' },
              11: { halign: 'right' }
            }
          })

          // Adicionar Resumo por Departamento em uma nova página
          doc.addPage()
          doc.setFontSize(16)
          doc.setTextColor(30, 64, 175)
          doc.text("RESUMO CONSOLIDADO POR DEPARTAMENTO", 14, 15)

          const resumoHead = [["Departamento", "Qtd Prestadores (Pagos)", "Custo Total (R$)", "Economia Total (R$)"]]
          const resumoBody: any[] = []
          
          const resumo: Record<string, any> = {}
          dadosRelatorio.forEach(s => {
            if (!resumo[s.departamento]) resumo[s.departamento] = { qtd: 0, custo: 0, economia: 0 }
            const qtdPagos = s.tipoSolicitacao === "checagem_liberacao" ? s.prestadores.filter((p: any) => p.cadastro !== "pendente").length : 0
            resumo[s.departamento].qtd += qtdPagos
            resumo[s.departamento].custo += qtdPagos * 20
            resumo[s.departamento].economia += (s.economiaGerada || 0)
          })

          let totalQtd = 0, totalCusto = 0, totalEcon = 0
          Object.entries(resumo).sort().forEach(([dept, vals]) => {
            totalQtd += vals.qtd; totalCusto += vals.custo; totalEcon += vals.economia
            resumoBody.push([dept, vals.qtd, vals.custo.toFixed(2), vals.economia.toFixed(2)])
          })

          resumoBody.push([{ content: 'TOTAIS', styles: { fontStyle: 'bold', fillColor: [243, 244, 246] } }, totalQtd, totalCusto.toFixed(2), totalEcon.toFixed(2)])

          autoTable(doc, {
            head: resumoHead,
            body: resumoBody,
            startY: 25,
            theme: 'striped',
            headStyles: { fillColor: [30, 64, 175] },
            styles: { fontSize: 10 }
          })

          doc.save(`Relatorio_Admin_${now.getTime()}.pdf`)
        }

        setCarregando(false)
        setOpen(false)
      } catch (error) {
        console.error("Erro ao gerar relatório:", error)
        alert("Erro ao gerar relatório. Tente novamente.")
        setCarregando(false)
      }
    }, 1500)
  }

  const camposDisponiveis = [
    { id: "numero", label: "Número da Solicitação", obrigatorio: true },
    { id: "dataSolicitacao", label: "Data da Solicitação", obrigatorio: true },
    { id: "solicitante", label: "Solicitante", obrigatorio: true },
    { id: "departamento", label: "Departamento", obrigatorio: true },
    { id: "local", label: "Local", obrigatorio: false },
    { id: "evento", label: "Evento", obrigatorio: false },
    { id: "empresa", label: "Empresa", obrigatorio: false },
    { id: "prestadores", label: "Prestadores", obrigatorio: false },
    { id: "doc1", label: "Doc1", obrigatorio: false },
    { id: "doc2", label: "Doc2", obrigatorio: false },
    { id: "dataInicial", label: "Data Inicial", obrigatorio: false },
    { id: "dataFinal", label: "Data Final", obrigatorio: false },
    { id: "status", label: "Status", obrigatorio: false },
    { id: "checagemValidaAte", label: "Checagem Válida Até", obrigatorio: false },
    { id: "cadastro", label: "Status do Cadastro", obrigatorio: false },
    { id: "economia", label: "Tipo de Economia", obrigatorio: false },
    { id: "custoChecagem", label: "Custo da Checagem", obrigatorio: false },
    { id: "observacoes", label: "Observações", obrigatorio: false },
  ]

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-green-600 hover:bg-green-700 text-white" onClick={() => setOpen(true)}>
          <Download className="h-4 w-4 mr-2" />
          Gerar Relatório
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-green-600" />
            Gerar Relatório de Solicitações
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Formato do Relatório */}
          <div>
            <Label className="text-base font-medium mb-3 block">Formato do Relatório</Label>
            <div className="grid grid-cols-2 gap-3">
              <Button
                type="button"
                variant={formatoRelatorio === "excel" ? "default" : "outline"}
                onClick={() => setFormatoRelatorio("excel")}
                className="flex items-center gap-2"
              >
                <Table className="h-4 w-4" />
                Excel (.xlsx)
              </Button>
              <Button
                type="button"
                variant={formatoRelatorio === "pdf" ? "default" : "outline"}
                onClick={() => setFormatoRelatorio("pdf")}
                className="flex items-center gap-2"
              >
                <FileText className="h-4 w-4" />
                PDF
              </Button>
            </div>
          </div>

          <Separator />

          {/* Período */}
          <div>
            <Label className="text-base font-medium mb-3 block">Período (Opcional)</Label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-sm text-gray-600">Data Inicial</Label>
                <Input type="date" value={dataInicial} onChange={(e) => setDataInicial(e.target.value)} />
              </div>
              <div>
                <Label className="text-sm text-gray-600">Data Final</Label>
                <Input type="date" value={dataFinal} onChange={(e) => setDataFinal(e.target.value)} />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-1">Deixe em branco para incluir todas as solicitações</p>
          </div>

          <Separator />

          {/* Filtros Ativos */}
          <div>
            <Label className="text-base font-medium mb-3 block">Filtros Ativos</Label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-3 bg-blue-50 rounded-lg">
              <div>
                <Label className="text-xs text-gray-600">Solicitante</Label>
                <p className="text-sm font-medium">{filtroSolicitante !== "todos" ? filtroSolicitante : "Todos"}</p>
              </div>
              <div>
                <Label className="text-xs text-gray-600">Departamento</Label>
                <p className="text-sm font-medium">{filtroDepartamento !== "todos" ? filtroDepartamento : "Todos"}</p>
              </div>
              <div>
                <Label className="text-xs text-gray-600">Tipo</Label>
                <p className="text-sm font-medium">{filtroTipo !== "todos" ? filtroTipo : "Todos"}</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Campos do Relatório */}
          <div>
            <Label className="text-base font-medium mb-3 block">Campos a Incluir no Relatório</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-60 overflow-y-auto">
              {camposDisponiveis.map((campo) => (
                <div key={campo.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={campo.id}
                    checked={camposSelecionados[campo.id as keyof typeof camposSelecionados]}
                    onCheckedChange={(checked) => handleCampoChange(campo.id, checked as boolean)}
                    disabled={campo.obrigatorio}
                  />
                  <Label
                    htmlFor={campo.id}
                    className={`text-sm ${campo.obrigatorio ? "font-medium text-blue-700" : "text-gray-700"}`}
                  >
                    {campo.label}
                    {campo.obrigatorio && <span className="text-blue-600 ml-1">*</span>}
                  </Label>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-2">* Campos obrigatórios sempre serão incluídos</p>
          </div>

          {/* Resumo */}
          <div className="p-3 bg-gray-50 rounded-lg">
            <Label className="text-sm font-medium text-gray-700">Resumo do Relatório:</Label>
            <div className="text-xs text-gray-600 mt-1 space-y-1">
              <p>
                • Formato: <strong>{formatoRelatorio.toUpperCase()}</strong>
              </p>
              <p>
                • Período:{" "}
                <strong>{dataInicial && dataFinal ? `${dataInicial} a ${dataFinal}` : "Todos os períodos"}</strong>
              </p>
              <p>
                • Campos selecionados: <strong>{Object.values(camposSelecionados).filter(Boolean).length}</strong>
              </p>
              <p>
                • Filtros aplicados:{" "}
                <strong>
                  {[
                    filtroSolicitante !== "todos" ? "Solicitante" : null,
                    filtroDepartamento !== "todos" ? "Departamento" : null,
                    filtroTipo !== "todos" ? "Tipo" : null,
                  ]
                    .filter(Boolean)
                    .join(", ") || "Nenhum"}
                </strong>
              </p>
            </div>
          </div>

          {/* Botões */}
          <div className="flex gap-3 pt-4">
            <Button variant="outline" onClick={() => setOpen(false)} className="flex-1" disabled={carregando}>
              Cancelar
            </Button>
            <Button onClick={gerarRelatorio} className="flex-1 bg-green-600 hover:bg-green-700" disabled={carregando}>
              {carregando ? "Gerando..." : `Gerar ${formatoRelatorio.toUpperCase()}`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
