import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Service-role Supabase client. Bypasses RLS entirely — SERVER ONLY, never import this
 * from a Client Component or expose SUPABASE_SERVICE_ROLE_KEY to the browser.
 *
 * Used for:
 * - Resolving join_code -> board (so the boards table doesn't need to be publicly
 *   queryable by join_code via the anon key, which would allow code-guessing scans).
 * - Sticky note / poll vote writes, where the actor (a participant) has no Supabase Auth
 *   session — author/voter identity is instead checked in application code against
 *   author_session_id / voter_session_id supplied by the client.
 */
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
