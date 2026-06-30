// Shared types matching PRD §8 Data Model exactly.

export type SectionType = "wall" | "poll" | "matrix";
export type BoardStatus = "active" | "archived";
export type VoteType = "single" | "multiple";

export interface Profile {
  id: string;
  display_name: string;
  email: string;
  created_at: string;
}

export interface Board {
  id: string;
  owner_id: string;
  title: string;
  description: string | null;
  join_code: string;
  is_anonymous: boolean;
  status: BoardStatus;
  created_at: string;
  updated_at: string;
}

export interface PollOptionConfig {
  id: string;
  label: string;
  order_index: number;
}

export interface WallConfig {
  // no extra config for v1
  [key: string]: never;
}

export interface PollConfig {
  question: string;
  vote_type: VoteType;
  is_open: boolean;
  options?: PollOptionConfig[]; // optional render cache; source of truth is poll_options table
}

export interface MatrixConfig {
  axis_x_label: string;
  axis_y_label: string;
  quadrant_labels: {
    "1": string;
    "2": string;
    "3": string;
    "4": string;
  };
}

export type SectionConfig = WallConfig | PollConfig | MatrixConfig | Record<string, unknown>;

export interface BoardSection {
  id: string;
  board_id: string;
  type: SectionType;
  title: string;
  order_index: number;
  config: SectionConfig;
  created_at: string;
  updated_at: string;
}

export interface StickyNote {
  id: string;
  board_id: string;
  section_id: string;
  content: string;
  color: string;
  author_name: string;
  author_session_id: string;
  position_x: number | null;
  position_y: number | null;
  quadrant_index: 1 | 2 | 3 | 4 | null;
  created_at: string;
  updated_at: string;
}

export interface PollOption {
  id: string;
  section_id: string;
  label: string;
  order_index: number;
}

export interface PollVote {
  id: string;
  board_id: string;
  section_id: string;
  option_id: string;
  voter_session_id: string;
  created_at: string;
}

// Sticky note color presets (PRD §7.3: "wajib pilih 1 dari 6 warna preset")
export const STICKY_COLORS = [
  "#FFF59D", // yellow
  "#A7FFEB", // teal
  "#FFCCBC", // peach
  "#B2EBF2", // sky
  "#D1C4E9", // lavender
  "#F8BBD0", // pink
] as const;

export type StickyColor = (typeof STICKY_COLORS)[number];
