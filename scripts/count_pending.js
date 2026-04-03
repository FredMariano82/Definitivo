const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });
const { createClient } = require('@supabase/supabase-js');

async function countPending() {
    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

    const { count, error } = await supabase
        .from('prestadores')
        .select('*', { count: 'exact', head: true })
        .eq('checagem', 'aprovado')
        .is('id_control_id', null);

    if (error) {
        console.error('Error:', error);
        return;
    }

    console.log(`Pending providers: ${count}`);
}

countPending();
