import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Missing Supabase credentials in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const TABLES = [
  'tasks',
  'habits',
  'habit_logs',
  'health_logs',
  'goals',
  'milestones',
  'time_logs'
];

async function verifyTables() {
  console.log("Verifying Supabase Schema...");
  let allGood = true;

  for (const table of TABLES) {
    const { error } = await supabase.from(table).select('id').limit(1);
    
    if (error) {
      console.log(`❌ Table '${table}' check failed: ${error.message} (Code: ${error.code})`);
      allGood = false;
    } else {
      console.log(`✅ Table '${table}' is accessible and synced.`);
    }
  }

  if (allGood) {
    console.log("\nSUCCESS: All tables are fully synced and functional in Supabase!");
  } else {
    console.log("\nWARNING: Some tables are missing or not synced properly. Check the SQL schemas.");
    process.exit(1);
  }
}

verifyTables();
