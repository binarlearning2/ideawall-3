import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { StickyNoteCard } from "@/components/board/StickyNoteCard";
import type { StickyNote } from "@/lib/types";

const baseNote: StickyNote = {
  id: "note-1",
  board_id: "board-1",
  section_id: "section-1",
  content: "Ide brilian saya",
  color: "#FFF59D",
  author_name: "Budi",
  author_session_id: "session-budi",
  position_x: 0.5,
  position_y: 0.5,
  quadrant_index: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

describe("StickyNoteCard", () => {
  it("menampilkan isi sticky note", () => {
    render(
      <StickyNoteCard note={baseNote} showAuthor={false} canManage={false} onDelete={vi.fn()} />
    );
    expect(screen.getByText("Ide brilian saya")).toBeInTheDocument();
  });

  it("menampilkan nama author saat showAuthor=true", () => {
    render(
      <StickyNoteCard note={baseNote} showAuthor={true} canManage={false} onDelete={vi.fn()} />
    );
    expect(screen.getByText("— Budi")).toBeInTheDocument();
  });

  it("menyembunyikan nama author saat showAuthor=false (mode anonim)", () => {
    render(
      <StickyNoteCard note={baseNote} showAuthor={false} canManage={false} onDelete={vi.fn()} />
    );
    expect(screen.queryByText("— Budi")).not.toBeInTheDocument();
  });

  it("tidak menampilkan tombol hapus kalau canManage=false", () => {
    render(
      <StickyNoteCard note={baseNote} showAuthor={false} canManage={false} onDelete={vi.fn()} />
    );
    expect(screen.queryByRole("button", { name: /hapus sticky note/i })).not.toBeInTheDocument();
  });

  it("memanggil onDelete dengan id yang benar saat tombol hapus diklik (canManage=true)", () => {
    const onDelete = vi.fn();
    render(
      <StickyNoteCard note={baseNote} showAuthor={false} canManage={true} onDelete={onDelete} />
    );
    fireEvent.click(screen.getByRole("button", { name: /hapus sticky note/i }));
    expect(onDelete).toHaveBeenCalledWith("note-1");
  });

  it("memunculkan form edit saat tombol edit diklik, lalu memanggil onEditContent saat disimpan", () => {
    const onEditContent = vi.fn();
    render(
      <StickyNoteCard
        note={baseNote}
        showAuthor={false}
        canManage={true}
        onDelete={vi.fn()}
        onEditContent={onEditContent}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: /edit sticky note/i }));
    const textarea = screen.getByRole("textbox");
    fireEvent.change(textarea, { target: { value: "Ide yang sudah direvisi" } });
    fireEvent.click(screen.getByRole("button", { name: /simpan/i }));
    expect(onEditContent).toHaveBeenCalledWith("note-1", "Ide yang sudah direvisi");
  });
});
