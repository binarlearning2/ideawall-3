import { beforeEach, describe, expect, it } from "vitest";
import { addBoardParticipant, getBoardParticipantNames } from "../../lib/session";

describe("board participant join limit", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("allows up to 40 participants and rejects the 41st", () => {
    const boardId = "board-1";

    for (let index = 0; index < 40; index += 1) {
      const result = addBoardParticipant(boardId, `Student ${index + 1}`, 40);
      expect(result.ok).toBe(true);
    }

    const result = addBoardParticipant(boardId, "Student 41", 40);
    expect(result.ok).toBe(false);
    expect(result.error).toContain("40");
    expect(getBoardParticipantNames(boardId)).toHaveLength(40);
  });
});
