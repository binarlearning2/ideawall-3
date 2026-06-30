import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isRateLimited } from "@/lib/rate-limit";
import { isValidJoinCodeFormat } from "@/lib/utils";

// GET /api/boards/by-code/[joinCode] — Public. Resolve join code -> board id + metadata.
// Uses the service role client deliberately: this keeps the `boards` table from needing
// to be queryable BY join_code via the anon key directly, which would let anyone run an
// unthrottled brute-force scan over the 6-character code space. This route applies basic
// rate limiting instead.
export async function GET(
  request: Request,
  { params }: { params: { joinCode: string } }
) {
  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  if (isRateLimited(`join-code-lookup:${ip}`, 30, 60_000)) {
    return NextResponse.json(
      { error: "Terlalu banyak percobaan, coba lagi sebentar lagi" },
      { status: 429 }
    );
  }

  const joinCode = params.joinCode?.toUpperCase();
  if (!joinCode || !isValidJoinCodeFormat(joinCode)) {
    return NextResponse.json({ error: "Kode board tidak valid" }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("boards")
    .select("id, title, status, is_anonymous, join_code")
    .eq("join_code", joinCode)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: "Board tidak ditemukan" }, { status: 404 });
  }

  return NextResponse.json(data);
}
