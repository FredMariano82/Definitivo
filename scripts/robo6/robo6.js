const path = require('path')
require('dotenv').config({ path: path.resolve(__dirname, '../../.env.local') })
const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const XLSX = require('xlsx')

// Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

// ID Control
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0"
const ID_CONTROL_URL = "https://192.168.100.20:30443"
let ID_CONTROL_TOKEN = ""

async function loginIDControl() {
  console.log("🔐 Fazendo login no ID Control...")
  const res = await fetch(`${ID_CONTROL_URL}/api/login/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: "mariano", password: "123456789" })
  })
  if (!res.ok) throw new Error("Falha no login ID Control")
  const data = await res.json()
  ID_CONTROL_TOKEN = (data.accessToken || data.token).trim()
  console.log("✅ Token ID Control obtido!")
}

async function buscarIDControlPorNome(nome) {
  const encName = encodeURIComponent(nome)
  const searchUrl = `${ID_CONTROL_URL}/api/user/list?idType=0&deleted=false&draw=9&columns%5B0%5D%5Bdata%5D=&columns%5B0%5D%5Bname%5D=&columns%5B0%5D%5Bsearchable%5D=true&columns%5B0%5D%5Borderable%5D=false&columns%5B0%5D%5Bsearch%5D%5Bvalue%5D=&columns%5B0%5D%5Bsearch%5D%5Bregex%5D=false&columns%5B1%5D%5Bdata%5D=idDevice&columns%5B1%5D%5Bname%5D=&columns%5B1%5D%5Bsearchable%5D=true&columns%5B1%5D%5Borderable%5D=true&columns%5B1%5D%5Bsearch%5D%5Bvalue%5D=&columns%5B1%5D%5Bsearch%5D%5Bregex%5D=false&columns%5B2%5D%5Bdata%5D=name&columns%5B2%5D%5Bname%5D=&columns%5B2%5D%5Bsearchable%5D=true&columns%5B2%5D%5Borderable%5D=true&columns%5B2%5D%5Bsearch%5D%5Bvalue%5D=&columns%5B2%5D%5Bsearch%5D%5Bregex%5D=false&columns%5B3%5D%5Bdata%5D=registration&columns%5B3%5D%5Bname%5D=&columns%5B3%5D%5Bsearchable%5D=true&columns%5B3%5D%5Borderable%5D=true&columns%5B3%5D%5Bsearch%5D%5Bvalue%5D=&columns%5B3%5D%5Bsearch%5D%5Bregex%5D=false&columns%5B4%5D%5Bdata%5D=rg&columns%5B4%5D%5Bname%5D=&columns%5B4%5D%5Bsearchable%5D=true&columns%5B4%5D%5Borderable%5D=true&columns%5B4%5D%5Bsearch%5D%5Bvalue%5D=&columns%5B4%5D%5Bsearch%5D%5Bregex%5D=false&columns%5B5%5D%5Bdata%5D=cpf&columns%5B5%5D%5Bname%5D=&columns%5B5%5D%5Bsearchable%5D=true&columns%5B5%5D%5Borderable%5D=true&columns%5B5%5D%5Bsearch%5D%5Bvalue%5D=&columns%5B5%5D%5Bsearch%5D%5Bregex%5D=false&columns%5B6%5D%5Bdata%5D=phone&columns%5B6%5D%5Bname%5D=&columns%5B6%5D%5Bsearchable%5D=true&columns%5B6%5D%5Borderable%5D=true&columns%5B6%5D%5Bsearch%5D%5Bvalue%5D=&columns%5B6%5D%5Bsearch%5D%5Bregex%5D=false&columns%5B7%5D%5Bdata%5D=cargo&columns%5B7%5D%5Bname%5D=&columns%5B7%5D%5Bsearchable%5D=true&columns%5B7%5D%5Borderable%5D=true&columns%5B7%5D%5Bsearch%5D%5Bvalue%5D=&columns%5B7%5D%5Bsearch%5D%5Bregex%5D=false&columns%5B8%5D%5Bdata%5D=inativo&columns%5B8%5D%5Bname%5D=&columns%5B8%5D%5Bsearchable%5D=true&columns%5B8%5D%5Borderable%5D=true&columns%5B8%5D%5Bsearch%5D%5Bvalue%5D=&columns%5B8%5D%5Bsearch%5D%5Bregex%5D=false&columns%5B9%5D%5Bdata%5D=blackList&columns%5B9%5D%5Bname%5D=&columns%5B9%5D%5Bsearchable%5D=true&columns%5B9%5D%5Borderable%5D=true&columns%5B9%5D%5Bsearch%5D%5Bvalue%5D=&columns%5B9%5D%5Bsearch%5D%5Bregex%5D=false&columns%5B10%5D%5Bdata%5D=&columns%5B10%5D%5Bname%5D=&columns%5B10%5D%5Bsearchable%5D=true&columns%5B10%5D%5Borderable%5D=false&columns%5B10%5D%5Bsearch%5D%5Bvalue%5D=&columns%5B10%5D%5Bsearch%5D%5Bregex%5D=false&columns%5B11%5D%5Bdata%5D=&columns%5B11%5D%5Bname%5D=&columns%5B11%5D%5Bsearchable%5D=true&columns%5B11%5D%5Borderable%5D=false&columns%5B11%5D%5Bsearch%5D%5Bvalue%5D=&columns%5B11%5D%5Bsearch%5D%5Bregex%5D=false&order%5B0%5D%5Bcolumn%5D=2&order%5B0%5D%5Bdir%5D=asc&start=0&length=10&search%5Bvalue%5D=${encName}&search%5Bregex%5D=false&inactive=0&blacklist=0&filterCol=name`
  
  try {
    const res = await fetch(searchUrl, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${ID_CONTROL_TOKEN}`,
        "Content-Type": "application/json;charset=utf-8",
        "accept": "application/json, text/plain, */*"
      },
      body: null
    })
    
    if (!res.ok) return null
    const json = await res.json()
    const list = json.data || json.content || json || []
    
    if (list.length > 0) {
      // Retorna o primeiro match (mais provável)
      const hit = list[0]
      return {
        idControlID: hit.id || hit.idDevice,
        rg: hit.rg || "",
        cpf: hit.cpf || "",
        dataInicial: null, // As datas exigem requisição no /api/user/{id} mas começamos com a lista
        dataFinal: null
      }
    }
  } catch(e) { /* ignore auth/timeout */ }
  return null
}

function normalizar(s) {
  if (!s) return ""
  return String(s).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim()
}

async function processarArquivo(inputFile) {
  console.log(`\n📂 Lendo arquivo: ${inputFile}`)
  if (!fs.existsSync(inputFile)) {
    console.log("❌ Arquivo não encontrado!")
    return
  }
  
  const wb = XLSX.readFile(inputFile, { cellDates: true })
  const ws = wb.Sheets[wb.SheetNames[0]]
  const data = XLSX.utils.sheet_to_json(ws, { defval: "" })
  
  console.log(`📊 Total de linhas: ${data.length}`)
  
  let processados = 0
  let encontrados = 0
  
  for (const row of data) {
    let nome = "", rgOriginal = ""
    for (const k of Object.keys(row)) {
        const kn = normalizar(k)
        if ((kn.includes("nome") || kn.includes("prest") || kn.includes("usuario")) && !nome) nome = row[k]
        if ((kn.includes("rg") || kn.includes("doc")) && !kn.includes("control") && !rgOriginal) rgOriginal = row[k]
    }
    
    if (!nome) continue
    
    processados++
    console.log(`\n[${processados}/${data.length}] 🧑 Buscando: ${nome} ...`)
    
    // 1. Buscar no ID Control (O CORE DO ROBO 6)
    const idData = await buscarIDControlPorNome(nome)
    
    if (idData) {
        console.log(`   ✅ Encontrado no ID Control! RG Oficial: ${idData.rg}`)
        encontrados++
        
        // 2. Preencher na planilha a nova coluna
        row["RG ID CONTROL"] = idData.rg
        if (idData.idControlID) row["ID SYSTEM"] = idData.idControlID

        // 3. Opcional: Salvar no Supabase (já aproveita o saneamento)
        const prestadorPayload = {
            nome: nome.trim(),
            doc1: idData.rg || rgOriginal || "N/A",
            rg_id_control: idData.rg,
            id_control_id: idData.idControlID?.toString(),
            status_id_control: "OK_ROBO6"
        }
        
        // Upsert by nome (or create)
        await supabase.from('prestadores')
            .upsert(prestadorPayload, { onConflict: 'nome', ignoreDuplicates: false })
            
        console.log(`   💾 Atualizado no Supabase.`)
    } else {
        console.log(`   ❌ Não encontrado no ID Control.`)
        row["RG ID CONTROL"] = "NAO_ENCONTRADO"
    }
    
    // Pequeno delay pra nao matar a API
    await new Promise(r => setTimeout(r, 200))
  }
  
  // Salvar nova planilha
  const parsedPath = path.parse(inputFile)
  const outputFile = path.join(parsedPath.dir, `${parsedPath.name}_Robo6_Processado${parsedPath.ext}`)
  
  const newWs = XLSX.utils.json_to_sheet(data)
  const newWb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(newWb, newWs, "Robo6_Data")
  XLSX.writeFile(newWb, outputFile)
  
  console.log(`\n🎉 Processo Robo 6 concluído!`)
  console.log(`✅ ${encontrados} de ${processados} encontrados no ID Control.`)
  console.log(`📂 Arquivo salvo em: ${outputFile}\n`)
}

async function start() {
    console.log("=== INICIANDO ROBO 6 (MIGRAÇÃO & SANEAMENTO) ===")
    await loginIDControl()
    
    // Exemplo de uso: pega o primeiro argumento CLI como arquivo
    const args = process.argv.slice(2)
    const inputFile = args[0] || path.join(__dirname, 'planilha_adm.xlsx')
    
    await processarArquivo(inputFile)
}

start().catch(console.error)
