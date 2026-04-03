import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

const NOMES = ['Tatiana', 'Ruth', 'Mariano', 'David', 'Fernando', 'Suelen', 'John']

async function cadastrarUsuarios() {
  console.log("Adicionando John e garantindo os demais logins...")
  
  for (const nome of NOMES) {
    const loginFinal = nome.toLowerCase()

    const payload = {
        nome: nome,
        email: loginFinal,
        senha: '123',
        perfil: 'administrador',
        departamento: 'Segurança'
    }

    const { error } = await supabase
        .from('usuarios')
        .upsert(payload, { onConflict: 'email' })

    if (error) {
        console.error(`❌ Erro ao cadastrar ${nome}:`, error.message)
    } else {
        console.log(`✅ ${nome} pronto! Login: "${loginFinal}"`)
    }
  }

  console.log("\nCadastro concluído. Todos os administradores (incluindo John) estão ativos.")
}

cadastrarUsuarios()
