import dynamic from "next/dynamic"

const ChavesInventory = dynamic(() => import("@/components/admin/chaves-inventory").then(mod => mod.ChavesInventory), {
    ssr: false,
    loading: () => (
        <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
    )
})

export default function ControleChavesPage() {
  return (
    <div className="p-6">
      <ChavesInventory />
    </div>
  )
}
