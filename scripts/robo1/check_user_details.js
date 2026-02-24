const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkUser() {
    console.log("--- Checking User Details ---");
    const { data: user, error } = await supabase
        .from('usuarios')
        .select('*')
        .eq('email', 'solicitante@mvm.com')
        .single();

    if (error) {
        console.error("Error fetching user:", error);
    } else {
        console.log("User Data:", JSON.stringify(user, null, 2));
    }
}

checkUser();
