const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function testQuery() {
  console.log("Checking if routines table is readable...");
  
  // Try to select from routines
  const { data, error } = await supabase.from('routines').select('id').limit(1);

  if (error) {
    console.error("SUPABASE ERROR reading routines:", error);
  } else {
    console.log("SUCCESS reading routines:", data);
  }

  console.log("Checking routine_steps table...");
  const { data: stepData, error: stepError } = await supabase.from('routine_steps').select('id').limit(1);
  if (stepError) {
    console.error("SUPABASE ERROR reading routine_steps:", stepError);
  } else {
    console.log("SUCCESS reading routine_steps:", stepData);
  }

  console.log("Checking routine_logs table...");
  const { data: logData, error: logError } = await supabase.from('routine_logs').select('id').limit(1);
  if (logError) {
    console.error("SUPABASE ERROR reading routine_logs:", logError);
  } else {
    console.log("SUCCESS reading routine_logs:", logData);
  }
}

testQuery();
