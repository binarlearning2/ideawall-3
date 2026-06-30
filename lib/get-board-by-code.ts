import { createAdminClient } from "@/lib/supabase/admin";
import type { Board } from "@/lib/types";

/**
 * Server-side only helper (Server Components / Route Handlers), mirrors the logic in
 * /api/boards/by-code/[joinCode] but used directly during SSR to avoid an extra HTTP
 * round-trip to our own API. Uses the service role client for the same reason as that
 * route: join_code lookups should not be exposed as an anon-queryable RLS policy.
 */
export async function getBoardByJoinCode(joinCode: string): Promise<Board | null> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("boards")
    .select("*")
    .eq("join_code", joinCode.toUpperCase())
    .maybeSingle();

  return (data as Board) ?? null;
}
