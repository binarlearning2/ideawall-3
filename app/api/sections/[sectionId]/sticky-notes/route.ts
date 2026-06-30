import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { clampText } from "@/lib/utils";
import { isRateLimited } from "@/lib/rate-limit";
import { STICKY_COLORS } from "@/lib/types";

// POST /api/sections/[sectionId]/sticky-notes — Participant (session_id). Buat sticky note
// baru di section (wall/matrix).
export async function POST(
  request: Request,
  { params }: { params: { sectionId: string } }
) {
  const admin = createAdminClient();

  const { data: section, error: sectionError } = await admin
    .from("board_sections")
    .select("id, type, board_id, boards!inner(status)")
    .eq("id", params.sectionId)
    .maybeSingle();

  if (sectionError) return NextResponse.json({ error: sectionError.message }, { status: 500 });
  if (!section) return NextResponse.json({ error: "Section tidak ditemukan" }, { status: 404 });
  if (section.type !== "wall" && section.type !== "matrix") {
    return NextResponse.json(
      { error: "Sticky note hanya bisa dibuat di section Wall atau Matrix" },
      { status: 400 }
    );
  }
  // @ts-expect-error joined relation typing
  if (section.boards.status === "archived") {
    return NextResponse.json(
      { error: "Board ini sudah ditutup, tidak bisa posting baru" },
      { status: 403 }
    );
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) ?? {};
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const content = clampText(body.content, 280);
  const authorName = clampText(body.author_name, 50);
  const authorSessionId =
    typeof body.author_session_id === "string" && body.author_session_id.length > 0
      ? body.author_session_id
      : null;
  const color = typeof body.color === "string" ? body.color : STICKY_COLORS[0];

  if (!content) {
    return NextResponse.json(
      { error: "content wajib diisi (1-280 karakter)" },
      { status: 400 }
    );
  }
  if (!authorName) {
    return NextResponse.json(
      { error: "author_name wajib diisi (1-50 karakter)" },
      { status: 400 }
    );
  }
  if (!authorSessionId) {
    return NextResponse.json({ error: "author_session_id wajib diisi" }, { status: 400 });
  }
  if (!STICKY_COLORS.includes(color as (typeof STICKY_COLORS)[number])) {
    return NextResponse.json({ error: "color harus salah satu dari preset" }, { status: 400 });
  }

  if (isRateLimited(`sticky-note:${authorSessionId}`)) {
    return NextResponse.json(
      { error: "Terlalu banyak sticky note dalam waktu singkat, coba lagi sebentar" },
      { status: 429 }
    );
  }

  const insertPayload: Record<string, unknown> = {
    board_id: section.board_id,
    section_id: section.id,
    content,
    color,
    author_name: authorName,
    author_session_id: authorSessionId,
  };

  if (section.type === "wall") {
    const posX = typeof body.position_x === "number" ? body.position_x : Math.random() * 0.7 + 0.1;
    const posY = typeof body.position_y === "number" ? body.position_y : Math.random() * 0.7 + 0.1;
    insertPayload.position_x = Math.min(Math.max(posX, 0), 1);
    insertPayload.position_y = Math.min(Math.max(posY, 0), 1);
  } else {
    const quadrant = body.quadrant_index;
    if (![1, 2, 3, 4].includes(quadrant as number)) {
      return NextResponse.json(
        { error: "quadrant_index wajib diisi (1-4) untuk section Matrix" },
        { status: 400 }
      );
    }
    insertPayload.quadrant_index = quadrant;
  }

  const { data, error } = await admin
    .from("sticky_notes")
    .insert(insertPayload)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
