"use client"

import type React from "react"
import { useState } from "react"
import { Eye, EyeOff, Lock, Check, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useAuth } from "../contexts/auth-context"
import { AuthService } from "../services/auth-service"

export default function LoginForm() {
  const [email, setEmail] = useState("")
  const [senha, setSenha] = useState("")
  const [mostrarSenha, setMostrarSenha] = useState(false)
  const [mostrarModalTrocarSenha, setMostrarModalTrocarSenha] = useState(false)

  // Estados do modal de trocar senha
  const [emailTroca, setEmailTroca] = useState("")
  const [senhaAtual, setSenhaAtual] = useState("")
  const [novaSenha, setNovaSenha] = useState("")
  const [confirmarSenha, setConfirmarSenha] = useState("")
  const [mostrarSenhaAtual, setMostrarSenhaAtual] = useState(false)
  const [mostrarNovaSenha, setMostrarNovaSenha] = useState(false)
  const [mostrarConfirmarSenha, setMostrarConfirmarSenha] = useState(false)
  const [isLoadingTroca, setIsLoadingTroca] = useState(false)
  const [erroTroca, setErroTroca] = useState("")
  const [sucessoTroca, setSucessoTroca] = useState(false)

  const { login, isLoading, erro } = useAuth()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    await login(email, senha)
  }

  const handleTrocarSenha = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validações
    if (novaSenha !== confirmarSenha) {
      setErroTroca("Nova senha e confirmação não coincidem")
      return
    }

    if (novaSenha.length < 6) {
      setErroTroca("Nova senha deve ter pelo menos 6 caracteres")
      return
    }

    if (senhaAtual === novaSenha) {
      setErroTroca("Nova senha deve ser diferente da senha atual")
      return
    }

    setIsLoadingTroca(true)
    setErroTroca("")

    try {
      // Primeiro fazer login para validar email e senha atual
      const loginResult = await AuthService.login(emailTroca, senhaAtual)

      if (loginResult.sucesso && loginResult.usuario) {
        // Se login ok, alterar a senha
        const resultado = await AuthService.alterarSenha(loginResult.usuario.id, senhaAtual, novaSenha)

        if (resultado.sucesso) {
          setSucessoTroca(true)
          setTimeout(() => {
            setMostrarModalTrocarSenha(false)
            setSucessoTroca(false)
            setEmailTroca("")
            setSenhaAtual("")
            setNovaSenha("")
            setConfirmarSenha("")
            setErroTroca("")
          }, 2000)
        } else {
          setErroTroca(resultado.erro)
        }
      } else {
        setErroTroca("Email ou senha atual incorretos")
      }
    } catch (error: any) {
      setErroTroca("Erro interno do servidor")
    } finally {
      setIsLoadingTroca(false)
    }
  }

  const handleCloseModal = () => {
    if (!isLoadingTroca) {
      setMostrarModalTrocarSenha(false)
      setErroTroca("")
      setSucessoTroca(false)
      setEmailTroca("")
      setSenhaAtual("")
      setNovaSenha("")
      setConfirmarSenha("")
    }
  }

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-slate-800 via-slate-900 to-blue-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-2xl border-0 bg-white/95 backdrop-blur-sm">
          <CardHeader className="space-y-6 pb-6">
            <div className="text-center">
              <div className="flex justify-center mb-6">
                <img src="/images/mvm-solutions-logo.png" alt="MVM Solutions" className="h-24 w-auto" />
              </div>
              <div className="w-24 h-1 bg-gradient-to-r from-blue-400 to-cyan-400 mx-auto rounded-full"></div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-slate-700">
                  Usuário
                </Label>
                <Input
                  id="email"
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Digite seu usuário"
                  required
                  className="h-12 border-2 border-slate-200 focus:border-blue-500 focus:ring-blue-500 rounded-lg"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="senha" className="text-sm font-medium text-slate-700">
                  Senha
                </Label>
                <div className="relative">
                  <Input
                    id="senha"
                    type={mostrarSenha ? "text" : "password"}
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    placeholder="Digite sua senha"
                    required
                    className="h-12 border-2 border-slate-200 focus:border-blue-500 focus:ring-blue-500 rounded-lg pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-11 w-10 hover:bg-transparent"
                    onClick={() => setMostrarSenha(!mostrarSenha)}
                  >
                    {mostrarSenha ? (
                      <EyeOff className="h-4 w-4 text-slate-500" />
                    ) : (
                      <Eye className="h-4 w-4 text-slate-500" />
                    )}
                  </Button>
                </div>
              </div>

              {erro && (
                <Alert className="border-red-200 bg-red-50">
                  <AlertDescription className="text-red-700 text-sm">{erro}</AlertDescription>
                </Alert>
              )}

              <Button
                type="submit"
                className="w-full h-12 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-medium rounded-lg shadow-lg"
                disabled={isLoading}
              >
                {isLoading ? "Entrando..." : "Entrar"}
              </Button>

              <div className="text-center">
                <button
                  type="button"
                  className="text-sm text-blue-600 hover:text-blue-800 hover:underline transition-colors"
                  onClick={() => setMostrarModalTrocarSenha(true)}
                >
                  Trocar minha senha
                </button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Modal de Trocar Senha */}
      <Dialog open={mostrarModalTrocarSenha} onOpenChange={handleCloseModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Trocar Senha
            </DialogTitle>
          </DialogHeader>

          {sucessoTroca ? (
            <div className="text-center py-6">
              <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <Check className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-green-800 mb-2">Senha Alterada!</h3>
              <p className="text-sm text-green-600">Sua senha foi alterada com sucesso.</p>
            </div>
          ) : (
            <form onSubmit={handleTrocarSenha} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="emailTroca" className="text-sm font-medium">
                  Usuário
                </Label>
                <Input
                  id="emailTroca"
                  type="text"
                  value={emailTroca}
                  onChange={(e) => setEmailTroca(e.target.value)}
                  placeholder="Digite seu usuário"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="senhaAtualTroca" className="text-sm font-medium">
                  Senha Atual
                </Label>
                <div className="relative">
                  <Input
                    id="senhaAtualTroca"
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
                <Label htmlFor="novaSenhaTroca" className="text-sm font-medium">
                  Nova Senha
                </Label>
                <div className="relative">
                  <Input
                    id="novaSenhaTroca"
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
                <Label htmlFor="confirmarSenhaTroca" className="text-sm font-medium">
                  Confirmar Nova Senha
                </Label>
                <div className="relative">
                  <Input
                    id="confirmarSenhaTroca"
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

              {erroTroca && (
                <Alert className="border-red-200 bg-red-50">
                  <X className="h-4 w-4" />
                  <AlertDescription className="text-red-700 text-sm">{erroTroca}</AlertDescription>
                </Alert>
              )}

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCloseModal}
                  disabled={isLoadingTroca}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={isLoadingTroca} className="flex-1 bg-blue-600 hover:bg-blue-700">
                  {isLoadingTroca ? "Trocando..." : "Trocar Senha"}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
