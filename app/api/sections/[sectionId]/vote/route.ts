import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { PollConfig } from "@/lib/types";

// POST /api/sections/[sectionId]/vote — Participant (session_id). Submit/toggle vote.
// Logika: kalau vote_type = single, hapus vote lama voter tsb di section ini sebelum
// insert baru; kalau multiple, toggle (insert kalau belum ada, delete kalau sudah ada).
export async function POST(
  request: Request,
  { params }: { params: { sectionId: string } }
) {
  const admin = createAdminClient();

  const { data: section, error: sectionError } = await admin
    .from("board_sections")
    .select("id, type, board_id, config")
    .eq("id", params.sectionId)
    .maybeSingle();

  if (sectionError) return NextResponse.json({ error: sectionError.message }, { status: 500 });
  if (!section) return NextResponse.json({ error: "Section tidak ditemukan" }, { status: 404 });
  if (section.type !== "poll") {
    return NextResponse.json({ error: "Section ini bukan poll" }, { status: 400 });
  }

  const config = section.config as PollConfig;
  if (!config.is_open) {
    return NextResponse.json({ error: "Poll ini sudah ditutup" }, { status: 403 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) ?? {};
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const optionId = typeof body.option_id === "string" ? body.option_id : null;
  const voterSessionId =
    typeof body.voter_session_id === "string" && body.voter_session_id.length > 0
      ? body.voter_session_id
      : null;

  if (!optionId) {
    return NextResponse.json({ error: "option_id wajib diisi" }, { status: 400 });
  }
  if (!voterSessionId) {
    return NextResponse.json({ error: "voter_session_id wajib diisi" }, { status: 400 });
  }

  const { data: option, error: optionError } = await admin
    .from("poll_options")
    .select("id")
    .eq("id", optionId)
    .eq("section_id", params.sectionId)
    .maybeSingle();

  if (optionError) return NextResponse.json({ error: optionError.message }, { status: 500 });
  if (!option) {
    return NextResponse.json({ error: "option_id tidak ditemukan di section ini" }, { status: 404 });
  }

  if (config.vote_type === "single") {
    // Replace any existing vote by this voter in this section with the new one.
    await admin
      .from("poll_votes")
      .delete()
      .eq("section_id", params.sectionId)
      .eq("voter_session_id", voterSessionId);

    const { data, error } = await admin
      .from("poll_votes")
      .insert({
        board_id: section.board_id,
        section_id: params.sectionId,
        option_id: optionId,
        voter_session_id: voterSessionId,
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ action: "voted", vote: data }, { status: 201 });
  }

  // multiple-choice: toggle this specific option on/off for this voter.
  const { data: existingVote } = await admin
    .from("poll_votes")
    .select("id")
    .eq("option_id", optionId)
    .eq("voter_session_id", voterSessionId)
    .maybeSingle();

  if (existingVote) {
    const { error } = await admin.from("poll_votes").delete().eq("id", existingVote.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ action: "unvoted" });
  }

  const { data, error } = await admin
    .from("poll_votes")
    .insert({
      board_id: section.board_id,
      section_id: params.sectionId,
      option_id: optionId,
      voter_session_id: voterSessionId,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ action: "voted", vote: data }, { status: 201 });
}
