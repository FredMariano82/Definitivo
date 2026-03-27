const { createClient } = require('@supabase/supabase-client');
const fs = require('fs');

// Ler .env.local manualmente para extrair as chaves
const envFile = fs.readFileSync('c:/Users/fredm/OneDrive/Documentos/GitHub/Definitivo/.env.local', 'utf8');
const env = Object.fromEntries(envFile.split('\n').filter(line => line.includes('=')).map(line => line.split('=')));

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const supabaseKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

if (!supabaseUrl || !supabaseKey) {
    console.error("URL ou Key do Supabase não encontradas no .env.local");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
    console.log("Testando inserção na tabela op_historico_movimentacoes...");
    const { error } = await supabase
        .from('op_historico_movimentacoes')
        .insert({
            colaborador_id: '00000000-0000-0000-0000-000000000000',
            colaborador_nome: 'Teste Sistema',
            acao: 'TESTE DE CONEXÃO'
        });
    
    if (error) {
        console.log("RESULTADO: ERRO");
        console.log("Código:", error.code);
        console.log("Mensagem:", error.message);
    } else {
        console.log("RESULTADO: SUCESSO! A tabela existe.");
    }
}

test();
