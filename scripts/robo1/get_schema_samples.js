const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env.local') });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function inspect() {
    console.log("--- Prestadores Sample ---");
    const { data: p } = await supabase.from('prestadores').select('*').limit(1);
    console.log(JSON.stringify(p, null, 2));

    console.log("\n--- Solicitacoes Sample ---");
    const { data: s } = await supabase.from('solicitacoes').select('*').limit(1);
    console.log(JSON.stringify(s, null, 2));
}

inspect();
