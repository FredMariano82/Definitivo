import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'
import bcrypt from 'bcryptjs'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function syncUsuarios() {
    console.log('🧹 Limpando tabela de usuários...')
    const { error: deleteError } = await supabase.from('usuarios').delete().neq('email', 'mariano_nao_deletar_temp') // Deletar quase todos
    // Na verdade, vamos deletar todos mesmo
    await supabase.from('usuarios').delete().not('id', 'is', null)

    const salt = bcrypt.genSaltSync(10)
    const hashedSenha = bcrypt.hashSync('123', salt)

    const configuracao = [
        // LÍDER
        { nome: 'Mariano', email: 'mariano', perfil: 'superadmin', funcao: 'Líder Central de Segurança' },
        
        // COORDENADORES
        { nome: 'Cláudio', email: 'claudio', perfil: 'coordenador', funcao: 'Coordenador' },
        { nome: 'Gilberto', email: 'gilberto', perfil: 'coordenador', funcao: 'Coordenador' },

        // ADMINISTRAÇÃO
        { nome: 'Tatiana', email: 'tatiana', perfil: 'administrador', funcao: 'Administração' },
        { nome: 'Ruth', email: 'ruth', perfil: 'administrador', funcao: 'Administração' },

        // MONITORAMENTO
        { nome: 'Suelen', email: 'suelen', perfil: 'operador', funcao: 'Op. Monitoramento' },
        { nome: 'David', email: 'david', perfil: 'operador', funcao: 'Op. Monitoramento' },
        { nome: 'Fernando', icon: 'fernando', email: 'fernando', perfil: 'operador', funcao: 'Op. Monitoramento' },
        { nome: 'John', email: 'john', perfil: 'operador', funcao: 'Op. Monitoramento' },

        // GESTORES
        { nome: 'Rico', email: 'rico', perfil: 'gestor', funcao: 'Gestor' },
        { nome: 'Daniel', email: 'daniel', perfil: 'gestor', funcao: 'Gestor' },

        // PORTARIA
        { nome: 'Marcio', email: 'marcio', perfil: 'recepcao', funcao: 'Portaria' },
        { nome: 'Joanes', email: 'joanes', perfil: 'recepcao', funcao: 'Portaria' },
        { nome: 'Marta', email: 'marta', perfil: 'recepcao', funcao: 'Portaria' },
        { nome: 'Isabela', email: 'isabela', perfil: 'recepcao', funcao: 'Portaria' },
        { nome: 'Diego', email: 'diego', perfil: 'recepcao', funcao: 'Portaria' },
        { nome: 'Thais', email: 'thais', perfil: 'recepcao', funcao: 'Portaria' },
        { nome: 'Nadja', email: 'nadja', perfil: 'recepcao', funcao: 'Portaria' },
        { nome: 'Jefferson', email: 'jefferson', perfil: 'recepcao', funcao: 'Portaria' },

        // ENCARREGADOS
        { nome: 'Guimaraes', email: 'guimaraes', perfil: 'encarregado', funcao: 'Encarregado' },
        { nome: 'Lima', email: 'lima', perfil: 'encarregado', funcao: 'Encarregado' },
        { nome: 'Araujo', email: 'araujo', perfil: 'encarregado', funcao: 'Encarregado' },
        { nome: 'Aldo', email: 'aldo', perfil: 'encarregado', funcao: 'Encarregado' },
    ]

    console.log('🚀 Populando novos usuários...')

    for (const user of configuracao) {
        const payload = {
            nome: user.nome,
            email: user.email,
            senha: hashedSenha,
            perfil: user.perfil,
            funcao: user.funcao,
            departamento: 'Segurança'
        }

        const { error } = await supabase.from('usuarios').upsert(payload, { onConflict: 'email' })
        
        if (error) {
            console.error(`❌ Erro ao configurar ${user.nome}:`, error.message)
        } else {
            console.log(`✅ ${user.nome} configurado! (${user.funcao})`)
        }
    }
}

syncUsuarios()
