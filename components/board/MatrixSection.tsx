"use client";

import { useState } from "react";
import { StickyNoteCard } from "@/components/board/StickyNoteCard";
import { AddStickyNoteForm } from "@/components/board/AddStickyNoteForm";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import type { MatrixConfig, StickyNote } from "@/lib/types";
import { cn } from "@/lib/utils";

interface MatrixSectionProps {
  config: MatrixConfig;
  notes: StickyNote[];
  showAuthor: boolean;
  sessionId: string;
  isOwner: boolean;
  boardArchived: boolean;
  onCreate: (content: string, color: string, quadrant: 1 | 2 | 3 | 4) => void;
  onMoveQuadrant: (noteId: string, quadrant: 1 | 2 | 3 | 4) => void;
  onEditContent: (noteId: string, content: string) => void;
  onDelete: (noteId: string) => void;
  onUpdateConfig: (config: Partial<MatrixConfig>) => void;
}

const QUADRANTS: Array<1 | 2 | 3 | 4> = [1, 2, 3, 4];

export function MatrixSection({
  config,
  notes,
  showAuthor,
  sessionId,
  isOwner,
  boardArchived,
  onCreate,
  onMoveQuadrant,
  onEditContent,
  onDelete,
  onUpdateConfig,
}: MatrixSectionProps) {
  const [addingQuadrant, setAddingQuadrant] = useState<1 | 2 | 3 | 4 | null>(null);
  const [editingLabels, setEditingLabels] = useState(false);
  const [draft, setDraft] = useState(config);

  const notesByQuadrant: Record<number, StickyNote[]> = { 1: [], 2: [], 3: [], 4: [] };
  for (const note of notes) {
    if (note.quadrant_index) notesByQuadrant[note.quadrant_index].push(note);
  }

  function handleDrop(quadrant: 1 | 2 | 3 | 4) {
    return (e: React.DragEvent) => {
      e.preventDefault();
      const noteId = e.dataTransfer.getData("text/plain");
      const note = notes.find((n) => n.id === noteId);
      if (note && note.author_session_id === sessionId && note.quadrant_index !== quadrant) {
        onMoveQuadrant(noteId, quadrant);
      }
    };
  }

  function saveLabels() {
    onUpdateConfig(draft);
    setEditingLabels(false);
  }

  return (
    <div>
      {isOwner && (
        <div className="mb-3 flex items-center justify-between">
          <p className="text-xs text-slate-500">
            Sumbu & label kuadran bisa diedit kapan saja tanpa menghapus sticky note yang
            sudah ada.
          </p>
          <Button size="sm" variant="ghost" onClick={() => setEditingLabels((v) => !v)}>
            {editingLabels ? "Tutup" : "Edit label"}
          </Button>
        </div>
      )}

      {editingLabels && (
        <div className="mb-4 grid gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">
              Label sumbu X
            </label>
            <Input
              value={draft.axis_x_label}
              onChange={(e) => setDraft({ ...draft, axis_x_label: e.target.value })}
              maxLength={50}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">
              Label sumbu Y
            </label>
            <Input
              value={draft.axis_y_label}
              onChange={(e) => setDraft({ ...draft, axis_y_label: e.target.value })}
              maxLength={50}
            />
          </div>
          {QUADRANTS.map((q) => (
            <div key={q}>
              <label className="mb-1 block text-xs font-medium text-slate-600">
                Label kuadran {q}
              </label>
              <Input
                value={draft.quadrant_labels[String(q) as "1" | "2" | "3" | "4"]}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    quadrant_labels: {
                      ...draft.quadrant_labels,
                      [String(q)]: e.target.value,
                    },
                  })
                }
                maxLength={80}
              />
            </div>
          ))}
          <div className="sm:col-span-2">
            <Button size="sm" onClick={saveLabels}>
              Simpan label
            </Button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2">
        {QUADRANTS.map((q) => (
          <div
            key={q}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop(q)}
            className={cn(
              "min-h-[14rem] rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 p-3"
            )}
          >
            <div className="mb-2 flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-700">
                {config.quadrant_labels[String(q) as "1" | "2" | "3" | "4"]}
              </p>
              {!boardArchived && (
                <button
                  type="button"
                  onClick={() => setAddingQuadrant(q)}
                  className="text-lg leading-none text-slate-400 hover:text-brand-600"
                  aria-label={`Tambah ide ke kuadran ${q}`}
                >
                  +
                </button>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              {notesByQuadrant[q].map((note) => (
                <div
                  key={note.id}
                  draggable={note.author_session_id === sessionId}
                  onDragStart={(e) => e.dataTransfer.setData("text/plain", note.id)}
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
            </div>

            {addingQuadrant === q && (
              <div className="mt-2">
                <AddStickyNoteForm
                  onCancel={() => setAddingQuadrant(null)}
                  onSubmit={(content, color) => {
                    onCreate(content, color, q);
                    setAddingQuadrant(null);
                  }}
                />
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-2 flex justify-between text-xs text-slate-500">
        <span>← {config.axis_x_label} →</span>
        <span>↕ {config.axis_y_label}</span>
      </div>
    </div>
  );
}
