import { supabase } from "../lib/supabase"

export interface DadosProdutividade {
  usuario: string
  perfil: string
  hora: number
  prestadores: number
}

export interface ProdutividadeUsuario {
  usuario: string
  perfil: string
  dadosPorHora: { hora: number; prestadores: number }[]
  cor: string
}

export interface ProdutividadePerfil {
  perfil: string
  dadosPorHora: { hora: number; prestadores: number }[]
  cor: string
}

export class ProdutividadeService {
  private static coresUsuarios = [
    "#8b5cf6", // roxo
    "#10b981", // verde
    "#f59e0b", // amarelo
    "#3b82f6", // azul
    "#ef4444", // vermelho
    "#f97316", // laranja
    "#06b6d4", // ciano
    "#84cc16", // lima
  ]

  private static coresPerfis = {
    solicitante: "#3b82f6", // azul
    aprovador: "#10b981", // verde
    administrador: "#f59e0b", // amarelo
    gestor: "#8b5cf6", // roxo
    suporte: "#ef4444", // vermelho
  }

  static async buscarProdutividadePorHora(dataInicial?: string, dataFinal?: string): Promise<ProdutividadeUsuario[]> {
    try {
      // Buscar solicitações com prestadores e horários
      let query = supabase
        .from("solicitacoes")
        .select(`
          solicitante, 
          data_solicitacao, 
          hora_solicitacao,
          prestadores!inner(id)
        `)
        .not("solicitante", "is", null)

      if (dataInicial) {
        query = query.gte("data_solicitacao", dataInicial)
      }
      if (dataFinal) {
        query = query.lte("data_solicitacao", dataFinal)
      }

      const { data: solicitacoes, error } = await query

      if (error) {
        console.error("Erro ao buscar produtividade:", error)
        return []
      }

      // Buscar perfis dos usuários
      const { data: usuarios, error: errorUsuarios } = await supabase.from("usuarios").select("nome, perfil")

      if (errorUsuarios) {
        console.error("Erro ao buscar usuários:", errorUsuarios)
        return []
      }

      const perfilPorUsuario = new Map<string, string>()
      usuarios?.forEach((user) => {
        perfilPorUsuario.set(user.nome, user.perfil)
      })

      // Processar dados por usuário e hora (contando prestadores)
      const produtividadePorUsuario = new Map<string, Map<number, number>>()

      solicitacoes?.forEach((solicitacao) => {
        const usuario = solicitacao.solicitante
        const horaCompleta = solicitacao.hora_solicitacao || "00:00"
        const hora = Number.parseInt(horaCompleta.split(":")[0])
        const numPrestadores = solicitacao.prestadores?.length || 0

        if (!produtividadePorUsuario.has(usuario)) {
          produtividadePorUsuario.set(usuario, new Map())
        }

        const horasUsuario = produtividadePorUsuario.get(usuario)!
        horasUsuario.set(hora, (horasUsuario.get(hora) || 0) + numPrestadores)
      })

      // Converter para formato do gráfico
      const resultado: ProdutividadeUsuario[] = []
      let corIndex = 0

      produtividadePorUsuario.forEach((horas, usuario) => {
        const dadosPorHora: { hora: number; prestadores: number }[] = []
        const perfil = perfilPorUsuario.get(usuario) || "solicitante"

        // Preencher todas as horas (0-23) com dados
        for (let h = 0; h < 24; h++) {
          dadosPorHora.push({
            hora: h,
            prestadores: horas.get(h) || 0,
          })
        }

        resultado.push({
          usuario,
          perfil,
          dadosPorHora,
          cor: this.coresUsuarios[corIndex % this.coresUsuarios.length],
        })

        corIndex++
      })

      return resultado.sort((a, b) => a.usuario.localeCompare(b.usuario))
    } catch (error) {
      console.error("Erro no service de produtividade:", error)
      return []
    }
  }

  static async buscarProdutividadePorPerfil(dataInicial?: string, dataFinal?: string): Promise<ProdutividadePerfil[]> {
    try {
      const dadosIndividuais = await this.buscarProdutividadePorHora(dataInicial, dataFinal)

      // Agrupar por perfil
      const produtividadePorPerfil = new Map<string, Map<number, number>>()

      dadosIndividuais.forEach((usuario) => {
        const perfil = usuario.perfil

        if (!produtividadePorPerfil.has(perfil)) {
          produtividadePorPerfil.set(perfil, new Map())
        }

        const horasPerfil = produtividadePorPerfil.get(perfil)!

        usuario.dadosPorHora.forEach(({ hora, prestadores }) => {
          horasPerfil.set(hora, (horasPerfil.get(hora) || 0) + prestadores)
        })
      })

      // Converter para formato do gráfico
      const resultado: ProdutividadePerfil[] = []

      produtividadePorPerfil.forEach((horas, perfil) => {
        const dadosPorHora: { hora: number; prestadores: number }[] = []

        // Preencher todas as horas (0-23) com dados
        for (let h = 0; h < 24; h++) {
          dadosPorHora.push({
            hora: h,
            prestadores: horas.get(h) || 0,
          })
        }

        resultado.push({
          perfil,
          dadosPorHora,
          cor: this.coresPerfis[perfil as keyof typeof this.coresPerfis] || "#6b7280",
        })
      })

      return resultado.sort((a, b) => a.perfil.localeCompare(b.perfil))
    } catch (error) {
      console.error("Erro ao buscar produtividade por perfil:", error)
      return []
    }
  }

  static async buscarEstatisticasProdutividade(dataInicial?: string, dataFinal?: string) {
    try {
      const dados = await this.buscarProdutividadePorHora(dataInicial, dataFinal)

      const totalUsuarios = dados.length
      const totalPrestadores = dados.reduce(
        (acc, usuario) => acc + usuario.dadosPorHora.reduce((sum, hora) => sum + hora.prestadores, 0),
        0,
      )

      const horarioMaisAtivo = this.encontrarHorarioMaisAtivo(dados)
      const usuarioMaisAtivo = this.encontrarUsuarioMaisAtivo(dados)

      return {
        totalUsuarios,
        totalPrestadores,
        horarioMaisAtivo,
        usuarioMaisAtivo,
        mediaPrestadoresPorUsuario: totalUsuarios > 0 ? Math.round(totalPrestadores / totalUsuarios) : 0,
      }
    } catch (error) {
      console.error("Erro ao buscar estatísticas:", error)
      return {
        totalUsuarios: 0,
        totalPrestadores: 0,
        horarioMaisAtivo: { hora: 0, prestadores: 0 },
        usuarioMaisAtivo: { usuario: "", prestadores: 0 },
        mediaPrestadoresPorUsuario: 0,
      }
    }
  }

  private static encontrarHorarioMaisAtivo(dados: ProdutividadeUsuario[]) {
    const prestadoresPorHora = new Map<number, number>()

    dados.forEach((usuario) => {
      usuario.dadosPorHora.forEach(({ hora, prestadores }) => {
        prestadoresPorHora.set(hora, (prestadoresPorHora.get(hora) || 0) + prestadores)
      })
    })

    let horaMaisAtiva = 0
    let maxPrestadores = 0

    prestadoresPorHora.forEach((prestadores, hora) => {
      if (prestadores > maxPrestadores) {
        maxPrestadores = prestadores
        horaMaisAtiva = hora
      }
    })

    return { hora: horaMaisAtiva, prestadores: maxPrestadores }
  }

  private static encontrarUsuarioMaisAtivo(dados: ProdutividadeUsuario[]) {
    let usuarioMaisAtivo = ""
    let maxPrestadores = 0

    dados.forEach((usuario) => {
      const totalPrestadores = usuario.dadosPorHora.reduce((sum, hora) => sum + hora.prestadores, 0)
      if (totalPrestadores > maxPrestadores) {
        maxPrestadores = totalPrestadores
        usuarioMaisAtivo = usuario.usuario
      }
    })

    return { usuario: usuarioMaisAtivo, prestadores: maxPrestadores }
  }
}
