"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export function CreateBoardForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;

    setSubmitting(true);
    setErrorMessage("");

    const res = await fetch("/api/boards", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: title.trim() }),
    });

    const data = await res.json();
    setSubmitting(false);

    if (!res.ok) {
      setErrorMessage(data.error ?? "Gagal membuat board");
      return;
    }

    setTitle("");
    router.push(`/board/${data.id}`);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2 sm:flex-row">
      <Input
        placeholder="Judul board, mis. Workshop Ideation Q3"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        maxLength={100}
        required
        className="flex-1"
      />
      <Button type="submit" disabled={submitting}>
        {submitting ? "Membuat..." : "Buat Board Baru"}
      </Button>
      {errorMessage && (
        <p className="text-sm text-red-600 sm:basis-full" role="alert">
          {errorMessage}
        </p>
      )}
    </form>
  );
}
