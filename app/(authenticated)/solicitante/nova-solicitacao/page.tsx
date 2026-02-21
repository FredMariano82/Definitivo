"use client"

import { useEffect, useState } from "react"
import NovaSolicitacao from "@/components/solicitante/nova-solicitacao"

export default function NovaSolicitacaoPage() {
    const [dadosRenovacao, setDadosRenovacao] = useState<any>(undefined)

    useEffect(() => {
        // Check for renovation data in sessionStorage
        if (typeof window !== "undefined") {
            const storedData = sessionStorage.getItem("renovacao_temp")
            if (storedData) {
                try {
                    const parsedData = JSON.parse(storedData)
                    setDadosRenovacao(parsedData)
                } catch (e) {
                    console.error("Error parsing renovation data", e)
                }
            }
        }
    }, [])

    const handleLimparDados = () => {
        setDadosRenovacao(undefined)
        if (typeof window !== "undefined") {
            sessionStorage.removeItem("renovacao_temp")
        }
    }

    return (
        <NovaSolicitacao
            dadosPrePreenchidos={dadosRenovacao}
            onLimparDadosPrePreenchidos={handleLimparDados}
        />
    )
}
