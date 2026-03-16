const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function listTables() {
    console.log("🔍 Investigando tabelas disponíveis no Supabase...");
    
    // Tenta buscar de ambas, uma deve funcionar
    const t1 = await supabase.from('solicitacoes').select('id').limit(1);
    if (!t1.error) console.log("✅ Tabela encontrada: 'solicitacoes'");
    else console.log("❌ Erro em 'solicitacoes':", t1.error.message);

    const t2 = await supabase.from('solicitacao').select('id').limit(1);
    if (!t2.error) console.log("✅ Tabela encontrada: 'solicitacao'");
    else console.log("❌ Erro em 'solicitacao':", t2.error.message);

    const t3 = await supabase.from('prestadores').select('id').limit(1);
    if (!t3.error) console.log("✅ Tabela encontrada: 'prestadores'");
    else console.log("❌ Erro em 'prestadores':", t3.error.message);

    const t4 = await supabase.from('prestador').select('id').limit(1);
    if (!t4.error) console.log("✅ Tabela encontrada: 'prestador'");
    else console.log("❌ Erro em 'prestador':", t4.error.message);
}

listTables();
