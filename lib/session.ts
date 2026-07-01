"use client";

/**
 * Each participant browser gets a random session_id per board, stored in localStorage
 * (PRD §6.2 step 3). This is used to identify "my own" sticky notes/votes for edit/delete
 * and anti-double-vote — it is NOT an auth mechanism, just a lightweight ownership token.
 */
function storageKey(boardId: string) {
  return `ideawall:session:${boardId}`;
}

function storageKeyName(boardId: string) {
  return `ideawall:name:${boardId}`;
}

function storageKeyParticipants(boardId: string) {
  return `ideawall:participants:${boardId}`;
}

export function getOrCreateSessionId(boardId: string): string {
  if (typeof window === "undefined") return "";
  const key = storageKey(boardId);
  let id = window.localStorage.getItem(key);
  if (!id) {
    id = crypto.randomUUID();
    window.localStorage.setItem(key, id);
  }
  return id;
}

export function getStoredName(boardId: string): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(storageKeyName(boardId));
}

export function setStoredName(boardId: string, name: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(storageKeyName(boardId), name);
}

export function hasJoined(boardId: string): boolean {
  return !!getStoredName(boardId);
}

export function getBoardParticipantNames(boardId: string): string[] {
  if (typeof window === "undefined") return [];

  const raw = window.localStorage.getItem(storageKeyParticipants(boardId));
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw) as string[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function addBoardParticipant(boardId: string, name: string, limit = 40) {
  if (typeof window === "undefined") {
    return { ok: false, error: "Window is not available" } as const;
  }

  const existing = getBoardParticipantNames(boardId);
  if (existing.length >= limit) {
    return { ok: false, error: `Board ini sudah penuh, maksimal ${limit} siswa.` } as const;
  }

  const next = [...existing, name];
  window.localStorage.setItem(storageKeyParticipants(boardId), JSON.stringify(next));
  return { ok: true, names: next } as const;
}
