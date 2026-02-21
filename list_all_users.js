const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function listUsers() {
    console.log("--- Listing All Users ---");
    const { data: users, error } = await supabase
        .from('usuarios')
        .select('id, nome, email, senha, perfil');

    if (error) {
        console.error("Error fetching users:", error);
    } else {
        console.log("Users Found:", JSON.stringify(users, null, 2));
    }
}

listUsers();
