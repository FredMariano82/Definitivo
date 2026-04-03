const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error("❌ Faltam variáveis de ambiente (URL ou SERVICE_ROLE_KEY)");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function setupStorage() {
  console.log("Creating 'kanban-attachments' bucket...");
  const { data, error } = await supabase.storage.createBucket('kanban-attachments', {
    public: true,
    fileSizeLimit: 5242880, // 5MB
    allowedMimeTypes: ['image/png', 'image/jpeg', 'image/jpg', 'image/webp']
  });

  if (error) {
    if (error.message.includes('already exists')) {
      console.log("✅ Bucket já existe.");
    } else {
      console.error("❌ Erro ao criar bucket:", error);
    }
  } else {
    console.log("✅ Bucket criado com sucesso:", data.name);
  }
}

async function addDatabaseColumn() {
  console.log("Adding 'foto_url' column to 'kanban_tarefas'...");
  // Note: Using RPC or raw SQL via Supabase JS is limited. 
  // We'll try to run a simple update to check if the column exists first, 
  // but the best way is usually the SQL Editor. 
  // However, I can try to use a "dummy" query to see if it fails.
  
  const { error } = await supabase.from('kanban_tarefas').select('foto_url').limit(1);
  
  if (error && error.code === '42703') { // Undefined column
    console.log("Column 'foto_url' does not exist. Please add it via SQL Editor:");
    console.log("ALTER TABLE kanban_tarefas ADD COLUMN IF NOT EXISTS foto_url TEXT;");
    
    // I will try to use the 'sql' rpc if it exists, though unlikely in a default setup
    const { error: sqlError } = await supabase.rpc('exec_sql', { sql: "ALTER TABLE kanban_tarefas ADD COLUMN IF NOT EXISTS foto_url TEXT;" });
    if (sqlError) {
      console.warn("⚠️ Could not add column automatically via RPC. Please use the SQL Editor.");
    } else {
      console.log("✅ Column added via RPC.");
    }
  } else if (!error) {
    console.log("✅ Column 'foto_url' already exists.");
  } else {
    console.error("❌ Unexpected error checking column:", error);
  }
}

async function run() {
  await setupStorage();
  await addDatabaseColumn();
}

run();
