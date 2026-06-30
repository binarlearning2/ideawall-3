import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { clampText } from "@/lib/utils";
import { STICKY_COLORS } from "@/lib/types";

async function authorize(noteId: string, bodyAuthorSessionId: string | null) {
  const admin = createAdminClient();

  const { data: note, error } = await admin
    .from("sticky_notes")
    .select("*, boards!inner(owner_id)")
    .eq("id", noteId)
    .maybeSingle();

  if (error) return { ok: false, status: 500, error: error.message, note: null };
  if (!note) return { ok: false, status: 404, error: "Sticky note tidak ditemukan", note: null };

  if (bodyAuthorSessionId && bodyAuthorSessionId === note.author_session_id) {
    return { ok: true, status: 200, error: null, note };
  }

  // Fall back to owner check via the cookie-based (logged-in) Supabase client.
  const cookieClient = createClient();
  const {
    data: { user },
  } = await cookieClient.auth.getUser();

  if (user && user.id === note.boards.owner_id) {
    return { ok: true, status: 200, error: null, note };
  }

  return { ok: false, status: 403, error: "Forbidden", note: null };
}

// PATCH /api/sticky-notes/[id] — Author (session match) atau owner. Update teks/warna/posisi/kuadran.
export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) ?? {};
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const authorSessionId =
    typeof body.author_session_id === "string" ? body.author_session_id : null;

  const { ok, status, error, note } = await authorize(params.id, authorSessionId);
  if (!ok || !note) return NextResponse.json({ error }, { status });

  const update: Record<string, unknown> = {};

  if (body.content !== undefined) {
    const content = clampText(body.content, 280);
    if (!content) return NextResponse.json({ error: "content tidak valid" }, { status: 400 });
    update.content = content;
  }

  if (body.color !== undefined) {
    if (!STICKY_COLORS.includes(body.color as (typeof STICKY_COLORS)[number])) {
      return NextResponse.json({ error: "color harus salah satu dari preset" }, { status: 400 });
    }
    update.color = body.color;
  }

  if (body.position_x !== undefined) {
    if (typeof body.position_x !== "number")
      return NextResponse.json({ error: "position_x harus number" }, { status: 400 });
    update.position_x = Math.min(Math.max(body.position_x, 0), 1);
  }

  if (body.position_y !== undefined) {
    if (typeof body.position_y !== "number")
      return NextResponse.json({ error: "position_y harus number" }, { status: 400 });
    update.position_y = Math.min(Math.max(body.position_y, 0), 1);
  }

  if (body.quadrant_index !== undefined) {
    if (![1, 2, 3, 4].includes(body.quadrant_index as number)) {
      return NextResponse.json({ error: "quadrant_index harus 1-4" }, { status: 400 });
    }
    update.quadrant_index = body.quadrant_index;
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "Tidak ada field untuk diupdate" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data, error: updateError } = await admin
    .from("sticky_notes")
    .update(update)
    .eq("id", params.id)
    .select()
    .single();

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

// DELETE /api/sticky-notes/[id] — Author (session match) atau owner.
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  let authorSessionId: string | null = null;
  try {
    const url = new URL(request.url);
    authorSessionId = url.searchParams.get("author_session_id");
  } catch {
    // ignore, treated as no session id provided
  }

  const { ok, status, error } = await authorize(params.id, authorSessionId);
  if (!ok) return NextResponse.json({ error }, { status });

  const admin = createAdminClient();
  const { error: deleteError } = await admin.from("sticky_notes").delete().eq("id", params.id);

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
