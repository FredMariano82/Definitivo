const { createClient } = require('@supabase/supabase-client');

const supabaseUrl = 'https://lwpqgyoownxwsrcowgke.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx3cHFneW9vd254d3NyY293Z2tlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTY0NjA5NCwiZXhwIjoyMDg3MjIyMDk0fQ.NEFi7yGgnD4gs1PxZ7B7W_mQLkp5s3qqt5y7gL-SLHM';
const supabase = createClient(supabaseUrl, supabaseKey);

async function migrate() {
    console.log('🚀 Iniciando migração do Kanban...');

    // 1. Fazendo -> Andamento
    const { data: d1, error: e1 } = await supabase
        .from('kanban_tarefas')
        .update({ status: 'andamento' })
        .eq('status', 'fazendo');
    
    if (e1) console.error('❌ Erro Fazendo->Andamento:', e1);
    else console.log('✅ Migrado Fazendo para Andamento');

    // 2. Historico -> Finalizado
    const { data: d2, error: e2 } = await supabase
        .from('kanban_tarefas')
        .update({ status: 'finalizado' })
        .eq('status', 'historico');
    
    if (e2) console.error('❌ Erro Historico->Finalizado:', e2);
    else console.log('✅ Migrado Historico para Finalizado');

    console.log('🏁 Migração concluída!');
}

migrate();
