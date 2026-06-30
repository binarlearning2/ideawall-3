import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { clampText } from "@/lib/utils";

async function getOwnedBoard(
  supabase: ReturnType<typeof createClient>,
  boardId: string,
  userId: string
) {
  const { data, error } = await supabase
    .from("boards")
    .select("*")
    .eq("id", boardId)
    .maybeSingle();

  if (error) return { board: null, error: error.message, status: 500 };
  if (!data) return { board: null, error: "Board tidak ditemukan", status: 404 };
  if (data.owner_id !== userId)
    return { board: null, error: "Forbidden", status: 403 };

  return { board: data, error: null, status: 200 };
}

// PATCH /api/boards/[boardId] — Owner only. Update title/description/is_anonymous/status.
export async function PATCH(
  request: Request,
  { params }: { params: { boardId: string } }
) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { board, error, status } = await getOwnedBoard(supabase, params.boardId, user.id);
  if (!board) return NextResponse.json({ error }, { status });

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) ?? {};
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const update: Record<string, unknown> = {};

  if (body.title !== undefined) {
    const title = clampText(body.title, 100);
    if (!title) {
      return NextResponse.json({ error: "title tidak valid" }, { status: 400 });
    }
    update.title = title;
  }

  if (body.description !== undefined) {
    update.description =
      typeof body.description === "string" && body.description.trim().length > 0
        ? body.description.trim()
        : null;
  }

  if (body.is_anonymous !== undefined) {
    if (typeof body.is_anonymous !== "boolean") {
      return NextResponse.json({ error: "is_anonymous harus boolean" }, { status: 400 });
    }
    update.is_anonymous = body.is_anonymous;
  }

  if (body.status !== undefined) {
    if (body.status !== "active" && body.status !== "archived") {
      return NextResponse.json(
        { error: "status harus 'active' atau 'archived'" },
        { status: 400 }
      );
    }
    update.status = body.status;
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "Tidak ada field untuk diupdate" }, { status: 400 });
  }

  const { data, error: updateError } = await supabase
    .from("boards")
    .update(update)
    .eq("id", params.boardId)
    .select()
    .single();

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

// DELETE /api/boards/[boardId] — Owner only. Hapus board (cascade ke semua section/note/poll).
export async function DELETE(
  _request: Request,
  { params }: { params: { boardId: string } }
) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { board, error, status } = await getOwnedBoard(supabase, params.boardId, user.id);
  if (!board) return NextResponse.json({ error }, { status });

  const { error: deleteError } = await supabase
    .from("boards")
    .delete()
    .eq("id", params.boardId);

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
