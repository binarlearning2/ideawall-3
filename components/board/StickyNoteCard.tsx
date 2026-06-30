"use client";

import { useEffect, useState } from "react";
import type { StickyNote } from "@/lib/types";
import { cn } from "@/lib/utils";

interface StickyNoteCardProps {
  note: StickyNote;
  showAuthor: boolean;
  canManage: boolean; // true if this is my own note OR I'm the board owner
  onDelete: (noteId: string) => void;
  onEditContent?: (noteId: string, content: string) => void;
  style?: React.CSSProperties;
  className?: string;
  dragHandleProps?: Record<string, unknown>;
}

export function StickyNoteCard({
  note,
  showAuthor,
  canManage,
  onDelete,
  onEditContent,
  style,
  className,
  dragHandleProps,
}: StickyNoteCardProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(note.content);

  // Keep draft in sync with incoming realtime updates when not actively editing.
  useEffect(() => {
    if (!editing) setDraft(note.content);
  }, [note.content, editing]);

  function handleSave() {
    const trimmed = draft.trim();
    if (trimmed && trimmed !== note.content && onEditContent) {
      onEditContent(note.id, trimmed);
    }
    setEditing(false);
  }

  return (
    <div
      {...dragHandleProps}
      style={{ backgroundColor: note.color, ...style }}
      className={cn(
        "group relative w-44 select-none rounded-md p-3 text-sm shadow-md",
        "border border-black/5",
        className
      )}
    >
      {editing ? (
        <div className="space-y-2">
          <textarea
            autoFocus
            value={draft}
            maxLength={280}
            onChange={(e) => setDraft(e.target.value)}
            className="w-full resize-none rounded border border-black/10 bg-white/70 p-1 text-sm"
            rows={3}
          />
          <div className="flex justify-end gap-1">
            <button
              type="button"
              onClick={() => {
                setDraft(note.content);
                setEditing(false);
              }}
              className="rounded px-2 py-0.5 text-xs text-slate-600 hover:bg-black/5"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="rounded bg-black/10 px-2 py-0.5 text-xs font-medium hover:bg-black/20"
            >
              Simpan
            </button>
          </div>
        </div>
      ) : (
        <>
          <p className="whitespace-pre-wrap break-words text-slate-800">{note.content}</p>
          {showAuthor && (
            <p className="mt-2 truncate text-xs font-medium text-slate-600">
              — {note.author_name}
            </p>
          )}
        </>
      )}

      {canManage && !editing && (
        <div className="absolute -right-2 -top-2 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          {onEditContent && (
            <button
              type="button"
              aria-label="Edit sticky note"
              onClick={() => setEditing(true)}
              className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-xs shadow ring-1 ring-black/10 hover:bg-slate-50"
            >
              ✎
            </button>
          )}
          <button
            type="button"
            aria-label="Hapus sticky note"
            onClick={() => onDelete(note.id)}
            className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-xs shadow ring-1 ring-black/10 hover:bg-red-50"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
