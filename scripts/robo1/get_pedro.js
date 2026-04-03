require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function check() {
    const { data } = await supabase.from('prestadores')
        .select('*')
        .eq('liberacao', 'negada')
        .order('id', { ascending: false })
        .limit(1);
    console.log(JSON.stringify(data[0], null, 2));
}
check();
