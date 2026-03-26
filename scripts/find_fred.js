const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function findUser() {
    console.log("🔍 PESQUISA DETALHADA: FRED");
    
    // Busca por nome
    const { data: porNome, error: err1 } = await supabase
        .from('prestadores')
        .select('*')
        .ilike('nome', '%Fred%');

    if (porNome) {
        console.log(`\n📋 Registros por Nome (${porNome.length}):`);
        porNome.forEach(u => {
            console.log(`- ID: ${u.id} | Nome: ${u.nome} | CPF/RG: ${u.doc1} | Status: ${u.status} | Checagem: ${u.checagem} | Criado: ${u.created_at}`);
        });
    }

    // Busca por "Mariano" (parte do nome do usuário)
    const { data: porMariano, error: err2 } = await supabase
        .from('prestadores')
        .select('*')
        .ilike('nome', '%Mariano%');

    if (porMariano) {
        console.log(`\n📋 Registros por 'Mariano' (${porMariano.length}):`);
        porMariano.forEach(u => {
            console.log(`- ID: ${u.id} | Nome: ${u.nome} | CPF/RG: ${u.doc1} | Status: ${u.status} | Criado: ${u.created_at}`);
        });
    }
}

findUser();
