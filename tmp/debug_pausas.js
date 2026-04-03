const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkPauses() {
    console.log("Supabase URL:", supabaseUrl);
    console.log("Local Time:", new Date().toString());
    console.log("Local ISO:", new Date().toISOString());

    const { data, error } = await supabase
        .from('op_pausas')
        .select('*')
        .eq('encerrada', false);

    if (error) {
        console.error("Error fetching pauses:", error);
        return;
    }

    console.log("Active Pauses found:", data.length);
    data.forEach(p => {
        const inicio = new Date(p.data_inicio);
        const agora = new Date();
        const diff = (agora - inicio) / 1000;
        console.log(`- Colaborador: ${p.colaborador_id}`);
        console.log(`  Tipo: ${p.tipo_pausa}`);
        console.log(`  Início (DB): ${p.data_inicio}`);
        console.log(`  Início (Parsed): ${inicio.toISOString()}`);
        console.log(`  Segundos Duração: ${p.segundos_duracao}`);
        console.log(`  Segundos Decorridos: ${diff}`);
        console.log(`  Segundos Restantes: ${p.segundos_duracao - diff}`);
    });
}

checkPauses();
