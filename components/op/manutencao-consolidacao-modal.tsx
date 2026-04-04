'use client'

import React, { useState } from 'react'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Printer, Save, Wrench, X, Loader2, CheckCircle2 } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { KanbanService } from '@/services/kanban-service'
import { toast } from 'sonner'
import { VisuallyHidden } from '@radix-ui/react-visually-hidden'

interface ManutencaoConsolidacaoModalProps {
    isOpen: boolean
    onClose: () => void
    tarefas: any[]
    operadorNome: string
}

export function ManutencaoConsolidacaoModal({
    isOpen,
    onClose,
    tarefas,
    operadorNome
}: ManutencaoConsolidacaoModalProps) {
    const [isSaving, setIsSaving] = useState(false)
    const dataHoje = format(new Date(), "dd/MM/yyyy", { locale: ptBR })

    const gerarHTMLRelatorio = () => {
        const dataHora = format(new Date(), "dd/MM/yyyy HH:mm", { locale: ptBR })
        const protocol = new Date().getTime()

        return `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Relatório de Manutenção - ${dataHoje}</title>
                <script src="https://cdn.tailwindcss.com"></script>
                <style>
                    @page { size: A4; margin: 0; }
                    body { -webkit-print-color-adjust: exact; font-family: sans-serif; background: white; margin: 0; }
                    .sheet { width: 210mm; min-height: 297mm; padding: 20mm; margin: 0 auto; box-sizing: border-box; }
                </style>
            </head>
            <body>
                <div class="sheet">
                    <div style="border-bottom: 3px solid black; padding-bottom: 20px; margin-bottom: 40px; text-align: center;">
                        <h1 style="font-size: 28px; font-weight: 900; text-transform: uppercase;">Relatório Consolidado de Manutenção</h1>
                        <p style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.4em; margin-top: 10px;">MVM Sistemas de Segurança</p>
                    </div>

                    <div style="background: #f8fafc; border: 2px solid #e2e8f0; padding: 20px; border-radius: 10px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <p style="font-size: 10px; font-weight: 900; color: #64748b; text-transform: uppercase;">Data do Relatório</p>
                            <p style="font-size: 18px; font-weight: 900;">${dataHoje}</p>
                        </div>
                        <div style="text-align: right;">
                            <p style="font-size: 10px; font-weight: 900; color: #64748b; text-transform: uppercase;">Total de Intervenções</p>
                            <p style="font-size: 18px; font-weight: 900;">${tarefas.length} Registros</p>
                        </div>
                    </div>

                    <table style="width: 100%; border-collapse: collapse; margin-bottom: 40px;">
                        <thead>
                            <tr style="border-bottom: 4px solid black;">
                                <th style="padding: 15px 10px; font-size: 11px; font-weight: 900; text-transform: uppercase; text-align: left; width: 25%;">Equipamento / Local</th>
                                <th style="padding: 15px 10px; font-size: 11px; font-weight: 900; text-transform: uppercase; text-align: center; width: 15%;">Prioridade</th>
                                <th style="padding: 15px 10px; font-size: 11px; font-weight: 900; text-transform: uppercase; text-align: left;">Descrição do Problema / Serviço</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${tarefas.length > 0 ? tarefas.map(t => `
                                <tr style="border-bottom: 1px solid #e2e8f0;">
                                    <td style="padding: 15px 10px;">
                                        <p style="font-size: 12px; font-weight: 900; margin: 0;">${t.dados_especificos?.equipamento || 'N/A'}</p>
                                        <p style="font-size: 10px; color: #64748b; margin: 2px 0 0 0;">${t.dados_especificos?.local || 'N/A'}</p>
                                    </td>
                                    <td style="padding: 15px 10px; text-align: center;">
                                        <span style="font-size: 10px; font-weight: 900; text-transform: uppercase; padding: 4px 8px; border-radius: 4px; background: ${t.dados_especificos?.prioridade === 'urgente' ? '#fee2e2; color: #991b1b;' : (t.dados_especificos?.prioridade === 'alta' ? '#ffedd5; color: #9a3412;' : '#f1f5f9; color: #475569;')};">
                                            ${t.dados_especificos?.prioridade || 'baixa'}
                                        </span>
                                    </td>
                                    <td style="padding: 15px 10px; font-size: 11px; line-height: 1.5; color: #334155;">
                                        ${(t.descricao || '').split('\n\nDescrição do Problema:\n').pop()}
                                    </td>
                                </tr>
                            `).join('') : `
                                <tr>
                                    <td colspan="3" style="padding: 60px; text-align: center; color: #94a3b8; font-size: 12px; font-weight: 900; text-transform: uppercase;">Nenhuma manutenção registrada hoje.</td>
                                </tr>
                            `}
                        </tbody>
                    </table>

                    <div style="margin-top: 100px; display: flex; justify-content: space-between; padding-left: 40px; padding-right: 40px;">
                        <div style="text-align: center; width: 40%;">
                            <div style="border-top: 2px solid black; margin-bottom: 10px;"></div>
                            <p style="font-size: 11px; font-weight: 900; text-transform: uppercase;">Técnico Responsável</p>
                        </div>
                        <div style="text-align: center; width: 40%;">
                            <div style="border-top: 2px solid black; margin-bottom: 10px;"></div>
                            <p style="font-size: 11px; font-weight: 900; text-transform: uppercase;">Gestor Operacional</p>
                        </div>
                    </div>

                    <div style="margin-top: 60px; text-align: center; border-top: 1px solid #f1f5f9; padding-top: 20px;">
                        <p style="font-size: 9px; color: #94a3b8; font-style: italic;">Protocolo: ${protocol} | Gerado por: ${operadorNome} | Emissão: ${dataHora}</p>
                        <p style="font-size: 9px; color: #94a3b8;">Documento Oficial MVM Sistemas de Segurança</p>
                    </div>
                </div>
            </body>
            </html>
        `
    }

    const imprimirRelatorio = () => {
        const printWindow = window.open('', '_blank', 'width=1200,height=900')
        if (!printWindow) {
            alert("Por favor, permita pop-ups para imprimir o relatório.")
            return
        }
        const content = gerarHTMLRelatorio()
        const contentComScript = content.replace('</body>', '<script>window.onload = () => { window.print(); setTimeout(() => window.close(), 1000); }</script></body>')
        printWindow.document.write(contentComScript)
        printWindow.document.close()
    }

    const consolidarRelatorio = async () => {
        if (tarefas.length === 0) {
            toast.error("Não há manutenções para consolidar.")
            return
        }

        setIsSaving(true)
        try {
            const html = gerarHTMLRelatorio()
            await KanbanService.criarTarefa({
                titulo: `CONSOLIDADO MANUTENÇÃO: ${dataHoje}`,
                descricao: `Relatório diário consolidando ${tarefas.length} intervenções técnicas realizadas em ${dataHoje}.`,
                status: 'finalizado',
                categoria: 'manutencao_consolidada',
                created_by_name: operadorNome,
                dados_especificos: {
                    tipo: 'Manutenção Consolidada',
                    data_referencia: dataHoje,
                    total_itens: tarefas.length,
                    relatorio_html_snapshot: html
                }
            })
            toast.success("Relatório Consolidado salvo no Kanban com sucesso!")
            onClose()
        } catch (error: any) {
            toast.error("Erro ao consolidar relatório: " + error.message)
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl w-[95vw] max-h-[90vh] h-[90vh] flex flex-col p-0 border-none bg-slate-900 shadow-2xl rounded-[2.5rem] overflow-hidden">
                <VisuallyHidden>
                    <DialogTitle>Consolidação de Manutenção Diária</DialogTitle>
                </VisuallyHidden>
                
                {/* Header */}
                <div className="p-6 bg-slate-800/80 flex items-center justify-between border-b border-white/5">
                    <div className="flex items-center gap-3 text-white">
                        <div className="h-10 w-10 bg-cyan-600 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-600/20">
                            <Wrench className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <h2 className="font-black uppercase text-xs tracking-widest leading-none">Relatório Consolidado</h2>
                            <p className="text-[10px] font-bold text-slate-400 mt-1">{dataHoje} - {tarefas.length} itens</p>
                        </div>
                    </div>
                    <Button variant="ghost" onClick={onClose} className="h-10 w-10 p-0 rounded-full hover:bg-white/10 text-slate-400">
                        <X className="h-6 w-6" />
                    </Button>
                </div>

                {/* Preview Area */}
                <div className="flex-1 overflow-y-auto p-10 bg-slate-800/40 custom-scrollbar">
                    <div className="mx-auto bg-white w-full max-w-[210mm] min-h-[297mm] p-16 shadow-2xl flex flex-col border border-slate-200 ring-1 ring-black/5 rounded-sm origin-top scale-[0.85] sm:scale-100">
                        {/* Fake Browser Content / Header */}
                        <div className="border-b-[3px] border-black pb-8 mb-10 text-center">
                            <h1 className="text-2xl font-black tracking-tight uppercase leading-none">Relatório de Manutenção</h1>
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.4em] mt-3 italic">MVM Sistemas de Segurança</p>
                        </div>

                        {/* Top Info */}
                        <div className="flex justify-between items-center bg-slate-50 border-2 border-slate-100 p-6 rounded-2xl mb-10">
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Período de Referência</p>
                                <p className="text-xl font-black text-slate-800">{dataHoje}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Intervenções Técnicas</p>
                                <p className="text-xl font-black text-slate-800">{tarefas.length} REGISTROS</p>
                            </div>
                        </div>

                        {/* Items Table */}
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="border-b-4 border-black">
                                    <th className="py-4 text-left text-[10px] font-black uppercase tracking-wider">Equipamento / Local</th>
                                    <th className="py-4 text-center text-[10px] font-black uppercase tracking-wider w-24">Prioridade</th>
                                    <th className="py-4 text-left text-[10px] font-black uppercase tracking-wider">Diagnóstico / Ação</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {tarefas.map((t, idx) => (
                                    <tr key={idx}>
                                        <td className="py-5">
                                            <p className="text-[11px] font-black uppercase text-slate-800">{t.dados_especificos?.equipamento}</p>
                                            <p className="text-[9px] font-bold text-slate-400 uppercase">{t.dados_especificos?.local}</p>
                                        </td>
                                        <td className="py-5 text-center">
                                            <span className={`text-[8px] font-black uppercase px-2 py-1 rounded ${
                                                t.dados_especificos?.prioridade === 'urgente' ? 'bg-red-100 text-red-700' : 
                                                t.dados_especificos?.prioridade === 'alta' ? 'bg-orange-100 text-orange-700' : 'bg-slate-100 text-slate-600'
                                            }`}>
                                                {t.dados_especificos?.prioridade}
                                            </span>
                                        </td>
                                        <td className="py-5 text-[10px] text-slate-600 leading-relaxed max-w-sm">
                                            {(t.descricao || '').split('\n\nDescrição do Problema:\n').pop()}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {/* Footer Signatures */}
                        <div className="mt-auto pt-20 flex justify-between px-10">
                            <div className="text-center w-64">
                                <div className="border-t-2 border-black mb-2"></div>
                                <p className="text-[10px] font-black uppercase">Técnico Responsável</p>
                            </div>
                            <div className="text-center w-64">
                                <div className="border-t-2 border-black mb-2"></div>
                                <p className="text-[10px] font-black uppercase">Gestor MVM</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="p-8 bg-slate-800 flex flex-col sm:flex-row justify-center gap-4 border-t border-white/5 shrink-0">
                    <Button variant="ghost" onClick={onClose} className="text-white hover:bg-white/10 px-8 font-black uppercase text-xs tracking-widest h-14">Cancelar</Button>
                    <Button onClick={imprimirRelatorio} className="bg-white text-slate-900 hover:bg-slate-100 h-14 px-8 rounded-2xl font-black uppercase text-sm flex items-center gap-3 transition-all active:scale-95">
                        <Printer className="h-5 w-5" /> IMPRIMIR PDF
                    </Button>
                    <Button onClick={consolidarRelatorio} className="bg-cyan-600 text-white hover:bg-cyan-700 h-14 px-8 rounded-2xl font-black uppercase text-sm flex items-center gap-3 shadow-xl shadow-cyan-600/20 transition-all active:scale-95" disabled={isSaving}>
                        {isSaving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
                        {isSaving ? "SALVANDO..." : "CONSOLIDAR DIÁRIO"}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
