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

async function test() {
  console.log("Testing tasks table:");
  const { data: tasks, error: taskErr } = await supabase.from('tasks').select('*').limit(1);
  if (taskErr) console.error("Tasks error:", taskErr.message);
  else console.log("Tasks ok, length:", tasks.length);

  console.log("Testing habits table:");
  const { data: habits, error: habitErr } = await supabase.from('habits').select('*').limit(1);
  if (habitErr) console.error("Habits error:", habitErr.message);
  else console.log("Habits ok, length:", habits.length);
}

test();
