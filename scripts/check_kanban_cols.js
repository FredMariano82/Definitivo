const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function checkKanbanColumns() {
    const { data: cols, error: err } = await supabase.from('kanban_tarefas').select('*').limit(1);
    if (err) console.error(err);
    else console.log("Colunas Kanban:", Object.keys(cols[0] || {}));
}

checkKanbanColumns();
