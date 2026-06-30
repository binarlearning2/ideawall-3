import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { clampText } from "@/lib/utils";

async function getOwnedSection(
  supabase: ReturnType<typeof createClient>,
  sectionId: string,
  userId: string
) {
  const { data, error } = await supabase
    .from("board_sections")
    .select("*, boards!inner(owner_id)")
    .eq("id", sectionId)
    .maybeSingle();

  if (error) return { section: null, error: error.message, status: 500 };
  if (!data) return { section: null, error: "Section tidak ditemukan", status: 404 };
  if (data.boards.owner_id !== userId) {
    return { section: null, error: "Forbidden", status: 403 };
  }

  return { section: data, error: null, status: 200 };
}

// PATCH /api/sections/[sectionId] — Owner only. Update title/config/order_index.
export async function PATCH(
  request: Request,
  { params }: { params: { sectionId: string } }
) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { section, error, status } = await getOwnedSection(
    supabase,
    params.sectionId,
    user.id
  );
  if (!section) return NextResponse.json({ error }, { status });

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) ?? {};
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const update: Record<string, unknown> = {};

  if (body.title !== undefined) {
    const title = clampText(body.title, 100);
    if (!title) return NextResponse.json({ error: "title tidak valid" }, { status: 400 });
    update.title = title;
  }

  if (body.order_index !== undefined) {
    if (typeof body.order_index !== "number") {
      return NextResponse.json({ error: "order_index harus number" }, { status: 400 });
    }
    update.order_index = body.order_index;
  }

  if (body.config !== undefined) {
    if (typeof body.config !== "object" || body.config === null) {
      return NextResponse.json({ error: "config harus object" }, { status: 400 });
    }
    // Merge rather than replace, so partial updates (e.g. just is_open) don't wipe
    // other fields like question/axis labels.
    update.config = { ...(section.config as Record<string, unknown>), ...(body.config as Record<string, unknown>) };
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "Tidak ada field untuk diupdate" }, { status: 400 });
  }

  const { data, error: updateError } = await supabase
    .from("board_sections")
    .update(update)
    .eq("id", params.sectionId)
    .select()
    .single();

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  // Sync poll_options if the caller sent a full options array to add/edit/remove options.
  if (section.type === "poll" && Array.isArray(body.options)) {
    const incoming = body.options as Array<{ id?: string; label: string; order_index?: number }>;

    const { data: existingOptions } = await supabase
      .from("poll_options")
      .select("id")
      .eq("section_id", params.sectionId);
    const existingIds = new Set((existingOptions ?? []).map((o) => o.id));
    const incomingIds = new Set(incoming.filter((o) => o.id).map((o) => o.id));

    const toDelete = [...existingIds].filter((id) => !incomingIds.has(id));
    if (toDelete.length > 0) {
      await supabase.from("poll_options").delete().in("id", toDelete);
    }

    for (const [idx, opt] of incoming.entries()) {
      const label = clampText(opt.label, 150);
      if (!label) continue;
      if (opt.id && existingIds.has(opt.id)) {
        await supabase
          .from("poll_options")
          .update({ label, order_index: opt.order_index ?? idx })
          .eq("id", opt.id);
      } else {
        await supabase
          .from("poll_options")
          .insert({ section_id: params.sectionId, label, order_index: opt.order_index ?? idx });
      }
    }
  }

  return NextResponse.json(data);
}

// DELETE /api/sections/[sectionId] — Owner only. Hapus section (cascade).
export async function DELETE(
  _request: Request,
  { params }: { params: { sectionId: string } }
) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { section, error, status } = await getOwnedSection(
    supabase,
    params.sectionId,
    user.id
  );
  if (!section) return NextResponse.json({ error }, { status });

  const { error: deleteError } = await supabase
    .from("board_sections")
    .delete()
    .eq("id", params.sectionId);

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
