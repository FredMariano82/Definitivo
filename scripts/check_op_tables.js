
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function listTables() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  const { data, error } = await supabase
    .from('pg_tables')
    .select('tablename')
    .filter('schemaname', 'eq', 'public');

  if (error) {
    // If pg_tables is not public, try a direct query
    const { data: data2, error: error2 } = await supabase.rpc('get_tables');
    if (error2) {
      console.log('Error listing tables. Trying to query a known table.');
      const { data: data3, error: error3 } = await supabase.from('op_postos').select('*').limit(1);
      if (error3) console.log('op_postos not found.');
      else console.log('op_postos exists.');
    } else {
      console.log('Tables:', data2);
    }
  } else {
    console.log('Tables:', data);
  }
}

listTables();
