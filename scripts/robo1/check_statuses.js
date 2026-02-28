
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function checkStatuses() {
    const { data, error } = await supabase.from('prestadores').select('liberacao');

    if (error) {
        console.error("❌ Erro:", error.message);
        return;
    }

    const statuses = [...new Set(data.map(d => d.liberacao))];
    console.log("Status de liberação encontrados:", statuses);
}

checkStatuses();
