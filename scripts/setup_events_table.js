const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function createEventsTable() {
    console.log("🚀 Criando estrutura para Eventos...");

    // Nota: Como não temos SSH ou acesso direto ao SQL Editor via API standard sem Service Role com permissões de admin de schema,
    // vamos tentar verificar se a tabela existe e, se não, orientar ou tentar criar via RPC se disponível.
    // No entanto, a forma mais segura em ambientes Supabase é via SQL Editor.
    // Mas vamos tentar dar um 'select' para ver se já existe.
    
    const { error: checkError } = await supabase.from('op_eventos').select('*').limit(1);

    if (checkError && checkError.code === '42P01') { // Relation does not exist
        console.log("📝 Tabela 'op_eventos' não existe. Por favor, execute o seguinte comando no SQL Editor do Supabase:");
        console.log(`
CREATE TABLE op_eventos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome TEXT NOT NULL,
    tipo TEXT NOT NULL,
    data_inicio DATE NOT NULL,
    data_fim DATE NOT NULL,
    horario_inicio TIME,
    horario_fim TIME,
    cor TEXT,
    local TEXT,
    observacoes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ativar RLS
ALTER TABLE op_eventos ENABLE ROW LEVEL SECURITY;

-- Política de Acesso (Leitura para todos autenticados)
CREATE POLICY "Leitura de eventos para todos" ON op_eventos FOR SELECT TO authenticated USING (true);

-- Política de Escrita (Apenas administradores/gestores)
CREATE POLICY "Escrita de eventos para administradores" ON op_eventos FOR ALL TO authenticated USING (true);
        `);
    } else if (checkError) {
        console.error("❌ Erro ao verificar tabela:", checkError.message);
    } else {
        console.log("✅ Tabela 'op_eventos' já existe no banco de dados.");
    }
}

createEventsTable();
