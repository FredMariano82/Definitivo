const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase credentials in .env.local");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function verify() {
    console.log("--- Checking Solicitacoes ---");
    const { data: solicitacoes, error: solError } = await supabase
        .from('solicitacoes')
        .select('*')
        .order('id', { ascending: false })
        .limit(5);

    if (solError) {
        console.error("Error fetching solicitacoes:", solError);
    } else {
        console.log(`Found ${solicitacoes.length} recent solicitations:`);
        solicitacoes.forEach(s => {
            console.log(`- ID: ${s.id}, Num: ${s.numero}, Dept: [${s.departamento}], Solicitante: ${s.solicitante}`);
        });
    }

    console.log("\n--- Checking Prestadores ---");
    const { data: prestadores, error: prestError } = await supabase
        .from('prestadores')
        .select('*, solicitacoes(numero)')
        .order('id', { ascending: false })
        .limit(5);

    if (prestError) {
        console.error("Error fetching prestadores:", prestError);
    } else {
        console.log(`Found ${prestadores.length} recent prestadores:`);
        prestadores.forEach(p => {
            console.log(`- ID: ${p.id}, Nome: ${p.nome}, SolNum: ${p.solicitacoes?.numero}`);
        });
    }

    console.log("\n--- Checking Current User (solicitante@mvm.com) ---");
    const { data: user, error: userError } = await supabase
        .from('usuarios')
        .select('*')
        .eq('email', 'solicitante@mvm.com')
        .single();

    if (userError) {
        console.error("Error fetching user:", userError);
    } else {
        console.log(`User Dept: [${user.departamento}]`);
    }
}

verify();
