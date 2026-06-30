"use client";

import { Button } from "@/components/ui/Button";
import type { PollConfig, PollOption, PollVote } from "@/lib/types";
import { cn } from "@/lib/utils";

interface PollSectionProps {
  config: PollConfig;
  options: PollOption[];
  votes: PollVote[];
  sessionId: string;
  isOwner: boolean;
  onVote: (optionId: string) => void;
  onToggleOpen: () => void;
}

export function PollSection({
  config,
  options,
  votes,
  sessionId,
  isOwner,
  onVote,
  onToggleOpen,
}: PollSectionProps) {
  const totalVotes = votes.length;
  const myVoteOptionIds = new Set(
    votes.filter((v) => v.voter_session_id === sessionId).map((v) => v.option_id)
  );

  const sortedOptions = [...options].sort((a, b) => a.order_index - b.order_index);

  return (
    <div>
      <div className="mb-4 flex items-start justify-between gap-3">
        <h3 className="text-base font-semibold text-slate-900">{config.question}</h3>
        {isOwner && (
          <Button size="sm" variant="ghost" onClick={onToggleOpen}>
            {config.is_open ? "Tutup poll" : "Buka lagi"}
          </Button>
        )}
      </div>

      {!config.is_open && (
        <p className="mb-3 text-xs font-medium text-amber-600">
          Poll ini sudah ditutup — hasil tetap terlihat, tidak bisa divote lagi.
        </p>
      )}

      <ul className="space-y-3">
        {sortedOptions.map((option) => {
          const count = votes.filter((v) => v.option_id === option.id).length;
          const pct = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
          const checked = myVoteOptionIds.has(option.id);

          return (
            <li key={option.id}>
              <label
                className={cn(
                  "flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors",
                  checked ? "border-brand-400 bg-brand-50" : "border-slate-200 bg-white",
                  !config.is_open && "cursor-not-allowed opacity-70"
                )}
              >
                <input
                  type={config.vote_type === "single" ? "radio" : "checkbox"}
                  name="poll-option"
                  checked={checked}
                  disabled={!config.is_open}
                  onChange={() => onVote(option.id)}
                  className="h-4 w-4 accent-brand-600"
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-slate-800">{option.label}</span>
                    <span className="text-slate-500">
                      {count} suara · {pct}%
                    </span>
                  </div>
                  <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-brand-500 transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              </label>
            </li>
          );
        })}
      </ul>

      <p className="mt-3 text-xs text-slate-400">Total {totalVotes} suara</p>
    </div>
  );
}
