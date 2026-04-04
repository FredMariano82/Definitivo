import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkSchema() {
  const { data, error } = await supabase.rpc('get_table_info', { table_name: 'usuarios' }) // If RPC exists, or just query one row
  if (error) {
    // If RPC fails, try selecting one row to see columns
    const { data: row, error: rowError } = await supabase.from('usuarios').select('*').limit(1)
    if (rowError) {
      console.error('Erro:', rowError.message)
      return
    }
    console.log('Colunas:', Object.keys(row[0] || {}))
  } else {
    console.log('Tabela info:', data)
  }
}

checkSchema()
