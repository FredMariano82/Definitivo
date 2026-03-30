
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function restoreScales() {
    // Dados extraídos do seed-op-v2.js
    const equipeOriginal = [
        { re: "21338", tipo_escala: "12x36" },
        { re: "24290", tipo_escala: "12x36" },
        { re: "21336", tipo_escala: "12x36" },
        { re: "67980", tipo_escala: "12x36" },
        { re: "22099", tipo_escala: "12x36" },
        { re: "27307", tipo_escala: "12x36" },
        { re: "21339", tipo_escala: "12x36" },
        { re: "27128", tipo_escala: "12x36" },
        { re: "165461", tipo_escala: "12x36" },
        { re: "21638", tipo_escala: "12x36" },
        { re: "22029", tipo_escala: "12x36" },
        { re: "21337", tipo_escala: "12x36" },
        { re: "22700", tipo_escala: "12x36" },
        { re: "21882", tipo_escala: "12x36" },
        { re: "23710", tipo_escala: "12x36" },
        { re: "23843", tipo_escala: "12x36" },
        { re: "23204", tipo_escala: "12x36" },
        { re: "27299", tipo_escala: "12x36" },
        { re: "21785", tipo_escala: "12x36" },
        { re: "22866", tipo_escala: "12x36" },
        { re: "68317", tipo_escala: "12x36" },
        { re: "56996", tipo_escala: "12x36" },
        { re: "25552", tipo_escala: "12x36" },
        { re: "23788", tipo_escala: "12x36" },
        { re: "26583", tipo_escala: "12x36" },
        { re: "23181", tipo_escala: "12x36" },
        { re: "24231", tipo_escala: "12x36" },
        { re: "50723", tipo_escala: "12x36" },
        { re: "50770", tipo_escala: "12x36" },
        { re: "50729", tipo_escala: "12x36" },
        { re: "25527", tipo_escala: "12x36" },
        { re: "21347", tipo_escala: "12x36" },
        { re: "21348", tipo_escala: "12x36" },
        { re: "16552", tipo_escala: "12x36" },
        { re: "24867", tipo_escala: "5x1" },
        { re: "22348", tipo_escala: "5x1" },
        { re: "25858", tipo_escala: "5x1" },
        { re: "26157", tipo_escala: "5x1" },
        { re: "50710", tipo_escala: "5x2" }
    ];

    console.log(`Iniciando restauração de ${equipeOriginal.length} escalas...`);

    for (const item of equipeOriginal) {
        const { error } = await supabase
            .from('op_equipe')
            .update({ tipo_escala: item.tipo_escala })
            .eq('re', item.re);

        if (error) {
            console.error(`Erro ao restaurar escala para RE ${item.re}:`, error.message);
        } else {
            console.log(`Escala restaurada para RE ${item.re} -> ${item.tipo_escala}`);
        }
    }

    console.log('Restauração concluída.');
}

restoreScales();
