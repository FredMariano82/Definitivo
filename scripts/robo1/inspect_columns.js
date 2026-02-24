const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function inspectTable(tableName) {
    const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(1);

    if (error) {
        console.error(`Error inspecting ${tableName}:`, error.message);
        return;
    }

    if (data && data.length > 0) {
        console.log(`Columns in ${tableName}:`, Object.keys(data[0]));
    } else {
        console.log(`No data in ${tableName} to inspect columns, trying RPC or alternative...`);
        // If no data, we might need another way to fetch schema, but usually we have some data
    }
}

async function main() {
    await inspectTable('prestadores');
    await inspectTable('solicitacoes');
}

main();
