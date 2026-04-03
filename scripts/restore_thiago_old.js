const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });
const { createClient } = require('@supabase/supabase-js');

async function restoreOldThiago() {
    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

    console.log('🔄 Restaurando status do Thiago Barros (Doc1: 753159) para aprovado...');

    const { data: records, error } = await supabase
        .from('prestadores')
        .select('id, doc1, checagem')
        .eq('nome', 'Thiago Barros')
        .eq('doc1', '753159');

    if (error) {
        console.error('❌ Erro ao buscar:', error.message);
        return;
    }

    if (!records || records.length === 0) {
        console.log('⚠️ Registro 753159 não encontrado.');
    } else {
        for (const r of records) {
            console.log(`✅ Atualizando ID ${r.id} para aprovado...`);
            const { error: upError } = await supabase
                .from('prestadores')
                .update({ checagem: 'aprovado', observacoes: null })
                .eq('id', r.id);

            if (upError) {
                console.error(`❌ Erro ao atualizar ID ${r.id}:`, upError.message);
            } else {
                console.log(`✨ Sucesso! ID ${r.id} restaurado.`);
            }
        }
    }

    console.log('---');
    console.log('🔍 Conferindo o estado da nova solicitação (Doc1: 307495)...');

    const { data: recordsNew, error: errorNew } = await supabase
        .from('prestadores')
        .select('id, doc1, checagem, observacoes')
        .eq('nome', 'Thiago Barros')
        .eq('doc1', '307495');

    if (recordsNew && recordsNew.length > 0) {
        console.log('Nueva solicitación (revisar):', recordsNew[0]);
    }
}

restoreOldThiago();
