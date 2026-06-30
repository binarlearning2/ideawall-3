import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { getBoardByJoinCode } from "@/lib/get-board-by-code";
import { ParticipantBoardClient } from "@/components/board/ParticipantBoardClient";
import { isValidJoinCodeFormat } from "@/lib/utils";
import type { PollOption } from "@/lib/types";

export default async function JoinPage({ params }: { params: { joinCode: string } }) {
  const joinCode = params.joinCode.toUpperCase();
  if (!isValidJoinCodeFormat(joinCode)) notFound();

  const board = await getBoardByJoinCode(joinCode);
  if (!board) notFound();

  const admin = createAdminClient();

  const [{ data: sections }, { data: stickyNotes }, { data: pollVotes }] = await Promise.all([
    admin.from("board_sections").select("*").eq("board_id", board.id).order("order_index"),
    admin.from("sticky_notes").select("*").eq("board_id", board.id),
    admin.from("poll_votes").select("*").eq("board_id", board.id),
  ]);

  const sectionIds = (sections ?? []).map((s) => s.id);
  const { data: pollOptions } =
    sectionIds.length > 0
      ? await admin.from("poll_options").select("*").in("section_id", sectionIds)
      : { data: [] as PollOption[] };

  return (
    <ParticipantBoardClient
      board={board}
      sections={sections ?? []}
      stickyNotes={stickyNotes ?? []}
      pollOptions={pollOptions ?? []}
      pollVotes={pollVotes ?? []}
    />
  );
}
