const path = require('path')
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') })
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

async function check() {
    const { data, error } = await supabase.rpc('get_table_info', { table_name: 'usuarios' }).catch(() => ({}))
    const { data: cols, error: errCols } = await supabase.from('usuarios').select('*').limit(1)
    if (cols && cols.length > 0) {
        console.log("Cols in usuarios:", Object.keys(cols[0]))
    } else {
        console.log("No users found to inspect columns")
    }
}
check()
