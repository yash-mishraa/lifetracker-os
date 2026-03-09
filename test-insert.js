const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function testInsert() {
  console.log("Testing Supabase Insertion...");

  // 1. Authenticate (using a common test user if possible, or just testing the anon rejection)
  // We'll insert a dummy routine to see the EXACT error message from Supabase.
  const dummyRoutine = {
    id: "test-uuid-1234-5678-910111213141",
    user_id: "00000000-0000-0000-0000-000000000000", // dummy
    title: "Test Routine",
    type: "morning",
    created_at: new Date().toISOString()
  };

  const { data, error } = await supabase
    .from('routines')
    .insert(dummyRoutine)
    .select()
    .single();

  if (error) {
    console.error("SUPABASE ERROR:", error);
  } else {
    console.log("SUCCESS:", data);
  }
}

testInsert();
