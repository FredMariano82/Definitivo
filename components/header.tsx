"use client"

import { LogOut, Settings, Sun, Moon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuth } from "../contexts/auth-context"
import { useTheme } from "@/contexts/theme-context"
import { useState } from "react"
import AlterarSenhaModal from "./alterar-senha-modal"

interface HeaderProps {
  isCollapsed?: boolean;
  onToggle?: () => void;
}

export default function Header({ isCollapsed, onToggle }: HeaderProps) {
  const { isDarkMode, toggleTheme } = useTheme()
  const { usuario, logout } = useAuth()
  const [showAlterarSenha, setShowAlterarSenha] = useState(false)

  if (!usuario) return null

  return (
    <>
      <header className="sticky top-0 z-50 premium-gradient shadow-xl border-b border-white/10 backdrop-blur-sm h-[88px] flex items-center">
        <div className="w-full px-6">
          <div className="flex items-center justify-between">
            {/* Logo e Info do Sistema - OCULTADO PARA APRESENTAÇÃO */}
            <div className="flex items-center space-x-5 group">
              <div className="hidden sm:block">
                <h1 className="text-xl font-bold text-white tracking-tight leading-none uppercase">Sistema de Gestão</h1>
                <p className="text-[10px] font-medium text-blue-300/60 uppercase tracking-widest mt-1">Controle de Acessos</p>
              </div>
            </div>

            {/* Ações Rápidas */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center bg-white/5 p-1 rounded-xl border border-white/10">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleTheme}
                  className="text-white hover:bg-white/10 transition-soft rounded-lg h-9 w-9 p-0 flex items-center justify-center"
                  title={isDarkMode ? "Mudar para Modo Claro" : "Mudar para Modo Escuro"}
                >
                  {isDarkMode ? (
                    <Sun className="h-4 w-4 text-amber-400 fill-amber-400" />
                  ) : (
                    <Moon className="h-4 w-4 text-slate-300" />
                  )}
                </Button>

                <div className="w-[1px] h-4 bg-white/10 mx-1"></div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAlterarSenha(true)}
                  className="text-white hover:bg-white/10 transition-soft rounded-lg h-9 w-9 p-0"
                  title="Configurações"
                >
                  <Settings className="h-4 w-4" />
                </Button>

                <div className="w-[1px] h-4 bg-white/10 mx-1"></div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={logout}
                  className="text-red-300 hover:text-red-100 hover:bg-red-500/20 transition-soft rounded-lg h-9 w-9 p-0"
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
