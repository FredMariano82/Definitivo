import { createClient } from "@supabase/supabase-js"

// Log de todas as variáveis de ambiente relacionadas ao Supabase
console.log("🔍 Debug variáveis ambiente:", {
  "process.env.NEXT_PUBLIC_SUPABASE_URL": process.env.NEXT_PUBLIC_SUPABASE_URL
    ? `${process.env.NEXT_PUBLIC_SUPABASE_URL.substring(0, 20)}...`
    : "UNDEFINED",
  "process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY": process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    ? `${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.substring(0, 20)}...`
    : "UNDEFINED",
  "typeof URL": typeof process.env.NEXT_PUBLIC_SUPABASE_URL,
  "typeof KEY": typeof process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
})

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl) {
  console.error("❌ NEXT_PUBLIC_SUPABASE_URL está undefined")
  throw new Error("NEXT_PUBLIC_SUPABASE_URL é obrigatória")
}

if (!supabaseAnonKey) {
  console.error("❌ NEXT_PUBLIC_SUPABASE_ANON_KEY está undefined")
  throw new Error("NEXT_PUBLIC_SUPABASE_ANON_KEY é obrigatória")
}

console.log("✅ Criando cliente Supabase com:", {
  url: `${supabaseUrl.substring(0, 30)}...`,
  key: `${supabaseAnonKey.substring(0, 30)}...`,
})

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Teste de conexão
console.log("🔄 Testando conexão Supabase...")
