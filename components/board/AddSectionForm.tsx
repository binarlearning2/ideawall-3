"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import type { SectionType } from "@/lib/types";

interface AddSectionFormProps {
  onCreate: (payload: {
    type: SectionType;
    title: string;
    config?: { question?: string; vote_type?: "single" | "multiple"; options?: string[] };
  }) => Promise<void> | void;
}

export function AddSectionForm({ onCreate }: AddSectionFormProps) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<SectionType>("wall");
  const [title, setTitle] = useState("");
  const [question, setQuestion] = useState("");
  const [voteType, setVoteType] = useState<"single" | "multiple">("single");
  const [options, setOptions] = useState(["", ""]);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  function resetForm() {
    setType("wall");
    setTitle("");
    setQuestion("");
    setVoteType("single");
    setOptions(["", ""]);
    setErrorMessage("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;

    setSubmitting(true);
    setErrorMessage("");

    try {
      if (type === "poll") {
        const cleanOptions = options.map((o) => o.trim()).filter(Boolean);
        if (cleanOptions.length < 2) {
          setErrorMessage("Poll butuh minimal 2 opsi jawaban");
          setSubmitting(false);
          return;
        }
        await onCreate({
          type,
          title: title.trim(),
          config: { question: question.trim(), vote_type: voteType, options: cleanOptions },
        });
      } else {
        await onCreate({ type, title: title.trim() });
      }
      resetForm();
      setOpen(false);
    } finally {
      setSubmitting(false);
    }
  }

  if (!open) {
    return (
      <Button variant="secondary" size="sm" onClick={() => setOpen(true)}>
        + Tambah Section
      </Button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
    >
      <div className="flex gap-2">
        {(["wall", "poll", "matrix"] as SectionType[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setType(t)}
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              type === t ? "bg-brand-600 text-white" : "bg-slate-100 text-slate-600"
            }`}
          >
            {t === "wall" ? "Wall" : t === "poll" ? "Poll" : "Matrix"}
          </button>
        ))}
      </div>

      <Input
        placeholder="Judul section, mis. Ide Bebas"
        value={title}
        maxLength={100}
        onChange={(e) => setTitle(e.target.value)}
        required
      />

      {type === "poll" && (
        <div className="space-y-2">
          <Input
            placeholder="Pertanyaan poll"
            value={question}
            maxLength={300}
            onChange={(e) => setQuestion(e.target.value)}
            required
          />
          <div className="flex gap-3 text-xs text-slate-600">
            <label className="flex items-center gap-1">
              <input
                type="radio"
                checked={voteType === "single"}
                onChange={() => setVoteType("single")}
              />
              Single-choice
            </label>
            <label className="flex items-center gap-1">
              <input
                type="radio"
                checked={voteType === "multiple"}
                onChange={() => setVoteType("multiple")}
              />
              Multiple-choice
            </label>
          </div>
          {options.map((opt, idx) => (
            <Input
              key={idx}
              placeholder={`Opsi ${idx + 1}`}
              value={opt}
              maxLength={150}
              onChange={(e) => {
                const next = [...options];
                next[idx] = e.target.value;
                setOptions(next);
              }}
            />
          ))}
          {options.length < 10 && (
            <button
              type="button"
              onClick={() => setOptions([...options, ""])}
              className="text-xs text-brand-600 hover:underline"
            >
              + Tambah opsi
            </button>
          )}
        </div>
      )}

      {errorMessage && (
        <p className="text-sm text-red-600" role="alert">
          {errorMessage}
        </p>
      )}

      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>
          Batal
        </Button>
        <Button type="submit" size="sm" disabled={submitting}>
          {submitting ? "Menambah..." : "Tambah Section"}
        </Button>
      </div>
    </form>
  );
}
