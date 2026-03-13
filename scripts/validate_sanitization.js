
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

// Simulação da função privada do OpService
function sanitizarDadosEquipe(membro) {
    const dados = { ...membro };
    const camposData = ['data_reciclagem', 'data_inicio_ferias', 'data_fim_ferias', 'referencia_escala', 'data_base_calculo'];
    
    camposData.forEach(campo => {
        if (dados[campo] === "") {
            dados[campo] = null;
        }
    });

    delete dados.id;
    delete dados.created_at;

    return dados;
}

async function validateFix() {
    console.log("Validando a correção de sanitização...");
    
    const { data: colabs } = await supabase.from('op_equipe').select('id, nome_completo, re').limit(1);
    if (!colabs || colabs.length === 0) return;

    const id = colabs[0].id;

    // Dados problemáticos (com strings vazias)
    const rawData = {
        nome_completo: colabs[0].nome_completo,
        re: colabs[0].re,
        data_reciclagem: "", 
        data_inicio_ferias: ""
    };

    const sanitizedData = sanitizarDadosEquipe(rawData);
    console.log("Dados após sanitização (devem ter null):", sanitizedData);

    const { data, error } = await supabase
        .from('op_equipe')
        .update(sanitizedData)
        .eq('id', id)
        .select();

    if (error) {
        console.error("ERRO AINDA PERSISTE:", error.message);
    } else {
        console.log("SUCESSO ABSOLUTO: O salvamento funcionou com sanitização!");
    }
}

validateFix();
