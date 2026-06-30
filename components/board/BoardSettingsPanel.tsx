"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import type { Board } from "@/lib/types";

export function BoardSettingsPanel({ board }: { board: Board }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  const joinUrl =
    typeof window !== "undefined" ? `${window.location.origin}/b/${board.join_code}` : "";

  async function handleCopyLink() {
    await navigator.clipboard.writeText(joinUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function patch(body: Record<string, unknown>) {
    setBusy(true);
    await fetch(`/api/boards/${board.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setBusy(false);
    router.refresh();
  }

  async function handleDelete() {
    if (
      !confirm(
        `Hapus board "${board.title}" secara permanen beserta semua isinya? Tindakan ini tidak bisa dibatalkan.`
      )
    )
      return;
    setBusy(true);
    await fetch(`/api/boards/${board.id}`, { method: "DELETE" });
    router.push("/boards");
    router.refresh();
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm text-slate-500">
            Kode board: <span className="font-mono font-semibold">{board.join_code}</span>
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="secondary" onClick={handleCopyLink}>
            {copied ? "Tersalin!" : "Salin Link Share"}
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setOpen((v) => !v)}>
            {open ? "Tutup pengaturan" : "Pengaturan"}
          </Button>
        </div>
      </div>

      {open && (
        <div className="mt-4 space-y-3 border-t border-slate-100 pt-4">
          <label className="flex items-center justify-between text-sm">
            <span>Tampilkan nama penulis sticky note ke peserta</span>
            <input
              type="checkbox"
              checked={!board.is_anonymous}
              disabled={busy}
              onChange={(e) => patch({ is_anonymous: !e.target.checked })}
              className="h-4 w-4 accent-brand-600"
            />
          </label>

          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="secondary"
              disabled={busy}
              onClick={() =>
                patch({ status: board.status === "active" ? "archived" : "active" })
              }
            >
              {board.status === "active" ? "Arsipkan board" : "Aktifkan board"}
            </Button>
            <Button size="sm" variant="danger" disabled={busy} onClick={handleDelete}>
              Hapus board
            </Button>
          </div>
          {board.status === "archived" && (
            <p className="text-xs text-amber-600">
              Board ini diarsipkan — peserta tidak bisa posting baru, tapi tetap bisa lihat
              hasil (read-only).
            </p>
          )}
        </div>
      )}
    </div>
  );
}
