const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../../.env.local') });
console.log("SUPABASE_URL=" + process.env.SUPABASE_URL);
console.log("SUPABASE_SERVICE_ROLE_KEY=" + process.env.SUPABASE_SERVICE_ROLE_KEY);
