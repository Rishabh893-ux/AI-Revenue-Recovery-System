// Public-only Supabase client for the frontend.
//
// IMPORTANT: this file must NEVER receive a service_role key. Only the
// project URL and the anon/publishable key belong here — both are safe to
// ship to the browser because Supabase Row Level Security enforces what
// they're allowed to read or write. All privileged operations (creating
// orders, verifying payments, writing recovery actions) happen on the
// backend with the service_role key, never here.
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

let supabase = null;

if (supabaseUrl && supabaseAnonKey) {
  supabase = createClient(supabaseUrl, supabaseAnonKey);
} else {
  // Frontend can still run fully on mock data / backend API without Supabase
  // configured, so we warn instead of throwing.
  console.warn(
    "Supabase env vars are missing (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY). " +
      "Supabase-backed reads will be skipped."
  );
}

export { supabase };
