import React, { useState, useRef } from 'react'
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { CftvService, DVR } from '@/services/cftv-service'
import { toast } from "sonner"
import { Image as ImageIcon, Upload, X, Loader2, AlertCircle, RefreshCw } from "lucide-react"
import { VisuallyHidden } from '@radix-ui/react-visually-hidden'

interface GabaritoMosaicoModalProps {
  isOpen: boolean
  onClose: () => void
  dvr: DVR | null
  onUploadSuccess: (newUrl: string) => void
}

export function GabaritoMosaicoModal({ isOpen, onClose, dvr, onUploadSuccess }: GabaritoMosaicoModalProps) {
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  if (!dvr) return null

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (file.size > 10 * 1024 * 1024) {
      toast.error('A imagem é muito grande. O limite é 10MB.')
      return
    }

    if (!file.type.startsWith('image/')) {
        toast.error('Por favor, envie um arquivo de imagem (JPG/PNG).')
        return
    }

    setIsUploading(true)
    try {
      const publicUrl = await CftvService.uploadMosaicoOficial(dvr.id, file)
      toast.success('Mosaico Gabarito salvo com sucesso!')
      onUploadSuccess(publicUrl)
    } catch (error: any) {
      toast.error(error.message || 'Falha ao enviar o mosaico.')
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[70vw] w-full min-h-[50vh] p-0 bg-slate-50 border-none rounded-[2rem] overflow-hidden flex flex-col shadow-2xl">
        <VisuallyHidden>
            <DialogTitle>Mosaico Gabarito do {dvr.nome}</DialogTitle>
        </VisuallyHidden>
        {/* Header */}
        <div className="bg-slate-900 border-b border-slate-800 p-6 flex justify-between items-center text-white">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 bg-blue-600 rounded-xl flex items-center justify-center">
              <ImageIcon className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-black uppercase tracking-widest text-white">Gabarito Oficial</h2>
              <p className="text-slate-400 text-xs font-semibold tracking-tighter">Referência de Mosaico: {dvr.nome}</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="text-slate-400 hover:text-white hover:bg-slate-800 rounded-full h-10 w-10">
            <X className="h-6 w-6" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-8 flex-1 flex flex-col justify-center items-center relative">
          {dvr.mosaico_url ? (
            <div className="w-full flex-1 flex flex-col">
              <div className="relative flex-1 bg-black rounded-xl overflow-hidden shadow-2xl border border-slate-200">
                <img 
                  src={dvr.mosaico_url} 
                  alt={`Mosaico Gabarito ${dvr.nome}`} 
                  className="w-full h-[60vh] object-contain"
                />
              </div>
              <div className="mt-4 flex justify-end">
                <Button 
                    variant="outline" 
                    className="border-slate-300 text-slate-600 font-bold uppercase tracking-widest text-xs h-12 px-6 rounded-2xl hover:bg-slate-200"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                >
                    {isUploading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
                    Substituir Imagem Oficial
                </Button>
              </div>
            </div>
          ) : (
            <div className="max-w-md w-full bg-white border-2 border-dashed border-slate-300 rounded-[2rem] p-10 flex flex-col items-center text-center">
                <div className="h-24 w-24 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                    <ImageIcon className="h-10 w-10 text-slate-300" />
                </div>
                <h3 className="text-xl font-black text-slate-800 mb-2">Gabarito Ausente</h3>
                <p className="text-slate-500 text-sm mb-8 leading-relaxed">
                    Não existe uma fotografia oficial cadastrada para o <strong>{dvr.nome}</strong>. Anexe a imagem de referência para servir como gabarito da auditoria. 
                </p>
                <input 
                    type="file" 
                    className="hidden" 
                    ref={fileInputRef} 
                    accept="image/jpeg, image/png, image/webp" 
                    onChange={handleFileChange}
                />
                <Button 
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black tracking-widest text-sm shadow-xl shadow-blue-600/20"
                    disabled={isUploading}
                >
                    {isUploading ? (
                        <><Loader2 className="h-5 w-5 mr-3 animate-spin"/> ENVIANDO PARA O COFRE...</>
                    ) : (
                        <><Upload className="h-5 w-5 mr-3"/> FAZER UPLOAD DO MOSAICO</>
                    )}
                </Button>
                
                <div className="mt-6 flex items-center gap-2 text-rose-500 bg-rose-50 px-4 py-2 rounded-xl text-xs font-bold w-full text-left">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    Essa foto ficará visível para todos os Operadores permanentemente.
                </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
