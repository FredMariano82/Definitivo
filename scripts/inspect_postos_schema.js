const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function inspectPostos() {
    console.log('Inspecionando colunas de op_postos...');
    const { data, error } = await supabase
        .from('op_postos')
        .select('*')
        .limit(1);
    
    if (error) {
        console.error('Erro ao inspecionar:', error);
        return;
    }

    if (data && data.length > 0) {
        console.log('Colunas detectadas:', Object.keys(data[0]));
    } else {
        console.log('Tabela op_postos vazia.');
    }
}

inspectPostos();
