"use client"

import * as React from "react"
import { useState, useEffect, useRef } from "react"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { PrestadoresService } from "@/services/prestadores-service"
import { Loader2, Search, User, Building2 } from "lucide-react"

interface AutocompleteRGProps {
  value: string
  onChange: (value: string) => void
  onSelect: (prestador: { nome: string; doc1: string; empresa: string }) => void
  placeholder?: string
  className?: string
  disabled?: boolean
}

export function AutocompleteRG({
  value,
  onChange,
  onSelect,
  placeholder = "Digite o RG...",
  className = "",
  disabled = false
}: AutocompleteRGProps) {
  const [open, setOpen] = useState(false)
  const [sugestoes, setSugestoes] = useState<Array<{ nome: string; doc1: string; empresa: string }>>([])
  const [carregando, setCarregando] = useState(false)
  const [termoBusca, setTermoBusca] = useState(value)
  
  // Ref para o debounce
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Sincronizar termo de busca com o valor externo
  useEffect(() => {
    setTermoBusca(value)
  }, [value])

  const buscarSugestoes = async (termo: string) => {
    if (!termo || termo.length < 3) {
      setSugestoes([])
      setOpen(false)
      return
    }

    setCarregando(true)
    try {
      const resultados = await PrestadoresService.buscarSugestoesPorRG(termo)
      setSugestoes(resultados)
      setOpen(resultados.length > 0)
    } catch (error) {
      console.error("Erro ao buscar sugestões:", error)
    } finally {
      setCarregando(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const novoValor = e.target.value
    setTermoBusca(novoValor)
    onChange(novoValor)

    // Debounce de 300ms para não sobrecarregar o SUPABASE
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    
    timeoutRef.current = setTimeout(() => {
      buscarSugestoes(novoValor)
    }, 300)
  }

  const handleSelect = (sugestao: { nome: string; doc1: string; empresa: string }) => {
    console.log("🎯 Selecionado via Autocomplete:", sugestao)
    onSelect(sugestao)
    setOpen(false)
  }

  return (
    <div className={`relative w-full ${className}`}>
      <Popover open={open && sugestoes.length > 0} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <div className="relative">
            <Input
              value={termoBusca}
              onChange={handleInputChange}
              placeholder={placeholder}
              disabled={disabled}
              className="pr-10 border-slate-300 focus:border-blue-600 focus:ring-blue-600"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
              {carregando ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
            </div>
          </div>
        </PopoverTrigger>
        
        <PopoverContent 
          className="p-1 w-[var(--radix-popover-trigger-width)] max-h-[300px] overflow-y-auto shadow-xl border-slate-200" 
          align="start"
          onOpenAutoFocus={(e) => e.preventDefault()} // Não tirar o foco do input ao abrir
        >
          <div className="py-1 px-2 mb-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50 rounded">
            Sugestões da Biblioteca
          </div>
          
          {sugestoes.map((s, idx) => (
            <button
              key={`${s.doc1}-${idx}`}
              onClick={() => handleSelect(s)}
              className="w-full text-left p-3 hover:bg-blue-50 rounded-md transition-colors flex flex-col gap-1 border-b border-slate-50 last:border-0"
            >
              <div className="flex items-center gap-2">
                <User className="h-3 w-3 text-blue-600" />
                <span className="font-bold text-slate-800 text-sm">{s.nome}</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-500 ml-5">
                <span className="bg-slate-100 px-1.5 py-0.5 rounded font-mono">RG: {s.doc1}</span>
                {s.empresa && (
                  <div className="flex items-center gap-1 italic">
                    <Building2 className="h-3 w-3" />
                    {s.empresa}
                  </div>
                )}
              </div>
            </button>
          ))}
        </PopoverContent>
      </Popover>
    </div>
  )
}
