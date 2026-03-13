
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function testSave() {
    console.log("Tentando salvar uma exceção de escala de teste...");
    
    // Pegar um ID de colaborador qualquer para o teste
    const { data: colabs } = await supabase.from('op_equipe').select('id').limit(1);
    if (!colabs || colabs.length === 0) {
        console.log("Nenhum colaborador encontrado para testar.");
        return;
    }
    
    const testData = {
        colaborador_id: colabs[0].id,
        data_plantao: '2026-03-15',
        status_dia: 'Falta',
        horario_inicio: '08:00',
        horario_fim: '20:00'
    };

    console.log("Dados de teste:", testData);

    const { data, error } = await supabase
        .from('op_escala_diaria')
        .upsert(testData, { onConflict: 'colaborador_id,data_plantao' })
        .select();

    if (error) {
        console.error("ERRO NO UPSERT:", error);
    } else {
        console.log("SUCESSO:", data);
    }
}

testSave();
