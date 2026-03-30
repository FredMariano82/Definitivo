
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function renameRoles() {
    // Definindo os renames solicitados pelo usuário
    const renames = {
        'Vspp Inspetor': 'VSPP ENCARREGADO',
        'Vspp': 'VSPP',
        'Líder': 'Líder Op. Monitoramento',
        'Assistente Administrativo': 'Administrativo',
        'Motorista': 'Vigilante' // Removendo Motorista, movendo para Vigilante
    };

    console.log('Iniciando renomeação de cargos...');

    for (const [oldName, newName] of Object.entries(renames)) {
        const { error } = await supabase
            .from('op_equipe')
            .update({ funcao: newName })
            .eq('funcao', oldName);

        if (error) {
            console.error(`Erro ao renomear ${oldName}:`, error.message);
        } else {
            console.log(`Sucesso: ${oldName} -> ${newName}`);
        }
    }

    console.log('Renomeação concluída.');
}

renameRoles();
