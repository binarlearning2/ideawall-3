"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import type { Board } from "@/lib/types";

export function BoardListItem({ board }: { board: Board }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  const joinUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/b/${board.join_code}`
      : `/b/${board.join_code}`;

  async function handleCopyLink() {
    await navigator.clipboard.writeText(joinUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleArchiveToggle() {
    setBusy(true);
    const nextStatus = board.status === "active" ? "archived" : "active";
    await fetch(`/api/boards/${board.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: nextStatus }),
    });
    setBusy(false);
    router.refresh();
  }

  async function handleDelete() {
    if (!confirm(`Hapus board "${board.title}" secara permanen? Tindakan ini tidak bisa dibatalkan.`)) {
      return;
    }
    setBusy(true);
    await fetch(`/api/boards/${board.id}`, { method: "DELETE" });
    setBusy(false);
    router.refresh();
  }

  return (
    <li className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <Link href={`/board/${board.id}`} className="truncate font-medium text-slate-900 hover:underline">
            {board.title}
          </Link>
          {board.status === "archived" && (
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
              Diarsipkan
            </span>
          )}
        </div>
        <p className="mt-0.5 text-sm text-slate-500">
          Kode: <span className="font-mono">{board.join_code}</span>
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button size="sm" variant="secondary" onClick={handleCopyLink} disabled={busy}>
          {copied ? "Tersalin!" : "Salin Link"}
        </Button>
        <Link href={`/board/${board.id}`}>
          <Button size="sm" variant="primary">
            Kelola
          </Button>
        </Link>
        <Button size="sm" variant="ghost" onClick={handleArchiveToggle} disabled={busy}>
          {board.status === "active" ? "Arsipkan" : "Aktifkan"}
        </Button>
        <Button size="sm" variant="danger" onClick={handleDelete} disabled={busy}>
          Hapus
        </Button>
      </div>
    </li>
  );
}
