
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkNotNull() {
  const { data, error } = await supabase
    .rpc('get_table_info', { table_name: 'op_equipe' });
    
  if (error) {
    // If RPC fails, just list columns and try to update with dummy values
    console.log('Trying to update columns one by one...');
    const colabs = await supabase.from('op_equipe').select('id').limit(1);
    const id = colabs.data[0].id;

    const fields = ['data_inicio_ferias', 'data_fim_ferias', 'referencia_escala', 'tipo_escala'];
    for (const f of fields) {
        const update = {};
        update[f] = null;
        const { error: err } = await supabase.from('op_equipe').update(update).eq('id', id);
        if (err) {
            console.log(`Column ${f} is NOT NULL (Error: ${err.message})`);
        } else {
            console.log(`Column ${f} can be NULL`);
        }
    }
  } else {
    console.log('Table info:', data);
  }
}

checkNotNull();
