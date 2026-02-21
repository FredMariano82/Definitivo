interface ResumoUploadProps {
  total: number
  jaLiberados: number
  emProcesso: number
  novos: number
}

export default function ResumoUpload({ total, jaLiberados, emProcesso, novos }: ResumoUploadProps) {
  return (
    <div className="mt-6 pt-4 border-t border-slate-200">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total */}
        <div className="bg-white rounded-lg p-4 border border-slate-200 text-center">
          <div className="text-3xl font-bold text-slate-700 mb-1">{total}</div>
          <div className="text-sm text-slate-600">Total</div>
        </div>

        {/* Já Liberados */}
        <div className="bg-white rounded-lg p-4 border border-green-200 text-center">
          <div className="text-3xl font-bold text-green-600 mb-1">{jaLiberados}</div>
          <div className="text-sm text-green-700">Já Liberados</div>
        </div>

        {/* Em Processo */}
        <div className="bg-white rounded-lg p-4 border border-orange-200 text-center">
          <div className="text-3xl font-bold text-orange-600 mb-1">{emProcesso}</div>
          <div className="text-sm text-orange-700">Em Processo</div>
        </div>

        {/* Novos */}
        <div className="bg-white rounded-lg p-4 border border-blue-200 text-center">
          <div className="text-3xl font-bold text-blue-600 mb-1">{novos}</div>
          <div className="text-sm text-blue-700">Novos</div>
        </div>
      </div>
    </div>
  )
}
