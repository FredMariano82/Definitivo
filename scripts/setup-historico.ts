import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function setupHistoryTable() {
  console.log("Verificando / Criando a tabela de histórico (chaves_movimentacoes)...")
  
  // SQL para criar a tabela de histórico
  const sql = `
  CREATE TABLE IF NOT EXISTS public.chaves_movimentacoes (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      chave_id UUID REFERENCES public.chaves_inventario(id) ON DELETE SET NULL,
      numero TEXT NOT NULL,
      modelo TEXT NOT NULL,
      local TEXT NOT NULL,
      tipo TEXT NOT NULL CHECK (tipo IN ('SAIDA', 'ENTRADA')),
      responsavel_nome TEXT,
      responsavel_setor TEXT,
      operador_nome TEXT,
      data_evento TIMESTAMPTZ DEFAULT now()
  );

  -- Habilitar RLS
  ALTER TABLE public.chaves_movimentacoes ENABLE ROW LEVEL SECURITY;

  -- Criar política de acesso público para o MVP
  DO $$ 
  BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'chaves_movimentacoes' AND policyname = 'Permitir tudo'
    ) THEN
        CREATE POLICY "Permitir tudo" ON public.chaves_movimentacoes FOR ALL USING (true) WITH CHECK (true);
    END IF;
  END $$;
  `

  const { error } = await supabase.rpc('exec_sql', { sql_query: sql })

  if (error) {
    if (error.message.includes("function exec_sql() does not exist")) {
        console.log("⚠️ RPC 'exec_sql' não encontrado. Você precisa rodar o SQL manualmente no painel do Supabase.")
        console.log("O SQL está disponível no arquivo: setup_historico.sql")
    } else {
        console.error("Erro ao configurar tabela:", error.message)
    }
  } else {
    console.log("✅ Tabela de histórico verificada/criada com sucesso!")
  }
}

setupHistoryTable()
