const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });
const { createClient } = require('@supabase/supabase-js');

async function cleanUpDuplicatedThiago() {
    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

    console.log('🔍 Buscando registros duplicados de Thiago Barros em status revisar...');

    const { data: records, error } = await supabase
        .from('prestadores')
        .select('id, doc1, checagem')
        .eq('nome', 'Thiago Barros')
        .eq('checagem', 'revisar');

    if (error) {
        console.error('❌ Erro ao buscar registros:', error.message);
        return;
    }

    if (!records || records.length === 0) {
        console.log('✅ Nenhum registro em conflito encontrado.');
        return;
    }

    console.log(`📊 Encontrados ${records.length} registros:`, records);

    for (const r of records) {
        if (r.doc1 === '753159') {
            console.log(`🧹 Removendo registro antigo (ID: ${r.id}, Doc: ${r.doc1}) da fila de revisão...`);
            const { error: upError } = await supabase
                .from('prestadores')
                .update({ checagem: 'antigo' })
                .eq('id', r.id);

            if (upError) {
                console.error(`❌ Erro ao atualizar ID ${r.id}:`, upError.message);
            } else {
                console.log(`✅ Registro ${r.id} movido para status 'antigo'.`);
            }
        }
    }
}

cleanUpDuplicatedThiago();
