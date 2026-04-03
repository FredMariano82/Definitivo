const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkEvents() {
    console.log('Verificando últimos eventos criados...');
    const { data, error } = await supabase
        .from('op_eventos')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);
    
    if (error) {
        console.error('Erro ao buscar eventos:', error);
        return;
    }

    if (data.length === 0) {
        console.log('Nenhum evento encontrado na tabela op_eventos.');
    } else {
        console.log(`Encontrados ${data.length} eventos recentes:`);
        data.forEach(ev => {
            console.log(`- ID: ${ev.id} | Nome: ${ev.nome} | Criado em: ${ev.created_at}`);
        });
    }
}

checkEvents();
