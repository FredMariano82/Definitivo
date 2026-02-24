const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function inspectTable(tableName) {
    const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(1);

    if (error) return `Error inspecting ${tableName}: ${error.message}\n`;

    if (data && data.length > 0) {
        let output = `--- Table: ${tableName} ---\n`;
        Object.keys(data[0]).sort().forEach(col => {
            output += `${col}\n`;
        });
        return output + "\n";
    } else {
        return `--- Table: ${tableName} (NO DATA) ---\n\n`;
    }
}

async function main() {
    let finalOutput = "";
    finalOutput += await inspectTable('prestadores');
    finalOutput += await inspectTable('solicitacoes');
    fs.writeFileSync('db_schema_info.txt', finalOutput);
    console.log("Schema info written to db_schema_info.txt");
}

main();
