const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });
const { createClient } = require('@supabase/supabase-js');

async function inspect() {
    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

    console.log('--- TABLES ---');
    // Try to list tables from pg_catalog
    const { data: tables, error } = await supabase.from('prestadores').select('*').limit(1);
    if (error) {
        console.error('Error:', error.message);
    } else {
        console.log('Columns in prestadores:', Object.keys(tables[0]));
    }

    // Checking for commonly named settings tables
    const checkTables = ['config', 'settings', 'configuracoes', 'parametros', 'usuarios', 'solicitacoes'];
    for (const t of checkTables) {
        const { error: tErr } = await supabase.from(t).select('id').limit(1);
        if (tErr && tErr.code === '42P01') {
            console.log(`Table [${t}] does NOT exist.`);
        } else if (tErr) {
            console.log(`Table [${t}] exists but error: ${tErr.message}`);
        } else {
            console.log(`Table [${t}] EXISTS!`);
        }
    }
}

inspect();
