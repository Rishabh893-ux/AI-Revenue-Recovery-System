// Service-role Supabase client — full read/write access, bypasses Row Level
// Security. This must ONLY ever be used on the backend. Never send this key
// to the frontend; the frontend gets its own client with the anon key.
import { createClient } from "@supabase/supabase-js";
import { env } from "./env.js";

let supabase;

try {
  supabase = createClient(env.supabaseUrl, env.supabaseServiceRoleKey, {
    auth: { persistSession: false },
  });
} catch (err) {
  // env.js already validates SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY's
  // format before this file runs, so if the client still throws, it's a
  // narrower edge case env.js's checks don't cover — surfaced here with
  // enough context to act on immediately instead of a bare library trace.
  throw new Error(
    `[config/supabase] Failed to initialize the Supabase client: ${err.message}\n` +
      "  SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY passed env.js's format checks, so double-check " +
      "the project hasn't been paused or deleted in the Supabase dashboard."
  );
}

export { supabase };
