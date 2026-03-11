const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkToday() {
    const hoje = '2026-03-09';
    console.log(`Buscando escala para ${hoje}...`);

    const { data, error } = await supabase
        .from('op_escala_diaria')
        .select(`
            id,
            data_plantao,
            horario_inicio,
            horario_fim,
            status_dia,
            op_equipe (nome_completo, re),
            op_postos (nome_posto)
        `)
        .eq('data_plantao', hoje);

    if (error) {
        console.error('Erro:', error);
        return;
    }

    console.log(JSON.stringify(data, null, 2));
}

checkToday();
