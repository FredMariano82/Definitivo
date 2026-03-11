"use client"

import { ChevronLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

interface PageHeaderProps {
    title: string
    subtitle?: string
    backHref?: string
}

export default function PageHeader({ title, subtitle, backHref }: PageHeaderProps) {
    const router = useRouter()

    return (
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <div>
                <div className="flex items-center gap-2 mb-1">
                    {backHref && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="p-0 h-8 w-8 rounded-full hover:bg-slate-200"
                            onClick={() => router.push(backHref)}
                        >
                            <ChevronLeft className="h-5 w-5 text-slate-600" />
                        </Button>
                    )}
                    <h1 className="text-3xl font-bold text-slate-800 tracking-tight">{title}</h1>
                </div>
                {subtitle && <p className="text-slate-500 font-medium ml-1">{subtitle}</p>}
            </div>

            {/* Slot para ações extras se necessário no futuro */}
            <div className="flex items-center gap-3">
                {/* Espaço para botões de ação da página específica */}
            </div>
        </div>
    )
}
