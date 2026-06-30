"use client";

import { useEffect, useState } from "react";
import { NameEntryForm } from "@/components/NameEntryForm";
import { SessionizedBoardContainer } from "@/components/board/SessionizedBoardContainer";
import { getStoredName, setStoredName } from "@/lib/session";
import type { Board, BoardSection, PollOption, PollVote, StickyNote } from "@/lib/types";

interface ParticipantBoardClientProps {
  board: Board;
  sections: BoardSection[];
  stickyNotes: StickyNote[];
  pollOptions: PollOption[];
  pollVotes: PollVote[];
}

export function ParticipantBoardClient(props: ParticipantBoardClientProps) {
  const [name, setName] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    setName(getStoredName(props.board.id));
    setChecked(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!checked) return null;

  if (!name) {
    return (
      <NameEntryForm
        boardTitle={props.board.title}
        onJoin={(joinedName) => {
          setStoredName(props.board.id, joinedName);
          setName(joinedName);
        }}
      />
    );
  }

  return (
    <main className="mx-auto max-w-5xl px-6 py-8">
      <h1 className="mb-6 text-2xl font-bold text-slate-900">{props.board.title}</h1>
      <SessionizedBoardContainer
        board={props.board}
        sections={props.sections}
        stickyNotes={props.stickyNotes}
        pollOptions={props.pollOptions}
        pollVotes={props.pollVotes}
        isOwner={false}
        authorName={name}
      />
    </main>
  );
}
