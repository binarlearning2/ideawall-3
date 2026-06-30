import { describe, it, expect, vi, beforeEach } from "vitest";
import { buildMockClient, type MockResult } from "./helpers/mock-supabase";

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(),
}));

import { createAdminClient } from "@/lib/supabase/admin";
import { POST } from "@/app/api/sections/[sectionId]/vote/route";

function makeRequest(body: unknown) {
  return new Request("http://localhost/api/sections/section-1/vote", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

const openSingleChoiceSection = {
  id: "section-1",
  type: "poll",
  board_id: "board-1",
  config: { question: "Q?", vote_type: "single", is_open: true },
  boards: { status: "active" },
};

const openMultiChoiceSection = {
  ...openSingleChoiceSection,
  config: { question: "Q?", vote_type: "multiple", is_open: true },
};

const optionFound: MockResult = { data: { id: "opt-a" }, error: null };

describe("POST /api/sections/[sectionId]/vote", () => {
  beforeEach(() => {
    vi.mocked(createAdminClient).mockReset();
  });

  it("mengembalikan 404 kalau section tidak ditemukan", async () => {
    vi.mocked(createAdminClient).mockReturnValue(
      buildMockClient({ fromResponses: [{ data: null, error: null }] }) as never
    );
    const response = await POST(makeRequest({ option_id: "opt-a", voter_session_id: "v1" }), {
      params: { sectionId: "section-1" },
    });
    expect(response.status).toBe(404);
  });

  it("menolak vote ke section yang bukan poll (400)", async () => {
    vi.mocked(createAdminClient).mockReturnValue(
      buildMockClient({
        fromResponses: [{ data: { ...openSingleChoiceSection, type: "wall" }, error: null }],
      }) as never
    );
    const response = await POST(makeRequest({ option_id: "opt-a", voter_session_id: "v1" }), {
      params: { sectionId: "section-1" },
    });
    expect(response.status).toBe(400);
  });

  it("menolak vote kalau poll sudah ditutup (403)", async () => {
    vi.mocked(createAdminClient).mockReturnValue(
      buildMockClient({
        fromResponses: [
          {
            data: { ...openSingleChoiceSection, config: { ...openSingleChoiceSection.config, is_open: false }, boards: { status: "active" } },
            error: null,
          },
        ],
      }) as never
    );
    const response = await POST(makeRequest({ option_id: "opt-a", voter_session_id: "v1" }), {
      params: { sectionId: "section-1" },
    });
    expect(response.status).toBe(403);
  });

  it("mengembalikan 404 kalau option_id tidak ditemukan di section ini", async () => {
    vi.mocked(createAdminClient).mockReturnValue(
      buildMockClient({
        fromResponses: [
          { data: openSingleChoiceSection, error: null },
          { data: null, error: null },
        ],
      }) as never
    );
    const response = await POST(makeRequest({ option_id: "opt-x", voter_session_id: "v1" }), {
      params: { sectionId: "section-1" },
    });
    expect(response.status).toBe(404);
  });

  it("single-choice: vote baru menggantikan vote lama (replace, bukan menambah)", async () => {
    const insertedVote = {
      id: "vote-1",
      board_id: "board-1",
      section_id: "section-1",
      option_id: "opt-a",
      voter_session_id: "v1",
      created_at: new Date().toISOString(),
    };

    vi.mocked(createAdminClient).mockReturnValue(
      buildMockClient({
        fromResponses: [
          { data: openSingleChoiceSection, error: null }, // section lookup
          optionFound, // option lookup
          { data: null, error: null }, // delete old vote(s)
          { data: insertedVote, error: null }, // insert new vote
        ],
      }) as never
    );

    const response = await POST(makeRequest({ option_id: "opt-a", voter_session_id: "v1" }), {
      params: { sectionId: "section-1" },
    });
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.action).toBe("voted");
    expect(data.vote.option_id).toBe("opt-a");
  });

  it("multiple-choice: toggle on saat belum pernah vote opsi ini", async () => {
    const insertedVote = {
      id: "vote-2",
      board_id: "board-1",
      section_id: "section-1",
      option_id: "opt-a",
      voter_session_id: "v2",
      created_at: new Date().toISOString(),
    };

    vi.mocked(createAdminClient).mockReturnValue(
      buildMockClient({
        fromResponses: [
          { data: openMultiChoiceSection, error: null }, // section lookup
          optionFound, // option lookup
          { data: null, error: null }, // existing vote check -> none
          { data: insertedVote, error: null }, // insert
        ],
      }) as never
    );

    const response = await POST(makeRequest({ option_id: "opt-a", voter_session_id: "v2" }), {
      params: { sectionId: "section-1" },
    });
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.action).toBe("voted");
  });

  it("multiple-choice: toggle off saat opsi yang sama divote lagi", async () => {
    vi.mocked(createAdminClient).mockReturnValue(
      buildMockClient({
        fromResponses: [
          { data: openMultiChoiceSection, error: null }, // section lookup
          optionFound, // option lookup
          { data: { id: "vote-existing" }, error: null }, // existing vote check -> found
          { data: null, error: null }, // delete
        ],
      }) as never
    );

    const response = await POST(makeRequest({ option_id: "opt-a", voter_session_id: "v3" }), {
      params: { sectionId: "section-1" },
    });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.action).toBe("unvoted");
  });
});
