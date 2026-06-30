"use client";

import type { BoardSection } from "@/lib/types";
import { cn } from "@/lib/utils";

const TYPE_ICON: Record<string, string> = {
  wall: "🧠",
  poll: "📊",
  matrix: "🗂️",
};

interface SectionTabsProps {
  sections: BoardSection[];
  activeSectionId: string | null;
  onSelect: (sectionId: string) => void;
  isOwner: boolean;
  onDeleteSection?: (sectionId: string) => void;
}

export function SectionTabs({
  sections,
  activeSectionId,
  onSelect,
  isOwner,
  onDeleteSection,
}: SectionTabsProps) {
  const sorted = [...sections].sort((a, b) => a.order_index - b.order_index);

  if (sorted.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-2">
      {sorted.map((section) => (
        <div key={section.id} className="group relative">
          <button
            type="button"
            onClick={() => onSelect(section.id)}
            className={cn(
              "rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
              activeSectionId === section.id
                ? "bg-brand-600 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            )}
          >
            <span className="mr-1">{TYPE_ICON[section.type]}</span>
            {section.title}
          </button>
          {isOwner && onDeleteSection && (
            <button
              type="button"
              aria-label={`Hapus section ${section.title}`}
              onClick={() => onDeleteSection(section.id)}
              className="absolute -right-1 -top-1 hidden h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] text-white group-hover:flex"
            >
              ✕
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
