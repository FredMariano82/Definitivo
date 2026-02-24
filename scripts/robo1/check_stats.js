const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function checkStats() {
    const { data, error } = await supabase
        .from('prestadores')
        .select('liberacao, integrado_id_control');

    if (error) {
        console.error("Error:", error.message);
        return;
    }

    const stats = data.reduce((acc, curr) => {
        const key = `${curr.liberacao} | Integrated: ${curr.integrado_id_control}`;
        acc[key] = (acc[key] || 0) + 1;
        return acc;
    }, {});

    console.log("Stats:", JSON.stringify(stats, null, 2));
}

checkStats();
