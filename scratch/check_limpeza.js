const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = "https://fghskpxtqdfqomozfckk.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZnaHNrcHh0cWRmcW9tb3pmY2trIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczODAxNzM4NywiZXhwIjoyMDUzNTkzMzg3fQ.Zue8NlG78l2k6N-kQo7h2E83A8V7_W9yM_e-vL_r0_A";
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    const { count: cP } = await supabase.from('prestadores').select('*', { count: 'exact', head: true });
    const { count: cS } = await supabase.from('solicitacoes').select('*', { count: 'exact', head: true });
    console.log(`📊 STATUS FINAL:`);
    console.log(`- Prestadores: ${cP}`);
    console.log(`- Solicitações: ${cS}`);
}
check();
