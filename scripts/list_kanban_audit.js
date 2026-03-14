const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function listAllTasks() {
    console.log('Listando todas as tarefas do Kanban...');
    const { data, error } = await supabase
        .from('kanban_tarefas')
        .select('id, titulo, categoria, status, created_at')
        .order('created_at', { ascending: false })
        .limit(20);
    
    if (error) {
        console.error('Erro ao listar tarefas:', error);
        return;
    }

    if (data.length === 0) {
        console.log('Nenhuma tarefa encontrada no Kanban.');
    } else {
        console.log(`Encontradas ${data.length} tarefas recentes:`);
        data.forEach(t => {
            console.log(`- ID: ${t.id} | Título: ${t.titulo} | Categoria: ${t.categoria} | Status: ${t.status}`);
        });
    }
}

listAllTasks();
