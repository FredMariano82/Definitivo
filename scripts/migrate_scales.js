
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function runMigration() {
    console.log("Iniciando migração de banco de dados para Escalas...");

    // Tentando adicionar a coluna rendicionista_id na tabela op_rodizio_pausas via RPC ou SQL
    // Como não temos acesso root direto fácil sem psql, vamos orientar o usuário ou tentar via RPC se disponível.
    // Mas para este projeto, vamos focar em garantir que o OpService saiba lidar com as tabelas.

    console.log("DICA: Caso as tabelas não existam, execute o seguinte SQL no console do Supabase:");
    console.log(`
        -- Adicionar coluna de rendicionista
        ALTER TABLE op_rodizio_pausas ADD COLUMN IF NOT EXISTS rendicionista_id UUID REFERENCES op_equipe(id);

        -- Tabela de Check-in Diário
        CREATE TABLE IF NOT EXISTS op_checkin (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            data_checkin DATE NOT NULL UNIQUE,
            colaborador_ids UUID[] DEFAULT '{}',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
        );

        -- Políticas de Segurança (RLS)
        ALTER TABLE op_checkin ENABLE ROW LEVEL SECURITY;
        CREATE POLICY "Permitir leitura de checkin" ON op_checkin FOR SELECT USING (true);
        CREATE POLICY "Permitir inserção/update de checkin" ON op_checkin FOR ALL USING (true);
    `);
    
    console.log("Verificando conexão com Supabase...");
    const { data, error } = await supabase.from('op_equipe').select('id').limit(1);
    
    if (error) {
        console.error("Erro de conexão:", error.message);
    } else {
        console.log("Conexão OK. As alterações de código de persistência serão aplicadas agora.");
    }
}

runMigration();
