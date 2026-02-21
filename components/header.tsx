"use client"

import { LogOut, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuth } from "../contexts/auth-context"
import { useState } from "react"
import AlterarSenhaModal from "./alterar-senha-modal"

export default function Header() {
  const { usuario, logout } = useAuth()
  const [showAlterarSenha, setShowAlterarSenha] = useState(false)

  if (!usuario) return null

  return (
    <>
      <header className="sticky top-0 z-50 premium-gradient shadow-xl border-b border-white/10 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Logo e Título */}
            <div className="flex items-center space-x-5 group">
              <div className="relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-400 to-cyan-400 rounded-lg blur opacity-25 group-hover:opacity-50 transition-soft"></div>
                <img src="/images/mvm-solutions-logo.png" alt="MVM Solutions" className="relative h-14 w-auto transition-soft group-hover:scale-105" />
              </div>
              <div>
                <h1 className="text-2xl font-extrabold text-white tracking-tight">Sistema de Solicitações</h1>
                <p className="text-xs font-medium text-blue-300/80 uppercase tracking-widest">MVM Solutions • Gestão de Prestadores</p>
              </div>
            </div>

            {/* Área do Usuário - Premium */}
            <div className="flex items-center space-x-6">
              <div className="hidden md:flex flex-col items-end">
                <span className="text-sm font-semibold text-white">{usuario.nome}</span>
                <span className="text-xs text-blue-300/70">{usuario.departamento}</span>
              </div>

              <div className="flex items-center bg-white/5 p-1 rounded-xl border border-white/10">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAlterarSenha(true)}
                  className="text-white hover:bg-white/10 transition-soft rounded-lg"
                  title="Configurações"
                >
                  <Settings className="h-4 w-4" />
                </Button>

                <div className="w-[1px] h-4 bg-white/10 mx-1"></div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={logout}
                  className="text-red-300 hover:text-red-100 hover:bg-red-500/20 transition-soft rounded-lg"
                  title="Sair"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Modal de Alterar Senha */}
      <AlterarSenhaModal isOpen={showAlterarSenha} onClose={() => setShowAlterarSenha(false)} />
    </>
  )
}
