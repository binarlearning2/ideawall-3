import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { PollSection } from "@/components/board/PollSection";
import type { PollConfig, PollOption, PollVote } from "@/lib/types";

const config: PollConfig = {
  question: "Fitur mana yang paling penting?",
  vote_type: "single",
  is_open: true,
};

const options: PollOption[] = [
  { id: "opt-a", section_id: "section-1", label: "Wall", order_index: 0 },
  { id: "opt-b", section_id: "section-1", label: "Poll", order_index: 1 },
];

function makeVote(optionId: string, voterSessionId: string): PollVote {
  return {
    id: `vote-${optionId}-${voterSessionId}`,
    board_id: "board-1",
    section_id: "section-1",
    option_id: optionId,
    voter_session_id: voterSessionId,
    created_at: new Date().toISOString(),
  };
}

describe("PollSection", () => {
  it("menampilkan pertanyaan dan opsi", () => {
    render(
      <PollSection
        config={config}
        options={options}
        votes={[]}
        sessionId="me"
        isOwner={false}
        onVote={vi.fn()}
        onToggleOpen={vi.fn()}
      />
    );
    expect(screen.getByText("Fitur mana yang paling penting?")).toBeInTheDocument();
    expect(screen.getByText("Wall")).toBeInTheDocument();
    expect(screen.getByText("Poll")).toBeInTheDocument();
  });

  it("menghitung persentase suara dengan benar", () => {
    const votes = [makeVote("opt-a", "voter-1"), makeVote("opt-a", "voter-2"), makeVote("opt-b", "voter-3")];
    render(
      <PollSection
        config={config}
        options={options}
        votes={votes}
        sessionId="me"
        isOwner={false}
        onVote={vi.fn()}
        onToggleOpen={vi.fn()}
      />
    );
    expect(screen.getByText("2 suara · 67%")).toBeInTheDocument();
    expect(screen.getByText("1 suara · 33%")).toBeInTheDocument();
  });

  it("memanggil onVote dengan option id saat opsi diklik", () => {
    const onVote = vi.fn();
    render(
      <PollSection
        config={config}
        options={options}
        votes={[]}
        sessionId="me"
        isOwner={false}
        onVote={onVote}
        onToggleOpen={vi.fn()}
      />
    );
    fireEvent.click(screen.getByLabelText(/wall/i, { selector: "input" }) ?? screen.getAllByRole("radio")[0]);
    expect(onVote).toHaveBeenCalledWith("opt-a");
  });

  it("merender sebagai checkbox untuk multiple-choice", () => {
    render(
      <PollSection
        config={{ ...config, vote_type: "multiple" }}
        options={options}
        votes={[]}
        sessionId="me"
        isOwner={false}
        onVote={vi.fn()}
        onToggleOpen={vi.fn()}
      />
    );
    expect(screen.getAllByRole("checkbox")).toHaveLength(2);
  });

  it("menonaktifkan opsi vote ketika poll sudah ditutup", () => {
    render(
      <PollSection
        config={{ ...config, is_open: false }}
        options={options}
        votes={[]}
        sessionId="me"
        isOwner={false}
        onVote={vi.fn()}
        onToggleOpen={vi.fn()}
      />
    );
    const radios = screen.getAllByRole("radio") as HTMLInputElement[];
    expect(radios[0]).toBeDisabled();
  });

  it("hanya menampilkan tombol tutup/buka poll untuk owner", () => {
    const { rerender } = render(
      <PollSection
        config={config}
        options={options}
        votes={[]}
        sessionId="me"
        isOwner={false}
        onVote={vi.fn()}
        onToggleOpen={vi.fn()}
      />
    );
    expect(screen.queryByRole("button", { name: /tutup poll/i })).not.toBeInTheDocument();

    rerender(
      <PollSection
        config={config}
        options={options}
        votes={[]}
        sessionId="me"
        isOwner={true}
        onVote={vi.fn()}
        onToggleOpen={vi.fn()}
      />
    );
    expect(screen.getByRole("button", { name: /tutup poll/i })).toBeInTheDocument();
  });
});
