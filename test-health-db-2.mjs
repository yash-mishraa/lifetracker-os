import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testHealthTable() {
  console.log("Checking health_logs table with select(*)...");
  const { data, error } = await supabase.from('health_logs').select('*').limit(1);
  if (error) {
    console.error("Error:", error.message);
  } else {
    console.log("Table exists! Data:", data);
  }
}

testHealthTable();
