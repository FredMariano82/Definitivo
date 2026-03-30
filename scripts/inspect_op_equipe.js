
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectSchema() {
  const { data, error } = await supabase.rpc('get_table_info', { table_name: 'op_equipe' });
  
  if (error) {
    // If RPC doesn't exist, try a simple select to see column names
    console.log('RPC get_table_info not found, falling back to column selection...');
    const { data: cols, error: err } = await supabase.from('op_equipe').select('*').limit(1);
    if (err) {
      console.error('Erro ao buscar colunas:', err.message);
    } else {
      console.log('Colunas encontradas:', Object.keys(cols[0]));
    }
  } else {
    console.log('Schema info:', data);
  }
}

inspectSchema();
