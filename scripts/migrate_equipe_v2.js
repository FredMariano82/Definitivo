
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function runMigration() {
    console.log("Iniciando migração de colunas para op_equipe...");
    
    // Como não temos acesso direto ao SQL via API JSON, vamos tentar inserir campos nulos/vazios
    // No entanto, se o banco não tiver as colunas, o JS vai dar erro.
    // A única forma de resolver via JS é usar RPC se houver uma função de 'exec_sql' cadastrada, 
    // ou instruir o usuário. 
    
    // MAS, eu posso tentar criar um script que use o comando 'ALTER TABLE' se eu pudesse, 
    // como não posso, vou gerar um ARQUIVO DE MIGRAÇÃO e pedir pro usuário rodar no SQL Editor do Supabase,
    // OU tentar resolver via as chaves que temos.
    
    // VOU TENTAR UMA COISA: O Supabase as vezes aceita novos campos se o RLS permitir, 
    // mas a estrutura da tabela é rígida.
    
    console.log("SQL PARA EXECUTAR NO SUPABASE (SQL EDITOR):");
    console.log(`
        -- 1. Adicionar colunas faltantes em op_equipe
        ALTER TABLE op_equipe ADD COLUMN IF NOT EXISTS data_reciclagem DATE;
        ALTER TABLE op_equipe ADD COLUMN IF NOT EXISTS data_inicio_ferias DATE;
        ALTER TABLE op_equipe ADD COLUMN IF NOT EXISTS data_fim_ferias DATE;
        ALTER TABLE op_equipe ADD COLUMN IF NOT EXISTS referencia_escala DATE;

        -- 2. Garantir políticas de segurança para UPDATE (O que está causando o erro de salvamento)
        DROP POLICY IF EXISTS "Permitir update de equipe" ON op_equipe;
        CREATE POLICY "Permitir update de equipe" ON op_equipe FOR UPDATE USING (true);
        
        DROP POLICY IF EXISTS "Permitir update de escala" ON op_escala_diaria;
        CREATE POLICY "Permitir update de escala" ON op_escala_diaria FOR UPDATE USING (true);
    `);
}

runMigration();
