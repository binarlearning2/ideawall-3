import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { clampText, DEFAULT_MATRIX_CONFIG } from "@/lib/utils";
import type { SectionType } from "@/lib/types";

const VALID_TYPES: SectionType[] = ["wall", "poll", "matrix"];

// POST /api/boards/[boardId]/sections — Owner only. Tambah section baru (type, title, config awal).
export async function POST(
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

  const { data: board, error: boardError } = await supabase
    .from("boards")
    .select("id, owner_id")
    .eq("id", params.boardId)
    .maybeSingle();

  if (boardError) return NextResponse.json({ error: boardError.message }, { status: 500 });
  if (!board) return NextResponse.json({ error: "Board tidak ditemukan" }, { status: 404 });
  if (board.owner_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) ?? {};
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const type = body.type as SectionType;
  if (!VALID_TYPES.includes(type)) {
    return NextResponse.json(
      { error: "type harus salah satu dari: wall, poll, matrix" },
      { status: 400 }
    );
  }

  const title = clampText(body.title, 100);
  if (!title) {
    return NextResponse.json({ error: "title wajib diisi (1-100 karakter)" }, { status: 400 });
  }

  // Determine order_index: append to end by default.
  const { count } = await supabase
    .from("board_sections")
    .select("id", { count: "exact", head: true })
    .eq("board_id", params.boardId);
  const orderIndex =
    typeof body.order_index === "number" ? body.order_index : count ?? 0;

  let config: Record<string, unknown> = {};
  let initialOptions: string[] = [];

  if (type === "wall") {
    config = {};
  } else if (type === "matrix") {
    const provided = (body.config ?? {}) as Record<string, unknown>;
    config = {
      axis_x_label:
        typeof provided.axis_x_label === "string" && provided.axis_x_label.trim()
          ? provided.axis_x_label.trim()
          : DEFAULT_MATRIX_CONFIG.axis_x_label,
      axis_y_label:
        typeof provided.axis_y_label === "string" && provided.axis_y_label.trim()
          ? provided.axis_y_label.trim()
          : DEFAULT_MATRIX_CONFIG.axis_y_label,
      quadrant_labels:
        provided.quadrant_labels && typeof provided.quadrant_labels === "object"
          ? provided.quadrant_labels
          : DEFAULT_MATRIX_CONFIG.quadrant_labels,
    };
  } else if (type === "poll") {
    const provided = (body.config ?? {}) as Record<string, unknown>;
    const question = clampText(provided.question, 300) ?? "";
    if (!question) {
      return NextResponse.json(
        { error: "config.question wajib diisi untuk poll" },
        { status: 400 }
      );
    }
    const voteType = provided.vote_type === "multiple" ? "multiple" : "single";
    const rawOptions = Array.isArray(provided.options) ? provided.options : [];
    initialOptions = rawOptions
      .map((o) => (typeof o === "string" ? o.trim() : ""))
      .filter((label) => label.length > 0 && label.length <= 150);

    if (initialOptions.length < 2) {
      return NextResponse.json(
        { error: "Poll butuh minimal 2 opsi jawaban" },
        { status: 400 }
      );
    }
    if (initialOptions.length > 10) {
      return NextResponse.json(
        { error: "Poll maksimal 10 opsi jawaban" },
        { status: 400 }
      );
    }

    config = { question, vote_type: voteType, is_open: true };
  }

  const { data: section, error: sectionError } = await supabase
    .from("board_sections")
    .insert({
      board_id: params.boardId,
      type,
      title,
      order_index: orderIndex,
      config,
    })
    .select()
    .single();

  if (sectionError) {
    return NextResponse.json({ error: sectionError.message }, { status: 500 });
  }

  if (type === "poll" && initialOptions.length > 0) {
    const { data: optionRows, error: optionsError } = await supabase
      .from("poll_options")
      .insert(
        initialOptions.map((label, idx) => ({
          section_id: section.id,
          label,
          order_index: idx,
        }))
      )
      .select();

    if (optionsError) {
      // Roll back the orphaned section so we don't leave a poll with no options.
      await supabase.from("board_sections").delete().eq("id", section.id);
      return NextResponse.json({ error: optionsError.message }, { status: 500 });
    }

    return NextResponse.json({ ...section, poll_options: optionRows }, { status: 201 });
  }

  return NextResponse.json(section, { status: 201 });
}
