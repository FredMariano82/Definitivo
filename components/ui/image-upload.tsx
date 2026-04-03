"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabase"
import { ImageIcon, XIcon, Loader2Icon, UploadIcon } from "lucide-react"
import { toast } from "sonner"
import Image from "next/image"

interface ImageUploadProps {
  value?: string
  onChange: (url: string) => void
  disabled?: boolean
}

export function ImageUpload({ value, onChange, disabled }: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Por favor, selecione um arquivo de imagem.")
      return
    }

    // Validate size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("A imagem deve ter no máximo 5MB.")
      return
    }

    setIsUploading(true)
    try {
      const fileExt = file.name.split(".").pop()
      const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`
      const filePath = `tasks/${fileName}`

      const { error: uploadError, data } = await supabase.storage
        .from("kanban-attachments")
        .upload(filePath, file)

      if (uploadError) {
        throw uploadError
      }

      // Get Public URL
      const { data: { publicUrl } } = supabase.storage
        .from("kanban-attachments")
        .getPublicUrl(filePath)

      onChange(publicUrl)
      toast.success("Foto enviada com sucesso!")
    } catch (error: any) {
      console.error("Erro no upload:", error)
      toast.error("Erro ao enviar foto: " + error.message)
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  const handleRemove = () => {
    onChange("")
  }

  return (
    <div className="space-y-4 w-full">
      <div className="flex items-center gap-4">
        {value ? (
          <div className="relative w-40 h-40 rounded-lg overflow-hidden border bg-muted">
            <Image
              src={value}
              alt="Preview"
              fill
              className="object-cover"
            />
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="absolute top-1 right-1 h-6 w-6 rounded-full shadow-lg"
              onClick={handleRemove}
              disabled={disabled || isUploading}
            >
              <XIcon className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div 
            onClick={() => !disabled && !isUploading && fileInputRef.current?.click()}
            className={`
              w-full h-32 border-2 border-dashed rounded-lg flex flex-col items-center justify-center gap-2 cursor-pointer transition-all
              ${disabled || isUploading ? 'bg-muted/50 cursor-not-allowed border-muted' : 'bg-muted/30 border-muted-foreground/20 hover:bg-muted/50 hover:border-primary/50'}
            `}
          >
            {isUploading ? (
              <>
                <Loader2Icon className="h-8 w-8 text-primary animate-spin" />
                <span className="text-sm font-medium text-muted-foreground">Enviando...</span>
              </>
            ) : (
              <>
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <UploadIcon className="h-5 w-5 text-primary" />
                </div>
                <div className="text-center">
                  <span className="text-sm font-bold block">Clique para anexar foto</span>
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider">PNG, JPG, WEBP (Max 5MB)</span>
                </div>
              </>
            )}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              ref={fileInputRef}
              onChange={handleUpload}
              disabled={disabled || isUploading}
            />
          </div>
        )}
      </div>
    </div>
  )
}
