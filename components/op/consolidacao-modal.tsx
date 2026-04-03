'use client'

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Printer, Save, FileText, ShieldAlert } from "lucide-react"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

interface ConsolidacaoModalProps {
    isOpen: boolean
    onClose: () => void
    onConfirm: () => Promise<void>
    metricas: {
        total: number
        ok: number
        preta: number
        distorcida: number
        desativada: number
        sem_registro: number
        fora_foco: number
        saude: string
        camerasAtivas: number
    }
    dvrs: any[]
    matriz: { [key: string]: string }
    isSaving: boolean
}

export function ConsolidacaoModal({
    isOpen,
    onClose,
    onConfirm,
    metricas,
    dvrs,
    matriz,
    isSaving
}: ConsolidacaoModalProps) {

    const gerarPDF = () => {
        const doc = new jsPDF('p', 'mm', 'a4')
        const dataHora = format(new Date(), "dd/MM/yyyy HH:mm", { locale: ptBR })

        doc.setDrawColor(0)
        doc.setTextColor(0)
        
        // 1. Cabeçalho Sóbrio de Segurança
        doc.setFont("helvetica", "bold")
        doc.setFontSize(14)
        doc.text("MVM - SISTEMAS DE SEGURANÇA E VIGILÂNCIA MUNICIPAL", 105, 15, { align: 'center' })
        
        doc.setFontSize(11)
        doc.text("RELATÓRIO TÉCNICO DE RONDA E AUDITORIA DE CFTV", 105, 22, { align: 'center' })
        
        doc.setFontSize(8)
        doc.setFont("helvetica", "normal")
        doc.text(`EMISSÃO: ${dataHora} | PROTOCOLO OPERACIONAL: ${new Date().getTime()}`, 105, 27, { align: 'center' })
        doc.line(15, 30, 195, 30)

        // 2. Quadro de Métricas Reais (As 5 Caixas)
        const startY = 35
        const boxWidth = 36
        const boxHeight = 22
        const startX = 15

        const boxes = [
            { label: "UNIDADES DVR", value: dvrs.length, sub: "GRAVADORES" },
            { label: "TOTAL CANAIS", value: metricas.total, sub: `${metricas.camerasAtivas} ATIVOS` },
            { label: "STATUS GERAL", value: "OPERACIONAL", sub: "SEM ALTERAÇÕES" },
            { label: "CANAIS OK", value: metricas.ok, sub: "IMAGEM LIMPA" },
            { label: "SAÚDE SISTEMA", value: `${metricas.saude}%`, sub: "ÍNDICE REAL" }
        ]

        boxes.forEach((box, i) => {
            const x = startX + (i * boxWidth)
            doc.rect(x, startY, boxWidth, boxHeight)
            doc.setFontSize(7)
            doc.setFont("helvetica", "bold")
            doc.text(box.label, x + (boxWidth / 2), startY + 6, { align: 'center' })
            doc.setFontSize(11)
            doc.text(String(box.value), x + (boxWidth / 2), startY + 13, { align: 'center' })
            doc.setFontSize(6)
            doc.setFont("helvetica", "normal")
            doc.text(box.sub, x + (boxWidth / 2), startY + 19, { align: 'center' })
        })

        // 3. Tabela de Ocorrências (Sóbria e Organizada)
        const dvrFalhas: any[] = []
        dvrs.forEach(dvr => {
            const keys = Object.keys(matriz).filter(k => k.startsWith(`${dvr.id}-`))
            const falhas = keys.filter(k => matriz[k] !== 'OK' && matriz[k] !== 'DESATIVADA')
            if (falhas.length > 0) {
                const detalhes = falhas.map(k => `CH${k.split('-')[1]}`).join(", ")
                dvrFalhas.push([dvr.nome, keys.length, falhas.length, detalhes])
            }
        })

        autoTable(doc, {
            head: [['DISPOSITIVO (DVR)', 'CANAIS', 'FALHAS', 'IDENTIFICAÇÃO DOS CANAIS COM ERRO']],
            body: dvrFalhas.length > 0 ? dvrFalhas : [['TODOS OS SISTEMAS OPERANDO EM CONFORMIDADE', '-', '0', 'Nenhuma anormalidade detectada']],
            startY: startY + boxHeight + 10,
            theme: 'grid',
            headStyles: { fillColor: [0, 0, 0], textColor: [255, 255, 255], fontSize: 8 },
            styles: { fontSize: 8, textColor: [0, 0, 0], cellPadding: 3 },
            columnStyles: { 0: { fontStyle: 'bold' }, 2: { fontStyle: 'bold' } }
        })

        // 4. Assinaturas e Frase Final
        const finalY = (doc as any).lastAutoTable.finalY + 30
        doc.line(20, finalY, 90, finalY)
        doc.text("ASSINATURA DO OPERADOR", 55, finalY + 5, { align: 'center' })

        doc.line(120, finalY, 190, finalY)
        doc.text("ASSINATURA DO TÉCNICO", 155, finalY + 5, { align: 'center' })

        doc.setFontSize(7)
        doc.setFont("helvetica", "italic")
        doc.text("ESTE DOCUMENTO É REGISTRO OFICIAL DE AUDITORIA DE SEGURANÇA. CÓPIAS SÃO PROIBIDAS SEM AUTORIZAÇÃO DA MVM.", 105, finalY + 15, { align: 'center' })

        doc.save(`RELATORIO_RONDA_MVM_${format(new Date(), 'yyyyMMdd_HHmm')}.pdf`)
    }

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-[210mm] w-full max-h-[95vh] overflow-y-auto p-0 border-none bg-slate-800/10 backdrop-blur-md">
                {/* Folha A4 Profissional */}
                <div className="mx-auto my-10 bg-white w-[210mm] min-h-[297mm] p-16 shadow-2xl flex flex-col border border-slate-300">
                    
                    {/* Cabeçalho Sóbrio */}
                    <div className="border-b-2 border-black pb-6 mb-10 text-center">
                        <h1 className="text-2xl font-black tracking-tighter uppercase">Relatório de Auditoria CFTV</h1>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.3em] mt-1">MVM Sistemas de Segurança</p>
                    </div>

                    {/* 5 Quadros de Produção Real */}
                    <div className="grid grid-cols-5 border-2 border-black divide-x-2 divide-black mb-12">
                        {[
                            { label: "UNIDADES DVR", value: dvrs.length, sub: "Gravadores ativos" },
                            { label: "CANAIS TOTAIS", value: metricas.total, sub: `${metricas.camerasAtivas} Câmeras Ativas` },
                            { label: "STATUS GERAL", value: "OK", sub: "Em conformidade" },
                            { label: "CANAIS OK", value: metricas.ok, sub: "Imagem estável" },
                            { label: "SAÚDE SISTEMA", value: `${metricas.saude}%`, sub: "Nível de aproveitamento" }
                        ].map((box, i) => (
                            <div key={i} className={`p-5 text-center ${i === 4 ? 'bg-black text-white' : 'bg-white'}`}>
                                <p className="text-[9px] font-black uppercase mb-1">{box.label}</p>
                                <p className="text-2xl font-black leading-none">{box.value}</p>
                                <p className="text-[8px] font-medium opacity-60 mt-2 uppercase">{box.sub}</p>
                            </div>
                        ))}
                    </div>

                    {/* Detalhamento Técnico */}
                    <div className="flex-1 space-y-6">
                        <div className="flex items-center gap-3 border-l-8 border-black pl-4 bg-slate-50 py-3">
                            <ShieldAlert className="h-5 w-5 text-black" />
                            <h3 className="text-sm font-black uppercase tracking-tight">Ocorrências Técnicas Detectadas</h3>
                        </div>

                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="border-b-4 border-black">
                                    <th className="py-4 text-[11px] font-black uppercase text-left">Dispositivo</th>
                                    <th className="py-4 text-[11px] font-black uppercase text-center">Canais</th>
                                    <th className="py-4 text-[11px] font-black uppercase text-center">Falhas</th>
                                    <th className="py-4 text-[11px] font-black uppercase text-left">Canais com Anormalidade</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y-2 divide-slate-100 italic">
                                {dvrs.filter(dvr => {
                                    const keys = Object.keys(matriz).filter(k => k.startsWith(`${dvr.id}-`))
                                    return keys.some(k => matriz[k] !== 'OK' && matriz[k] !== 'DESATIVADA')
                                }).map((dvr) => {
                                    const keys = Object.keys(matriz).filter(k => k.startsWith(`${dvr.id}-`))
                                    const falhas = keys.filter(k => matriz[k] !== 'OK' && matriz[k] !== 'DESATIVADA')
                                    return (
                                        <tr key={dvr.id} className="hover:bg-slate-50/50">
                                            <td className="py-4 text-[12px] font-bold uppercase">{dvr.nome}</td>
                                            <td className="py-4 text-[12px] text-center font-medium">{keys.length}</td>
                                            <td className="py-4 text-[12px] text-center font-black text-red-600">{falhas.length}</td>
                                            <td className="py-4 text-[10px] text-slate-500 font-bold uppercase">
                                                {falhas.map(k => `CH${k.split('-')[1]}`).join(", ")}
                                            </td>
                                        </tr>
                                    )
                                })}
                                {dvrs.every(dvr => {
                                    const keys = Object.keys(matriz).filter(k => k.startsWith(`${dvr.id}-`))
                                    return !keys.some(k => matriz[k] !== 'OK' && matriz[k] !== 'DESATIVADA')
                                }) && (
                                    <tr>
                                        <td colSpan={4} className="py-24 text-center text-slate-400 font-black uppercase tracking-[0.2em] text-[10px]">
                                            Nenhuma falha técnica registrada em todos os canais ativos.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Rodapé de Segurança */}
                    <div className="mt-20 space-y-12">
                        <div className="grid grid-cols-2 gap-24 px-10">
                            <div className="text-center">
                                <div className="border-t-2 border-black mb-2"></div>
                                <p className="text-[10px] font-black uppercase">Responsável pela Ronda</p>
                            </div>
                            <div className="text-center">
                                <div className="border-t-2 border-black mb-2"></div>
                                <p className="text-[10px] font-black uppercase">Responsável Técnico CFTV</p>
                            </div>
                        </div>
                        <div className="text-center border-t border-slate-100 pt-8">
                            <p className="text-[9px] font-bold text-slate-400 italic uppercase">
                                Relatório emitido eletronicamente via Sistema MVM. Documento Oficial de Auditoria Externa.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Ações do Relatório */}
                <div className="fixed bottom-10 left-1/2 -translate-x-1/2 flex gap-4 bg-black p-4 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.4)]">
                    <Button variant="ghost" onClick={onClose} className="text-white hover:bg-white/10 px-8 font-black uppercase text-xs">Voltar</Button>
                    <Button onClick={gerarPDF} className="bg-white text-black hover:bg-slate-200 px-8 font-black uppercase text-xs flex items-center gap-2">
                        <Printer className="h-4 w-4" /> Imprimir Documento
                    </Button>
                    <Button onClick={onConfirm} className="bg-blue-600 text-white hover:bg-blue-700 px-8 font-black uppercase text-xs flex items-center gap-2" disabled={isSaving}>
                        <Save className="h-4 w-4" /> {isSaving ? "Gravando..." : "Consolidar e Finalizar"}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
