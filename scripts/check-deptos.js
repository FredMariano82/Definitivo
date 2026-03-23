const path = require('path')
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') })
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

async function check() {
    const { data: d, error: errD } = await supabase.from('departamentos').select('*').limit(1)
    if (errD) {
        console.log("No departments table: ", errD.message)
    } else {
        console.log("Departments table exists!")
    }
}
check()
