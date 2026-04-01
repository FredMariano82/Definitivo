import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'
import Papa from 'papaparse'
import dotenv from 'dotenv'

// Carregar variáveis de ambiente
dotenv.config({ path: 'C:/Users/central_seguranca/.gemini/antigravity/scratch/Definitivo/.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

console.log("Supabase URL:", supabaseUrl?.substring(0, 20))
console.log("Service Key:", supabaseServiceKey?.substring(0, 10))

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Erro: Credenciais do Supabase não encontradas no .env.local")
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function importChaves() {
  const filePath = 'C:/Users/central_seguranca/.gemini/antigravity/scratch/ControledeChaves.csv'
  
  if (!fs.existsSync(filePath)) {
    console.error(`Erro: Arquivo não encontrado em ${filePath}`)
    process.exit(1)
  }

  const csvFile = fs.readFileSync(filePath, 'utf8')
  
  console.log("Lendo arquivo CSV...")
  
  const results = Papa.parse(csvFile, {
    header: true,
    skipEmptyLines: true
  })

  if (results.errors.length > 0) {
    console.error("Erros ao processar CSV:", results.errors)
    process.exit(1)
  }

  console.log(`Processando ${results.data.length} registros...`)

  const chavesParaInserir = results.data.map((row: any) => {
    // Mapeamento e normalização
    const statusOriginal = (row['Status'] || '').toLowerCase()
    let statusFinal: 'disponivel' | 'emprestada' | 'manutencao' | 'extraviada' = 'disponivel'
    
    if (statusOriginal.includes('dispon')) statusFinal = 'disponivel'
    else if (statusOriginal.includes('emprest')) statusFinal = 'emprestada'
    else if (statusOriginal.includes('manuten')) statusFinal = 'manutencao'
    else if (statusOriginal.includes('extra')) statusFinal = 'extraviada'

    return {
      numero: row['Número'] || row['Numero'],
      modelo: (row['Modelo'] || 'prata').toLowerCase(),
      local: row['Local'] || 'Desconhecido',
      status: statusFinal,
      obs: row['OBS'] || '',
      responsavel_nome: row['Responsável'] || null,
      responsavel_setor: row['Setor'] || null,
      operador_nome: row['Operador'] || null,
      data_emprestimo: row['Data Empréstimo'] ? new Date(row['Data Empréstimo']).toISOString() : null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  })

  console.log("Limpando tabela atual (opcional)...")
  // Opcional: Se quiser limpar antes de importar
  // await supabase.from('chaves_inventario').delete().neq('id', '00000000-0000-0000-0000-000000000000')

  console.log("Inserindo dados no Supabase...")
  
  // Inserir em lotes de 50 para evitar limites
  const chunkSize = 50
  for (let i = 0; i < chavesParaInserir.length; i += chunkSize) {
    const chunk = chavesParaInserir.slice(i, i + chunkSize)
    const { error } = await supabase
      .from('chaves_inventario')
      .upsert(chunk, { onConflict: 'numero' }) // Upsert pelo número para evitar duplicados

    if (error) {
      console.error(`Erro ao inserir lote ${i / chunkSize}:`, error)
    } else {
      console.log(`Lote ${i / chunkSize} inserido com sucesso.`)
    }
  }

  console.log("Importação concluída!")
}

importChaves()
