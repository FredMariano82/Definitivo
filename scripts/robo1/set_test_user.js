const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function setTestUser() {
    // Find the first user marked as 'negada' to repurpose for testing
    const { data: user, error: findError } = await supabase
        .from('prestadores')
        .select('*')
        .eq('liberacao', 'negada')
        .limit(1)
        .single();

    if (findError || !user) {
        console.error("No 'negada' user found to repurpose.");
        return;
    }

    console.log(`Repurposing user: ${user.nome} (ID: ${user.id})`);

    const { error: updateError } = await supabase
        .from('prestadores')
        .update({
            doc1: '' + Math.floor(Math.random() * 900000000 + 100000000), // 9 digits
            liberacao: 'ok',
            integrado_id_control: false
        })
        .eq('id', user.id);

    if (updateError) {
        console.error("Error updating user:", updateError.message);
    } else {
        console.log("User updated successfully! Ready for sync test.");
    }
}

setTestUser();
