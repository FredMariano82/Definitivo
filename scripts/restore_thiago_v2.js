const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });
const { createClient } = require('@supabase/supabase-js');

async function restore() {
    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

    console.log('Restoring 753159 to aprovado...');
    const { error } = await supabase
        .from('prestadores')
        .update({ checagem: 'aprovado', observacoes: null })
        .eq('doc1', '753159');

    if (error) {
        console.error('Error:', error);
    } else {
        console.log('Success!');
    }
}

restore();
