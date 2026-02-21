"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { AuthService } from "../services/auth-service"
import type { Usuario } from "../types"

interface AuthContextType {
  usuario: Usuario | null
  isLoading: boolean
  erro: string
  login: (email: string, senha: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType>({
  usuario: null,
  isLoading: true,
  erro: "",
  login: async () => {},
  logout: () => {},
})

export const useAuth = () => useContext(AuthContext)

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [usuario, setUsuario] = useState<Usuario | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [erro, setErro] = useState("")

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const usuarioSalvo = localStorage.getItem("usuario")
        if (usuarioSalvo) {
          const usuarioObj = JSON.parse(usuarioSalvo)
          console.log("🔍 Verificando usuário salvo:", usuarioObj)
          // Verificar se o usuário ainda existe no banco
          const usuarioAtualizado = await AuthService.buscarUsuarioPorId(usuarioObj.id)
          if (usuarioAtualizado) {
            console.log("✅ Usuário ainda válido:", usuarioAtualizado)
            setUsuario(usuarioAtualizado)
          } else {
            console.log("❌ Usuário não existe mais, fazendo logout")
            localStorage.removeItem("usuario")
          }
        }
      } catch (error) {
        console.error("💥 Erro ao verificar autenticação:", error)
        localStorage.removeItem("usuario")
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [])

  const login = async (email: string, senha: string) => {
    try {
      console.log("🔐 Iniciando login para:", email)
      setIsLoading(true)
      setErro("")

      const { usuario: usuarioLogado, erro: erroLogin } = await AuthService.login(email, senha)

      if (usuarioLogado) {
        console.log("✅ Login bem-sucedido:", usuarioLogado)
        setUsuario(usuarioLogado)
        localStorage.setItem("usuario", JSON.stringify(usuarioLogado))
        setErro("")
      } else {
        console.log("❌ Erro no login:", erroLogin)
        setErro(erroLogin)
      }
    } catch (error) {
      console.error("💥 Erro no login:", error)
      setErro("Erro interno do servidor")
    } finally {
      setIsLoading(false)
    }
  }

  const logout = () => {
    console.log("🚪 Fazendo logout")
    setUsuario(null)
    localStorage.removeItem("usuario")
  }

  return <AuthContext.Provider value={{ usuario, isLoading, erro, login, logout }}>{children}</AuthContext.Provider>
}
