const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkUsers() {
    const { data: tables, error: tableError } = await supabase
        .from('usuarios')
        .select('*');

    fs.writeFileSync('users_debug.json', JSON.stringify(tables || { error: tableError }, null, 2));
    console.log('Users saved to users_debug.json');
}

checkUsers();
