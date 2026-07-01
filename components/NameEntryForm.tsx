"use client";

import { useState } from "react";
import { addBoardParticipant } from "@/lib/session";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

interface NameEntryFormProps {
  boardTitle: string;
  boardId: string;
  onJoin: (name: string) => void;
}

export function NameEntryForm({ boardTitle, boardId, onJoin }: NameEntryFormProps) {
  const [name, setName] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed || trimmed.length > 50) {
      setErrorMessage("Nama wajib diisi (maksimal 50 karakter)");
      return;
    }

    const result = addBoardParticipant(boardId, trimmed, 40);
    if (!result.ok) {
      setErrorMessage(result.error);
      return;
    }

    onJoin(trimmed);
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="mb-1 text-lg font-semibold text-slate-900">{boardTitle}</h1>
        <p className="mb-4 text-sm text-slate-500">
          Masukkan nama kamu untuk bergabung — tidak perlu akun.
        </p>
        <form onSubmit={handleSubmit} className="space-y-3">
          <Input
            autoFocus
            placeholder="Nama kamu"
            value={name}
            maxLength={50}
            onChange={(e) => setName(e.target.value)}
          />
          {errorMessage && (
            <p className="text-sm text-red-600" role="alert">
              {errorMessage}
            </p>
          )}
          <Button type="submit" className="w-full">
            Masuk
          </Button>
        </form>
      </div>
    </main>
  );
}
