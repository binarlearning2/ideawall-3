import clsx, { type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

// Avoid ambiguous characters (0/O/1/I) per PRD §7.1.
const JOIN_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generateJoinCode(length = 6): string {
  let code = "";
  for (let i = 0; i < length; i++) {
    code += JOIN_CODE_ALPHABET[Math.floor(Math.random() * JOIN_CODE_ALPHABET.length)];
  }
  return code;
}

export function isValidJoinCodeFormat(code: string): boolean {
  return /^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{6}$/.test(code.toUpperCase());
}

export function clampText(value: unknown, maxLength: number): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (trimmed.length === 0 || trimmed.length > maxLength) return null;
  return trimmed;
}

export const DEFAULT_MATRIX_CONFIG = {
  axis_x_label: "Effort",
  axis_y_label: "Impact",
  quadrant_labels: {
    "1": "High Impact / Low Effort",
    "2": "High Impact / High Effort",
    "3": "Low Impact / Low Effort",
    "4": "Low Impact / High Effort",
  },
} as const;
