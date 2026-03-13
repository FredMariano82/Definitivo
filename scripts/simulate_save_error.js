
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function simulateFormSave() {
    console.log("Simulando salvamento de formulário (Update)...");
    
    const { data: colabs } = await supabase.from('op_equipe').select('id, nome_completo, re').limit(1);
    if (!colabs || colabs.length === 0) return;

    const id = colabs[0].id;

    // Dados baseados no que o formulário envia (com strings vazias em datas)
    const formData = {
        nome_completo: colabs[0].nome_completo,
        re: colabs[0].re,
        funcao: "Vigilante",
        tipo_escala: "12x36",
        possui_porte_arma: true,
        possui_cnh: false,
        status_ativo: true,
        data_reciclagem: "", // ISTO PODE SER O ERRO
        data_inicio_ferias: "",
        data_fim_ferias: "",
        referencia_escala: "2026-03-13"
    };

    console.log("Payload sendo enviado:", formData);

    const { data, error } = await supabase
        .from('op_equipe')
        .update(formData)
        .eq('id', id)
        .select();

    if (error) {
        console.error("ERRO IDENTIFICADO:", error.code, "-", error.message);
        if (error.message.includes('date')) {
            console.log(">>> DIAGNÓSTICO: O erro é causado pelas strings vazias em colunas DATE.");
        }
    } else {
        console.log("SUCESSO NO SIMULADO:", data);
    }
}

simulateFormSave();
