
const { createClient } = require('@supabase/supabase-js');
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function run() {
    console.log('Cleaning duplicates...');
    try {
        const { data, error } = await s.from('op_escala_diaria').select('id, colaborador_id, data_plantao');
        if (error) throw error;
        
        const seen = new Set();
        for (const r of data) {
            const key = `${r.colaborador_id}|${r.data_plantao}`;
            if (seen.has(key)) {
                await s.from('op_escala_diaria').delete().eq('id', r.id);
                console.log('Deleted duplicate:', r.id);
            } else {
                seen.add(key);
            }
        }
        console.log('Cleanup finished successfully.');
    } catch (e) {
        console.error('Cleanup failed:', e.message);
    }
}
run();
