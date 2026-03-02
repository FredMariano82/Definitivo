const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });
const { createClient } = require('@supabase/supabase-js');

async function resetThiago() {
    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

    const { error } = await supabase
        .from('prestadores')
        .update({
            checagem: 'revisar',
            id_control_id: null,
            observacoes: '[CONFLITO RG: 753159]'
        })
        .eq('nome', 'Thiago Barros');

    if (error) {
        console.error('Error:', error);
    } else {
        console.log('Thiago Barros reset for testing');
    }
}

resetThiago();
