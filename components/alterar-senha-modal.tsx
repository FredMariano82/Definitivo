"use client"

import type React from "react"

import { useState } from "react"
import { Eye, EyeOff, Lock, Check, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AuthService } from "../services/auth-service"
import { useAuth } from "../contexts/auth-context"

interface AlterarSenhaModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function AlterarSenhaModal({ isOpen, onClose }: AlterarSenhaModalProps) {
  const { usuario } = useAuth()
  const [senhaAtual, setSenhaAtual] = useState("")
  const [novaSenha, setNovaSenha] = useState("")
  const [confirmarSenha, setConfirmarSenha] = useState("")
  const [mostrarSenhaAtual, setMostrarSenhaAtual] = useState(false)
  const [mostrarNovaSenha, setMostrarNovaSenha] = useState(false)
  const [mostrarConfirmarSenha, setMostrarConfirmarSenha] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [erro, setErro] = useState("")
  const [sucesso, setSucesso] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!usuario) return

    // Validações
    if (novaSenha !== confirmarSenha) {
      setErro("Nova senha e confirmação não coincidem")
      return
    }

    if (novaSenha.length < 6) {
      setErro("Nova senha deve ter pelo menos 6 caracteres")
      return
    }

    if (senhaAtual === novaSenha) {
      setErro("Nova senha deve ser diferente da senha atual")
      return
    }

    setIsLoading(true)
    setErro("")

    try {
      const resultado = await AuthService.alterarSenha(usuario.id, senhaAtual, novaSenha)

      if (resultado.sucesso) {
        setSucesso(true)
        setTimeout(() => {
          onClose()
          setSucesso(false)
          setSenhaAtual("")
          setNovaSenha("")
          setConfirmarSenha("")
        }, 2000)
      } else {
        setErro(resultado.erro)
      }
    } catch (error) {
      setErro("Erro interno do servidor")
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    if (!isLoading) {
      onClose()
      setErro("")
      setSucesso(false)
      setSenhaAtual("")
      setNovaSenha("")
      setConfirmarSenha("")
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Alterar Senha
          </DialogTitle>
        </DialogHeader>

        {sucesso ? (
          <div className="text-center py-6">
            <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <Check className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-green-800 mb-2">Senha Alterada!</h3>
            <p className="text-sm text-green-600">Sua senha foi alterada com sucesso.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="senhaAtual" className="text-sm font-medium">
                Senha Atual
              </Label>
              <div className="relative">
                <Input
                  id="senhaAtual"
                  type={mostrarSenhaAtual ? "text" : "password"}
                  value={senhaAtual}
                  onChange={(e) => setSenhaAtual(e.target.value)}
                  placeholder="Digite sua senha atual"
                  required
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-10 w-10 hover:bg-transparent"
                  onClick={() => setMostrarSenhaAtual(!mostrarSenhaAtual)}
                >
                  {mostrarSenhaAtual ? (
                    <EyeOff className="h-4 w-4 text-slate-500" />
                  ) : (
                    <Eye className="h-4 w-4 text-slate-500" />
                  )}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="novaSenha" className="text-sm font-medium">
                Nova Senha
              </Label>
              <div className="relative">
                <Input
                  id="novaSenha"
                  type={mostrarNovaSenha ? "text" : "password"}
                  value={novaSenha}
                  onChange={(e) => setNovaSenha(e.target.value)}
                  placeholder="Digite sua nova senha"
                  required
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-10 w-10 hover:bg-transparent"
                  onClick={() => setMostrarNovaSenha(!mostrarNovaSenha)}
                >
                  {mostrarNovaSenha ? (
                    <EyeOff className="h-4 w-4 text-slate-500" />
                  ) : (
                    <Eye className="h-4 w-4 text-slate-500" />
                  )}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmarSenha" className="text-sm font-medium">
                Confirmar Nova Senha
              </Label>
              <div className="relative">
                <Input
                  id="confirmarSenha"
                  type={mostrarConfirmarSenha ? "text" : "password"}
                  value={confirmarSenha}
                  onChange={(e) => setConfirmarSenha(e.target.value)}
                  placeholder="Confirme sua nova senha"
                  required
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-10 w-10 hover:bg-transparent"
                  onClick={() => setMostrarConfirmarSenha(!mostrarConfirmarSenha)}
                >
                  {mostrarConfirmarSenha ? (
                    <EyeOff className="h-4 w-4 text-slate-500" />
                  ) : (
                    <Eye className="h-4 w-4 text-slate-500" />
                  )}
                </Button>
              </div>
            </div>

            {erro && (
              <Alert className="border-red-200 bg-red-50">
                <X className="h-4 w-4" />
                <AlertDescription className="text-red-700 text-sm">{erro}</AlertDescription>
              </Alert>
            )}

            <div className="flex gap-3 pt-4">
              <Button type="button" variant="outline" onClick={handleClose} disabled={isLoading} className="flex-1">
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading} className="flex-1 bg-blue-600 hover:bg-blue-700">
                {isLoading ? "Alterando..." : "Alterar Senha"}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
