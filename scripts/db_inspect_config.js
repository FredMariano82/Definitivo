const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });
const { createClient } = require('@supabase/supabase-js');

async function inspect() {
    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

    console.log('--- COLUMNS IN configuracoes ---');
    const { data: configs, error: cErr } = await supabase.from('configuracoes').select('*').limit(1);
    if (cErr) {
        console.error('Error configuracoes:', cErr.message);
    } else if (configs && configs.length > 0) {
        console.log('Columns:', Object.keys(configs[0]));
        console.log('Sample Row:', configs[0]);
    } else {
        console.log('Table configuracoes is empty (but exists).');
        // Try to get columns anyway via an insert attempt or something else if needed
    }
}

inspect();
