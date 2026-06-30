"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { STICKY_COLORS } from "@/lib/types";
import { cn } from "@/lib/utils";

interface AddStickyNoteFormProps {
  onSubmit: (content: string, color: string) => Promise<void> | void;
  onCancel: () => void;
  submitLabel?: string;
}

export function AddStickyNoteForm({
  onSubmit,
  onCancel,
  submitLabel = "Tambah",
}: AddStickyNoteFormProps) {
  const [content, setContent] = useState("");
  const [color, setColor] = useState<string>(STICKY_COLORS[0]);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = content.trim();
    if (!trimmed) return;
    setSubmitting(true);
    await onSubmit(trimmed, color);
    setSubmitting(false);
    setContent("");
  }

  return (
    <form
      onSubmit={handleSubmit}
      style={{ backgroundColor: color }}
      className="w-44 space-y-2 rounded-md border border-black/10 p-3 shadow-lg"
    >
      <textarea
        autoFocus
        value={content}
        maxLength={280}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Tulis ide kamu..."
        rows={3}
        className="w-full resize-none rounded border border-black/10 bg-white/70 p-1 text-sm placeholder:text-slate-500"
      />
      <div className="flex gap-1">
        {STICKY_COLORS.map((c) => (
          <button
            key={c}
            type="button"
            aria-label={`Pilih warna ${c}`}
            onClick={() => setColor(c)}
            style={{ backgroundColor: c }}
            className={cn(
              "h-5 w-5 rounded-full border-2",
              color === c ? "border-slate-700" : "border-transparent"
            )}
          />
        ))}
      </div>
      <div className="flex justify-end gap-1">
        <button
          type="button"
          onClick={onCancel}
          className="rounded px-2 py-1 text-xs text-slate-600 hover:bg-black/5"
        >
          Batal
        </button>
        <Button type="submit" size="sm" disabled={submitting || !content.trim()}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
