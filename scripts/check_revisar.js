const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });
const { createClient } = require('@supabase/supabase-js');

async function checkPendingReview() {
    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

    const { data, error } = await supabase
        .from('prestadores')
        .select('nome, doc1, doc2, checagem, observacoes')
        .eq('checagem', 'revisar');

    if (error) {
        console.error('Error:', error);
        return;
    }

    console.log(`Revisar count: ${data.length}`);
    console.log(JSON.stringify(data, null, 2));
}

checkPendingReview();
