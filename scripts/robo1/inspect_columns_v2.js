const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function inspectTable(tableName) {
    const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(1);

    if (error) {
        console.error(`Error inspecting ${tableName}: ${error.message}`);
        return;
    }

    if (data && data.length > 0) {
        console.log(`--- Table: ${tableName} ---`);
        Object.keys(data[0]).sort().forEach(col => console.log(col));
    } else {
        console.log(`--- Table: ${tableName} (NO DATA) ---`);
    }
}

async function main() {
    await inspectTable('prestadores');
    await inspectTable('solicitacoes');
}

main();
