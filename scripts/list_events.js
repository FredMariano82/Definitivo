const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function listEvents() {
    const { data, error } = await supabase
        .from('op_eventos')
        .select('*');

    if (error) {
        console.error('Erro ao buscar eventos:', error);
        return;
    }

    console.log('Eventos encontrados:', JSON.stringify(data, null, 2));
}

listEvents();
