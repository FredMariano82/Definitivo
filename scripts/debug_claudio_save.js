
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function debugClaudio() {
    console.log("Buscando Cláudio para teste...");
    const { data: colab } = await supabase
        .from('op_equipe')
        .select('*')
        .ilike('nome_completo', '%Cláudio Tagavas%')
        .maybeSingle();

    if (!colab) {
        console.log("Cláudio não encontrado. Buscando qualquer um para teste de payload real.");
        const { data: anyColab } = await supabase.from('op_equipe').select('*').limit(1).single();
        if (!anyColab) return;
        runTest(anyColab);
    } else {
        runTest(colab);
    }
}

async function runTest(colab) {
    console.log(`Testando update no colaborador: ${colab.nome_completo} (ID: ${colab.id})`);
    
    // Payload igual ao do print (Simulando o que o formulário envia)
    // No print: Função=VSPP Coordenador, RE=21338, Tipo=12x36 Par/Impar, Ref=18/03/2026
    const payload = {
        nome_completo: colab.nome_completo,
        re: "21338",
        funcao: "VSPP Coordenador",
        tipo_escala: "12x36",
        possui_porte_arma: true,
        possui_cnh: false,
        status_ativo: true,
        data_reciclagem: null, // No print estava vazio
        data_inicio_ferias: null,
        data_fim_ferias: null,
        referencia_escala: "2026-03-18" // Data convertida do print
    };

    console.log("Enviando payload:", payload);

    const { data, error } = await supabase
        .from('op_equipe')
        .update(payload)
        .eq('id', colab.id)
        .select();

    if (error) {
        console.error("ERRO DETALHADO:", JSON.stringify(error, null, 2));
    } else {
        console.log("SUCESSO NO TESTE:", data);
    }
}

debugClaudio();
