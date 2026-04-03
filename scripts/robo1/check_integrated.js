const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function checkIntegrated() {
    const { count, error } = await supabase
        .from('prestadores')
        .select('*', { count: 'exact', head: true })
        .eq('integrado_id_control', true);

    if (error) {
        console.error("Error:", error.message);
    } else {
        console.log(`Integrated users count: ${count}`);
    }

    const { data: samples } = await supabase
        .from('prestadores')
        .select('id, nome, id_control_id, empresa')
        .eq('integrado_id_control', true)
        .limit(5);

    console.log("Sample integrated users:", JSON.stringify(samples, null, 2));
}

checkIntegrated();
