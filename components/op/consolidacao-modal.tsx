'use client'

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Printer, Save, ShieldAlert, X } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

interface ConsolidacaoModalProps {
    isOpen: boolean
    onClose: () => void
    onConfirm: (htmlSnapshot: string) => Promise<void>
    metricas: {
        total: number
        ok: number
        sem_sinal: number
        interferencia: number
        vago: number
        sem_gravacao: number
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

    const falhasTotais = metricas.total - metricas.ok - metricas.vago
    
    // Normalization logic for reading older JSON dumps
    const normalizeStatus = (s: string) => {
        if (s === 'PRETA') return 'SEM_SINAL'
        if (s === 'DISTORCIDA') return 'INTERFERENCIA'
        if (s === 'SEM_REGISTRO') return 'SEM_GRAVACAO'
        if (s === 'DESATIVADA') return 'VAGO'
        return s || 'OK'
    }

    const falhasMap: Record<string, string> = {
        'INTERFERENCIA': 'com interferência',
        'SEM_SINAL': 'sem sinal',
        'SEM_GRAVACAO': 'sem gravação',
        'FORA_FOCO': 'fora de foco/obstrução'
    }
    
    const gerarHTMLRelatorio = () => {
        const dataHora = format(new Date(), "dd/MM/yyyy HH:mm", { locale: ptBR })
        const protocol = new Date().getTime()
        
        // Coleta de falhas agrupadas e formatadas
        const dvrFalhas = dvrs.filter(dvr => {
            const keys = Object.keys(matriz).filter(k => k.startsWith(`${dvr.id}-`))
            return keys.some(k => {
                const s = normalizeStatus(matriz[k]);
                return s !== 'OK' && s !== 'VAGO'
            })
        }).map(dvr => {
            const keys = Object.keys(matriz).filter(k => k.startsWith(`${dvr.id}-`))
            const keysDeFalha = keys.filter(k => {
                const s = normalizeStatus(matriz[k]);
                return s !== 'OK' && s !== 'VAGO'
            });

            const agrupado: Record<string, string[]> = {};
            keysDeFalha.forEach(k => {
                const status = normalizeStatus(matriz[k]);
                const chNum = k.split('-').pop(); // correct split for UUID resilience
                const chFormatado = String(chNum).padStart(2, '0');
                if (!agrupado[status]) agrupado[status] = [];
                agrupado[status].push(chFormatado);
            });

            // "01 e 06 sem imagem", or "10 fora de foco"
            const descricoes = Object.keys(agrupado).map(status => {
                const canais = agrupado[status].sort((a,b) => parseInt(a) - parseInt(b));
                const label = falhasMap[status] || status.toLowerCase();
                
                let canaisStr = "";
                if (canais.length === 1) {
                    canaisStr = canais[0];
                } else if (canais.length === 2) {
                    canaisStr = `${canais[0]} e ${canais[1]}`;
                } else {
                    canaisStr = canais.slice(0, -1).join(', ') + ' e ' + canais[canais.length - 1];
                }
                
                return `${canaisStr} ${label}`;
            });

            return {
                nome: dvr.nome,
                canais: keys.length,
                falhas: keysDeFalha.length,
                detalhes: descricoes
            }
        })

        return `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Relatório MVM - ${dataHora}</title>
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
                        <h1 style="font-size: 28px; font-weight: 900; text-transform: uppercase;">Relatório de Auditoria CFTV</h1>
                        <p style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.4em; margin-top: 10px;">MVM Sistemas de Segurança</p>
                    </div>

                    <div style="display: grid; grid-template-columns: repeat(5, 1fr); border: 4px solid black; margin-bottom: 40px;">
                        ${[
                            { label: "UNIDADES DVR", value: dvrs.length, sub: "Gravadores ativos" },
                            { label: "TOTAL DE CÂMERAS", value: metricas.camerasAtivas, sub: `${metricas.vago} Espaços Vagos` },
                            { label: "CANAIS COM FALHA", value: falhasTotais, sub: "Manutenção", alert: falhasTotais > 0 },
                            { label: "CANAIS OK", value: metricas.ok, sub: "Em conformidade" },
                            { label: "SAÚDE SISTEMA", value: `${metricas.saude}%`, sub: "Aproveitamento" }
                        ].map((box, i) => `
                            <div style="padding: 20px; text-align: center; border-right: ${i < 4 ? '4px solid black' : 'none'}; ${i === 4 || box.alert ? 'background: black; color: white;' : 'background: white; color: black;'}">
                                <p style="font-size: 10px; font-weight: 900; text-transform: uppercase; margin-bottom: 5px;">${box.label}</p>
                                <p style="font-size: 32px; font-weight: 900;">${box.value}</p>
                                <p style="font-size: 9px; font-weight: 700; margin-top: 5px; opacity: 0.6;">${box.sub}</p>
                            </div>
                        `).join('')}
                    </div>

                    <div style="border-left: 10px solid black; padding-left: 20px; background: #f8fafc; padding-top: 15px; padding-bottom: 15px; margin-bottom: 30px;">
                        <h3 style="font-size: 16px; font-weight: 900; text-transform: uppercase;">Ocorrências Técnicas Detectadas</h3>
                    </div>

                    <table style="width: 100%; border-collapse: collapse; margin-bottom: 40px;">
                        <thead>
                            <tr style="border-bottom: 4px solid black;">
                                <th style="padding: 15px 10px; font-size: 11px; font-weight: 900; text-transform: uppercase; text-align: left;">Dispositivo</th>
                                <th style="padding: 15px 10px; font-size: 11px; font-weight: 900; text-transform: uppercase; text-align: center;">Canais</th>
                                <th style="padding: 15px 10px; font-size: 11px; font-weight: 900; text-transform: uppercase; text-align: center;">Falhas</th>
                                <th style="padding: 15px 10px; font-size: 11px; font-weight: 900; text-transform: uppercase; text-align: left;">Anormalidades</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${dvrFalhas.length > 0 ? dvrFalhas.map(f => `
                                <tr style="border-bottom: 1px solid #e2e8f0;">
                                    <td style="padding: 15px 10px; font-size: 12px; font-weight: 900;">${f.nome}</td>
                                    <td style="padding: 15px 10px; font-size: 12px; font-weight: 700; text-align: center;">${f.canais}</td>
                                    <td style="padding: 15px 10px; font-size: 12px; font-weight: 900; text-align: center; color: #ef4444;">${f.falhas}</td>
                                    <td style="padding: 15px 10px; font-size: 11px; font-weight: 600; color: #64748b; font-style: italic; white-space: pre-line; line-height: 1.6;">${f.detalhes.join('<br>')}</td>
                                </tr>
                            `).join('') : `
                                <tr>
                                    <td colspan="4" style="padding: 80px; text-align: center; color: #94a3b8; font-size: 12px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.2em;">Nenhuma falha técnica registrada.</td>
                                </tr>
                            `}
                        </tbody>
                    </table>

                    <div style="margin-top: 80px; display: flex; justify-content: space-between; padding-left: 40px; padding-right: 40px;">
                        <div style="text-align: center; width: 40%;">
                            <div style="border-top: 2px solid black; margin-bottom: 10px;"></div>
                            <p style="font-size: 11px; font-weight: 900; text-transform: uppercase;">Responsável Ronda</p>
                        </div>
                        <div style="text-align: center; width: 40%;">
                            <div style="border-top: 2px solid black; margin-bottom: 10px;"></div>
                            <p style="font-size: 11px; font-weight: 900; text-transform: uppercase;">Responsável Técnico</p>
                        </div>
                    </div>

                    <div style="margin-top: 60px; text-align: center; border-top: 1px solid #f1f5f9; padding-top: 20px;">
                        <p style="font-size: 9px; color: #94a3b8; font-style: italic;">Protocolo Operacional: ${protocol} | Emissão: ${dataHora}</p>
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
        // Adiciona a rotina de auto-print apenas no window open
        const contentComScript = content.replace('</body>', '<script>window.onload = () => { window.print(); setTimeout(() => window.close(), 1000); }</script></body>')

        printWindow.document.write(contentComScript)
        printWindow.document.close()
    }

    const triggerSave = () => {
        onConfirm(gerarHTMLRelatorio())
    }

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-4xl w-[90vw] max-h-[90vh] h-[90vh] flex flex-col overflow-hidden p-0 border-none bg-slate-900 shadow-2xl rounded-[32px]">
                
                {/* Header do Modal com Botão Fechar Claro */}
                <div className="p-6 bg-slate-800/50 flex items-center justify-between border-b border-white/5 shrink-0">
                    <div className="flex items-center gap-3 text-white">
                        <Printer className="h-5 w-5 text-blue-400" />
                        <h2 className="font-black uppercase text-xs tracking-widest">Confirmação de Ronda CFTV</h2>
                    </div>
                    <Button variant="ghost" onClick={onClose} className="h-10 w-10 p-0 rounded-xl hover:bg-white/10 text-slate-400">
                        <X className="h-6 w-6" />
                    </Button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 sm:p-10 custom-scrollbar relative">
                    {/* Folha A4 Profissional - Pré-visualização com escala fixa */}
                    <div className="mx-auto bg-white w-full max-w-[210mm] min-h-[297mm] p-8 sm:p-16 shadow-2xl flex flex-col border border-slate-200 relative overflow-hidden ring-1 ring-black/5">
                        
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-600/10"></div>

                        {/* Cabeçalho */}
                        <div className="border-b-[3px] border-black pb-8 mb-10 text-center">
                            <h1 className="text-2xl font-black tracking-tight uppercase leading-none">Relatório de Auditoria CFTV</h1>
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.4em] mt-3 italic">MVM Sistemas de Segurança</p>
                        </div>

                        {/* 5 Quadros */}
                        <div className="grid grid-cols-5 border-[3px] border-black divide-x-[3px] divide-black mb-10">
                            {[
                                { label: "UNIDADES DVR", value: dvrs.length, sub: "Gravadores ativos" },
                                { label: "TOTAL DE CÂMERAS", value: metricas.camerasAtivas, sub: `${metricas.vago} Espaços Vagos` },
                                { label: "CANAIS COM FALHA", value: falhasTotais, sub: "Manutenção", alert: falhasTotais > 0 },
                                { label: "CANAIS OK", value: metricas.ok, sub: "Em conformidade" },
                                { label: "SAÚDE SISTEMA", value: `${metricas.saude}%`, sub: "Aproveitamento" }
                            ].map((box, i) => (
                                <div key={i} className={`p-4 text-center ${i === 4 || box.alert ? 'bg-black text-white' : 'bg-white text-black'}`}>
                                    <p className="text-[9px] font-black uppercase mb-1">{box.label}</p>
                                    <p className="text-2xl font-black">{box.value}</p>
                                    <p className={`text-[8px] font-bold mt-1 uppercase ${i === 4 || box.alert ? 'text-white/60' : 'text-slate-400'}`}>{box.sub}</p>
                                </div>
                            ))}
                        </div>

                        {/* Tabela Simplificada na Pré-visualização */}
                        <div className="flex-1 space-y-6">
                            <div className="flex items-center gap-3 border-l-8 border-black pl-4 bg-slate-50 py-3">
                                <ShieldAlert className="h-5 w-5 text-black" />
                                <h3 className="text-sm font-black uppercase tracking-tight">Ocorrências Detectadas</h3>
                            </div>

                            <table className="w-full border-collapse">
                                <thead>
                                    <tr className="border-b-2 border-black/10">
                                        <th className="py-3 text-[10px] font-black uppercase text-left">Dispositivo</th>
                                        <th className="py-3 text-[10px] font-black uppercase text-center w-20">Falhas</th>
                                        <th className="py-3 text-[10px] font-black uppercase text-left">Canais com Anormalidade</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {dvrs.filter(dvr => {
                                        const keys = Object.keys(matriz).filter(k => k.startsWith(`${dvr.id}-`))
                                        return keys.some(k => {
                                            const s = normalizeStatus(matriz[k])
                                            return s !== 'OK' && s !== 'VAGO'
                                        })
                                    }).map((dvr) => {
                                        const keys = Object.keys(matriz).filter(k => k.startsWith(`${dvr.id}-`))
                                        const keysDeFalha = keys.filter(k => {
                                            const s = normalizeStatus(matriz[k])
                                            return s !== 'OK' && s !== 'VAGO'
                                        });

                                        const agrupado: Record<string, string[]> = {};
                                        keysDeFalha.forEach(k => {
                                            const status = normalizeStatus(matriz[k]);
                                            const chNum = k.split('-').pop();
                                            const chFormatado = String(chNum).padStart(2, '0');
                                            if (!agrupado[status]) agrupado[status] = [];
                                            agrupado[status].push(chFormatado);
                                        });

                                        const descricoes = Object.keys(agrupado).map(status => {
                                            const canais = agrupado[status].sort((a,b) => parseInt(a) - parseInt(b));
                                            const label = falhasMap[status] || status.toLowerCase();
                                            let canaisStr = "";
                                            if (canais.length === 1) canaisStr = canais[0];
                                            else if (canais.length === 2) canaisStr = `${canais[0]} e ${canais[1]}`;
                                            else canaisStr = canais.slice(0, -1).join(', ') + ' e ' + canais[canais.length - 1];
                                            return `${canaisStr} ${label}`;
                                        });

                                        return (
                                            <tr key={dvr.id}>
                                                <td className="py-3 text-[11px] font-black uppercase">{dvr.nome}</td>
                                                <td className="py-3 text-[11px] text-center font-black text-red-600">{keysDeFalha.length}</td>
                                                <td className="py-3 text-[10px] text-slate-500 font-bold uppercase truncate max-w-md italic leading-loose">
                                                    {descricoes.map((linha, idx) => (
                                                        <span key={idx} className="block">{linha}</span>
                                                    ))}
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* Rodapé Curto na Prévia */}
                        <div className="mt-10 pt-6 border-t border-slate-100 text-center">
                            <p className="text-[9px] font-bold text-slate-300 uppercase tracking-tighter italic">
                                Este é um resumo operacional para auditoria de segurança patrimonial.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Ações do Relatório */}
                <div className="p-6 sm:p-8 bg-slate-800/80 flex flex-col sm:flex-row justify-center gap-4 border-t border-white/5 shrink-0">
                    <Button variant="ghost" onClick={onClose} className="text-white hover:bg-white/10 px-6 font-bold uppercase text-xs">Cancelar</Button>
                    <Button onClick={imprimirRelatorio} className="bg-white text-black hover:bg-slate-200 px-6 h-12 rounded-2xl font-black uppercase text-xs sm:text-sm flex items-center gap-2 shadow-xl transition-all active:scale-95">
                        <Printer className="h-4 w-4 sm:h-5 sm:w-5" /> IMPRIMIR (NOVA JANELA)
                    </Button>
                    <Button onClick={triggerSave} className="bg-blue-600 text-white hover:bg-blue-700 px-6 h-12 rounded-2xl font-black uppercase text-xs sm:text-sm flex items-center gap-2 shadow-xl shadow-blue-600/20 transition-all active:scale-95" disabled={isSaving}>
                        <Save className="h-4 w-4 sm:h-5 sm:w-5" /> {isSaving ? "SALVANDO..." : "CONSOLIDAR E FINALIZAR"}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
