
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testColumns() {
  const { data: cols } = await supabase.from('op_equipe').select('id').limit(1);
  const id = cols[0].id;

  const fields = ['data_inicio_ferias', 'data_fim_ferias', 'referencia_escala', 'tipo_escala'];
  
  for (const field of fields) {
    const update = {};
    update[field] = null;
    const { error } = await supabase.from('op_equipe').update(update).eq('id', id);
    if (error) {
      console.log(`Column ${field} FAILED (Error: ${error.message})`);
    } else {
      console.log(`Column ${field} PASSED (Can be NULL)`);
    }
  }
}

testColumns();
