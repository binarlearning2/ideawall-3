"use client";

import { useRef, useState } from "react";
import { StickyNoteCard } from "@/components/board/StickyNoteCard";
import { AddStickyNoteForm } from "@/components/board/AddStickyNoteForm";
import type { StickyNote } from "@/lib/types";

interface WallSectionProps {
  notes: StickyNote[];
  showAuthor: boolean;
  sessionId: string;
  authorName: string;
  isOwner: boolean;
  boardArchived: boolean;
  onCreate: (content: string, color: string, positionX: number, positionY: number) => void;
  onMove: (noteId: string, positionX: number, positionY: number) => void;
  onEditContent: (noteId: string, content: string) => void;
  onDelete: (noteId: string) => void;
}

export function WallSection({
  notes,
  showAuthor,
  sessionId,
  isOwner,
  boardArchived,
  onCreate,
  onMove,
  onEditContent,
  onDelete,
}: WallSectionProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [addingAt, setAddingAt] = useState<{ x: number; y: number } | null>(null);
  const draggingNoteId = useRef<string | null>(null);

  function handleCanvasDoubleClick(e: React.MouseEvent) {
    if (boardArchived || e.target !== canvasRef.current) return;
    const rect = canvasRef.current!.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    setAddingAt({ x, y });
  }

  function handlePointerDown(noteId: string, authorSessionId: string) {
    return (e: React.PointerEvent) => {
      if (boardArchived || authorSessionId !== sessionId) return;
      e.preventDefault();
      draggingNoteId.current = noteId;
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    };
  }

  function handlePointerMove(e: React.PointerEvent) {
    const noteId = draggingNoteId.current;
    if (!noteId || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = Math.min(Math.max((e.clientX - rect.left) / rect.width, 0), 1);
    const y = Math.min(Math.max((e.clientY - rect.top) / rect.height, 0), 1);
    const el = document.getElementById(`note-${noteId}`);
    if (el) {
      el.style.left = `${x * 100}%`;
      el.style.top = `${y * 100}%`;
    }
  }

  function handlePointerUp(e: React.PointerEvent) {
    const noteId = draggingNoteId.current;
    if (!noteId || !canvasRef.current) {
      draggingNoteId.current = null;
      return;
    }
    const rect = canvasRef.current.getBoundingClientRect();
    const x = Math.min(Math.max((e.clientX - rect.left) / rect.width, 0), 1);
    const y = Math.min(Math.max((e.clientY - rect.top) / rect.height, 0), 1);
    onMove(noteId, x, y);
    draggingNoteId.current = null;
  }

  return (
    <div>
      <p className="mb-2 text-xs text-slate-500">
        Klik dua kali di area kosong untuk menambah sticky note. Drag sticky note milikmu
        sendiri untuk memindahkan posisinya.
      </p>
      <div
        ref={canvasRef}
        onDoubleClick={handleCanvasDoubleClick}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        className="relative h-[28rem] w-full overflow-hidden rounded-xl border-2 border-dashed border-slate-300 bg-slate-100"
      >
        {notes.map((note) => (
          <div
            key={note.id}
            id={`note-${note.id}`}
            onPointerDown={handlePointerDown(note.id, note.author_session_id)}
            style={{
              position: "absolute",
              left: `${(note.position_x ?? 0.5) * 100}%`,
              top: `${(note.position_y ?? 0.5) * 100}%`,
              transform: "translate(-50%, -50%)",
              cursor: note.author_session_id === sessionId ? "grab" : "default",
              touchAction: "none",
            }}
          >
            <StickyNoteCard
              note={note}
              showAuthor={showAuthor}
              canManage={note.author_session_id === sessionId || isOwner}
              onDelete={onDelete}
              onEditContent={
                note.author_session_id === sessionId ? onEditContent : undefined
              }
            />
          </div>
        ))}

        {addingAt && (
          <div
            style={{
              position: "absolute",
              left: `${addingAt.x * 100}%`,
              top: `${addingAt.y * 100}%`,
              transform: "translate(-50%, -50%)",
            }}
          >
            <AddStickyNoteForm
              onCancel={() => setAddingAt(null)}
              onSubmit={(content, color) => {
                onCreate(content, color, addingAt.x, addingAt.y);
                setAddingAt(null);
              }}
            />
          </div>
        )}

        {notes.length === 0 && !addingAt && (
          <p className="absolute inset-0 flex items-center justify-center text-sm text-slate-400">
            Belum ada sticky note. Klik dua kali untuk mulai brainstorming.
          </p>
        )}
      </div>
    </div>
  );
}
