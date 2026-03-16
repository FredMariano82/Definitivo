const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env.local') });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkUnidade() {
    try {
        console.log("🔍 Buscando unidade_id padrão...");
        const { data, error } = await supabase.from('solicitacoes').select('unidade_id').limit(1);
        if (error) throw error;
        if (data && data.length > 0) {
            console.log("✅ Unidade ID encontrada:", data[0].unidade_id);
        } else {
            console.log("⚠️ Nenhuma solicitação encontrada para copiar a Unidade ID.");
        }
    } catch (e) {
        console.error("❌ Erro:", e.message);
    }
}

checkUnidade();
