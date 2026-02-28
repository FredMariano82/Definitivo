
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function inspectTable() {
    const { data, error } = await supabase.from('prestadores').select('*').limit(1);

    if (error) {
        console.error("❌ Erro:", error.message);
        return;
    }

    if (data.length > 0) {
        console.log("Column names and samples:");
        Object.keys(data[0]).forEach(key => {
            console.log(`- ${key}: ${typeof data[0][key]} (Sample: ${data[0][key]})`);
        });
    } else {
        console.log("No data found to inspect.");
    }
}

inspectTable();
