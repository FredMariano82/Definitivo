const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceRoleKey) {
    console.error('ERRO: SUPABASE_SERVICE_ROLE_KEY não encontrada no .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function migratePasswords() {
    console.log('🔐 Iniciando migração de senhas para HASH...');

    // 1. Buscar todos os usuários
    const { data: usuarios, error: fetchError } = await supabase
        .from('usuarios')
        .select('id, nome, senha');

    if (fetchError) {
        console.error('❌ Erro ao buscar usuários:', fetchError.message);
        return;
    }

    console.log(`📊 Encontrados ${usuarios.length} usuários para processar.`);

    let sucessos = 0;
    let erros = 0;

    for (const user of usuarios) {
        // Verificar se a senha já parece ser um hash (bcrypt hashes começam com $2a$ ou $2b$)
        if (user.senha && user.senha.startsWith('$2')) {
            console.log(`- Usuário "${user.nome}" já possui senha em hash. Pulando...`);
            continue;
        }

        try {
            // Gerar hash da senha atual
            const salt = bcrypt.genSaltSync(10);
            const hashedSenha = bcrypt.hashSync(user.senha, salt);

            // Atualizar no banco
            const { error: updateError } = await supabase
                .from('usuarios')
                .update({ senha: hashedSenha })
                .eq('id', user.id);

            if (updateError) {
                console.error(`❌ Erro ao atualizar "${user.nome}":`, updateError.message);
                erros++;
            } else {
                console.log(`✅ Senha de "${user.nome}" convertida com sucesso.`);
                sucessos++;
            }
        } catch (err) {
            console.error(`💥 Erro fatal no usuário "${user.nome}":`, err.message);
            erros++;
        }
    }

    console.log('\n--- Resultado da Migração ---');
    console.log(`✅ Sucessos: ${sucessos}`);
    console.log(`❌ Erros: ${erros}`);
    console.log('------------------------------');
    
    if (erros === 0) {
        console.log('🚀 Migração concluída com sucesso!');
    } else {
        console.log('⚠️ Migração concluída com alguns erros. Verifique os logs acima.');
    }
}

migratePasswords();
