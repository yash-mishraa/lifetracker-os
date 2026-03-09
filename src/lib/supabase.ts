import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

export const isSupabaseConfigured = () => {
  return (
    supabaseUrl !== "" &&
    supabaseUrl !== "your-supabase-url-here" &&
    supabaseUrl.startsWith("http") &&
    supabaseAnonKey !== "" &&
    supabaseAnonKey !== "your-supabase-anon-key-here"
  );
};

// Only create the client if configured
export const supabase = isSupabaseConfigured() 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null as any;
