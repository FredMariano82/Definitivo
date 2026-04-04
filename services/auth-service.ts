import { supabase } from "@/lib/supabase"
import type { Usuario } from "@/types"
import bcrypt from "bcryptjs"

export class AuthService {
  // Login com email e senha
  static async login(email: string, senha: string): Promise<{ usuario: Usuario | null; sucesso: boolean; erro: string }> {
    try {
      console.log("🔐 Tentando login para:", email)

      // Buscar usuário no banco
      const { data: usuario, error: userError } = await supabase
        .from("usuarios")
        .select("*")
        .ilike("email", email) // Case insensitive
        .single()

      if (userError || !usuario) {
        console.log("❌ Usuário não encontrado:", userError)
        return { usuario: null, sucesso: false, erro: "Email não encontrado" }
      }

      // Verificar se o usuário está ativo
      if (usuario.ativo === false) {
        console.log("❌ Usuário bloqueado:", email)
        return { usuario: null, sucesso: false, erro: "Acesso bloqueado. Contate o administrador." }
      }

      // Verificar senha com o banco de dados usando HASH (Bcrypt)
      const senhaCorreta = bcrypt.compareSync(senha, usuario.senha)

      if (!senhaCorreta) {
        console.log("❌ Senha incorreta")
        return { usuario: null, sucesso: false, erro: "Senha incorreta" }
      }

      console.log("✅ Login realizado com sucesso:", usuario.nome)

      return {
        usuario: {
          id: usuario.id,
          nome: usuario.nome,
          email: usuario.email,
          departamento: usuario.departamento,
          departamento_id: usuario.departamento_id,
          funcao: usuario.funcao,
          perfil: usuario.perfil as "solicitante" | "aprovador" | "administrador" | "gestor" | "recepcao" | "suporte" | "superadmin" | "operador",
        },
        sucesso: true,
        erro: "",
      }
    } catch (error) {
      console.error("💥 Erro no login:", error)
      return { usuario: null, sucesso: false, erro: "Erro interno do servidor" }
    }
  }

  // Alterar senha do usuário logado
  static async alterarSenha(
    userId: string,
    senhaAtual: string,
    novaSenha: string,
  ): Promise<{ sucesso: boolean; erro: string }> {
    try {
      console.log("🔐 Alterando senha para usuário:", userId)

      // Buscar usuário atual
      const { data: usuario, error: userError } = await supabase.from("usuarios").select("*").eq("id", userId).single()

      if (userError || !usuario) {
        return { sucesso: false, erro: "Usuário não encontrado" }
      }

      // Verificar senha atual
      const senhaCorreta = bcrypt.compareSync(senhaAtual, usuario.senha)
      if (!senhaCorreta) {
        return { sucesso: false, erro: "Senha atual incorreta" }
      }

      // Gerar HASH para a nova senha
      const salt = bcrypt.genSaltSync(10)
      const hashedSenha = bcrypt.hashSync(novaSenha, salt)

      // Atualizar senha no banco
      const { error: updateError } = await supabase.from("usuarios").update({ senha: hashedSenha }).eq("id", userId)

      if (updateError) {
        console.error("Erro ao atualizar senha:", updateError)
        return { sucesso: false, erro: "Erro ao atualizar senha" }
      }

      console.log("✅ Senha alterada com sucesso")
      return { sucesso: true, erro: "" }
    } catch (error) {
      console.error("💥 Erro ao alterar senha:", error)
      return { sucesso: false, erro: "Erro interno do servidor" }
    }
  }

  // Buscar usuário por ID
  static async buscarUsuarioPorId(id: string): Promise<Usuario | null> {
    try {
      const { data: usuario, error } = await supabase.from("usuarios").select("*").eq("id", id).single()

      if (error || !usuario) {
        return null
      }

      return {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        departamento: usuario.departamento,
        departamento_id: usuario.departamento_id,
        funcao: usuario.funcao,
        perfil: usuario.perfil as "solicitante" | "aprovador" | "administrador" | "gestor" | "recepcao" | "suporte" | "superadmin" | "operador" | "coordenador" | "encarregado",
      }
    } catch (error) {
      console.error("Erro ao buscar usuário:", error)
      return null
    }
  }

  // Criar usuário (para admin)
  static async criarUsuario(dadosUsuario: {
    nome: string
    email: string
    departamento: string
    departamento_id?: number
    perfil: "solicitante" | "aprovador" | "administrador" | "gestor" | "recepcao" | "suporte" | "superadmin" | "operador"
    senha?: string
  }): Promise<{ sucesso: boolean; erro: string; usuario?: Usuario }> {
    try {
      // Usar a senha fornecida ou uma padrão se não houver (ex: 'Mudar@123')
      const senhaFinal = dadosUsuario.senha || "Mudar@123"
      const salt = bcrypt.genSaltSync(10)
      const hashedSenha = bcrypt.hashSync(senhaFinal, salt)

      const { senha, ...restoDados } = dadosUsuario as any
      const payload = {
        ...restoDados,
        senha: hashedSenha
      }

      const { data: usuario, error } = await supabase.from("usuarios").insert([payload]).select().single()

      if (error) {
        console.error("Erro ao criar usuário:", error)
        return { sucesso: false, erro: "Erro ao criar usuário" }
      }

      return {
        sucesso: true,
        erro: "",
        usuario: {
          id: usuario.id,
          nome: usuario.nome,
          email: usuario.email,
          departamento: usuario.departamento,
          departamento_id: usuario.departamento_id,
          perfil: usuario.perfil as "solicitante" | "aprovador" | "administrador" | "gestor" | "recepcao" | "suporte" | "superadmin" | "operador",
        },
      }
    } catch (error) {
      console.error("Erro ao criar usuário:", error)
      return { sucesso: false, erro: "Erro interno do servidor" }
    }
  }

  // Listar todos os usuários (para admin)
  static async listarUsuarios(): Promise<Usuario[]> {
    try {
      const { data: usuarios, error } = await supabase.from("usuarios").select("*").order("nome")

      if (error) {
        console.error("Erro ao listar usuários:", error)
        return []
      }

      return usuarios.map((u) => ({
        id: u.id,
        nome: u.nome,
        email: u.email,
        departamento: u.departamento,
        funcao: u.funcao,
        perfil: u.perfil as "solicitante" | "aprovador" | "administrador" | "gestor" | "recepcao" | "suporte" | "superadmin" | "operador",
      }))
    } catch (error) {
      console.error("Erro ao listar usuários:", error)
      return []
    }
  }

  // Resetar senha de um usuário (para admin)
  static async resetarSenha(userId: string, novaSenha: string): Promise<{ sucesso: boolean; erro: string }> {
    try {
      console.log("🔐 Resetando senha para usuário:", userId)

      // Gerar HASH para a nova senha
      const salt = bcrypt.genSaltSync(10)
      const hashedSenha = bcrypt.hashSync(novaSenha, salt)

      const { error } = await supabase.from("usuarios").update({ senha: hashedSenha }).eq("id", userId)

      if (error) {
        console.error("Erro ao resetar senha:", error)
        return { sucesso: false, erro: "Erro ao atualizar senha no banco" }
      }

      return { sucesso: true, erro: "" }
    } catch (error) {
      console.error("💥 Erro ao resetar senha:", error)
      return { sucesso: false, erro: "Erro interno do servidor" }
    }
  }

  // Atualizar dados de um usuário (para admin)
  static async atualizarUsuario(userId: string, dados: { 
    nome?: string; 
    email?: string; 
    departamento?: string; 
    perfil?: string 
  }): Promise<{ sucesso: boolean; erro: string }> {
    try {
      const { error } = await supabase.from("usuarios").update(dados).eq("id", userId)
      if (error) throw error
      return { sucesso: true, erro: "" }
    } catch (error) {
      console.error("Erro ao atualizar usuário:", error)
      return { sucesso: false, erro: "Erro ao atualizar usuário" }
    }
  }

  // Alternar status de ativação (bloquear/desbloquear)
  static async alternarStatusUsuario(userId: string, ativo: boolean): Promise<{ sucesso: boolean; erro: string }> {
    try {
      console.log(`🔐 Alterando status do usuário ${userId} para: ${ativo ? 'ATIVO' : 'BLOQUEADO'}`)
      const { error } = await supabase.from("usuarios").update({ ativo }).eq("id", userId)
      if (error) throw error
      return { sucesso: true, erro: "" }
    } catch (error) {
      console.error("Erro ao alternar status do usuário:", error)
      return { sucesso: false, erro: "Erro ao alterar status" }
    }
  }
}
