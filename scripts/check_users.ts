import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkUsers() {
  const { data, error } = await supabase.from('usuarios').select('nome, email, perfil, departamento, funcao')
  if (error) {
    console.error('Erro:', error.message)
    return
  }
  console.log('--- LISTAGEM DE USUÁRIOS COMPLETA ---')
  data.forEach(u => {
      console.log(`[${u.email}] Nome: ${u.nome} | Fun: ${u.funcao} | Dept: ${u.departamento}`)
  })
}

checkUsers()
