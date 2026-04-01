import dynamic from "next/dynamic"

const SolicitacoesDepartamento = dynamic(() => import("@/components/solicitante/solicitacoes-departamento"), {
    ssr: false,
    loading: () => (
        <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-600"></div>
        </div>
    )
})

export default function SolicitacoesDepartamentoPage() {
    return <SolicitacoesDepartamento />
}
