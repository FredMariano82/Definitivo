const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error("❌ Erro: Variáveis de ambiente SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não encontradas.");
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const operators = ['marta', 'diego', 'john', 'fernando', 'david', 'suelen'];

async function registerOperators() {
    console.log("🚀 Iniciando registro de operadores...");

    for (const name of operators) {
        try {
            // Verificar se usuário já existe
            const { data: existing, error: checkError } = await supabase
                .from('usuarios')
                .select('id')
                .eq('email', name)
                .single();

            if (existing) {
                console.log(`🟡 Usuário '${name}' já existe. Pulando...`);
                continue;
            }

            // Inserir novo usuário
            const { data, error } = await supabase
                .from('usuarios')
                .insert([
                    {
                        nome: name.charAt(0).toUpperCase() + name.slice(1),
                        email: name, // Usando o nome como identificador
                        senha: '123',
                        perfil: 'operador',
                        departamento: 'Central de Segurança'
                    }
                ])
                .select();

            if (error) {
                console.error(`❌ Erro ao cadastrar '${name}':`, error.message);
            } else {
                console.log(`✅ Usuário '${name}' cadastrado com sucesso!`);
            }
        } catch (err) {
            console.error(`💥 Erro inesperado para '${name}':`, err);
        }
    }

    console.log("🏁 Processo concluído.");
}

registerOperators();
