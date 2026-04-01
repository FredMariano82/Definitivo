import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function fillGaps() {
  console.log("Calculando lacunas no inventário...")

  const { data: chaves, error } = await supabase.from('chaves_inventario').select('numero, modelo')
  if (error || !chaves) {
    console.error("Erro ao buscar chaves:", error)
    return
  }

  const fillForModelo = async (modelo: 'amarela' | 'prata') => {
    const nums = chaves
      .filter(c => c.modelo === modelo)
      .map(c => parseInt(c.numero))
      .filter(n => !isNaN(n))
    
    if (nums.length === 0) return
    
    // Encontrar o maior número atual
    const max = Math.max(...nums)
    const existing = new Set(nums)
    const missing = []

    // Preencher lacunas de 1 até o máximo
    for (let i = 1; i <= max; i++) {
        if (!existing.has(i)) {
            missing.push({
                numero: i.toString().padStart(3, '0'),
                modelo: modelo,
                local: 'Espaço Vago',
                status: 'disponivel',
                obs: 'Registro gerado automaticamente para preencher lacuna',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            })
        }
    }

    if (missing.length > 0) {
      console.log(`Inserindo ${missing.length} espaços vagos para chaves ${modelo}...`)
      
      // Inserir em lotes de 50
      const chunkSize = 50
      for (let j = 0; j < missing.length; j += chunkSize) {
          const chunk = missing.slice(j, j + chunkSize)
          const { error: insertError } = await supabase.from('chaves_inventario').insert(chunk)
          if (insertError) {
              console.error(`Erro ao inserir lote ${j} para ${modelo}:`, insertError)
          }
      }
    } else {
        console.log(`Nenhuma lacuna encontrada para chaves ${modelo} até o Nº ${max}.`)
    }
  }

  await fillForModelo('amarela')
  await fillForModelo('prata')
  
  console.log("Processo concluído com sucesso!")
}

fillGaps()
