import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { BoardSettingsPanel } from "@/components/board/BoardSettingsPanel";
import { SessionizedBoardContainer } from "@/components/board/SessionizedBoardContainer";
import type { Board, BoardSection, PollOption, PollVote, StickyNote } from "@/lib/types";

export default async function OwnerBoardPage({
  params,
}: {
  params: { boardId: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  const { data: board } = await supabase
    .from("boards")
    .select("*")
    .eq("id", params.boardId)
    .maybeSingle();

  if (!board) notFound();
  if ((board as Board).owner_id !== user.id) {
    // Logged-in but not the owner: treat like a participant instead.
    redirect(`/b/${(board as Board).join_code}`);
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", user.id)
    .maybeSingle();

  const [{ data: sections }, { data: stickyNotes }, { data: pollVotes }] = await Promise.all([
    supabase
      .from("board_sections")
      .select("*")
      .eq("board_id", params.boardId)
      .order("order_index", { ascending: true }),
    supabase.from("sticky_notes").select("*").eq("board_id", params.boardId),
    supabase.from("poll_votes").select("*").eq("board_id", params.boardId),
  ]);

  const sectionIds = (sections ?? []).map((s) => s.id);
  const { data: pollOptions } =
    sectionIds.length > 0
      ? await supabase.from("poll_options").select("*").in("section_id", sectionIds)
      : { data: [] as PollOption[] };

  return (
    <main className="mx-auto max-w-5xl px-6 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <Link href="/boards" className="text-xs text-slate-400 hover:underline">
            ← My Boards
          </Link>
          <h1 className="text-2xl font-bold text-slate-900">{(board as Board).title}</h1>
        </div>
      </div>

      <div className="mb-6">
        <BoardSettingsPanel board={board as Board} />
      </div>

      <SessionizedBoardContainer
        board={board as Board}
        sections={(sections ?? []) as BoardSection[]}
        stickyNotes={(stickyNotes ?? []) as StickyNote[]}
        pollOptions={(pollOptions ?? []) as PollOption[]}
        pollVotes={(pollVotes ?? []) as PollVote[]}
        isOwner={true}
        authorName={profile?.display_name ?? user.email ?? "Fasilitator"}
      />
    </main>
  );
}
