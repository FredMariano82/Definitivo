const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
(async () => {
    console.log('Apagando todos os prestadores...');
    const res1 = await supabase.from('prestadores').delete().gte('id', 0);
    if (res1.error) console.error(res1.error);

    console.log('Apagando todas as solicitações...');
    const res2 = await supabase.from('solicitacoes').delete().gte('id', 0);
    if (res2.error) console.error(res2.error);

    console.log('Banco de dados Supabase ZERADO com sucesso.');
})();
