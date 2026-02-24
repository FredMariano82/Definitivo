const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function checkValues() {
    const { data, error } = await supabase
        .from('prestadores')
        .select('liberacao');

    if (error) {
        console.error("Error:", error.message);
        return;
    }

    const values = [...new Set(data.map(d => d.liberacao))];
    console.log("Distinct liberacao values:", values);
}

checkValues();
