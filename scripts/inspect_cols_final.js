const path = require('path')
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') })
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

async function check() {
    const { data: cols, error } = await supabase.from('prestadores').select('*').limit(1)
    if (cols && cols.length > 0) {
        console.log("COLUNAS ENCONTRADAS:");
        console.log(JSON.stringify(Object.keys(cols[0]), null, 2));
    } else {
        console.log("Tabela de prestadores vazia ou permissão negada.");
    }
}
check()
