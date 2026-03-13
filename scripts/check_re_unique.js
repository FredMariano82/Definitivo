
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function checkConstraints() {
    console.log("Verificando se há restrição UNIQUE no campo RE ou outros...");
    
    // Como não podemos listar constraints via API direta, vamos tentar um "Exploit" de erro:
    // Tentar atualizar dois colaboradores diferentes para o mesmo RE.
    
    const { data: colabs } = await supabase.from('op_equipe').select('id, re').limit(2);
    
    if (!colabs || colabs.length < 2) {
        console.log("Não há colaboradores suficientes para o teste de unicidade.");
        return;
    }

    console.log(`Tentando duplicar RE: ${colabs[0].re} no colaborador ${colabs[1].id}`);
    
    const { error } = await supabase
        .from('op_equipe')
        .update({ re: colabs[0].re })
        .eq('id', colabs[1].id);

    if (error) {
        console.log("ERRO CAPTURADO (Pode ser a causa):", error.message);
        if (error.message.includes('unique constraint') || error.message.includes('already exists')) {
            console.log(">>> CONFIRMADO: Existe uma restrição de RE Único.");
        }
    } else {
        console.log("Update permitido: RE não é único ou os IDs eram o mesmo.");
    }
}

checkConstraints();
