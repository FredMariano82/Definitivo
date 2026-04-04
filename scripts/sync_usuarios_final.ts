import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'
import bcrypt from 'bcryptjs'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function sincronizarUsuarios() {
    console.log("🚀 Iniciando Reorganização de Usuários (Lote Final)...")

    const configuracao = [
        // SUPERADMIN / LÍDER
        { nome: 'Mariano', email: 'mariano', perfil: 'superadmin', funcao: 'Líder Central de Segurança' },
        
        // MONITORAMENTO (OPERADORES)
        { nome: 'Fernando', email: 'fernando', perfil: 'operador', funcao: 'Op. Monitoramento' },
        { nome: 'Suelen', email: 'suelen', perfil: 'operador', funcao: 'Op. Monitoramento' },
        { nome: 'David', email: 'david', perfil: 'operador', funcao: 'Op. Monitoramento' },
        { nome: 'John', email: 'john', perfil: 'operador', funcao: 'Op. Monitoramento' },
        { nome: 'Diego', email: 'diego', perfil: 'operador', funcao: 'Op. Monitoramento' },
        { nome: 'Marta', email: 'marta', perfil: 'operador', funcao: 'Op. Monitoramento' },
        
        // ADMINISTRAÇÃO
        { nome: 'Tatiana', email: 'tatiana', perfil: 'administrador', funcao: 'Administração' },
        { nome: 'Ruth', email: 'ruth', perfil: 'administrador', funcao: 'Administração' },
        
        // GESTORES
        { nome: 'Rico', email: 'rico', perfil: 'gestor', funcao: 'Gestor' },
        { nome: 'Daniel Cohen', email: 'daniel', perfil: 'gestor', funcao: 'Gestor' }
    ]

    for (const user of configuracao) {
        // Gerar HASH para a senha '123' conforme o AuthService espera
        const salt = bcrypt.genSaltSync(10)
        const hashedSenha = bcrypt.hashSync('123', salt)

        const payload = {
            nome: user.nome,
            email: user.email,
            senha: hashedSenha,
            perfil: user.perfil,
            funcao: user.funcao,
            departamento: 'Segurança' // Todos são da segurança como solicitado
        }

        console.log(`📡 Sincronizando: ${user.nome} (${user.funcao})...`)

        const { error } = await supabase
            .from('usuarios')
            .upsert(payload, { onConflict: 'email' })

        if (error) {
            console.error(`❌ Erro em ${user.nome}:`, error.message)
            if (error.message.includes('funcao')) {
                console.warn("⚠️ AVISO: A coluna 'funcao' parece não existir no banco. Aplique o SQL 'scripts/add_funcao_usuarios.sql' no editor SQL do Supabase primeiro.")
                return
            }
        } else {
            console.log(`✅ ${user.nome} configurado! Login: "${user.email}"`)
        }
    }

    console.log("\n🎊 Organização concluída com sucesso!")
}

sincronizarUsuarios()
