"use client"

import { useState, useEffect } from "react"
import { OpServiceV2 } from "@/services/op-service-v2"
import { 
    Dialog, 
    DialogContent, 
    DialogHeader, 
    DialogTitle, 
    DialogDescription,
    DialogFooter
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { AlertCircle, Clock, ExternalLink, BellRing } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"
import { toast } from "sonner"
import Link from "next/link"

export default function InvitationMonitor() {
    const [expiredInvitations, setExpiredInvitations] = useState<any[]>([])
    const [isOpen, setIsOpen] = useState(false)

    useEffect(() => {
        // Verifica a cada 5 minutos
        const checkExpirations = async () => {
            try {
                const expired = await OpServiceV2.getExpiredInvitations(3)
                if (expired.length > 0) {
                    setExpiredInvitations(expired)
                    // Só abre o popup se houver novidades ou se for a primeira vez
                    setIsOpen(true)
                }
            } catch (error) {
                console.error("Erro ao monitorar convites:", error)
            }
        }

        checkExpirations()
        const interval = setInterval(checkExpirations, 5 * 60 * 1000)
        return () => clearInterval(interval)
    }, [])

    if (expiredInvitations.length === 0) return null

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden rounded-[32px] border-none shadow-2xl bg-white">
                <DialogHeader className="p-8 pb-4 bg-rose-50/50">
                    <DialogTitle className="text-xl font-black text-rose-700 flex items-center gap-3">
                        <div className="p-2 bg-rose-600 rounded-2xl shadow-lg shadow-rose-500/20">
                            <BellRing className="h-6 w-6 text-white" />
                        </div>
                        Atenção: Convites Expirados
                    </DialogTitle>
                    <DialogDescription className="text-rose-600/70 font-bold mt-2">
                        {expiredInvitations.length} profissional(is) ainda não responderam e ultrapassaram o limite de 3 horas.
                    </DialogDescription>
                </DialogHeader>

                <div className="p-6 space-y-4 max-h-[400px] overflow-y-auto">
                    {expiredInvitations.map((inv, idx) => (
                        <div key={idx} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between group hover:border-rose-200 hover:bg-white transition-all">
                            <div className="space-y-1">
                                <p className="font-black text-slate-800 uppercase text-sm tracking-tight">{inv.op_equipe?.nome_completo}</p>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                                    <Clock className="h-3 w-3" /> Evento: {inv.op_eventos?.nome}
                                </p>
                                <p className="text-[10px] font-black text-rose-500 uppercase">
                                    Enviado há {formatDistanceToNow(new Date(inv.data_convite), { locale: ptBR, addSuffix: false })}
                                </p>
                            </div>
                            <Link href="/operacional/eventos" onClick={() => setIsOpen(false)}>
                                <Button size="sm" variant="ghost" className="rounded-xl text-blue-600 hover:bg-blue-50 font-black text-[10px] uppercase tracking-widest">
                                    Resolver <ExternalLink className="h-3 w-3 ml-2" />
                                </Button>
                            </Link>
                        </div>
                    ))}
                </div>

                <DialogFooter className="p-8 pt-4 border-t border-slate-100 shrink-0">
                    <Button onClick={() => setIsOpen(false)} variant="outline" className="w-full h-12 rounded-xl font-black uppercase text-xs tracking-widest border-slate-200">
                        Entendi, verificarei mais tarde
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
