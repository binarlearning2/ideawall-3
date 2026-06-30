"use client";

import { useState } from "react";
import { BoardContainer } from "@/components/board/BoardContainer";
import { getOrCreateSessionId } from "@/lib/session";
import type { Board, BoardSection, PollOption, PollVote, StickyNote } from "@/lib/types";

interface SessionizedBoardContainerProps {
  board: Board;
  sections: BoardSection[];
  stickyNotes: StickyNote[];
  pollOptions: PollOption[];
  pollVotes: PollVote[];
  isOwner: boolean;
  authorName: string;
}

export function SessionizedBoardContainer(props: SessionizedBoardContainerProps) {
  const [sessionId] = useState(() => getOrCreateSessionId(props.board.id));

  return (
    <BoardContainer
      initialBoard={props.board}
      initialSections={props.sections}
      initialStickyNotes={props.stickyNotes}
      initialPollOptions={props.pollOptions}
      initialPollVotes={props.pollVotes}
      isOwner={props.isOwner}
      sessionId={sessionId}
      authorName={props.authorName}
    />
  );
}
