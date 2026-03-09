import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Missing credentials");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function createHealthTable() {
  console.log("Creating health_logs table via SQL query...");
  // Note: The anon key cannot run DDL queries like CREATE TABLE directly
  // through the standard PostgREST API. The user must run the supabase-health-schema.sql
  // in their Supabase dashboard's SQL Editor!
  // BUT we can test if it exists:
  const { data, error } = await supabase.from('health_logs').select('id').limit(1);
  if (error) {
    console.error("Health logs table does not exist or error:", error.message);
  } else {
    console.log("Health logs table exists!");
  }
}

createHealthTable();
