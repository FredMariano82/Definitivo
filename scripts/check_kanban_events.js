const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkKanbanTasks() {
    console.log('Verificando tarefas na categoria "eventos"...');
    const { data, error } = await supabase
        .from('kanban_tarefas')
        .select('*')
        .eq('categoria', 'eventos');
    
    if (error) {
        console.error('Erro ao buscar tarefas:', error);
        return;
    }

    if (data.length === 0) {
        console.log('Nenhuma tarefa de evento encontrada.');
    } else {
        console.log(`Encontradas ${data.length} tarefas de eventos:`);
        data.forEach(t => {
            console.log(`- ID: ${t.id} | Título: ${t.titulo} | Status: ${t.status}`);
        });
    }
}

checkKanbanTasks();
