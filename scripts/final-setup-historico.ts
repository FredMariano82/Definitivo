import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import fs from 'fs'
import path from 'path'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function setup() {
  const sqlPath = path.join(process.cwd(), 'scripts', 'setup_historico_chaves.sql')
  const sql = fs.readFileSync(sqlPath, 'utf8')

  console.log("Executando SQL para criar tabela de histórico...")
  
  // No Supabase, via REST API não dá pra rodar SQL arbitrário facilmente sem uma RPC específica.
  // Vou usar uma abordagem de inserção de teste para ver se a tabela já existe ou forçar a criação.
  // Na verdade, a melhor forma é o usuário rodar no SQL Editor, mas vou tentar via RPC se disponível.
  
  const { error } = await supabase.rpc('exec_sql', { sql_query: sql })
  
  if (error) {
    if (error.message.includes("function exec_sql") || error.message.includes("could not find")) {
        console.error("ERRO: A função RPC 'exec_sql' não existe no banco. Por favor, copie e cole o conteúdo de scripts/setup_historico_chaves.sql no SQL Editor do Supabase.")
    } else {
        console.error("Erro ao executar SQL:", error)
    }
  } else {
    console.log("Tabela de histórico criada com sucesso!")
  }
}

setup()
