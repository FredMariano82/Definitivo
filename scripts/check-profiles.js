const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkProfiles() {
  const { data, error } = await supabase
    .from('perfil_usuarios')
    .select('perfil')
  
  if (error) {
    console.error(error)
    return
  }
  
  const profiles = [...new Set(data.map(p => p.perfil))]
  console.log('Profiles found:', profiles)
}

checkProfiles()
