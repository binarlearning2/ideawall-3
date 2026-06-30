import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { clampText, generateJoinCode } from "@/lib/utils";

// POST /api/boards — Owner (session login). Buat board baru -> generate join_code unik.
export async function POST(request: Request) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { title: rawTitle, description } = (body ?? {}) as Record<string, unknown>;
  const title = clampText(rawTitle, 100);
  if (!title) {
    return NextResponse.json(
      { error: "title wajib diisi (1-100 karakter)" },
      { status: 400 }
    );
  }

  const safeDescription =
    typeof description === "string" && description.trim().length > 0
      ? description.trim()
      : null;

  // Retry on join_code collision (extremely unlikely with a 6-char alphabet, but cheap to guard).
  const MAX_ATTEMPTS = 5;
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const joinCode = generateJoinCode();

    const { data, error } = await supabase
      .from("boards")
      .insert({
        owner_id: user.id,
        title,
        description: safeDescription,
        join_code: joinCode,
      })
      .select()
      .single();

    if (!error) {
      return NextResponse.json(data, { status: 201 });
    }

    // Unique violation on join_code -> retry with a new code.
    if (error.code !== "23505") {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  return NextResponse.json(
    { error: "Gagal generate join code unik, coba lagi" },
    { status: 500 }
  );
}
