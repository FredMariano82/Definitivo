
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
    const results = {};
    
    const { data, error } = await supabase.from('prestadores').select('*').limit(1);
    if (!error && data && data.length > 0) {
        results.prestadores = Object.keys(data[0]);
    }

    const { data: dataSol, error: errorSol } = await supabase.from('solicitacoes').select('*').limit(1);
    if (!errorSol && dataSol && dataSol.length > 0) {
        results.solicitacoes = Object.keys(dataSol[0]);
    }

    fs.writeFileSync('scripts/robo1/inspect_results_deep.json', JSON.stringify(results, null, 2));
    console.log('Results saved to inspect_results_deep.json');
}

run();
