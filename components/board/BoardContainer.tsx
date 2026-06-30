"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { SectionTabs } from "@/components/board/SectionTabs";
import { AddSectionForm } from "@/components/board/AddSectionForm";
import { WallSection } from "@/components/board/WallSection";
import { PollSection } from "@/components/board/PollSection";
import { MatrixSection } from "@/components/board/MatrixSection";
import type {
  Board,
  BoardSection,
  MatrixConfig,
  PollConfig,
  PollOption,
  PollVote,
  SectionType,
  StickyNote,
} from "@/lib/types";

interface BoardContainerProps {
  initialBoard: Board;
  initialSections: BoardSection[];
  initialStickyNotes: StickyNote[];
  initialPollOptions: PollOption[];
  initialPollVotes: PollVote[];
  isOwner: boolean;
  sessionId: string;
  authorName: string;
}

export function BoardContainer({
  initialBoard,
  initialSections,
  initialStickyNotes,
  initialPollOptions,
  initialPollVotes,
  isOwner,
  sessionId,
  authorName,
}: BoardContainerProps) {
  const [board, setBoard] = useState(initialBoard);
  const [sections, setSections] = useState(initialSections);
  const [notes, setNotes] = useState(initialStickyNotes);
  const [pollOptions, setPollOptions] = useState(initialPollOptions);
  const [pollVotes, setPollVotes] = useState(initialPollVotes);
  const [activeSectionId, setActiveSectionId] = useState<string | null>(
    [...initialSections].sort((a, b) => a.order_index - b.order_index)[0]?.id ?? null
  );
  // Tracks this board's section IDs for filtering cross-board realtime events.
  const boardSectionIdsRef = useRef(new Set(initialSections.map((s) => s.id)));

  // ---- Realtime subscription (PRD §9.2): one channel per board ----
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`board:${board.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "sticky_notes", filter: `board_id=eq.${board.id}` },
        (payload) => {
          if (payload.eventType === "INSERT") {
            const newNote = payload.new as StickyNote;
            setNotes((prev) => (prev.some((n) => n.id === newNote.id) ? prev : [...prev, newNote]));
          } else if (payload.eventType === "UPDATE") {
            const updated = payload.new as StickyNote;
            setNotes((prev) => prev.map((n) => (n.id === updated.id ? updated : n)));
          } else if (payload.eventType === "DELETE") {
            const removed = payload.old as { id: string };
            setNotes((prev) => prev.filter((n) => n.id !== removed.id));
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "poll_votes", filter: `board_id=eq.${board.id}` },
        (payload) => {
          if (payload.eventType === "INSERT") {
            const newVote = payload.new as PollVote;
            setPollVotes((prev) => (prev.some((v) => v.id === newVote.id) ? prev : [...prev, newVote]));
          } else if (payload.eventType === "DELETE") {
            const removed = payload.old as { id: string };
            setPollVotes((prev) => prev.filter((v) => v.id !== removed.id));
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "board_sections", filter: `board_id=eq.${board.id}` },
        (payload) => {
          if (payload.eventType === "INSERT") {
            const newSection = payload.new as BoardSection;
            boardSectionIdsRef.current.add(newSection.id);
            setSections((prev) =>
              prev.some((s) => s.id === newSection.id) ? prev : [...prev, newSection]
            );
            setActiveSectionId((current) => current ?? newSection.id);
          } else if (payload.eventType === "UPDATE") {
            const updated = payload.new as BoardSection;
            setSections((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
          } else if (payload.eventType === "DELETE") {
            const removed = payload.old as { id: string };
            boardSectionIdsRef.current.delete(removed.id);
            setSections((prev) => {
              const remaining = prev.filter((s) => s.id !== removed.id);
              // Auto-select the first remaining section so the board doesn't go blank.
              setActiveSectionId((current) => {
                if (current !== removed.id) return current;
                return [...remaining].sort((a, b) => a.order_index - b.order_index)[0]?.id ?? null;
              });
              return remaining;
            });
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "boards", filter: `id=eq.${board.id}` },
        (payload) => setBoard(payload.new as Board)
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "poll_options" },
        (payload) => {
          if (payload.eventType === "INSERT") {
            const opt = payload.new as PollOption;
            // Only accept options belonging to this board's sections.
            if (!boardSectionIdsRef.current.has(opt.section_id)) return;
            setPollOptions((prev) => (prev.some((o) => o.id === opt.id) ? prev : [...prev, opt]));
          } else if (payload.eventType === "UPDATE") {
            const opt = payload.new as PollOption;
            setPollOptions((prev) => prev.map((o) => (o.id === opt.id ? opt : o)));
          } else if (payload.eventType === "DELETE") {
            const removed = payload.old as { id: string };
            setPollOptions((prev) => prev.filter((o) => o.id !== removed.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [board.id]);

  const activeSection = useMemo(
    () => sections.find((s) => s.id === activeSectionId) ?? null,
    [sections, activeSectionId]
  );

  // ---- API helpers ----
  async function createSection(payload: {
    type: SectionType;
    title: string;
    config?: { question?: string; vote_type?: "single" | "multiple"; options?: string[] };
  }) {
    await fetch(`/api/boards/${board.id}/sections`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  }

  async function deleteSection(sectionId: string) {
    if (!confirm("Hapus section ini beserta semua isinya?")) return;
    await fetch(`/api/sections/${sectionId}`, { method: "DELETE" });
  }

  async function createStickyNote(
    sectionId: string,
    content: string,
    color: string,
    extra: { position_x?: number; position_y?: number; quadrant_index?: number }
  ) {
    await fetch(`/api/sections/${sectionId}/sticky-notes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content,
        color,
        author_name: authorName,
        author_session_id: sessionId,
        ...extra,
      }),
    });
  }

  async function moveStickyNote(noteId: string, body: Record<string, unknown>) {
    await fetch(`/api/sticky-notes/${noteId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...body, author_session_id: sessionId }),
    });
  }

  async function editStickyNoteContent(noteId: string, content: string) {
    await moveStickyNote(noteId, { content });
  }

  async function deleteStickyNote(noteId: string) {
    await fetch(
      `/api/sticky-notes/${noteId}?author_session_id=${encodeURIComponent(sessionId)}`,
      { method: "DELETE" }
    );
  }

  async function vote(sectionId: string, optionId: string) {
    await fetch(`/api/sections/${sectionId}/vote`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ option_id: optionId, voter_session_id: sessionId }),
    });
  }

  async function togglePollOpen(sectionId: string, currentlyOpen: boolean) {
    await fetch(`/api/sections/${sectionId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ config: { is_open: !currentlyOpen } }),
    });
  }

  async function updateMatrixConfig(sectionId: string, config: Partial<MatrixConfig>) {
    await fetch(`/api/sections/${sectionId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ config }),
    });
  }

  const boardArchived = board.status === "archived";

  return (
    <div className="space-y-4">
      {boardArchived && (
        <div className="rounded-lg bg-amber-50 px-4 py-2 text-sm text-amber-700">
          Board ini sudah ditutup — kamu bisa lihat hasilnya, tapi tidak bisa posting baru.
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <SectionTabs
          sections={sections}
          activeSectionId={activeSectionId}
          onSelect={setActiveSectionId}
          isOwner={isOwner}
          onDeleteSection={deleteSection}
        />
        {isOwner && <AddSectionForm onCreate={createSection} />}
      </div>

      {!activeSection && (
        <p className="text-sm text-slate-500">
          {isOwner
            ? "Belum ada section. Tambahkan Wall, Poll, atau Matrix untuk mulai."
            : "Fasilitator belum menambahkan section apa pun."}
        </p>
      )}

      {activeSection && activeSection.type === "wall" && (
        <WallSection
          notes={notes.filter((n) => n.section_id === activeSection.id)}
          showAuthor={!board.is_anonymous}
          sessionId={sessionId}
          authorName={authorName}
          isOwner={isOwner}
          boardArchived={boardArchived}
          onCreate={(content, color, x, y) =>
            createStickyNote(activeSection.id, content, color, { position_x: x, position_y: y })
          }
          onMove={(noteId, x, y) => moveStickyNote(noteId, { position_x: x, position_y: y })}
          onEditContent={editStickyNoteContent}
          onDelete={deleteStickyNote}
        />
      )}

      {activeSection && activeSection.type === "matrix" && (
        <MatrixSection
          config={activeSection.config as MatrixConfig}
          notes={notes.filter((n) => n.section_id === activeSection.id)}
          showAuthor={!board.is_anonymous}
          sessionId={sessionId}
          isOwner={isOwner}
          boardArchived={boardArchived}
          onCreate={(content, color, quadrant) =>
            createStickyNote(activeSection.id, content, color, { quadrant_index: quadrant })
          }
          onMoveQuadrant={(noteId, quadrant) => moveStickyNote(noteId, { quadrant_index: quadrant })}
          onEditContent={editStickyNoteContent}
          onDelete={deleteStickyNote}
          onUpdateConfig={(config) => updateMatrixConfig(activeSection.id, config)}
        />
      )}

      {activeSection && activeSection.type === "poll" && (
        <PollSection
          config={activeSection.config as PollConfig}
          options={pollOptions.filter((o) => o.section_id === activeSection.id)}
          votes={pollVotes.filter((v) => v.section_id === activeSection.id)}
          sessionId={sessionId}
          isOwner={isOwner}
          onVote={(optionId) => vote(activeSection.id, optionId)}
          onToggleOpen={() =>
            togglePollOpen(activeSection.id, (activeSection.config as PollConfig).is_open)
          }
        />
      )}
    </div>
  );
}
